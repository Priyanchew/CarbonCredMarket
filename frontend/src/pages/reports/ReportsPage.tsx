import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Target,
  Award,
  Filter,
  Share,
  Mail
} from 'lucide-react';
import apiClient from '../../lib/api';
import type { Report, EmissionSummary } from '../../types';

export default function ReportsPage() {
  const { addToast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [emissionSummary, setEmissionSummary] = useState<EmissionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
  const [reportType, setReportType] = useState<string>('emissions');

  const reportTypes = [
    { value: 'emissions', label: 'Emissions Summary' },
    { value: 'offsets', label: 'Carbon Offsets' },
    { value: 'compliance', label: 'Compliance Report' },
    { value: 'sustainability', label: 'Sustainability Impact' }
  ];
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [reportsData, summaryData] = await Promise.all([
          apiClient.getReports(),
          apiClient.getEmissionSummary(selectedPeriod)
        ]);

        setReports(reportsData);
        setEmissionSummary(summaryData);
      } catch (error) {
        console.error('Error fetching reports data:', error);
        addToast('Failed to load reports data.', 'error');
        // Set default data for development
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

    fetchData();
  }, [selectedPeriod, addToast]);  const generateReport = async () => {
    try {
      setIsGenerating(true);
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - selectedPeriod * 24 * 60 * 60 * 1000).toISOString();
      
      if (reportType === 'emissions') {
        await apiClient.generateEmissionsReport(startDate, endDate, 'emissions_summary');
      } else if (reportType === 'compliance') {
        await apiClient.generateComplianceReport('ISO_14064');
      } else {
        // For other types, default to net-zero report
        await apiClient.generateNetZeroReport();
      }
      
      // Refresh reports list
      const reportsData = await apiClient.getReports();
      setReports(reportsData);
      
      addToast('Report generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating report:', error);
      addToast('Failed to generate report. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };
  const downloadReport = async (reportId: string, filename: string) => {
    try {
      addToast('Preparing download...', 'info');
      const blob = await apiClient.downloadReport(reportId, 'pdf');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `report-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addToast('Report downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading report:', error);
      addToast('Failed to download report. Please try again.', 'error');
    }
  };

  const shareReport = async (reportId: string) => {
    try {
      // Mock share functionality since shareReport API doesn't exist
      const shareLink = `${window.location.origin}/app/reports/shared/${reportId}`;
      
      // Copy share link to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareLink);
        addToast('Share link copied to clipboard!', 'success');
      } else {
        addToast(`Share link: ${shareLink}`, 'info');
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      addToast('Failed to generate share link. Please try again.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  const totalEmissions = emissionSummary?.total_emissions || 0;
  const totalOffsets = emissionSummary?.total_offsets || 0;
  const offsetPercentage = emissionSummary?.offset_percentage || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate and manage your carbon footprint reports</p>
        </div>
        <div className="flex gap-2">
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
          <Button
            variant={selectedPeriod === 365 ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(365)}
          >
            1 Year
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Reports</h3>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {reports.length}
            </div>
            <p className="text-xs text-gray-500">Generated reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600">Current Emissions</h3>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {(totalEmissions / 1000).toFixed(3)} tonnes
            </div>
            <p className="text-xs text-gray-500">CO₂ equivalent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600">Offsets Purchased</h3>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {(totalOffsets / 1000).toFixed(3)} tonnes
            </div>
            <p className="text-xs text-gray-500">Carbon credits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600">Net Zero Progress</h3>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {offsetPercentage}%
            </div>
            <p className="text-xs text-gray-500">Offset achieved</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Generate New Report</h3>
          <p className="text-sm text-gray-600">Create custom reports for different time periods and purposes</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {reportTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={generateReport}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <div>
                  <h4 className="font-medium">Emissions Summary</h4>
                  <p className="text-sm text-gray-500">Comprehensive emission breakdown</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <PieChart className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="font-medium">Carbon Offsets</h4>
                  <p className="text-sm text-gray-500">Offset portfolio analysis</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-6 w-6 text-purple-600" />
                <div>
                  <h4 className="font-medium">Compliance</h4>
                  <p className="text-sm text-gray-500">Regulatory compliance report</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-6 w-6 text-orange-600" />
                <div>
                  <h4 className="font-medium">Sustainability</h4>
                  <p className="text-sm text-gray-500">Impact and progress metrics</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Reports */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
            <p className="text-sm text-gray-600">Download and share your generated reports</p>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h4>
              <p className="text-gray-600 mb-4">Generate your first report to get started</p>
              <Button onClick={generateReport}>
                Generate First Report
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{report.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(report.generated_at).toLocaleDateString()}
                        </span>
                        <span className="capitalize">{report.report_type}</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Generated
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReport(report.id, report.title)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareReport(report.id)}
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Emissions Breakdown</h3>
          </CardHeader>
          <CardContent>
            {emissionSummary?.emissions_by_category && Object.keys(emissionSummary.emissions_by_category).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(emissionSummary.emissions_by_category)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .map(([category, amount]) => {
                    const percentage = totalEmissions > 0 ? ((amount as number) / totalEmissions) * 100 : 0;
                    return (
                      <div key={category} className="flex justify-between items-center">
                        <span className="capitalize text-sm font-medium">{category.replace('_', ' ')}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-12">{percentage.toFixed(0)}%</span>
                          <span className="text-sm font-medium w-20">{((amount as number) / 1000).toFixed(3)} tonnes</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PieChart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No emission data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
          </CardHeader>
          <CardContent>
            {emissionSummary?.monthly_trends && emissionSummary.monthly_trends.length > 0 ? (
              <div className="space-y-3">
                {emissionSummary.monthly_trends.slice(-6).map((trend) => (
                  <div key={trend.month} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{trend.month}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-red-600">+{(trend.emissions / 1000).toFixed(3)} tonnes</span>
                      <span className="text-green-600">-{(trend.offsets / 1000).toFixed(3)} tonnes</span>
                      <span className={`font-medium ${trend.net_emissions > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {trend.net_emissions > 0 ? '+' : ''}{(trend.net_emissions / 1000).toFixed(3)} tonnes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Not enough data for trends</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
