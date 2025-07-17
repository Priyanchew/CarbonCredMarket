import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import { Plus, Search, Trash2, Edit2, FileUp } from 'lucide-react';
import apiClient from '../../lib/api';
import DocumentUpload from '../../components/DocumentUpload';
import type { EmissionActivity, EmissionCategory } from '../../types';

interface ExtractedActivity {
  activity_name: string;
  category: string;
  description: string;
  amount: number;
  unit: string;
  emission_factor: number;
  date: string;
}

export default function EmissionsPage() {
  const { addToast } = useToast();
  const [emissions, setEmissions] = useState<EmissionActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [editingEmission, setEditingEmission] = useState<EmissionActivity | null>(null);
  const [formData, setFormData] = useState({
    activity_name: '',
    category: '' as EmissionCategory | '',
    description: '',
    amount: '',
    unit: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  const categories: EmissionCategory[] = ['transportation', 'energy', 'manufacturing', 'agriculture', 'waste'];
  
  const categoryLabels = {
    transportation: 'Transportation',
    energy: 'Energy',
    manufacturing: 'Manufacturing',
    agriculture: 'Agriculture',
    waste: 'Waste'
  };

  const commonUnits = {
    transportation: ['km', 'miles', 'gallons', 'liters'],
    energy: ['kWh', 'MWh', 'therms', 'BTU'],
    manufacturing: ['units', 'kg', 'tons', 'pieces'],
    agriculture: ['acres', 'hectares', 'kg', 'tons'],
    waste: ['kg', 'tons', 'cubic meters', 'units']
  };
  const [allEmissions, setAllEmissions] = useState<EmissionActivity[]>([]);

  const fetchEmissions = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching all emissions data...');
      
      // Get all emissions without any filtering
      const data = await apiClient.getEmissions();
      console.log('Received all emissions data:', data);
      
      setAllEmissions(data);
    } catch (error) {
      console.error('Error fetching emissions:', error);
      addToast('Failed to load emissions data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const applyFilters = useCallback(() => {
    let filtered = [...allEmissions];

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(emission => emission.category === filters.category);
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(emission => 
        emission.activity_name.toLowerCase().includes(searchLower) ||
        emission.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply date filters
    if (filters.startDate) {
      filtered = filtered.filter(emission => emission.date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(emission => emission.date <= filters.endDate);
    }

    setEmissions(filtered); // Keep the old emissions state for backwards compatibility
  }, [allEmissions, filters]);

  useEffect(() => {
    fetchEmissions();
  }, [fetchEmissions]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.activity_name || !formData.category || !formData.amount) {
      addToast('Please fill in all required fields.', 'warning');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Calculate emission factor based on category (this would come from backend normally)
      const emissionFactors: Record<string, number> = {
        transportation: 0.21, // kg CO2e per km
        energy: 0.4,         // kg CO2e per kWh
        manufacturing: 2.1,   // kg CO2e per unit
        agriculture: 1.5,     // kg CO2e per unit
        waste: 0.8           // kg CO2e per kg
      };

      const emissionData = {
        activity_name: formData.activity_name,
        category: formData.category as EmissionCategory,
        description: formData.description,
        amount: parseFloat(formData.amount),
        unit: formData.unit,
        emission_factor: emissionFactors[formData.category] || 1.0,
        date: formData.date
      };

      if (editingEmission) {
        await apiClient.updateEmission(editingEmission.id, emissionData);
      } else {
        await apiClient.createEmission(emissionData);
      }      // Reset form and refresh data
      setFormData({
        activity_name: '',
        category: '',
        description: '',
        amount: '',
        unit: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      setEditingEmission(null);
      fetchEmissions(); // Refresh all data after creating/updating
      
      addToast(
        editingEmission 
          ? 'Emission activity updated successfully!' 
          : 'Emission activity created successfully!', 
        'success'
      );
    } catch (error) {
      console.error('Error saving emission:', error);
      addToast('Failed to save emission activity. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (emission: EmissionActivity) => {
    setEditingEmission(emission);
    setFormData({
      activity_name: emission.activity_name,
      category: emission.category,
      description: emission.description,
      amount: emission.amount.toString(),
      unit: emission.unit,
      date: emission.date.split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this emission entry?')) {
      try {
        await apiClient.deleteEmission(id);
        fetchEmissions(); // Refresh all data after deletion
      } catch (error) {
        console.error('Error deleting emission:', error);
        addToast('Failed to delete emission.', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      activity_name: '',
      category: '',
      description: '',
      amount: '',
      unit: '',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingEmission(null);
    setShowForm(false);
  };

  const handleDocumentExtraction = async (extractedActivities: ExtractedActivity[]) => {
    try {
      setIsSubmitting(true);
      console.log('Processing extracted activities:', extractedActivities);
      
      if (!extractedActivities || extractedActivities.length === 0) {
        addToast('No activities were selected for import.', 'warning');
        return;
      }
      
      // Create all extracted activities
      const promises = extractedActivities.map(async (activity, index) => {
        try {
          // Calculate emission factor if not provided
          const emissionFactor = activity.emission_factor || getDefaultEmissionFactor(activity.category);
          
          const emissionData = {
            activity_name: activity.activity_name,
            category: activity.category as EmissionCategory,
            description: activity.description,
            amount: parseFloat(activity.amount.toString()),
            unit: activity.unit,
            emission_factor: emissionFactor,
            date: activity.date
          };
          
          console.log(`Creating emission ${index + 1}:`, emissionData);
          const result = await apiClient.createEmission(emissionData);
          console.log(`Created emission ${index + 1}:`, result);
          return result;
        } catch (err) {
          console.error(`Failed to create emission ${index + 1}:`, err);
          throw err;
        }
      });

      const results = await Promise.all(promises);
      console.log('All emissions created:', results);
      
      addToast(
        `Successfully added ${extractedActivities.length} emission activities from document!`, 
        'success'
      );
      
      // Close the modal and refresh data
      setShowDocumentUpload(false);
      
      // Refresh emissions data to include the newly uploaded ones
      setTimeout(() => {
        fetchEmissions();
      }, 500);
      
    } catch (error) {
      console.error('Error saving extracted emissions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addToast(`Failed to save emission activities: ${errorMessage}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDefaultEmissionFactor = (category: string): number => {
    // Default emission factors (kg CO2e per unit)
    const defaultFactors = {
      transportation: 0.12, // per km
      energy: 0.5, // per kWh
      manufacturing: 2.0, // per unit
      agriculture: 1.5, // per kg
      waste: 0.8 // per kg
    };
    return defaultFactors[category as keyof typeof defaultFactors] || 1.0;
  };
  const totalEmissions = emissions.reduce((sum, emission) => sum + emission.co2_equivalent, 0);

  const clearFilters = () => {
    setFilters({
      category: '',
      search: '',
      startDate: '',
      endDate: ''
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Emissions Tracking</h1>
            <p className="text-gray-600 mt-1">Track and monitor your carbon emissions</p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" text="Loading emissions data..." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Emissions Tracking</h1>
          <p className="text-gray-600 mt-1">Track and monitor your carbon emissions</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowDocumentUpload(true)} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <FileUp className="h-4 w-4" />
            Extract from Document
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Emission
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{(totalEmissions / 1000).toFixed(3)}</p>
              <p className="text-sm text-gray-600">Total CO₂e (tonnes)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{emissions.length}</p>
              <p className="text-sm text-gray-600">Total Activities</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {emissions.length > 0 ? ((totalEmissions / emissions.length) / 1000).toFixed(3) : '0'}
              </p>
              <p className="text-sm text-gray-600">Avg per Activity (tonnes)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {new Set(emissions.map(e => e.category)).size}
              </p>
              <p className="text-sm text-gray-600">Categories</p>
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
                placeholder="Search activities..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {categoryLabels[category]}
                </option>
              ))}
            </select>

            <input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          {(filters.search || filters.category || filters.startDate || filters.endDate) && (
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emissions List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading emissions...</p>
            </div>
          </CardContent>
        </Card>
      ) : emissions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-600">No emissions recorded yet.</p>
              <Button onClick={() => setShowForm(true)} className="mt-4">
                Add Your First Emission
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {emissions.map((emission) => (
            <Card key={emission.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {emission.activity_name}
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {categoryLabels[emission.category]}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{emission.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <span className="ml-1 font-medium">{emission.amount} {emission.unit}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">CO₂e:</span>
                        <span className="ml-1 font-medium text-red-600">{(emission.co2_equivalent / 1000).toFixed(3)} tonnes</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-1 font-medium">{new Date(emission.date).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Factor:</span>
                        <span className="ml-1 font-medium">{emission.emission_factor.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(emission)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(emission.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900">
                {editingEmission ? 'Edit Emission' : 'Add New Emission'}
              </h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Name *
                  </label>
                  <input
                    type="text"
                    value={formData.activity_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, activity_name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Business travel to NYC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const category = e.target.value as EmissionCategory;
                      setFormData(prev => ({ 
                        ...prev, 
                        category,
                        unit: '' // Reset unit when category changes
                      }));
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {categoryLabels[category]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Additional details about this activity"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select unit</option>
                      {formData.category && commonUnits[formData.category as EmissionCategory]?.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loading size="sm" />
                        {editingEmission ? 'Updating...' : 'Adding...'}
                      </div>
                    ) : (
                      editingEmission ? 'Update Emission' : 'Add Emission'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Document Upload Modal */}
      <Modal
        isOpen={showDocumentUpload}
        onClose={() => setShowDocumentUpload(false)}
        title="Extract Emissions from Document"
        maxWidth="2xl"
      >
        <DocumentUpload
          onExtractedData={handleDocumentExtraction}
          onClose={() => setShowDocumentUpload(false)}
        />
      </Modal>
    </div>
  );
}
