"""
API Key authentication for external API access.
"""
from fastapi import Header, HTTPException, Depends
from app.db.database import get_database
from app.core.config import settings
from supabase import create_client
import logging

logger = logging.getLogger(__name__)

def get_service_database():
    """Get database connection with service role for admin operations"""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

async def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key", description="API key for authentication")):
    """
    Verify API key for external API access.
    
    Args:
        x_api_key: API key from request header
        
    Returns:
        dict: User information associated with the API key
        
    Raises:
        HTTPException: If API key is invalid or missing
    """
    try:
        # Use service role for API key verification to bypass RLS
        supabase = get_service_database()
        
        # Query user_profiles table for the API key
        response = supabase.table("user_profiles").select("*").eq("api_key", x_api_key).execute()
        
        if not response.data:
            logger.warning(f"No user found for API key: {x_api_key[:8]}...")
            raise HTTPException(
                status_code=401, 
                detail="Invalid or missing API key"
            )
        
        user = response.data[0]
        
        return user
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error verifying API key: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Error verifying API key"
        )
 