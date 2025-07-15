"""
API management endpoints for API-as-a-Service functionality.
These endpoints help users manage their API keys and view usage analytics.
"""
from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import (
    APIKeyResponse,
    APIDocsResponse,
    APIAnalyticsResponse,
    APIEndpointInfo,
    User
)
from app.core.security import get_current_user
from app.core.dependencies import get_marketplace_service
from app.services.marketplace_service import MarketplaceService
from app.db.database import get_database
from typing import Dict, List, Any
import uuid
import logging
from datetime import datetime, timedelta

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/generate-api-key", response_model=APIKeyResponse)
async def generate_api_key(current_user: User = Depends(get_current_user)):
    """
    Generate a new API key for the authenticated user.
    """
    try:
        supabase = get_database()
        
        # Generate new API key
        new_api_key = str(uuid.uuid4())
        
        # Update user profile with new API key
        result = supabase.table("user_profiles").update({
            "api_key": new_api_key,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", current_user.id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate API key"
            )
        
        logger.info(f"Generated new API key for user: {current_user.email}")
        
        return APIKeyResponse(
            api_key=new_api_key,
            message="API key generated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error generating API key: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error generating API key"
        )

@router.get("/api-docs", response_model=APIDocsResponse)
async def get_api_docs():
    """
    Get API documentation for external developers.
    """
    endpoints = [
        APIEndpointInfo(
            endpoint="/external-api/emissions",
            method="POST",
            description="Estimate carbon emissions for various activities",
            input_schema={
                "category": "string (transportation|energy|manufacturing|agriculture|waste|electricity|flight|shipping)",
                "activity_data": "object (varies by category)",
                "external_reference_id": "string (optional)"
            },
            output_schema={
                "estimated_emissions_kg": "number",
                "estimated_offset_cost_usd": "number",
                "external_reference_id": "string"
            },
            example_request={
                "category": "flight",
                "activity_data": {
                    "origin": "DEL",
                    "destination": "LHR", 
                    "passenger_count": 2,
                    "flight_class": "economy"
                },
                "external_reference_id": "flight_001"
            },
            example_response={
                "estimated_emissions_kg": 1250.5,
                "estimated_offset_cost_usd": 18.75,
                "external_reference_id": "flight_001"
            }
        ),
        APIEndpointInfo(
            endpoint="/external-api/offset",
            method="POST", 
            description="Purchase carbon offsets and receive certificate",
            input_schema={
                "external_reference_id": "string",
                "emissions_kg": "number",
                "user_email": "string"
            },
            output_schema={
                "status": "string",
                "certificate_id": "string",
                "report_sent_to": "string",
                "external_reference_id": "string"
            },
            example_request={
                "external_reference_id": "order_1241",
                "emissions_kg": 1250.5,
                "user_email": "user@example.com"
            },
            example_response={
                "status": "success",
                "certificate_id": "cert_341abc",
                "report_sent_to": "user@example.com",
                "external_reference_id": "order_1241"
            }
        )
    ]
    
    return APIDocsResponse(
        endpoints=endpoints,
        authentication={
            "type": "API Key",
            "header": "X-API-Key",
            "description": "Include your API key in the X-API-Key header"
        },
        rate_limits={
            "emissions": "100 requests per minute",
            "offset": "50 requests per minute"
        },
        getting_started=[
            "1. Generate an API key from your dashboard",
            "2. Include the API key in the X-API-Key header",
            "3. Make requests to the endpoints with proper JSON payload",
            "4. Handle responses and errors appropriately"
        ]
    )

@router.get("/api-analytics", response_model=APIAnalyticsResponse)
async def get_api_analytics(current_user: User = Depends(get_current_user)):
    """
    Get API usage analytics for the authenticated user.
    """
    try:
        supabase = get_database()
        
        # Get usage logs for the user from both api_usage_logs and emissions table
        logs_result = supabase.table("api_usage_logs").select("*").eq("user_id", current_user.id).execute()
        api_logs = logs_result.data or []
        
        # Get API emissions from emissions table
        emissions_result = supabase.table("emissions").select("*").eq("user_id", current_user.id).eq("category", "api_external").execute()
        emission_logs = emissions_result.data or []
        
        # Combine logs - convert emission logs to match api_logs format
        combined_logs = api_logs.copy()
        for emission in emission_logs:
            combined_logs.append({
                "user_id": emission["user_id"],
                "endpoint": "/external-api/emissions",
                "timestamp": emission["date"],
                "emission_amount": emission["co2_equivalent"],
                "offset_done": emission.get("is_offset", False),
                "external_reference_id": emission.get("metadata", {}).get("external_reference_id") if emission.get("metadata") else None,
                "offset_cost": 0  # Will be calculated if offset
            })
        
        logs = combined_logs
        
        # Calculate date ranges
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Process daily usage (last 7 days)
        daily_usage = []
        for i in range(7):
            date = now - timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            
            day_logs = []
            for log in logs:
                try:
                    # Handle different timestamp formats and extract date
                    timestamp_str = log["timestamp"]
                    if timestamp_str.startswith(date_str):
                        day_logs.append(log)
                except (ValueError, TypeError):
                    continue
            
            daily_usage.append({
                "date": date_str,
                "requests": len(day_logs),
                "emissions": sum(log.get("emission_amount", 0) or 0 for log in day_logs),
                "offsets": len([log for log in day_logs if log.get("offset_done")]),
                "offset_cost": sum(log.get("offset_cost", 0) or 0 for log in day_logs)
            })
        
        # Process weekly usage (last 4 weeks)
        weekly_usage = []
        for i in range(4):
            week_start = now - timedelta(weeks=i+1)
            week_end = now - timedelta(weeks=i)
            
            week_logs = []
            for log in logs:
                try:
                    # Handle different timestamp formats
                    timestamp_str = log["timestamp"]
                    if timestamp_str.endswith("Z"):
                        timestamp_str = timestamp_str.replace("Z", "+00:00")
                    elif "+" not in timestamp_str and "Z" not in timestamp_str:
                        timestamp_str = timestamp_str + "+00:00"
                    
                    log_time = datetime.fromisoformat(timestamp_str).replace(tzinfo=None)
                    if week_start <= log_time < week_end:
                        week_logs.append(log)
                except (ValueError, TypeError):
                    continue
            
            weekly_usage.append({
                "week": f"Week {i+1}",
                "requests": len(week_logs),
                "emissions": sum(log.get("emission_amount", 0) or 0 for log in week_logs),
                "offsets": len([log for log in week_logs if log.get("offset_done")]),
                "offset_cost": sum(log.get("offset_cost", 0) or 0 for log in week_logs)
            })
        
        # Process monthly usage (last 6 months)
        monthly_usage = []
        for i in range(6):
            month_start = now.replace(day=1) - timedelta(days=32*i)
            month_start = month_start.replace(day=1)
            
            if i == 0:
                month_end = now
            else:
                month_end = now.replace(day=1) - timedelta(days=32*(i-1))
                month_end = month_end.replace(day=1)
            
            month_logs = []
            for log in logs:
                try:
                    # Handle different timestamp formats
                    timestamp_str = log["timestamp"]
                    if timestamp_str.endswith("Z"):
                        timestamp_str = timestamp_str.replace("Z", "+00:00")
                    elif "+" not in timestamp_str and "Z" not in timestamp_str:
                        timestamp_str = timestamp_str + "+00:00"
                    
                    log_time = datetime.fromisoformat(timestamp_str).replace(tzinfo=None)
                    if month_start <= log_time < month_end:
                        month_logs.append(log)
                except (ValueError, TypeError):
                    continue
            
            monthly_usage.append({
                "month": month_start.strftime("%Y-%m"),
                "requests": len(month_logs),
                "emissions": sum(log.get("emission_amount", 0) or 0 for log in month_logs),
                "offsets": len([log for log in month_logs if log.get("offset_done")]),
                "offset_cost": sum(log.get("offset_cost", 0) or 0 for log in month_logs)
            })
        
        # Calculate totals
        total_api_calls = len(logs)
        total_emissions_processed = sum(log.get("emission_amount", 0) or 0 for log in logs)
        total_offsets_performed = len([log for log in logs if log.get("offset_done")])
        total_offset_cost = sum(log.get("offset_cost", 0) or 0 for log in logs)
        
        # Get recent activity (last 10 API calls)
        recent_activity = []
        if logs:
            sorted_logs = sorted(logs, key=lambda x: x["timestamp"], reverse=True)[:10]
            for log in sorted_logs:
                recent_activity.append({
                    "endpoint": log.get("endpoint", ""),
                    "timestamp": log.get("timestamp", ""),
                    "emission_amount": log.get("emission_amount"),
                    "offset_done": log.get("offset_done", False),
                    "external_reference_id": log.get("external_reference_id")
                })
        
        return APIAnalyticsResponse(
            daily_usage=daily_usage,
            weekly_usage=weekly_usage,
            monthly_usage=monthly_usage,
            total_requests=total_api_calls,
            total_emissions_estimated=round(total_emissions_processed, 2),
            total_offsets_purchased=total_offsets_performed,
            total_offset_cost=round(total_offset_cost, 2),
            recent_activity=recent_activity
        )
        
    except Exception as e:
        logger.error(f"Error getting API analytics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error retrieving API analytics"
        )

@router.get("/api-key", response_model=APIKeyResponse)
async def get_api_key(current_user: User = Depends(get_current_user)):
    """
    Get the current API key for the authenticated user.
    """
    try:
        supabase = get_database()
        
        # Get user profile to check for existing API key
        result = supabase.table("user_profiles").select("api_key").eq("id", current_user.id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="User profile not found"
            )
        
        api_key = result.data[0].get("api_key")
        
        return APIKeyResponse(
            api_key=api_key or "",
            message="API key retrieved successfully" if api_key else "No API key found"
        )
        
    except Exception as e:
        logger.error(f"Error getting API key: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error retrieving API key"
        )

@router.get("/pending-emissions")
async def get_pending_api_emissions(current_user: User = Depends(get_current_user)):
    """
    Get API emissions that are pending offset (category = 'api_external' and not offset).
    """
    try:
        supabase = get_database()
        
        # Get emissions from API calls that are not yet offset
        emissions_result = supabase.table("emissions").select("*").eq(
            "user_id", current_user.id
        ).eq(
            "category", "api_external"
        ).is_(
            "offset_purchase_id", "null"
        ).order("date", desc=True).execute()
        
        emissions = emissions_result.data or []
        
        # Calculate total pending emissions and estimated cost
        total_emissions = sum(emission.get("co2_equivalent", 0) for emission in emissions)
        estimated_cost = (total_emissions / 1000) * 15  # $15 per ton
        
        return {
            "pending_emissions": emissions,
            "total_emissions_kg": total_emissions,
            "estimated_cost_usd": estimated_cost,
            "count": len(emissions)
        }
        
    except Exception as e:
        logger.error(f"Error getting pending API emissions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error retrieving pending emissions"
        )

@router.post("/offset-pending-emissions")
async def offset_pending_api_emissions(
    current_user: User = Depends(get_current_user),
    marketplace_service: MarketplaceService = Depends(get_marketplace_service)
):
    """
    Purchase and offset all pending API emissions.
    """
    try:
        supabase = get_database()
        
        # Get all pending API emissions
        emissions_result = supabase.table("emissions").select("*").eq(
            "user_id", current_user.id
        ).eq(
            "category", "api_external"
        ).is_(
            "offset_purchase_id", "null"
        ).execute()
        
        emissions = emissions_result.data or []
        
        if not emissions:
            return {
                "status": "no_pending_emissions",
                "message": "No pending API emissions to offset"
            }
        
        total_emissions_kg = sum(emission.get("co2_equivalent", 0) for emission in emissions)
        total_emissions_tons = total_emissions_kg / 1000
        
        # Get available carbon credits
        credits = await marketplace_service.get_available_credits()
        if not credits:
            raise HTTPException(
                status_code=400,
                detail="No carbon credits available for purchase"
            )
        
        # Use the first available credit
        credit = credits[0]
        total_cost = total_emissions_tons * float(credit.price_per_ton)
        
        # Create purchase record
        purchase_data = {
            "id": str(uuid.uuid4()),
            "user_id": str(current_user.id),
            "credit_id": str(credit.id),
            "quantity": total_emissions_tons,
            "price_per_ton": float(credit.price_per_ton),
            "total_cost": total_cost,
            "purchase_date": datetime.utcnow().isoformat(),
            "status": "completed",
            "retired_quantity": total_emissions_tons,
            "last_retirement_date": datetime.utcnow().isoformat()
        }
        
        purchase_result = supabase.table("carbon_credit_purchases").insert(purchase_data).execute()
        
        if not purchase_result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create purchase record"
            )
        
        purchase_id = purchase_result.data[0]["id"]
        
        # Update all emissions to mark them as offset
        for emission in emissions:
            supabase.table("emissions").update({
                "offset_purchase_id": purchase_id,
                "offset_date": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", emission["id"]).execute()
        
        return {
            "status": "success",
            "message": f"Successfully offset {len(emissions)} API emissions totaling {total_emissions_kg:.2f} kg CO2e",
            "purchase_id": purchase_id,
            "total_cost": total_cost,
            "emissions_count": len(emissions),
            "total_emissions_kg": total_emissions_kg
        }
        
    except Exception as e:
        logger.error(f"Error offsetting pending API emissions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing offset: {str(e)}"
        )
