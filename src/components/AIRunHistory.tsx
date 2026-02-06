import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock, Eye, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AIRun {
  id: string;
  run_type: string;
  model: string;
  status: string;
  output_json: any;
  error_message: string | null;
  token_usage: number;
  created_at: string;
}

interface AIRunHistoryProps {
  intakeId: string;
}

export default function AIRunHistory({ intakeId }: AIRunHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [runs, setRuns] = useState<AIRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState<AIRun | null>(null);

  useEffect(() => {
    if (isExpanded) {
      fetchRuns();
    }
  }, [isExpanded, intakeId]);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_runs')
        .select('*')
        .eq('intake_id', intakeId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRuns(data);
      }
    } catch (err) {
      console.error('Error fetching AI runs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRunTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      analysis: 'Intake Analysis',
      action_items: 'Action Items',
      diagnostics: 'Risk Diagnostics',
      preflight: 'Pre-Flight Pack',
      interview: 'Interview Session'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-gray-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">AI Run History</h3>
            <p className="text-sm text-gray-500">View all AI operations and outputs</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No AI operations recorded yet
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(run.status)}`}>
                          {getStatusIcon(run.status)}
                          {run.status}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {getRunTypeLabel(run.run_type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Model: {run.model}</span>
                        {run.token_usage > 0 && (
                          <span>Tokens: {run.token_usage.toLocaleString()}</span>
                        )}
                        <span>
                          {new Date(run.created_at).toLocaleString()}
                        </span>
                      </div>
                      {run.error_message && (
                        <div className="mt-2 text-sm text-red-600">
                          Error: {run.error_message}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedRun(run)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Output
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedRun && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {getRunTypeLabel(selectedRun.run_type)} Output
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedRun.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <pre className="text-xs bg-gray-50 rounded-lg p-4 overflow-auto">
                {JSON.stringify(selectedRun.output_json, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
