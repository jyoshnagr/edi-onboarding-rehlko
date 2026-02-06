import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { callOpenAIWithGuardrails, createSystemPrompt } from '../_shared/openai-helper.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const { intake, analysis, riskDiagnostics, interviewSummary } = await req.json();

    const aiRunId = crypto.randomUUID();

    await supabase.from('ai_runs').insert({
      id: aiRunId,
      intake_id: intake.id,
      run_type: 'action_items',
      model: 'gpt-4o-mini',
      status: 'in_progress'
    });

    // Calculate date constraints for action items
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const systemPrompt = createSystemPrompt(`You are an EDI onboarding project planning expert. Generate a comprehensive, prioritized action plan.

CRITICAL RULES:
1. Generate 8-15 action items maximum
2. Each item must be realistic, specific, and actionable
3. Link each item to a specific risk, gap, or requirement
4. Assign appropriate owner roles: Integration Engineer, EDI Ops, WMS SME, Partner, PM
5. Use priority levels: P1 (critical), P2 (high), P3 (medium)
6. Use effort sizing: S (1-2 days), M (3-5 days), L (1-2 weeks)
7. CRITICAL: Due dates MUST be in the future, starting from ${todayStr}
8. Spread due dates evenly from today to go-live date
9. Include 2-4 acceptance criteria per item

Group items by category:
- technical_setup: Connection and integration configuration
- data_alignment: Master data, mapping, UOM handling
- security_connectivity: Certificates, endpoints, protocols
- testing_validation: Testing plans and execution
- governance_approval: Reviews, sign-offs, go-live gates

Return JSON format:
{
  "actionItems": [
    {
      "title": "Clear, imperative title",
      "description": "Detailed description of what needs to be done and why",
      "priority": "P1|P2|P3",
      "assigned_to": "Role name",
      "category": "category_name",
      "effort_size": "S|M|L",
      "story_points": 1-8,
      "due_date": "YYYY-MM-DD (MUST be >= ${todayStr})",
      "dependencies": [],
      "acceptance_criteria": ["Criterion 1", "Criterion 2"],
      "why_exists": "Links to specific risk or gap"
    }
  ]
}`);

    const userPrompt = `Generate action items for EDI onboarding:

INTAKE DATA:
- Company: ${intake.company_name}
- Go-Live Date: ${intake.go_live_date}
- EDI Experience: ${intake.edi_experience}
- Protocol: ${intake.protocol}
- Data Format: ${intake.data_format}
- Transactions: ${JSON.stringify(intake.transactions)}
- Locations: ${intake.locations?.length || 1} location(s)
- Unique Requirements: ${intake.unique_requirements || 'None specified'}

READINESS ANALYSIS:
- Score: ${analysis.readiness_score}%
- Complexity: ${analysis.complexity_level}
- Identified Risks: ${analysis.identified_risks?.length || 0}
- Missing Information: ${JSON.stringify(analysis.missing_information || [])}
- Timeline Estimate: ${analysis.estimated_timeline}

${riskDiagnostics ? `RISK DIAGNOSTICS:
- Overall Risk Level: ${riskDiagnostics.overall_risk_level}
- Critical Issues: ${riskDiagnostics.items?.filter((i: any) => i.severity === 'Critical').length || 0}
- High Severity: ${riskDiagnostics.items?.filter((i: any) => i.severity === 'High').length || 0}` : ''}

${interviewSummary ? `INTERVIEW SUMMARY:
${interviewSummary}` : ''}

Generate a realistic, executable action plan.`;

    const aiResponse = await callOpenAIWithGuardrails({
      messages: [
        systemPrompt,
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      maxTokens: 2500,
      enforceJSON: true
    });

    if (!aiResponse.success) {
      await supabase.from('ai_runs').update({
        status: 'failed',
        error_message: aiResponse.error
      }).eq('id', aiRunId);

      return new Response(
        JSON.stringify({
          success: false,
          error: aiResponse.error
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const actionItems = aiResponse.data.actionItems || [];

    await supabase.from('ai_runs').update({
      status: 'success',
      output_json: aiResponse.data,
      token_usage: aiResponse.tokenUsage
    }).eq('id', aiRunId);

    return new Response(
      JSON.stringify({ success: true, actionItems }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
