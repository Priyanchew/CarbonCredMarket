import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useAuthPersistence } from './hooks/useAuthPersistence';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/layout/Layout';
import PublicLayout from './components/layout/PublicLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import SellerRegisterPage from './pages/auth/SellerRegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import EmissionsPage from './pages/emissions/EmissionsPage';
import MarketplacePage from './pages/marketplace/MarketplacePage';
import ReportsPage from './pages/reports/ReportsPage';
import { OffsetsPage } from './pages/offsets/OffsetsPage';
import APIAccessPage from './pages/api/APIAccessPage';
import SellerDashboardPage from './pages/seller/SellerDashboardPage';
import SellerVerificationPage from './pages/seller/SellerVerificationPage';
import ProjectCreatePage from './pages/seller/ProjectCreatePage';
import ProjectsPage from './pages/seller/ProjectsPage';
import CreditsPage from './pages/seller/CreditsPage';
import SalesPage from './pages/seller/SalesPage';
import { DashboardRouter } from './components/routes/DashboardRouter';
import { 
  BuyerRoute, 
  SellerRoute, 
  AllUsersRoute 
} from './components/routes/TypeProtectedRoute';
import { 
  LandingPage, 
  AboutPage, 
  PricingPage, 
  PrivacyPage, 
  TermsPage, 
  ContactPage,
  APIDocsPage,
  GetStartedPage,
  ComingSoonPage
} from './pages/public';

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Initializing...</p>
      </div>
    </div>
  );
}

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  
  if (!isInitialized) {
    return <LoadingScreen />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Public Route component (redirect to appropriate dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  
  if (!isInitialized) {
    return <LoadingScreen />;
  }
  
  if (isAuthenticated && user) {
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
  
  return <>{children}</>;
}

// Landing Route component (accessible to all)
function LandingRoute({ children }: { children: React.ReactNode }) {
  const { isInitialized } = useAuthStore();
  
  if (!isInitialized) {
    return <LoadingScreen />;
  }
  
  return <>{children}</>;
}

// Verification Page Route component that shows verification status
function VerificationPageRoute() {
  return <SellerVerificationPage />;
}

function App() {
  const { initialize, isInitialized } = useAuthStore();
  
  // Use the authentication persistence hook for enhanced debugging and persistence
  useAuthPersistence();

  // Initialize authentication on app load
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show loading screen while initializing
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public marketing pages (accessible to all) */}
              <Route 
                path="/landing" 
                element={
                  <LandingRoute>
                    <PublicLayout>
                      <LandingPage />
                    </PublicLayout>
                  </LandingRoute>
                } 
              />
              <Route 
                path="/get-started" 
                element={
                  <LandingRoute>
                    <GetStartedPage />
                  </LandingRoute>
                } 
              />
              <Route 
                path="/about" 
                element={
                  <LandingRoute>
                    <PublicLayout>
                      <AboutPage />
                    </PublicLayout>
                  </LandingRoute>
                } 
              />
              <Route 
                path="/pricing" 
                element={
                  <LandingRoute>
                    <PublicLayout>
                      <PricingPage />
                    </PublicLayout>
                  </LandingRoute>
                } 
              />
              <Route 
                path="/privacy" 
                element={
                  <LandingRoute>
                    <PublicLayout>
                      <PrivacyPage />
                    </PublicLayout>
                  </LandingRoute>
                } 
              />
              <Route 
                path="/terms" 
                element={
                  <LandingRoute>
                    <PublicLayout>
                      <TermsPage />
                    </PublicLayout>
                  </LandingRoute>
                } 
              />
              <Route 
                path="/contact" 
                element={
                  <LandingRoute>
                    <PublicLayout>
                      <ContactPage />
                    </PublicLayout>
                  </LandingRoute>
                } 
              />
              <Route 
                path="/api-docs" 
                element={
                  <LandingRoute>
                    <APIDocsPage />
                  </LandingRoute>
                } 
              />
              <Route 
                path="/coming-soon" 
                element={
                  <LandingRoute>
                    <ComingSoonPage />
                  </LandingRoute>
                } 
              />

              {/* Auth routes */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/seller/register" 
                element={
                  <PublicRoute>
                    <SellerRegisterPage />
                  </PublicRoute>
                } 
              />

              {/* Protected routes */}
              <Route 
                path="/app" 
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Smart dashboard routing based on user type */}
                <Route index element={<DashboardRouter />} />
                <Route path="dashboard" element={<DashboardRouter />} />
                
                {/* Buyer-specific routes */}
                <Route path="buyer">
                  <Route path="dashboard" element={
                    <BuyerRoute>
                      <DashboardPage />
                    </BuyerRoute>
                  } />
                </Route>
                
                {/* Shared routes (buyer + seller + admin) */}
                <Route path="emissions" element={
                  <AllUsersRoute>
                    <EmissionsPage />
                  </AllUsersRoute>
                } />
                <Route path="marketplace" element={
                  <AllUsersRoute>
                    <MarketplacePage />
                  </AllUsersRoute>
                } />
                <Route path="offsets" element={
                  <AllUsersRoute>
                    <OffsetsPage />
                  </AllUsersRoute>
                } />
                <Route path="reports" element={
                  <AllUsersRoute>
                    <ReportsPage />
                  </AllUsersRoute>
                } />
                <Route path="api" element={
                  <AllUsersRoute>
                    <APIAccessPage />
                  </AllUsersRoute>
                } />
                
                {/* Seller-specific routes */}
                <Route path="seller">
                  <Route index element={
                    <SellerRoute>
                      <SellerDashboardPage />
                    </SellerRoute>
                  } />
                  <Route path="dashboard" element={
                    <SellerRoute>
                      <SellerDashboardPage />
                    </SellerRoute>
                  } />
                  <Route path="verification" element={
                    <SellerRoute>
                      <VerificationPageRoute />
                    </SellerRoute>
                  } />
                  <Route path="projects" element={
                    <SellerRoute>
                      <ProjectsPage />
                    </SellerRoute>
                  } />
                  <Route path="projects/create" element={
                    <SellerRoute>
                      <ProjectCreatePage />
                    </SellerRoute>
                  } />
                  <Route path="credits" element={
                    <SellerRoute>
                      <CreditsPage />
                    </SellerRoute>
                  } />
                  <Route path="sales" element={
                    <SellerRoute>
                      <SalesPage />
                    </SellerRoute>
                  } />
                </Route>
              </Route>

              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/landing" replace />} />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/landing" replace />} />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
