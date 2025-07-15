import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const APIDocsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation back to landing */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/landing"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Carbon Credit API</h1>
                <p className="text-gray-600 mt-2">Integrate carbon offsetting into your applications</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                to="/register"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/api-example/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Try Demo
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <nav className="lg:col-span-1">
            <div className="sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentation</h3>
              <ul className="space-y-2">
                <li><a href="#getting-started" className="text-blue-600 hover:text-blue-800">Getting Started</a></li>
                <li><a href="#authentication" className="text-blue-600 hover:text-blue-800">Authentication</a></li>
                <li><a href="#endpoints" className="text-blue-600 hover:text-blue-800">API Endpoints</a></li>
                <li><a href="#emissions-estimation" className="text-blue-600 hover:text-blue-800">Emissions Estimation</a></li>
                <li><a href="#carbon-offsetting" className="text-blue-600 hover:text-blue-800">Carbon Offsetting</a></li>
                <li><a href="#examples" className="text-blue-600 hover:text-blue-800">Code Examples</a></li>
                <li><a href="#error-handling" className="text-blue-600 hover:text-blue-800">Error Handling</a></li>
                <li><a href="#rate-limits" className="text-blue-600 hover:text-blue-800">Rate Limits</a></li>
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Getting Started */}
            <section id="getting-started" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-700 mb-4">
                  The Carbon Credit API allows you to integrate carbon emission calculations and offsetting 
                  directly into your applications. Calculate emissions from various activities and purchase 
                  verified carbon offsets programmatically.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Base URL</h3>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
                  <code>https://your-domain.com/external-api</code>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Supported Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Flight</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Shipping</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Transportation</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Energy</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Electricity</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Manufacturing</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Agriculture</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Waste</span>
                </div>
              </div>
            </section>

            {/* Authentication */}
            <section id="authentication" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-700 mb-4">
                  All API requests require authentication using an API key. Include your API key 
                  in the <code className="bg-gray-100 px-2 py-1 rounded">X-API-Key</code> header.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Getting Your API Key</h3>
                <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-1">
                  <li>Sign up for an account on our platform</li>
                  <li>Navigate to the API Access tab in your dashboard</li>
                  <li>Generate your API key</li>
                </ol>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Headers</h3>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <code>{`X-API-Key: your-api-key-here
Content-Type: application/json`}</code>
                </div>
              </div>
            </section>

            {/* API Endpoints */}
            <section id="endpoints" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">API Endpoints</h2>
              
              {/* Emissions Estimation */}
              <div id="emissions-estimation" className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded uppercase">
                    POST
                  </span>
                  <code className="text-lg font-mono">/external-api/emissions</code>
                </div>
                
                <p className="text-gray-700 mb-4">
                  Calculate carbon emissions for various activities including flights, shipping, energy consumption, and more.
                </p>

                <h4 className="font-semibold text-gray-900 mb-2">Request Body</h4>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
                  <code>{`{
  "category": "flight",
  "activity_data": {
    "origin": "DEL",
    "destination": "LHR", 
    "passenger_count": 2,
    "flight_class": "economy"
  },
  "external_reference_id": "flight_booking_123"
}`}</code>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">Response</h4>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
                  <code>{`{
  "estimated_emissions_kg": 1250.5,
  "estimated_offset_cost_usd": 18.75,
  "external_reference_id": "flight_booking_123"
}`}</code>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">Activity Data by Category</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Required Fields</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Optional Fields</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-900">flight</td>
                        <td className="px-4 py-2 text-sm text-gray-600">origin, destination, passenger_count</td>
                        <td className="px-4 py-2 text-sm text-gray-600">flight_class</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-900">shipping</td>
                        <td className="px-4 py-2 text-sm text-gray-600">weight_kg, distance_km</td>
                        <td className="px-4 py-2 text-sm text-gray-600">transport_method</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-900">electricity</td>
                        <td className="px-4 py-2 text-sm text-gray-600">amount, unit</td>
                        <td className="px-4 py-2 text-sm text-gray-600">-</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-900">transportation</td>
                        <td className="px-4 py-2 text-sm text-gray-600">amount, unit</td>
                        <td className="px-4 py-2 text-sm text-gray-600">vehicle_type</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Carbon Offsetting */}
              <div id="carbon-offsetting" className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded uppercase">
                    POST
                  </span>
                  <code className="text-lg font-mono">/external-api/offset</code>
                </div>
                
                <p className="text-gray-700 mb-4">
                  Purchase carbon offsets and receive a certificate via email.
                </p>

                <h4 className="font-semibold text-gray-900 mb-2">Request Body</h4>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
                  <code>{`{
  "external_reference_id": "order_1241",
  "emissions_kg": 1250.5,
  "user_email": "user@example.com"
}`}</code>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">Response</h4>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <code>{`{
  "status": "success",
  "certificate_id": "cert_abc123",
  "report_sent_to": "user@example.com",
  "external_reference_id": "order_1241"
}`}</code>
                </div>
              </div>
            </section>

            {/* Code Examples */}
            <section id="examples" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Code Examples</h2>
              
              {/* JavaScript Example */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">JavaScript / Node.js</h3>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <code>{`// Estimate flight emissions
