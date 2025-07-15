from typing import Optional
from supabase import Client
from app.models.schemas import UserCreate, UserLogin, User, UserInDB, UserType
from app.db.database import get_database
import uuid
from datetime import datetime

class AuthService:
    def __init__(self, db: Client):
        self.db = db
    
    async def create_user(self, user_create: UserCreate, user_type: str = "buyer") -> tuple[User, str]:
        """Create a new user using Supabase Auth API and return user with Supabase token."""
        # Check if user already exists
        existing_user = self.db.table("user_profiles").select("*").eq("email", user_create.email).execute()
        if existing_user.data:
            raise ValueError("User with this email already exists")
        
        # Override the type if specified
        if user_type in ["buyer", "seller", "admin"]:
            user_create.type = UserType(user_type)
        
        # Register user with Supabase Auth (not direct insert)
        auth_response = self.db.auth.sign_up({
            "email": user_create.email,
            "password": user_create.password,
            "options": {
                "data": {
                    "company_name": user_create.company_name,
                    "industry": user_create.industry,
                    "location": user_create.location,
                    "type": user_create.type.value if user_create.type else "buyer",
                    "full_name": user_create.full_name,
                    "phone": user_create.phone
                }
            }
        })
        
        # Fix: Supabase Python client returns an object, not a dict
        if hasattr(auth_response, "error") and auth_response.error:
            raise Exception(f"Supabase Auth error: {auth_response.error}")
        session = getattr(auth_response, "session", None)
        if not session or not getattr(session, "access_token", None):
            raise Exception("No session or access_token in auth_response")
        access_token = session.access_token
        
        # Get user ID from auth response
        user_data = getattr(auth_response, "user", None)
        if not user_data or not hasattr(user_data, "id"):
            raise Exception("No user data in auth_response")
        user_id = user_data.id
        
        # Wait for trigger to create user_profiles row, then update it with correct type
        import time
        for attempt in range(10):  # Try for up to ~2 seconds
            profile = self.db.table("user_profiles").select("*").eq("email", user_create.email).execute()
            if profile.data:
                # Update the profile with the correct type if it's missing or incorrect
                profile_data = profile.data[0]
                expected_type = user_create.type.value if user_create.type else "buyer"
                if not profile_data.get("type") or profile_data.get("type") != expected_type:
                    update_data = {
                        "type": expected_type
                    }
                    
                    updated_profile = self.db.table("user_profiles").update(update_data).eq("id", profile_data["id"]).execute()
                    if updated_profile.data:
                        profile_data = updated_profile.data[0]
                
                user = User(**profile_data)
                return user, access_token
            time.sleep(0.2)
        raise Exception("User profile creation timed out. Please try again.")
    
    async def authenticate_user(self, email: str, password: str) -> Optional[tuple[User, str]]:
        """Authenticate user with Supabase Auth and return user with Supabase token."""
        try:
            # Supabase Auth sign-in
            auth_response = self.db.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            print("Supabase auth_response:", auth_response)
            if getattr(auth_response, "error", None):
                print("Supabase Auth error:", auth_response.error)
                return None
            # Get the Supabase-generated access token
            session = getattr(auth_response, "session", None)
            if not session or not getattr(session, "access_token", None):
                print("No session or access_token in auth_response:", auth_response)
                return None
            access_token = session.access_token
            # Get user ID from the auth response
            user_data = getattr(auth_response, "user", None)
            if not user_data or not hasattr(user_data, "id"):
                print("No user data in auth_response:", auth_response)
                return None
            user_id = user_data.id
            # Fetch user profile by ID (not email) to match RLS policy
            result = self.db.table("user_profiles").select("*").eq("id", user_id).execute()
            print("Supabase user_profiles result:", result)
            if not result.data:
                print("No user profile found for ID:", user_id)
                return None
            user = User(**result.data[0])
            return user, access_token
        except Exception as e:
            print("Exception in authenticate_user:", e)
            return None

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user profile by ID (for RLS compliance)."""
        result = self.db.table("user_profiles").select("*").eq("id", user_id).execute()
        if not result.data:
            return None
        return User(**result.data[0])

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user profile by email (only works if authenticated as that user due to RLS)."""
        result = self.db.table("user_profiles").select("*").eq("email", email).execute()
        if not result.data:
            return None
        return User(**result.data[0])

def get_auth_service() -> AuthService:
    """Dependency to get auth service"""
    db = get_database()
    return AuthService(db)
