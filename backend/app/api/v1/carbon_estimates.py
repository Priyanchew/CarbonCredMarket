"""
Carbon Estimation API endpoints using Carbon Interface.
Supports electricity, flight, and shipping estimates.
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ...core.security import get_current_user
from ...services.carbon_interface_service import get_carbon_interface_service, CarbonInterfaceService
from ...models.schemas import User

router = APIRouter(prefix="/carbon-estimates", tags=["carbon-estimates"])


# Request Models
class ElectricityEstimateRequest(BaseModel):
    electricity_value: float = Field(..., gt=0, description="Amount of electricity consumed")
    electricity_unit: str = Field("kwh", description="Unit of measurement (kwh, mwh)")
    country: str = Field("us", description="ISO 3166 country code")
    state: Optional[str] = Field(None, description="State/province code (for US/Canada)")


class FlightLeg(BaseModel):
    departure_airport: str = Field(..., description="IATA airport code (e.g., SFO)")
    destination_airport: str = Field(..., description="IATA airport code (e.g., LAX)")


class FlightEstimateRequest(BaseModel):
    passengers: int = Field(..., gt=0, description="Number of passengers")
    legs: List[FlightLeg] = Field(..., min_items=1, description="Flight legs")
    distance_unit: str = Field("km", description="Distance unit (km, mi)")


class ShippingEstimateRequest(BaseModel):
    weight_value: float = Field(..., gt=0, description="Weight of the shipment")
    weight_unit: str = Field(..., description="Weight unit (g, kg, lb, mt)")
    distance_value: float = Field(..., gt=0, description="Distance of shipment")
    distance_unit: str = Field(..., description="Distance unit (km, mi)")
    transport_method: str = Field("truck", description="Transport method (truck, train, ship, plane)")



class ComprehensiveEstimateRequest(BaseModel):
    activity_type: str = Field(..., description="Type of activity (electricity, flight, shipping)")
    activity_data: Dict[str, Any] = Field(..., description="Activity-specific parameters")


# API Endpoints
@router.post("/electricity", response_model=Dict[str, Any])
async def estimate_electricity_emissions(
    request: ElectricityEstimateRequest,
    current_user: User = Depends(get_current_user),
    carbon_service: CarbonInterfaceService = Depends(get_carbon_interface_service)
):
    """Estimate carbon emissions for electricity consumption."""
    return await carbon_service.estimate_electricity(
        electricity_value=request.electricity_value,
        electricity_unit=request.electricity_unit,
        country=request.country,
        state=request.state
    )


@router.post("/flight", response_model=Dict[str, Any])
async def estimate_flight_emissions(
    request: FlightEstimateRequest,
    current_user: User = Depends(get_current_user),
    carbon_service: CarbonInterfaceService = Depends(get_carbon_interface_service)
):
    """Estimate carbon emissions for flight travel."""
    legs = [leg.dict() for leg in request.legs]
    return await carbon_service.estimate_flight(
        passengers=request.passengers,
        legs=legs,
        distance_unit=request.distance_unit
    )


@router.post("/shipping", response_model=Dict[str, Any])
async def estimate_shipping_emissions(
    request: ShippingEstimateRequest,
    current_user: User = Depends(get_current_user),
    carbon_service: CarbonInterfaceService = Depends(get_carbon_interface_service)
):
    """Estimate carbon emissions for shipping/freight."""
    return await carbon_service.estimate_shipping(
        weight_value=request.weight_value,
        weight_unit=request.weight_unit,
        distance_value=request.distance_value,
        distance_unit=request.distance_unit,
        transport_method=request.transport_method
    )




@router.post("/comprehensive", response_model=Dict[str, Any])
async def estimate_comprehensive_emissions(
    request: ComprehensiveEstimateRequest,
    current_user: User = Depends(get_current_user),
    carbon_service: CarbonInterfaceService = Depends(get_carbon_interface_service)
):
    """Comprehensive carbon emission estimation for any supported activity type."""
    return await carbon_service.estimate_comprehensive(
        activity_type=request.activity_type,
        activity_data=request.activity_data
    )


@router.get("/estimate/{estimate_id}", response_model=Dict[str, Any])
async def get_estimate(
    estimate_id: str,
    current_user: User = Depends(get_current_user),
    carbon_service: CarbonInterfaceService = Depends(get_carbon_interface_service)
):
    """Retrieve a specific estimate by ID."""
    return await carbon_service.get_estimate(estimate_id)


@router.get("/supported-activities", response_model=Dict[str, Any])
async def get_supported_activities(
    current_user: User = Depends(get_current_user)
):
    """Get information about supported activity types and their parameters."""
    return {
        "supported_activities": {
            "electricity": {
                "description": "Electricity consumption emissions",
                "required_params": ["electricity_value", "electricity_unit"],
                "optional_params": ["country", "state"],
                "units": {
                    "electricity_unit": ["kwh", "mwh"],
                    "country": "ISO 3166 country codes",
                    "state": "State/province codes (US/Canada)"
                }
            },
            "flight": {
                "description": "Flight travel emissions",
                "required_params": ["passengers", "legs"],
                "optional_params": ["distance_unit"],
                "units": {
                    "distance_unit": ["km", "mi"],
                    "legs": "Array of {departure_airport, destination_airport} with IATA codes"
                }
            },
            "shipping": {
                "description": "Shipping/freight emissions",
                "required_params": ["weight_value", "weight_unit", "distance_value", "distance_unit"],
                "optional_params": ["transport_method"],
                "units": {
                    "weight_unit": ["g", "kg", "lb", "mt"],
                    "distance_unit": ["km", "mi"],
                    "transport_method": ["truck", "train", "ship", "plane"]
                }
            }
        }
    }
