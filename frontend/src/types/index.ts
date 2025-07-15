// User and Authentication Types
export type UserType = 'buyer' | 'seller' | 'admin';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'under_review';
export type ProjectStandard = 'vcs' | 'gold_standard' | 'cdm' | 'climate_action_reserve' | 'american_carbon_registry';

export interface User {
  id: string;
  email: string;
  company_name: string;
  industry: string;
  location: string;
  type: UserType;
  seller_verification?: SellerVerification;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  company_name: string;
  industry: string;
  location: string;
  full_name?: string;
  phone?: string;
}

// Emission Types
export type EmissionCategory = 'transportation' | 'energy' | 'manufacturing' | 'agriculture' | 'waste';

export interface EmissionActivity {
  id: string;
  user_id: string;
  activity_name: string;
  category: EmissionCategory;
  description: string;
  amount: number;
  unit: string;
  emission_factor: number;
  co2_equivalent: number;
  offset_amount: number;
  is_offset: boolean;
  offset_date?: string;
  offset_purchase_id?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface EmissionSummary {
  total_emissions: number;
  total_offsets: number;
  net_emissions: number;
  offset_percentage: number;
  emissions_by_category: Record<string, number>;
  monthly_trends: MonthlyTrend[];
}

export interface MonthlyTrend {
  month: string;
  emissions: number;
  offsets: number;
  net_emissions: number;
}

// Carbon Credit Types
export type ProjectType = 'forestry' | 'renewable_energy' | 'energy_efficiency' | 'industrial' | 
  'agriculture' | 'waste_management' | 'methane_capture' | 'direct_air_capture';

export type CreditStatus = 'available' | 'sold_out' | 'retired';

export interface CarbonCredit {
  id: string;
  project_name: string;
  project_type: ProjectType;
  price_per_ton: number;
  available_quantity: number;
  total_quantity: number;
  verification_standard: string;
  vintage_year: number;
  project_location: string;
  description: string;
  status: CreditStatus;
  created_at: string;
  updated_at: string;
}

export interface CreditPurchase {
  id: string;
  user_id: string;
  credit_id: string;
  quantity: number;
  price_per_ton: number;
  total_cost: number;
  purchase_date: string;
  status: 'pending' | 'completed' | 'cancelled';
  retired_quantity: number;
  last_retirement_date?: string;
  credit?: CarbonCredit;
}

// Report Types
export interface Report {
  id: string;
  user_id: string;
  report_type: string;
  title: string;
  data: Record<string, unknown>; // JSON data containing report details
  generated_at: string;
  period_start?: string;
  period_end?: string;
}

export interface ReportTemplates {
  emissions_summary: string;
  compliance: string;
  net_zero: string;
  sustainability: string;
}

export interface ReportingAnalytics {
  total_reports_generated: number;
  reports_by_type: Record<string, number>;
  avg_generation_time: number;
  popular_periods: string[];
}

// Dashboard Types
export interface DashboardStats {
  emission_summary: EmissionSummary;
  recent_activities: EmissionActivity[];
  recent_purchases: CreditPurchase[];
  net_zero_progress: number;
  recommendations_count: number;
}

export interface DashboardOverview {
  current_month: {
    emissions: number;
    offsets: number;
    net_emissions: number;
  };
  total_investment: number;
  credits_portfolio: {
    total_credits: number;
    retired_credits: number;
    available_credits: number;
  };
  progress_metrics: {
    offset_percentage: number;
    monthly_reduction: number;
    sustainability_score: number;
  };
}

export interface DashboardInsight {
  type: string;
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DashboardInsights {
  insights: DashboardInsight[];
  total_insights: number;
  last_updated: string;
}

// AI Recommendation Types
export interface CreditRecommendation {
  credit: CarbonCredit;
  recommended_quantity: number;
  total_cost: number;
  offset_percentage: number;
  reason: string;
  strategy: string;
  confidence_score: number;
}

export interface AIRecommendationResponse {
  recommendations: CreditRecommendation[];
  analysis_period: string;
  total_emissions_analyzed: number;
  budget_constraint?: number;
  generated_at: string;
}

export interface ImpactPrediction {
  total_co2_offset: number;
  equivalent_trees_planted: number;
  equivalent_car_miles_offset: number;
  total_investment: number;
  project_type_breakdown: Record<string, number>;
  environmental_benefit_score: number;
  prediction_date: string;
}

export interface EmissionInsights {
  insights: DashboardInsight[];
  analysis_period: string;
  total_emissions: number;
  generated_at: string;
}

export interface MarketplaceStats {
  total_credits_purchased: number;
  total_credits_retired: number;
  total_credits_available_for_retirement: number;
  total_investment: number;
  average_price_per_ton: number;
  number_of_purchases: number;
}

export interface ReportTemplate {
  type: string;
  name: string;
  description: string;
  fields: string[];
  recommended_frequency: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  detail: string;
  error_code?: string;
}

// Carbon Interface API Types
export interface FlightLeg {
  departure_airport: string;
  destination_airport: string;
}

export interface ElectricityEstimateRequest {
  electricity_value: number;
  electricity_unit: string;
  country: string;
  state?: string;
}

export interface FlightEstimateRequest {
  passengers: number;
  legs: FlightLeg[];
  distance_unit: string;
}

export interface ShippingEstimateRequest {
  weight_value: number;
  weight_unit: string;
  distance_value: number;
  distance_unit: string;
  transport_method: string;
}

export interface CarbonEstimateResponse {
  id: string;
  type: string;
  estimated_at: string;
  carbon_emissions: {
    carbon_g: number;
    carbon_kg: number;
    carbon_lb: number;
    carbon_mt: number;
  };
  carbon_kg: number;
  details: Record<string, unknown>;
  raw_response: Record<string, unknown>;
}

export interface SupportedActivitiesResponse {
  supported_activities: {
    [key: string]: {
      description: string;
      required_params: string[];
      optional_params?: string[];
      units: { [key: string]: string | string[] };
    };
  };
}

// Offset Types
export interface OffsetEmissionRequest {
  emission_ids: string[];
  purchase_id: string;
  total_offset_amount: number;
}

export interface OffsetEmissionResponse {
  message: string;
  offset_emissions: EmissionActivity[];
  remaining_credit_amount: number;
  total_offset_amount: number;
}

export interface OffsetStats {
  total_emissions: number;
  total_offset_amount: number;
  net_emissions: number;
  offset_percentage: number;
  offset_emissions_count: number;
  available_for_offset: number;
}

export interface CreditAllocation {
  purchase_id: string;
  amount: number;
}

// Seller-specific Types
export interface SellerVerificationRequest {
  company_registration_document: string;
  environmental_certification?: string;
  business_license?: string;
  additional_documents?: string[];
  verification_message?: string;
}

export interface SellerVerification {
  id: string;
  user_id: string;
  status: VerificationStatus;
  company_registration_document: string;
  environmental_certification?: string;
  business_license?: string;
  additional_documents?: string[];
  verification_message?: string;
  admin_notes?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface CarbonProjectCreate {
  name: string;
  description: string;
  project_type: ProjectType;
  location: string;
  country: string;
  standard: ProjectStandard;
  vintage_year: number;
  estimated_annual_reduction: number;
  total_project_lifetime: number;
  methodology: string;
  supporting_documents: string[];
  images?: string[];
}

export interface CarbonProject extends CarbonProjectCreate {
  id: string;
  seller_id: string;
  status: VerificationStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
}

export interface SellerCreditCreate {
  project_id: string;
  vintage_year: number;
  quantity: number;
  price_per_ton: number;
  blockchain_token_id?: string;
  blockchain_tx_hash?: string;
  metadata_uri?: string;
}

export interface SellerCredit extends SellerCreditCreate {
  id: string;
  seller_id: string;
  status: CreditStatus;
  sold_quantity: number;
  retired_quantity: number;
  created_at: string;
  updated_at: string;
  listed_at?: string;
}

export interface SaleTransaction {
  id: string;
  seller_credit_id: string;
  buyer_id: string;
  quantity: number;
  price_per_ton: number;
  total_amount: number;
  transaction_date: string;
  blockchain_tx_hash?: string;
  status: string;
}

export interface SellerDashboardStats {
  total_projects: number;
  active_listings: number;
  total_credits_minted: number;
  total_credits_sold: number;
  total_revenue: number;
  pending_verification: number;
  monthly_sales: Array<{ month: string; sales: number; revenue: number; }>;
  recent_transactions: Array<{ id: string; buyer: string; quantity: number; amount: number; date: string; }>;
}

export interface SellerAnalytics {
  sales_by_month: Array<{ month: string; sales: number; revenue: number; }>;
  sales_by_project: Array<{ project_name: string; sales: number; revenue: number; }>;
  revenue_trends: Array<{ period: string; revenue: number; }>;
  buyer_analytics: {
    total_buyers: number;
    repeat_customers: number;
    average_purchase_size: number;
  };
  market_performance: {
    market_share: number;
    price_competitiveness: number;
    sales_rank: number;
  };
}

export interface BulkOffsetEmissionRequest {
  emission_ids: string[];
  credit_allocations: CreditAllocation[];
}
