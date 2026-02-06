import React, { useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw, Shield, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RiskDiagnosticsProps {
  intakeId: string;
  onDiagnosticsComplete?: (diagnostics: any) => void;
}

interface DiagnosticItem {
  category: string;
  type: string;
  severity: string;
  confidence: number;
  confidence_label: string;
  why_it_matters: string;
  evidence: Array<{
    source: string;
    snippet: string;
    field?: string;
  }>;
  recommended_actions: Array<{
    action: string;
    owner_role: string;
    priority: string;
  }>;
  questions_to_confirm: string[];
}

export default function RiskDiagnostics({ intakeId, onDiagnosticsComplete }: RiskDiagnosticsProps) {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const runDiagnostics = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-risk-diagnostics`;
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
        setDiagnostics(data.diagnostics);
        if (onDiagnosticsComplete) {
          onDiagnosticsComplete(data.diagnostics);
        }
      } else {
        setError(data.error || 'Failed to run diagnostics');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error running diagnostics:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExistingDiagnostics = async () => {
    try {
      const { data, error } = await supabase
        .from('risk_diagnostics')
        .select('*')
        .eq('intake_id', intakeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setDiagnostics({
          diagnostics_version: data.diagnostics_version,
          overall_risk_level: data.overall_risk_level,
          items: data.items
        });
      }
    } catch (err) {
      console.error('Error loading diagnostics:', err);
    }
  };

  React.useEffect(() => {
    loadExistingDiagnostics();
  }, [intakeId]);

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!diagnostics) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Risk & Mapping Diagnostics
          </h3>
          <p className="text-gray-700 mb-6">
            AI will analyze your intake data to detect onboarding challenges and mapping issues
            that could impact go-live success. This includes protocol hurdles, master data problems,
            and EDI mapping risks.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={runDiagnostics}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Run Risk Diagnostics
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`rounded-xl p-6 border-2 ${getRiskLevelColor(diagnostics.overall_risk_level)}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-xl font-bold">Overall Risk Level: {diagnostics.overall_risk_level}</h3>
            </div>
            <p className="text-sm opacity-90">
              Analyzed {diagnostics.items?.length || 0} potential issues across onboarding and mapping categories
            </p>
          </div>
          <button
            onClick={runDiagnostics}
            disabled={isGenerating}
            className="px-4 py-2 border-2 border-current rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Re-run
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {diagnostics.items?.map((item: DiagnosticItem, index: number) => (
          <div
            key={index}
            className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 flex items-start justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(item.severity)}`}>
                    {item.severity}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {item.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    Confidence: {Math.round(item.confidence * 100)}% ({item.confidence_label})
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">{item.type}</h4>
                <p className="text-sm text-gray-600">{item.why_it_matters}</p>
              </div>
              {expandedItems.has(index) ? (
                <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
              )}
            </button>

            {expandedItems.has(index) && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 space-y-4">
                {item.evidence && item.evidence.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Evidence
                    </h5>
                    <div className="space-y-2">
                      {item.evidence.map((ev, evIndex) => (
                        <div key={evIndex} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">
                            Source: {ev.source}
                            {ev.field && ` - Field: ${ev.field}`}
                          </div>
                          <p className="text-sm text-gray-700">{ev.snippet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {item.recommended_actions && item.recommended_actions.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Recommended Actions</h5>
                    <div className="space-y-2">
                      {item.recommended_actions.map((action, actIndex) => (
                        <div key={actIndex} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm text-gray-900 flex-1">{action.action}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {action.owner_role}
                              </span>
                              <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded font-medium">
                                {action.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {item.questions_to_confirm && item.questions_to_confirm.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Questions to Confirm</h5>
                    <ul className="space-y-1">
                      {item.questions_to_confirm.map((question, qIndex) => (
                        <li key={qIndex} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-orange-600 mt-1">•</span>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
