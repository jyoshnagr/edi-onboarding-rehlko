import React, { useState } from 'react';
import {
  Save,
  X,
  Edit2,
  AlertCircle,
  Calendar,
  Users,
  CheckCircle2,
  Plus,
  Minus
} from 'lucide-react';

interface ActionItem {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  assigned_to: string;
  due_date: string;
  category: string;
  story_points?: number;
  labels?: string[];
  acceptance_criteria?: string;
}

interface ActionItemReviewProps {
  items: ActionItem[];
  onSave: (items: ActionItem[]) => void;
  onCancel: () => void;
}

export default function ActionItemReview({ items, onSave, onCancel }: ActionItemReviewProps) {
  const [editedItems, setEditedItems] = useState<ActionItem[]>(items);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const updateItem = (index: number, field: keyof ActionItem, value: any) => {
    const updated = [...editedItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditedItems(updated);
  };

  const addLabel = (index: number, label: string) => {
    const updated = [...editedItems];
    const currentLabels = updated[index].labels || [];
    if (label && !currentLabels.includes(label)) {
      updated[index].labels = [...currentLabels, label];
      setEditedItems(updated);
    }
  };

  const removeLabel = (index: number, labelToRemove: string) => {
    const updated = [...editedItems];
    updated[index].labels = (updated[index].labels || []).filter(l => l !== labelToRemove);
    setEditedItems(updated);
  };

  const deleteItem = (index: number) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
  };

  const addNewItem = () => {
    const newItem: ActionItem = {
      title: 'New Action Item',
      description: 'Add description here',
      priority: 'medium',
      assigned_to: 'Team Member',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'general',
      story_points: 3,
      labels: [],
      acceptance_criteria: ''
    };
    setEditedItems([...editedItems, newItem]);
    setEditingIndex(editedItems.length);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      discovery: '🔍',
      information_gathering: '🔍',
      training: '📚',
      risk_management: '⚠️',
      technical_setup: '⚙️',
      mapping: '🗺️',
      testing: '🧪',
      custom_development: '💻',
      documentation: '📝',
      governance: '✅',
      support: '🆘',
      general: '📋'
    };
    return icons[category] || '📋';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Review & Customize Action Items
            </h3>
            <p className="text-gray-700 mb-4">
              Review, edit, and customize action items before saving. Add story points, labels,
              and acceptance criteria for JIRA export.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1 bg-white rounded-lg font-medium">
                {editedItems.length} items
              </span>
              <span className="text-gray-600">
                Critical: <strong className="text-red-600">
                  {editedItems.filter(i => i.priority === 'critical').length}
                </strong>
              </span>
              <span className="text-gray-600">
                High: <strong className="text-orange-600">
                  {editedItems.filter(i => i.priority === 'high').length}
                </strong>
              </span>
              <span className="text-gray-600">
                Medium: <strong className="text-blue-600">
                  {editedItems.filter(i => i.priority === 'medium').length}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {editedItems.map((item, index) => (
          <div
            key={index}
            className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-all"
          >
            {editingIndex === index ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    Done Editing
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={item.priority}
                      onChange={(e) => updateItem(index, 'priority', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Story Points</label>
                    <select
                      value={item.story_points || 3}
                      onChange={(e) => updateItem(index, 'story_points', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">1 - Trivial</option>
                      <option value="2">2 - Minor</option>
                      <option value="3">3 - Moderate</option>
                      <option value="5">5 - Significant</option>
                      <option value="8">8 - Major</option>
                      <option value="13">13 - Epic</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                    <input
                      type="text"
                      value={item.assigned_to}
                      onChange={(e) => updateItem(index, 'assigned_to', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={item.due_date}
                      onChange={(e) => updateItem(index, 'due_date', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(item.labels || []).map((label, labelIndex) => (
                      <span
                        key={labelIndex}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {label}
                        <button
                          onClick={() => removeLabel(index, label)}
                          className="hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add label..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addLabel(index, e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Acceptance Criteria
                  </label>
                  <textarea
                    value={item.acceptance_criteria || ''}
                    onChange={(e) => updateItem(index, 'acceptance_criteria', e.target.value)}
                    rows={3}
                    placeholder="Define what 'done' looks like..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => deleteItem(index)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Delete Item
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg mb-1">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                          {item.priority.toUpperCase()}
                        </span>
                        {item.story_points && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {item.story_points} SP
                          </span>
                        )}
                        <button
                          onClick={() => setEditingIndex(index)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {item.assigned_to}
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(item.due_date).toLocaleDateString()}
                      </span>
                    </div>

                    {item.labels && item.labels.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.labels.map((label, labelIndex) => (
                          <span
                            key={labelIndex}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.acceptance_criteria && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs font-medium text-green-800 mb-1">Acceptance Criteria:</p>
                        <p className="text-sm text-green-700">{item.acceptance_criteria}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          onClick={addNewItem}
          className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-700 font-medium rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Action Item
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedItems)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            <Save className="w-5 h-5" />
            Save Action Items
          </button>
        </div>
      </div>
    </div>
  );
}
