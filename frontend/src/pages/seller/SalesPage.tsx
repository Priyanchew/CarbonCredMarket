import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import { apiClient } from '../../lib/api';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  BarChart3,
  ExternalLink,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  CreditCard,
  Coins
} from 'lucide-react';

const statusColors = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  processing: 'bg-blue-100 text-blue-800'
};

const statusIcons = {
  completed: CheckCircle,
  pending: Clock,
  failed: AlertTriangle,
  processing: Package
};

interface SaleDetails {
  id: string;
  buyer_name: string;
  buyer_email: string;
  project_name: string;
  credit_quantity: number;
  price_per_ton: number;
  total_amount: number;
  sale_date: string;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  blockchain_tx_hash?: string;
  payment_method: string;
  carbon_credit_batch_id: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<SaleDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<SaleDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed' | 'processing'>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const { addToast } = useToast();

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch actual sales data from the API
      const salesData = await apiClient.getSellerSales(0, 100);
      
      // Convert API response to SaleDetails format
      const formattedSales: SaleDetails[] = salesData.map(sale => ({
        id: sale.id,
        buyer_name: sale.buyer_name || 'Unknown Buyer',
        buyer_email: sale.buyer_email || '',
        project_name: sale.project_name || 'Unknown Project',
        credit_quantity: sale.quantity,
        price_per_ton: sale.price_per_ton,
        total_amount: sale.total_amount,
        sale_date: sale.transaction_date,
        status: (sale.status as 'completed' | 'pending' | 'failed' | 'processing') || 'pending',
        blockchain_tx_hash: sale.blockchain_tx_hash || undefined,
        payment_method: sale.payment_method || 'Unknown',
        carbon_credit_batch_id: sale.carbon_credit_batch_id || ''
      }));

      setSales(formattedSales);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      addToast('Failed to load sales data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleViewDetails = (sale: SaleDetails) => {
    setSelectedSale(sale);
    setShowDetailsModal(true);
  };

  const handleExportData = () => {
    // In a real app, this would generate and download a CSV/Excel file
    addToast('Sales data export started...', 'info');
    setTimeout(() => {
      addToast('Sales data exported successfully!', 'success');
    }, 2000);
  };

  const filteredSales = sales.filter(sale => {
    if (filter !== 'all' && sale.status !== filter) return false;
    
    if (dateRange !== 'all') {
      const saleDate = new Date(sale.sale_date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const rangeDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90
      }[dateRange];
      
      if (daysDiff > rangeDays) return false;
    }
    
    return true;
  });

  const getStats = () => {
    const completedSales = sales.filter(sale => sale.status === 'completed');
    const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalCredits = completedSales.reduce((sum, sale) => sum + sale.credit_quantity, 0);
    const uniqueBuyers = new Set(completedSales.map(sale => sale.buyer_email)).size;
    const avgPrice = completedSales.length > 0 
      ? completedSales.reduce((sum, sale) => sum + sale.price_per_ton, 0) / completedSales.length 
      : 0;

    return {
      totalRevenue,
      totalCredits,
      uniqueBuyers,
      avgPrice,
      totalSales: completedSales.length,
      pendingSales: sales.filter(sale => sale.status === 'pending').length
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
          <h1 className="text-3xl font-bold text-gray-900">Sales & Revenue</h1>
          <p className="text-gray-600 mt-2">
            Track your carbon credit sales and revenue analytics
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">${stats.totalRevenue.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-gray-600">Credits Sold</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalCredits.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalSales}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Buyers</p>
                <p className="text-3xl font-bold text-orange-600">{stats.uniqueBuyers}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                <p className="text-3xl font-bold text-indigo-600">${stats.avgPrice.toFixed(0)}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Sales</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingSales}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <Filter className="h-5 w-5 text-gray-500 mt-0.5" />
            <span className="text-sm font-medium text-gray-700">Status:</span>
            {['all', 'completed', 'pending', 'processing', 'failed'].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={filter === status ? 'primary' : 'outline'}
                onClick={() => setFilter(status as typeof filter)}
                className="capitalize"
              >
                {status === 'all' ? 'All Sales' : status}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2 items-center">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Period:</span>
            {['7d', '30d', '90d', 'all'].map((range) => (
              <Button
                key={range}
                size="sm"
                variant={dateRange === range ? 'primary' : 'outline'}
                onClick={() => setDateRange(range as typeof dateRange)}
              >
                {range === 'all' ? 'All Time' : `Last ${range}`}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Table */}
      {filteredSales.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Found</h3>
            <p className="text-gray-600">
              {filter === 'all' && dateRange === 'all'
                ? "You haven't made any sales yet."
                : "No sales match your current filters."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buyer & Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits & Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSales.map((sale) => {
                    const StatusIcon = statusIcons[sale.status];
                    return (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {sale.buyer_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {sale.project_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {sale.credit_quantity.toLocaleString()} tCO₂
                            </div>
                            <div className="text-sm text-gray-500">
                              ${sale.price_per_ton}/tCO₂
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            ${sale.total_amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(sale.sale_date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(sale.sale_date).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[sale.status]}`}>
                            <StatusIcon className="h-3 w-3" />
                            {sale.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{sale.payment_method}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(sale)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {sale.blockchain_tx_hash && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // In a real app, this would open the blockchain explorer
                                  addToast('Opening blockchain explorer...', 'info');
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sale Details Modal */}
      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)}>
        {selectedSale && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sale Details</h2>
            
            <div className="space-y-6">
              {/* Sale Overview */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Info</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Sale ID</label>
                      <p className="text-sm text-gray-900">{selectedSale.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date</label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedSale.sale_date).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedSale.status]}`}>
                        {(() => {
                          const StatusIcon = statusIcons[selectedSale.status];
                          return <StatusIcon className="h-3 w-3" />;
                        })()}
                        {selectedSale.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Info</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Company</label>
                      <p className="text-sm text-gray-900">{selectedSale.buyer_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-sm text-gray-900">{selectedSale.buyer_email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Payment Method</label>
                      <p className="text-sm text-gray-900">{selectedSale.payment_method}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Credit Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Project</label>
                    <p className="text-sm text-gray-900">{selectedSale.project_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Credit Batch</label>
                    <p className="text-sm text-gray-900">{selectedSale.carbon_credit_batch_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Quantity</label>
                    <p className="text-sm text-gray-900">{selectedSale.credit_quantity.toLocaleString()} tCO₂</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Price per tCO₂</label>
                    <p className="text-sm text-gray-900">${selectedSale.price_per_ton}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Total Amount</label>
                    <p className="text-xl font-bold text-green-600">${selectedSale.total_amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Blockchain Info */}
              {selectedSale.blockchain_tx_hash && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Transaction</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">Transaction Confirmed</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Transaction Hash</label>
                        <p className="text-sm text-gray-900 font-mono break-all">{selectedSale.blockchain_tx_hash}</p>
                      </div>
                      <Button size="sm" variant="outline" className="mt-2">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Blockchain Explorer
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
              <Button 
                onClick={() => setShowDetailsModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
