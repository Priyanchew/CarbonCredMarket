import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function DashboardRouter() {
  const { user, isAuthenticated, isInitialized } = useAuthStore();

  // Wait for initialization
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to appropriate dashboard based on user type
  switch (user.type) {
    case 'seller':
      return <Navigate to="/app/seller/dashboard" replace />;
    case 'admin':
      return <Navigate to="/app/admin/dashboard" replace />;
    case 'buyer':
    default:
      return <Navigate to="/app/buyer/dashboard" replace />;
  }
}
