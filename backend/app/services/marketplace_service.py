"""
Marketplace service for carbon credit operations.
"""
from typing import List, Optional
from uuid import UUID
from supabase import Client
from fastapi import HTTPException, status
import logging

from ..models.schemas import CarbonCredit, CarbonCreditPurchase, CarbonCreditPurchaseCreate, MarketplaceStats, RetireCreditsRequest, PurchaseStatus

logger = logging.getLogger(__name__)

class MarketplaceService:
    def __init__(self, db: Client):
        self.db = db

    async def get_available_credits(
        self,
        skip: int = 0,
        limit: int = 20,
        project_type: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None
    ) -> List[CarbonCredit]:
        """Get available carbon credits from seller listings."""
        try:
            # Query seller_credits with project information
            query = self.db.table("seller_credits").select(
                "*, carbon_projects(*)"
            ).eq("status", "available")
            
            # Filter by project type if specified
            if project_type:
                query = query.eq("carbon_projects.project_type", project_type)
            
            # Apply price filters
            if min_price is not None:
                query = query.gte("price_per_ton", min_price)
            if max_price is not None:
                query = query.lte("price_per_ton", max_price)
            
            response = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
            
            credits = []
            for seller_credit in response.data:
                project = seller_credit.get('carbon_projects')
                if not project:
                    continue
                
                # Calculate available quantity (quantity - sold_quantity)
                available_quantity = float(seller_credit['quantity']) - float(seller_credit.get('sold_quantity', 0))
                
                # Skip if no quantity available
                if available_quantity <= 0:
                    continue
                
                # Convert to CarbonCredit format for marketplace display
                # Send quantity field as available_quantity to frontend (user's request)
                credit_data = {
                    'id': seller_credit['id'],  # Use seller_credit.id as the credit_id
                    'project_name': project['name'],
                    'description': project['description'],
                    'project_type': project['project_type'],
                    'project_location': f"{project['location']}, {project['country']}",
                    'verification_standard': project['standard'],
                    'vintage_year': seller_credit['vintage_year'],
                    'total_quantity': float(seller_credit['quantity']),
                    'available_quantity': float(seller_credit['quantity']),  # Send quantity field to frontend
                    'price_per_ton': float(seller_credit['price_per_ton']),
                    'status': 'available',
                    'created_at': seller_credit['created_at'],
                    'updated_at': seller_credit['updated_at']
                }
                
                credits.append(CarbonCredit.model_validate(credit_data))
            
            return credits
            
        except Exception as e:
            logger.error(f"Error getting available credits: {str(e)}")
            return []

    async def get_credit_by_id(self, credit_id: UUID) -> Optional[CarbonCredit]:
        """Get a specific seller credit by ID (displayed as credit in marketplace)."""
        try:
            response = self.db.table("seller_credits").select(
                "*, carbon_projects(*)"
            ).eq("id", str(credit_id)).single().execute()
            
            if response.data:
                seller_credit = response.data
                project = seller_credit.get('carbon_projects')
                
                if not project:
                    return None
                
                # Calculate available quantity
                available_quantity = float(seller_credit['quantity']) - float(seller_credit.get('sold_quantity', 0))
                
                # Convert to CarbonCredit format
                credit_data = {
                    'id': seller_credit['id'],
                    'project_name': project['name'],
                    'description': project['description'],
                    'project_type': project['project_type'],
                    'project_location': f"{project['location']}, {project['country']}",
                    'verification_standard': project['standard'],
                    'vintage_year': seller_credit['vintage_year'],
                    'total_quantity': float(seller_credit['quantity']),
                    'available_quantity': available_quantity,
                    'price_per_ton': float(seller_credit['price_per_ton']),
                    'status': 'available' if available_quantity > 0 else 'sold_out',
                    'created_at': seller_credit['created_at'],
                    'updated_at': seller_credit['updated_at']
                }
                return CarbonCredit.model_validate(credit_data)
            return None
            
        except Exception as e:
            logger.error(f"Error getting credit by ID: {str(e)}")
            return None

    async def purchase_credits(self, user_id: UUID, purchase_data: CarbonCreditPurchaseCreate) -> CarbonCreditPurchase:
        """Purchase carbon credits from seller listings using database operations."""
        try:
            # Get seller credit details (purchase_data.credit_id refers to seller_credit.id)
            seller_credit_response = self.db.table("seller_credits").select(
                "*, carbon_projects(*)"
            ).eq("id", str(purchase_data.credit_id)).single().execute()
            
            if not seller_credit_response.data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seller credit not found")
            
            seller_credit = seller_credit_response.data
            project = seller_credit.get('carbon_projects')
            
            if not project:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated project not found")
            
            # Check if seller credit is available
            if seller_credit['status'] != 'available':
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Credit listing is not available")
            
            # Calculate actual available quantity
            available_quantity = float(seller_credit['quantity']) - float(seller_credit.get('sold_quantity', 0))
            
            # Check if sufficient quantity is available
            if available_quantity < purchase_data.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"Insufficient quantity available. Available: {available_quantity}, Requested: {purchase_data.quantity}"
                )
            
            # Calculate costs
            price_per_ton = float(seller_credit['price_per_ton'])
            total_cost = price_per_ton * purchase_data.quantity
            
            # First, attempt blockchain transaction before creating database records
            blockchain_success = False
            blockchain_tx_hash = None
            
            try:
                from .blockchain_service import BlockchainService
                blockchain_service = BlockchainService()
                
                if not blockchain_service.is_connected():
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Blockchain service is not available. Please try again later."
                    )
                
                # For marketplace purchases, mint credits to user's address if available
                # TODO: Get user's wallet address from user profile when wallet integration is complete
                # For now, mint to admin address and track ownership in database
                user_address = blockchain_service.admin_account.address  # Temporary fallback
                
                blockchain_tx_hash = blockchain_service.mint_carbon_credits(
                    to_address=user_address,
                    amount=purchase_data.quantity,
                    project_id=str(project['id']),
                    vintage=str(seller_credit['vintage_year']),
                    standard=project.get('standard', 'VCS'),
                    price=price_per_ton
                )
                
                if not blockchain_tx_hash:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Blockchain transaction failed. Please try again later."
                    )
                
                blockchain_success = True
                    
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Blockchain transaction failed: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Blockchain transaction failed: {str(e)}"
                )
            
            # Only create database records after successful blockchain transaction
            purchase_data_dict = {
                "user_id": str(user_id),
                "credit_id": str(purchase_data.credit_id),  # This is seller_credit.id
                "quantity": purchase_data.quantity,
                "price_per_ton": price_per_ton,
                "total_cost": total_cost,
                "status": "completed",
                "retired_quantity": 0.0,
                "blockchain_tx_hash": blockchain_tx_hash
            }
            
            # Verify the seller credit exists before attempting purchase
            verify_response = self.db.table("seller_credits").select("id").eq("id", str(purchase_data.credit_id)).execute()
            if not verify_response.data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Seller credit {purchase_data.credit_id} not found in seller_credits table")
            
            purchase_response = self.db.table("carbon_credit_purchases").insert(purchase_data_dict).execute()
            
            if not purchase_response.data:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create purchase record")
            
            purchase_id = purchase_response.data[0]['id']
            
            # Create sale transaction for the seller (still references seller_credit)
            sale_data = {
                "seller_credit_id": str(purchase_data.credit_id),  # Original seller_credit.id
                "buyer_id": str(user_id),
                "quantity": purchase_data.quantity,
                "price_per_ton": price_per_ton,
                "total_amount": total_cost,
                "status": "completed"
            }
            
            sale_response = self.db.table("sale_transactions").insert(sale_data).execute()
            
            if not sale_response.data:
                # Rollback purchase if sale creation fails
                self.db.table("carbon_credit_purchases").delete().eq("id", purchase_id).execute()
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create sale transaction")
            
            # Update seller_credits sold_quantity
            new_sold_quantity = float(seller_credit.get('sold_quantity', 0)) + purchase_data.quantity
            update_response = self.db.table("seller_credits").update({
                "sold_quantity": new_sold_quantity
            }).eq("id", str(purchase_data.credit_id)).execute()
            
            if not update_response.data:
                # Rollback both purchase and sale if update fails
                self.db.table("carbon_credit_purchases").delete().eq("id", purchase_id).execute()
                self.db.table("sale_transactions").delete().eq("id", sale_response.data[0]['id']).execute()
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update seller credit inventory")
            
            return CarbonCreditPurchase.model_validate(purchase_response.data[0])
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Purchase failed: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Purchase failed: {str(e)}")

    async def get_user_purchases(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[CarbonCreditPurchase]:
        """Get all purchases for a user with pagination."""
        response = self.db.table("carbon_credit_purchases").select(
            "*, credit:seller_credits(*, carbon_projects(*))"
        ).eq("user_id", str(user_id)).order("purchase_date", desc=True).range(skip, skip + limit - 1).execute()
        
        return [CarbonCreditPurchase.model_validate(purchase) for purchase in response.data]

    async def retire_credits(self, user_id: UUID, retire_data: RetireCreditsRequest) -> CarbonCreditPurchase:
        """Retire carbon credits using direct table operations."""
        try:
            # Get purchase details
            purchase_response = self.db.table("carbon_credit_purchases").select("*").eq("id", str(retire_data.purchase_id)).eq("user_id", str(user_id)).single().execute()
            
            if not purchase_response.data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase not found or does not belong to user")
            
            purchase = purchase_response.data
            current_retired = float(purchase['retired_quantity'])
            total_quantity = float(purchase['quantity'])
            
            # Calculate available quantity to retire
            available_to_retire = total_quantity - current_retired
            
            # Check if sufficient quantity is available to retire
            if available_to_retire < retire_data.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient quantity available to retire. Available: {available_to_retire}, Requested: {retire_data.quantity}"
                )
            
            # Update retired quantity (status remains 'completed')
            new_retired_quantity = current_retired + retire_data.quantity
            
            update_response = self.db.table("carbon_credit_purchases").update({
                "retired_quantity": new_retired_quantity
            }).eq("id", str(retire_data.purchase_id)).execute()
            
            if not update_response.data:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update retirement record")
            
            return CarbonCreditPurchase.model_validate(update_response.data[0])
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Retirement failed: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Retirement failed: {str(e)}")

    async def get_marketplace_stats(self, user_id: UUID) -> MarketplaceStats:
        """Get marketplace statistics for a user."""
        # This can be further optimized with a dedicated DB function if it gets slow
        purchases = await self.get_user_purchases(user_id, 0, 10000) # Get all purchases

        total_purchased = sum(p.quantity for p in purchases)
        total_retired = sum(p.retired_quantity for p in purchases)
        total_spent = sum(p.total_cost for p in purchases)
        
        return MarketplaceStats(
            total_credits_purchased=total_purchased,
            total_credits_retired=total_retired,
            total_credits_available_for_retirement=total_purchased - total_retired,
            total_investment=total_spent,
            average_price_per_ton=total_spent / total_purchased if total_purchased > 0 else 0,
            number_of_purchases=len(purchases)
        )

    async def get_purchase_by_id(self, purchase_id: UUID, user_id: UUID) -> Optional[CarbonCreditPurchase]:
        """Get a specific purchase by ID for a user."""
        try:
            response = self.db.table("carbon_credit_purchases").select(
                "*, credit:seller_credits(*, carbon_projects(*))"
            ).eq("id", str(purchase_id)).eq("user_id", str(user_id)).execute()
            
            if not response.data:
                return None
                
            return CarbonCreditPurchase.model_validate(response.data[0])
            
        except Exception as e:
            logger.error(f"Error in get_purchase_by_id: {e}")
            return None
        
    async def update_retirement_quantity(self, purchase_id: UUID, additional_retired: float) -> bool:
        """Update the retired quantity for a carbon credit purchase."""
        try:
            # First, get the current purchase to calculate new retired quantity
            response = self.db.table("carbon_credit_purchases").select("*") \
                .eq("id", str(purchase_id)).execute()
            
            if not response.data:
                raise ValueError(f"Purchase {purchase_id} not found")
            
            current_purchase = response.data[0]
            current_retired = float(current_purchase.get('retired_quantity', 0))
            new_retired_quantity = current_retired + additional_retired
            
            # Validate that we don't exceed the total purchased quantity
            total_quantity = float(current_purchase['quantity'])
            if new_retired_quantity > total_quantity:
                raise ValueError(f"Cannot retire {additional_retired} credits. Only {total_quantity - current_retired} credits available for retirement")
            
            # Update the purchase with new retired quantity
            update_result = self.db.table("carbon_credit_purchases").update({
                "retired_quantity": new_retired_quantity
            }).eq("id", str(purchase_id)).execute()
            
            return bool(update_result.data)
            
        except Exception as e:
            logger.error(f"Error in update_retirement_quantity: {e}")
            raise
