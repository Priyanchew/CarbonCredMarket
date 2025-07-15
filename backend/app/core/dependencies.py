"""
FastAPI dependency injection for services.
"""
from functools import lru_cache
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client

from ..db.database import get_database, db
from ..services.auth_service import AuthService
from ..services.emission_service import EmissionService
from ..services.marketplace_service import MarketplaceService
from ..services.ai_service import AIRecommendationService
from ..services.report_service import ReportService
from ..services.seller_service import SellerService
from ..core.security import get_current_user
from ..models.schemas import User

security = HTTPBearer()

def get_user_db_client(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Client:
    """Get Supabase client with user token for RLS"""
    token = credentials.credentials
    return db.get_client_with_token(token)

def get_auth_service(db: Client = Depends(get_database)) -> AuthService:
    return AuthService(db)

def get_emission_service(db: Client = Depends(get_user_db_client), user: User = Depends(get_current_user)) -> EmissionService:
    return EmissionService(db)

def get_marketplace_service(db: Client = Depends(get_user_db_client), user: User = Depends(get_current_user)) -> MarketplaceService:
    return MarketplaceService(db)

def get_ai_service(db: Client = Depends(get_user_db_client), user: User = Depends(get_current_user)) -> AIRecommendationService:
    return AIRecommendationService(db)

def get_report_service(db: Client = Depends(get_user_db_client), user: User = Depends(get_current_user)) -> ReportService:
    return ReportService(db)

def get_seller_service(db: Client = Depends(get_user_db_client), user: User = Depends(get_current_user)) -> SellerService:
    return SellerService(db)
