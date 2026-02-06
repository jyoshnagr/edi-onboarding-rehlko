import React, { useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, Calendar, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ActionItemReview from './ActionItemReview';

interface IntakeData {
  id: string;
  company_name: string;
  customer_contacts: any[];
  go_live_date: string;
  edi_experience: string;
  data_format: string;
  transactions: string[];
  locations: string[];
  protocol: string;
  unique_requirements: string;
}

interface Analysis {
  readiness_score: number;
  complexity_level: string;
  identified_risks: any[];
  missing_information: string[];
  recommendations: any[];
  estimated_timeline: string;
}

interface ActionItemsGeneratorProps {
  intake: IntakeData;
  analysis: Analysis;
  riskDiagnostics?: any;
  onComplete: () => void;
}

export default function ActionItemsGenerator({ intake, analysis, riskDiagnostics, onComplete }: ActionItemsGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

  const generateActionItems = async () => {
    setGenerating(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-action-items`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intake, analysis, riskDiagnostics }),
      });

      const data = await response.json();

      if (data.success) {
        const itemsWithDefaults = data.actionItems.map((item: any) => ({
          ...item,
          story_points: item.priority === 'critical' ? 8 : item.priority === 'high' ? 5 : 3,
          labels: [item.category, intake.company_name.replace(/\s+/g, '-').toLowerCase()],
          acceptance_criteria: `Complete ${item.title.toLowerCase()} as described`
        }));
        setGeneratedItems(itemsWithDefaults);
        setShowReview(true);
      } else {
        setError(data.error || 'Failed to generate action items');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error generating action items:', err);
    } finally {
      setGenerating(false);
    }
  };

  const saveActionItems = async (items: any[]) => {
    setSaving(true);
    setError(null);

    try {
      const itemsToSave = items.map(item => ({
        intake_id: intake.id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        assigned_to: item.assigned_to,
        status: 'pending',
        due_date: item.due_date,
        category: item.category,
        story_points: item.story_points || 3,
        labels: item.labels || [],
        acceptance_criteria: Array.isArray(item.acceptance_criteria) ? item.acceptance_criteria.join('\n') : (item.acceptance_criteria || ''),
        effort_size: item.effort_size || 'M',
        dependencies: item.dependencies || [],
        why_exists: item.why_exists || '',
        source: 'ai_generated'
      }));

      const { error: insertError } = await supabase
        .from('action_items')
        .insert(itemsToSave);

      if (insertError) throw insertError;

      onComplete();
    } catch (err) {
      setError('Failed to save action items. Please try again.');
      console.error('Error saving action items:', err);
    } finally {
      setSaving(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'discovery':
      case 'information_gathering':
        return '🔍';
      case 'training':
        return '📚';
      case 'risk_management':
        return '⚠️';
      case 'technical_setup':
        return '⚙️';
      case 'mapping':
        return '🗺️';
      case 'testing':
        return '🧪';
      case 'custom_development':
        return '💻';
      case 'documentation':
        return '📝';
      case 'governance':
        return '✅';
      case 'support':
        return '🆘';
      default:
        return '📋';
    }
  };

  if (showReview && generatedItems.length > 0) {
    return (
      <ActionItemReview
        items={generatedItems}
        onSave={saveActionItems}
        onCancel={() => {
          setShowReview(false);
          setGeneratedItems([]);
        }}
      />
    );
  }

  if (generatedItems.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Ready to Generate Action Items
          </h3>
          <p className="text-gray-700 mb-6">
            AI will analyze the intake data and readiness assessment to create a comprehensive,
            prioritized list of action items with intelligent assignments and realistic deadlines.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600 mb-1">{analysis.readiness_score}%</div>
              <div className="text-gray-600">Readiness Score</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-orange-600 mb-1">{analysis.identified_risks.length}</div>
              <div className="text-gray-600">Identified Risks</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600 mb-1">{analysis.recommendations.length}</div>
              <div className="text-gray-600">Recommendations</div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={generateActionItems}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Action Items...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Action Items with AI
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {generatedItems.length} Action Items Generated
            </h3>
            <p className="text-gray-700 mb-4">
              AI has created a comprehensive action plan for {intake.company_name} based on the intake
              analysis and identified risks. Review the items below and save to begin tracking.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Critical: <strong className="text-red-600">{generatedItems.filter(i => i.priority === 'critical').length}</strong>
              </span>
              <span className="text-sm text-gray-600">•</span>
              <span className="text-sm text-gray-600">
                High: <strong className="text-orange-600">{generatedItems.filter(i => i.priority === 'high').length}</strong>
              </span>
              <span className="text-sm text-gray-600">•</span>
              <span className="text-sm text-gray-600">
                Medium: <strong className="text-blue-600">{generatedItems.filter(i => i.priority === 'medium').length}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {generatedItems.map((item, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0">
                {getCategoryIcon(item.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900 text-lg">
                    {item.title}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                    {item.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="font-medium text-gray-700">{item.assigned_to}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Due: <span className="font-medium text-gray-700">{new Date(item.due_date).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => {
            setGeneratedItems([]);
            setShowReview(false);
          }}
          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Regenerate
        </button>
        <button
          onClick={() => setShowReview(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105"
        >
          Review & Customize
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
