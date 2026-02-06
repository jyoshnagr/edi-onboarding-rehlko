import { useState } from 'react';
import { ArrowLeft, Send, Download, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { FormTemplate, FormData, ValidationError } from '../../types';
import { validateAllFields, generateSummary } from './lib/formUtils';

interface ReviewSubmitProps {
  template: FormTemplate;
  data: FormData;
  onBack: () => void;
  onSubmit: (summary: string) => void;
  onChange: (fieldId: string, value: string | string[]) => void;
}

export function ReviewSubmit({ template, data, onBack, onSubmit, onChange }: ReviewSubmitProps) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValidateAndSubmit = () => {
    const validationErrors = validateAllFields(template, data);
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      setIsSubmitting(true);
      const summary = generateSummary(template, data);
      onSubmit(summary);
    }
  };

  const handleDownloadJSON = () => {
    console.log('Downloading JSON with data:', data);
    const downloadData = {
      template: template.name,
      submittedAt: new Date().toISOString(),
      data
    };
    const json = JSON.stringify(downloadData, null, 2);
    console.log('JSON to download:', json);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSummary = () => {
    console.log('Generating summary with data:', data);
    const summary = generateSummary(template, data);
    console.log('Generated summary:', summary);
    console.log('Summary length:', summary.length);
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-summary-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFieldError = (fieldId: string) => {
    return errors.find(e => e.fieldId === fieldId)?.message;
  };

  const summary = generateSummary(template, data);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Review & Submit</h1>
              <p className="text-sm text-slate-600">Review your details before submitting</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
            >
              <FileJson size={16} />
              Export JSON
            </button>
            <button
              onClick={handleDownloadSummary}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
            >
              <Download size={16} />
              Download Summary
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Please fix the following errors:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                  {errors.map((error, idx) => (
                    <li key={idx}>{error.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {errors.length === 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-green-600" />
              <p className="text-green-900 font-medium">All required fields are complete!</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Form Details</h2>

            {template.sections.map((section) => (
              <div key={section.id} className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">{section.title}</h3>
                <div className="space-y-4">
                  {section.fields.map((field) => {
                    const value = data[field.id] || '';
                    const error = getFieldError(field.id);

                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>

                        {field.type === 'textarea' ? (
                          <textarea
                            value={value as string}
                            onChange={(e) => onChange(field.id, e.target.value)}
                            rows={3}
                            className={`
                              w-full px-3 py-2 border rounded-lg transition-all
                              ${error ? 'border-red-500' : 'border-slate-300'}
                              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                            `}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={value as string}
                            onChange={(e) => onChange(field.id, e.target.value)}
                            className={`
                              w-full px-3 py-2 border rounded-lg transition-all
                              ${error ? 'border-red-500' : 'border-slate-300'}
                              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                            `}
                          >
                            <option value="">Select...</option>
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            value={value as string}
                            onChange={(e) => onChange(field.id, e.target.value)}
                            className={`
                              w-full px-3 py-2 border rounded-lg transition-all
                              ${error ? 'border-red-500' : 'border-slate-300'}
                              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                            `}
                          />
                        )}

                        {error && (
                          <p className="text-xs text-red-600 font-medium">{error}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Onboarding Summary</h2>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono leading-relaxed">
                {summary}
              </pre>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleValidateAndSubmit}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium transition-all shadow-sm hover:shadow-md"
              >
                <Send size={20} />
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </button>

              <button
                onClick={onBack}
                className="w-full px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-all"
              >
                Back to Form
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
