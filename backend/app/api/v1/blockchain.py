"""
Blockchain API endpoints for Web3 interactions.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from pydantic import BaseModel
from uuid import UUID

from ...core.security import get_current_user
from ...models.schemas import User
from ...services.blockchain_service import BlockchainService

router = APIRouter(prefix="/blockchain", tags=["blockchain"])

class MintCreditsRequest(BaseModel):
    project_id: UUID
    amount: float
    wallet_address: str

class PurchaseCreditsRequest(BaseModel):
    project_id: UUID
    quantity: float
    wallet_address: str

class RetireCreditsRequest(BaseModel):
    amount: float
    reason: str
    wallet_address: str
    private_key: str

class WalletBalanceResponse(BaseModel):
    address: str
    balance: float
    is_connected: bool

@router.post("/mint-credits")
async def mint_credits(
    request: MintCreditsRequest,
    current_user: User = Depends(get_current_user)
):
    """Mint carbon credits to a wallet address (sellers only)."""
    if current_user.type != 'seller':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can mint credits"
        )
    
    blockchain_service = BlockchainService()
    
    if not blockchain_service.is_connected():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Blockchain network not available"
        )
    
    # Get project details and use them for minting
    project_id_str = str(request.project_id)
    vintage = "2024"  # Could be fetched from project data
    standard = "VCS"   # Could be fetched from project data
    price = 25.0       # Could be dynamic based on project
    
    tx_hash = blockchain_service.mint_carbon_credits(
        to_address=request.wallet_address,
        amount=request.amount,
        project_id=project_id_str,
        vintage=vintage,
        standard=standard,
        price=price
    )
    
    if not tx_hash:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mint credits on blockchain"
        )
    
    return {
        "success": True,
        "transaction_hash": tx_hash,
        "amount": request.amount,
        "project_id": project_id_str
    }

@router.post("/purchase-credits")
async def purchase_credits(
    request: PurchaseCreditsRequest,
    current_user: User = Depends(get_current_user)
):
    """Purchase carbon credits via blockchain (buyers only)."""
    if current_user.type != 'buyer':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only buyers can purchase credits"
        )
    
    blockchain_service = BlockchainService()
    
    if not blockchain_service.is_connected():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Blockchain network not available"
        )
    
    # Get project details
    project_id_str = str(request.project_id)
    
    # This should:
    # 1. Transfer payment (simulated for now)
    # 2. Mint tokens to buyer's wallet
    # 3. Record purchase in database
    tx_hash = blockchain_service.mint_carbon_credits(
        to_address=request.wallet_address,
        amount=request.quantity,
        project_id=project_id_str,
        vintage="2024",  # Could be fetched from project
        standard="VCS",   # Could be fetched from project
        price=25.0        # Could be dynamic pricing
    )
    
    if not tx_hash:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to purchase credits on blockchain"
        )
    
    return {
        "success": True,
        "transaction_hash": tx_hash,
        "quantity": request.quantity,
        "project_id": project_id_str
    }

@router.post("/retire-credits")
async def retire_credits(
    request: RetireCreditsRequest,
    current_user: User = Depends(get_current_user)
):
    """Retire carbon credits from a wallet."""
    blockchain_service = BlockchainService()
    
    if not blockchain_service.is_connected():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Blockchain network not available"
        )
    
    tx_hash = blockchain_service.retire_carbon_credits(
        from_address=request.wallet_address,
        private_key=request.private_key,
        amount=request.amount,
        reason=request.reason
    )
    
    if not tx_hash:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retire credits on blockchain"
        )
    
    return {
        "success": True,
        "transaction_hash": tx_hash,
        "amount": request.amount,
        "reason": request.reason
    }

@router.get("/balance/{wallet_address}", response_model=WalletBalanceResponse)
async def get_wallet_balance(
    wallet_address: str,
    current_user: User = Depends(get_current_user)
):
    """Get carbon credit balance for a wallet address."""
    blockchain_service = BlockchainService()
    
    is_connected = blockchain_service.is_connected()
    balance = blockchain_service.get_balance(wallet_address) if is_connected else 0.0
    
    return WalletBalanceResponse(
        address=wallet_address,
        balance=balance,
        is_connected=is_connected
    )

@router.get("/status")
async def blockchain_status():
    """Get blockchain network status."""
    blockchain_service = BlockchainService()
    
    return {
        "connected": blockchain_service.is_connected(),
        "contracts": blockchain_service.contract_addresses
    }
