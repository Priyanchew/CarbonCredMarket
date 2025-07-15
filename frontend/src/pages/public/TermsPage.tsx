import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Scale, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';

const TermsPage: React.FC = () => {
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
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
                <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-lg text-gray-600">
              Please read these Terms of Service carefully before using the Carbon Credit Marketplace platform. 
              By accessing or using our service, you agree to be bound by these terms.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto prose prose-lg">
            
            {/* Acceptance of Terms */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 mb-4">
                By accessing or using Carbon Credit Marketplace ("the Platform," "we," "us," or "our"), 
                you agree to comply with and be bound by these Terms of Service and our Privacy Policy. 
                If you do not agree to these terms, please do not use our platform.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 m-0">
                  <strong>Important:</strong> These terms constitute a legally binding agreement between you and Carbon Credit Marketplace.
                </p>
              </div>
            </div>

            {/* Platform Description */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Platform Description</h2>
              <p className="text-gray-600 mb-4">
                Carbon Credit Marketplace is a blockchain-powered platform that provides:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li>Carbon emission tracking and verification services</li>
                <li>Carbon credit marketplace for verified offset projects</li>
                <li>Blockchain-based transaction recording and verification</li>
                <li>ERC-20 token system (HackCarbon) representing carbon offsets</li>
                <li>ERC-721 NFT retirement certificates</li>
                <li>API services for third-party integrations</li>
                <li>Analytics, reporting, and compliance tools</li>
              </ul>
            </div>

            {/* User Accounts */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">3. User Accounts and Eligibility</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Requirements</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>You must be at least 18 years old or the age of majority in your jurisdiction</li>
                    <li>You must represent a legitimate business entity for company accounts</li>
                    <li>You must provide accurate and complete information</li>
                    <li>You are responsible for maintaining account security</li>
                    <li>One person may not maintain more than one account</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Responsibilities</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Keep your login credentials secure and confidential</li>
                    <li>Notify us immediately of any unauthorized access</li>
                    <li>Ensure all information provided is accurate and up-to-date</li>
                    <li>Comply with all applicable laws and regulations</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Carbon Credits and Blockchain */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Carbon Credits and Blockchain Tokens</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">HackCarbon Token System</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>HackCarbon tokens are ERC-20 tokens representing verified carbon offsets</li>
                    <li>Each token represents 1 metric ton of CO2 equivalent offset</li>
                    <li>Tokens include metadata for project ID, vintage, and certification standards</li>
                    <li>Token purchases are final and non-refundable</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Retirement and Certificates</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Retired tokens are permanently burned and cannot be transferred</li>
                    <li>ERC-721 NFT certificates are minted as proof of retirement</li>
                    <li>Retirement certificates contain immutable records of offset actions</li>
                    <li>All blockchain transactions are publicly verifiable</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-2">Blockchain Risks</h4>
                      <p className="text-yellow-800 text-sm">
                        Blockchain transactions are irreversible. You acknowledge the risks associated with 
                        blockchain technology, including but not limited to network congestion, gas fees, 
                        and potential smart contract vulnerabilities.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* API Terms */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. API Services</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">API Usage</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>API access is subject to rate limits based on your subscription plan</li>
                    <li>You must use valid API keys and maintain their security</li>
                    <li>API usage is monitored and logged for billing and security purposes</li>
                    <li>We reserve the right to suspend API access for abuse or violations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">API Restrictions</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Do not attempt to circumvent rate limits or security measures</li>
                    <li>Do not use the API for illegal or unauthorized purposes</li>
                    <li>Do not reverse engineer or attempt to extract the source code</li>
                    <li>Do not share API keys with unauthorized parties</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Scale className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">6. Payment and Billing</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Subscription Plans</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Subscription fees are billed monthly or annually as selected</li>
                    <li>Payments are processed securely through third-party providers</li>
                    <li>All fees are non-refundable except as required by law</li>
                    <li>We may change pricing with 30 days' notice</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Carbon Credit Purchases</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Carbon credit prices are set by project developers and market conditions</li>
                    <li>All carbon credit purchases are final and non-refundable</li>
                    <li>Transaction fees may apply for blockchain operations</li>
                    <li>We reserve the right to cancel fraudulent transactions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Prohibited Uses */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Prohibited Uses</h2>
              <p className="text-gray-600 mb-4">You agree not to use the platform for:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Any illegal or unauthorized purpose</li>
                <li>Violating any applicable laws or regulations</li>
                <li>Transmitting malicious code or attempting to hack the platform</li>
                <li>Interfering with other users' access to the platform</li>
                <li>Creating false or misleading emission reports</li>
                <li>Attempting to manipulate carbon credit prices</li>
                <li>Reselling platform access without authorization</li>
                <li>Impersonating another person or entity</li>
              </ul>
            </div>

            {/* Intellectual Property */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Rights</h3>
                  <p className="text-gray-600">
                    The platform, including all content, features, and functionality, is owned by Carbon Credit Marketplace 
                    and is protected by copyright, trademark, and other intellectual property laws.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Rights</h3>
                  <p className="text-gray-600">
                    You retain ownership of your data and content. You grant us a license to use your data 
                    to provide our services and improve the platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Disclaimers */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers and Limitations</h2>
              
              <div className="bg-red-50 p-6 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-2">Important Disclaimers</h4>
                    <ul className="space-y-2 text-red-800 text-sm">
                      <li>• The platform is provided "as is" without warranties of any kind</li>
                      <li>• We do not guarantee uninterrupted or error-free service</li>
                      <li>• Carbon credit values may fluctuate based on market conditions</li>
                      <li>• Blockchain transactions involve inherent risks</li>
                      <li>• We are not responsible for third-party project performance</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Limitation of Liability</h3>
                  <p className="text-gray-600">
                    To the maximum extent permitted by law, Carbon Credit Marketplace shall not be liable 
                    for any indirect, incidental, special, or consequential damages arising from your use of the platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Termination */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Rights</h3>
                  <p className="text-gray-600">
                    You may terminate your account at any time by contacting our support team. 
                    Termination does not entitle you to refunds for unused subscription periods.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Rights</h3>
                  <p className="text-gray-600">
                    We may suspend or terminate your account immediately for violations of these terms, 
                    illegal activity, or other reasons we deem necessary to protect the platform and our users.
                  </p>
                </div>
              </div>
            </div>

            {/* Governing Law */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law and Disputes</h2>
              <div className="space-y-4">
                <p className="text-gray-600">
                  These terms shall be governed by and construed in accordance with the laws of [Jurisdiction], 
                  without regard to its conflict of law provisions.
                </p>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Dispute Resolution</h3>
                  <p className="text-gray-600">
                    Any disputes arising from these terms or your use of the platform shall be resolved through 
                    binding arbitration in accordance with the rules of [Arbitration Provider].
                  </p>
                </div>
              </div>
            </div>

            {/* Changes to Terms */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-600">
                We reserve the right to modify these Terms of Service at any time. We will notify you of 
                significant changes via email or platform notifications. Your continued use of the platform 
                after changes take effect constitutes acceptance of the new terms.
              </p>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-600 mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2 text-gray-600">
                <div><strong>Email:</strong> legal@carboncreditmarketplace.com</div>
                <div><strong>Address:</strong> 123 Sustainability Street, Green City, GC 12345</div>
                <div><strong>Phone:</strong> +1 (555) 123-4567</div>
              </div>
              <div className="mt-4">
                <Link
                  to="/contact"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
                >
                  Contact Legal Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsPage;
