from typing import List, Optional
from supabase import Client
from app.models.schemas import EmissionCreate, Emission, EmissionSummary, MonthlyTrend, OffsetStats
from app.core.config import settings
from app.db.database import get_database
from uuid import UUID
from datetime import datetime, timedelta, timezone  
from calendar import month_abbr

class EmissionService:
    def __init__(self, db: Client):
        self.db = db
    
    async def create_emission(self, user_id: UUID, emission_data: EmissionCreate) -> Emission:
        """Create a new emission activity."""
        try:
            # Prepare data for insertion, ensuring proper datetime serialization
            emission_dict = emission_data.model_dump()
            
            # Convert datetime to ISO format string if needed
            if isinstance(emission_dict.get('date'), datetime):
                emission_dict['date'] = emission_dict['date'].isoformat()
            
            insert_data = {
                "user_id": str(user_id),
                **emission_dict
            }
            
            result = self.db.table("emissions").insert(insert_data).execute()
            
            if not result.data:
                raise ValueError("Failed to create emission activity")
            
            emission = Emission.model_validate(result.data[0])
            return emission
            
        except Exception as e:
            raise

    async def get_user_emissions(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        filter_by_created_at: bool = False
    ) -> List[Emission]:
        """Get emissions for a user with optional filtering and pagination.
        
        Args:
            filter_by_created_at: If True, filter by created_at instead of date field.
                                 Useful for getting recently added records regardless of their activity date.
        """
        query = self.db.table("emissions").select("*").eq("user_id", str(user_id))
        
        # Only apply category filter if provided
        if category:
            query = query.eq("category", category)
        
        # Remove all date filtering - get all emissions
        # Order by created_at descending to show newest first
        result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        return [Emission.model_validate(item) for item in result.data]

    async def get_emission_summary(self, user_id: UUID, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> EmissionSummary:
        """Get emission summary for a user for a given period."""
        # Set default dates if not provided
        if end_date is None:
            end_date = datetime.now(timezone.utc)
        if start_date is None:
            start_date = end_date - timedelta(days=90)
        
        # 1. Get overall summary from the view
        stats_result = self.db.table("user_dashboard_stats").select("*").eq("user_id", str(user_id)).execute()
        if stats_result.data and len(stats_result.data) > 0:
            stats_data = stats_result.data[0]
        else:
            stats_data = {}

        # 2. Get ALL emissions by category (not filtered by date range)
        cat_result = self.db.table("emissions").select("category, co2_equivalent") \
            .eq("user_id", str(user_id)) \
            .execute()

        emissions_by_category = {}
        for item in cat_result.data or []:
            cat = item['category']
            emissions_by_category[cat] = emissions_by_category.get(cat, 0) + item['co2_equivalent']        # 3. Get monthly trends for the last 12 months
        trends_start_date = (datetime.now(timezone.utc) - timedelta(days=365)).replace(day=1)
        monthly_trends_result = self.db.rpc('get_monthly_trends', {
            'p_user_id': str(user_id), 
            'p_start_date': trends_start_date.isoformat()
        }).execute()
        
        try:
            monthly_trends = [MonthlyTrend.model_validate(t) for t in (monthly_trends_result.data or [])]
        except Exception as e:
            monthly_trends = []

        try:
            # Calculate total emissions from actual data
            total_emissions = sum(emissions_by_category.values()) if emissions_by_category else 0
            
            # Calculate total offsets directly from emissions table
            # Get all emissions with their offset amounts
            all_emissions_result = self.db.table("emissions").select("offset_amount") \
                .eq("user_id", str(user_id)) \
                .execute()
            
            total_offsets = 0.0
            for emission_data in all_emissions_result.data or []:
                offset_amount = emission_data.get('offset_amount', 0)
                if offset_amount:
                    total_offsets += offset_amount
            
            # Calculate net emissions
            net_emissions = max(0, total_emissions - total_offsets)
            
            # Calculate offset percentage
            if total_emissions > 0:
                offset_percentage = (total_offsets / total_emissions) * 100
            else:
                offset_percentage = 0.0
        except Exception as e:
            # Fallback: calculate directly from emissions data
            total_emissions = sum(emissions_by_category.values()) if emissions_by_category else 0
            
            # Calculate total offsets as fallback
            all_emissions_result = self.db.table("emissions").select("offset_amount") \
                .eq("user_id", str(user_id)) \
                .execute()
            
            total_offsets = 0.0
            for emission_data in all_emissions_result.data or []:
                offset_amount = emission_data.get('offset_amount', 0)
                if offset_amount:
                    total_offsets += offset_amount
            
            net_emissions = max(0, total_emissions - total_offsets)
            offset_percentage = (total_offsets / total_emissions * 100) if total_emissions > 0 else 0.0

        try:
            emission_summary = EmissionSummary(
                total_emissions=total_emissions,
                total_offsets=total_offsets,
                net_emissions=net_emissions,
                offset_percentage=offset_percentage,
                emissions_by_category=emissions_by_category,
                monthly_trends=monthly_trends
            )
            print(f"EmissionService created EmissionSummary successfully: total_emissions={total_emissions}, emissions_by_category={emissions_by_category}")
            return emission_summary
        except Exception as e:
            print(f"Error creating EmissionSummary: {e}")
            raise

    async def get_emission_by_id(self, emission_id: UUID, user_id: UUID) -> Optional[Emission]:
        """Get a single emission by its ID."""
        result = self.db.table("emissions").select("*") \
            .eq("id", str(emission_id)) \
            .eq("user_id", str(user_id)) \
            .single().execute()
            
        if not result.data:
            return None
        return Emission.model_validate(result.data)

    async def update_emission(self, emission_id: UUID, user_id: UUID, emission_data: EmissionCreate) -> Optional[Emission]:
        """Update an emission activity."""
        result = self.db.table("emissions").update(emission_data.model_dump()) \
            .eq("id", str(emission_id)) \
            .eq("user_id", str(user_id)) \
            .execute()

        if not result.data:
            return None
        
        return await self.get_emission_by_id(emission_id, user_id)

    async def delete_emission(self, emission_id: UUID, user_id: UUID) -> bool:
        """Delete an emission activity."""
        result = self.db.table("emissions").delete() \
            .eq("id", str(emission_id)) \
            .eq("user_id", str(user_id)) \
            .execute()
            
        return len(result.data) > 0

    async def get_emission_trends(self, user_id: UUID, months_back: int) -> List[MonthlyTrend]:
        """Get emission trends over a specified number of months."""
        start_date = (datetime.now(timezone.utc) - timedelta(days=months_back * 30)).replace(day=1)
        
        # This assumes a DB function `get_monthly_trends` exists for this purpose.
        # If not, it needs to be created.
        result = self.db.rpc('get_monthly_trends', {
            'p_user_id': str(user_id),
            'p_start_date': start_date.isoformat()
        }).execute()

        return [MonthlyTrend.model_validate(item) for item in result.data]

    async def offset_emissions(
        self, 
        user_id: UUID, 
        emission_ids: List[UUID], 
        purchase_id: UUID, 
        total_offset_amount: float
    ) -> List[Emission]:
        """Offset specific emissions using retired carbon credits."""
        try:
            # Get the emissions to be offset
            emissions_to_offset = []
            total_emissions_amount = 0.0
            
            for emission_id in emission_ids:
                result = self.db.table("emissions").select("*") \
                    .eq("id", str(emission_id)) \
                    .eq("user_id", str(user_id)) \
                    .eq("is_offset", False) \
                    .execute()
                
                if not result.data:
                    raise ValueError(f"Emission {emission_id} not found or already offset")
                
                emission = Emission.model_validate(result.data[0])
                emissions_to_offset.append(emission)
                total_emissions_amount += emission.co2_equivalent
            
            # Validate that total offset amount doesn't exceed total emissions
            if total_offset_amount > total_emissions_amount:
                raise ValueError(f"Offset amount ({total_offset_amount}) cannot exceed total emissions ({total_emissions_amount})")
            
            # Update emissions as offset
            offset_date = datetime.now(timezone.utc)
            updated_emissions = []
            
            for emission in emissions_to_offset:
                # Calculate proportional offset for this emission
                proportion = emission.co2_equivalent / total_emissions_amount
                offset_amount = total_offset_amount * proportion
                
                update_data = {
                    "offset_amount": offset_amount,
                    "is_offset": True,
                    "offset_date": offset_date.isoformat(),
                    "offset_purchase_id": str(purchase_id),
                    "updated_at": offset_date.isoformat()
                }
                
                result = self.db.table("emissions").update(update_data) \
                    .eq("id", str(emission.id)) \
                    .execute()
                
                if result.data:
                    updated_emissions.append(Emission.model_validate(result.data[0]))
            
            return updated_emissions
            
        except Exception as e:
            print(f"Error in offset_emissions: {e}")
            raise

    async def bulk_offset_emissions(
        self, 
        user_id: UUID, 
        emission_ids: List[UUID], 
        credit_allocations: List[dict]  # [{"purchase_id": UUID, "amount": float}, ...]
    ) -> List[Emission]:
        """Offset specific emissions using multiple credit purchases in a single transaction."""
        try:
            # Get the emissions to be offset
            emissions_to_offset = []
            total_emissions_amount = 0.0
            
            for emission_id in emission_ids:
                result = self.db.table("emissions").select("*") \
                    .eq("id", str(emission_id)) \
                    .eq("user_id", str(user_id)) \
                    .execute()
                
                if not result.data:
                    raise ValueError(f"Emission {emission_id} not found")
                
                emission = Emission.model_validate(result.data[0])
                
                # Check if emission has remaining amount to offset
                remaining_amount = emission.co2_equivalent - (emission.offset_amount or 0)
                if remaining_amount <= 0:
                    raise ValueError(f"Emission {emission_id} is already fully offset")
                
                emissions_to_offset.append(emission)
                total_emissions_amount += remaining_amount
            
            # Calculate total offset amount from all allocations (convert tonnes to kg)
            total_offset_amount_kg = sum(allocation["amount"] * 1000 for allocation in credit_allocations)
            
            # Validate that total offset amount doesn't exceed total emissions
            if total_offset_amount_kg > total_emissions_amount:
                raise ValueError(f"Offset amount ({total_offset_amount_kg/1000:.3f} tonnes) cannot exceed total emissions ({total_emissions_amount/1000:.3f} tonnes)")
            
            # Update emissions as offset with combined purchase information
            offset_date = datetime.now(timezone.utc)
            updated_emissions = []
            
            # Create a summary of all purchase IDs used
            purchase_ids = [allocation["purchase_id"] for allocation in credit_allocations]
            primary_purchase_id = purchase_ids[0]  # Use first purchase as primary reference
            
            for emission in emissions_to_offset:
                # Calculate remaining amount for this emission
                remaining_amount = emission.co2_equivalent - (emission.offset_amount or 0)
                
                # Calculate proportional offset for this emission based on remaining amount
                proportion = remaining_amount / total_emissions_amount
                additional_offset_kg = total_offset_amount_kg * proportion
                
                # Calculate new cumulative offset amount
                current_offset = emission.offset_amount or 0.0
                new_offset_amount = current_offset + additional_offset_kg
                
                # Check if emission is now fully offset
                is_fully_offset = new_offset_amount >= emission.co2_equivalent
                
                update_data = {
                    "offset_amount": new_offset_amount,
                    "is_offset": is_fully_offset,
                    "offset_date": offset_date.isoformat(),
                    "offset_purchase_id": str(primary_purchase_id),  # Reference primary purchase
                    "updated_at": offset_date.isoformat()
                }
                
                result = self.db.table("emissions").update(update_data) \
                    .eq("id", str(emission.id)) \
                    .execute()
                
                if result.data:
                    updated_emissions.append(Emission.model_validate(result.data[0]))
            
            return updated_emissions
            
        except Exception as e:
            print(f"Error in bulk_offset_emissions: {e}")
            raise

    async def get_offset_stats(self, user_id: UUID) -> OffsetStats:
        """Get offset statistics for a user."""
        
        try:
            # Get all emissions for the user
            result = self.db.table("emissions").select("*") \
                .eq("user_id", str(user_id)) \
                .execute()
            
            total_emissions = 0.0
            total_offset_amount = 0.0
            offset_emissions_count = 0
            
            for row in result.data:
                emission = Emission.model_validate(row)
                total_emissions += emission.co2_equivalent
                if emission.is_offset:
                    total_offset_amount += emission.offset_amount
                    offset_emissions_count += 1
            
            net_emissions = total_emissions - total_offset_amount
            offset_percentage = (total_offset_amount / total_emissions * 100) if total_emissions > 0 else 0
            available_for_offset = total_emissions - total_offset_amount
            
            return OffsetStats(
                total_emissions=total_emissions,
                total_offset_amount=total_offset_amount,
                net_emissions=net_emissions,
                offset_percentage=offset_percentage,
                offset_emissions_count=offset_emissions_count,
                available_for_offset=available_for_offset
            )
            
        except Exception as e:
            print(f"Error in get_offset_stats: {e}")
            raise

    async def get_emissions_for_offset(self, user_id: UUID) -> List[Emission]:
        """Get emissions that are available for offsetting (not fully offset yet)."""
        try:
            # Get all emissions for the user first, then filter in Python
            result = self.db.table("emissions").select("*") \
                .eq("user_id", str(user_id)) \
                .order("date", desc=True) \
                .execute()
            
            # Filter to include only emissions that are not fully offset
            available_emissions = []
            for row in result.data:
                emission = Emission.model_validate(row)
                remaining_amount = emission.co2_equivalent - (emission.offset_amount or 0)
                if remaining_amount > 0:
                    available_emissions.append(emission)
            
            return available_emissions
            
        except Exception as e:
            print(f"Error in get_emissions_for_offset: {e}")
            raise

    async def get_offset_history(self, user_id: UUID) -> List[Emission]:
        """Get history of offset emissions."""
        try:
            result = self.db.table("emissions").select("*") \
                .eq("user_id", str(user_id)) \
                .eq("is_offset", True) \
                .order("offset_date", desc=True) \
                .execute()
            
            return [Emission.model_validate(row) for row in result.data]
            
        except Exception as e:
            print(f"Error in get_offset_history: {e}")
            raise
