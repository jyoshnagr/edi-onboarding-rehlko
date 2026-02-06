import { Sparkles, Edit3 } from 'lucide-react';
import { FormTemplate, FormData, ValidationError } from '../../types';

interface LiveFormProps {
  template: FormTemplate;
  data: FormData;
  progress: number;
  missingRequired: number;
  currentFieldId: string;
  onChange: (fieldId: string, value: string | string[]) => void;
  onFieldClick: (fieldId: string) => void;
  validationErrors: ValidationError[];
}

export function LiveForm({
  template,
  data,
  progress,
  missingRequired,
  currentFieldId,
  onChange,
  onFieldClick,
  validationErrors,
}: LiveFormProps) {
  //  console.log("Data", data)
  const getFieldError = (fieldId: string) => {
    return validationErrors.find(e => e.fieldId === fieldId)?.message;
  };

  const renderField = (field: any) => {
    // console.log("Field", field)
    // console.log()
    const value = data[field.id] || '';
    const isFilled = value !== '';
    const isCurrent = currentFieldId === field.id;
    const error = getFieldError(field.id);

    const baseClasses = `
      w-full px-3 py-2 border rounded-lg transition-all
      ${isCurrent ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-300'}
      ${error ? 'border-red-500' : ''}
      focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
    `;

    return (
      <div
        key={field.id}
        className={`
          group relative p-4 rounded-lg border transition-all
          ${isCurrent ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}
          ${error ? 'border-red-300' : ''}
        `}
      >
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {field.type === 'textarea' ? (
          <textarea
            value={value as string}
            onChange={(e) => onChange(field.id, e.target.value)}
            onClick={() => onFieldClick(field.id)}
            placeholder={field.placeholder}
            rows={1}
            className={baseClasses}
          />
        ) : field.type === 'select' ? (
          <select
            value={value as string}
            onChange={(e) => onChange(field.id, e.target.value)}
            onClick={() => onFieldClick(field.id)}
            className={baseClasses}
          >
            <option value="">Select...</option>
            {field.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === 'multiselect' ? (
          <select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(o => o.value);
              onChange(field.id, selected);
            }}
            onClick={() => onFieldClick(field.id)}
            className={`${baseClasses} min-h-[100px]`}
          >
            {field.options?.map((option: any) => (
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
            onClick={() => onFieldClick(field.id)}
            placeholder={field.placeholder}
            className={baseClasses}
          />
        )}

        {field.helpText && (
          <p className="text-xs text-slate-500 mt-1">{field.helpText}</p>
        )}

        {error && (
          <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>
        )}

        {isFilled && !error && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            <Sparkles size={12} />
            <span>AI filled</span>
          </div>
        )}

        <button
          onClick={() => onFieldClick(field.id)}
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
          title="Ask AI for help"
        >
          <Edit3 size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-900">Form Progress</h3>
          <span className="text-sm font-medium text-slate-600">{progress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        {missingRequired > 0 && (
          <p className="text-xs text-amber-600 mt-2 font-medium">
            {missingRequired} required field{missingRequired !== 1 ? 's' : ''} remaining
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
        {template.sections.map((section) => (
          <div key={section.id} className="bg-white rounded-lg border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-900 mb-4 text-base">
              {section.title}
            </h4>
            <div className="space-y-4">
              {section.fields.map((field) => renderField(field))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
