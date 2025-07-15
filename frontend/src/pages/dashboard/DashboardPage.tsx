import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { useToast } from '../../hooks/useToast';
import { 
  EmissionsPieChart, 
  EmissionsLineChart, 
  NetEmissionsAreaChart 
} from '../../components/charts';
import { 
  Cloud, 
  TrendingDown, 
  Target,
  Calendar,
  Leaf,
  BarChart3,
  Activity,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/api';
import type { DashboardStats, EmissionSummary } from '../../types';

export default function DashboardPage() {
  const { addToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [emissionSummary, setEmissionSummary] = useState<EmissionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
  const navigate = useNavigate();
  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]); // eslint-disable-line react-hooks/exhaustive-deps
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsData, summaryData] = await Promise.all([
        apiClient.getDashboardStats(selectedPeriod),
        apiClient.getEmissionSummary(selectedPeriod)
      ]);

      setStats(statsData);
      setEmissionSummary(summaryData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addToast('Failed to load dashboard data. Showing sample data.', 'warning');
      // Set some default data for development
      setEmissionSummary({
        total_emissions: 0,
        total_offsets: 0,
        net_emissions: 0,
        offset_percentage: 0,
        emissions_by_category: {},
        monthly_trends: []
      });
    } finally {
      setIsLoading(false);
    }
  };
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" text="Loading dashboard data..." />
        </div>
      </div>
    );
  }

  const totalEmissions = emissionSummary?.total_emissions || 0;
  const totalOffsets = emissionSummary?.total_offsets || 0;
  const netEmissions = emissionSummary?.net_emissions || (totalEmissions - totalOffsets);
  const offsetPercentage = emissionSummary?.offset_percentage || 
    (totalEmissions > 0 ? Math.round((totalOffsets / totalEmissions) * 100) : 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Track your carbon footprint and offset progress</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === 7 ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(7)}
          >
            7 Days
          </Button>
          <Button
            variant={selectedPeriod === 30 ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(30)}
          >
            30 Days
          </Button>
          <Button
            variant={selectedPeriod === 90 ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(90)}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Emissions</h3>
            <Cloud className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {(totalEmissions / 1000).toFixed(3)} tonnes
            </div>
            <p className="text-xs text-gray-500">CO₂ equivalent ({selectedPeriod} days)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Offsets</h3>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {(totalOffsets / 1000).toFixed(3)} tonnes
            </div>
            <p className="text-xs text-gray-500">CO₂ equivalent offset</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600">Net Emissions</h3>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {(netEmissions / 1000).toFixed(3)} tonnes
            </div>
            <p className="text-xs text-gray-500">Remaining to offset</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600">Offset Progress</h3>
            <Leaf className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {offsetPercentage}%
            </div>
            <p className="text-xs text-gray-500">Carbon footprint offset</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/emissions')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Track New Emission
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/marketplace')}
            >
              <Leaf className="h-4 w-4 mr-2" />
              Browse Credits
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/reports')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        {/* Net Zero Progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Net Zero Progress</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress to Net Zero</span>
                  <span>{offsetPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(offsetPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {offsetPercentage >= 100 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Target className="h-4 w-4" />
                    <span className="font-medium">Congratulations! You've achieved net zero!</span>
                  </div>
                ) : (
                  <p>
                    You're {(100 - offsetPercentage).toFixed(1)}% away from achieving net zero emissions.
                    {netEmissions > 0 && (
                      <span className="block mt-1 text-orange-600">
                        Offset {(netEmissions / 1000).toFixed(3)} tonnes CO₂ more to reach your goal.
                      </span>
                    )}
                  </p>
                )}
              </div>
              
              {/* Emissions Breakdown */}
              {emissionSummary?.emissions_by_category && Object.keys(emissionSummary.emissions_by_category).length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Emissions by Category</h4>
                  <div className="space-y-2">
                    {Object.entries(emissionSummary.emissions_by_category)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 3)
                      .map(([category, amount]) => {
                        const percentage = totalEmissions > 0 ? ((amount as number) / totalEmissions) * 100 : 0;
                        return (
                          <div key={category} className="flex justify-between items-center text-sm">
                            <span className="capitalize">{category.replace('_', ' ')}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-500 h-1.5 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-gray-600 w-12">{percentage.toFixed(0)}%</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recent_activities && stats.recent_activities.length > 0 ? (
                stats.recent_activities.slice(0, 3).map((emission) => (
                  <div key={emission.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{emission.activity_name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(emission.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-red-600 font-medium">
                      +{(emission.co2_equivalent / 1000).toFixed(3)} tonnes CO₂
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No recent activities</p>
                  <p className="text-sm">Start tracking your emissions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Emission Trends</h4>
                    <p className="text-sm text-blue-700">
                      {totalEmissions > 0 
                        ? "Track your progress by adding more emission activities."
                        : "Start by tracking your first emission activity to see trends."
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Offset Opportunities</h4>
                    <p className="text-sm text-green-700">
                      {netEmissions > 0 
                        ? "Visit the marketplace to purchase carbon credits and offset your emissions."
                        : "Great job! You've offset all tracked emissions."
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-900">Next Steps</h4>
                    <p className="text-sm text-orange-700">
                      {totalEmissions === 0 
                        ? "Start by tracking your daily activities and their carbon impact."
                        : "Continue monitoring your emissions and consider setting reduction targets."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>          </CardContent>
        </Card>
      </div>

      {/* Charts and Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emissions by Category Pie Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Emissions by Category</h3>
          </CardHeader>
          <CardContent>
            {emissionSummary?.emissions_by_category ? (
              <EmissionsPieChart 
                data={emissionSummary.emissions_by_category} 
                className="w-full"
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No emissions data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emissions Trends Line Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Emissions Trends</h3>
          </CardHeader>
          <CardContent>
            {emissionSummary?.monthly_trends && emissionSummary.monthly_trends.length > 0 ? (
              <EmissionsLineChart 
                data={emissionSummary.monthly_trends} 
                className="w-full"
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No trend data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Net Emissions Over Time */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Net Emissions Over Time</h3>
          <p className="text-sm text-gray-500">Track your progress towards net zero emissions</p>
        </CardHeader>
        <CardContent>
          {emissionSummary?.monthly_trends && emissionSummary.monthly_trends.length > 0 ? (
            <NetEmissionsAreaChart 
              data={emissionSummary.monthly_trends.map(trend => ({
                month: trend.month,
                emissions: trend.emissions,
                offsets: trend.offsets || 0,
                net: trend.emissions - (trend.offsets || 0)
              }))} 
              className="w-full"
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No data available for net emissions chart</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
