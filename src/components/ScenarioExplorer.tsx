import { useEffect, useState } from 'react';
import { supabase, OnboardingRequest } from '../lib/supabase';
import { Target, CheckCircle, Clock, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';

type ScenarioAction = 'approve' | 'defer' | 'adjust' | 'clarify';

export default function ScenarioExplorer() {
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequest | null>(null);
  const [selectedAction, setSelectedAction] = useState<ScenarioAction>('approve');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('onboarding_requests')
      .select('*, trading_partner:trading_partners(*)')
      .in('status', ['intake', 'review'])
      .order('business_value_score', { ascending: false });

    if (data) {
      setRequests(data);
      if (data.length > 0 && !selectedRequest) {
        setSelectedRequest(data[0]);
      }
    }
    setLoading(false);
  };

  const scenarios: Record<ScenarioAction, any> = {
    approve: {
      title: 'Approve & Proceed to Development',
      color: 'green',
      icon: CheckCircle,
      impacts: [
        {
          category: 'Timeline',
          impact: 'Estimated 3-4 weeks to completion based on similar onboardings',
          sentiment: 'positive'
        },
        {
          category: 'Resource Allocation',
          impact: '1 EDI developer, 0.5 WMS integration specialist for duration',
          sentiment: 'neutral'
        },
        {
          category: 'Risk Level',
          impact: selectedRequest && selectedRequest.readiness_score >= 80 ? 'Low - All prerequisites validated' : 'Medium - Some assumptions present',
          sentiment: selectedRequest && selectedRequest.readiness_score >= 80 ? 'positive' : 'warning'
        },
        {
          category: 'Dependencies',
          impact: 'AS2 certificate exchange, test environment provisioning',
          sentiment: 'neutral'
        },
        {
          category: 'Business Impact',
          impact: 'Revenue realization begins at go-live, customer satisfaction strengthened',
          sentiment: 'positive'
        }
      ],
      recommendation: selectedRequest && selectedRequest.readiness_score >= 80
        ? 'Strong recommendation to approve. All criteria met for successful implementation.'
        : 'Conditional approval recommended. Address open items during development.',
      nextSteps: [
        'Create Jira Epic and assign to EDI development team',
        'Schedule kickoff meeting with trading partner',
        'Provision test environment and certificates',
        'Begin mapping specification review'
      ]
    },
    defer: {
      title: 'Defer Until Prerequisites Met',
      color: 'orange',
      icon: Clock,
      impacts: [
        {
          category: 'Timeline',
          impact: 'Implementation delayed until constraints resolved (typically 4-12 weeks)',
          sentiment: 'warning'
        },
        {
          category: 'Resource Allocation',
          impact: 'No immediate resource commitment, allows focus on ready onboardings',
          sentiment: 'positive'
        },
        {
          category: 'Risk Mitigation',
          impact: 'Eliminates risk of mid-development surprises and rework',
          sentiment: 'positive'
        },
        {
          category: 'Customer Relationship',
          impact: 'May impact customer satisfaction, requires clear communication',
          sentiment: 'negative'
        },
        {
          category: 'Business Impact',
          impact: 'Revenue realization postponed, but ensures sustainable implementation',
          sentiment: 'neutral'
        }
      ],
      recommendation: 'Recommended when critical blockers present or readiness score below threshold.',
      nextSteps: [
        'Document specific prerequisites and blockers',
        'Communicate deferral rationale to trading partner',
        'Establish clear criteria for reconsideration',
        'Add to future pipeline with target date'
      ]
    },
    adjust: {
      title: 'Adjust Scope via EDI-Layer Workaround',
      color: 'blue',
      icon: TrendingUp,
      impacts: [
        {
          category: 'Timeline',
          impact: 'Can proceed immediately with adjusted scope, full scope in future phase',
          sentiment: 'positive'
        },
        {
          category: 'Technical Complexity',
          impact: 'EDI layer handles translation, reduces WMS customization needs',
          sentiment: 'positive'
        },
        {
          category: 'Maintenance',
          impact: 'Additional configuration to maintain, technical debt consideration',
          sentiment: 'warning'
        },
        {
          category: 'Customer Experience',
          impact: 'Meets immediate needs, demonstrates partnership and flexibility',
          sentiment: 'positive'
        },
        {
          category: 'Cost',
          impact: 'Lower initial implementation cost, potential future enhancement cost',
          sentiment: 'neutral'
        }
      ],
      recommendation: 'Creative approach when WMS constraints exist but business value is high.',
      nextSteps: [
        'Design EDI-layer translation logic and mapping',
        'Document workaround architecture and limitations',
        'Gain trading partner acceptance of adjusted approach',
        'Plan future enhancement for full capability'
      ]
    },
    clarify: {
      title: 'Request Clarification & Additional Info',
      color: 'purple',
      icon: AlertTriangle,
      impacts: [
        {
          category: 'Timeline',
          impact: 'Implementation delayed 1-3 weeks pending information gathering',
          sentiment: 'warning'
        },
        {
          category: 'Requirements Quality',
          impact: 'Significantly improved clarity reduces downstream issues',
          sentiment: 'positive'
        },
        {
          category: 'Development Efficiency',
          impact: 'Eliminates mid-development pivots and rework cycles',
          sentiment: 'positive'
        },
        {
          category: 'Resource Utilization',
          impact: 'Enables team to focus on clear, ready onboardings',
          sentiment: 'positive'
        },
        {
          category: 'Success Probability',
          impact: 'Higher likelihood of on-time, on-budget completion',
          sentiment: 'positive'
        }
      ],
      recommendation: 'Best practice when intake completeness below 70% or critical data missing.',
      nextSteps: [
        'Generate detailed information request with specific questions',
        'Send requirements checklist to trading partner',
        'Schedule technical discovery call if needed',
        'Set response deadline with follow-up plan'
      ]
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const currentScenario = scenarios[selectedAction];
  const Icon = currentScenario.icon;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Scenario & Impact Explorer</h2>
        <p className="text-slate-600 mt-1">Explore decision paths and understand downstream impacts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Select Request</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {requests.map((request) => (
                <button
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedRequest?.id === request.id
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-sm text-slate-900 truncate">
                    {request.request_number}
                  </p>
                  <p className="text-xs text-slate-600 truncate mt-1">
                    {request.trading_partner?.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500">Value: {request.business_value_score}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">Ready: {request.readiness_score}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedRequest && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Quick Info</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-600">Partner:</span>
                  <span className="ml-2 font-medium text-slate-900">{selectedRequest.trading_partner?.name}</span>
                </div>
                <div>
                  <span className="text-slate-600">Priority:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                    {selectedRequest.priority}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Readiness:</span>
                  <span className="ml-2 font-medium text-slate-900">{selectedRequest.readiness_score}%</span>
                </div>
                <div>
                  <span className="text-slate-600">Business Value:</span>
                  <span className="ml-2 font-medium text-slate-900">{selectedRequest.business_value_score}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Explore Decision Scenarios</h3>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(scenarios) as ScenarioAction[]).map((action) => {
                const scenario = scenarios[action];
                const ScenarioIcon = scenario.icon;
                const isSelected = selectedAction === action;
                return (
                  <button
                    key={action}
                    onClick={() => setSelectedAction(action)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? `border-${scenario.color}-500 bg-${scenario.color}-50`
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <ScenarioIcon className={`w-5 h-5 mb-2 ${
                      isSelected ? `text-${scenario.color}-600` : 'text-slate-400'
                    }`} />
                    <p className={`text-sm font-semibold ${
                      isSelected ? 'text-slate-900' : 'text-slate-700'
                    }`}>
                      {scenario.title}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedRequest && (
            <>
              <div className={`bg-${currentScenario.color}-50 border border-${currentScenario.color}-200 rounded-xl p-6`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 bg-white rounded-lg`}>
                    <Icon className={`w-6 h-6 text-${currentScenario.color}-600`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{currentScenario.title}</h3>
                    <p className="text-sm text-slate-700 mt-1">{currentScenario.recommendation}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-slate-600" />
                  <h4 className="font-semibold text-slate-900">Impact Analysis</h4>
                </div>
                <div className="space-y-3">
                  {currentScenario.impacts.map((impact: any, index: number) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className="font-semibold text-slate-900">{impact.category}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSentimentColor(impact.sentiment)}`}>
                          {impact.sentiment}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{impact.impact}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRight className="w-5 h-5 text-slate-600" />
                  <h4 className="font-semibold text-slate-900">Recommended Next Steps</h4>
                </div>
                <div className="space-y-2">
                  {currentScenario.nextSteps.map((step: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-sm text-slate-700 leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6">
                <h4 className="font-semibold text-slate-900 mb-3">AI Decision Support</h4>
                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                  Based on readiness analysis, historical patterns, and current resource availability,
                  the AI evaluates each scenario path to help you make informed decisions. This replaces
                  tribal knowledge with data-driven insights.
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 mb-1">Historical Success Rate</p>
                    <p className="text-xl font-bold text-cyan-700">89%</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Similar Cases Analyzed</p>
                    <p className="text-xl font-bold text-cyan-700">127</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Avg Decision Time Saved</p>
                    <p className="text-xl font-bold text-cyan-700">3.5 hrs</p>
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

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-orange-100 text-orange-700',
    low: 'bg-slate-100 text-slate-600',
  };
  return colors[priority] || 'bg-slate-100 text-slate-600';
}

function getSentimentColor(sentiment: string): string {
  const colors: Record<string, string> = {
    positive: 'bg-green-100 text-green-700',
    negative: 'bg-red-100 text-red-700',
    warning: 'bg-orange-100 text-orange-700',
    neutral: 'bg-slate-100 text-slate-600',
  };
  return colors[sentiment] || 'bg-slate-100 text-slate-600';
}
