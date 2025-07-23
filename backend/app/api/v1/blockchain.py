"""
Blockchain API endpoints for Web3 interactions.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, Dict
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, timedelta
import logging

from ...core.security import get_current_user
from ...core.dependencies import get_seller_service, get_marketplace_service
from ...models.schemas import User, SellerCreditCreate
from ...services.blockchain_service import BlockchainService
from ...services.seller_service import SellerService
from ...services.marketplace_service import MarketplaceService

router = APIRouter(prefix="/blockchain", tags=["blockchain"])
logger = logging.getLogger(__name__)

class MintCreditsRequest(BaseModel):
    project_id: UUID  # Carbon project ID
    amount: float
    wallet_address: str
    vintage_year: int = 2024
    price_per_ton: float = 25.0
    seller_credit_id: Optional[UUID] = None  # Optional: for updating existing seller credit

class PurchaseCreditsRequest(BaseModel):
    project_id: UUID
    quantity: float
    wallet_address: str
    tx_hash: Optional[str] = None

class RetireCreditsRequest(BaseModel):
    amount: float
    reason: str
    wallet_address: str
    private_key: str

@router.post("/mint-credits")
async def mint_credits(
    request: MintCreditsRequest,
    current_user: User = Depends(get_current_user),
    seller_service: SellerService = Depends(get_seller_service)
):
    """Mint carbon credits to a wallet address (sellers only)."""
    if current_user.type != 'seller':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can mint credits"
        )
    
    blockchain_service = BlockchainService()
    
    # STRICT blockchain check - no fallback to database-only operations
    if not blockchain_service.is_connected():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Blockchain network not available. Cannot mint credits without blockchain connection."
        )
    
    # Get project details and use them for minting
    project_id_str = str(request.project_id)
    vintage = str(request.vintage_year)
    standard = "VCS"   # Could be fetched from project data
    
    # Attempt blockchain minting - this must succeed
    try:
        tx_hash = blockchain_service.mint_carbon_credits(
            to_address=request.wallet_address,
            amount=request.amount,
            project_id=project_id_str,
            vintage=vintage,
            standard=standard,
            price=request.price_per_ton
        )
    except Exception as e:
        logger.error(f"Blockchain minting failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Blockchain minting failed: {str(e)}"
        )
    
    if not tx_hash:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mint credits on blockchain - no transaction hash returned"
        )
    
    # Update existing seller credit record with blockchain information
    try:
        updated_existing = False
        
        # Check if seller_credit_id is provided for updating existing credit
        if request.seller_credit_id:
            existing_credit_response = await seller_service.get_seller_credit_by_id(request.seller_credit_id)
            
            if existing_credit_response:
                # Update existing seller credit with blockchain info
                updated_credit = await seller_service.update_seller_credit_blockchain_info(
                    seller_credit_id=request.seller_credit_id,
                    blockchain_tx_hash=tx_hash,
                    blockchain_token_id=None  # Could extract from blockchain service if available
                )
                
                if updated_credit:
                    logger.info(f"Updated existing seller credit {request.seller_credit_id} with blockchain info")
                    return {
                        "success": True,
                        "transaction_hash": tx_hash,
                        "amount": request.amount,
                        "project_id": project_id_str,
                        "seller_credit_id": str(updated_credit.id),
                        "status": "available",
                        "updated_existing": True
                    }
                else:
                    logger.error(f"Failed to update existing seller credit {request.seller_credit_id}")
                    # Continue to create new record as fallback
        
        # Create new seller credit record if no seller_credit_id provided or update failed
        seller_credit_data = SellerCreditCreate(
            project_id=request.project_id,
            vintage_year=request.vintage_year,
            quantity=request.amount,
            price_per_ton=request.price_per_ton,
            blockchain_token_id=None,
            blockchain_tx_hash=tx_hash,
            metadata_uri=None
        )
        
        seller_credit = await seller_service.create_credit_listing(current_user.id, seller_credit_data)
        
        return {
            "success": True,
            "transaction_hash": tx_hash,
            "amount": request.amount,
            "project_id": project_id_str,
            "seller_credit_id": str(seller_credit.id),
            "status": "available",
            "updated_existing": False
        }
        
    except Exception as e:
        # Log the error but don't fail the request since blockchain mint succeeded
        logger.error(f"Failed to create/update seller credit record: {str(e)}")
        
        return {
            "success": True,
            "transaction_hash": tx_hash,
            "amount": request.amount,
            "project_id": project_id_str,
            "warning": "Credits minted on blockchain but database record creation/update failed"
        }

@router.post("/purchase-credits")
async def purchase_credits(
    request: PurchaseCreditsRequest,
    current_user: User = Depends(get_current_user),
    seller_service: SellerService = Depends(get_seller_service)
):
    """Purchase carbon credits from marketplace with blockchain validation and database updates."""
    try:
        # 1. Get seller credit details first
        seller_credit = await seller_service.get_seller_credit_by_id(request.project_id)
        if not seller_credit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seller credit not found"
            )
        
        # 2. Check available quantity
        available_quantity = seller_credit.quantity - seller_credit.sold_quantity
        if available_quantity < request.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient quantity available. Available: {available_quantity}, Requested: {request.quantity}"
            )
        
        # 3. Calculate total cost
        total_cost = seller_credit.price_per_ton * request.quantity
        
        # 4. BLOCKCHAIN FIRST - Mandatory blockchain transaction (no fallback)
        blockchain_service = BlockchainService()
        
        if not blockchain_service.is_connected():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Blockchain network not available - transaction cannot proceed"
            )
        
        # If tx_hash is provided, validate it; otherwise mint new credits
        if request.tx_hash:
            tx_valid = blockchain_service.validate_transaction(
                user_address=request.wallet_address,
                amount=request.quantity,
                tx_hash=request.tx_hash
            )
            
            if not tx_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid blockchain transaction"
                )
            blockchain_tx_hash = request.tx_hash
            logger.info(f"Blockchain validation successful: {blockchain_tx_hash}")
        else:
            # Mint new credits
            blockchain_tx_hash = blockchain_service.mint_carbon_credits(
                to_address=request.wallet_address,
                amount=request.quantity,
                project_id=str(request.project_id),
                vintage=str(seller_credit.vintage_year),
                standard="VCS",  # Could be fetched from project
                price=seller_credit.price_per_ton
            )
            
            if not blockchain_tx_hash:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Blockchain minting failed - transaction cannot proceed"
                )
            logger.info(f"Blockchain minting successful: {blockchain_tx_hash}")
        
        # 5. DATABASE OPERATIONS - Only after successful blockchain transaction
        db = seller_service.db
        logger.info("Starting database operations after successful blockchain transaction...")
        
        # Create purchase record in carbon_credit_purchases
        purchase_data = {
            "user_id": str(current_user.id),
            "credit_id": str(request.project_id),  # This is seller_credit.id
            "quantity": request.quantity,
            "price_per_ton": seller_credit.price_per_ton,
            "total_cost": total_cost,
            "status": "completed",
            "retired_quantity": 0.0,
            "blockchain_tx_hash": blockchain_tx_hash
        }
        
        logger.info(f"Creating purchase record with data: {purchase_data}")
        purchase_response = db.table("carbon_credit_purchases").insert(purchase_data).execute()
        
        if not purchase_response.data:
            logger.error("Purchase response data is empty")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create purchase record"
            )
        
        purchase_id = purchase_response.data[0]['id']
        logger.info(f"Purchase record created with ID: {purchase_id}")
        
        # Create sale transaction for the seller
        sale_data = {
            "seller_credit_id": str(request.project_id),
            "buyer_id": str(current_user.id),
            "quantity": request.quantity,
            "price_per_ton": seller_credit.price_per_ton,
            "total_amount": total_cost,
            "blockchain_tx_hash": blockchain_tx_hash,
            "status": "completed"
        }
        
        logger.info(f"Creating sale transaction with data: {sale_data}")
        sale_response = db.table("sale_transactions").insert(sale_data).execute()
        
        if not sale_response.data:
            logger.error("Sale response data is empty")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create sale transaction"
            )
        
        sale_id = sale_response.data[0]['id']
        logger.info(f"Sale transaction created with ID: {sale_id}")
        
        # Update seller_credits: keep original quantity, only update sold_quantity
        # The quantity field should remain the original total amount
        # Only sold_quantity should increase
        original_quantity = seller_credit.quantity  # Keep original quantity
        new_sold_quantity = seller_credit.sold_quantity + request.quantity
        logger.info(f"Updating seller credit: quantity remains {original_quantity}, sold_quantity {seller_credit.sold_quantity} -> {new_sold_quantity}")
        
        # Use SQL function to update quantities (bypasses RLS)
        try:
            sql_response = db.rpc('update_seller_credit_quantities', {
                'credit_id': str(request.project_id),
                'new_quantity': float(original_quantity),
                'new_sold_quantity': float(new_sold_quantity)
            }).execute()
            logger.info(f"SQL RPC response: {sql_response}")
            
            # Verify the update by fetching the updated record
            verification_response = db.table("seller_credits").select("id, quantity, sold_quantity").eq("id", str(request.project_id)).execute()
            
            if verification_response.data:
                updated_record = verification_response.data[0]
                logger.info(f"Verification - Updated record: id={updated_record['id']}, quantity={updated_record['quantity']}, sold_quantity={updated_record['sold_quantity']}")
                
                # Check if the update actually took effect
                if updated_record['quantity'] == original_quantity and updated_record['sold_quantity'] == new_sold_quantity:
                    logger.info("Update verification successful - quantities match expected values")
                else:
                    logger.error(f"Update verification failed! Expected: quantity={original_quantity}, sold_quantity={new_sold_quantity}")
                    logger.error(f"Actual: quantity={updated_record['quantity']}, sold_quantity={updated_record['sold_quantity']}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Seller credit update verification failed"
                    )
            else:
                logger.error("Could not verify update - seller credit not found")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Could not verify seller credit update"
                )
                
        except Exception as rpc_error:
            logger.error(f"SQL RPC update failed: {str(rpc_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Seller credit update failed: {str(rpc_error)}"
            )
        
        logger.info(f"All database operations completed successfully")
        logger.info(f"Purchase ID: {purchase_id}, Sale ID: {sale_id}")
        
        # Return successful response
        return {
            "success": True,
            "message": "Credits purchased successfully",
            "purchase_id": purchase_id,
            "sale_id": sale_id,
            "quantity": request.quantity,
            "total_cost": total_cost,
            "seller_id": seller_credit.seller_id,
            "blockchain_tx_hash": blockchain_tx_hash,
            "blockchain_enabled": True,
            "blockchain_minted": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Purchase credits error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Purchase failed: {str(e)}"
        )

@router.post("/retire-credits")
async def retire_credits(
    request: RetireCreditsRequest,
    current_user: User = Depends(get_current_user),
    marketplace_service: MarketplaceService = Depends(get_marketplace_service)
):
    """Retire carbon credits with blockchain recording and database updates."""
    try:
        blockchain_service = BlockchainService()
        blockchain_available = blockchain_service.is_connected()
        
        # 1. First update the database to mark credits as retired
        # Note: request.amount should be purchase_id, request.reason should be quantity
        # The endpoint needs to be updated to match the correct schema
        
        # For now, let's assume we have the correct fields
        # This should match the RetireCreditsRequest in marketplace
        from ...models.schemas import RetireCreditsRequest as MarketplaceRetireRequest
        
        # Convert blockchain retire request to marketplace retire request
        # This is a temporary solution - ideally the frontend should send the right format
        retire_data = MarketplaceRetireRequest(
            purchase_id=UUID(str(request.wallet_address)),  # Temporary - needs proper purchase_id
            quantity=request.amount
        )
        
        # Update database first
        updated_purchase = await marketplace_service.retire_credits(
            user_id=current_user.id,
            retire_data=retire_data
        )
        
        # 2. Record retirement on blockchain for transparency
        blockchain_tx_hash = None
        if blockchain_available:
            try:
                blockchain_tx_hash = blockchain_service.retire_carbon_credits(
                    from_address=request.wallet_address,
                    private_key=request.private_key,
                    amount=request.amount,
                    reason=request.reason
                )
                
                if blockchain_tx_hash:
                    logger.info(f"Credits retired on blockchain: {blockchain_tx_hash}")
                else:
                    logger.warning("Failed to retire on blockchain, but database retirement completed")
                    
            except Exception as e:
                logger.warning(f"Blockchain retirement failed but database retirement succeeded: {str(e)}")
        
        return {
            "success": True,
            "message": "Credits retired successfully",
            "purchase_id": updated_purchase.id,
            "retired_quantity": request.amount,
            "total_retired": updated_purchase.retired_quantity,
            "blockchain_tx": blockchain_tx_hash,
            "blockchain_enabled": blockchain_available,
            "blockchain_retired": blockchain_tx_hash is not None,
            "reason": request.reason
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Retire credits error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retirement failed: {str(e)}"
        )

@router.get("/status")
async def blockchain_status():
    """Get blockchain network status."""
    blockchain_service = BlockchainService()
    
    return {
        "connected": blockchain_service.is_connected(),
        "contracts": blockchain_service.contract_addresses
    }
