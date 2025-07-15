import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Globe, Award, FileText, BarChart3, Cloud, Leaf, Building2, Coins, CheckCircle } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 to-blue-50 pt-20 pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Offset Your Carbon Footprint with
              <span className="text-green-600"> Blockchain Transparency</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              The world's most comprehensive carbon credit marketplace with blockchain verification,
              AI-powered recommendations, and automated offsetting solutions for modern businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/get-started"
                className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                Start Offsetting Today
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/seller/register"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Become a Seller
                <Building2 className="w-5 h-5" />
              </Link>
              <Link
                to="/api-docs"
                className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Explore Our API
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Carbon Management Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From emission tracking to offset retirement, we provide everything your business needs
              to achieve net-zero goals with blockchain-verified transparency.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Company Onboarding</h3>
              <p className="text-gray-600">
                Create detailed company profiles with address-based verification and comprehensive emission tracking capabilities.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cloud className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Emission Tracking</h3>
              <p className="text-gray-600">
                Log carbon emissions with metadata, timestamps, and evidence. All data stored in our verified Emissions Registry.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Carbon Credits</h3>
              <p className="text-gray-600">
                Access verified carbon credits with ERC-20 blockchain tokens, complete with project metadata and vintage tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Blockchain-Powered Transparency
              </h2>
              <p className="text-xl text-gray-600">
                Every transaction is verified, immutable, and publicly auditable
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Coins className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">HackCarbon ERC-20 Tokens</h3>
                      <p className="text-gray-600">
                        Custom blockchain tokens representing 1 unit of carbon offset with attached metadata for project ID, vintage, and standards.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Retirement Certificates</h3>
                      <p className="text-gray-600">
                        ERC-721 NFTs minted as proof when credits are retired, containing amount, date, reason, and project details.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Net-Zero Badges</h3>
                      <p className="text-gray-600">
                        Automatic recognition when total offsets ≥ total emissions, recorded permanently on the blockchain.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-green-500 to-blue-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Immediate Retirement</h3>
                  <p className="text-gray-600 mb-6">
                    Purchase and retire credits in one transaction. Tokens are immediately burned for credibility, and NFT certificates are minted as proof.
                  </p>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">
                      Audit-friendly • Publicly verifiable • Immutable records
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Carbon Management Suite
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <BarChart3 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-3">Analytics & Reports</h3>
              <p className="text-gray-600 text-sm">
                Comprehensive dashboard with real-time emissions tracking, offset progress, and compliance reports.
              </p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <Globe className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-3">Marketplace</h3>
              <p className="text-gray-600 text-sm">
                Browse and purchase verified carbon credits from global projects with transparent pricing.
              </p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <Zap className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-3">API as a Service</h3>
              <p className="text-gray-600 text-sm">
                Integrate carbon offsetting into your applications with our powerful RESTful API.
              </p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <FileText className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-3">Compliance</h3>
              <p className="text-gray-600 text-sm">
                Generate audit-ready reports and certificates for regulatory compliance and stakeholder reporting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 bg-green-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transparent Pricing for Every Business
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            From startups to enterprises, find the perfect plan for your carbon offsetting needs
          </p>
          <Link
            to="/pricing"
            className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors inline-flex items-center gap-2"
          >
            View Pricing Plans
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Start Your Net-Zero Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join hundreds of companies already using our platform to track, offset, and verify their carbon impact with blockchain transparency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/get-started"
              className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              to="/contact"
              className="border border-gray-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
