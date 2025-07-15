from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, emissions, marketplace, ai_recommendations, reports, dashboard, documents, carbon_estimates, offsets, external_api, api_management, seller, blockchain
from app.db.database import db
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="A modern carbon credit marketplace API for companies to track and offset their emissions",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}")
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}")
app.include_router(emissions.router, prefix=f"{settings.API_V1_STR}")
app.include_router(marketplace.router, prefix=f"{settings.API_V1_STR}")
app.include_router(ai_recommendations.router, prefix=f"{settings.API_V1_STR}")
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}")
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}")
app.include_router(carbon_estimates.router, prefix=f"{settings.API_V1_STR}")
app.include_router(offsets.router, prefix=f"{settings.API_V1_STR}")
app.include_router(seller.router, prefix=f"{settings.API_V1_STR}")
app.include_router(blockchain.router, prefix=f"{settings.API_V1_STR}")

# API-as-a-Service routers
app.include_router(external_api.router, prefix="/external-api", tags=["External API"])
app.include_router(api_management.router, prefix=f"{settings.API_V1_STR}", tags=["API Management"])

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        db.connect()
        logger.info("Application started successfully")
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        raise

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Carbon Credit Marketplace API",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
