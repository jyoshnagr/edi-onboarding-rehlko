import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, Paperclip, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DocumentUploadProps {
  onUploadComplete?: (documentId: string) => void;
}

interface AttachmentFile {
  file: File;
  category: string;
  description: string;
  subcategory?: string;
}

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'generating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);
  const [attachmentCategory, setAttachmentCategory] = useState('other');
  const [attachmentSubcategory, setAttachmentSubcategory] = useState('');
  const [attachmentDescription, setAttachmentDescription] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentFile[]>([]);
  const [showInitialAttachments, setShowInitialAttachments] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processDocument = async (file: File) => {
    setUploadStatus('processing');

    try {
      const { data: docData, error: docError } = await supabase
        .from('uploaded_documents')
        .insert({
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          status: 'processing'
        })
        .select()
        .single();

      if (docError) throw docError;

      const documentText = await file.text();

      // Process attachments and read their content
      const attachmentsData = await Promise.all(
        pendingAttachments.map(async (attachment) => {
          try {
            const text = await attachment.file.text();
            return {
              text,
              fileName: attachment.file.name,
              category: attachment.category
            };
          } catch (error) {
            console.error(`Failed to read attachment ${attachment.file.name}:`, error);
            return null;
          }
        })
      );

      // Filter out any failed reads
      const validAttachments = attachmentsData.filter(a => a !== null);

      // Load Business Specs reference document
      let businessSpecsText: string | undefined;
      try {
        const businessSpecsResponse = await fetch('/supabase/data/Rehlko_EDI_PO_850_004010_Spec_(1).docx');
        if (businessSpecsResponse.ok) {
          businessSpecsText = await businessSpecsResponse.text();
        }
      } catch (error) {
        console.log('Business specs not available, proceeding without reference');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-intake-document`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentText,
          fileName: file.name,
          attachments: validAttachments,
          businessSpecsText
        }),
      });

      const result = await response.json();

      if (!result.success || !result.analysis) {
        throw new Error(result.error || 'Failed to analyze document');
      }

      const analysis = result.analysis;

      const { data: intakeData, error: intakeError } = await supabase
        .from('intake_extractions')
        .insert({
          document_id: docData.id,
          company_name: analysis.company_name,
          customer_contacts: analysis.customer_contacts,
          vendor_contacts: [],
          go_live_date: analysis.go_live_date,
          edi_experience: analysis.edi_experience,
          data_format: analysis.data_format,
          transactions: analysis.transactions,
          locations: analysis.locations,
          protocol: analysis.protocol,
          unique_requirements: analysis.unique_requirements
        })
        .select()
        .single();

      if (intakeError) throw intakeError;

      await supabase
        .from('ai_analysis')
        .insert({
          intake_id: intakeData.id,
          readiness_score: analysis.readiness_score,
          complexity_level: analysis.complexity_level,
          identified_risks: analysis.identified_risks,
          missing_information: analysis.missing_information,
          recommendations: analysis.recommendations,
          estimated_timeline: analysis.estimated_timeline
        });

      await supabase
        .from('uploaded_documents')
        .update({ status: 'completed' })
        .eq('id', docData.id);

      if (pendingAttachments.length > 0) {
        for (const attachment of pendingAttachments) {
          const fileDataUrl = await readFileAsDataUrl(attachment.file);
          await supabase
            .from('intake_attachments')
            .insert({
              intake_id: intakeData.id,
              file_name: attachment.file.name,
              file_type: attachment.file.type,
              file_size: attachment.file.size,
              file_url: fileDataUrl,
              upload_category: attachment.category,
              description: attachment.description || null,
              uploaded_by: 'user'
            });
        }
      }

      setExtractedData({
        company_name: analysis.company_name,
        customer_contacts: analysis.customer_contacts,
        go_live_date: analysis.go_live_date,
        edi_experience: analysis.edi_experience,
        data_format: analysis.data_format,
        transactions: analysis.transactions,
        locations: analysis.locations,
        protocol: analysis.protocol,
        unique_requirements: analysis.unique_requirements,
        analysis: {
          readiness_score: analysis.readiness_score,
          complexity_level: analysis.complexity_level,
          identified_risks: analysis.identified_risks,
          missing_information: analysis.missing_information,
          recommendations: analysis.recommendations,
          estimated_timeline: analysis.estimated_timeline
        }
      });
      setIntakeId(intakeData.id);
      setUploadStatus('success');

      if (onUploadComplete) {
        onUploadComplete(docData.id);
      }
    } catch (error) {
      console.error('Error processing document:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process document. Please try again.');
      setUploadStatus('error');
    }
  };


  const generateActionItemsWithAI = async (intakeId: string, extracted: any, analysis: any): Promise<any[]> => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-action-items`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intake: { id: intakeId, ...extracted }, analysis }),
      });

      const data = await response.json();

      if (data.success) {
        return data.actionItems.map((item: any) => ({
          title: item.title,
          description: item.description,
          priority: item.priority,
          assigned_to: item.assigned_to,
          status: 'pending',
          due_date: item.due_date,
          category: item.category,
          story_points: item.priority === 'critical' ? 8 : item.priority === 'high' ? 5 : 3,
          labels: [item.category, extracted.company_name.replace(/\s+/g, '-').toLowerCase()],
          acceptance_criteria: `Complete ${item.title.toLowerCase()} as described`
        }));
      } else {
        console.error('AI generation failed, using fallback');
        return getFallbackActionItems(extracted);
      }
    } catch (error) {
      console.error('Error generating action items with AI:', error);
      return getFallbackActionItems(extracted);
    }
  };

  const getFallbackActionItems = (extracted: any): any[] => {
    return [
      {
        title: 'Collect Network Configuration Details',
        description: 'Request IP addresses, port numbers, and trading partner IDs for test and production environments',
        priority: 'critical',
        assigned_to: 'EDI Team',
        status: 'pending',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'information_gathering',
        story_points: 8,
        labels: ['information_gathering', extracted.company_name.replace(/\s+/g, '-').toLowerCase()],
        acceptance_criteria: 'Complete network configuration collection as described'
      },
      {
        title: 'Schedule Kickoff Meeting',
        description: `Organize kickoff with ${extracted.company_name} and stakeholders`,
        priority: 'high',
        assigned_to: 'Project Manager',
        status: 'pending',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'governance',
        story_points: 5,
        labels: ['governance', extracted.company_name.replace(/\s+/g, '-').toLowerCase()],
        acceptance_criteria: 'Complete kickoff meeting scheduling as described'
      },
      {
        title: `Configure ${extracted.protocol} Connection`,
        description: `Setup ${extracted.protocol} protocol for secure data exchange`,
        priority: 'high',
        assigned_to: 'Technical Team',
        status: 'pending',
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'technical_setup',
        story_points: 5,
        labels: ['technical_setup', extracted.company_name.replace(/\s+/g, '-').toLowerCase()],
        acceptance_criteria: 'Complete protocol configuration as described'
      }
    ];
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setUploadedFile(file);
      } else {
        setErrorMessage('Please upload a PDF or Word document');
        setUploadStatus('error');
      }
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setUploadedFile(file);
    }
  }, []);

  const startProcessing = async () => {
    if (!uploadedFile) return;
    setUploadStatus('uploading');
    await processDocument(uploadedFile);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
    setExtractedData(null);
    setIntakeId(null);
    setShowAttachmentForm(false);
    setAttachmentCategory('other');
    setAttachmentSubcategory('');
    setAttachmentDescription('');
    setPendingAttachments([]);
    setShowInitialAttachments(false);
  };

  const addPendingAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setPendingAttachments(prev => [...prev, {
      file,
      category: attachmentCategory,
      description: attachmentDescription,
      subcategory: attachmentCategory === 'po_specs' ? attachmentSubcategory : undefined
    }]);

    setShowInitialAttachments(false);
    setAttachmentCategory('other');
    setAttachmentSubcategory('');
    setAttachmentDescription('');
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !intakeId) return;

    setUploadingAttachment(true);
    const file = files[0];

    try {
      const fileDataUrl = await readFileAsDataUrl(file);

      const { error } = await supabase
        .from('intake_attachments')
        .insert({
          intake_id: intakeId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: fileDataUrl,
          upload_category: attachmentCategory,
          description: attachmentDescription || null,
          uploaded_by: 'user'
        });

      if (error) throw error;

      setShowAttachmentForm(false);
      setAttachmentDescription('');
      setAttachmentCategory('other');

      alert('Attachment uploaded successfully!');
    } catch (error) {
      console.error('Error uploading attachment:', error);
      alert('Failed to upload attachment. Please try again.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const categories = [
    { value: 'po_specs', label: 'Purchase Order Specifications' },
    { value: 'mapping_spec', label: 'Mapping Specifications' },
    { value: 'test_data', label: 'Test Data Files' },
    { value: 'business_rules', label: 'Business Rules' },
    { value: 'technical_spec', label: 'Technical Documentation' },
    { value: 'compliance', label: 'Compliance Documents' },
    { value: 'other', label: 'Other' }
  ];

  const poSubcategories = [
    { value: 'transaction_set', label: 'Transaction Set' },
    { value: 'administrative_document', label: 'Administrative document' },
    { value: 'routing_document', label: 'Routing document' },
    { value: 'pricing_information', label: 'Pricing Information' }
  ];

  return (
    <div className="space-y-6">
      {uploadStatus === 'idle' && !uploadedFile && (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Upload EDI Intake Form
          </h3>
          <p className="text-gray-600 mb-6">
            Drag and drop your intake document, or click to browse
          </p>
          <label className="inline-block">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileInput}
            />
            <span className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block transition-colors">
              Select File
            </span>
          </label>
          <p className="text-sm text-gray-500 mt-4">
            Supports PDF, Word and XML-based documents
          </p>
        </div>
      )}

      {uploadStatus === 'idle' && uploadedFile && (
        <div className="border-2 border-blue-500 rounded-xl p-8 bg-blue-50">
          <div className="flex items-start gap-4 mb-6">
            <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ready to Process
              </h3>
              <p className="text-gray-700">
                Main Document: <span className="font-medium">{uploadedFile.name}</span>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                You can add additional supporting documents before processing
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Additional Documents ({pendingAttachments.length})</h4>
              </div>
              {!showInitialAttachments && (
                <button
                  onClick={() => setShowInitialAttachments(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Document
                </button>
              )}
            </div>

            {pendingAttachments.length > 0 && (
              <div className="space-y-2 mb-4">
                {pendingAttachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{attachment.file.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {categories.find(c => c.value === attachment.category)?.label || 'Other'}
                        {attachment.subcategory && ` - ${poSubcategories.find(s => s.value === attachment.subcategory)?.label}`}
                        {attachment.description && ` • ${attachment.description}`}
                      </div>
                    </div>
                    <button
                      onClick={() => removePendingAttachment(index)}
                      className="ml-3 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showInitialAttachments && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-medium text-gray-900">Add Supporting Document</h5>
                  <button
                    onClick={() => {
                      setShowInitialAttachments(false);
                      setAttachmentDescription('');
                      setAttachmentCategory('other');
                      setAttachmentSubcategory('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Category
                    </label>
                    <select
                      value={attachmentCategory}
                      onChange={(e) => {
                        setAttachmentCategory(e.target.value);
                        if (e.target.value !== 'po_specs') {
                          setAttachmentSubcategory('');
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {attachmentCategory === 'po_specs' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specification Type
                      </label>
                      <select
                        value={attachmentSubcategory}
                        onChange={(e) => setAttachmentSubcategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">Select a type...</option>
                        {poSubcategories.map((subcat) => (
                          <option key={subcat.value} value={subcat.value}>
                            {subcat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={attachmentDescription}
                      onChange={(e) => setAttachmentDescription(e.target.value)}
                      placeholder="Brief note about this document..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select File
                    </label>
                    <input
                      type="file"
                      onChange={addPendingAttachment}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {!showInitialAttachments && pendingAttachments.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-2">
                No additional documents added yet
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetUpload}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={startProcessing}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Process Document{pendingAttachments.length > 0 ? ` + ${pendingAttachments.length} Attachment${pendingAttachments.length > 1 ? 's' : ''}` : ''}
            </button>
          </div>
        </div>
      )}

      {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
        <div className="border-2 border-blue-500 rounded-xl p-12 text-center bg-blue-50">
          <Loader2 className="w-16 h-16 mx-auto text-blue-600 mb-4 animate-spin" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {uploadStatus === 'uploading' ? 'Uploading...' : 'Analyzing Document...'}
          </h3>
          <p className="text-gray-600">
            {uploadStatus === 'uploading'
              ? 'Uploading your document'
              : 'Extracting information and generating insights'}
          </p>
        </div>
      )}

      {uploadStatus === 'success' && extractedData && (
        <div className="border-2 border-green-500 rounded-xl p-8 bg-green-50">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Document Processed Successfully
                </h3>
                <p className="text-gray-700">
                  File: <span className="font-medium">{uploadedFile?.name}</span>
                </p>
              </div>
            </div>
            <button
              onClick={resetUpload}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-2">Company Information</h4>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Company:</span> {extractedData.company_name}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-medium">Go-Live:</span> {extractedData.go_live_date}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-medium">Protocol:</span> {extractedData.protocol}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-2">Readiness Score</h4>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-yellow-600">
                  {extractedData.analysis.readiness_score}%
                </div>
                <div className="text-sm text-gray-600">
                  <div className="font-medium text-yellow-600">
                    {extractedData.analysis.complexity_level.toUpperCase()}
                  </div>
                  <div>Complexity</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Next Steps</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Document analyzed and readiness assessment complete</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600">→</span>
                <span>Go to <span className="font-semibold">Intake Analysis</span> to review insights and generate AI action items</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600">→</span>
                <span>Use AI to create a prioritized execution plan with JIRA-ready action items</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600">→</span>
                <span>Check <span className="font-semibold">Dashboard</span> for project overview and metrics</span>
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Additional Attachments</h4>
              </div>
              {!showAttachmentForm && (
                <button
                  onClick={() => setShowAttachmentForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Document
                </button>
              )}
            </div>

            {showAttachmentForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-medium text-gray-900">Upload Additional Document</h5>
                  <button
                    onClick={() => {
                      setShowAttachmentForm(false);
                      setAttachmentDescription('');
                      setAttachmentCategory('other');
                      setAttachmentSubcategory('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Category
                    </label>
                    <select
                      value={attachmentCategory}
                      onChange={(e) => {
                        setAttachmentCategory(e.target.value);
                        if (e.target.value !== 'po_specs') {
                          setAttachmentSubcategory('');
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {attachmentCategory === 'po_specs' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specification Type
                      </label>
                      <select
                        value={attachmentSubcategory}
                        onChange={(e) => setAttachmentSubcategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a type...</option>
                        {poSubcategories.map((subcat) => (
                          <option key={subcat.value} value={subcat.value}>
                            {subcat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={attachmentDescription}
                      onChange={(e) => setAttachmentDescription(e.target.value)}
                      placeholder="Add any notes about this document..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select File
                    </label>
                    <input
                      type="file"
                      onChange={handleAttachmentUpload}
                      disabled={uploadingAttachment}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {uploadingAttachment && (
                      <p className="mt-2 text-sm text-blue-600">Uploading...</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mb-4">
              Upload supporting documents like data format specs, mapping specifications, test data, or technical documentation
            </p>
          </div>

          <div className="mt-6">
            <button
              onClick={resetUpload}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Upload Another Document
            </button>
          </div>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="border-2 border-red-500 rounded-xl p-8 bg-red-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Upload Failed
                </h3>
                <p className="text-gray-700">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={resetUpload}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={resetUpload}
            className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
