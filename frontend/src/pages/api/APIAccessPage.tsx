import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { useToast } from '../../hooks/useToast';
import { 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  BarChart3, 
  Activity,
  ExternalLink,
  Code,
  BookOpen
} from 'lucide-react';
import apiClient from '../../lib/api';

interface APIAnalytics {
  total_requests: number;
  total_emissions_estimated: number;
  total_offsets_purchased: number;
  total_offset_cost: number;
  daily_usage: Array<{
    date: string;
    requests: number;
    emissions: number;
    offsets: number;
  }>;
  weekly_usage: Array<{
    week: string;
    requests: number;
    emissions: number;
    offsets: number;
  }>;
  monthly_usage: Array<{
    month: string;
    requests: number;
    emissions: number;
    offsets: number;
  }>;
  recent_activity: Array<{
    endpoint: string;
    timestamp: string;
    emission_amount?: number;
    offset_done: boolean;
    external_reference_id?: string;
  }>;
}



export default function APIAccessPage() {
  const { addToast } = useToast();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [analytics, setAnalytics] = useState<APIAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchAPIData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [keyResponse, analyticsResponse] = await Promise.all([
        apiClient.getAPIKey(),
        apiClient.getAPIAnalytics()
      ]);
      
      setApiKey(keyResponse.api_key);
      setAnalytics(analyticsResponse);
    } catch (error) {
      console.error('Error fetching API data:', error);
      addToast('Failed to load API data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAPIData();
  }, [fetchAPIData]);

  const generateAPIKey = async () => {
    try {
      setIsGenerating(true);
      const response = await apiClient.generateAPIKey();
      setApiKey(response.api_key);
      addToast('API key generated successfully', 'success');
      
      // Refresh analytics after generating key
      const analyticsResponse = await apiClient.getAPIAnalytics();
      setAnalytics(analyticsResponse);
    } catch (error) {
      console.error('Error generating API key:', error);
      addToast('Failed to generate API key', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAPIKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      addToast('API key copied to clipboard', 'success');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const refreshData = async () => {
    await fetchAPIData();
    addToast('Data refreshed', 'success');
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Access</h1>
          <p className="text-gray-600 mt-2">
            Integrate carbon offsetting into your applications with our API
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              console.log('Opening docs at:', window.location.origin + '/api-docs');
              window.open('/api-docs', '_blank');
            }}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Documentation
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              console.log('Opening demo at:', window.location.origin + '/api-example/index.html');
              window.open('/api-example/index.html', '_blank');
            }}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Try Demos
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* API Key Management */}
        <div className="lg:col-span-1 space-y-6 h-full flex flex-col">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">API Key</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!apiKey ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">
                    Generate an API key to start using our external API endpoints
                  </p>
                  <Button
                    onClick={generateAPIKey}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? 'Generating...' : 'Generate API Key'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Your API Key
                    </label>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAPIKey}
                      className="px-3"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <Button
                      variant="outline"
                      onClick={generateAPIKey}
                      disabled={isGenerating}
                      className="w-full text-sm"
                    >
                      {isGenerating ? 'Generating...' : 'Regenerate Key'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Regenerating will invalidate your current key
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {analytics && (
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Quick Stats</h3>
                  <Button
                    onClick={refreshData}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex items-center">
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.total_requests}
                    </div>
                    <div className="text-sm text-gray-600">Total Requests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.total_emissions_estimated.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">kg CO₂ Estimated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics.total_offsets_purchased}
                    </div>
                    <div className="text-sm text-gray-600">Offsets Purchased</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      ${analytics.total_offset_cost.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Total Spent</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* API Endpoints Overview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold">API Endpoints</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Emissions Estimation Endpoint */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        POST
                      </span>
                      <code className="text-sm font-mono">/external-api/emissions</code>
                    </div>
                    <Activity className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Estimate carbon emissions for various activities including flights, shipping, energy, and more.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-gray-700">Supported Categories:</span>
                      <div className="mt-1 space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {['flight', 'shipping', 'transportation', 'energy', 'electricity', 'manufacturing', 'agriculture', 'waste'].map(cat => (
                            <span key={cat} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Example Response:</span>
                      <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
{`{
  "estimated_emissions_kg": 1250.5,
  "estimated_offset_cost_usd": 18.75,
  "external_reference_id": "flight_001"
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Offset Purchase Endpoint */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        POST
                      </span>
                      <code className="text-sm font-mono">/external-api/offset</code>
                    </div>
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Purchase carbon offsets and receive a certificate via email.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-gray-700">Required Fields:</span>
                      <ul className="mt-1 space-y-1 text-gray-600">
                        <li>• external_reference_id</li>
                        <li>• emissions_kg</li>
                        <li>• user_email</li>
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Example Response:</span>
                      <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
{`{
  "status": "success",
  "certificate_id": "cert_abc123",
  "report_sent_to": "user@example.com",
  "external_reference_id": "order_1241"
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* API Logs - Full Width */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">API Logs</h3>
            <span className="text-sm text-gray-500">
              {analytics?.recent_activity?.length || 0} total requests
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {analytics && analytics.recent_activity && analytics.recent_activity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Timestamp</th>
                    <th className="text-left p-2">Endpoint</th>
                    <th className="text-left p-2">Reference ID</th>
                    <th className="text-left p-2">Emissions (kg)</th>
                    <th className="text-left p-2">Is Offset</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recent_activity.map((activity, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-xs text-gray-600">
                        {formatDate(activity.timestamp)}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          activity.endpoint.includes('emissions') 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {activity.endpoint.replace('/external-api/', '')}
                        </span>
                      </td>
                      <td className="p-2 text-xs font-mono">
                        {activity.external_reference_id || '-'}
                      </td>
                      <td className="p-2 text-xs">
                        {activity.emission_amount ? activity.emission_amount.toFixed(2) : '-'}
                      </td>
                      <td className="p-2 text-xs font-medium">
                        {activity.offset_done ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No API activity found</p>
              <p className="text-sm mt-1">Make some API calls to see logs here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
