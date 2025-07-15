import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { useToast } from '../../hooks/useToast';
import { Search, MapPin, Calendar, TrendingUp, Award, Leaf, ShoppingCart, Wallet } from 'lucide-react';
import apiClient from '../../lib/api';
import type { CarbonCredit } from '../../types';

export default function MarketplacePage() {
  const { address, isConnected } = useAccount();
  const { addToast } = useToast();
  const [credits, setCredits] = useState<CarbonCredit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [filters, setFilters] = useState({
    project_type: '',
    location: '',
    price_range: '',
    search: ''
  });
  const [selectedCredit, setSelectedCredit] = useState<CarbonCredit | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const projectTypes = [
    'forestry',
    'renewable_energy', 
    'energy_efficiency',
    'industrial',
    'agriculture',
    'waste_management',
    'methane_capture',
    'direct_air_capture'
  ];

  const projectTypeLabels = {
    forestry: 'Forestry & Land Use',
    renewable_energy: 'Renewable Energy',
    energy_efficiency: 'Energy Efficiency',
    industrial: 'Industrial Processes',
    agriculture: 'Agriculture',
    waste_management: 'Waste Management',
    methane_capture: 'Methane Capture',
    direct_air_capture: 'Direct Air Capture'
  };

  const priceRanges = [
    { label: 'Under $15', value: '0-15' },
    { label: '$15 - $25', value: '15-25' },
    { label: '$25 - $50', value: '25-50' },
    { label: 'Over $50', value: '50-999' }
  ];

  useEffect(() => {
    fetchCredits();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCredits = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      
      if (filters.project_type) params.project_type = filters.project_type;
      if (filters.location) params.location = filters.location;
      if (filters.price_range) {
        const [min, max] = filters.price_range.split('-');
        params.min_price = min;
        params.max_price = max;
      }
      
      const data = await apiClient.getCarbonCredits(params);
      
      // Filter by search term on frontend
      let filteredData = data;
      if (filters.search) {        filteredData = data.filter(credit => 
          credit.project_name.toLowerCase().includes(filters.search.toLowerCase()) ||
          credit.description.toLowerCase().includes(filters.search.toLowerCase()) ||
          credit.project_location.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
        setCredits(filteredData);
    } catch (error) {
      console.error('Error fetching credits:', error);
      addToast('Failed to load carbon credits. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };  const handlePurchase = async () => {
    if (!selectedCredit) return;

    if (!isConnected || !address) {
      addToast('Please connect your wallet to purchase credits', 'error');
      return;
    }

    try {
      setIsPurchasing(true);
      
      // Use blockchain purchase instead of traditional database purchase
      // This will: 1) mint credits to buyer's wallet, 2) transfer payment, 3) record transaction in DB
      const response = await apiClient.purchaseCreditsBlockchain({ 
        project_id: selectedCredit.id, 
        quantity: purchaseQuantity,
        wallet_address: address
      }) as { transaction_hash: string, success: boolean };
      
      // Refresh credits to update availability
      fetchCredits();
      
      // Close modal and reset
      setShowPurchaseModal(false);
      setSelectedCredit(null);
      setPurchaseQuantity(1);
      
      addToast(`Purchase completed! Tx: ${response.transaction_hash}`, 'success');
    } catch (error) {
      console.error('Error purchasing credits:', error);
      addToast('Failed to complete purchase. Please try again.', 'error');
    } finally {
      setIsPurchasing(false);
    }
  };

  const openPurchaseModal = (credit: CarbonCredit) => {
    setSelectedCredit(credit);
    setPurchaseQuantity(1);
    setShowPurchaseModal(true);  };

  const totalCreditsAvailable = credits.reduce((sum, credit) => sum + credit.available_quantity, 0);  const averagePrice = credits.length > 0 
    ? credits.reduce((sum, credit) => sum + credit.price_per_ton, 0) / credits.length 
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Carbon Credit Marketplace</h1>
            <p className="text-gray-600 mt-1">Discover and purchase verified carbon credits</p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" text="Loading carbon credits..." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Carbon Credit Marketplace</h1>
          <p className="text-gray-600 mt-1">Discover and purchase verified carbon credits</p>
        </div>
      </div>

      {/* Stats Overview */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Leaf className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{totalCreditsAvailable.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Credits Available</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">${averagePrice.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Avg Price per Tonne</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">{credits.length}</p>
              <p className="text-sm text-gray-600">Available Projects</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>              <p className="text-2xl font-bold text-orange-600">
                {new Set(credits.map(c => c.project_location)).size}
              </p>
              <p className="text-sm text-gray-600">Locations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <select
              value={filters.project_type}
              onChange={(e) => setFilters(prev => ({ ...prev, project_type: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Project Types</option>
              {projectTypes.map(type => (
                <option key={type} value={type}>
                  {projectTypeLabels[type as keyof typeof projectTypeLabels]}
                </option>
              ))}
            </select>

            <select
              value={filters.price_range}
              onChange={(e) => setFilters(prev => ({ ...prev, price_range: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Prices</option>
              {priceRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Credits Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading carbon credits...</p>
            </div>
          </CardContent>
        </Card>
      ) : credits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-600">No carbon credits found matching your criteria.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credits.map((credit) => (
            <Card key={credit.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {credit.project_name}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    credit.status === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {credit.status === 'available' ? 'Available' : 'Sold Out'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {projectTypeLabels[credit.project_type as keyof typeof projectTypeLabels]}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {credit.description}
                </p>
                
                <div className="space-y-2 mb-4">                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{credit.project_location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Vintage: {credit.vintage_year}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span>Standard: {credit.verification_standard}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>                      <p className="text-lg font-bold text-green-600">
                        ${credit.price_per_ton}/tonne
                      </p>
                      <p className="text-sm text-gray-600">
                        {credit.available_quantity.toLocaleString()} available
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => openPurchaseModal(credit)}
                    disabled={credit.status !== 'available' || credit.available_quantity === 0}
                    className="w-full"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Purchase Credits
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900">Purchase Carbon Credits</h2>
              <p className="text-sm text-gray-600">{selectedCredit.project_name}</p>
              
              {!isConnected && (
                <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-orange-600" />
                    <p className="text-sm text-orange-800">
                      Connect your wallet to purchase credits on the blockchain
                    </p>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">                    <div>
                      <span className="text-gray-500">Price per tonne:</span>
                      <p className="font-medium">${selectedCredit.price_per_ton}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Available:</span>
                      <p className="font-medium">{selectedCredit.available_quantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <p className="font-medium">{selectedCredit.project_location}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Vintage:</span>
                      <p className="font-medium">{selectedCredit.vintage_year}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (tonnes CO₂e)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedCredit.available_quantity}
                    value={purchaseQuantity}
                    onChange={(e) => setPurchaseQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Cost:</span>                    <span className="text-xl font-bold text-green-600">
                      ${(selectedCredit.price_per_ton * purchaseQuantity).toFixed(2)}
                    </span>
                  </div>
                </div>                <div className="flex gap-2">
                  <Button 
                    onClick={handlePurchase} 
                    className="flex-1" 
                    disabled={isPurchasing || !isConnected}
                  >
                    {isPurchasing ? (
                      <div className="flex items-center gap-2">
                        <Loading size="sm" />
                        Processing...
                      </div>
                    ) : !isConnected ? (
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Connect Wallet
                      </div>
                    ) : (
                      'Confirm Purchase'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPurchaseModal(false)}
                    disabled={isPurchasing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
