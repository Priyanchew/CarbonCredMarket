"""
Pydantic models for API request/response schemas.
"""
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator
from typing import Optional, List, Any, Dict
from datetime import datetime
from enum import Enum
from uuid import UUID

# Enums
class EmissionCategory(str, Enum):
    TRANSPORTATION = "transportation"
    ENERGY = "energy"
    MANUFACTURING = "manufacturing"
    AGRICULTURE = "agriculture"
    WASTE = "waste"
    API_EXTERNAL = "api_external"

class ProjectType(str, Enum):
    FORESTRY = "forestry"
    RENEWABLE_ENERGY = "renewable_energy"
    ENERGY_EFFICIENCY = "energy_efficiency"
    INDUSTRIAL = "industrial"
    AGRICULTURE = "agriculture"
    WASTE_MANAGEMENT = "waste_management"
    METHANE_CAPTURE = "methane_capture"
    DIRECT_AIR_CAPTURE = "direct_air_capture"

class CreditStatus(str, Enum):
    AVAILABLE = "available"
    SOLD_OUT = "sold_out"
    RETIRED = "retired"

class PurchaseStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class UserType(str, Enum):
    BUYER = "buyer"
    SELLER = "seller"
    ADMIN = "admin"

class VerificationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    UNDER_REVIEW = "under_review"

class ProjectStandard(str, Enum):
    VCS = "vcs"
    GOLD_STANDARD = "gold_standard"
    CDM = "cdm"
    CLIMATE_ACTION_RESERVE = "climate_action_reserve"
    AMERICAN_CARBON_REGISTRY = "american_carbon_registry"

# User Models
class UserBase(BaseModel):
    email: EmailStr
    company_name: str
    industry: str
    location: str
    type: Optional[UserType] = UserType.BUYER
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class User(UserBase):
    id: UUID
    type: UserType = UserType.BUYER
    created_at: datetime
    updated_at: datetime
    full_name: Optional[str] = None
    phone: Optional[str] = None
    seller_verification: Optional['SellerVerification'] = None
    
    @field_validator('type', mode='before')
    @classmethod
    def validate_type(cls, v):
        if v is None:
            return UserType.BUYER
        if isinstance(v, str):
            return UserType(v)
        return v
    
    model_config = ConfigDict(from_attributes=True)

class UserInDB(User):
    hashed_password: str

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Emission Models
class EmissionBase(BaseModel):
    activity_name: str
    category: EmissionCategory
    description: str
    amount: float
    unit: str
    emission_factor: float
    date: datetime

class EmissionCreate(EmissionBase):
    pass

class Emission(EmissionBase):
    id: UUID
    user_id: UUID
    co2_equivalent: float
    offset_amount: float = 0.0
    is_offset: bool = False
    offset_date: Optional[datetime] = None
    offset_purchase_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Carbon Credit Models
class CarbonCreditBase(BaseModel):
    project_name: str
    project_type: ProjectType
    price_per_ton: float
    available_quantity: float
    total_quantity: float
    verification_standard: str
    vintage_year: int
    project_location: str
    description: str

class CarbonCreditCreate(CarbonCreditBase):
    pass

class CarbonCredit(CarbonCreditBase):
    id: UUID
    status: CreditStatus
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Carbon Credit Purchase Models
class CarbonCreditPurchaseBase(BaseModel):
    credit_id: UUID
    quantity: float

class CarbonCreditPurchaseCreate(CarbonCreditPurchaseBase):
    pass

class CarbonCreditPurchase(CarbonCreditPurchaseBase):
    id: UUID
    user_id: UUID
    price_per_ton: float
    total_cost: float
    purchase_date: datetime
    status: PurchaseStatus
    retired_quantity: float = 0.0
    last_retirement_date: Optional[datetime] = None
    credit: Optional[CarbonCredit] = None
    
    model_config = ConfigDict(from_attributes=True)

class RetireCreditsRequest(BaseModel):
    purchase_id: UUID
    quantity: float

class RetireCreditsResponse(BaseModel):
    message: str
    retired_quantity: float
    total_retired_on_purchase: float
    purchase: CarbonCreditPurchase

class MarketplaceStats(BaseModel):
    total_credits_purchased: float
    total_credits_retired: float
    total_credits_available_for_retirement: float
    total_investment: float
    average_price_per_ton: float
    number_of_purchases: int

# Report Models
class ReportBase(BaseModel):
    report_type: str
    title: str
    data: Any  # Allow any valid JSON
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None

class ReportCreate(ReportBase):
    pass

class Report(ReportBase):
    id: UUID
    user_id: UUID
    generated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Dashboard Models
class MonthlyTrend(BaseModel):
    month: str
    emissions: float
    offsets: float
    net_emissions: float

