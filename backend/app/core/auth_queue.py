"""
Authentication queue system to handle concurrent requests after login.
Ensures that authentication requests are processed sequentially until the first successful auth,
then allows concurrent processing.
"""
import asyncio
from typing import Dict, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class AuthQueue:
    def __init__(self):
        # Dictionary to store locks per user
        self._user_locks: Dict[str, asyncio.Lock] = {}
        # Track successful authentications to allow concurrent requests
        self._authenticated_users: Dict[str, datetime] = {}
        # Cache timeout for authenticated users (5 minutes)
        self._cache_timeout = timedelta(minutes=5)
    
    def _get_user_lock(self, user_id: str) -> asyncio.Lock:
        """Get or create a lock for a specific user."""
        if user_id not in self._user_locks:
            self._user_locks[user_id] = asyncio.Lock()
        return self._user_locks[user_id]
    
    def _is_user_authenticated(self, user_id: str) -> bool:
        """Check if user has been successfully authenticated recently."""
        if user_id not in self._authenticated_users:
            return False
        
        # Check if authentication is still valid (within cache timeout)
        auth_time = self._authenticated_users[user_id]
        if datetime.now() - auth_time > self._cache_timeout:
            # Remove expired authentication
            del self._authenticated_users[user_id]
            return False
        
        return True
    
    def _mark_user_authenticated(self, user_id: str):
        """Mark user as successfully authenticated."""
        self._authenticated_users[user_id] = datetime.now()
        logger.info(f"User {user_id} marked as authenticated")
    
    def _clear_user_authentication(self, user_id: str):
        """Clear user authentication cache (e.g., on auth failure)."""
        if user_id in self._authenticated_users:
            del self._authenticated_users[user_id]
            logger.info(f"Cleared authentication cache for user {user_id}")
    
    async def process_auth_request(self, user_id: str, auth_function):
        """
        Process an authentication request with proper queuing.
        
        Args:
            user_id: The user ID from the token
            auth_function: Async function that performs the actual authentication
            
        Returns:
            The result of the auth_function
        """
        # If user is already authenticated recently, allow concurrent access
        if self._is_user_authenticated(user_id):
            try:
                result = await auth_function()
                return result
            except Exception as e:
                # If auth fails, clear the cache and re-raise
                self._clear_user_authentication(user_id)
                raise e
        
        # Otherwise, use the lock to serialize authentication requests
        lock = self._get_user_lock(user_id)
        
        async with lock:
            # Double-check if user was authenticated while waiting for lock
            if self._is_user_authenticated(user_id):
                try:
                    result = await auth_function()
                    return result
                except Exception as e:
                    self._clear_user_authentication(user_id)
                    raise e
            
            # Perform authentication
            try:
                result = await auth_function()
                # Mark user as authenticated on success
                self._mark_user_authenticated(user_id)
                return result
            except Exception as e:
                # Clear any existing authentication cache on failure
                self._clear_user_authentication(user_id)
                raise e

# Global auth queue instance
auth_queue = AuthQueue()
