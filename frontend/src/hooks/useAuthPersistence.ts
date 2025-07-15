import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Hook to handle authentication persistence and debugging
 */
export function useAuthPersistence() {
  const { 
    token, 
    isAuthenticated, 
    isInitialized, 
    initialize, 
    user 
  } = useAuthStore();

  useEffect(() => {
    // Debug logging for authentication state
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth State:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        isAuthenticated,
        isInitialized,
        hasUser: !!user,
        userName: user?.email || 'none'
      });
    }
  }, [token, isAuthenticated, isInitialized, user]);

  useEffect(() => {
    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-storage' || e.key === 'auth_token') {
        console.log('Storage changed, reinitializing auth...');
        initialize();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initialize]);

  useEffect(() => {
    // Handle page visibility changes (user switching tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && token) {
        // Re-validate token when user returns to the tab
        import('../lib/api').then(({ default: apiClient }) => {
          apiClient.validateToken().then((isValid) => {
            if (!isValid) {
              console.warn('Token validation failed on tab focus');
              useAuthStore.getState().logout();
            }
          });
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, token]);

  return {
    token,
    isAuthenticated,
    isInitialized,
    user
  };
}
