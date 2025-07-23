"""
Authentication monitoring and metrics collection for fallback strategies
"""
import time
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class AuthStrategy(Enum):
    CACHE = "cache"
    REGULAR_CLIENT = "regular_client"
    SERVICE_ROLE = "service_role"
    FRESH_CLIENT = "fresh_client"

@dataclass
class AuthAttempt:
    user_id: str
    strategy: AuthStrategy
    success: bool
    duration_ms: float
    timestamp: datetime = field(default_factory=datetime.now)
    error_message: Optional[str] = None

class AuthMonitor:
    def __init__(self, max_history: int = 1000):
        self.max_history = max_history
        self.attempts: List[AuthAttempt] = []
        self.strategy_stats: Dict[AuthStrategy, Dict[str, float]] = {
            strategy: {"success": 0, "failure": 0, "total_time_ms": 0.0}
            for strategy in AuthStrategy
        }
        self._lock = asyncio.Lock()
    
    async def record_attempt(
        self,
        user_id: str,
        strategy: AuthStrategy,
        success: bool,
        duration_ms: float,
        error_message: Optional[str] = None
    ):
        """Record an authentication attempt"""
        async with self._lock:
            attempt = AuthAttempt(
                user_id=user_id,
                strategy=strategy,
                success=success,
                duration_ms=duration_ms,
                error_message=error_message
            )
            
            self.attempts.append(attempt)
            
            # Update strategy statistics
            if success:
                self.strategy_stats[strategy]["success"] += 1
            else:
                self.strategy_stats[strategy]["failure"] += 1
            
            self.strategy_stats[strategy]["total_time_ms"] += duration_ms
            
            # Keep only recent attempts
            if len(self.attempts) > self.max_history:
                self.attempts = self.attempts[-self.max_history:]
            
            # Log significant events
            if not success and strategy == AuthStrategy.FRESH_CLIENT:
                logger.error(f"🚨 All auth fallback strategies failed for user {user_id}: {error_message}")
            elif success and strategy != AuthStrategy.CACHE:
                logger.warning(f"⚠️ Auth required fallback to {strategy.value} for user {user_id}")
    
    async def get_health_metrics(self) -> Dict:
        """Get authentication health metrics"""
        async with self._lock:
            now = datetime.now()
            last_hour = now - timedelta(hours=1)
            last_5_min = now - timedelta(minutes=5)
            
            recent_attempts = [a for a in self.attempts if a.timestamp >= last_hour]
            very_recent_attempts = [a for a in self.attempts if a.timestamp >= last_5_min]
            
            total_attempts = len(recent_attempts)
            successful_attempts = len([a for a in recent_attempts if a.success])
            
            # Calculate success rate
            success_rate = (successful_attempts / total_attempts * 100) if total_attempts > 0 else 100
            
            # Strategy breakdown
            strategy_breakdown = {}
            for strategy in AuthStrategy:
                strategy_attempts = [a for a in recent_attempts if a.strategy == strategy]
                strategy_successes = [a for a in strategy_attempts if a.success]
                
                strategy_breakdown[strategy.value] = {
                    "attempts": len(strategy_attempts),
                    "successes": len(strategy_successes),
                    "success_rate": (len(strategy_successes) / len(strategy_attempts) * 100) if strategy_attempts else 0,
                    "avg_duration_ms": (
                        sum(a.duration_ms for a in strategy_attempts) / len(strategy_attempts)
                        if strategy_attempts else 0
                    )
                }
            
            # Recent failures
            recent_failures = [
                {
                    "user_id": a.user_id,
                    "strategy": a.strategy.value,
                    "error": a.error_message,
                    "timestamp": a.timestamp.isoformat()
                }
                for a in very_recent_attempts if not a.success
            ]
            
            return {
                "overall_health": {
                    "success_rate_percent": round(success_rate, 2),
                    "total_attempts_last_hour": total_attempts,
                    "successful_attempts_last_hour": successful_attempts,
                    "failed_attempts_last_hour": total_attempts - successful_attempts
                },
                "strategy_performance": strategy_breakdown,
                "recent_failures": recent_failures[-10:],  # Last 10 failures
                "alerts": self._generate_alerts(success_rate, strategy_breakdown)
            }
    
    def _generate_alerts(self, success_rate: float, strategy_breakdown: Dict) -> List[str]:
        """Generate health alerts based on metrics"""
        alerts = []
        
        if success_rate < 95:
            alerts.append(f"🚨 Low success rate: {success_rate:.1f}%")
        
        if success_rate < 80:
            alerts.append("🚨 CRITICAL: Authentication success rate below 80%")
        
        # Check if cache hit rate is too low
        cache_attempts = strategy_breakdown.get("cache", {}).get("attempts", 0)
        total_attempts = sum(s.get("attempts", 0) for s in strategy_breakdown.values())
        
        if total_attempts > 0:
            cache_hit_rate = (cache_attempts / total_attempts) * 100
            if cache_hit_rate < 50:
                alerts.append(f"⚠️ Low cache hit rate: {cache_hit_rate:.1f}%")
        
        # Check if we're relying too much on fallbacks
        fallback_attempts = sum(
            strategy_breakdown.get(strategy, {}).get("attempts", 0)
            for strategy in ["service_role", "fresh_client"]
        )
        
        if total_attempts > 0 and fallback_attempts > 0:
            fallback_rate = (fallback_attempts / total_attempts) * 100
            if fallback_rate > 20:
                alerts.append(f"⚠️ High fallback usage: {fallback_rate:.1f}%")
        
        return alerts

    def measure_duration(self, user_id: str, strategy: AuthStrategy):
        """Context manager to measure authentication attempt duration"""
        return AuthDurationMeasurer(self, user_id, strategy)

class AuthDurationMeasurer:
    def __init__(self, monitor: AuthMonitor, user_id: str, strategy: AuthStrategy):
        self.monitor = monitor
        self.user_id = user_id
        self.strategy = strategy
        self.start_time = None
        self.success = False
        self.error_message = None
    
    async def __aenter__(self):
        self.start_time = time.time()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.start_time is None:
            return False
            
        duration_ms = (time.time() - self.start_time) * 1000
        
        if exc_type is None:
            self.success = True
        else:
            self.success = False
            self.error_message = str(exc_val) if exc_val else "Unknown error"
        
        await self.monitor.record_attempt(
            user_id=self.user_id,
            strategy=self.strategy,
            success=self.success,
            duration_ms=duration_ms,
            error_message=self.error_message
        )
        
        # Don't suppress exceptions
        return False

# Global auth monitor instance
auth_monitor = AuthMonitor()
