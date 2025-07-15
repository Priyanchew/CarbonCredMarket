"""
Carbon Interface API service for calculating carbon emissions.
Supports electricity, flight, and shipping estimates.
"""
import httpx
from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from app.core.config import settings
from datetime import datetime

class CarbonInterfaceService:
    def __init__(self):
        self.base_url = "https://www.carboninterface.com/api/v1"
        self.api_key = settings.CARBON_INTERFACE_API_KEY
        
        if not self.api_key:
            raise ValueError("CARBON_INTERFACE_API_KEY not configured")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get API headers with authorization."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to Carbon Interface API."""
        url = f"{self.base_url}/{endpoint}"
        headers = self._get_headers()
        
        async with httpx.AsyncClient() as client:
            try:
                if method.upper() == "GET":
                    response = await client.get(url, headers=headers)
                elif method.upper() == "POST":
                    response = await client.post(url, headers=headers, json=data)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")
                
                response.raise_for_status()
                return response.json()
                
            except httpx.HTTPStatusError as e:
                raise HTTPException(
                    status_code=e.response.status_code,
                    detail=f"Carbon Interface API error: {e.response.text}"
                )
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to connect to Carbon Interface API: {str(e)}"
                )
    
    async def get_estimate(self, estimate_id: str) -> Dict[str, Any]:
        """Retrieve a specific estimate by ID."""
        return await self._make_request("GET", f"estimates/{estimate_id}")
    
    async def estimate_electricity(
        self,
        electricity_value: float,
        electricity_unit: str = "kwh",
        country: str = "us",
        state: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Estimate carbon emissions for electricity consumption.
        
        Args:
            electricity_value: Amount of electricity consumed
            electricity_unit: Unit of measurement (kwh, mwh)
            country: ISO 3166 country code (default: us)
            state: State/province code (for US/Canada)
        """
        data = {
            "type": "electricity",
            "electricity_unit": electricity_unit,
            "electricity_value": str(electricity_value),
            "country": country
        }
        
        if state:
            data["state"] = state
            
        response = await self._make_request("POST", "estimates", data)
        return self._format_estimate_response(response, "electricity")
    
    async def estimate_flight(
        self,
        passengers: int,
        legs: List[Dict[str, str]],
        distance_unit: str = "km"
    ) -> Dict[str, Any]:
        """
        Estimate carbon emissions for flight travel.
        
        Args:
            passengers: Number of passengers
            legs: List of flight legs with departure_airport and destination_airport
            distance_unit: Unit for distance (km, mi)
        """
        data = {
            "type": "flight",
            "passengers": passengers,
            "legs": legs,
            "distance_unit": distance_unit
        }
        
        response = await self._make_request("POST", "estimates", data)
        return self._format_estimate_response(response, "flight")
    
    async def estimate_shipping(
        self,
        weight_value: float,
        weight_unit: str,
        distance_value: float,
        distance_unit: str,
        transport_method: str = "truck"
    ) -> Dict[str, Any]:
        """
        Estimate carbon emissions for shipping/freight.
        
        Args:
            weight_value: Weight of the shipment
            weight_unit: Weight unit (g, kg, lb, mt)
            distance_value: Distance of shipment
            distance_unit: Distance unit (km, mi)
            transport_method: Method of transport (truck, train, ship, plane)
        """
        data = {
            "type": "shipping",
            "weight_value": str(weight_value),
            "weight_unit": weight_unit,
            "distance_value": str(distance_value),
            "distance_unit": distance_unit,
            "transport_method": transport_method
        }
        
        response = await self._make_request("POST", "estimates", data)
        return self._format_estimate_response(response, "shipping")
  
    
    def _format_estimate_response(self, response: Dict[str, Any], estimate_type: str) -> Dict[str, Any]:
        """Format the API response into a standardized format."""
        data = response.get("data", {})
        attributes = data.get("attributes", {})
        
        # Extract carbon measurements
        carbon_measurements = {
            "carbon_g": attributes.get("carbon_g", 0),
            "carbon_kg": attributes.get("carbon_kg", 0),
            "carbon_lb": attributes.get("carbon_lb", 0),
            "carbon_mt": attributes.get("carbon_mt", 0)
        }
        
        # Build result
        result = {
            "id": data.get("id"),
            "type": estimate_type,
            "estimated_at": attributes.get("estimated_at"),
            "carbon_emissions": carbon_measurements,
            "carbon_kg": carbon_measurements["carbon_kg"],  # Primary measurement
            "raw_response": attributes
        }
        
        # Add type-specific details
        if estimate_type == "electricity":
            result["details"] = {
                "electricity_value": attributes.get("electricity_value"),
                "electricity_unit": attributes.get("electricity_unit"),
                "country": attributes.get("country"),
                "state": attributes.get("state")
            }
        elif estimate_type == "flight":
            result["details"] = {
                "passengers": attributes.get("passengers"),
                "legs": attributes.get("legs", [])
            }
        elif estimate_type == "shipping":
            result["details"] = {
                "weight_value": attributes.get("weight_value"),
                "weight_unit": attributes.get("weight_unit"),
                "distance_value": attributes.get("distance_value"),
                "distance_unit": attributes.get("distance_unit"),
                "transport_method": attributes.get("transport_method")
            }
        
        return result
    
    async def estimate_comprehensive(
        self,
        activity_type: str,
        activity_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Comprehensive estimation method that routes to appropriate estimate function.
        
        Args:
            activity_type: Type of activity (electricity, flight, shipping)
            activity_data: Dictionary containing activity-specific parameters
        """
        try:
            if activity_type == "electricity":
                return await self.estimate_electricity(**activity_data)
            elif activity_type == "flight":
                return await self.estimate_flight(**activity_data)
            elif activity_type == "shipping":
                return await self.estimate_shipping(**activity_data)
            else:
                raise ValueError(f"Unsupported activity type: {activity_type}")
                
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to estimate {activity_type}: {str(e)}"
            )
    



def get_carbon_interface_service() -> CarbonInterfaceService:
    """Dependency to get Carbon Interface service."""
    return CarbonInterfaceService()