const estimateResponse = await fetch('/external-api/emissions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key-here'
  },
  body: JSON.stringify({
    category: 'flight',
    activity_data: {
      origin: 'DEL',
      destination: 'LHR',
      passenger_count: 2,
      flight_class: 'economy'
    },
    external_reference_id: 'flight_001'
  })
});

const estimateData = await estimateResponse.json();
console.log('Emissions:', estimateData.estimated_emissions_kg, 'kg CO2');

// Purchase carbon offset
const offsetResponse = await fetch('/external-api/offset', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key-here'
  },
  body: JSON.stringify({
    external_reference_id: 'flight_001',
    emissions_kg: estimateData.estimated_emissions_kg,
    user_email: 'customer@example.com'
  })
});

const offsetData = await offsetResponse.json();
console.log('Certificate ID:', offsetData.certificate_id);`}</code>
                </div>
              </div>

              {/* Python Example */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Python</h3>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <code>{`import requests

# Your API key
API_KEY = 'your-api-key-here'
BASE_URL = 'https://your-domain.com/external-api'

headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
}

# Estimate shipping emissions
estimate_data = {
    'category': 'shipping',
    'activity_data': {
        'weight_kg': 100,
        'distance_km': 500,
        'transport_method': 'truck'
    },
    'external_reference_id': 'shipment_456'
}

response = requests.post(f'{BASE_URL}/emissions', 
                        json=estimate_data, 
                        headers=headers)
estimate_result = response.json()

print(f"Emissions: {estimate_result['estimated_emissions_kg']} kg CO2")

# Purchase offset
offset_data = {
    'external_reference_id': 'shipment_456',
    'emissions_kg': estimate_result['estimated_emissions_kg'],
    'user_email': 'customer@example.com'
}

offset_response = requests.post(f'{BASE_URL}/offset', 
                               json=offset_data, 
                               headers=headers)
offset_result = offset_response.json()

print(f"Certificate: {offset_result['certificate_id']}")`}</code>
                </div>
              </div>
            </section>

            {/* Error Handling */}
            <section id="error-handling" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Handling</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-700 mb-4">
                  The API uses conventional HTTP response codes to indicate success or failure.
                </p>
                
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono">200</td>
                        <td className="px-4 py-2 text-sm text-gray-900">Success</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono">400</td>
                        <td className="px-4 py-2 text-sm text-gray-900">Bad Request - Invalid input data</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono">401</td>
                        <td className="px-4 py-2 text-sm text-gray-900">Unauthorized - Invalid or missing API key</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono">500</td>
                        <td className="px-4 py-2 text-sm text-gray-900">Internal Server Error</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Error Response Format</h3>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <code>{`{
  "detail": "Invalid or missing API key",
  "error_code": "UNAUTHORIZED"
}`}</code>
                </div>
              </div>
            </section>

            {/* Rate Limits */}
            <section id="rate-limits" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Rate Limits</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-700 mb-4">
                  API requests are rate limited to ensure fair usage and system stability.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">60</div>
                    <div className="text-sm text-gray-600">Requests per minute</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">1,000</div>
                    <div className="text-sm text-gray-600">Requests per hour</div>
                  </div>
                </div>
                
                <p className="text-gray-600 mt-4 text-sm">
                  Rate limit headers are included in all responses. Contact support if you need higher limits.
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Carbon Credit Marketplace. All rights reserved.</p>
            <p className="mt-2">
              Need help? <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-800">Contact Support</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default APIDocsPage;
