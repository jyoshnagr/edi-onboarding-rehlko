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

  const normalizeOptions = (options: any[]) => {
    if (!options || options.length === 0) return [];

    return options.map(option => {
      if (typeof option === 'string') {
        return { label: option, value: option };
      }
      return { label: option.label, value: option.value };
    });
  };

  const renderField = (field: any) => {
    const value = data[field.id] || '';
    const isFilled = value !== '' && (Array.isArray(value) ? value.length > 0 : true);
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
            rows={3}
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
            {normalizeOptions(field.options).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === 'multiselect' ? (
          <div className="space-y-2">
            <div className="text-xs text-slate-600 mb-2">
              Select multiple options (hold Ctrl/Cmd to select multiple)
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-2">
              {normalizeOptions(field.options).map((option) => {
                const isSelected = Array.isArray(value) && value.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={`
                      flex items-center gap-2 p-2 rounded cursor-pointer transition-all
                      ${isSelected ? 'bg-blue-50 border border-blue-300' : 'hover:bg-slate-50 border border-transparent'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        const newValues = e.target.checked
                          ? [...currentValues, option.value]
                          : currentValues.filter(v => v !== option.value);
                        onChange(field.id, newValues);
                      }}
                      onClick={() => onFieldClick(field.id)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{option.label}</span>
                  </label>
                );
              })}
            </div>
            {Array.isArray(value) && value.length > 0 && (
              <div className="text-xs text-slate-600 mt-1">
                Selected: {value.length} option{value.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        ) : field.type === 'email' ? (
          <input
            type="email"
            value={value as string}
            onChange={(e) => onChange(field.id, e.target.value)}
            onClick={() => onFieldClick(field.id)}
            placeholder={field.placeholder || 'example@company.com'}
            className={baseClasses}
          />
        ) : field.type === 'phone' ? (
          <input
            type="tel"
            value={value as string}
            onChange={(e) => onChange(field.id, e.target.value)}
            onClick={() => onFieldClick(field.id)}
            placeholder={field.placeholder || '(123) 456-7890'}
            className={baseClasses}
          />
        ) : (
          <input
            type={field.type || 'text'}
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
            <span>Filled</span>
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
