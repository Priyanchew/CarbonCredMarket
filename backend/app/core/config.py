import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Configure how to load settings from environment
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore'  # Ignore extra fields in environment
    )
    
    # API Configuration
    PROJECT_NAME: str = "Carbon Credit Marketplace API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]
    
    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    
    # Carbon Emissions APIs
    CARBON_INTERFACE_API_KEY: str = ""
    COIN_GECKO_API_KEY: str = ""
    
    # Database
    DATABASE_URL: str = ""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

settings = Settings()