class EmissionSummary(BaseModel):
    total_emissions: float
    total_offsets: float
    net_emissions: float
    offset_percentage: float
    emissions_by_category: dict
    monthly_trends: List[MonthlyTrend]

class DashboardStats(BaseModel):
    emission_summary: EmissionSummary
    recent_activities: List[Emission]
    recent_purchases: List[CarbonCreditPurchase]
    net_zero_progress: float
    recommendations_count: int

# AI Recommendation Models
class CreditRecommendation(BaseModel):
    credit: CarbonCredit
    recommended_quantity: float
    total_cost: float
    offset_percentage: float
    reason: str
    strategy: str
    confidence_score: float

class AIRecommendationResponse(BaseModel):
    recommendations: List[CreditRecommendation]
    analysis_period: str
    total_emissions_analyzed: float
    budget_constraint: Optional[float]
    generated_at: str

# Response Models
class AuthResponseData(BaseModel):
    user: User
    access_token: str
    token_type: str

class AuthResponse(BaseModel):
    success: bool
    message: str
    data: AuthResponseData

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None

# Document Processing Models
class DocumentUploadResponse(BaseModel):
    task_id: str
    message: str
    filename: str

class DocumentProcessingStatus(BaseModel):
    status: str  # uploading, converting, extracting, completed, error
    message: str
    progress: int  # 0-100
    user_id: str
    filename: str
    started_at: str
    completed_at: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ExtractedEmissionActivity(BaseModel):
    activity_name: str
    category: EmissionCategory
    description: str
    amount: float
    unit: str
    emission_factor: float
    date: datetime

class DocumentExtractionResult(BaseModel):
    success: bool
    markdown: str
    extracted_data: Dict[str, Any]
    message: str

class SupportedFormat(BaseModel):
    type: str
    extensions: List[str]
    mime_types: List[str]
    description: str

class SupportedFormatsResponse(BaseModel):
    formats: List[SupportedFormat]
    max_file_size: str
    note: str

# Offset Models
class OffsetEmissionRequest(BaseModel):
    emission_ids: List[UUID]
    purchase_id: UUID
    total_offset_amount: float

class CreditAllocation(BaseModel):
    purchase_id: UUID
    amount: float

class BulkOffsetEmissionRequest(BaseModel):
    emission_ids: List[UUID]
    credit_allocations: List[CreditAllocation]

class OffsetEmissionResponse(BaseModel):
    message: str
    offset_emissions: List[Emission]
    remaining_credit_amount: float
    total_offset_amount: float

class OffsetStats(BaseModel):
    total_emissions: float
    total_offset_amount: float
    net_emissions: float
    offset_percentage: float
    offset_emissions_count: int
    available_for_offset: float

# API-as-a-Service Models
class APIKeyResponse(BaseModel):
    api_key: str
    message: str

# External API-as-a-Service Schemas
class ExternalEmissionCategory(str, Enum):
    TRANSPORTATION = "transportation"
    ENERGY = "energy" 
    MANUFACTURING = "manufacturing"
    AGRICULTURE = "agriculture"
    WASTE = "waste"
    ELECTRICITY = "electricity"
    FLIGHT = "flight"
    SHIPPING = "shipping"
    API_EXTERNAL = "api_external"

class ExternalEmissionRequest(BaseModel):
    category: ExternalEmissionCategory
    activity_data: Dict[str, Any] = Field(..., description="Activity-specific data for emission calculation")
    external_reference_id: Optional[str] = Field(None, description="Client's reference ID for tracking")

class ExternalEmissionResponse(BaseModel):
    estimated_emissions_kg: float = Field(..., description="CO2 emissions in kilograms")
    estimated_offset_cost_usd: float = Field(..., description="Estimated cost to offset in USD")
    external_reference_id: Optional[str] = Field(None, description="Client's reference ID")

class ExternalOffsetRequest(BaseModel):
    external_reference_id: str = Field(..., description="Client's reference ID for tracking")
    emissions_kg: float = Field(..., description="Amount of CO2 to offset in kilograms")
    user_email: EmailStr = Field(..., description="Email for certificate delivery")

class ExternalOffsetResponse(BaseModel):
    status: str = Field(..., description="Operation status")
    certificate_id: str = Field(..., description="Unique certificate ID")
    report_sent_to: EmailStr = Field(..., description="Email where report was sent")
    external_reference_id: str = Field(..., description="Client's reference ID")

