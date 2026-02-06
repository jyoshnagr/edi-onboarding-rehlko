import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileCheck, CheckCircle, Clock, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react';

interface IntakeForReview {
  id: string;
  company_name: string;
  go_live_date: string;
  edi_experience: string;
  data_format: string;
  protocol: string;
  transactions: string[];
  locations: any[];
  unique_requirements: string;
  created_at: string;
  analysis?: {
    readiness_score: number;
    complexity_level: string;
    identified_risks: Array<{
      type: string;
      title: string;
      description: string;
      impact: string;
    }>;
    missing_information: string[];
    recommendations: Array<{
      title: string;
      priority: string;
      description: string;
    }>;
    estimated_timeline: string;
  };
}

export default function ReviewApproval() {
  const [intakes, setIntakes] = useState<IntakeForReview[]>([]);
  const [selectedIntake, setSelectedIntake] = useState<IntakeForReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<string>('');
  const [status, setStatus] = useState<string>('review');

  useEffect(() => {
    loadIntakes();
  }, []);

  const loadIntakes = async () => {
    setLoading(true);
    const { data: intakesData } = await supabase
      .from('intake_extractions')
      .select('*, ai_analysis(*)')
      .order('created_at', { ascending: false });

    if (intakesData) {
      const formatted = intakesData.map((intake: any) => ({
        id: intake.id,
        company_name: intake.company_name || 'Unknown Company',
        go_live_date: intake.go_live_date,
        edi_experience: intake.edi_experience,
        data_format: intake.data_format,
        protocol: intake.protocol,
        transactions: intake.transactions || [],
        locations: intake.locations || [],
        unique_requirements: intake.unique_requirements,
        created_at: intake.created_at,
        analysis: intake.ai_analysis?.[0] || null
      }));
      setIntakes(formatted);
      if (formatted.length > 0 && !selectedIntake) {
        setSelectedIntake(formatted[0]);
      }
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!selectedIntake || !decision) return;

    const jiraEpicId = `EDI-${Math.floor(1000 + Math.random() * 9000)}`;

    alert(`✓ Approved: ${selectedIntake.company_name}\n\nJIRA Epic Created: ${jiraEpicId}\n\nDecision: ${decision}\n\nNext Steps:\n• Development team assigned\n• Kickoff meeting scheduled\n• Test environment provisioned`);

    setDecision('');
    setStatus('approved');
  };

  const handleDefer = async () => {
    if (!selectedIntake || !decision) return;

    alert(`⏸ Deferred: ${selectedIntake.company_name}\n\nReason: ${decision}\n\nNext Steps:\n• Prerequisites documented\n• Trading partner notified\n• Added to future pipeline`);

    setDecision('');
    setStatus('deferred');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (intakes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Review & Approval Flow</h2>
          <p className="text-slate-600 mt-1">Human-in-the-loop decision making with AI assistance</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileCheck className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Intakes to Review</h3>
          <p className="text-slate-600">Upload an intake document to begin the review process</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Review & Approval Flow</h2>
        <p className="text-slate-600 mt-1">Human-in-the-loop decision making with AI assistance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            Pending Review
          </h3>
          <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto">
            {intakes.map((intake) => (
              <button
                key={intake.id}
                onClick={() => setSelectedIntake(intake)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedIntake?.id === intake.id
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <p className="font-medium text-sm text-slate-900 truncate">
                  {intake.company_name}
                </p>
                <p className="text-xs text-slate-600 truncate mt-1">
                  {intake.protocol || 'Protocol TBD'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${getReadinessIndicator(intake.analysis?.readiness_score || 0)}`} />
                  <span className="text-xs text-slate-600">{intake.analysis?.readiness_score || 0}% ready</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {selectedIntake && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedIntake.company_name}</h3>
                    <p className="text-lg text-slate-600">{selectedIntake.protocol || 'Protocol TBD'}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        selectedIntake.analysis?.complexity_level === 'high' ? 'bg-red-100 text-red-700' :
                        selectedIntake.analysis?.complexity_level === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {selectedIntake.analysis?.complexity_level || 'medium'} complexity
                      </span>
                      {selectedIntake.edi_experience && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                          {selectedIntake.edi_experience}
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        status === 'approved' ? 'bg-green-100 text-green-700' :
                        status === 'deferred' ? 'bg-slate-100 text-slate-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {status === 'approved' ? '✓ Approved' : status === 'deferred' ? '⏸ Deferred' : 'Pending Review'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Submitted</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(selectedIntake.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {Math.floor((Date.now() - new Date(selectedIntake.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Request Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Company:</span>
                        <span className="font-medium text-slate-900">{selectedIntake.company_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Data Format:</span>
                        <span className="font-medium text-slate-900">{selectedIntake.data_format || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Protocol:</span>
                        <span className="font-medium text-slate-900">{selectedIntake.protocol || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Go-Live Date:</span>
                        <span className="font-medium text-slate-900">
                          {selectedIntake.go_live_date
                            ? new Date(selectedIntake.go_live_date).toLocaleDateString()
                            : 'Not specified'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-sm text-slate-600">Transactions:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedIntake.transactions.map((type, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-sm text-slate-600">Locations:</span>
                      <p className="text-sm font-medium text-slate-900 mt-1">{selectedIntake.locations.length} location(s)</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Readiness Metrics</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Readiness Score</span>
                          <span className="font-bold text-slate-900">{selectedIntake.analysis?.readiness_score || 0}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getScoreColor(selectedIntake.analysis?.readiness_score || 0)}`}
                            style={{ width: `${selectedIntake.analysis?.readiness_score || 0}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Complexity</span>
                          <span className="font-bold text-slate-900 capitalize">{selectedIntake.analysis?.complexity_level || 'medium'}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Timeline</span>
                          <span className="font-bold text-slate-900">{selectedIntake.analysis?.estimated_timeline || '6-8 weeks'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedIntake.unique_requirements && (
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Unique Requirements</h4>
                        <p className="text-sm text-slate-700 leading-relaxed">{selectedIntake.unique_requirements}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedIntake.analysis?.identified_risks && selectedIntake.analysis.identified_risks.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-cyan-600" />
                    <h4 className="font-semibold text-slate-900">Information Needs</h4>
                    <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">
                      {selectedIntake.analysis.identified_risks.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {selectedIntake.analysis.identified_risks.map((risk, idx) => (
                      <div key={idx} className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-slate-900">{risk.title}</h5>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            risk.type === 'high' ? 'bg-orange-100 text-orange-700' :
                            risk.type === 'medium' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {risk.type} priority
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">{risk.description}</p>
                        <p className="text-sm text-cyan-700 font-medium">{risk.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedIntake.analysis?.recommendations && selectedIntake.analysis.recommendations.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-cyan-600" />
                    <h4 className="font-semibold text-slate-900">AI Recommendations</h4>
                  </div>
                  <div className="space-y-3">
                    {selectedIntake.analysis.recommendations.map((recommendation, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-slate-900">{recommendation.title}</h5>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            recommendation.priority === 'critical' ? 'bg-red-100 text-red-700' :
                            recommendation.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            recommendation.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {recommendation.priority}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{recommendation.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedIntake.analysis?.missing_information && selectedIntake.analysis.missing_information.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-slate-900">Missing Information</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedIntake.analysis.missing_information.map((item, idx) => (
                      <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h4 className="font-semibold text-slate-900 mb-4">Decision & Action</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Decision Rationale
                    </label>
                    <textarea
                      value={decision}
                      onChange={(e) => setDecision(e.target.value)}
                      placeholder="Document your decision rationale..."
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={!decision}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve & Create Epic
                    </button>
                    <button
                      onClick={handleDefer}
                      disabled={!decision}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <Clock className="w-5 h-5" />
                      Defer
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 text-center">
                    Approval will generate Jira Epic, assign resources, and notify trading partner
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <h4 className="font-semibold text-slate-900 mb-3">Post-Approval Workflow</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <span className="text-slate-700">Jira Epic automatically created with AI-generated work breakdown</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <span className="text-slate-700">EDI development team assigned based on skill set and availability</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <span className="text-slate-700">Trading partner notified with kickoff meeting invitation</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <span className="text-slate-700">Test environment and certificates provisioned automatically</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getReadinessIndicator(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

function getPriorityBadge(priority: string): string {
  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-orange-100 text-orange-700',
    low: 'bg-slate-100 text-slate-600',
  };
  return colors[priority] || 'bg-slate-100 text-slate-600';
}

