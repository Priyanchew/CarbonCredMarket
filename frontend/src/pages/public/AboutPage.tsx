import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Users, Target, Award, ArrowRight, CheckCircle, TrendingUp, Leaf } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 pt-20 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Leading the Future of Carbon Transparency
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              We're building the world's most transparent and efficient carbon credit marketplace, 
              powered by blockchain technology and AI-driven insights.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
                <p className="text-lg text-gray-600 mb-6">
                  To democratize carbon offsetting by providing businesses of all sizes with 
                  transparent, verified, and blockchain-secured access to high-quality carbon credits.
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  We believe that fighting climate change requires tools that are accessible, 
                  trustworthy, and easy to use. That's why we've built a platform that combines 
                  cutting-edge blockchain technology with intuitive user experience.
                </p>
                <div className="flex gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
                    <div className="text-gray-600">Companies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">50K+</div>
                    <div className="text-gray-600">Tons Offset</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">25+</div>
                    <div className="text-gray-600">Countries</div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-blue-100 p-8 rounded-2xl">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Global Impact</h3>
                    <p className="text-sm text-gray-600">Supporting verified projects worldwide</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Verified Credits</h3>
                    <p className="text-sm text-gray-600">All credits meet international standards</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Community</h3>
                    <p className="text-sm text-gray-600">Building a sustainable future together</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-orange-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Innovation</h3>
                    <p className="text-sm text-gray-600">Leading with blockchain technology</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Built on Cutting-Edge Technology
              </h2>
              <p className="text-xl text-gray-600">
                Our platform leverages blockchain, AI, and modern web technologies to deliver unparalleled transparency
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="bg-green-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Blockchain Verification</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>• ERC-20 tokens for carbon credits</li>
                  <li>• ERC-721 NFT retirement certificates</li>
                  <li>• Immutable transaction records</li>
                  <li>• Public audit trail</li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">AI-Powered Insights</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>• Smart emission calculations</li>
                  <li>• Predictive offset recommendations</li>
                  <li>• Automated compliance monitoring</li>
                  <li>• Trend analysis and forecasting</li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="bg-purple-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Enterprise-Grade Platform</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>• 99.9% uptime SLA</li>
                  <li>• SOC 2 Type II compliance</li>
                  <li>• End-to-end encryption</li>
                  <li>• Scalable API infrastructure</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Complete Carbon Management Ecosystem
              </h2>
            </div>

            <div className="space-y-16">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Company Onboarding & Emission Tracking
                  </h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Create detailed company profiles with address-based verification. 
                    Log carbon emissions with comprehensive metadata, timestamps, and supporting evidence. 
                    All data is stored in our verified Emissions Registry for auditor access.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Address-based company verification</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Detailed emission categorization</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Evidence-backed reporting</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-blue-100 p-8 rounded-2xl">
                  <div className="text-center">
                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-10 h-10 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Verified Company Profiles</h4>
                    <p className="text-gray-600">
                      Secure, auditable company registration with comprehensive emission tracking capabilities
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-8 rounded-2xl md:order-1">
                  <div className="text-center">
                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Leaf className="w-10 h-10 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">HackCarbon Token System</h4>
                    <p className="text-gray-600">
                      ERC-20 tokens representing verified carbon offsets with immutable metadata
                    </p>
                  </div>
                </div>
                <div className="md:order-2">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Advanced Carbon Credit System
                  </h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Our platform uses custom ERC-20 HackCarbon tokens where each token represents 
                    1 unit of verified carbon offset. Credits include detailed metadata about project ID, 
                    vintage year, certification standards, and pricing.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>VCS and Gold Standard verified</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Transparent pricing and vintage tracking</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Immutable project metadata</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Instant Purchase & Retirement
                  </h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Purchase and retire carbon credits in a single transaction. Tokens are immediately 
                    burned for credibility, and ERC-721 Retirement Certificate NFTs are minted as 
                    permanent proof of your climate action.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>One-click purchase and retirement</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>NFT certificates as proof</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Publicly auditable on blockchain</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-orange-100 to-red-100 p-8 rounded-2xl">
                  <div className="text-center">
                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-10 h-10 text-orange-600" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Retirement Certificates</h4>
                    <p className="text-gray-600">
                      ERC-721 NFTs containing amount, date, reason, and project details for every retirement
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Net Zero Recognition */}
      <section className="py-20 bg-green-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Net-Zero Recognition System
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                When your company's total offsets equal or exceed total emissions, you automatically 
                receive a "Net-Zero Badge" recorded permanently on the blockchain. This achievement 
                triggers the NetZeroBadgeEarned event and provides verifiable proof of your net-zero status.
              </p>
              <div className="bg-green-50 p-4 rounded-lg inline-block">
                <p className="text-green-700 font-medium">
                  Join the growing community of net-zero certified companies
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Join the Carbon Revolution?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Start your journey toward net-zero with the most advanced carbon credit platform available today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/contact"
              className="border border-gray-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
