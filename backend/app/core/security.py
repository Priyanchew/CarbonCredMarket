from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client

from app.core.config import settings
from app.models.schemas import User
from app.db.database import get_database

def verify_supabase_token(token: str, db: Client) -> Optional[str]:
    """Verify Supabase JWT token and return user email"""
    try:
        # Use Supabase client to verify the token
        user_response = db.auth.get_user(token)
        # Fix: Supabase Python client returns an object, not a dict
        if hasattr(user_response, "error") and user_response.error:
            return None
        # user_response.user is the user object
        user_obj = getattr(user_response, "user", None)
        if not user_obj or not hasattr(user_obj, "email"):
            return None
        return user_obj.email
    except Exception as e:
        print("Exception in verify_supabase_token:", e)
        return None

def create_credentials_exception():
    """Create credentials exception"""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

# Security setup
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_database)
) -> User:
    """Get current authenticated user using Supabase token verification."""
    token = credentials.credentials
    email = verify_supabase_token(token, db)
    if email is None:
        raise create_credentials_exception()
    
    # Get user profile from user_profiles table
    result = db.table("user_profiles").select("*").eq("email", email).execute()
    if not result.data:
        raise create_credentials_exception()
    
    user_data = result.data[0]
    
    # If user is a seller, fetch their verification data
    if user_data.get("type") == "seller":
        verification_result = db.table("seller_verifications").select("*").eq("user_id", user_data["id"]).execute()
        if verification_result.data:
            # Add seller_verification to user data
            user_data["seller_verification"] = verification_result.data[0]
        else:
            # Set to None if no verification found
            user_data["seller_verification"] = None
    else:
        # Non-sellers don't have verification
        user_data["seller_verification"] = None
    
    return User(**user_data)
