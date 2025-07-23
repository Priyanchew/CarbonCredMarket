"""
External API endpoints for API-as-a-Service functionality.
These endpoints are used by external developers to integrate carbon offsetting.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from app.models.schemas import (
    ExternalEmissionRequest, 
    ExternalEmissionResponse,
    ExternalOffsetRequest,
    ExternalOffsetResponse
)
from app.core.api_auth import verify_api_key
from app.services.carbon_interface_service import get_carbon_interface_service, CarbonInterfaceService
from app.services.marketplace_service import MarketplaceService
from app.db.database import get_database, get_service_role_database
from typing import Dict, Any, Optional
import uuid
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

def get_marketplace_service_for_api() -> MarketplaceService:
    """Get marketplace service for external API use with service role (bypasses RLS)."""
    supabase = get_service_role_database()
    return MarketplaceService(supabase)

async def log_api_usage(
    user: Dict[str, Any],
    endpoint: str,
    request: Request,
    emission_amount: Optional[float] = None,
    offset_cost: Optional[float] = None,
    offset_done: bool = False,
    external_reference_id: Optional[str] = None
):
    """Log API usage for analytics"""
    try:
        supabase = get_service_role_database()  # Use service role to bypass RLS
        
        # Log data matching the exact table structure
        log_data = {
            "user_id": user["id"],
            "endpoint": endpoint,
            "method": "POST",
            "timestamp": datetime.utcnow().isoformat(),
            "emission_amount": emission_amount,
            "offset_cost": offset_cost,
            "offset_done": offset_done,
            "external_reference_id": external_reference_id,
            "response_status": 200,
            "created_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Attempting to log API usage: {log_data}")
        result = supabase.table("api_usage_logs").insert(log_data).execute()
        
        if result.data:
            logger.info(f"✅ API usage logged successfully: {result.data}")
        else:
            logger.error(f"❌ No data returned from API usage log insert")
        
    except Exception as e:
        logger.error(f"❌ Error logging API usage: {str(e)}")
        logger.error(f"User ID: {user.get('id', 'N/A')}")
        logger.error(f"Endpoint: {endpoint}")
        logger.error(f"Log data: {log_data if 'log_data' in locals() else 'N/A'}")
        # Don't raise the exception - let the API call continue

@router.post("/emissions", response_model=ExternalEmissionResponse)
async def estimate_emissions(
    request_data: ExternalEmissionRequest,
    request: Request,
    user: Dict[str, Any] = Depends(verify_api_key),
    carbon_service: CarbonInterfaceService = Depends(get_carbon_interface_service)
):
    """
    Estimate carbon emissions for various activities.
    
    Supports categories: transportation, energy, manufacturing, agriculture, 
    waste, electricity, flight, shipping
    """
    client_host = request.client.host if request.client else "unknown"
    logger.info(f"External API emissions request from {client_host} for category: {request_data.category}")
    logger.info(f"Request data: {request_data}")
    
    try:
        category = request_data.category
        activity_data = request_data.activity_data
        
        # Route to appropriate estimation method based on category
        if category == "flight":
            # Use existing flight estimation
            origin = activity_data.get("origin")
            destination = activity_data.get("destination")
            
            if not origin or not destination:
                raise HTTPException(status_code=400, detail="Flight category requires 'origin' and 'destination' in activity_data")
            
            result = await carbon_service.estimate_flight(
                passengers=activity_data.get("passenger_count", 1),
                legs=[{
                    "departure_airport": str(origin),
                    "destination_airport": str(destination)
                }]
            )
            emissions_kg = result["carbon_kg"]
            
        elif category == "shipping":
            # Use existing shipping estimation
            weight_kg = activity_data.get("weight_kg")
            distance_km = activity_data.get("distance_km")
            
            if weight_kg is None or distance_km is None:
                raise HTTPException(status_code=400, detail="Shipping category requires 'weight_kg' and 'distance_km' in activity_data")
            
            result = await carbon_service.estimate_shipping(
                weight_value=float(weight_kg),
                weight_unit="kg",
                distance_value=float(distance_km),
                distance_unit="km",
                transport_method=activity_data.get("transport_method", "truck")
            )
            emissions_kg = result["carbon_kg"]
            
        else:
            # For other categories, use a simple calculation
            # This would be replaced with more sophisticated calculations
            base_emission_factors = {
                "transportation": 0.2,  # kg CO2 per km
                "energy": 0.5,  # kg CO2 per kWh
                "manufacturing": 0.3,  # kg CO2 per unit
                "agriculture": 0.1,  # kg CO2 per unit
                "waste": 0.4,  # kg CO2 per kg
                "electricity": 0.5  # kg CO2 per kWh
            }
            
            factor = base_emission_factors.get(category, 0.3)
            amount = activity_data.get("amount", 1)
            emissions_kg = factor * amount
        
        # Calculate offset cost (assuming $15 per ton CO2)
        offset_cost_usd = (emissions_kg / 1000) * 15
        
        # Log API usage
        await log_api_usage(
            user=user,
            endpoint="/external-api/emissions",
            request=request,
            emission_amount=emissions_kg,
            external_reference_id=request_data.external_reference_id
        )
        
        return ExternalEmissionResponse(
            estimated_emissions_kg=round(emissions_kg, 2),
            estimated_offset_cost_usd=round(offset_cost_usd, 2),
            external_reference_id=request_data.external_reference_id
        )
        
    except Exception as e:
        logger.error(f"Error estimating emissions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error calculating emissions"
        )

@router.post("/offset", response_model=ExternalOffsetResponse)
async def log_emission_for_offset(
    request_data: ExternalOffsetRequest,
    request: Request,
    user: Dict[str, Any] = Depends(verify_api_key),
    marketplace_service: MarketplaceService = Depends(get_marketplace_service_for_api)
):
    """
    Log emission for future offset instead of immediately purchasing.
    This allows users to review and offset later through the dashboard.
    """
    try:
        emissions_kg = request_data.emissions_kg
        user_email = request_data.user_email
        external_ref = request_data.external_reference_id
        
        # Calculate estimated cost for reference
        estimated_cost_usd = (emissions_kg / 1000) * 15  # $15 per ton
        
        # Create emission record in database for later offsetting
        supabase = get_service_role_database()  # Use service role to bypass RLS
        
        emission_data = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "date": datetime.utcnow().isoformat(),
            "category": "api_external",  # Use the new enum value
            "activity_name": f"External API Call - {external_ref}" if external_ref else "External API Call",
            "description": f"External API emission - {external_ref}" if external_ref else "External API emission",
            "amount": 1.0,  # Single API call
            "unit": "call",
            "emission_factor": emissions_kg,  # Store the emission factor as the kg value
            "offset_amount": 0.0,
            "is_offset": False,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Logging emission for future offset: {emission_data}")
        emission_result = supabase.table("emissions").insert(emission_data).execute()
        
        if not emission_result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to log emission record"
            )
            
        emission_id = emission_result.data[0]["id"]
        logger.info(f"Emission logged successfully for future offset: {emission_id}")
        
        # Log API usage with pending offset status
        await log_api_usage(
            user=user,
            endpoint="/external-api/offset",
            request=request,
            emission_amount=emissions_kg,
            offset_cost=estimated_cost_usd,
            offset_done=False,  # Changed to False since we're not immediately offsetting
            external_reference_id=external_ref
        )
        
        return ExternalOffsetResponse(
            status="logged_for_offset",
            certificate_id=f"pending_{emission_id[:8]}",
            report_sent_to=user_email,
            external_reference_id=external_ref
        )
        
    except Exception as e:
        logger.error(f"Error logging emission for offset: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error logging emission for offset"
        )

async def send_offset_certificate(
    email: str,
    certificate_id: str,
    emissions_kg: float,
    project_name: str,
    external_ref: Optional[str] = None
):
    """
    Send offset certificate email.
    In production, this would use a proper email service.
    """
    try:
        # This is a placeholder - would integrate with actual email service
        logger.info(f"Sending certificate {certificate_id} to {email}")
        logger.info(f"Offset: {emissions_kg}kg CO2 via {project_name}")
        
        # Email template would include:
        # - Emissions offset amount
        # - Project used for offset
        # - Transaction ID
        # - Thank you note and carbon-neutral badge
        
    except Exception as e:
        logger.error(f"Error sending certificate email: {str(e)}")
