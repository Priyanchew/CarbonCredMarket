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
        """Get available carbon projects (now showing as credits in marketplace)."""
        # Changed from carbon_credits to carbon_projects table
        query = self.db.table("carbon_projects").select("*").eq("status", "approved")
        
        if project_type:
            query = query.eq("project_type", project_type)
        
        response = query.order("name").range(skip, skip + limit - 1).execute()
        
        credits = []
        for project_data in response.data:
            # Convert project data to CarbonCredit format for marketplace display
            credit_data = {
                'id': project_data['id'],
                'project_name': project_data['name'],
                'description': project_data['description'],
                'project_type': project_data['project_type'],
                'project_location': f"{project_data['location']}, {project_data['country']}",
                'verification_standard': project_data['standard'],
                'vintage_year': project_data['vintage_year'],
                # Calculate total credits available based on annual reduction and lifetime
                'total_quantity': project_data['estimated_annual_reduction'] * project_data['total_project_lifetime'],
                'available_quantity': project_data['estimated_annual_reduction'] * project_data['total_project_lifetime'],
                'price_per_ton': 25.0,  # Default price, should be configurable
                'status': 'available',
                'created_at': project_data['created_at'],
                'updated_at': project_data['updated_at']
            }
            
            # Apply price filters if specified
            if min_price is not None and credit_data['price_per_ton'] < min_price:
                continue
            if max_price is not None and credit_data['price_per_ton'] > max_price:
                continue
                
            credits.append(CarbonCredit.model_validate(credit_data))
        
        return credits

    async def get_credit_by_id(self, credit_id: UUID) -> Optional[CarbonCredit]:
        """Get a specific carbon project (displayed as credit) by ID."""
        response = self.db.table("carbon_projects").select("*").eq("id", str(credit_id)).single().execute()
        if response.data:
            project_data = response.data
            # Convert project data to CarbonCredit format
            credit_data = {
                'id': project_data['id'],
                'project_name': project_data['name'],
                'description': project_data['description'],
                'project_type': project_data['project_type'],
                'project_location': f"{project_data['location']}, {project_data['country']}",
                'verification_standard': project_data['standard'],
                'vintage_year': project_data['vintage_year'],
                'total_quantity': project_data['estimated_annual_reduction'] * project_data['total_project_lifetime'],
                'available_quantity': project_data['estimated_annual_reduction'] * project_data['total_project_lifetime'],
                'price_per_ton': 25.0,
                'status': 'available',
                'created_at': project_data['created_at'],
                'updated_at': project_data['updated_at']
            }
            return CarbonCredit.model_validate(credit_data)
        return None

    async def purchase_credits(self, user_id: UUID, purchase_data: CarbonCreditPurchaseCreate) -> CarbonCreditPurchase:
        """Purchase carbon credits using direct table operations."""
        try:
            # Get credit details
            credit_response = self.db.table("carbon_credits").select("*").eq("id", str(purchase_data.credit_id)).single().execute()
            
            if not credit_response.data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon credit not found")
            
            credit = credit_response.data
            
            # Check if credit is available
            if credit['status'] != 'available':
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Carbon credit is not available")
            
            # Calculate actual available quantity by checking existing purchases
            purchases_response = self.db.table("carbon_credit_purchases").select("quantity").eq("credit_id", str(purchase_data.credit_id)).execute()
            total_purchased = sum(float(p['quantity']) for p in purchases_response.data) if purchases_response.data else 0
            actual_available = float(credit['total_quantity']) - total_purchased
            
            # Check if sufficient quantity is available
            if actual_available < purchase_data.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"Insufficient quantity available. Available: {actual_available}, Requested: {purchase_data.quantity}"
                )
            
            # Calculate costs
            price_per_ton = float(credit['price_per_ton'])
            total_cost = price_per_ton * purchase_data.quantity
            
            # Create purchase record
            purchase_data_dict = {
                "user_id": str(user_id),
                "credit_id": str(purchase_data.credit_id),
                "quantity": purchase_data.quantity,
                "price_per_ton": price_per_ton,
                "total_cost": total_cost,
                "status": PurchaseStatus.COMPLETED.value,
                "retired_quantity": 0.0
            }
            
            logger.info(f"Attempting to insert purchase data: {purchase_data_dict}")
            logger.info(f"Database client type: {type(self.db)}")
            purchase_response = self.db.table("carbon_credit_purchases").insert(purchase_data_dict).execute()
            
            if not purchase_response.data:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create purchase record")
            
            return CarbonCreditPurchase.model_validate(purchase_response.data[0])
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Purchase failed: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Purchase failed: {str(e)}")

    async def get_user_purchases(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[CarbonCreditPurchase]:
        """Get all purchases for a user with pagination."""
        response = self.db.table("carbon_credit_purchases").select(
            "*, credit:carbon_credits(*)"
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
                "*, credit:carbon_credits(*)"
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
