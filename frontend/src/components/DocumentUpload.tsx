import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import apiClient from '../lib/api';

interface ExtractedActivity {
  activity_name: string;
  category: string;
  description: string;
  amount: number;
  unit: string;
  emission_factor: number;
  date: string;
}

interface DocumentUploadProps {
  onExtractedData: (data: ExtractedActivity[]) => void;
  onClose: () => void;
}

interface ProcessingStatus {
  status: string;
  message: string;
  progress: number;
  result?: {
    extracted_data?: {
      activities?: ExtractedActivity[];
    };
  };
  error?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onExtractedData, onClose }) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [extractedActivities, setExtractedActivities] = useState<ExtractedActivity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<Set<number>>(new Set());

  const handleExtractionComplete = useCallback((result: ProcessingStatus['result'] | { extracted_data?: { activities?: ExtractedActivity[] } }) => {
    setUploadStatus('completed');
    if (result?.extracted_data?.activities) {
      setExtractedActivities(result.extracted_data.activities);
      // Select all activities by default
      setSelectedActivities(new Set(result.extracted_data.activities.map((_, index: number) => index)));
    }
  }, []);

  const pollProcessingStatus = useCallback(async (taskId: string) => {
    const poll = async () => {
      try {
        const status = await apiClient.getDocumentProcessingStatus(taskId);
        setProcessingStatus(status);

        if (status.status === 'completed') {
          handleExtractionComplete(status.result);
          return;
        } else if (status.status === 'error') {
          setUploadStatus('error');
          return;
        }

        // Continue polling
        setTimeout(poll, 2000);
      } catch (error) {
        console.error('Polling error:', error);
        setUploadStatus('error');
        setProcessingStatus({
          status: 'error',
          message: 'Failed to check processing status',
          progress: 0
        });
      }
    };

    poll();
  }, [handleExtractionComplete]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file size for quick vs async processing
    const isQuickProcessing = file.size <= 2 * 1024 * 1024; // 2MB

    setUploadStatus('uploading');

    const handleQuickExtraction = async (file: File) => {
      const result = await apiClient.processDocumentQuick(file);
      handleExtractionComplete(result);
    };

    const handleAsyncUpload = async (file: File) => {
      const result = await apiClient.uploadDocument(file);
      setCurrentTaskId(result.task_id);
      setUploadStatus('processing');

      // Start polling for status
      pollProcessingStatus(result.task_id);
    };

    try {
      if (isQuickProcessing) {
        await handleQuickExtraction(file);
      } else {
        await handleAsyncUpload(file);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setProcessingStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
        progress: 0
      });
    }
  }, [pollProcessingStatus, handleExtractionComplete]);

  const handleAddSelectedActivities = () => {
    const activitiesToAdd = extractedActivities.filter((_, index) => selectedActivities.has(index));
    onExtractedData(activitiesToAdd);
    onClose();
  };

  const toggleActivitySelection = (index: number) => {
    const newSelected = new Set(selectedActivities);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedActivities(newSelected);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/markdown': ['.md'],
      'text/html': ['.html'],
      'text/csv': ['.csv'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const getProgressColor = () => {
    if (uploadStatus === 'error') return 'bg-red-500';
    if (uploadStatus === 'completed') return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Extract Emissions from Document</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {uploadStatus === 'idle' && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Document for Emission Extraction
              </h3>
              <p className="text-gray-600 mb-4">
                Drop a file here or click to browse. We'll extract emission data automatically.
              </p>
              
              <div className="text-sm text-gray-500 space-y-2">
                <p><strong>Supported formats:</strong></p>
                <div className="grid grid-cols-2 gap-2 text-left max-w-md mx-auto">
                  <div>• PDF documents</div>
                  <div>• Word, Excel, PowerPoint</div>
                  <div>• Markdown, HTML, CSV</div>
                  <div>• Images with text</div>
                </div>
                <p className="mt-4">
                  <span className="text-green-600">Files ≤ 2MB:</span> Instant processing<br />
                  <span className="text-blue-600">Files ≤ 10MB:</span> Background processing
                </p>
              </div>
            </div>
          )}

          {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Processing Document
                </h3>
                <p className="text-gray-600">
                  {processingStatus?.message || 'Uploading and analyzing your document...'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
                  style={{ width: `${processingStatus?.progress || 10}%` }}
                ></div>
              </div>

              <div className="text-sm text-gray-500">
                {processingStatus?.progress || 10}% complete
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Failed</h3>
              <p className="text-red-600 mb-4">
                {processingStatus?.error || processingStatus?.message || 'An error occurred while processing your document.'}
              </p>
              <button
                onClick={() => {
                  setUploadStatus('idle');
                  setProcessingStatus(null);
                  setCurrentTaskId(null);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {uploadStatus === 'completed' && extractedActivities.length > 0 && (
            <div>
              <div className="flex items-center mb-6">
                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Extraction Complete - {extractedActivities.length} Activities Found
                </h3>
              </div>

              <div className="space-y-4 mb-6">
                {extractedActivities.map((activity, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedActivities.has(index)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleActivitySelection(index)}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedActivities.has(index)}
                        onChange={() => toggleActivitySelection(index)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{activity.activity_name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {activity.category}
                          </span>
                          <span>{activity.amount} {activity.unit}</span>
                          <span>Factor: {activity.emission_factor}</span>
                          <span>CO₂: {(activity.amount * activity.emission_factor).toFixed(2)} kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedActivities.size} of {extractedActivities.length} activities selected
                </p>
                <div className="space-x-3">
                  <button
                    onClick={() => setSelectedActivities(new Set())}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Deselect All
                  </button>
                  <button
                    onClick={() => setSelectedActivities(new Set(extractedActivities.map((_, i) => i)))}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleAddSelectedActivities}
                    disabled={selectedActivities.size === 0}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Selected Activities
                  </button>
                </div>
              </div>
            </div>
          )}

          {uploadStatus === 'completed' && extractedActivities.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Emissions Found</h3>
              <p className="text-gray-600 mb-4">
                We couldn't find any emission-related activities in this document. 
                Please try a different document or add emissions manually.
              </p>
              <button
                onClick={() => {
                  setUploadStatus('idle');
                  setProcessingStatus(null);
                  setExtractedActivities([]);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Another Document
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
