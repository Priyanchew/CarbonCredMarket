import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Lock, Users, Mail, ArrowLeft } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gray-50 pt-20 pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-green-100 p-3 rounded-lg">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
                <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-lg text-gray-600">
              Your privacy is important to us. This Privacy Policy explains how Carbon Credit Marketplace 
              collects, uses, and protects your information when you use our platform.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto prose prose-lg">
            
            {/* Information We Collect */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">Information We Collect</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Email address and password for account creation</li>
                    <li>Company name, address, and business details</li>
                    <li>Contact information including phone numbers</li>
                    <li>Profile information and preferences</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Emission and Transaction Data</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Carbon emission logs and supporting documentation</li>
                    <li>Carbon credit purchase and retirement records</li>
                    <li>Blockchain transaction data and wallet addresses</li>
                    <li>API usage logs and integration data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>IP addresses and device information</li>
                    <li>Browser type and operating system</li>
                    <li>Usage analytics and performance metrics</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Information */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">How We Use Your Information</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Platform Services</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Provide carbon credit marketplace and offsetting services</li>
                    <li>Process transactions and maintain emission records</li>
                    <li>Generate compliance reports and certificates</li>
                    <li>Facilitate blockchain verification and NFT minting</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Communication</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Send transaction confirmations and account updates</li>
                    <li>Provide customer support and technical assistance</li>
                    <li>Share platform updates and new features</li>
                    <li>Send marketing communications (with consent)</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Improvement and Analytics</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Analyze platform usage and performance</li>
                    <li>Improve AI recommendations and features</li>
                    <li>Ensure security and prevent fraud</li>
                    <li>Comply with legal and regulatory requirements</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Information Sharing */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Lock className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">Information Sharing and Disclosure</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">We May Share Information:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li><strong>With Service Providers:</strong> Third-party vendors who help operate our platform</li>
                    <li><strong>For Legal Compliance:</strong> When required by law or to protect our rights</li>
                    <li><strong>Business Transfers:</strong> In connection with mergers or acquisitions</li>
                    <li><strong>With Consent:</strong> When you explicitly authorize sharing</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Blockchain Transparency</h4>
                  <p className="text-blue-800">
                    Transaction data recorded on the blockchain is publicly visible by design. 
                    This includes carbon credit purchases, retirements, and certificate generation, 
                    but does not include personal identifying information.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">We Do NOT:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Sell your personal information to third parties</li>
                    <li>Share sensitive business data without authorization</li>
                    <li>Use your data for purposes unrelated to our services</li>
                    <li>Share API keys or authentication credentials</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Data Security */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">Technical Safeguards</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• End-to-end encryption in transit and at rest</li>
                    <li>• SOC 2 Type II compliance</li>
                    <li>• Multi-factor authentication</li>
                    <li>• Regular security audits and penetration testing</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Operational Security</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li>• Access controls and role-based permissions</li>
                    <li>• Employee background checks and training</li>
                    <li>• Incident response and breach notification procedures</li>
                    <li>• Regular backup and disaster recovery testing</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Your Rights */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Privacy Rights</h2>
              
              <div className="space-y-4">
                <div className="border border-gray-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Access and Portability</h4>
                  <p className="text-gray-600">
                    Request copies of your personal data and export your emission records and transaction history.
                  </p>
                </div>

                <div className="border border-gray-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Correction and Updates</h4>
                  <p className="text-gray-600">
                    Update or correct your account information and company details at any time.
                  </p>
                </div>

                <div className="border border-gray-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Deletion</h4>
                  <p className="text-gray-600">
                    Request deletion of your account and personal data, subject to legal retention requirements.
                  </p>
                </div>

                <div className="border border-gray-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Marketing Preferences</h4>
                  <p className="text-gray-600">
                    Opt out of marketing communications while still receiving important account notifications.
                  </p>
                </div>
              </div>
            </div>

            {/* Cookies */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>
              <p className="text-gray-600 mb-4">
                We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized features.
              </p>
              
              <div className="space-y-3">
                <div><strong>Essential Cookies:</strong> Required for platform functionality and security</div>
                <div><strong>Analytics Cookies:</strong> Help us understand how you use our platform</div>
                <div><strong>Preference Cookies:</strong> Remember your settings and preferences</div>
                <div><strong>Marketing Cookies:</strong> Used for targeted advertising (with consent)</div>
              </div>
              
              <p className="text-gray-600 mt-4">
                You can manage cookie preferences through your browser settings or our cookie preference center.
              </p>
            </div>

            {/* Children's Privacy */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-600">
                Our platform is designed for business use and is not intended for children under 13. 
                We do not knowingly collect personal information from children under 13.
              </p>
            </div>

            {/* International Transfers */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">International Data Transfers</h2>
              <p className="text-gray-600 mb-4">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Standard contractual clauses approved by relevant authorities</li>
                <li>Adequacy decisions where applicable</li>
                <li>Other lawful transfer mechanisms as required</li>
              </ul>
            </div>

            {/* Policy Updates */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Policy Updates</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. 
                We'll notify you of significant changes via email or platform notifications.
              </p>
            </div>

            {/* Contact */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gray-200 p-2 rounded-lg">
                  <Mail className="w-6 h-6 text-gray-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">Contact Us</h2>
              </div>
              <p className="text-gray-600 mb-4">
                If you have questions about this Privacy Policy or want to exercise your rights, contact us:
              </p>
              <div className="space-y-2 text-gray-600">
                <div><strong>Email:</strong> privacy@carboncreditmarketplace.com</div>
                <div><strong>Address:</strong> 123 Sustainability Street, Green City, GC 12345</div>
                <div><strong>Phone:</strong> +1 (555) 123-4567</div>
              </div>
              <div className="mt-4">
                <Link
                  to="/contact"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors inline-block"
                >
                  Contact Our Privacy Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;
