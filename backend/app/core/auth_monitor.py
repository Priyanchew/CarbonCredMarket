"""
Authentication health monitor to track success rates and detect patterns
"""
import time
from typing import Dict, List, Optional
from collections import defaultdict, deque
import logging

logger = logging.getLogger(__name__)

class AuthHealthMonitor:
    def __init__(self, window_size: int = 100):
        self.window_size = window_size
        self.success_history: deque = deque(maxlen=window_size)
        self.failure_history: deque = deque(maxlen=window_size)
        self.method_stats = defaultdict(lambda: {"success": 0, "failure": 0})
        self.user_stats = defaultdict(lambda: {"success": 0, "failure": 0})
        
    def record_success(self, user_id: str, method: str = "regular"):
        """Record a successful authentication"""
        timestamp = time.time()
        self.success_history.append({"user_id": user_id, "method": method, "timestamp": timestamp})
        self.method_stats[method]["success"] += 1
        self.user_stats[user_id]["success"] += 1
        
        logger.info(f"Auth success for user {user_id[:8]}... via {method}")
        
    def record_failure(self, user_id: str, method: str = "regular", error: str = ""):
        """Record a failed authentication"""
        timestamp = time.time()
        self.failure_history.append({
            "user_id": user_id, 
            "method": method, 
            "timestamp": timestamp,
            "error": error
        })
        self.method_stats[method]["failure"] += 1
        self.user_stats[user_id]["failure"] += 1
        
        logger.warning(f"Auth failure for user {user_id[:8]}... via {method}: {error}")
        
    def get_success_rate(self, method: Optional[str] = None) -> float:
        """Get overall success rate or for a specific method"""
        if method:
            stats = self.method_stats[method]
            total = stats["success"] + stats["failure"]
            return stats["success"] / total if total > 0 else 0.0
        else:
            total_success = sum(len(self.success_history) for _ in [None])
            total_failure = sum(len(self.failure_history) for _ in [None])
            total = total_success + total_failure
            return total_success / total if total > 0 else 0.0
    
    def get_recent_failures(self, minutes: int = 5) -> List[Dict]:
        """Get recent failures within the specified time window"""
        cutoff_time = time.time() - (minutes * 60)
        return [
            failure for failure in self.failure_history 
            if failure["timestamp"] > cutoff_time
        ]
    
    def get_stats_summary(self) -> Dict:
        """Get comprehensive statistics summary"""
        total_success = len(self.success_history)
        total_failure = len(self.failure_history)
        total_requests = total_success + total_failure
        
        success_rate = total_success / total_requests if total_requests > 0 else 0.0
        
        # Method breakdown
        method_breakdown = {}
        for method, stats in self.method_stats.items():
            method_total = stats["success"] + stats["failure"]
            method_breakdown[method] = {
                "success_rate": stats["success"] / method_total if method_total > 0 else 0.0,
                "total_requests": method_total,
                "success_count": stats["success"],
                "failure_count": stats["failure"]
            }
        
        # Recent activity
        recent_failures = self.get_recent_failures(5)
        
        return {
            "overall_success_rate": success_rate,
            "total_requests": total_requests,
            "success_count": total_success,
            "failure_count": total_failure,
            "method_breakdown": method_breakdown,
            "recent_failures_5min": len(recent_failures),
            "window_size": self.window_size
        }
    
    def is_healthy(self, min_success_rate: float = 0.8) -> bool:
        """Check if authentication system is healthy"""
        return self.get_success_rate() >= min_success_rate
    
    def get_recommendations(self) -> List[str]:
        """Get recommendations based on current stats"""
        recommendations = []
        
        overall_rate = self.get_success_rate()
        if overall_rate < 0.5:
            recommendations.append("CRITICAL: Overall success rate below 50% - check Supabase connectivity")
        elif overall_rate < 0.8:
            recommendations.append("WARNING: Success rate below 80% - monitor EC2 network connection")
        
        # Check method-specific issues
        regular_rate = self.get_success_rate("regular")
        service_rate = self.get_success_rate("service_role")
        
        if regular_rate < 0.5 and service_rate > 0.8:
            recommendations.append("Consider using service role client as primary - RLS may be causing issues")
        
        recent_failures = self.get_recent_failures(5)
        if len(recent_failures) > 10:
            recommendations.append("High recent failure rate - check network stability")
        
        return recommendations

# Global auth health monitor
auth_health_monitor = AuthHealthMonitor(window_size=200)
