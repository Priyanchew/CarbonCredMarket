import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { 
  TreePine, 
  Coins, 
  TrendingUp, 
  Users, 
  CheckCircle,
  Clock,
  Plus,
  DollarSign,
  BarChart3,
  FileText,
  Award
} from 'lucide-react';
import apiClient from '../../lib/api';
import type { SellerDashboardStats, VerificationStatus } from '../../types';

export default function SellerDashboardPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SellerDashboardStats | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load dashboard stats and verification status in parallel
      const [statsResponse, verificationResponse] = await Promise.all([
        apiClient.getSellerDashboard(),
        apiClient.getSellerVerificationStatus()
      ]);
      
      setStats(statsResponse);
      setVerificationStatus(verificationResponse?.status || null);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      addToast('Failed to load dashboard data. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getVerificationStatusBadge = (status: VerificationStatus | null) => {
    if (!status) return null;
    
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review', icon: Clock },
      under_review: { color: 'bg-blue-100 text-blue-800', text: 'Under Review', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', text: 'Verified', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected', icon: FileText }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Loading size="lg" />
            <p className="text-gray-600 mt-4">Loading seller dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your carbon offset projects and sales</p>
            </div>
            <div className="flex items-center gap-4">
              {getVerificationStatusBadge(verificationStatus)}
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>
        </div>

        {/* Verification Alert */}
        {verificationStatus !== 'approved' && (
          <Card className="mb-6 border-l-4 border-l-yellow-500 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900">Verification Required</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    {verificationStatus === 'pending' && 'Your verification is being reviewed. You can create projects but cannot list credits until approved.'}
                    {verificationStatus === 'under_review' && 'Your verification is under review. We\'ll notify you once the process is complete.'}
                    {verificationStatus === 'rejected' && 'Your verification was rejected. Please review the feedback and resubmit.'}
                    {!verificationStatus && 'Complete seller verification to start creating and listing carbon credit projects.'}
                  </p>
                  <Button size="sm" className="mt-2">
                    {verificationStatus ? 'View Status' : 'Start Verification'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.total_projects || 0}</p>
                </div>
                <TreePine className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Listings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.active_listings || 0}</p>
                </div>
                <Coins className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${stats?.total_revenue?.toLocaleString() || '0'}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Credits Sold</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.total_credits_sold?.toLocaleString() || '0'}</p>
                </div>
                <Award className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Sales Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Monthly Sales</h2>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.monthly_sales && stats.monthly_sales.length > 0 ? (
                <div className="space-y-3">
                  {stats.monthly_sales.slice(-6).map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{month.month}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{month.sales} sales</span>
                        <span className="text-sm text-green-600 font-medium">${month.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No sales data yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.recent_transactions && stats.recent_transactions.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_transactions.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.buyer}</p>
                        <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">${transaction.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{transaction.quantity} tonnes</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="h-auto p-4 text-left justify-start" 
                variant="outline"
                onClick={() => navigate('/app/seller/projects/create')}
              >
                <div className="flex items-start gap-3">
                  <TreePine className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <div className="font-medium">Create New Project</div>
                    <div className="text-sm text-gray-500">Start a new carbon offset project</div>
                  </div>
                </div>
              </Button>

              <Button 
                className="h-auto p-4 text-left justify-start" 
                variant="outline"
                onClick={() => navigate('/app/seller/credits')}
              >
                <div className="flex items-start gap-3">
                  <Coins className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <div className="font-medium">Mint Credits</div>
                    <div className="text-sm text-gray-500">Convert verified projects to credits</div>
                  </div>
                </div>
              </Button>

              <Button 
                className="h-auto p-4 text-left justify-start" 
                variant="outline"
                onClick={() => navigate('/app/seller/sales')}
              >
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <div className="font-medium">View Sales</div>
                    <div className="text-sm text-gray-500">Track sales and revenue data</div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
