import type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  EmissionActivity, 
  CarbonCredit, 
  CreditPurchase, 
  DashboardStats,
  DashboardOverview,
  DashboardInsights,
  Report,
  EmissionSummary,
  AIRecommendationResponse,
  ImpactPrediction,
  EmissionInsights,
  MarketplaceStats,
  ElectricityEstimateRequest,
  FlightEstimateRequest,
  ShippingEstimateRequest,
  CarbonEstimateResponse,
  SupportedActivitiesResponse,
  OffsetEmissionRequest,
  OffsetEmissionResponse,
  OffsetStats,
  BulkOffsetEmissionRequest,
  SellerDashboardStats,
  SellerVerification,
  SellerVerificationRequest,
  CarbonProject,
  CarbonProjectCreate,
  SellerCredit,
  SellerCreditCreate,
  SaleTransaction,
  SellerAnalytics
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = this.getTokenFromStorage();
  }

  private getTokenFromStorage(): string | null {
    try {
      // Try the new auth store format first
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        if (parsed.state && parsed.state.token) {
          return parsed.state.token;
        }
      }
      
      // Fallback to old format for backward compatibility
      const oldToken = localStorage.getItem('auth_token');
      if (oldToken) {
        return oldToken;
      }
      
      return null;
    } catch (error) {
      // Clear corrupted storage
      try {
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('auth_token');
      } catch (clearError) {
      }
      return null;
    }
  }

  private handleAuthenticationFailure(): void {
    this.token = null;
    this.logout();
    
    // Notify auth store about authentication failure
    if (typeof window !== 'undefined') {
      import('../stores/authStore').then(({ useAuthStore }) => {
        const { logout } = useAuthStore.getState();
        logout();
      }).catch(() => {
      });
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}/api/v1${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, clear it and notify auth store
          this.handleAuthenticationFailure();
          throw new Error('Authentication required');
        }
        
        const errorData = await response.json().catch(() => ({ 
          detail: 'Network error' 
        }));
        
        // Handle validation errors (422)
        if (response.status === 422 && errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Pydantic validation errors
            const messages = errorData.detail.map((err: { loc?: string[]; msg: string }) => 
              `${err.loc?.join('.')} - ${err.msg}`
            ).join(', ');
            throw new Error(`Validation error: ${messages}`);
          } else {
            throw new Error(errorData.detail);
          }
        }
        
        // Handle other error types
        const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  setToken(token: string): void {
    this.token = token;
    // Keep backward compatibility with old format
    localStorage.setItem('auth_token', token);
    // The Zustand persist middleware will handle the auth-storage automatically
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await this.request<{ 
      success: boolean; 
      message: string; 
      data: { user: User; access_token: string; token_type: string } 
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    this.setToken(response.data.access_token);
    
    return {
      user: response.data.user,
      token: response.data.access_token,
    };
  }

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await this.request<{ 
      success: boolean; 
      message: string; 
      data: { user: User; access_token: string; token_type: string } 
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    this.setToken(response.data.access_token);
    
    return {
      user: response.data.user,
      token: response.data.access_token,
    };
  }

  async registerBuyer(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await this.request<{ 
      success: boolean; 
      message: string; 
      data: { user: User; access_token: string; token_type: string } 
    }>('/auth/register/buyer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    this.setToken(response.data.access_token);
    
    return {
      user: response.data.user,
      token: response.data.access_token,
    };
  }

  async registerSeller(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await this.request<{ 
      success: boolean; 
      message: string; 
      data: { user: User; access_token: string; token_type: string } 
    }>('/auth/register/seller', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    this.setToken(response.data.access_token);
    
    return {
      user: response.data.user,
      token: response.data.access_token,
    };
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<User>('/auth/me');
    return response;
  }

  async validateToken(): Promise<boolean> {
    try {
      if (!this.token) return false;
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  refreshToken(): void {
    this.token = this.getTokenFromStorage();
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth-storage');
  }

  // Dashboard
  async getDashboardStats(daysBack: number = 30): Promise<DashboardStats> {
    const response = await this.request<DashboardStats>(`/dashboard/stats?days_back=${daysBack}`);
    return response;
  }

  async getDashboardOverview(): Promise<DashboardOverview> {
    const response = await this.request<DashboardOverview>('/dashboard/overview');
    return response;
  }

  async getDashboardInsights(): Promise<DashboardInsights> {
    const response = await this.request<DashboardInsights>('/dashboard/insights');
    return response;
  }

  // Emissions
  async getEmissions(params?: {
    skip?: number;
    limit?: number;
    category?: string;
    start_date?: string;
    end_date?: string;
    filter_by_created_at?: boolean;
  }): Promise<EmissionActivity[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/emissions?${queryString}` : '/emissions';
    
    const response = await this.request<EmissionActivity[]>(endpoint);
    return response;
  }

  async getEmissionSummary(daysBack: number = 30): Promise<EmissionSummary> {
    const response = await this.request<EmissionSummary>(`/emissions/summary?days_back=${daysBack}`);
    return response;
  }

  async createEmission(emission: {
    activity_name: string;
    category: string;
    description: string;
    amount: number;
    unit: string;
    emission_factor: number;
    date: string;
  }): Promise<EmissionActivity> {
    const response = await this.request<EmissionActivity>('/emissions', {
      method: 'POST',
      body: JSON.stringify(emission),
    });
    return response;
  }

  async updateEmission(id: string, emission: {
    activity_name: string;
    category: string;
    description: string;
    amount: number;
    unit: string;
    emission_factor: number;
    date: string;
  }): Promise<EmissionActivity> {
    const response = await this.request<EmissionActivity>(`/emissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(emission),
    });
    return response;
  }

  async deleteEmission(id: string): Promise<void> {
    await this.request<{ message: string }>(`/emissions/${id}`, {
      method: 'DELETE',
    });
  }

  // Carbon Credits Marketplace
  async getCarbonCredits(params?: {
    skip?: number;
    limit?: number;
    project_type?: string;
    min_price?: number;
    max_price?: number;
  }): Promise<CarbonCredit[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/marketplace/credits?${queryString}` : '/marketplace/credits';
    
    const response = await this.request<CarbonCredit[]>(endpoint);
    return response;
  }

  async getCarbonCreditDetails(id: string): Promise<CarbonCredit> {
    const response = await this.request<CarbonCredit>(`/marketplace/credits/${id}`);
    return response;
  }

  async purchaseCredits(purchaseData: { credit_id: string; quantity: number }): Promise<CreditPurchase> {
    const response = await this.request<CreditPurchase>('/marketplace/purchase', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    });
    return response;
  }

  async getUserPurchases(params?: { skip?: number; limit?: number }): Promise<CreditPurchase[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/marketplace/purchases?${queryString}` : '/marketplace/purchases';

    const response = await this.request<CreditPurchase[]>(endpoint);
    return response;
  }

  async retireCredits(retireData: { purchase_id: string; quantity: number }): Promise<CreditPurchase> {
    const response = await this.request<CreditPurchase>('/marketplace/retire', {
      method: 'POST',
      body: JSON.stringify(retireData),
    });
    return response;
  }

  async getMarketplaceStats(): Promise<MarketplaceStats> {
    const response = await this.request<MarketplaceStats>('/marketplace/stats');
    return response;
  }

  // AI Recommendations
  async getRecommendations(params?: {
    budget?: number;
    days_back?: number;
  }): Promise<AIRecommendationResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/ai/recommendations?${queryString}` : '/ai/recommendations';
    
    const response = await this.request<AIRecommendationResponse>(endpoint);
    return response;
  }

  async predictImpact(creditPurchases: unknown[]): Promise<ImpactPrediction> {
    const response = await this.request<ImpactPrediction>('/ai/impact-prediction', {
      method: 'POST',
      body: JSON.stringify(creditPurchases),
    });
    return response;
  }

  async getEmissionInsights(daysBack: number = 90): Promise<EmissionInsights> {
    const response = await this.request<EmissionInsights>(`/ai/emission-insights?days_back=${daysBack}`);
    return response;
  }

  async getOptimizationSuggestions(): Promise<EmissionInsights> {
    const response = await this.request<EmissionInsights>('/ai/optimization-suggestions');
    return response;
  }

  // Reports
  async getReports(skip?: number, limit?: number, reportType?: string): Promise<Report[]> {
    const params = new URLSearchParams();
    if (skip !== undefined) params.append('skip', skip.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    if (reportType) params.append('report_type', reportType);
    
    const queryString = params.toString();
    const url = queryString ? `/reports?${queryString}` : '/reports';
    return this.request<Report[]>(url);
  }

  async getReport(reportId: string): Promise<Report> {
    return this.request<Report>(`/reports/${reportId}`);
  }

  async generateEmissionsReport(startDate: string, endDate: string, reportType: string = 'emissions_summary'): Promise<Report> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      report_type: reportType
    });
    
    return this.request<Report>(`/reports/emissions?${params}`, {
      method: 'POST',
    });
  }

  async generateComplianceReport(complianceStandard: string = 'ISO_14064', year?: number): Promise<Report> {
    const params = new URLSearchParams({
      compliance_standard: complianceStandard,
    });
    
    if (year) {
      params.append('year', year.toString());
    }
    
    return this.request<Report>(`/reports/compliance?${params}`, {
      method: 'POST',
    });
  }

  async generateNetZeroReport(): Promise<Report> {
    return this.request<Report>('/reports/net-zero', {
      method: 'POST',
    });
  }

  async downloadReport(reportId: string, format: string = 'pdf'): Promise<Blob> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/api/v1/reports/${reportId}/download?format=${format}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to download report');
    }

    return response.blob();
  }

  // Document Upload and Processing
  async uploadDocument(file: File): Promise<{ task_id: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}/api/v1/documents/upload-for-emissions`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
        throw new Error('Authentication required');
      }
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async processDocumentQuick(file: File): Promise<{
    extracted_data: {
      activities: Array<{
        activity_name: string;
        category: string;
        description: string;
        amount: number;
        unit: string;
        emission_factor: number;
        date: string;
      }>;
    };
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}/api/v1/documents/quick-extract`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
        throw new Error('Authentication required');
      }
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getDocumentProcessingStatus(taskId: string): Promise<{
    status: string;
    message: string;
    progress: number;
    result?: {
      extracted_data?: {
        activities?: Array<{
          activity_name: string;
          category: string;
          description: string;
          amount: number;
          unit: string;
          emission_factor: number;
          date: string;
        }>;
      };
    };
    error?: string;
  }> {
    return this.request<{
      status: string;
      message: string;
      progress: number;
      result?: {
        extracted_data?: {
          activities?: Array<{
            activity_name: string;
            category: string;
            description: string;
            amount: number;
            unit: string;
            emission_factor: number;
            date: string;
          }>;
        };
      };
      error?: string;
    }>(`/documents/processing-status/${taskId}`);
  }

  async getSupportedDocumentFormats(): Promise<{
    formats: string[];
    max_file_size_mb: number;
  }> {
    return this.request<{
      formats: string[];
      max_file_size_mb: number;
    }>('/documents/supported-formats');
  }

  // Carbon Interface API Estimates
  async estimateElectricityEmissions(request: ElectricityEstimateRequest): Promise<CarbonEstimateResponse> {
    return this.request<CarbonEstimateResponse>('/carbon-estimates/electricity', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async estimateFlightEmissions(request: FlightEstimateRequest): Promise<CarbonEstimateResponse> {
    return this.request<CarbonEstimateResponse>('/carbon-estimates/flight', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async estimateShippingEmissions(request: ShippingEstimateRequest): Promise<CarbonEstimateResponse> {
    return this.request<CarbonEstimateResponse>('/carbon-estimates/shipping', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getEstimate(estimateId: string): Promise<CarbonEstimateResponse> {
    return this.request<CarbonEstimateResponse>(`/carbon-estimates/estimate/${estimateId}`);
  }

  async getSupportedActivities(): Promise<SupportedActivitiesResponse> {
    return this.request<SupportedActivitiesResponse>('/carbon-estimates/supported-activities');
  }

  async estimateComprehensiveEmissions(activityType: string, activityData: Record<string, unknown>): Promise<CarbonEstimateResponse> {
    return this.request<CarbonEstimateResponse>('/carbon-estimates/comprehensive', {
      method: 'POST',
      body: JSON.stringify({
        activity_type: activityType,
        activity_data: activityData,
      }),
    });
  }

  // Offset Management
  async bulkOffsetEmissions(offsetRequest: BulkOffsetEmissionRequest): Promise<OffsetEmissionResponse> {
    return this.request<OffsetEmissionResponse>('/offsets/emissions/bulk', {
      method: 'POST',
      body: JSON.stringify(offsetRequest),
    });
  }

  async offsetEmissions(offsetRequest: OffsetEmissionRequest): Promise<OffsetEmissionResponse> {
    return this.request<OffsetEmissionResponse>('/offsets/emissions', {
      method: 'POST',
      body: JSON.stringify(offsetRequest),
    });
  }

  async getOffsetStats(): Promise<OffsetStats> {
    return this.request<OffsetStats>('/offsets/stats');
  }

  async getAvailableEmissionsForOffset(): Promise<EmissionActivity[]> {
    return this.request<EmissionActivity[]>('/offsets/available-emissions');
  }

  async getOffsetHistory(): Promise<EmissionActivity[]> {
    return this.request<EmissionActivity[]>('/offsets/offset-history');
  }

  // API Management
  async generateAPIKey(): Promise<{ api_key: string; message: string }> {
    return this.request<{ api_key: string; message: string }>('/generate-api-key', {
      method: 'POST',
    });
  }

  async getAPIKey(): Promise<{ api_key: string | null; message: string }> {
    return this.request<{ api_key: string | null; message: string }>('/api-key');
  }

  async getAPIAnalytics(): Promise<{
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
  }> {
    return this.request('/api-analytics');
  }

  async getAPIDocs(): Promise<Record<string, unknown>> {
    return this.request('/api-docs');
  }

  // Pending API Emissions
  async getPendingAPIEmissions(): Promise<{
    pending_emissions: Array<{
      id: string;
      date: string;
      co2_equivalent: number;
      description: string;
      metadata?: {
        external_reference_id?: string;
        user_email?: string;
        estimated_offset_cost?: number;
      };
    }>;
    total_emissions_kg: number;
    estimated_cost_usd: number;
    count: number;
  }> {
    return this.request('/pending-emissions');
  }

  async offsetPendingAPIEmissions(): Promise<{
    status: string;
    message: string;
    purchase_id?: string;
    total_cost?: number;
    emissions_count?: number;
    total_emissions_kg?: number;
  }> {
    return this.request('/offset-pending-emissions', {
      method: 'POST',
    });
  }

  // Seller API methods
  async getSellerDashboard(): Promise<SellerDashboardStats> {
    return this.request('/seller/dashboard');
  }

  async getSellerVerificationStatus(): Promise<SellerVerification | null> {
    return this.request('/seller/verification/status');
  }

  async submitSellerVerification(data: SellerVerificationRequest): Promise<SellerVerification> {
    return this.request('/seller/verification/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSellerProjects(skip = 0, limit = 20): Promise<CarbonProject[]> {
    return this.request(`/seller/projects?skip=${skip}&limit=${limit}`);
  }

  async createSellerProject(data: CarbonProjectCreate): Promise<CarbonProject> {
    return this.request('/seller/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSellerCredits(skip = 0, limit = 20): Promise<SellerCredit[]> {
    return this.request(`/seller/credits?skip=${skip}&limit=${limit}`);
  }

  async createSellerCredit(data: SellerCreditCreate): Promise<SellerCredit> {
    return this.request('/seller/credits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSellerSales(skip = 0, limit = 20): Promise<SaleTransaction[]> {
    return this.request(`/seller/sales?skip=${skip}&limit=${limit}`);
  }

  async getSellerAnalytics(): Promise<SellerAnalytics> {
    return this.request('/seller/analytics');
  }

  async uploadSellerDocument(file: File): Promise<{ url: string; filename: string; size: number; content_type: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${this.baseURL}/api/v1/seller/upload-document`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload document');
    }

    return response.json();
  }

  // Blockchain methods
  async mintCredits(data: { 
    project_id: string; 
    amount: number; 
    wallet_address: string; 
    seller_credit_id?: string; 
    vintage_year?: number; 
    price_per_ton?: number; 
  }) {
    return this.request('/blockchain/mint-credits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async retireCreditsBlockchain(data: { amount: number; reason: string; wallet_address: string; private_key: string }) {
    return this.request('/blockchain/retire-credits', {
      method: 'POST', 
      body: JSON.stringify(data),
    });
  }

  async getBlockchainStatus() {
    return this.request('/blockchain/status');
  }

  async purchaseCreditsBlockchain(data: { project_id: string; quantity: number; wallet_address: string }) {
    return this.request('/blockchain/purchase-credits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
