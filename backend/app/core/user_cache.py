"""
User profile cache to reduce database lookups and improve authentication reliability
"""
import asyncio
import time
from typing import Dict, Optional, Any
import logging

logger = logging.getLogger(__name__)

class UserProfileCache:
    def __init__(self, ttl: int = 300):  # Cache for 5 minutes
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.cache_times: Dict[str, float] = {}
        self.ttl = ttl
        self.lock = asyncio.Lock()
    
    async def get(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile from cache if valid"""
        async with self.lock:
            if user_id not in self.cache:
                return None
            
            # Check if cache entry is still valid
            cache_time = self.cache_times.get(user_id, 0)
            if time.time() - cache_time > self.ttl:
                # Cache expired, remove it
                del self.cache[user_id]
                del self.cache_times[user_id]
                logger.info(f"Cache expired for user {user_id}")
                return None
            
            logger.info(f"Cache hit for user {user_id}")
            return self.cache[user_id].copy()
    
    async def set(self, user_id: str, user_data: Dict[str, Any]):
        """Store user profile in cache"""
        async with self.lock:
            self.cache[user_id] = user_data.copy()
            self.cache_times[user_id] = time.time()
            logger.info(f"Cached user profile for {user_id}")
    
    async def invalidate(self, user_id: str):
        """Remove user profile from cache"""
        async with self.lock:
            if user_id in self.cache:
                del self.cache[user_id]
                del self.cache_times[user_id]
                logger.info(f"Invalidated cache for user {user_id}")
    
    async def clear_all(self):
        """Clear all cached profiles"""
        async with self.lock:
            self.cache.clear()
            self.cache_times.clear()
            logger.info("Cleared all cached user profiles")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "cached_users": len(self.cache),
            "ttl_seconds": self.ttl,
            "oldest_entry": min(self.cache_times.values()) if self.cache_times else None,
            "newest_entry": max(self.cache_times.values()) if self.cache_times else None
        }

# Global user profile cache instance
user_profile_cache = UserProfileCache(ttl=300)  # 5 minutes cache
