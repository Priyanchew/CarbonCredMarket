"""
Authentication API endpoints for user registration and login.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import timedelta
from supabase import Client

from ...models.schemas import UserCreate, UserLogin, User, Token, AuthResponse, AuthResponseData
from ...core.dependencies import get_auth_service
from ...services.auth_service import AuthService
from ...core.security import create_credentials_exception, get_current_user
from ...core.config import settings
from ...db.database import get_database

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()


@router.post("/register", response_model=AuthResponse)
async def register(
    user_create: UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Register a new user"""
    try:
        result = await auth_service.create_user(user_create)
        user, access_token = result
        
        return AuthResponse(
            success=True,
            message="User created successfully",
            data=AuthResponseData(
                user=user,
                access_token=access_token,
                token_type="bearer"
            )
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {e}"
        )

@router.post("/register/seller", response_model=AuthResponse)
async def register_seller(
    user_create: UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Register a new seller user"""
    try:
        result = await auth_service.create_user(user_create, user_type="seller")
        user, access_token = result
        
        return AuthResponse(
            success=True,
            message="Seller account created successfully",
            data=AuthResponseData(
                user=user,
                access_token=access_token,
                token_type="bearer"
            )
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create seller account: {e}"
        )

@router.post("/register/buyer", response_model=AuthResponse)
async def register_buyer(
    user_create: UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Register a new buyer user"""
    try:
        result = await auth_service.create_user(user_create, user_type="buyer")
        user, access_token = result
        
        return AuthResponse(
            success=True,
            message="Buyer account created successfully",
            data=AuthResponseData(
                user=user,
                access_token=access_token,
                token_type="bearer"
            )
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create buyer account: {e}"
        )

@router.post("/login", response_model=AuthResponse)
async def login(
    user_login: UserLogin,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Login user"""
    try:
        result = await auth_service.authenticate_user(user_login.email, user_login.password)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user, access_token = result
        
        return AuthResponse(
            success=True,
            message="Login successful",
            data=AuthResponseData(
                user=user,
                access_token=access_token,
                token_type="bearer"
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.get("/me", response_model=User)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """Get current user information using Supabase token."""
    return current_user


@router.post("/refresh", response_model=Token)
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: User = Depends(get_current_user)
):
    """Refresh access token (Supabase: just return the current token if valid)."""
    # In Supabase, token refresh is handled on the client; just return the current token if valid
    return Token(access_token=credentials.credentials, token_type="bearer")
