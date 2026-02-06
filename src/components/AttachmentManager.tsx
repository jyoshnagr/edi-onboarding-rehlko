import { useState, useEffect } from 'react';
import { Upload, File, X, FileText, Download, Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  upload_category: string;
  description: string | null;
  uploaded_at: string;
  uploaded_by: string;
}

interface AttachmentManagerProps {
  intakeId: string;
}

export default function AttachmentManager({ intakeId }: AttachmentManagerProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [description, setDescription] = useState('');

  const categories = [
    { value: 'data_format', label: 'Data Format Specification' },
    { value: 'mapping_spec', label: 'Mapping Specifications' },
    { value: 'test_data', label: 'Test Data Files' },
    { value: 'business_rules', label: 'Business Rules' },
    { value: 'technical_spec', label: 'Technical Documentation' },
    { value: 'compliance', label: 'Compliance Documents' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadAttachments();
  }, [intakeId]);

  const loadAttachments = async () => {
    const { data, error } = await supabase
      .from('intake_attachments')
      .select('*')
      .eq('intake_id', intakeId)
      .order('uploaded_at', { ascending: false });

    if (!error && data) {
      setAttachments(data);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
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
          upload_category: selectedCategory,
          description: description || null,
          uploaded_by: 'user'
        });

      if (error) throw error;

      setShowUploadForm(false);
      setDescription('');
      setSelectedCategory('other');
      await loadAttachments();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
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

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    const { error } = await supabase
      .from('intake_attachments')
      .delete()
      .eq('id', attachmentId);

    if (!error) {
      await loadAttachments();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getCategoryLabel = (value: string) => {
    return categories.find(cat => cat.value === value)?.label || value;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <File className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Attachments</h3>
            <p className="text-sm text-slate-600">Additional documents for EDI onboarding</p>
          </div>
        </div>
        {!showUploadForm && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Attachment
          </button>
        )}
      </div>

      {showUploadForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-slate-900">Upload New Attachment</h4>
            <button
              onClick={() => {
                setShowUploadForm(false);
                setDescription('');
                setSelectedCategory('other');
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Document Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any notes about this document..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select File
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
              {uploading && (
                <p className="mt-2 text-sm text-blue-600">Uploading...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No attachments yet</p>
          <p className="text-xs mt-1">Upload additional documents like data formats, mapping specs, or test files</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-slate-900 truncate">
                      {attachment.file_name}
                    </p>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full whitespace-nowrap">
                      {getCategoryLabel(attachment.upload_category)}
                    </span>
                  </div>
                  {attachment.description && (
                    <p className="text-sm text-slate-600 mb-1">{attachment.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{formatFileSize(attachment.file_size)}</span>
                    <span>•</span>
                    <span>{new Date(attachment.uploaded_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Uploaded by {attachment.uploaded_by}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <a
                  href={attachment.file_url}
                  download={attachment.file_name}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(attachment.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
