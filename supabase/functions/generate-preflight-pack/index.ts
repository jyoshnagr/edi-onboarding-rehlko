import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { callOpenAIWithGuardrails, createSystemPrompt } from '../_shared/openai-helper.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const { intakeId } = await req.json();

    const { data: intake } = await supabase
      .from('intake_extractions')
      .select('*')
      .eq('id', intakeId)
      .single();

    const { data: analysis } = await supabase
      .from('ai_analysis')
      .select('*')
      .eq('intake_id', intakeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: diagnostics } = await supabase
      .from('risk_diagnostics')
      .select('*')
      .eq('intake_id', intakeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const aiRunId = crypto.randomUUID();

    await supabase.from('ai_runs').insert({
      id: aiRunId,
      intake_id: intakeId,
      run_type: 'preflight',
      model: 'gpt-4o-mini',
      status: 'in_progress'
    });

    const systemPrompt = createSystemPrompt(`You are an EDI onboarding readiness expert creating a comprehensive Pre-Flight Pack.

OBJECTIVE: Generate a production-ready checklist that the onboarding team can use immediately.

PACK SECTIONS:

1. CONNECTIVITY CHECKLIST
   - Protocol-specific details (AS2 IDs, SFTP endpoints, etc.)
   - IP whitelisting requirements
   - Port configurations
   - Connection testing steps

2. SECURITY & CERTIFICATE CHECKLIST
   - Certificate exchange status
   - Certificate expiry dates
   - Encryption requirements
   - Authentication setup

3. TEST PLAN OUTLINE
   - Happy path scenarios
   - Edge cases and messy data scenarios
   - Error handling validation
   - Performance testing

4. IMPLEMENTATION GUIDE VARIANCE CHECKLIST
   - Identify non-standard requirements
   - Custom segment usage
   - Partner-specific deviations from standard EDI

5. MASTER DATA ALIGNMENT CHECKLIST
   - Item ID mappings
   - UOM conversions
   - Location codes and qualifiers
   - Carrier code mappings
   - Address field length limits

6. GO-LIVE GATING CRITERIA
   - Required sign-offs
   - Testing completion requirements
   - Documentation deliverables
   - Support readiness

Return JSON format:
{
  "pack_version": "1.0",
  "generated_for": "Company Name",
  "go_live_date": "YYYY-MM-DD",
  "sections": {
    "connectivity": {
      "title": "Connectivity Checklist",
      "items": [
        {
          "item": "Checklist item description",
          "status": "not_started|in_progress|completed|blocked",
          "owner": "Role",
          "priority": "P1|P2|P3",
          "details": "Additional context or requirements"
        }
      ]
    },
    "security": { "title": "...", "items": [...] },
    "test_plan": { "title": "...", "items": [...] },
    "implementation_variance": { "title": "...", "items": [...] },
    "master_data": { "title": "...", "items": [...] },
    "go_live_gates": { "title": "...", "items": [...] }
  },
  "critical_path_items": ["Item 1", "Item 2"],
  "estimated_completion_date": "YYYY-MM-DD"
}`);

    const userPrompt = `Generate Pre-Flight Pack for:

INTAKE DATA:
${JSON.stringify(intake, null, 2)}

READINESS ANALYSIS:
${analysis ? JSON.stringify(analysis, null, 2) : 'No analysis available'}

RISK DIAGNOSTICS:
${diagnostics ? JSON.stringify({ overall_risk_level: diagnostics.overall_risk_level, items_count: diagnostics.items?.length || 0 }, null, 2) : 'No diagnostics available'}

Create a comprehensive, actionable Pre-Flight Pack with 6-8 items per section. Be specific to the protocol (${intake.protocol}), data format (${intake.data_format}), and partner requirements. Focus on items that must be completed before go-live on ${intake.go_live_date}.`;

    const aiResponse = await callOpenAIWithGuardrails({
      messages: [
        systemPrompt,
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6,
      maxTokens: 3000,
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

    const pack = aiResponse.data;

    await supabase.from('preflight_packs').insert({
      intake_id: intakeId,
      pack_content: pack
    });

    await supabase.from('ai_runs').update({
      status: 'success',
      output_json: aiResponse.data,
      token_usage: aiResponse.tokenUsage
    }).eq('id', aiRunId);

    return new Response(
      JSON.stringify({
        success: true,
        pack
      }),
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
