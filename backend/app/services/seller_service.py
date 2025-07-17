"""
Seller management service for carbon credit marketplace.
Handles seller verification, project management, and credit listing.
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from supabase import Client
from fastapi import HTTPException, status
import logging

from ..models.schemas import (
    SellerVerificationRequest, SellerVerification, VerificationStatus,
    CarbonProjectCreate, CarbonProject, SellerCreditCreate, SellerCredit,
    SaleTransaction, SellerDashboardStats, SellerAnalytics, User, UserType
)

logger = logging.getLogger(__name__)


class SellerService:
    def __init__(self, db: Client):
        self.db = db

    async def submit_verification(self, user_id: UUID, verification_data: SellerVerificationRequest) -> SellerVerification:
        """Submit seller verification request."""
        try:
            # Check if user is already verified or has pending verification
            existing_response = self.db.table("seller_verifications").select("*").eq("user_id", str(user_id)).execute()
            
            if existing_response.data:
                existing = existing_response.data[0]
                if existing["status"] in ["approved", "pending", "under_review"]:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Verification already {existing['status']}"
                    )
            
            # Create verification record
            verification_dict = {
                "user_id": str(user_id),
                "status": VerificationStatus.PENDING.value,
                "company_registration_document": verification_data.company_registration_document,
                "environmental_certification": verification_data.environmental_certification,
                "business_license": verification_data.business_license,
                "additional_documents": verification_data.additional_documents,
                "verification_message": verification_data.verification_message,
                "submitted_at": datetime.utcnow().isoformat()
            }
            
            response = self.db.table("seller_verifications").insert(verification_dict).execute()
            
            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to submit verification"
                )
            
            return SellerVerification(**response.data[0])
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error submitting verification: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to submit verification"
            )

    async def get_verification_status(self, user_id: UUID) -> Optional[SellerVerification]:
        """Get seller verification status."""
        try:
            response = self.db.table("seller_verifications").select("*").eq("user_id", str(user_id)).execute()
            
            if not response.data:
                return None
                
            return SellerVerification(**response.data[0])
            
        except Exception as e:
            logger.error(f"Error getting verification status: {str(e)}")
            return None

    async def create_project(self, user_id: UUID, project_data: CarbonProjectCreate) -> CarbonProject:
        """Create a new carbon offset project."""
        try:
            # Verify seller is approved
            verification = await self.get_verification_status(user_id)
            if not verification or verification.status != VerificationStatus.APPROVED:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Seller must be verified to create projects"
                )
            
            project_dict = {
                "seller_id": str(user_id),
                "name": project_data.name,
                "description": project_data.description,
                "project_type": project_data.project_type.value,
                "location": project_data.location,
                "country": project_data.country,
                "standard": project_data.standard.value,
                "vintage_year": project_data.vintage_year,
                "estimated_annual_reduction": project_data.estimated_annual_reduction,
                "total_project_lifetime": project_data.total_project_lifetime,
                "methodology": project_data.methodology,
                "supporting_documents": project_data.supporting_documents,
                "images": project_data.images,
                "status": VerificationStatus.PENDING.value,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            response = self.db.table("carbon_projects").insert(project_dict).execute()
            
            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create project"
                )
            
            return CarbonProject(**response.data[0])
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating project: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create project"
            )

    async def get_seller_projects(self, user_id: UUID, skip: int = 0, limit: int = 20) -> List[CarbonProject]:
        """Get all projects for a seller."""
        try:
            response = self.db.table("carbon_projects").select("*").eq("seller_id", str(user_id)).order("created_at", desc=True).range(skip, skip + limit - 1).execute()
            
            return [CarbonProject(**project) for project in response.data]
            
        except Exception as e:
            logger.error(f"Error getting seller projects: {str(e)}")
            return []

    async def create_credit_listing(self, user_id: UUID, credit_data: SellerCreditCreate) -> SellerCredit:
        """Create a new carbon credit listing."""
        try:
            # Verify project belongs to seller and is approved
            project_response = self.db.table("carbon_projects").select("*").eq("id", str(credit_data.project_id)).eq("seller_id", str(user_id)).execute()
            
            if not project_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Project not found or not owned by seller"
                )
            
            project = project_response.data[0]
            if project["status"] != VerificationStatus.APPROVED.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Project must be approved before creating credits"
                )
            
            credit_dict = {
                "seller_id": str(user_id),
                "project_id": str(credit_data.project_id),
                "vintage_year": credit_data.vintage_year,
                "quantity": credit_data.quantity,
                "price_per_ton": credit_data.price_per_ton,
                "blockchain_token_id": credit_data.blockchain_token_id,
                "blockchain_tx_hash": credit_data.blockchain_tx_hash,
                "metadata_uri": credit_data.metadata_uri,
                "status": "available",
                "sold_quantity": 0.0,
                "retired_quantity": 0.0,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "listed_at": datetime.utcnow().isoformat()
            }
            
            response = self.db.table("seller_credits").insert(credit_dict).execute()
            
            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create credit listing"
                )
            
            return SellerCredit(**response.data[0])
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating credit listing: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create credit listing"
            )

    async def get_seller_credit_by_id(self, credit_id: UUID) -> Optional[SellerCredit]:
        """Get a specific seller credit by ID."""
        try:
            response = self.db.table("seller_credits").select("*").eq("id", str(credit_id)).execute()
            
            if response.data:
                return SellerCredit(**response.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error getting seller credit by ID: {str(e)}")
            return None

    async def get_seller_credits(self, user_id: UUID, skip: int = 0, limit: int = 20) -> List[SellerCredit]:
        """Get all credit listings for a seller."""
        try:
            response = self.db.table("seller_credits").select("*").eq("seller_id", str(user_id)).order("created_at", desc=True).range(skip, skip + limit - 1).execute()
            
            return [SellerCredit(**credit) for credit in response.data]
            
        except Exception as e:
            logger.error(f"Error getting seller credits: {str(e)}")
            return []

    async def get_sales_transactions(self, user_id: UUID, skip: int = 0, limit: int = 20) -> List[SaleTransaction]:
        """Get sales transactions for a seller."""
        try:
            # Join with seller_credits to get only this seller's transactions
            response = self.db.table("sale_transactions").select(
                "*, seller_credits!inner(seller_id)"
            ).eq("seller_credits.seller_id", str(user_id)).order("transaction_date", desc=True).range(skip, skip + limit - 1).execute()
            
            return [SaleTransaction(**transaction) for transaction in response.data]
            
        except Exception as e:
            logger.error(f"Error getting sales transactions: {str(e)}")
            return []

    async def get_dashboard_stats(self, user_id: UUID) -> SellerDashboardStats:
        """Get dashboard statistics for a seller."""
        try:
            # Get projects count
            projects_response = self.db.table("carbon_projects").select("id, status").eq("seller_id", str(user_id)).execute()
            projects = projects_response.data or []
            
            total_projects = len(projects)
            pending_verification = len([p for p in projects if p["status"] == "pending"])
            
            # Get credits stats
            credits_response = self.db.table("seller_credits").select("quantity, sold_quantity, status").eq("seller_id", str(user_id)).execute()
            credits = credits_response.data or []
            
            active_listings = len([c for c in credits if c["status"] == "available"])
            total_credits_minted = sum(float(c["quantity"]) for c in credits)
            total_credits_sold = sum(float(c["sold_quantity"]) for c in credits)
            
            # Get sales transactions
            transactions_response = self.db.table("sale_transactions").select(
                "total_amount, transaction_date, seller_credits!inner(seller_id)"
            ).eq("seller_credits.seller_id", str(user_id)).execute()
            transactions = transactions_response.data or []
            
            total_revenue = sum(float(t["total_amount"]) for t in transactions)
            
            # Calculate monthly sales (last 12 months)
            monthly_sales = []
            recent_transactions = []
            
            # Group transactions by month
            from collections import defaultdict
            monthly_data = defaultdict(lambda: {"sales": 0, "revenue": 0.0})
            
            for transaction in transactions:
                try:
                    date = datetime.fromisoformat(transaction["transaction_date"].replace("Z", "+00:00"))
                    month_key = date.strftime("%Y-%m")
                    monthly_data[month_key]["sales"] += 1
                    monthly_data[month_key]["revenue"] += float(transaction["total_amount"])
                except:
                    continue
            
            # Convert to list and sort
            for month, data in sorted(monthly_data.items()):
                monthly_sales.append({
                    "month": month,
                    "sales": data["sales"],
                    "revenue": data["revenue"]
                })
            
            # Recent transactions (last 5)
            for transaction in transactions[:5]:
                recent_transactions.append({
                    "id": transaction.get("id", ""),
                    "buyer": "Customer",  # You might want to join with user data
                    "quantity": 0,  # Would need to join with more data
                    "amount": float(transaction["total_amount"]),
                    "date": transaction["transaction_date"]
                })
            
            return SellerDashboardStats(
                total_projects=total_projects,
                active_listings=active_listings,
                total_credits_minted=total_credits_minted,
                total_credits_sold=total_credits_sold,
                total_revenue=total_revenue,
                pending_verification=pending_verification,
                monthly_sales=monthly_sales,
                recent_transactions=recent_transactions
            )
            
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {str(e)}")
            return SellerDashboardStats(
                total_projects=0,
                active_listings=0,
                total_credits_minted=0,
                total_credits_sold=0,
                total_revenue=0,
                pending_verification=0,
                monthly_sales=[],
                recent_transactions=[]
            )

    async def get_seller_analytics(self, user_id: UUID) -> SellerAnalytics:
        """Get detailed analytics for a seller."""
        try:
            # This would contain more sophisticated analytics
            # For now, return basic structure
            return SellerAnalytics(
                sales_by_month=[],
                sales_by_project=[],
                revenue_trends=[],
                buyer_analytics={
                    "total_buyers": 0,
                    "repeat_customers": 0,
                    "average_purchase_size": 0
                },
                market_performance={
                    "market_share": 0,
                    "price_competitiveness": 0,
                    "sales_rank": 0
                }
            )
            
        except Exception as e:
            logger.error(f"Error getting seller analytics: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get analytics"
            )

    async def update_user_type_to_seller(self, user_id: UUID) -> bool:
        """Update user type to seller after verification approval."""
        try:
            response = self.db.table("user_profiles").update({
                "type": UserType.SELLER.value,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", str(user_id)).execute()
            
            return bool(response.data)
            
        except Exception as e:
            logger.error(f"Error updating user type: {str(e)}")
            return False

    async def update_sold_quantity(self, seller_credit_id: UUID, quantity_sold: float) -> Optional[SellerCredit]:
        """Update the sold_quantity for a seller credit after a purchase."""
        try:
            # First get the current seller credit
            current_response = self.db.table("seller_credits").select("*").eq("id", str(seller_credit_id)).execute()
            
            if not current_response.data:
                logger.error(f"Seller credit not found: {seller_credit_id}")
                return None
            
            current_credit = current_response.data[0]
            current_sold_quantity = float(current_credit.get("sold_quantity", 0))
            new_sold_quantity = current_sold_quantity + quantity_sold
            
            # Update the sold_quantity
            update_response = self.db.table("seller_credits").update({
                "sold_quantity": new_sold_quantity,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", str(seller_credit_id)).execute()
            
            # Always verify by fetching the record again (RLS might return empty data)
            verification_response = self.db.table("seller_credits").select("*").eq("id", str(seller_credit_id)).execute()
            
            if verification_response.data:
                updated_record = verification_response.data[0]
                actual_sold_quantity = float(updated_record.get("sold_quantity", 0))
                
                if actual_sold_quantity == new_sold_quantity:
                    return SellerCredit.model_validate(updated_record)
                else:
                    logger.error(f"Update verification failed for {seller_credit_id}: expected {new_sold_quantity}, got {actual_sold_quantity}")
                    return None
            else:
                logger.error(f"Could not verify update for seller credit {seller_credit_id}")
                return None
            
        except Exception as e:
            logger.error(f"Error updating sold quantity for seller credit {seller_credit_id}: {str(e)}")
            return None

    async def update_seller_credit_blockchain_info(
        self, 
        seller_credit_id: UUID, 
        blockchain_tx_hash: str,
        blockchain_token_id: Optional[str] = None
    ) -> Optional[SellerCredit]:
        """Update blockchain information for an existing seller credit."""
        try:
            update_data = {
                "blockchain_tx_hash": blockchain_tx_hash,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            if blockchain_token_id:
                update_data["blockchain_token_id"] = blockchain_token_id
            
            # Update the seller credit with blockchain information
            update_response = self.db.table("seller_credits").update(update_data).eq("id", str(seller_credit_id)).execute()
            
            # Verify the update by fetching the updated record
            verification_response = self.db.table("seller_credits").select("*").eq("id", str(seller_credit_id)).execute()
            
            if verification_response.data:
                updated_record = verification_response.data[0]
                return SellerCredit.model_validate(updated_record)
            else:
                logger.error(f"Could not verify blockchain update for seller credit {seller_credit_id}")
                return None
            
        except Exception as e:
            logger.error(f"Error updating blockchain info for seller credit {seller_credit_id}: {str(e)}")
            return None
