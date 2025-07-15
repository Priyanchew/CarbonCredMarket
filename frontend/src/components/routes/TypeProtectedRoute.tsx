import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { UserType } from '../../types';

interface TypeProtectedRouteProps {
  children: React.ReactNode;
  allowedTypes: UserType[];
  redirectTo?: string;
}

export function TypeProtectedRoute({ 
  children, 
  allowedTypes, 
  redirectTo 
}: TypeProtectedRouteProps) {
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check user type permission
  if (!allowedTypes.includes(user.type)) {
    // Redirect based on user type if no specific redirect provided
    if (!redirectTo) {
      switch (user.type) {
        case 'seller':
          return <Navigate to="/app/seller/dashboard" replace />;
        case 'buyer':
          return <Navigate to="/app/dashboard" replace />;
        case 'admin':
          return <Navigate to="/app/admin/dashboard" replace />;
        default:
          return <Navigate to="/app/dashboard" replace />;
      }
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

// Convenience components for specific user types
export function BuyerRoute({ children }: { children: React.ReactNode }) {
  return (
    <TypeProtectedRoute allowedTypes={['buyer']}>
      {children}
    </TypeProtectedRoute>
  );
}

export function SellerRoute({ children }: { children: React.ReactNode }) {
  return (
    <TypeProtectedRoute allowedTypes={['seller']}>
      {children}
    </TypeProtectedRoute>
  );
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <TypeProtectedRoute allowedTypes={['admin']}>
      {children}
    </TypeProtectedRoute>
  );
}

export function BuyerSellerRoute({ children }: { children: React.ReactNode }) {
  return (
    <TypeProtectedRoute allowedTypes={['buyer', 'seller']}>
      {children}
    </TypeProtectedRoute>
  );
}

export function AllUsersRoute({ children }: { children: React.ReactNode }) {
  return (
    <TypeProtectedRoute allowedTypes={['buyer', 'seller', 'admin']}>
      {children}
    </TypeProtectedRoute>
  );
}
