"""
Emissions API endpoints for tracking carbon emissions.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from uuid import UUID

from ...core.security import get_current_user
from ...core.dependencies import get_emission_service
from ...models.schemas import EmissionCreate, Emission, EmissionSummary, User, MonthlyTrend
from ...services.emission_service import EmissionService

router = APIRouter(prefix="/emissions", tags=["emissions"])


@router.post("/", response_model=Emission, status_code=status.HTTP_201_CREATED)
async def create_emission(
    emission_create: EmissionCreate,
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service)
):
    """Create a new emission activity"""
    try:
        emission = await emission_service.create_emission(
            user_id=current_user.id,
            emission_data=emission_create
        )
        return emission
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create emission.")


@router.get("/", response_model=List[Emission])
async def get_emissions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    category: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    filter_by_created_at: bool = Query(False, description="Filter by created_at instead of activity date to show recently added emissions"),
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service)
):
    """Get emissions for current user with optional filtering and pagination"""
    # Set default date range if not provided
    if not end_date:
        end_date = datetime.now(timezone.utc)
    if not start_date:
        start_date = end_date - timedelta(days=90)

    try:
        return await emission_service.get_user_emissions(
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date,
            category=category,
            skip=skip,
            limit=limit,
            filter_by_created_at=filter_by_created_at
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve emissions.")


@router.get("/summary", response_model=EmissionSummary)
async def get_emission_summary(
    days_back: int = Query(90, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service)
):
    """Get emission summary for the current user for a given period"""
    try:
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days_back)
        
        return await emission_service.get_emission_summary(
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve emission summary.")


@router.get("/{emission_id}", response_model=Emission)
async def get_emission_details(
    emission_id: UUID,
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service)
):
    """Get detailed information about a specific emission"""
    try:
        emission = await emission_service.get_emission_by_id(
            emission_id=emission_id,
            user_id=current_user.id
        )
        
        if not emission:
            raise HTTPException(status_code=404, detail="Emission not found")
        
        return emission
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{emission_id}", response_model=Emission)
async def update_emission(
    emission_id: UUID,
    emission_update: EmissionCreate,
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service)
):
    """Update an existing emission activity"""
    try:
        emission = await emission_service.update_emission(
            emission_id=emission_id,
            user_id=current_user.id,
            emission_data=emission_update
        )
        
        if not emission:
            raise HTTPException(status_code=404, detail="Emission not found")
        
        return emission
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{emission_id}")
async def delete_emission(
    emission_id: UUID,
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service)
):
    """Delete an emission activity"""
    try:
        success = await emission_service.delete_emission(
            emission_id=emission_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Emission not found or you do not have permission to delete it.")
        
        return {"ok": True, "message": "Emission deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete emission.")


@router.get("/analytics/trends", response_model=List[MonthlyTrend])
async def get_emission_trends(
    months_back: int = Query(12, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service)
):
    """Get emission trends over time (last N months)"""
    try:
        return await emission_service.get_emission_trends(
            user_id=current_user.id,
            months_back=months_back
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve emission trends.")
