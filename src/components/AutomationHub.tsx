import { useEffect, useState } from 'react';
import {
  Sparkles,
  Database,
  Workflow,
  Ticket,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Play,
  RefreshCw,
  TrendingUp,
  FileCheck,
  Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AutomationHubProps {
  intakeId: string | null;
}

export default function AutomationHub({ intakeId: providedIntakeId }: AutomationHubProps) {
  const [intakeId, setIntakeId] = useState<string | null>(providedIntakeId);
  const [hasActionItems, setHasActionItems] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState<any>(null);
  const [enrichmentStatus, setEnrichmentStatus] = useState<'not_run' | 'running' | 'completed' | 'failed'>('not_run');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<'not_run' | 'running' | 'completed' | 'failed'>('not_run');
  const [automationRuns, setAutomationRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingEnrichment, setProcessingEnrichment] = useState(false);
  const [processingWorkflows, setProcessingWorkflows] = useState(false);
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);

  useEffect(() => {
    loadMostRecentIntake();
  }, []);

  const loadMostRecentIntake = async () => {
    if (providedIntakeId) {
      setIntakeId(providedIntakeId);
      loadData(providedIntakeId);
      return;
    }

    const { data } = await supabase
      .from('intake_extractions')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setIntakeId(data.id);
      loadData(data.id);
    } else {
      setLoading(false);
    }
  };

  const loadData = async (currentIntakeId?: string) => {
    const targetIntakeId = currentIntakeId || intakeId;
    if (!targetIntakeId) return;

    setLoading(true);

    const { data: actionItems } = await supabase
      .from('action_items')
      .select('*')
      .eq('intake_id', targetIntakeId);

    setHasActionItems((actionItems?.length || 0) > 0);

    const { data: enrichment } = await supabase
      .from('customer_enrichment')
      .select('*')
      .eq('intake_id', targetIntakeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (enrichment) {
      setEnrichmentData(enrichment);
      setEnrichmentStatus(enrichment.status);
    }

    const { data: workflowRecs } = await supabase
      .from('workflow_recommendations')
      .select('*')
      .eq('intake_id', targetIntakeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (workflowRecs) {
      setWorkflows(workflowRecs.recommendations_json || []);
      setWorkflowStatus(workflowRecs.status);
    }

    const { data: runs } = await supabase
      .from('automation_runs')
      .select('*')
      .eq('intake_id', targetIntakeId)
      .order('created_at', { ascending: false });

    setAutomationRuns(runs || []);
    setLoading(false);
  };

  const runEnrichment = async () => {
    if (!intakeId) return;

    setProcessingEnrichment(true);
    setEnrichmentStatus('running');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-customer-enrichment`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intakeId }),
      });

      const result = await response.json();

      if (result.success) {
        await loadData();
      } else {
        setEnrichmentStatus('failed');
      }
    } catch (error) {
      console.error('Enrichment error:', error);
      setEnrichmentStatus('failed');
    } finally {
      setProcessingEnrichment(false);
    }
  };

  const generateWorkflowRecommendations = async () => {
    if (!intakeId) return;

    setProcessingWorkflows(true);
    setWorkflowStatus('running');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-workflow-recommendations`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intakeId }),
      });

      const result = await response.json();

      if (result.success) {
        await loadData();
      } else {
        setWorkflowStatus('failed');
      }
    } catch (error) {
      console.error('Workflow generation error:', error);
      setWorkflowStatus('failed');
    } finally {
      setProcessingWorkflows(false);
    }
  };

  const createServiceNowTicket = async (workflow: any) => {
    if (!intakeId || !workflow.ticket_payload_template) return;

    const workflowId = `wf-${Date.now()}`;

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-servicenow-ticket`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intakeId,
          workflowId,
          category: workflow.ticket_payload_template.category,
          short_description: workflow.ticket_payload_template.short_description,
          description: workflow.ticket_payload_template.description,
          priority: workflow.ticket_payload_template.priority,
          assignment_group: workflow.ticket_payload_template.assignment_group
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Ticket creation error:', error);
    }
  };

  const calculateMetrics = () => {
    const workflowsRecommended = workflows.length;
    const ticketsCreated = automationRuns.filter(r => r.run_type === 'servicenow_ticket' && r.status === 'completed').length;
    const estimatedTimeSaved = workflows.reduce((sum, w) => sum + (w.estimated_time_saved_hours || 4), 0);

    return { workflowsRecommended, ticketsCreated, estimatedTimeSaved };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!hasActionItems) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
        <Lock className="w-16 h-16 text-slate-400 mb-4" />
        <h3 className="text-xl font-semibold text-slate-700 mb-2">
          Automation Hub Locked
        </h3>
        <p className="text-slate-600 text-center max-w-md">
          Complete Action Items generation to unlock the Automation Hub.
          The hub provides customer enrichment, workflow recommendations, and automated ticketing.
        </p>
      </div>
    );
  }

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Automation Hub</h2>
        <p className="text-slate-600 mt-1">
          Enrich customer context, generate workflows, and automate operational tasks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={Workflow}
          label="Workflows Recommended"
          value={metrics.workflowsRecommended}
          color="blue"
        />
        <MetricCard
          icon={Ticket}
          label="Tickets Created"
          value={metrics.ticketsCreated}
          color="green"
        />
        <MetricCard
          icon={Clock}
          label="Estimated Time Saved"
          value={`${metrics.estimatedTimeSaved}h`}
          color="orange"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Customer Enrichment (Salesforce/WRA)</h3>
            <p className="text-sm text-slate-600">Pull customer context and merge into onboarding profile</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={runEnrichment}
            disabled={processingEnrichment || enrichmentStatus === 'running'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processingEnrichment ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Enrichment
          </button>

          <StatusBadge status={enrichmentStatus} />
        </div>

        {enrichmentData && enrichmentStatus === 'completed' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Account Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-600">Account Name:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {enrichmentData.output_json?.account_summary?.account_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Industry:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {enrichmentData.output_json?.account_summary?.industry}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">EDI Maturity:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {enrichmentData.output_json?.edi_maturity?.level}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">WMS:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {enrichmentData.output_json?.wra_attributes?.primary_wms}
                  </span>
                </div>
              </div>
            </div>

            {enrichmentData.merged_updates_json?.has_updates && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Suggested Updates Available</h4>
                </div>
                <p className="text-sm text-green-800 mb-3">
                  Enrichment found {Object.keys(enrichmentData.merged_updates_json.fields_to_update || {}).length} fields that can be updated
                </p>
                <div className="space-y-2 text-sm">
                  {Object.entries(enrichmentData.merged_updates_json.fields_to_update || {}).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-white rounded p-2">
                      <span className="font-medium text-slate-700">{key}:</span>
                      <span className="ml-2 text-slate-600">{typeof value === 'object' ? JSON.stringify(value).substring(0, 100) : value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Workflow className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Workflow Recommendations</h3>
            <p className="text-sm text-slate-600">AI-generated operational workflows based on identified risks</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={generateWorkflowRecommendations}
            disabled={processingWorkflows || workflowStatus === 'running'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processingWorkflows ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate Workflow Recommendations
          </button>

          <StatusBadge status={workflowStatus} />
        </div>

        {workflows.length > 0 && (
          <div className="space-y-3">
            {workflows.map((workflow, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        workflow.priority === 'P1' ? 'bg-red-100 text-red-800' :
                        workflow.priority === 'P2' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {workflow.priority}
                      </span>
                      <h4 className="font-semibold text-slate-900">{workflow.title}</h4>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{workflow.reason}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Owner: {workflow.owner_role}</span>
                      <span>Type: {workflow.workflow_type}</span>
                      <span>Time Saved: {workflow.estimated_time_saved_hours || 4}h</span>
                    </div>
                  </div>
                </div>

                {expandedWorkflow === `${index}` ? (
                  <div className="mt-4 space-y-3">
                    <div className="bg-slate-50 rounded p-3">
                      <h5 className="text-sm font-semibold text-slate-900 mb-2">Steps:</h5>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">
                        {workflow.steps?.map((step: string, i: number) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="bg-slate-50 rounded p-3">
                      <h5 className="text-sm font-semibold text-slate-900 mb-2">Required Data:</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                        {workflow.required_data?.map((data: string, i: number) => (
                          <li key={i}>{data}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedWorkflow(null)}
                        className="px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                      >
                        Hide Details
                      </button>
                      {workflow.servicenow_ticket_required && (
                        <button
                          onClick={() => createServiceNowTicket(workflow)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <Ticket className="w-3 h-3" />
                          Create ServiceNow Ticket
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setExpandedWorkflow(`${index}`)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Details & Actions →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Ticket className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Automation Executions</h3>
            <p className="text-sm text-slate-600">ServiceNow tickets and internal task tracking</p>
          </div>
        </div>

        {automationRuns.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            No automation runs yet. Create workflows and execute them to see activity here.
          </div>
        ) : (
          <div className="space-y-3">
            {automationRuns.map((run) => (
              <div
                key={run.id}
                className="border border-slate-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={run.status} small />
                      <span className="text-sm font-medium text-slate-900">
                        {run.run_type === 'servicenow_ticket' ? 'ServiceNow Ticket' : 'Internal Task'}
                      </span>
                    </div>
                    {run.response_payload_json?.ticket_number && (
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-slate-600">Ticket:</span>
                          <span className="ml-2 font-mono font-medium text-slate-900">
                            {run.response_payload_json.ticket_number}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-600">Category:</span>
                          <span className="ml-2 text-slate-900">{run.request_payload_json?.category}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Assignment:</span>
                          <span className="ml-2 text-slate-900">{run.request_payload_json?.assignment_group}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {run.response_payload_json?.url && (
                    <a
                      href={run.response_payload_json.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      View Ticket
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-3 ${colorClasses[color as keyof typeof colorClasses]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );
}

function StatusBadge({ status, small = false }: { status: string; small?: boolean }) {
  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    not_run: { color: 'bg-slate-100 text-slate-600', icon: Clock, label: 'Not Run' },
    running: { color: 'bg-blue-100 text-blue-700', icon: RefreshCw, label: 'Running' },
    completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Completed' },
    failed: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Failed' },
    draft: { color: 'bg-slate-100 text-slate-600', icon: Clock, label: 'Draft' },
    awaiting_approval: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Awaiting Approval' },
    approved: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Approved' },
    executing: { color: 'bg-blue-100 text-blue-700', icon: RefreshCw, label: 'Executing' },
  };

  const config = statusConfig[status] || statusConfig.not_run;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1 ${small ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1'} rounded-full ${config.color}`}>
      <Icon className={small ? 'w-3 h-3' : 'w-4 h-4'} />
      {config.label}
    </div>
  );
}
