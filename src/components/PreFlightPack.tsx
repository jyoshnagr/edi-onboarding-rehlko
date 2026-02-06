import React, { useState } from 'react';
import { Package, Loader2, CheckCircle2, Circle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PreFlightPackProps {
  intakeId: string;
}

interface ChecklistItem {
  item: string;
  status: string;
  owner: string;
  priority: string;
  details: string;
}

interface PackSection {
  title: string;
  items: ChecklistItem[];
}

export default function PreFlightPack({ intakeId }: PreFlightPackProps) {
  const [pack, setPack] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePack = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-preflight-pack`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intakeId }),
      });

      const data = await response.json();

      if (data.success) {
        setPack(data.pack);
      } else {
        setError(data.error || 'Failed to generate pre-flight pack');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error generating pack:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExistingPack = async () => {
    try {
      const { data, error } = await supabase
        .from('preflight_packs')
        .select('*')
        .eq('intake_id', intakeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setPack(data.pack_content);
      }
    } catch (err) {
      console.error('Error loading pack:', err);
    }
  };

  React.useEffect(() => {
    loadExistingPack();
  }, [intakeId]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'blocked':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'P2':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'P3':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!pack) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Pre-Flight Pack Generator
          </h3>
          <p className="text-gray-700 mb-6">
            Generate a comprehensive, production-ready checklist for your onboarding team.
            Includes connectivity setup, security requirements, testing plans, master data alignment,
            and go-live gating criteria.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={generatePack}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Pack...
              </>
            ) : (
              <>
                <Package className="w-5 h-5" />
                Generate Pre-Flight Pack
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const sections: PackSection[] = [
    pack.sections?.connectivity,
    pack.sections?.security,
    pack.sections?.test_plan,
    pack.sections?.implementation_variance,
    pack.sections?.master_data,
    pack.sections?.go_live_gates,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Pre-Flight Pack</h3>
            <p className="text-gray-700">
              Generated for <strong>{pack.generated_for}</strong>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Target Go-Live: {new Date(pack.go_live_date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={generatePack}
            disabled={isGenerating}
            className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Loader2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : 'hidden'}`} />
            {isGenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>

        {pack.critical_path_items && pack.critical_path_items.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Critical Path Items
            </h4>
            <ul className="space-y-1">
              {pack.critical_path_items.map((item: string, index: number) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h4 className="font-bold text-gray-900 text-lg">{section.title}</h4>
            </div>
            <div className="p-6 space-y-4">
              {section.items?.map((item: ChecklistItem, itemIndex: number) => (
                <div
                  key={itemIndex}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h5 className="font-semibold text-gray-900">{item.item}</h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{item.details}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <strong>Owner:</strong> {item.owner}
                        </span>
                        <span className="flex items-center gap-1">
                          <strong>Status:</strong> {item.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {pack.estimated_completion_date && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-700">
            <strong>Estimated Completion:</strong>{' '}
            {new Date(pack.estimated_completion_date).toLocaleDateString()}
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
