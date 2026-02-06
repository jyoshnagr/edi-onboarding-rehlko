import { useEffect, useState } from 'react';
import { supabase, OnboardingRequest, Blocker } from '../lib/supabase';
import { Search, AlertCircle, CheckCircle, Clock, XCircle, Sparkles } from 'lucide-react';

export default function IntakeIntelligence() {
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequest | null>(null);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      loadBlockers(selectedRequest.id);
    }
  }, [selectedRequest]);

  const loadRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('onboarding_requests')
      .select('*, trading_partner:trading_partners(*)')
      .in('status', ['intake', 'review'])
      .order('submitted_at', { ascending: false });

    if (data) {
      setRequests(data);
      if (data.length > 0 && !selectedRequest) {
        setSelectedRequest(data[0]);
      }
    }
    setLoading(false);
  };

  const loadBlockers = async (requestId: string) => {
    const { data } = await supabase
      .from('blockers')
      .select('*')
      .eq('onboarding_request_id', requestId)
      .eq('resolved', false)
      .order('severity', { ascending: true });

    if (data) {
      setBlockers(data);
    }
  };

  const filteredRequests = requests.filter((r) =>
    r.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.trading_partner?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h2 className="text-2xl font-bold text-slate-900">Intake Intelligence Layer</h2>
        <p className="text-slate-600 mt-1">AI-assisted pre-Jira readiness analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredRequests.map((request) => (
              <button
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                  selectedRequest?.id === request.id ? 'bg-cyan-50 border-l-4 border-l-cyan-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{request.request_number}</p>
                    <p className="text-sm text-slate-600 truncate">{request.trading_partner?.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(request.priority)}`}>
                    {request.priority}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`h-full rounded-full ${getReadinessColor(request.intake_completeness)}`}
                      style={{ width: `${request.intake_completeness}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600 font-medium">{request.intake_completeness}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedRequest && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedRequest.request_number}</h3>
                    <p className="text-slate-600">{selectedRequest.trading_partner?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedRequest.trading_partner?.is_existing && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                        Existing Partner
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusBadgeColor(selectedRequest.status)}`}>
                      {selectedRequest.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Intake Completeness</p>
                    <p className="text-2xl font-bold text-slate-900">{selectedRequest.intake_completeness}%</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Readiness Score</p>
                    <p className="text-2xl font-bold text-slate-900">{selectedRequest.readiness_score}%</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">AI Confidence</p>
                    <p className="text-2xl font-bold text-slate-900">{selectedRequest.confidence_percentage}%</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Request Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-600">Warehouse:</span>
                        <span className="ml-2 font-medium text-slate-900">{selectedRequest.warehouse_location || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">WMS Type:</span>
                        <span className="ml-2 font-medium text-slate-900">{selectedRequest.wms_type || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Protocol:</span>
                        <span className="ml-2 font-medium text-slate-900">{selectedRequest.protocol || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Go-Live Date:</span>
                        <span className="ml-2 font-medium text-slate-900">
                          {selectedRequest.requested_go_live_date ? new Date(selectedRequest.requested_go_live_date).toLocaleDateString() : 'Not specified'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-slate-600">Transaction Types:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedRequest.transaction_types.length > 0 ? (
                          selectedRequest.transaction_types.map((type) => (
                            <span key={type} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {type}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-sm">Not specified</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">AI Analysis Summary</h4>
                        <p className="text-sm text-slate-700 leading-relaxed">{selectedRequest.ai_summary}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedRequest.missing_items && selectedRequest.missing_items.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-slate-900">Missing Information</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedRequest.missing_items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <XCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.conflicts && selectedRequest.conflicts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-slate-900">Identified Conflicts</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedRequest.conflicts.map((conflict, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{conflict}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {blockers.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-slate-600" />
                    <h4 className="font-semibold text-slate-900">Active Blockers</h4>
                  </div>
                  <div className="space-y-3">
                    {blockers.map((blocker) => (
                      <div key={blocker.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(blocker.severity)}`}>
                                {blocker.severity}
                              </span>
                              <span className="text-xs text-slate-500 capitalize">{blocker.blocker_type.replace('_', ' ')}</span>
                            </div>
                            <h5 className="font-semibold text-slate-900 mb-1">{blocker.title}</h5>
                            <p className="text-sm text-slate-600">{blocker.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h4 className="font-semibold text-slate-900 mb-4">Recommended Actions</h4>
                <div className="space-y-2">
                  {selectedRequest.readiness_score >= 80 ? (
                    <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Ready to Proceed</p>
                        <p className="text-sm text-green-700 mt-1">
                          All prerequisites validated. Recommend approval for development.
                        </p>
                      </div>
                    </div>
                  ) : selectedRequest.readiness_score >= 50 ? (
                    <>
                      <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-orange-900">Request Additional Information</p>
                          <p className="text-sm text-orange-700 mt-1">
                            Address missing items and conflicts before proceeding to development.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Schedule Discovery Call</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Technical discovery call recommended to clarify requirements and constraints.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">Do Not Proceed</p>
                          <p className="text-sm text-red-700 mt-1">
                            Significant gaps in requirements. Return to partner for complete intake.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Provide Intake Checklist</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Send comprehensive requirements guide and intake checklist to trading partner.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-orange-100 text-orange-700',
    low: 'bg-slate-100 text-slate-600',
  };
  return colors[priority] || 'bg-slate-100 text-slate-600';
}

function getReadinessColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

function getStatusBadgeColor(status: string): string {
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
