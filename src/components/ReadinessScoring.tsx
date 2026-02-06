import { useEffect, useState } from 'react';
import { supabase, OnboardingRequest, ReadinessScore, Blocker } from '../lib/supabase';
import { Activity, TrendingUp, AlertTriangle, CheckCircle, Lightbulb, BarChart3 } from 'lucide-react';

export default function ReadinessScoring() {
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequest | null>(null);
  const [readinessScore, setReadinessScore] = useState<ReadinessScore | null>(null);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      loadReadinessScore(selectedRequest.id);
      loadBlockers(selectedRequest.id);
    }
  }, [selectedRequest]);

  const loadRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('onboarding_requests')
      .select('*, trading_partner:trading_partners(*)')
      .in('status', ['intake', 'review', 'approved'])
      .order('readiness_score', { ascending: true });

    if (data) {
      setRequests(data);
      if (data.length > 0 && !selectedRequest) {
        setSelectedRequest(data[0]);
      }
    }
    setLoading(false);
  };

  const loadReadinessScore = async (requestId: string) => {
    const { data } = await supabase
      .from('readiness_scores')
      .select('*')
      .eq('onboarding_request_id', requestId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setReadinessScore(data);
    }
  };

  const loadBlockers = async (requestId: string) => {
    const { data } = await supabase
      .from('blockers')
      .select('*')
      .eq('onboarding_request_id', requestId)
      .eq('resolved', false);

    if (data) {
      setBlockers(data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Readiness & Risk Scoring</h2>
        <p className="text-slate-600 mt-1">AI-driven readiness assessment with detailed explanations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              All Requests
            </h3>
            <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto">
              {requests.map((request) => (
                <button
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedRequest?.id === request.id
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-medium text-sm text-slate-900 truncate">
                    {request.request_number}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-full rounded-full ${getScoreColor(request.readiness_score)}`}
                        style={{ width: `${request.readiness_score}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      {request.readiness_score}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {selectedRequest && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedRequest.request_number}</h3>
                    <p className="text-slate-600">{selectedRequest.trading_partner?.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-slate-200"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - selectedRequest.readiness_score / 100)}`}
                          className={getScoreColorClass(selectedRequest.readiness_score)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-slate-900">
                          {selectedRequest.readiness_score}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mt-2">Readiness Score</p>
                  </div>

                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-slate-200"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - selectedRequest.confidence_percentage / 100)}`}
                          className="text-blue-500"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-slate-900">
                          {selectedRequest.confidence_percentage}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mt-2">AI Confidence</p>
                  </div>

                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-slate-200"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - selectedRequest.business_value_score / 100)}`}
                          className="text-cyan-500"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-slate-900">
                          {selectedRequest.business_value_score}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mt-2">Business Value</p>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${getScoreBannerColor(selectedRequest.readiness_score)}`}>
                  <div className="flex items-start gap-3">
                    {selectedRequest.readiness_score >= 80 ? (
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : selectedRequest.readiness_score >= 50 ? (
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold mb-1">{getScoreLabel(selectedRequest.readiness_score)}</p>
                      <p className="text-sm">{getScoreExplanation(selectedRequest.readiness_score)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {readinessScore && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-slate-600" />
                    <h4 className="font-semibold text-slate-900">Score Factors Breakdown</h4>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(readinessScore.score_factors).map(([factor, score]) => (
                      <div key={factor}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700 capitalize">
                            {factor.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{score}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getScoreColor(score as number)}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-2">
                      <strong>How Readiness is Calculated:</strong>
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      The AI analyzes partner history, data completeness, technical feasibility, timeline realism,
                      WMS compatibility, and protocol readiness. Each factor is weighted based on historical onboarding
                      patterns and validated against known constraints.
                    </p>
                  </div>
                </div>
              )}

              {blockers.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-slate-900">Active Blockers</h4>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      {blockers.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {blockers.map((blocker) => (
                      <div key={blocker.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(blocker.severity)}`}>
                              {blocker.severity}
                            </span>
                            <span className="text-xs text-slate-500 capitalize">
                              {blocker.blocker_type.replace(/_/g, ' ')}
                            </span>
                          </div>
                          {blocker.resolution_required && (
                            <span className="text-xs text-red-600 font-medium">Resolution Required</span>
                          )}
                        </div>
                        <h5 className="font-semibold text-slate-900 mb-1">{blocker.title}</h5>
                        <p className="text-sm text-slate-600">{blocker.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {readinessScore && readinessScore.recommendations && readinessScore.recommendations.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-cyan-600" />
                    <h4 className="font-semibold text-slate-900">AI Recommendations</h4>
                  </div>
                  <div className="space-y-2">
                    {readinessScore.recommendations.map((recommendation, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-cyan-50 border border-cyan-200 rounded-lg"
                      >
                        <TrendingUp className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 50) return 'text-orange-500';
  return 'text-red-500';
}

function getScoreBannerColor(score: number): string {
  if (score >= 80) return 'bg-green-50 border-green-200 text-green-900';
  if (score >= 50) return 'bg-orange-50 border-orange-200 text-orange-900';
  return 'bg-red-50 border-red-200 text-red-900';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Ready to Proceed';
  if (score >= 50) return 'Additional Information Needed';
  return 'More Details Required';
}

function getScoreExplanation(score: number): string {
  if (score >= 80) {
    return 'All prerequisites validated. Requirements clear and feasible. Approved to proceed to development with high confidence.';
  }
  if (score >= 50) {
    return 'Some additional information needed but addressable. Clarification required before development to ensure successful implementation.';
  }
  return 'Additional information needed for complete requirements. Collaborate with trading partner to gather remaining details for successful onboarding.';
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    intake: 'bg-blue-100 text-blue-700',
    review: 'bg-orange-100 text-orange-700',
    approved: 'bg-green-100 text-green-700',
    in_progress: 'bg-cyan-100 text-cyan-700',
    completed: 'bg-slate-100 text-slate-700',
    deferred: 'bg-slate-100 text-slate-500',
  };
  return colors[status] || 'bg-slate-100 text-slate-700';
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
  };
  return colors[severity] || 'bg-slate-100 text-slate-700';
}
