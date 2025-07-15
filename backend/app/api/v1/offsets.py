"""
Offset API endpoints for managing emission offsets using retired carbon credits.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status

from ...core.security import get_current_user
from ...core.dependencies import get_emission_service, get_marketplace_service
from ...models.schemas import User, OffsetEmissionRequest, BulkOffsetEmissionRequest, OffsetEmissionResponse, OffsetStats, Emission
from ...services.emission_service import EmissionService
from ...services.marketplace_service import MarketplaceService

router = APIRouter(prefix="/offsets", tags=["offsets"])


@router.post("/emissions", response_model=OffsetEmissionResponse)
async def offset_emissions(
    offset_request: OffsetEmissionRequest,
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service),
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
):
    """Offset specific emissions using retired carbon credits."""
    try:
        # Verify the purchase belongs to the user and has enough retired credits
        purchase = await marketplace_service.get_purchase_by_id(offset_request.purchase_id, current_user.id)
        if not purchase:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase not found")
        
        # Check if there are enough available credits to offset the emissions
        available_for_offset = purchase.quantity - purchase.retired_quantity
        if available_for_offset < offset_request.total_offset_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Insufficient available credits. Available: {available_for_offset} tons, Requested: {offset_request.total_offset_amount} tons"
            )
        
        # Offset the emissions
        offset_emissions = await emission_service.offset_emissions(
            user_id=current_user.id,
            emission_ids=offset_request.emission_ids,
            purchase_id=offset_request.purchase_id,
            total_offset_amount=offset_request.total_offset_amount
        )
        
        return OffsetEmissionResponse(
            message=f"Successfully offset {len(offset_emissions)} emissions totaling {offset_request.total_offset_amount} tons CO2e",
            offset_emissions=offset_emissions,
            remaining_credit_amount=available_for_offset - offset_request.total_offset_amount,
            total_offset_amount=offset_request.total_offset_amount
        )
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to offset emissions")


@router.post("/emissions/bulk", response_model=OffsetEmissionResponse)
async def bulk_offset_emissions(
    offset_request: BulkOffsetEmissionRequest,
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service),
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
):
    """Offset specific emissions using multiple credit purchases in a single transaction."""
    try:
        # Basic validation
        if not offset_request.emission_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No emissions selected")
        
        if not offset_request.credit_allocations:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No credit allocations provided")
        
        total_offset_amount = 0.0
        validated_allocations = []
        
        # Verify all purchases belong to the user and have enough credits
        for allocation in offset_request.credit_allocations:
            purchase = await marketplace_service.get_purchase_by_id(allocation.purchase_id, current_user.id)
            if not purchase:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Purchase {allocation.purchase_id} not found")
            
            # Check if there are enough available credits
            available_for_offset = purchase.quantity - purchase.retired_quantity
            if available_for_offset < allocation.amount:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"Insufficient available credits in purchase {allocation.purchase_id}. Available: {available_for_offset} credits, Requested: {allocation.amount} credits"
                )
            
            validated_allocations.append({
                "purchase_id": allocation.purchase_id,
                "amount": allocation.amount
            })
            total_offset_amount += allocation.amount
        
        # Offset the emissions
        offset_emissions = await emission_service.bulk_offset_emissions(
            user_id=current_user.id,
            emission_ids=offset_request.emission_ids,
            credit_allocations=validated_allocations
        )
        
        # Update retirement quantities for all purchases
        for allocation in validated_allocations:
            await marketplace_service.update_retirement_quantity(
                purchase_id=allocation["purchase_id"],
                additional_retired=allocation["amount"]
            )
        
        return OffsetEmissionResponse(
            message=f"Successfully offset {len(offset_emissions)} emissions totaling {total_offset_amount} credits CO₂e using {len(validated_allocations)} credit purchase(s)",
            offset_emissions=offset_emissions,
            remaining_credit_amount=0,  # This would need calculation across all purchases
            total_offset_amount=total_offset_amount
        )
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Error in bulk_offset_emissions: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to offset emissions")


@router.get("/stats", response_model=OffsetStats)
async def get_offset_stats(
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service),
):
    """Get offset statistics for the current user."""
    try:
        return await emission_service.get_offset_stats(user_id=current_user.id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve offset stats")


@router.get("/available-emissions", response_model=List[Emission])
async def get_available_emissions_for_offset(
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service),
):
    """Get emissions that are available for offsetting (not yet offset)."""
    try:
        return await emission_service.get_emissions_for_offset(user_id=current_user.id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve available emissions")


@router.get("/offset-history", response_model=List[Emission])
async def get_offset_history(
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service),
):
    """Get history of offset emissions."""
    try:
        return await emission_service.get_offset_history(user_id=current_user.id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve offset history")
