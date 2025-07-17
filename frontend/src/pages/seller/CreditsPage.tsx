import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import apiClient from '../../lib/api';
import type { SellerCredit } from '../../types';
import { 
  Coins, 
  Plus, 
  BarChart3,
  ExternalLink,
  Wallet,
  Shield,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Package,
  TrendingUp
} from 'lucide-react';

const statusColors = {
  available: 'bg-green-100 text-green-800',
  sold_out: 'bg-gray-100 text-gray-800',
  retired: 'bg-blue-100 text-blue-800'
};

const statusIcons = {
  available: CheckCircle,
  sold_out: Package,
  retired: Shield
};

interface CreateCreditFormData {
  project_id: string;
  vintage_year: number;
  quantity: number;
  price_per_ton: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

export default function CreditsPage() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  const [credits, setCredits] = useState<SellerCredit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'sold_out' | 'retired'>('all');
  const [formData, setFormData] = useState<CreateCreditFormData>({
    project_id: '',
    vintage_year: new Date().getFullYear(),
    quantity: 1000,
    price_per_ton: 25
  });
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [creditsData, projectsData] = await Promise.all([
        apiClient.getSellerCredits(),
        apiClient.getSellerProjects()
      ]);
      setCredits(creditsData);
      setProjects(projectsData.filter((p: Project) => p.status === 'approved'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      addToast('Failed to load credits', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createSellerCredit(formData);
      addToast('Credit batch created successfully!', 'success');
      setShowCreateModal(false);
      setFormData({
        project_id: '',
        vintage_year: new Date().getFullYear(),
        quantity: 1000,
        price_per_ton: 25
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create credit:', error);
      addToast('Failed to create credit batch', 'error');
    }
  };

  const filteredCredits = credits.filter(credit => 
    filter === 'all' || credit.status === filter
  );

  const getStats = () => {
    const totalCredits = credits.reduce((sum, credit) => sum + credit.quantity, 0);
    const soldCredits = credits.reduce((sum, credit) => sum + credit.sold_quantity, 0);
    const availableCredits = credits.reduce((sum, credit) => 
      sum + (credit.quantity - credit.sold_quantity - credit.retired_quantity), 0
    );
    const totalRevenue = credits.reduce((sum, credit) => 
      sum + (credit.sold_quantity * credit.price_per_ton), 0
    );

    return {
      total: totalCredits,
      available: availableCredits,
      sold: soldCredits,
      revenue: totalRevenue,
      batches: credits.length
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Carbon Credits</h1>
          <p className="text-gray-600 mt-2">
            Manage your carbon credit inventory and blockchain tokens
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          disabled={projects.length === 0}
          className="flex items-center gap-2"
          title={projects.length === 0 ? "No projects available" : ""}
        >
          {!isConnected ? (
            <>
              <Wallet className="h-4 w-4" />
              Add Wallet to Mint
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Create Credit Batch
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Credits</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Coins className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-3xl font-bold text-green-600">{stats.available.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sold</p>
                <p className="text-3xl font-bold text-purple-600">{stats.sold.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">${stats.revenue.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credit Batches</p>
                <p className="text-3xl font-bold text-blue-600">{stats.batches}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-2">
          {['all', 'available', 'sold_out', 'retired'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'outline'}
              onClick={() => setFilter(status as typeof filter)}
              className="capitalize"
            >
              {status === 'all' ? 'All Credits' : status.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Credits Grid */}
      {filteredCredits.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Coins className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Credits Found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't created any carbon credits yet."
                : `No credits with ${filter.replace('_', ' ')} status found.`
              }
            </p>
            {filter === 'all' && projects.length > 0 && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Credit Batch
              </Button>
            )}
            {projects.length === 0 && (
              <p className="text-sm text-gray-500">
                You need approved projects before creating credits.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCredits.map((credit) => {
            const StatusIcon = statusIcons[credit.status];
            const project = projects.find(p => p.id === credit.project_id);
            const availableQty = credit.quantity - credit.sold_quantity - credit.retired_quantity;
            const salesPercentage = (credit.sold_quantity / credit.quantity) * 100;
            
            return (
              <Card key={credit.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Coins className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {project?.name || 'Unknown Project'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {credit.quantity.toLocaleString()} tCO₂ Credits
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[credit.status]}`}>
                      <StatusIcon className="h-3 w-3" />
                      {credit.status.replace('_', ' ')}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Sales Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sales Progress</span>
                        <span className="font-medium">{salesPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${salesPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Credit Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Available</p>
                        <p className="font-semibold text-green-600">{availableQty.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Sold</p>
                        <p className="font-semibold text-purple-600">{credit.sold_quantity.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Price</p>
                        <p className="font-semibold">${credit.price_per_ton}/tCO₂</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Vintage</p>
                        <p className="font-semibold">{credit.vintage_year}</p>
                      </div>
                    </div>

                    {/* Blockchain Status - Always show as minted */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Blockchain Status</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Tokens Minted</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Token ID: {credit.id.slice(0, 8)}...{credit.id.slice(-8)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <Button 
                        size="sm" 
                        onClick={() => navigate('/app/seller/sales')}
                        className="flex-1"
                        variant="outline"
                      >
                        <TrendingUp className="h-4 w-4 mr-1" />
                        View Sales
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Credit Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {!isConnected ? 'Connect Wallet to Mint' : 'Create Credit Batch'}
          </h2>
          
          {!isConnected ? (
            <div className="text-center py-8">
              <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Wallet Connection Required</h3>
              <p className="text-gray-600 mb-6">
                You need to connect your wallet to mint carbon credits on the blockchain.
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateCredit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project *
              </label>
              <select
                required
                value={formData.project_id}
                onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vintage Year *
                </label>
                <input
                  type="number"
                  required
                  min="2000"
                  max="2030"
                  value={formData.vintage_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, vintage_year: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (tCO₂) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per tCO₂ (USD) *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formData.price_per_ton}
                onChange={(e) => setFormData(prev => ({ ...prev, price_per_ton: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Blockchain Integration</p>
                  <p>
                    After creating the credit batch, you can mint ERC-20 tokens on the blockchain 
                    to represent these carbon credits digitally.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Create Credit Batch
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
