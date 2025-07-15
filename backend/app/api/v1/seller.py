"""
Seller API endpoints for carbon credit marketplace.
Handles seller verification, project management, and credit listing.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from typing import List, Optional
from uuid import UUID

from ...models.schemas import (
    SellerVerificationRequest, SellerVerification,
    CarbonProjectCreate, CarbonProject,
    SellerCreditCreate, SellerCredit,
    SaleTransaction, SellerDashboardStats, SellerAnalytics,
    User, UserType
)
from ...core.dependencies import get_current_user
from ...services.seller_service import SellerService
from ...core.dependencies import get_seller_service

router = APIRouter(prefix="/seller", tags=["seller"])


def verify_seller_access(current_user: User) -> None:
    """Verify user has seller access."""
    if current_user.type not in [UserType.SELLER, UserType.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller access required"
        )


@router.post("/verification/submit", response_model=SellerVerification)
async def submit_verification(
    verification_data: SellerVerificationRequest,
    current_user: User = Depends(get_current_user),
    seller_service: SellerService = Depends(get_seller_service),
):
    """Submit seller verification request."""
    return await seller_service.submit_verification(current_user.id, verification_data)


@router.get("/verification/status", response_model=Optional[SellerVerification])
async def get_verification_status(
    current_user: User = Depends(get_current_user),
    seller_service: SellerService = Depends(get_seller_service),
):
    """Get seller verification status."""
    return await seller_service.get_verification_status(current_user.id)


@router.post("/projects", response_model=CarbonProject)
async def create_project(
    project_data: CarbonProjectCreate,
    current_user: User = Depends(get_current_user),
    seller_service: SellerService = Depends(get_seller_service),
):
    """Create a new carbon offset project."""
    verify_seller_access(current_user)
    return await seller_service.create_project(current_user.id, project_data)


@router.get("/projects", response_model=List[CarbonProject])
async def get_seller_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    current_user: User = Depends(get_current_user),
    seller_service: SellerService = Depends(get_seller_service),
):
    """Get all projects for the seller."""
    verify_seller_access(current_user)
    return await seller_service.get_seller_projects(current_user.id, skip, limit)


@router.post("/credits", response_model=SellerCredit)
async def create_credit_listing(
    credit_data: SellerCreditCreate,
    current_user: User = Depends(get_current_user),
    seller_service: SellerService = Depends(get_seller_service),
):
    """Create a new carbon credit listing."""
    verify_seller_access(current_user)
    return await seller_service.create_credit_listing(current_user.id, credit_data)


@router.get("/credits", response_model=List[SellerCredit])
async def get_seller_credits(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    current_user: User = Depends(get_current_user),
    seller_service: SellerService = Depends(get_seller_service),
):
    """Get all credit listings for the seller."""
    verify_seller_access(current_user)
    return await seller_service.get_seller_credits(current_user.id, skip, limit)


@router.get("/sales", response_model=List[SaleTransaction])
async def get_sales_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    current_user: User = Depends(get_current_user),
    seller_service: SellerService = Depends(get_seller_service),
):
    """Get sales transactions for the seller."""
    verify_seller_access(current_user)
    return await seller_service.get_sales_transactions(current_user.id, skip, limit)


@router.get("/dashboard", response_model=SellerDashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    seller_service: SellerService = Depends(get_seller_service),
):
    """Get dashboard statistics for the seller."""
    verify_seller_access(current_user)
    return await seller_service.get_dashboard_stats(current_user.id)


@router.get("/analytics", response_model=SellerAnalytics)
async def get_seller_analytics(
    current_user: User = Depends(get_current_user),
    seller_service: SellerService = Depends(get_seller_service),
):
    """Get detailed analytics for the seller."""
    verify_seller_access(current_user)
    return await seller_service.get_seller_analytics(current_user.id)


@router.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a document for verification or project submission."""
    # This would handle file upload to storage (S3, Supabase Storage, etc.)
    # For now, return a mock URL
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    # Mock implementation - in real app, upload to storage service
    mock_url = f"https://storage.example.com/documents/{current_user.id}/{file.filename}"
    
    return {
        "url": mock_url,
        "filename": file.filename,
        "size": file.size,
        "content_type": file.content_type
    }
