import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { LogOut, Plus } from 'lucide-react';
import { apiClient } from '../../lib/api';
import WalletConnector from '../blockchain/WalletConnector';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchAvailableCredits = async () => {
    try {
      setLoading(true);
      const purchases = await apiClient.getUserPurchases();
      // Calculate available credits by subtracting retired quantity from total quantity
      const totalAvailable = purchases.reduce((total, purchase) => 
        total + (purchase.quantity - purchase.retired_quantity), 0
      );
      setAvailableCredits(totalAvailable);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAvailableCredits();
    }
  }, [user, location.pathname]); // Re-fetch when user changes or when navigating between pages

  // Refresh credits when window gains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchAvailableCredits();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const handleCreditsClick = () => {
    // Only navigate to marketplace if not already there
    if (location.pathname !== '/app/marketplace') {
      navigate('/app/marketplace');
    }
  };

  const isMarketplacePage = location.pathname === '/app/marketplace';

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src="/leaf.svg" alt="Carbon Marketplace" className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Carbon Marketplace</h1>
            <p className="text-sm text-gray-500">Sustainable Business Solutions</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Blockchain Wallet - Always shown */}
          <WalletConnector />

          {/* Credits Indicator - Only for buyer dashboard */}
          {user?.type === 'buyer' && (
            <Button
              variant={isMarketplacePage ? "ghost" : "outline"}
              size="sm"
              onClick={handleCreditsClick}
              className={`flex items-center space-x-2 ${isMarketplacePage ? 'cursor-default' : 'hover:bg-green-50'}`}
              disabled={isMarketplacePage}
            >
              {!isMarketplacePage && <Plus className="h-4 w-4" />}
              <div className="text-right">
                <p className="text-sm font-medium text-green-700">
                  {loading ? '...' : `${availableCredits.toFixed(1)} credits`}
                </p>
              </div>
            </Button>
          )}

          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.company_name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
