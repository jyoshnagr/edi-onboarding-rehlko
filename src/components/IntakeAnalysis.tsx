import React, { useEffect, useState } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Calendar,
  TrendingUp,
  Activity,
  Target,
  ListTodo,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ActionItemsGenerator from './ActionItemsGenerator';
import InterviewAssistant from './InterviewAssistant';
import RiskDiagnostics from './RiskDiagnostics';
import PreFlightPack from './PreFlightPack';
import AIRunHistory from './AIRunHistory';
import AttachmentManager from './AttachmentManager';

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

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  assigned_to: string;
  status: string;
  due_date: string;
}

export default function IntakeAnalysis() {
  const [intakes, setIntakes] = useState<IntakeData[]>([]);
  const [selectedIntake, setSelectedIntake] = useState<IntakeData | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [hasGeneratedActions, setHasGeneratedActions] = useState(false);
  const [riskDiagnostics, setRiskDiagnostics] = useState<any>(null);

  useEffect(() => {
    loadIntakes();
  }, []);

  const loadIntakes = async () => {
    try {
      const { data, error } = await supabase
        .from('intake_extractions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setIntakes(data);
        setSelectedIntake(data[0]);
        await loadAnalysisData(data[0].id);
      }
    } catch (error) {
      console.error('Error loading intakes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysisData = async (intakeId: string) => {
    try {
      const { data: analysisData, error: analysisError } = await supabase
        .from('ai_analysis')
        .select('*')
        .eq('intake_id', intakeId)
        .maybeSingle();

      if (analysisError) throw analysisError;
      setAnalysis(analysisData);

      const { data: actionsData, error: actionsError } = await supabase
        .from('action_items')
        .select('*')
        .eq('intake_id', intakeId)
        .order('created_at', { ascending: false });

      if (actionsError) throw actionsError;
      setActionItems(actionsData || []);
      setHasGeneratedActions(false);
      setShowGenerator(false);
    } catch (error) {
      console.error('Error loading analysis:', error);
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

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedIntake || !analysis) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No Intake Forms Analyzed Yet
        </h3>
        <p className="text-gray-600">
          Upload an intake form to see intelligent analysis and insights
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">{selectedIntake.company_name}</h2>
            <p className="text-blue-100">EDI Onboarding Analysis</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold mb-1 ${
              analysis.readiness_score >= 80 ? 'text-green-300' :
              analysis.readiness_score >= 60 ? 'text-yellow-300' :
              'text-red-300'
            }`}>
              {analysis.readiness_score}%
            </div>
            <div className="text-sm text-blue-100">Readiness Score</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-200" />
              <span className="text-sm text-blue-100">Go-Live Date</span>
            </div>
            <div className="text-lg font-semibold">
              {new Date(selectedIntake.go_live_date).toLocaleDateString()}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-200" />
              <span className="text-sm text-blue-100">Locations</span>
            </div>
            <div className="text-lg font-semibold">
              {selectedIntake.locations.length} Sites
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-blue-200" />
              <span className="text-sm text-blue-100">Complexity</span>
            </div>
            <div className="text-lg font-semibold capitalize">
              {analysis.complexity_level}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-200" />
              <span className="text-sm text-blue-100">Timeline</span>
            </div>
            <div className="text-sm font-semibold">
              {analysis.estimated_timeline}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Additional Information Needed</h3>
          </div>

          <div className="space-y-4">
            {analysis.identified_risks.map((risk: any, index: number) => (
              <div
                key={index}
                className={`border-l-4 p-4 rounded-r-lg ${
                  risk.type === 'high'
                    ? 'border-blue-500 bg-blue-50'
                    : risk.type === 'medium'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-500 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{risk.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    risk.type === 'high'
                      ? 'bg-blue-200 text-blue-800'
                      : risk.type === 'medium'
                      ? 'bg-cyan-200 text-cyan-800'
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {risk.type === 'high' ? 'HIGH PRIORITY' : risk.type === 'medium' ? 'MEDIUM PRIORITY' : 'LOW PRIORITY'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{risk.description}</p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Next Steps:</span> {risk.impact}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Recommendations</h3>
          </div>

          <div className="space-y-3">
            {analysis.recommendations.map((rec: any, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    rec.priority === 'critical' ? 'bg-red-500' :
                    rec.priority === 'high' ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                    <p className="text-sm text-gray-600">{rec.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">JEDI - AI Interview Assistant</h3>
            <p className="text-sm text-gray-600">Your professional, energetic assistant for seamless intake completion</p>
          </div>
        </div>
        <InterviewAssistant
          intakeId={selectedIntake.id}
          missingFieldsCount={analysis.missing_information?.length || 0}
          onFieldsUpdated={() => loadAnalysisData(selectedIntake.id)}
        />
      </div>

      <AttachmentManager intakeId={selectedIntake.id} />

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Risk & Mapping Diagnostics</h3>
            <p className="text-sm text-gray-600">AI-detected onboarding challenges and mapping issues</p>
          </div>
        </div>
        <RiskDiagnostics
          intakeId={selectedIntake.id}
          onDiagnosticsComplete={(diagnostics) => setRiskDiagnostics(diagnostics)}
        />
      </div>

      {analysis.initial_readiness_score !== undefined &&
       analysis.initial_readiness_score !== null &&
       actionItems.length > 0 &&
       analysis.readiness_score > analysis.initial_readiness_score && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg border border-green-200">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Readiness Improvement</h3>
              <p className="text-sm text-slate-700 mb-4">
                Through AI-assisted analysis and clarification, this project's readiness has improved significantly.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Initial Assessment</p>
                  <p className="text-3xl font-bold text-slate-700">{analysis.initial_readiness_score}%</p>
                  <p className="text-xs text-slate-500 mt-1">Before refinement</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-xs text-green-700 mb-1">Current Readiness</p>
                  <p className="text-3xl font-bold text-green-700">{analysis.readiness_score}%</p>
                  <p className="text-xs text-green-600 mt-1">After AI assistance</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-4 text-white">
                  <p className="text-xs opacity-90 mb-1">Improvement</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">+{analysis.readiness_score - analysis.initial_readiness_score}%</p>
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <p className="text-xs opacity-90 mt-1">Readiness gained</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ListTodo className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Action Items & Project Plan</h3>
          </div>
          {actionItems.length > 0 && (
            <span className="text-sm text-gray-600">
              {actionItems.filter(item => item.status === 'pending').length} pending
            </span>
          )}
        </div>

        {showGenerator ? (
          <ActionItemsGenerator
            intake={selectedIntake}
            analysis={analysis}
            riskDiagnostics={riskDiagnostics}
            onComplete={() => {
              setShowGenerator(false);
              setHasGeneratedActions(true);
              loadAnalysisData(selectedIntake.id);
            }}
          />
        ) : !hasGeneratedActions ? (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Ready to Generate Action Items
              </h3>
              <p className="text-gray-700 mb-6">
                AI has analyzed the intake form, readiness assessment, and identified risks.
                Generate a comprehensive, prioritized action plan with intelligent assignments and realistic deadlines.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{analysis.readiness_score}%</div>
                  <div className="text-gray-600">Readiness Score</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{analysis.identified_risks.length}</div>
                  <div className="text-gray-600">Items to Address</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-green-600 mb-1">{analysis.recommendations.length}</div>
                  <div className="text-gray-600">Recommendations</div>
                </div>
              </div>

              <button
                onClick={() => setShowGenerator(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-105"
              >
                <Sparkles className="w-5 h-5" />
                Generate AI Action Items
              </button>

              <p className="text-sm text-gray-600 mt-4">
                AI will create a tailored execution plan based on the analysis
              </p>
            </div>
          </div>
        ) : actionItems.length === 0 ? (
          <div className="text-center py-12">
            <ListTodo className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              No Action Items Generated
            </h4>
            <p className="text-gray-600 mb-6">
              Generate action items to create your project execution plan.
            </p>
            <button
              onClick={() => setShowGenerator(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Generate AI Action Items
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                AI-generated action plan with {actionItems.length} tasks
              </p>
              <button
                onClick={() => setShowGenerator(true)}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Sparkles className="w-4 h-4" />
                Customize or Add More
              </button>
            </div>
            <div className="space-y-3">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(item.priority)}`}>
                          {item.priority.toUpperCase()}
                        </span>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {item.assigned_to}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {new Date(item.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <select
                      value={item.status}
                      onChange={(e) => {
                        supabase
                          .from('action_items')
                          .update({ status: e.target.value })
                          .eq('id', item.id)
                          .then(() => loadAnalysisData(selectedIntake.id));
                      }}
                      className={`px-3 py-1 text-sm rounded-lg border ${
                        item.status === 'completed'
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : item.status === 'in_progress'
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-gray-50 border-gray-200 text-gray-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Pre-Flight Pack</h3>
            <p className="text-sm text-gray-600">Production-ready checklist for go-live readiness</p>
          </div>
        </div>
        <PreFlightPack intakeId={selectedIntake.id} />
      </div>

      <AIRunHistory intakeId={selectedIntake.id} />

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Contacts</h4>
            <div className="space-y-2">
              {selectedIntake.customer_contacts.map((contact: any, index: number) => (
                <div key={index} className="text-sm bg-gray-50 rounded-lg p-3">
                  <div className="font-medium text-gray-900">{contact.name}</div>
                  <div className="text-gray-600">{contact.title}</div>
                  <div className="text-gray-500">{contact.email}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Integration Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Protocol:</span>
                <span className="font-medium text-gray-900">{selectedIntake.protocol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data Format:</span>
                <span className="font-medium text-gray-900">{selectedIntake.data_format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">EDI Experience:</span>
                <span className="font-medium text-gray-900">{selectedIntake.edi_experience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transactions:</span>
                <span className="font-medium text-gray-900">{selectedIntake.transactions.length}</span>
              </div>
            </div>
          </div>
        </div>

        {selectedIntake.unique_requirements && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Unique Requirements</h4>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
              {selectedIntake.unique_requirements}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
