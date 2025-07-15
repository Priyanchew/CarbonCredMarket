# Carbon Credit Marketplace Platform

> A comprehensive blockchain-powered carbon offsetting platform with AI-driven insights, API-as-a-Service capabilities, and automated net-zero achievement tracking.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?logo=fastapi)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![Blockchain](https://img.shields.io/badge/Blockchain-121D33?logo=blockchain&logoColor=white)

## 🌍 Project Overview

The Carbon Credit Marketplace is a next-generation platform that revolutionizes how businesses track, offset, and verify their carbon emissions. Built with cutting-edge blockchain technology, AI-powered insights, and modern web frameworks, our platform provides complete transparency and automation for achieving net-zero goals.

### ✨ Key Features

- 🏢 **Company Onboarding & Verification** - Address-based company profiles with comprehensive emission tracking
- 📊 **Advanced Emission Tracking** - Log emissions with metadata, timestamps, and supporting evidence
- 🌿 **Blockchain Carbon Credits** - ERC-20 HackCarbon tokens representing verified offsets
- 💰 **Instant Purchase & Retirement** - One-click offset purchasing with immediate token burning
- 🏅 **Net-Zero Recognition** - Automatic badge system when offsets ≥ emissions
- 📜 **NFT Certificates** - ERC-721 retirement certificates as immutable proof
- 🤖 **AI-Powered Recommendations** - Smart suggestions for optimal offsetting strategies
- 🔗 **API-as-a-Service** - Complete developer toolkit for third-party integrations
- 📈 **Analytics & Reporting** - Real-time dashboards and compliance reports
- 🛒 **Global Marketplace** - Access to verified carbon credits from worldwide projects

## 🏗️ Architecture

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS + Custom Design System
- **Routing**: React Router v6 with nested routes
- **State Management**: Zustand for global state
- **UI Components**: Custom components with Radix UI primitives
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

### Backend Stack
- **Framework**: FastAPI + Python
- **Architecture**: Modular microservices design
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Custom JWT + Supabase Auth
- **API Documentation**: Automatic OpenAPI/Swagger generation
- **Background Tasks**: Celery with Redis
- **File Storage**: Supabase Storage

### Blockchain Infrastructure
- **Smart Contracts**: Solidity on Ethereum/Polygon
- **Token Standards**: ERC-20 (HackCarbon) + ERC-721 (Certificates)
- **Web3 Integration**: ethers.js for blockchain interactions
- **Metadata Storage**: IPFS for decentralized certificate storage

### DevOps & Deployment
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Structured logging with Winston/Python logging
- **Security**: SOC 2 Type II compliance, end-to-end encryption

## 🚀 Core Platform Features

### 1. Company Onboarding and Emission Tracking
Each company creates a detailed profile with address-based verification:

```typescript
interface CompanyProfile {
  id: string;
  name: string;
  address: Address;
  industry: string;
  size: CompanySize;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  totalEmissions: number;
  totalOffsets: number;
}
```

**Emission Logging Capabilities:**
- ✅ Categorized emission entries (Scope 1, 2, 3)
- ✅ Timestamp tracking with evidence attachments
- ✅ Auditor access to emission registry
- ✅ Admin functions for setting company totals
- ✅ Real-time emission calculations

### 2. Blockchain Carbon Credit System
Our platform uses custom ERC-20 tokens (HackCarbon) where each token represents 1 metric ton of CO2 offset:

```solidity
contract HackCarbon is ERC20 {
    struct CreditMetadata {
        string projectId;      // Source project identifier
        uint256 vintage;       // Year of offset generation
        string standard;       // VCS, Gold Standard, etc.
        uint256 price;         // Price per ton
        bool isRetired;        // Retirement status
    }
}
```

**Token Features:**
- 🎯 **Minting**: Only admins with MINTER role can create credits
- 🔒 **Metadata**: Immutable project details and certification standards
- 💎 **Standards**: VCS, Gold Standard, and other verified programs
- 💰 **Pricing**: Dynamic pricing based on project quality and demand

### 3. Purchase & Retirement System
Companies can purchase and immediately retire credits in a single transaction:

```typescript
interface PurchaseAndRetireAction {
  creditId: string;
  quantity: number;
  reason: string;
  companyId: string;
  // Results in:
  // 1. ERC-20 tokens transferred to company
  // 2. Tokens immediately burned (retired)
  // 3. ERC-721 certificate NFT minted
}
```

**Certificate NFT Contains:**
- 📊 Amount of credits retired
- 📅 Date of retirement
- 📝 Reason for retirement
- 🏢 Project details and standards
- 🔗 Blockchain transaction hash

### 4. Net-Zero Recognition System
Automatic achievement tracking and verification:

```typescript
interface NetZeroBadge {
  companyId: string;
  achievedAt: Date;
  totalEmissions: number;
  totalOffsets: number;
  verificationHash: string;
  blockchainProof: string;
}
```

When `totalOffsets >= totalEmissions`, the system:
- 🎖️ Awards Net-Zero Badge to company profile
- 📢 Emits `NetZeroBadgeEarned` blockchain event
- 🏆 Records achievement permanently on-chain
- 📈 Updates company sustainability score

## 🔌 API-as-a-Service

### Developer Integration Platform
Complete API suite for embedding carbon offsetting into any application:

#### Emission Estimation API
```bash
POST /external-api/emissions
Content-Type: application/json
X-API-Key: your_api_key

{
  "activity_type": "flight",
  "origin": "NYC",
  "destination": "LAX", 
  "passengers": 1,
  "external_reference_id": "booking_123"
}

# Response
{
  "estimated_emissions_kg": 924.5,
  "estimated_offset_cost_usd": 13.87,
  "external_reference_id": "booking_123"
}
```

#### Offset Purchase API
```bash
POST /external-api/offset
Content-Type: application/json
X-API-Key: your_api_key

{
  "emissions_kg": 924.5,
  "user_email": "customer@example.com",
  "external_reference_id": "booking_123"
}

# Response
{
  "status": "success",
  "certificate_id": "cert_abc123",
  "report_sent_to": "customer@example.com",
  "external_reference_id": "booking_123"
}
```

### API Rate Limits & Pricing

| Plan | Monthly Requests | Rate Limit | Price |
|------|-----------------|------------|-------|
| **Starter** | 1,000 | 10/min | Free |
| **Professional** | 10,000 | 100/min | $99/month |
| **Enterprise** | Unlimited | Custom | Custom |

### Demo Applications
We provide three ready-to-use demo applications:

1. **✈️ Flight Offsetting** - Calculate and offset flight emissions
2. **🛒 E-commerce Integration** - Add carbon offsetting to checkout flows
3. **🚗 Ride Sharing** - Offset transportation emissions in real-time

Access demos at: `https://your-domain.com/api-example/`

## 🌐 Browser Extension

### Product Carbon Footprint Calculator & Offsetter

Our browser extension allows users to calculate and offset the carbon footprint of products they're viewing on e-commerce websites:

#### Features
- 🔍 **Automatic Product Detection** - Scans product pages for relevant information
- 📊 **AI-Powered Calculations** - Estimates emissions based on product category, materials, and shipping
- 💡 **Real-time Suggestions** - Shows carbon footprint while browsing
- ⚡ **One-Click Offsetting** - Purchase offsets directly from the extension
- 📱 **Cross-Platform** - Works on Chrome, Firefox, Safari, and Edge
- 🏪 **E-commerce Integration** - Supports major platforms (Amazon, Shopify, WooCommerce)

#### How It Works
1. **Product Scanning**: Extension detects when user is on a product page
2. **Emission Calculation**: AI analyzes product data and estimates carbon footprint
3. **Offset Options**: Displays verified carbon credit options
4. **Purchase Flow**: Seamless offset purchase with certificate generation
5. **Impact Tracking**: Personal dashboard showing total offsets and impact

#### Installation
```bash
# Development installation
git clone https://github.com/your-org/carbon-extension
cd carbon-extension
npm install
npm run build
# Load extension in browser developer mode
```

#### Extension API Integration
The extension connects to our platform APIs:

```typescript
// Extension content script
const productData = await scanProductPage();
const emissions = await calculateEmissions(productData);
const offsetOptions = await getOffsetOptions(emissions);
```

## 📁 Project Structure

```
carbon-credit-marketplace/
├── 📁 frontend/                 # React + TypeScript frontend
│   ├── 📁 src/
│   │   ├── 📁 components/       # Reusable UI components
│   │   ├── 📁 pages/           # Page components
│   │   │   ├── 📁 public/      # Public marketing pages
│   │   │   ├── 📁 auth/        # Authentication pages
│   │   │   ├── 📁 dashboard/   # Dashboard and analytics
│   │   │   ├── 📁 emissions/   # Emission tracking
│   │   │   ├── 📁 marketplace/ # Carbon credit marketplace
│   │   │   └── 📁 api/         # API management
│   │   ├── 📁 hooks/           # React hooks
│   │   ├── 📁 stores/          # Zustand state management
│   │   ├── 📁 types/           # TypeScript type definitions
│   │   └── 📁 utils/           # Utility functions
│   ├── 📁 public/              # Static assets
│   │   └── 📁 api-example/     # API demo applications
│   └── 📄 package.json
├── 📁 backend/                  # FastAPI + Python backend
│   ├── 📁 app/
│   │   ├── 📁 api/             # API endpoints
│   │   │   └── 📁 v1/          # API version 1
│   │   ├── 📁 core/            # Core configuration
│   │   ├── 📁 db/              # Database configuration
│   │   ├── 📁 models/          # Pydantic models
│   │   ├── 📁 services/        # Business logic
│   │   └── 📁 utils/           # Utility functions
│   ├── 📄 main.py              # FastAPI application entry
│   └── 📄 requirements.txt
├── 📁 extension/                # Browser extension
│   ├── 📁 src/
│   │   ├── 📄 content.ts       # Content script
│   │   ├── 📄 background.ts    # Background script
│   │   ├── 📄 popup.tsx        # Extension popup
│   │   └── 📄 api.ts           # API integration
│   ├── 📄 manifest.json        # Extension manifest
│   └── 📄 package.json
├── 📁 blockchain/               # Smart contracts
│   ├── 📁 contracts/           # Solidity contracts
│   ├── 📁 scripts/             # Deployment scripts
│   └── 📁 test/                # Contract tests
├── 📁 docs/                    # Documentation
│   ├── 📄 API.md               # API documentation
│   ├── 📄 DEPLOYMENT.md        # Deployment guide
│   └── 📄 CONTRIBUTING.md      # Contribution guidelines
├── 📄 docker-compose.yml       # Multi-service orchestration
├── 📄 .github/                 # GitHub workflows
└── 📄 README.md                # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.9+ and pip
- Docker and Docker Compose
- Supabase account
- Ethereum wallet (for blockchain features)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/your-org/carbon-credit-marketplace
cd carbon-credit-marketplace
```

2. **Environment Setup**
```bash
# Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Configure your environment variables
# - Supabase credentials
# - JWT secrets
# - Blockchain RPC URLs
# - Third-party API keys
```

3. **Database Setup**
```bash
# Run Supabase migrations
npx supabase db reset
npx supabase db push
```

4. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

5. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

6. **Browser Extension Setup**
```bash
cd extension
npm install
npm run build
# Load extension in browser developer mode
```

### Docker Deployment
```bash
# Full stack deployment
docker-compose up -d

# Services will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Documentation: http://localhost:8000/docs
```

## 🔐 Environment Variables

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BLOCKCHAIN_RPC_URL=your_rpc_url
VITE_ENABLE_ANALYTICS=true
```

### Backend (.env)
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# External APIs
CARBON_INTERFACE_API_KEY=your_carbon_interface_key
OPENAI_API_KEY=your_openai_key

# Blockchain
ETHEREUM_RPC_URL=your_ethereum_rpc
PRIVATE_KEY=your_contract_deployer_key
HACKCARBON_CONTRACT_ADDRESS=0x...

## 🔗 API Documentation

### Authentication
All API requests require authentication via API key:

```bash
curl -H "X-API-Key: your_api_key" \
     -H "Content-Type: application/json" \
     https://api.carboncredit.com/v1/emissions
```

### Core Endpoints

#### Company Management
- `GET /api/v1/companies/profile` - Get company profile
- `PUT /api/v1/companies/profile` - Update company information
- `POST /api/v1/companies/verify` - Submit verification documents

#### Emission Tracking
- `GET /api/v1/emissions` - List company emissions
- `POST /api/v1/emissions` - Log new emission entry
- `PUT /api/v1/emissions/{id}` - Update emission entry
- `DELETE /api/v1/emissions/{id}` - Delete emission entry

#### Carbon Credit Marketplace
- `GET /api/v1/marketplace/credits` - Browse available credits
- `GET /api/v1/marketplace/credits/{id}` - Get credit details
- `POST /api/v1/marketplace/purchase` - Purchase credits
- `POST /api/v1/marketplace/retire` - Retire purchased credits

#### External API (API-as-a-Service)
- `POST /external-api/emissions` - Estimate emissions
- `POST /external-api/offset` - Purchase and retire offsets

#### Analytics & Reporting
- `GET /api/v1/analytics/dashboard` - Dashboard statistics
- `GET /api/v1/analytics/emissions-trend` - Emission trends
- `GET /api/v1/reports/generate` - Generate compliance reports
- `GET /api/v1/reports/certificate/{id}` - Download retirement certificate

### Complete API documentation available at: `/docs` (Swagger UI)

### Environment-Specific Configurations

- **Development**: Hot reloading, debug logs, test data
- **Staging**: Production-like environment for testing
- **Production**: Optimized builds, monitoring, scaling

## 🔒 Security Features

- 🛡️ **Row Level Security (RLS)** - Database-level access control
- 🔐 **JWT Authentication** - Secure token-based auth
- 🔒 **API Rate Limiting** - Prevent abuse and DDoS
- 🛡️ **CORS Protection** - Cross-origin request security
- 🔐 **Input Validation** - Comprehensive request validation
- 🗂️ **Encryption at Rest** - All sensitive data encrypted
- 🔒 **TLS/SSL** - End-to-end encryption in transit
- 📊 **Audit Logging** - Complete activity tracking
- 🔍 **Security Headers** - HSTS, CSP, and more
- 🛡️ **Blockchain Security** - Smart contract auditing

## 📈 Monitoring & Analytics

### Application Monitoring
- **Performance**: Response times, throughput, error rates
- **Business Metrics**: Emissions tracked, offsets purchased, net-zero achievements
- **User Analytics**: Platform usage, API consumption, feature adoption
- **Blockchain Monitoring**: Transaction costs, confirmation times, contract events

### Observability Stack
- **Metrics**: Prometheus + Grafana
- **Logging**: Centralized logging with ELK stack
- **Tracing**: OpenTelemetry for distributed tracing
- **Alerting**: PagerDuty integration for critical issues

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Style
- **Frontend**: Prettier + ESLint with TypeScript strict mode
- **Backend**: Black + isort + mypy for Python
- **Documentation**: Markdown with consistent formatting

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Blockchain Standards**: VCS, Gold Standard, and other carbon credit standards
- **Open Source**: Built on amazing open-source technologies
- **Community**: Thanks to all contributors and the carbon offsetting community
- **Partners**: Carbon project developers and verification bodies

---

<div align="center">

**Building a sustainable future through blockchain transparency** 🌍

Made with ❤️ by the Carbon Credit Marketplace Team

[Website](https://carboncredit.com) • [Documentation](https://docs.carboncredit.com) • [API Docs](https://api.carboncredit.com/docs) • [Blog](https://blog.carboncredit.com)

</div>
