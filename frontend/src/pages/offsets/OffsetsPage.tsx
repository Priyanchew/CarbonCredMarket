import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Leaf, TrendingUp, AlertCircle, Calculator, Clock, Target } from 'lucide-react';
import { apiClient } from '../../lib/api';
import RetireCredits from '../../components/blockchain/RetireCredits';
import type { 
  EmissionActivity, 
  CreditPurchase, 
  OffsetStats, 
  BulkOffsetEmissionRequest
} from '../../types';

export const OffsetsPage: React.FC = () => {
  const [offsetStats, setOffsetStats] = useState<OffsetStats | null>(null);
  const [availableEmissions, setAvailableEmissions] = useState<EmissionActivity[]>([]);
  const [offsetHistory, setOffsetHistory] = useState<EmissionActivity[]>([]);
  const [availableCredits, setAvailableCredits] = useState<CreditPurchase[]>([]);
  const [selectedEmissions, setSelectedEmissions] = useState<string[]>([]);
  const [creditAllocation, setCreditAllocation] = useState<{[purchaseId: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [offsetting, setOffsetting] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'history' | 'blockchain'>('available');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [stats, emissions, history, purchases] = await Promise.all([
        apiClient.getOffsetStats(),
        apiClient.getAvailableEmissionsForOffset(),
        apiClient.getOffsetHistory(),
        apiClient.getUserPurchases({ limit: 100 })
      ]);

      setOffsetStats(stats);
      setAvailableEmissions(emissions);
      setOffsetHistory(history);
      
      // Filter for purchases with available credits (not fully retired)
      const availablePurchases = purchases.filter(p => p.quantity > p.retired_quantity);
      setAvailableCredits(availablePurchases);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectAll = () => {
    if (selectedEmissions.length === availableEmissions.length) {
      // If all are selected, deselect all
      setSelectedEmissions([]);
    } else {
      // Select all emissions
      setSelectedEmissions(availableEmissions.map(e => e.id));
    }
  };

  const handleEmissionToggle = (emissionId: string) => {
    setSelectedEmissions(prev => 
      prev.includes(emissionId) 
        ? prev.filter(id => id !== emissionId)
        : [...prev, emissionId]
    );
  };

  const calculateCreditAllocation = useCallback((totalNeeded: number) => {
    const allocation: {[purchaseId: string]: number} = {};
    let remaining = totalNeeded;
    
    // Sort credits by purchase date (oldest first) or any other criteria
    const sortedCredits = [...availableCredits].sort((a, b) => 
      new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime()
    );
    
    for (const purchase of sortedCredits) {
      if (remaining <= 0) break;
      
      const availableFromPurchase = purchase.quantity - purchase.retired_quantity;
      const useFromThis = Math.min(remaining, availableFromPurchase);
      
      if (useFromThis > 0) {
        allocation[purchase.id] = useFromThis;
        remaining -= useFromThis;
      }
    }
    
    return { allocation, shortfall: remaining };
  }, [availableCredits]);

  const getTotalAvailableCredits = useCallback(() => {
    return availableCredits.reduce((total, purchase) => 
      total + (purchase.quantity - purchase.retired_quantity), 0
    );
  }, [availableCredits]);

  const getSelectedEmissionsTotal = useCallback(() => {
    return selectedEmissions.reduce((total, id) => {
      const emission = availableEmissions.find(e => e.id === id);
      // Calculate remaining amount that needs to be offset
      const remaining = emission ? (emission.co2_equivalent - (emission.offset_amount || 0)) : 0;
      return total + remaining;
    }, 0) / 1000; // Convert kg to tonnes
  }, [selectedEmissions, availableEmissions]);

  // Auto-calculate allocation when emissions selection changes
  React.useEffect(() => {
    if (selectedEmissions.length > 0) {
      const totalNeeded = getSelectedEmissionsTotal();
      const { allocation } = calculateCreditAllocation(totalNeeded);
      setCreditAllocation(allocation);
    } else {
      setCreditAllocation({});
    }
  }, [selectedEmissions, availableCredits, getSelectedEmissionsTotal, calculateCreditAllocation]);

  const handleOffsetEmissions = async () => {
    if (selectedEmissions.length === 0) {
      setError('Please select at least one emission to offset');
      return;
    }

    const totalOffsetAmount = getSelectedEmissionsTotal();
    const { allocation } = calculateCreditAllocation(totalOffsetAmount);

    // Allow partial offsetting - only warn about shortfall but don't prevent offsetting
    const actualOffsetAmount = Object.values(allocation).reduce((sum, amount) => sum + amount, 0);
    
    if (actualOffsetAmount === 0) {
      setError('No credits available for offsetting. Please retire some credits first.');
      return;
    }

    try {
      setOffsetting(true);
      setError(null);
      
      // Create bulk offset request
      const creditAllocations = Object.entries(allocation)
        .filter(([, amount]) => amount > 0)
        .map(([purchaseId, amount]) => ({
          purchase_id: purchaseId,
          amount: amount // Keep amount in tonnes, don't convert to kg
        }));

      const bulkOffsetRequest: BulkOffsetEmissionRequest = {
        emission_ids: selectedEmissions,
        credit_allocations: creditAllocations
      };

      await apiClient.bulkOffsetEmissions(bulkOffsetRequest);
      
      const totalProcessed = creditAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      const shortfallAmount = totalOffsetAmount - totalProcessed;
      let successMessage = `Successfully offset ${totalProcessed.toFixed(3)} tons CO₂e from ${selectedEmissions.length} emissions using ${creditAllocations.length} credit purchase(s)`;
      
      if (shortfallAmount > 0.001) { // Small tolerance for floating point
        successMessage += `. Note: ${shortfallAmount.toFixed(3)} tons CO₂e could not be offset due to insufficient credits.`;
      }
      
      setSuccess(successMessage);
      setSelectedEmissions([]);
      setCreditAllocation({});
      
      // Refresh data
      await fetchData();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to offset emissions');
    } finally {
      setOffsetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading offset data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Leaf className="h-8 w-8 text-green-600" />
            Carbon Offsets
          </h1>
          <p className="text-gray-600 mt-1">
            Retire your carbon credits to offset emissions and work towards net-zero
          </p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {offsetStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Emissions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(offsetStats.total_emissions / 1000).toFixed(2)} <span className="text-sm font-normal">tons CO₂e</span>
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Offset</p>
                <p className="text-2xl font-bold text-green-600">
                  {(offsetStats.total_offset_amount / 1000).toFixed(2)} <span className="text-sm font-normal">tons CO₂e</span>
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Emissions</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(offsetStats.net_emissions / 1000).toFixed(2)} <span className="text-sm font-normal">tons CO₂e</span>
                </p>
              </div>
              <Calculator className="h-8 w-8 text-orange-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offset Percentage</p>
                <p className="text-2xl font-bold text-blue-600">
                  {offsetStats.offset_percentage.toFixed(1)}<span className="text-sm font-normal">%</span>
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>
      )}

      {/* Offset Action Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Leaf className="h-6 w-6 text-green-600" />
          Offset Emissions
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Credit Allocation Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credit Allocation (Auto-calculated)
            </label>
            <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
              {Object.keys(creditAllocation).length === 0 ? (
                <p className="text-sm text-gray-500">Select emissions to see credit allocation</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(creditAllocation).map(([purchaseId, amount]) => {
                    const purchase = availableCredits.find(p => p.id === purchaseId);
                    return (
                      <div key={purchaseId} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">
                          {purchase?.credit?.project_name || 'Unknown Project'}
                        </span>
                        <span className="font-medium text-green-600">
                          {amount.toFixed(3)} credits
                        </span>
                      </div>
                    );
                  })}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span>Total Credits Available:</span>
                      <span className="text-green-600">
                        {getTotalAvailableCredits().toFixed(3)} credits
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Credits Needed:</span>
                      <span>{getSelectedEmissionsTotal().toFixed(3)} credits</span>
                    </div>
                    {Object.values(creditAllocation).reduce((sum, amount) => sum + amount, 0) < getSelectedEmissionsTotal() && (
                      <div className="flex justify-between items-center text-sm text-red-600 font-medium">
                        <span>Shortfall:</span>
                        <span>{(getSelectedEmissionsTotal() - Object.values(creditAllocation).reduce((sum, amount) => sum + amount, 0)).toFixed(3)} credits</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected Emissions Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Emissions Summary
            </label>
            <div className="border border-gray-300 rounded-md p-3">
              <p className="text-sm text-gray-600">
                Selected: {selectedEmissions.length} emission(s)
              </p>
              <p className="text-lg font-semibold text-gray-900">
                Total: {getSelectedEmissionsTotal().toFixed(3)} tons CO₂e
              </p>
              <p className="text-sm text-red-600 font-medium">
                Credits Needed: {getSelectedEmissionsTotal().toFixed(3)} credits
              </p>
              
              {Object.keys(creditAllocation).length > 0 && selectedEmissions.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Credits available:</span>
                    <span className="text-sm font-medium text-green-600">
                      {getTotalAvailableCredits().toFixed(3)} credits
                    </span>
                  </div>
                  {Object.values(creditAllocation).reduce((sum, amount) => sum + amount, 0) < getSelectedEmissionsTotal() && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-600">Will offset only:</span>
                      <span className="text-sm font-medium text-red-600">
                        {Object.values(creditAllocation).reduce((sum, amount) => sum + amount, 0).toFixed(3)} tons CO₂e
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleOffsetEmissions}
              disabled={selectedEmissions.length === 0 || offsetting || Object.keys(creditAllocation).length === 0}
              className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {offsetting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Offsetting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {Object.values(creditAllocation).reduce((sum, amount) => sum + amount, 0) < getSelectedEmissionsTotal() 
                    ? `Offset ${Object.values(creditAllocation).reduce((sum, amount) => sum + amount, 0).toFixed(3)} tons (Partial)`
                    : 'Offset Selected Emissions'
                  }
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Emissions Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'available'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Available for Offset ({availableEmissions.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Offset History ({offsetHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('blockchain')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'blockchain'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Blockchain Retirement
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'available' ? (
            <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Emissions Available for Offset
              </h3>
              {availableEmissions.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  {selectedEmissions.length === availableEmissions.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
              
              {availableEmissions.length === 0 ? (
                <div className="text-center py-8">
                  <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No emissions available for offset</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableEmissions.map((emission) => (
                    <div
                      key={emission.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedEmissions.includes(emission.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleEmissionToggle(emission.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedEmissions.includes(emission.id)}
                              onChange={() => handleEmissionToggle(emission.id)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {emission.activity_name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {emission.description}
                              </p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-500">
                                  {emission.category}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(emission.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {((emission.co2_equivalent - (emission.offset_amount || 0)) / 1000).toFixed(3)}
                          </p>
                          <p className="text-sm text-gray-600">tons CO₂e remaining</p>
                          {emission.offset_amount && emission.offset_amount > 0 && (
                            <p className="text-xs text-green-600">
                              {(emission.offset_amount / 1000).toFixed(3)} tons already offset
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'history' ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Offset History
              </h3>
              
              {offsetHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No offset history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {offsetHistory.map((emission) => (
                    <div
                      key={emission.id}
                      className="border border-gray-200 rounded-lg p-4 bg-green-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {emission.activity_name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {emission.description}
                              </p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-500">
                                  {emission.category}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Offset on {emission.offset_date ? new Date(emission.offset_date).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">
                            {(emission.offset_amount / 1000).toFixed(3)}
                          </p>
                          <p className="text-sm text-gray-600">tons CO₂e offset</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Blockchain Credit Retirement
              </h3>
              <p className="text-gray-600 mb-6">
                Retire carbon credits directly on the blockchain for permanent and transparent offsetting.
              </p>
              
              <div className="max-w-md">
                <RetireCredits onRetired={() => fetchData()} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
