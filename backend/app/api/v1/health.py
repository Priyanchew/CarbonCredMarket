"""
Authentication health check endpoint
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import logging

from app.utils.auth_monitor import auth_monitor
from app.core.user_cache import user_profile_cache
from app.utils.circuit_breaker import user_profile_circuit_breaker
from app.db.database import get_database, get_service_role_database

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/auth")
async def auth_health_check() -> Dict[str, Any]:
    """
    Comprehensive authentication health check
    Returns authentication system health metrics and status
    """
    try:
        # Get authentication metrics
        auth_metrics = await auth_monitor.get_health_metrics()
        
        # Check cache health
        cache_stats = user_profile_cache.get_stats()
        
        # Check circuit breaker status
        circuit_breaker_status = {
            "state": user_profile_circuit_breaker.state.value,
            "failure_count": user_profile_circuit_breaker.failure_count,
            "last_failure_time": user_profile_circuit_breaker.last_failure_time
        }
        
        # Test database connections
        db_health = await _check_database_health()
        
        # Calculate overall health score
        overall_health_score = _calculate_health_score(
            auth_metrics["overall_health"]["success_rate_percent"],
            db_health["regular_client_healthy"],
            db_health["service_role_healthy"],
            circuit_breaker_status["state"] == "closed"
        )
        
        return {
            "status": "healthy" if overall_health_score >= 80 else "degraded" if overall_health_score >= 60 else "unhealthy",
            "health_score": overall_health_score,
            "timestamp": auth_metrics["overall_health"],
            "authentication": auth_metrics,
            "cache": {
                "status": "healthy" if cache_stats["hit_rate"] > 0.3 else "degraded",
                "stats": cache_stats
            },
            "circuit_breaker": {
                "status": "healthy" if circuit_breaker_status["state"] == "closed" else "degraded",
                "details": circuit_breaker_status
            },
            "database": db_health,
            "recommendations": _generate_recommendations(auth_metrics, cache_stats, circuit_breaker_status)
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

async def _check_database_health() -> Dict[str, Any]:
    """Check database connection health"""
    health_status = {
        "regular_client_healthy": False,
        "service_role_healthy": False,
        "regular_client_error": None,
        "service_role_error": None
    }
    
    # Test regular client
    try:
        db = get_database()
        # Simple query to test connection
        result = db.table("user_profiles").select("id").limit(1).execute()
        health_status["regular_client_healthy"] = True
    except Exception as e:
        health_status["regular_client_error"] = str(e)
    
    # Test service role client
    try:
        service_db = get_service_role_database()
        result = service_db.table("user_profiles").select("id").limit(1).execute()
        health_status["service_role_healthy"] = True
    except Exception as e:
        health_status["service_role_error"] = str(e)
    
    return health_status

def _calculate_health_score(
    success_rate: float,
    regular_client_healthy: bool,
    service_role_healthy: bool,
    circuit_breaker_closed: bool
) -> int:
    """Calculate overall health score (0-100)"""
    score = 0
    
    # Success rate contributes 40% of score
    score += (success_rate / 100) * 40
    
    # Database connections contribute 30% of score
    if regular_client_healthy:
        score += 20
    if service_role_healthy:
        score += 10
    
    # Circuit breaker state contributes 20% of score
    if circuit_breaker_closed:
        score += 20
    
    # Fallback availability contributes 10% of score
    if regular_client_healthy or service_role_healthy:
        score += 10
    
    return min(100, max(0, int(score)))

def _generate_recommendations(
    auth_metrics: Dict,
    cache_stats: Dict,
    circuit_breaker_status: Dict
) -> List[str]:
    """Generate operational recommendations based on health metrics"""
    recommendations = []
    
    success_rate = auth_metrics["overall_health"]["success_rate_percent"]
    
    if success_rate < 95:
        recommendations.append("🔍 Investigate authentication failures - success rate below 95%")
    
    if success_rate < 80:
        recommendations.append("🚨 URGENT: Authentication success rate critically low - check database connectivity")
    
    if cache_stats["hit_rate"] < 0.5:
        recommendations.append("📈 Consider increasing cache TTL or investigating cache invalidation patterns")
    
    if circuit_breaker_status["state"] != "closed":
        recommendations.append("⚡ Circuit breaker is open/half-open - database queries are being blocked")
    
    # Check strategy usage patterns
    strategy_performance = auth_metrics.get("strategy_performance", {})
    regular_client_rate = strategy_performance.get("regular_client", {}).get("success_rate", 100)
    
    if regular_client_rate < 90:
        recommendations.append("🔧 Regular database client having issues - consider connection pool tuning")
    
    fallback_usage = (
        strategy_performance.get("service_role", {}).get("attempts", 0) +
        strategy_performance.get("fresh_client", {}).get("attempts", 0)
    )
    
    if fallback_usage > 10:
        recommendations.append("⚠️ High fallback strategy usage - investigate primary client reliability")
    
    if len(auth_metrics.get("recent_failures", [])) > 5:
        recommendations.append("📊 Multiple recent failures - check application logs for patterns")
    
    return recommendations

@router.get("/auth/quick")
async def quick_auth_health() -> Dict[str, str]:
    """Quick authentication health check for load balancers"""
    try:
        # Quick cache test
        await user_profile_cache.get("health-check-key")
        
        # Quick database test
        db = get_database()
        db.table("user_profiles").select("id").limit(1).execute()
        
        return {"status": "healthy"}
        
    except Exception as e:
        logger.error(f"Quick health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}
