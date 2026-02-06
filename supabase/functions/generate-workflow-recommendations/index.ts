import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { callOpenAIWithGuardrails, createSystemPrompt } from '../_shared/openai-helper.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WorkflowRecommendationRequest {
  intakeId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { intakeId }: WorkflowRecommendationRequest = await req.json();

    if (!intakeId) {
      return new Response(
        JSON.stringify({ error: "intakeId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: intake } = await supabase
      .from('intake_extractions')
      .select('*')
      .eq('id', intakeId)
      .maybeSingle();

    const { data: analysis } = await supabase
      .from('ai_analysis')
      .select('*')
      .eq('intake_id', intakeId)
      .maybeSingle();

    const { data: riskDiagnostics } = await supabase
      .from('risk_diagnostics')
      .select('*')
      .eq('intake_id', intakeId)
      .maybeSingle();

    const { data: actionItems } = await supabase
      .from('action_items')
      .select('*')
      .eq('intake_id', intakeId);

    const { data: enrichment } = await supabase
      .from('customer_enrichment')
      .select('*')
      .eq('intake_id', intakeId)
      .eq('status', 'completed')
      .maybeSingle();

    if (!intake) {
      return new Response(
        JSON.stringify({ error: "Intake not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const recommendationId = crypto.randomUUID();

    await supabase.from('workflow_recommendations').insert({
      id: recommendationId,
      intake_id: intakeId,
      status: 'running',
      model: 'gpt-4o-mini'
    });

    const systemPrompt = createSystemPrompt(`You are an EDI onboarding automation expert. Generate operational workflow recommendations based on identified risks, gaps, and action items.

WORKFLOW TYPES TO CONSIDER:
1. Network Whitelist Request (ServiceNow)
   - When: AS2/SFTP/API endpoints need configuration
   - Owner: Network Operations
   - Creates: ServiceNow ticket for firewall rules

2. AS2 Certificate Exchange + Expiration Tracking
   - When: AS2 protocol detected
   - Owner: Security Team / EDI Ops
   - Creates: Certificate request + calendar reminders

3. WMS Configuration Request
   - When: WMS integration or master data alignment needed
   - Owner: WMS SME
   - Creates: Internal task + configuration checklist

4. Partner Endpoint Validation
   - When: Protocol/endpoint information incomplete
   - Owner: Integration Engineer
   - Creates: Validation checklist + test plan

5. Master Data Alignment Task Group
   - When: UOM, item IDs, carrier codes need mapping
   - Owner: Data Steward + WMS SME
   - Creates: Multiple sub-tasks for data validation

6. Test Plan Creation with Edge Cases
   - When: Complexity is medium/high or multiple locations
   - Owner: QA Lead + Integration Engineer
   - Creates: Comprehensive test scenarios

7. Implementation Guide Variance Checklist
   - When: Unique requirements or special handling detected
   - Owner: PM + Integration Engineer
   - Creates: Document review + sign-off workflow

CRITICAL RULES:
1. Generate 3-8 workflows maximum
2. Each workflow must link to specific risk, gap, or action item
3. Only recommend ServiceNow ticket creation when external ops team involvement is required
4. Include 3-5 concrete steps per workflow
5. Specify required data and approval needs
6. Assign realistic owner roles
7. Set priority based on risk severity and go-live timeline

Return strict JSON:
{
  "workflows": [
    {
      "workflow_type": "network_whitelist | certificate_exchange | wms_config | endpoint_validation | master_data | test_plan | implementation_variance",
      "title": "Clear, action-oriented title",
      "reason": "Why this workflow is needed (reference specific risk/gap)",
      "trigger_source": "risk:risk_title | action_item:item_id | missing_field:field_name",
      "priority": "P1 | P2 | P3",
      "owner_role": "Specific role responsible",
      "required_approvals": ["Role 1", "Role 2"],
      "steps": [
        "Step 1: Concrete action",
        "Step 2: Concrete action",
        "Step 3: Concrete action"
      ],
      "required_data": [
        "Data point 1",
        "Data point 2"
      ],
      "servicenow_ticket_required": true | false,
      "ticket_payload_template": {
        "category": "network | wms_config | security | integration",
        "short_description": "Brief title for ticket",
        "description": "Detailed description with context",
        "priority": "P1 | P2 | P3",
        "assignment_group": "Suggested team"
      } | null,
      "estimated_time_saved_hours": 4
    }
  ]
}`, true);

    const userPrompt = `Generate workflow recommendations for EDI onboarding:

INTAKE DATA:
Company: ${intake.company_name}
Go-Live Date: ${intake.go_live_date}
Protocol: ${intake.protocol}
Data Format: ${intake.data_format}
Transactions: ${JSON.stringify(intake.transactions)}
Locations: ${intake.locations?.length || 1} location(s)
EDI Experience: ${intake.edi_experience || 'Not specified'}

ANALYSIS:
Readiness Score: ${analysis?.readiness_score || 0}%
Complexity: ${analysis?.complexity_level || 'unknown'}
Timeline: ${analysis?.estimated_timeline || 'unknown'}
Identified Risks: ${JSON.stringify(analysis?.identified_risks || [])}
Missing Information: ${JSON.stringify(analysis?.missing_information || [])}

${riskDiagnostics ? `RISK DIAGNOSTICS:
Overall Risk Level: ${riskDiagnostics.overall_risk_level}
Critical/High Issues: ${JSON.stringify(riskDiagnostics.items?.slice(0, 5) || [])}` : ''}

${actionItems && actionItems.length > 0 ? `ACTION ITEMS:
Total: ${actionItems.length}
High Priority: ${actionItems.filter((a: any) => a.priority === 'P1' || a.priority === 'critical').length}
${actionItems.slice(0, 5).map((a: any) => `- ${a.title} (${a.priority})`).join('\n')}` : ''}

${enrichment ? `CUSTOMER ENRICHMENT:
EDI Maturity: ${JSON.stringify(enrichment.output_json?.edi_maturity || {})}
Known Pain Points: ${JSON.stringify(enrichment.output_json?.edi_maturity?.known_pain_points || [])}
Special Handling: ${JSON.stringify(enrichment.output_json?.wra_attributes?.special_handling || [])}` : ''}

Generate realistic, high-value workflow recommendations that would save time and reduce risk.`;

    const aiResponse = await callOpenAIWithGuardrails({
      messages: [
        systemPrompt,
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6,
      maxTokens: 3000,
      enforceJSON: true
    });

    if (!aiResponse.success || !aiResponse.data) {
      await supabase.from('workflow_recommendations').update({
        status: 'failed'
      }).eq('id', recommendationId);

      return new Response(
        JSON.stringify({
          success: false,
          error: aiResponse.error || 'Failed to generate recommendations'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabase.from('workflow_recommendations').update({
      status: 'completed',
      recommendations_json: aiResponse.data.workflows || []
    }).eq('id', recommendationId);

    await supabase.from('ai_runs').insert({
      intake_id: intakeId,
      run_type: 'workflow_recommendations',
      model: 'gpt-4o-mini',
      status: 'success',
      output_json: aiResponse.data,
      token_usage: aiResponse.tokenUsage || 0
    });

    return new Response(
      JSON.stringify({
        success: true,
        recommendationId,
        workflows: aiResponse.data.workflows || []
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error generating workflow recommendations:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
