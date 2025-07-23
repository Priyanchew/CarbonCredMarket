import { useState, useRef } from 'react';
import { useToast } from '../../hooks/useToast';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { TreePine, MapPin, Calendar, FileText, Plus } from 'lucide-react';
import apiClient from '../../lib/api';
import type { CarbonProjectCreate, ProjectType, ProjectStandard } from '../../types';

interface ProjectCreatePageProps {
  onProjectCreated?: () => void;
}

export default function ProjectCreatePage({ onProjectCreated }: ProjectCreatePageProps) {
  const { addToast } = useToast();
  const documentInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Note: Removed verification requirement - sellers can now create projects without being verified
  const [formData, setFormData] = useState<CarbonProjectCreate>({
    name: '',
    description: '',
    project_type: 'forestry' as ProjectType,
    location: '',
    country: '',
    standard: 'vcs' as ProjectStandard,
    vintage_year: new Date().getFullYear(),
    estimated_annual_reduction: 0,
    total_project_lifetime: 10,
    methodology: '',
    supporting_documents: [],
    images: []
  });
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  const projectTypes: { value: ProjectType; label: string }[] = [
    { value: 'forestry', label: 'Forestry & Land Use' },
    { value: 'renewable_energy', label: 'Renewable Energy' },
    { value: 'energy_efficiency', label: 'Energy Efficiency' },
    { value: 'industrial', label: 'Industrial Processes' },
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'waste_management', label: 'Waste Management' },
    { value: 'methane_capture', label: 'Methane Capture' },
    { value: 'direct_air_capture', label: 'Direct Air Capture' }
  ];

  const standards: { value: ProjectStandard; label: string }[] = [
    { value: 'vcs', label: 'Verified Carbon Standard (VCS)' },
    { value: 'gold_standard', label: 'Gold Standard' },
    { value: 'cdm', label: 'Clean Development Mechanism (CDM)' },
    { value: 'climate_action_reserve', label: 'Climate Action Reserve' },
    { value: 'american_carbon_registry', label: 'American Carbon Registry' }
  ];

  const handleInputChange = (field: keyof CarbonProjectCreate, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (file: File, type: 'document' | 'image') => {
    try {
      addToast(`Uploading ${file.name}...`, 'info');
      
      // For demo purposes, simulate file upload since backend might not be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a mock URL for the uploaded file
      const mockUrl = `https://storage.carbonmarketplace.com/${type}s/${Date.now()}-${file.name}`;
      
      if (type === 'document') {
        setFormData(prev => ({
          ...prev,
          supporting_documents: [...prev.supporting_documents, mockUrl]
        }));
        setUploadedDocuments(prev => [...prev, file]);
      } else {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), mockUrl]
        }));
        setUploadedImages(prev => [...prev, file]);
      }
      
      addToast(`${file.name} uploaded successfully!`, 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      addToast(`Failed to upload ${file.name}. Using local preview for demo.`, 'warning');
      
      // Still add the file for demo purposes
      if (type === 'document') {
        setUploadedDocuments(prev => [...prev, file]);
      } else {
        setUploadedImages(prev => [...prev, file]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, type: 'document' | 'image') => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const allowedTypes = type === 'document' 
      ? ['.pdf', '.doc', '.docx', '.xls', '.xlsx']
      : ['.jpg', '.jpeg', '.png', '.gif'];
    
    files.forEach(file => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (allowedTypes.includes(fileExtension)) {
        const maxSize = type === 'document' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size <= maxSize) {
          handleFileUpload(file, type);
        } else {
          addToast(`${file.name} is too large. Maximum size is ${type === 'document' ? '10MB' : '5MB'}.`, 'error');
        }
      } else {
        addToast(`${file.name} is not a supported file type.`, 'error');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.location || !formData.country || !formData.methodology) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    if (formData.supporting_documents.length === 0) {
      addToast('At least one supporting document is required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await apiClient.createSellerProject(formData);
      
      addToast('Project created successfully!', 'success');
      
      if (onProjectCreated) {
        onProjectCreated();
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        project_type: 'forestry' as ProjectType,
        location: '',
        country: '',
        standard: 'vcs' as ProjectStandard,
        vintage_year: new Date().getFullYear(),
        estimated_annual_reduction: 0,
        total_project_lifetime: 10,
        methodology: '',
        supporting_documents: [],
        images: []
      });
      setUploadedDocuments([]);
      setUploadedImages([]);
    } catch (error) {
      console.error('Error creating project:', error);
      addToast('Failed to create project. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-2">
            Register a new carbon offset project for verification and credit generation.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TreePine className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Project Details</h2>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type *
                  </label>
                  <select
                    value={formData.project_type}
                    onChange={(e) => handleInputChange('project_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    {projectTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="City, State/Province"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Country name"
                    required
                  />
                </div>
              </div>

              {/* Standards and Vintage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Standard *
                  </label>
                  <select
                    value={formData.standard}
                    onChange={(e) => handleInputChange('standard', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    {standards.map(standard => (
                      <option key={standard.value} value={standard.value}>
                        {standard.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vintage Year *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.vintage_year}
                      onChange={(e) => handleInputChange('vintage_year', parseInt(e.target.value))}
                      className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      min="2000"
                      max="2030"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Project Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Annual Reduction (tonnes CO2) *
                  </label>
                  <input
                    type="number"
                    value={formData.estimated_annual_reduction}
                    onChange={(e) => handleInputChange('estimated_annual_reduction', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Lifetime (years) *
                  </label>
                  <input
                    type="number"
                    value={formData.total_project_lifetime}
                    onChange={(e) => handleInputChange('total_project_lifetime', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Provide a detailed description of your carbon offset project..."
                  required
                />
              </div>

              {/* Methodology */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Methodology *
                </label>
                <textarea
                  value={formData.methodology}
                  onChange={(e) => handleInputChange('methodology', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Describe the methodology used for carbon calculation and verification..."
                  required
                />
              </div>

              {/* Supporting Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supporting Documents *
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'document')}
                >
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">Drag & drop documents here or click to browse</p>
                    <p className="text-xs text-gray-500 mb-4">Accepted formats: PDF, DOC, DOCX, XLS, XLSX (max 10MB each)</p>
                    <input
                      type="file"
                      ref={documentInputRef}
                      className="hidden"
                      id="documents"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        
                        files.forEach(file => {
                          // Check file size (10MB limit)
                          if (file.size > 10 * 1024 * 1024) {
                            addToast(`${file.name} is too large. Maximum size is 10MB.`, 'error');
                            return;
                          }
                          handleFileUpload(file, 'document');
                        });
                        
                        // Reset the input
                        e.target.value = '';
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="hover:bg-gray-50"
                      onClick={() => {
                        if (documentInputRef.current) {
                          documentInputRef.current.click();
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Choose Documents
                    </Button>
                  </div>
                  {uploadedDocuments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Uploaded Documents:</h4>
                      {uploadedDocuments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{file.name}</span>
                            <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
                              setFormData(prev => ({
                                ...prev,
                                supporting_documents: prev.supporting_documents.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Project Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Images (Optional)
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'image')}
                >
                  <div className="text-center">
                    <TreePine className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">Drag & drop images here or click to browse</p>
                    <p className="text-xs text-gray-500 mb-4">Accepted formats: JPG, JPEG, PNG, GIF (max 5MB each)</p>
                    <input
                      type="file"
                      ref={photoInputRef}
                      className="hidden"
                      id="images"
                      multiple
                      accept=".jpg,.jpeg,.png,.gif"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        
                        files.forEach(file => {
                          // Check file size (5MB limit)
                          if (file.size > 5 * 1024 * 1024) {
                            addToast(`${file.name} is too large. Maximum size is 5MB.`, 'error');
                            return;
                          }
                          handleFileUpload(file, 'image');
                        });
                        
                        // Reset the input
                        e.target.value = '';
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="hover:bg-gray-50"
                      onClick={() => {
                        if (photoInputRef.current) {
                          photoInputRef.current.click();
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Choose Images
                    </Button>
                  </div>
                  {uploadedImages.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {uploadedImages.map((file, index) => (
                          <div key={index} className="relative group bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <TreePine className="h-4 w-4 text-green-500" />
                              <span className="text-xs font-medium text-gray-700 truncate">{file.name}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setUploadedImages(prev => prev.filter((_, i) => i !== index));
                                setFormData(prev => ({
                                  ...prev,
                                  images: (prev.images || []).filter((_, i) => i !== index)
                                }));
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-8"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loading size="sm" />
                      Creating Project...
                    </div>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
