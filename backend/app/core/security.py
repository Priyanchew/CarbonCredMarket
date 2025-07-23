from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
import asyncio

from app.core.config import settings
from app.models.schemas import User
from app.db.database import get_database
from app.core.auth_queue import auth_queue
from app.core.user_cache import user_profile_cache
from app.utils.circuit_breaker import user_profile_circuit_breaker
from app.utils.auth_monitor import auth_monitor, AuthStrategy

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
    """Get current authenticated user using Supabase token verification with multiple fallback strategies."""
    token = credentials.credentials
    
    # First, verify the token to get the user ID
    try:
        user_response = db.auth.get_user(token)
        user_obj = getattr(user_response, "user", None)
        if not user_obj or not hasattr(user_obj, "id"):
            print(f"Invalid user object in token response")
            raise create_credentials_exception()
        user_id = user_obj.id
    except Exception as e:
        print(f"Token verification failed at Supabase level: {e}")
        raise create_credentials_exception()
    
    # Use auth queue to handle concurrent requests for the same user
    async def fetch_user_profile():
        print(f"Attempting to verify token for user ID: {user_id}")
        
        # Strategy 0: Check cache first
        async with auth_monitor.measure_duration(user_id, AuthStrategy.CACHE):
            cached_data = await user_profile_cache.get(user_id)
            if cached_data:
                print(f"🚀 Cache hit for user: {cached_data.get('email')}")
                return await finalize_user_model(cached_data, db)
        
        # Strategy 1: Try with regular client (with retry)
        async with auth_monitor.measure_duration(user_id, AuthStrategy.REGULAR_CLIENT):
            user_data = await try_regular_client_lookup(db, user_id)
            if user_data:
                await user_profile_cache.set(user_id, user_data)  # Cache successful lookup
                return await finalize_user_model(user_data, db)
        
        # Strategy 2: Fallback to service role client
        print("🔑 Regular client failed, trying service role fallback...")
        async with auth_monitor.measure_duration(user_id, AuthStrategy.SERVICE_ROLE):
            user_data = await try_service_role_lookup(user_id)
            if user_data:
                await user_profile_cache.set(user_id, user_data)  # Cache successful lookup
                return await finalize_user_model(user_data, None, use_service_role=True)
        
        # Strategy 3: Last resort - create new client and try again
        print("🆘 Service role failed, trying fresh client connection...")
        async with auth_monitor.measure_duration(user_id, AuthStrategy.FRESH_CLIENT):
            user_data = await try_fresh_client_lookup(user_id)
            if user_data:
                await user_profile_cache.set(user_id, user_data)  # Cache successful lookup
                return await finalize_user_model(user_data, None, use_service_role=True)
        
        print(f"❌ All fallback strategies failed for user_id: {user_id}")
        raise create_credentials_exception()
    
    try:
        return await auth_queue.process_auth_request(user_id, fetch_user_profile)
    except HTTPException:
        # Re-raise HTTPExceptions (like credentials exceptions) as-is
        raise
    except Exception as e:
        print(f"Token verification failed in auth queue: {e}")
        raise create_credentials_exception()

async def try_regular_client_lookup(db: Client, user_id: str) -> Optional[Dict[str, Any]]:
    """Try to fetch user profile with regular client (with circuit breaker and retry logic)"""
    
    @user_profile_circuit_breaker
    async def _query_with_circuit_breaker():
        max_retries = 2
        retry_delay = 0.1
        
        for attempt in range(max_retries):
            try:
                print(f"Regular client lookup attempt {attempt + 1}")
                result = db.table("user_profiles").select("*").eq("id", user_id).execute()
                
                if result.data:
                    user_data = result.data[0]
                    print(f"✅ Regular client SUCCESS: {user_data.get('email')}")
                    return user_data
                else:
                    print(f"❌ Regular client returned no data (attempt {attempt + 1})")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2
                        
            except Exception as e:
                print(f"❌ Regular client error (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    raise  # Re-raise the last exception for circuit breaker
        return None
    
    try:
        return await _query_with_circuit_breaker()
    except Exception as e:
        print(f"🔴 Circuit breaker blocked regular client or all retries failed: {e}")
        return None

async def try_service_role_lookup(user_id: str) -> Optional[Dict[str, Any]]:
    """Try to fetch user profile with service role client (with circuit breaker)"""
    
    @user_profile_circuit_breaker
    async def _query_with_service_role():
        from app.db.database import get_service_role_database
        service_db = get_service_role_database()
        
        print("Executing service role query...")
        result = service_db.table("user_profiles").select("*").eq("id", user_id).execute()
        
        if result.data:
            user_data = result.data[0]
            print(f"✅ Service role SUCCESS: {user_data.get('email')}")
            return user_data
        else:
            print("❌ Service role returned no data")
            return None
    
    try:
        return await _query_with_service_role()
    except Exception as e:
        print(f"🔴 Circuit breaker blocked service role or query failed: {e}")
        return None

async def try_fresh_client_lookup(user_id: str) -> Optional[Dict[str, Any]]:
    """Try to fetch user profile with a completely fresh client connection (with circuit breaker)"""
    
    @user_profile_circuit_breaker
    async def _query_with_fresh_client():
        from supabase import create_client
        from app.core.config import settings
        
        print("Creating fresh service role client...")
        fresh_db = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        
        result = fresh_db.table("user_profiles").select("*").eq("id", user_id).execute()
        
        if result.data:
            user_data = result.data[0]
            print(f"✅ Fresh client SUCCESS: {user_data.get('email')}")
            return user_data
        else:
            print("❌ Fresh client returned no data")
            return None
    
    try:
        return await _query_with_fresh_client()
    except Exception as e:
        print(f"🔴 Circuit breaker blocked fresh client or query failed: {e}")
        return None

async def finalize_user_model(user_data: Dict[str, Any], db: Optional[Client] = None, use_service_role: bool = False) -> User:
    """Finalize user model creation with seller verification if needed"""
    try:
        # If user is a seller, fetch their verification data
        if user_data.get("type") == "seller":
            verification_data = None
            
            # Try to get seller verification with the appropriate client
            if use_service_role or not db:
                try:
                    from app.db.database import get_service_role_database
                    service_db = get_service_role_database()
                    verification_result = service_db.table("seller_verifications").select("*").eq("user_id", user_data["id"]).execute()
                    if verification_result.data:
                        verification_data = verification_result.data[0]
                except Exception as e:
                    print(f"⚠️ Failed to fetch seller verification with service role: {e}")
            else:
                try:
                    verification_result = db.table("seller_verifications").select("*").eq("user_id", user_data["id"]).execute()
                    if verification_result.data:
                        verification_data = verification_result.data[0]
                except Exception as e:
                    print(f"⚠️ Failed to fetch seller verification with regular client: {e}")
            
            user_data["seller_verification"] = verification_data
        else:
            # Non-sellers don't have verification
            user_data["seller_verification"] = None
        
        print(f"About to create User model with data: {user_data}")
        user_model = User(**user_data)
        print(f"✅ User model created successfully: {user_model.email}")
        return user_model
        
    except Exception as e:
        print(f"❌ Failed to create User model: {e}")
        raise create_credentials_exception()
