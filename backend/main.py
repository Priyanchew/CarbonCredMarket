from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from pathlib import Path
from app.core.config import settings
from app.api.v1 import auth, emissions, marketplace, ai_recommendations, reports, dashboard, carbon_estimates, offsets, external_api, api_management, seller, blockchain, health
from app.db.database import db
import logging
import time

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

# Add logging middleware for debugging authentication issues
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log auth header for debugging
    auth_header = request.headers.get("authorization")
    if auth_header and "/api/v1/" in str(request.url):
        logger.info(f"Auth header present for {request.method} {request.url.path}: {auth_header[:50]}...")
    elif "/api/v1/" in str(request.url) and request.method != "OPTIONS":
        logger.warning(f"No auth header for {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    if "/api/v1/" in str(request.url):
        logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    
    return response

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for external API access
    allow_credentials=False,  # Set to False when using allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files from frontend build
FRONTEND_DIST_PATH = Path(__file__).parent.parent / "frontend" / "dist"
API_EXAMPLE_PATH = FRONTEND_DIST_PATH / "api-example"

# Include routers first (before catch-all route)
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}")
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}")
app.include_router(emissions.router, prefix=f"{settings.API_V1_STR}")
app.include_router(marketplace.router, prefix=f"{settings.API_V1_STR}")
app.include_router(ai_recommendations.router, prefix=f"{settings.API_V1_STR}")
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}")
app.include_router(carbon_estimates.router, prefix=f"{settings.API_V1_STR}")
app.include_router(offsets.router, prefix=f"{settings.API_V1_STR}")
app.include_router(seller.router, prefix=f"{settings.API_V1_STR}")
app.include_router(blockchain.router, prefix=f"{settings.API_V1_STR}")
app.include_router(health.router, prefix=f"{settings.API_V1_STR}")

# API-as-a-Service routers
app.include_router(external_api.router, prefix="/external-api", tags=["External API"])
app.include_router(api_management.router, prefix=f"{settings.API_V1_STR}", tags=["API Management"])

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

# Static file serving (after all API routes)
if FRONTEND_DIST_PATH.exists():
    # Mount static assets
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST_PATH / "assets")), name="assets")
    
    # Serve individual HTML pages inside /api-example/ (remove the mount conflict)
    @app.get("/api-example/{page}", response_class=FileResponse)
    async def serve_api_example_page(page: str):
        target = API_EXAMPLE_PATH / f"{page}.html"
        if target.exists():
            return FileResponse(str(target))
        return FileResponse(str(FRONTEND_DIST_PATH / "index.html"))

    # Serve specific frontend routes
    @app.get("/dashboard{path:path}", response_class=FileResponse)
    async def serve_dashboard(path: str = ""):
        """Serve dashboard pages"""
        return FileResponse(str(FRONTEND_DIST_PATH / "index.html"))
    
    @app.get("/emissions{path:path}", response_class=FileResponse)
    async def serve_emissions(path: str = ""):
        """Serve emissions pages"""
        return FileResponse(str(FRONTEND_DIST_PATH / "index.html"))
    
    @app.get("/marketplace{path:path}", response_class=FileResponse)
    async def serve_marketplace(path: str = ""):
        """Serve marketplace pages"""
        return FileResponse(str(FRONTEND_DIST_PATH / "index.html"))
    
    @app.get("/reports{path:path}", response_class=FileResponse)
    async def serve_reports(path: str = ""):
        """Serve reports pages"""
        return FileResponse(str(FRONTEND_DIST_PATH / "index.html"))
    
    @app.get("/offsets{path:path}", response_class=FileResponse)
    async def serve_offsets(path: str = ""):
        """Serve offsets pages"""
        return FileResponse(str(FRONTEND_DIST_PATH / "index.html"))
    
    @app.get("/seller{path:path}", response_class=FileResponse)
    async def serve_seller(path: str = ""):
        """Serve seller pages"""
        return FileResponse(str(FRONTEND_DIST_PATH / "index.html"))
    
    @app.get("/auth{path:path}", response_class=FileResponse)
    async def serve_auth(path: str = ""):
        """Serve auth pages"""
        return FileResponse(str(FRONTEND_DIST_PATH / "index.html"))
    
    # Serve the main index.html for root and other routes
    @app.get("/", response_class=FileResponse)
    async def serve_frontend_root():
        """Serve the main frontend application"""
        return FileResponse(str(FRONTEND_DIST_PATH / "index.html"))

    # Only serve SPA for non-API routes that don't exist as static files
    @app.get("/{filename}")
    async def serve_single_files(filename: str):
        """Serve static files or SPA routes for single-level paths"""
        # Skip API-related paths
        if (filename.startswith("api") or 
            filename in ["docs", "openapi.json", "redoc", "health"] or
            filename.startswith("external-api")):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not Found")
        
        # Check if it's a static file first
        static_file = FRONTEND_DIST_PATH / filename
        if static_file.is_file():
            return FileResponse(str(static_file))
        
        # Otherwise serve index.html for SPA routing
        return FileResponse(str(FRONTEND_DIST_PATH / "index.html"))

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        db.connect()
        logger.info("Application started successfully")
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        raise

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