class APIUsageLog(BaseModel):
    id: UUID
    user_id: UUID
    endpoint: str
    method: str = "POST"
    timestamp: datetime
    emission_amount: Optional[float] = None
    offset_cost: Optional[float] = None
    offset_done: bool = False
    external_reference_id: Optional[str] = None
    response_status: int = 200
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class APIEndpointInfo(BaseModel):
    endpoint: str
    method: str
    description: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    example_request: Dict[str, Any]
    example_response: Dict[str, Any]

class APIDocsResponse(BaseModel):
    endpoints: List[APIEndpointInfo]
    authentication: Dict[str, str]
    rate_limits: Dict[str, str]
    getting_started: List[str]

class APIAnalyticsResponse(BaseModel):
    daily_usage: List[Dict[str, Any]]
    weekly_usage: List[Dict[str, Any]]
    monthly_usage: List[Dict[str, Any]]
    total_requests: int
    total_emissions_estimated: float
    total_offsets_purchased: int  # Count of offset transactions
    total_offset_cost: float
    recent_activity: List[Dict[str, Any]]

# Seller-specific Models
class SellerVerificationRequest(BaseModel):
    company_registration_document: str = Field(..., description="URL/path to company registration document")
    environmental_certification: Optional[str] = Field(None, description="URL/path to environmental certification")
    business_license: Optional[str] = Field(None, description="URL/path to business license")
    additional_documents: Optional[List[str]] = Field(None, description="Additional supporting documents")
    verification_message: Optional[str] = Field(None, description="Additional message for verification team")

class SellerVerification(BaseModel):
    id: UUID
    user_id: UUID
    status: VerificationStatus
    company_registration_document: str
    environmental_certification: Optional[str] = None
    business_license: Optional[str] = None
    additional_documents: Optional[List[str]] = None
    verification_message: Optional[str] = None
    admin_notes: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[UUID] = None
    
    model_config = ConfigDict(from_attributes=True)

class CarbonProjectCreate(BaseModel):
    name: str = Field(..., description="Project name")
    description: str = Field(..., description="Detailed project description")
    project_type: ProjectType = Field(..., description="Type of carbon offset project")
    location: str = Field(..., description="Project location")
    country: str = Field(..., description="Country where project is located")
    standard: ProjectStandard = Field(..., description="Verification standard")
    vintage_year: int = Field(..., description="Project vintage year")
    estimated_annual_reduction: float = Field(..., description="Estimated annual CO2 reduction in tonnes")
    total_project_lifetime: int = Field(..., description="Project lifetime in years")
    methodology: str = Field(..., description="Methodology used for carbon calculation")
    supporting_documents: List[str] = Field(..., description="URLs/paths to supporting documents")
    images: Optional[List[str]] = Field(None, description="Project images")

class CarbonProject(CarbonProjectCreate):
    id: UUID
    seller_id: UUID
    status: VerificationStatus = VerificationStatus.PENDING
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    approved_at: Optional[datetime] = None
    approved_by: Optional[UUID] = None
    
    model_config = ConfigDict(from_attributes=True)

class SellerCreditCreate(BaseModel):
    project_id: UUID = Field(..., description="Associated carbon project ID")
    vintage_year: int = Field(..., description="Credit vintage year")
    quantity: float = Field(..., description="Total quantity of credits")
    price_per_ton: float = Field(..., description="Price per tonne in USD")
    blockchain_token_id: Optional[str] = Field(None, description="Blockchain token ID if minted")
    blockchain_tx_hash: Optional[str] = Field(None, description="Blockchain transaction hash")
    metadata_uri: Optional[str] = Field(None, description="IPFS URI for metadata")

class SellerCredit(SellerCreditCreate):
    id: UUID
    seller_id: UUID
    status: CreditStatus = CreditStatus.AVAILABLE
    sold_quantity: float = 0.0
    retired_quantity: float = 0.0
    created_at: datetime
    updated_at: datetime
    listed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class SaleTransaction(BaseModel):
    id: UUID
    seller_credit_id: UUID
    buyer_id: UUID
    quantity: float
    price_per_ton: float
    total_amount: float
    transaction_date: datetime
    blockchain_tx_hash: Optional[str] = None
    status: str = "completed"
    
    model_config = ConfigDict(from_attributes=True)

class SellerDashboardStats(BaseModel):
    total_projects: int
    active_listings: int
    total_credits_minted: float
    total_credits_sold: float
    total_revenue: float
    pending_verification: int
    monthly_sales: List[Dict[str, Any]]
    recent_transactions: List[Dict[str, Any]]

class SellerAnalytics(BaseModel):
    sales_by_month: List[Dict[str, Any]]
    sales_by_project: List[Dict[str, Any]]
    revenue_trends: List[Dict[str, Any]]
    buyer_analytics: Dict[str, Any]
    market_performance: Dict[str, Any]

# Resolve forward references
User.model_rebuild()
