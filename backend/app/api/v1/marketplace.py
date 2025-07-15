"""
Marketplace API endpoints for carbon credit operations.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status

from ...core.security import get_current_user
from ...core.dependencies import get_marketplace_service
from ...models.schemas import CarbonCredit, CarbonCreditPurchase, CarbonCreditPurchaseCreate, User, RetireCreditsRequest, MarketplaceStats
from ...services.marketplace_service import MarketplaceService

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


@router.get("/credits", response_model=List[CarbonCredit])
async def get_available_credits(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    project_type: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
):
    """Get available carbon credits with optional filtering and pagination."""
    return await marketplace_service.get_available_credits(
        skip=skip,
        limit=limit,
        project_type=project_type,
        min_price=min_price,
        max_price=max_price
    )


@router.get("/credits/{credit_id}", response_model=CarbonCredit)
async def get_credit_details(
    credit_id: UUID,
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
):
    """Get detailed information about a specific carbon credit."""
    credit = await marketplace_service.get_credit_by_id(credit_id)
    if not credit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon credit not found")
    return credit


@router.post("/purchase", response_model=CarbonCreditPurchase, status_code=status.HTTP_201_CREATED)
async def purchase_credits(
    purchase_data: CarbonCreditPurchaseCreate,
    current_user: User = Depends(get_current_user),
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
):
    """Purchase carbon credits."""
    return await marketplace_service.purchase_credits(
        user_id=current_user.id,
        purchase_data=purchase_data
    )


@router.get("/purchases", response_model=List[CarbonCreditPurchase])
async def get_user_purchases(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    current_user: User = Depends(get_current_user),
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
):
    """Get all carbon credit purchases for the current user with pagination."""
    return await marketplace_service.get_user_purchases(
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )


@router.post("/retire", response_model=CarbonCreditPurchase)
async def retire_credits(
    retire_data: RetireCreditsRequest,
    current_user: User = Depends(get_current_user),
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
):
    """Retire a specified quantity of purchased carbon credits."""
    return await marketplace_service.retire_credits(
        user_id=current_user.id,
        retire_data=retire_data
    )


@router.get("/stats", response_model=MarketplaceStats)
async def get_marketplace_stats(
    current_user: User = Depends(get_current_user),
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
):
    """Get marketplace statistics for the current user."""
    return await marketplace_service.get_marketplace_stats(user_id=current_user.id)
