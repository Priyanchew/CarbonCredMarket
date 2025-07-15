import { useState, useRef, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import apiClient from '../../lib/api';
import type { SellerVerificationRequest } from '../../types';

interface SellerVerificationPageProps {
  onVerificationSubmitted?: () => void;
}

export default function SellerVerificationPage({ onVerificationSubmitted }: SellerVerificationPageProps) {
  const { addToast } = useToast();
  const { updateSellerVerification, user, refreshUser } = useAuthStore();
  const companyRegInputRef = useRef<HTMLInputElement>(null);
  const envCertInputRef = useRef<HTMLInputElement>(null);
  const businessLicenseInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Force refresh user data on component mount to get latest verification status
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Demo function to simulate admin approval
  const handleDemoApproval = () => {
    if (user?.seller_verification) {
      const approvedVerification = {
        ...user.seller_verification,
        status: 'approved' as const,
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'demo-admin'
      };
      updateSellerVerification(approvedVerification);
      addToast('Demo: Verification approved! You can now create projects.', 'success');
    }
  };
  const [formData, setFormData] = useState<SellerVerificationRequest>({
    company_registration_document: '',
    environmental_certification: '',
    business_license: '',
    additional_documents: [],
    verification_message: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>({});

  const handleInputChange = (field: keyof SellerVerificationRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (field: string, file: File) => {
    try {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        addToast(`${file.name} is too large. Maximum size is 10MB.`, 'error');
        return;
      }

      // Simulate upload for demo purposes
      const mockUrl = `https://demo-storage.example.com/verification/${Date.now()}-${file.name}`;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFormData(prev => ({
        ...prev,
        [field]: mockUrl
      }));
      
      setUploadedFiles(prev => ({
        ...prev,
        [field]: file
      }));
      
      addToast(`${file.name} uploaded successfully`, 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      addToast('Failed to upload file. Please try again.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_registration_document) {
      addToast('Company registration document is required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await apiClient.submitSellerVerification(formData);
      
      // Create a mock seller verification object for the demo
      const newVerification = {
        id: `verification_${Date.now()}`,
        user_id: user?.id || '',
        status: 'under_review' as const,
        company_registration_document: formData.company_registration_document,
        environmental_certification: formData.environmental_certification,
        business_license: formData.business_license,
        additional_documents: formData.additional_documents || [],
        verification_message: formData.verification_message,
        submitted_at: new Date().toISOString()
      };
      
      // Update verification status to under_review
      updateSellerVerification(newVerification);
      
      addToast('Verification request submitted successfully! Your documents are now under review.', 'success');
      
      if (onVerificationSubmitted) {
        onVerificationSubmitted();
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      addToast('Failed to submit verification. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seller Verification</h1>
          <p className="text-gray-600 mt-2">
            Complete your seller verification to start creating and listing carbon offset projects.
          </p>
        </div>

        {/* Under Review Message */}
        {user?.seller_verification?.status === 'under_review' && (
          <Card className="mb-6 border-l-4 border-l-blue-500 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Application Under Review</h3>
                  <p className="text-blue-800 mb-4">
                    Your verification application is currently under review by our team. 
                    You will receive an email notification once the review is complete.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Our verification team will review your submitted documents</li>
                      <li>• This process typically takes 1-3 business days</li>
                      <li>• You'll receive an email with the verification result</li>
                      <li>• Once approved, you can start creating carbon offset projects</li>
                    </ul>
                  </div>
                  
                  {/* Demo Approval Section for Testing */}
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 mb-3">
                      <strong>Demo Mode:</strong> In a real application, you would wait for admin approval. 
                      For demonstration purposes, you can simulate the approval process:
                    </p>
                    <Button 
                      onClick={handleDemoApproval}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      Simulate Approval
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Approved Message */}
        {user?.seller_verification?.status === 'approved' && (
          <Card className="mb-6 border-l-4 border-l-green-500 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">✅ Verification Approved!</h3>
                  <p className="text-green-800 mb-4">
                    Congratulations! Your seller verification has been approved. 
                    You can now create carbon offset projects and mint credits.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">What you can do now:</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Create new carbon offset projects</li>
                      <li>• Mint carbon credits from verified projects</li>
                      <li>• List credits on the marketplace</li>
                      <li>• Track sales and revenue</li>
                    </ul>
                  </div>
                  <div className="mt-4 text-xs text-green-700">
                    Verified on: {user.seller_verification.reviewed_at ? new Date(user.seller_verification.reviewed_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show verification form only if status is pending */}
        {(!user?.seller_verification || user?.seller_verification?.status === 'pending') && (
          <>
            {/* Information Card */}
            <Card className="mb-6 border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Verification Requirements</h3>
                <div className="text-blue-700 text-sm mt-2 space-y-1">
                  <p>• Valid company registration documents</p>
                  <p>• Environmental certifications (if applicable)</p>
                  <p>• Business license or permits</p>
                  <p>• Additional supporting documentation</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Form */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Submit Verification Documents</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Registration Document */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Registration Document *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {uploadedFiles.company_registration_document ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>{uploadedFiles.company_registration_document.name}</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">Drag & drop your company registration document here or click to browse</p>
                      <input
                        type="file"
                        ref={companyRegInputRef}
                        className="hidden"
                        id="company_registration"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('company_registration_document', file);
                          e.target.value = '';
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => {
                          if (companyRegInputRef.current) {
                            companyRegInputRef.current.click();
                          }
                        }}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Environmental Certification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Environmental Certification (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {uploadedFiles.environmental_certification ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>{uploadedFiles.environmental_certification.name}</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">Drag & drop your environmental certification here or click to browse</p>
                      <input
                        type="file"
                        ref={envCertInputRef}
                        className="hidden"
                        id="environmental_certification"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('environmental_certification', file);
                          e.target.value = '';
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => {
                          if (envCertInputRef.current) {
                            envCertInputRef.current.click();
                          }
                        }}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Business License */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business License (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {uploadedFiles.business_license ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>{uploadedFiles.business_license.name}</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">Drag & drop your business license here or click to browse</p>
                      <input
                        type="file"
                        ref={businessLicenseInputRef}
                        className="hidden"
                        id="business_license"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('business_license', file);
                          e.target.value = '';
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => {
                          if (businessLicenseInputRef.current) {
                            businessLicenseInputRef.current.click();
                          }
                        }}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information (Optional)
                </label>
                <textarea
                  value={formData.verification_message}
                  onChange={(e) => handleInputChange('verification_message', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Provide any additional information about your company or projects..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.company_registration_document}
                  className="px-8"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loading size="sm" />
                      Submitting...
                    </div>
                  ) : (
                    'Submit for Verification'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text - only show when verification form is visible */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@example.com" className="text-green-600 hover:underline">
              support@example.com
            </a>
          </p>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
