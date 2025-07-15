import React, { useState } from 'react';
import { Calculator, Zap, Plane, Truck, Plus } from 'lucide-react';
import { apiClient } from '../lib/api';
import type { 
  ElectricityEstimateRequest, 
  FlightEstimateRequest, 
  ShippingEstimateRequest,
  CarbonEstimateResponse,
  EmissionCategory
} from '../types';

type EstimateType = 'electricity' | 'flight' | 'shipping';

interface EstimateResult {
  type: EstimateType;
  result: CarbonEstimateResponse;
}

interface Props {
  onEmissionAdded?: () => void; // Callback when an emission is successfully added
}

export const CarbonEstimator: React.FC<Props> = ({ onEmissionAdded }) => {
  const [activeTab, setActiveTab] = useState<EstimateType>('electricity');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [lastFormData, setLastFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingEmission, setSavingEmission] = useState(false);

  // Helper function to map estimate types to emission categories
  const getEmissionCategory = (estimateType: EstimateType): EmissionCategory => {
    switch (estimateType) {
      case 'electricity':
        return 'energy';
      case 'flight':
        return 'transportation';
      case 'shipping':
        return 'transportation';
      default:
        return 'energy';
    }
  };

  const saveAsEmissionActivity = async (estimate: EstimateResult, formData: FormData) => {
    setSavingEmission(true);
    try {
      const category = getEmissionCategory(estimate.type);
      let activityName = '';
      let description = '';

      // Generate activity name and description based on estimate type
      switch (estimate.type) {
        case 'electricity': {
          const electricityValue = formData.get('electricity_value');
          const electricityUnit = formData.get('electricity_unit');
          const country = formData.get('country');
          activityName = `Electricity Consumption - ${electricityValue} ${electricityUnit}`;
          description = `Electricity consumption in ${country}: ${electricityValue} ${electricityUnit}`;
          break;
        }
        case 'flight': {
          const passengers = formData.get('passengers');
          const departure = formData.get('departure_airport');
          const destination = formData.get('destination_airport');
          activityName = `Flight - ${departure} to ${destination}`;
          description = `Flight for ${passengers} passenger(s) from ${departure} to ${destination}`;
          break;
        }
        case 'shipping': {
          const weight = formData.get('weight_value');
          const weightUnit = formData.get('weight_unit');
          const distance = formData.get('distance_value');
          const distanceUnit = formData.get('distance_unit');
          const transport = formData.get('transport_method');
          activityName = `Shipping - ${weight} ${weightUnit} via ${transport}`;
          description = `Shipping ${weight} ${weightUnit} over ${distance} ${distanceUnit} via ${transport}`;
          break;
        }
      }

      const emissionData = {
        activity_name: activityName,
        category,
        description,
        amount: parseFloat(estimate.result.carbon_kg.toString()),
        unit: 'kg CO2e',
        emission_factor: 1.0, // Direct calculation from Carbon Interface
        co2_equivalent: estimate.result.carbon_kg,
        date: new Date().toISOString(),
      };

      await apiClient.createEmission(emissionData);
      
      if (onEmissionAdded) {
        onEmissionAdded();
      }
      
      setResult(null); // Clear result after saving
      setError(null);
      alert('Emission activity saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save emission activity');
    } finally {
      setSavingEmission(false);
    }
  };

  const handleElectricityEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target as HTMLFormElement);
    setLastFormData(formData);
    const request: ElectricityEstimateRequest = {
      electricity_value: Number(formData.get('electricity_value')),
      electricity_unit: formData.get('electricity_unit') as string,
      country: formData.get('country') as string,
      state: formData.get('state') as string || undefined,
    };

    try {
      const response = await apiClient.estimateElectricityEmissions(request);
      setResult({ type: 'electricity', result: response });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to estimate emissions');
    } finally {
      setLoading(false);
    }
  };

  const handleFlightEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target as HTMLFormElement);
    setLastFormData(formData);
    const request: FlightEstimateRequest = {
      passengers: Number(formData.get('passengers')),
      legs: [{
        departure_airport: formData.get('departure_airport') as string,
        destination_airport: formData.get('destination_airport') as string,
      }],
      distance_unit: formData.get('distance_unit') as string,
    };

    try {
      const response = await apiClient.estimateFlightEmissions(request);
      setResult({ type: 'flight', result: response });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to estimate emissions');
    } finally {
      setLoading(false);
    }
  };

  const handleShippingEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target as HTMLFormElement);
    setLastFormData(formData);
    const request: ShippingEstimateRequest = {
      weight_value: Number(formData.get('weight_value')),
      weight_unit: formData.get('weight_unit') as string,
      distance_value: Number(formData.get('distance_value')),
      distance_unit: formData.get('distance_unit') as string,
      transport_method: formData.get('transport_method') as string,
    };

    try {
      const response = await apiClient.estimateShippingEmissions(request);
      setResult({ type: 'shipping', result: response });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to estimate emissions');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'electricity', label: 'Electricity', icon: Zap },
    { id: 'flight', label: 'Flight', icon: Plane },
    { id: 'shipping', label: 'Shipping', icon: Truck },
  ] as const;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-6 w-6 text-green-600" />
        <h2 className="text-xl font-bold text-gray-900">Carbon Emissions Calculator</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Forms */}
      {activeTab === 'electricity' && (
        <form onSubmit={handleElectricityEstimate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Electricity Consumption
              </label>
              <input
                type="number"
                name="electricity_value"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                name="electricity_unit"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="kwh">kWh</option>
                <option value="mwh">MWh</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <select
                name="country"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="us">United States</option>
                <option value="ca">Canada</option>
                <option value="gb">United Kingdom</option>
                <option value="de">Germany</option>
                <option value="fr">France</option>
                <option value="au">Australia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State (Optional)
              </label>
              <input
                type="text"
                name="state"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="ca, tx, ny..."
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating...' : 'Calculate Emissions'}
          </button>
        </form>
      )}

      {activeTab === 'flight' && (
        <form onSubmit={handleFlightEstimate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passengers
              </label>
              <input
                type="number"
                name="passengers"
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance Unit
              </label>
              <select
                name="distance_unit"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="km">Kilometers</option>
                <option value="mi">Miles</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure Airport (IATA)
              </label>
              <input
                type="text"
                name="departure_airport"
                required
                maxLength={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="SFO"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Airport (IATA)
              </label>
              <input
                type="text"
                name="destination_airport"
                required
                maxLength={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="LAX"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating...' : 'Calculate Emissions'}
          </button>
        </form>
      )}

      {activeTab === 'shipping' && (
        <form onSubmit={handleShippingEstimate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight
              </label>
              <input
                type="number"
                name="weight_value"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight Unit
              </label>
              <select
                name="weight_unit"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="kg">Kilograms</option>
                <option value="lb">Pounds</option>
                <option value="g">Grams</option>
                <option value="mt">Metric Tons</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance
              </label>
              <input
                type="number"
                name="distance_value"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance Unit
              </label>
              <select
                name="distance_unit"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="km">Kilometers</option>
                <option value="mi">Miles</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transport Method
              </label>
              <select
                name="transport_method"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="truck">Truck</option>
                <option value="train">Train</option>
                <option value="ship">Ship</option>
                <option value="plane">Plane</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating...' : 'Calculate Emissions'}
          </button>
        </form>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Emission Estimate Results
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">CO₂ Equivalent</p>
              <p className="text-lg font-bold text-green-800">
                {result.result.carbon_kg.toFixed(2)} kg
              </p>
            </div>
            <div>
              <p className="text-gray-600">Grams</p>
              <p className="font-semibold text-green-700">
                {result.result.carbon_emissions.carbon_g.toLocaleString()} g
              </p>
            </div>
            <div>
              <p className="text-gray-600">Pounds</p>
              <p className="font-semibold text-green-700">
                {result.result.carbon_emissions.carbon_lb.toFixed(2)} lbs
              </p>
            </div>
            <div>
              <p className="text-gray-600">Metric Tons</p>
              <p className="font-semibold text-green-700">
                {result.result.carbon_emissions.carbon_mt.toFixed(4)} mt
              </p>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <p>Estimate ID: {result.result.id}</p>
            <p>Generated: {new Date(result.result.estimated_at).toLocaleString()}</p>
          </div>
          
          {/* Save as Emission Button */}
          {lastFormData && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <button
                onClick={() => saveAsEmissionActivity(result, lastFormData)}
                disabled={savingEmission}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4" />
                {savingEmission ? 'Saving...' : 'Save as Emission Activity'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
