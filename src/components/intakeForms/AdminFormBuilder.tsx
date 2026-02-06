import { useState } from 'react';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { FormTemplate, FormSection, FormField, FieldType } from '../../types';
import { supabase } from './lib/supabase';

interface AdminFormBuilderProps {
  onBack: () => void;
}

export function AdminFormBuilder({ onBack }: AdminFormBuilderProps) {
  const [name, setName] = useState('New Form');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('FileText');
  const [sections, setSections] = useState<FormSection[]>([
    {
      id: 'section1',
      title: 'Section 1',
      fields: [],
    },
  ]);
  const [saving, setSaving] = useState(false);

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: `section${sections.length + 1}`,
        title: `Section ${sections.length + 1}`,
        fields: [],
      },
    ]);
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const updateSection = (sectionId: string, title: string) => {
    setSections(
      sections.map((s) => (s.id === sectionId ? { ...s, title } : s))
    );
  };

  const addField = (sectionId: string) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: [
                ...s.fields,
                {
                  id: `field${Date.now()}`,
                  label: 'New Field',
                  type: 'text' as FieldType,
                  required: false,
                  avatarPrompt: 'Please provide this information.',
                },
              ],
            }
          : s
      )
    );
  };

  const removeField = (sectionId: string, fieldId: string) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
          : s
      )
    );
  };

  const updateField = (
    sectionId: string,
    fieldId: string,
    updates: Partial<FormField>
  ) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.id === fieldId ? { ...f, ...updates } : f
              ),
            }
          : s
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('form_templates').insert({
        name,
        description,
        icon,
        sections,
        is_active: true,
      });

      if (error) throw error;

      alert('Form template saved successfully!');
      onBack();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save form template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Form Builder</h1>
              <p className="text-sm text-slate-600">Create a new form template</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium transition-all"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Form Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Form Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Icon Name
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="FileText, Package, Key, UserCircle"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {sections.map((section, sectionIdx) => (
          <div
            key={section.id}
            className="bg-white rounded-lg border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSection(section.id, e.target.value)}
                className="text-lg font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none px-2 py-1 -ml-2"
              />

              <button
                onClick={() => removeSection(section.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="space-y-4 mb-4">
              {section.fields.map((field) => (
                <div
                  key={field.id}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          updateField(section.id, field.id, { label: e.target.value })
                        }
                        placeholder="Field Label"
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />

                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(section.id, field.id, {
                            type: e.target.value as FieldType,
                          })
                        }
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="date">Date</option>
                        <option value="number">Number</option>
                        <option value="select">Select</option>
                        <option value="textarea">Textarea</option>
                      </select>
                    </div>

                    <button
                      onClick={() => removeField(section.id, field.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <textarea
                    value={field.avatarPrompt}
                    onChange={(e) =>
                      updateField(section.id, field.id, {
                        avatarPrompt: e.target.value,
                      })
                    }
                    placeholder="Avatar prompt (how should the AI ask for this field?)"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />

                  <div className="flex items-center gap-2 mt-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          updateField(section.id, field.id, {
                            required: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      Required
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => addField(section.id)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              <Plus size={16} />
              Add Field
            </button>
          </div>
        ))}

        <button
          onClick={addSection}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-dashed border-slate-300 text-slate-700 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all font-medium w-full justify-center"
        >
          <Plus size={20} />
          Add Section
        </button>
      </div>
    </div>
  );
}
