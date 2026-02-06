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

    const { data: document } = await supabase
      .from('uploaded_documents')
      .select('*')
      .eq('id', intake.document_id)
      .maybeSingle();

    const aiRunId = crypto.randomUUID();

    await supabase.from('ai_runs').insert({
      id: aiRunId,
      intake_id: intakeId,
      run_type: 'diagnostics',
      model: 'gpt-4o-mini',
      status: 'in_progress'
    });

    const systemPrompt = createSystemPrompt(`You are an EDI onboarding risk analysis expert. Detect real onboarding and mapping failure patterns.

DETECTION TAXONOMY:

ONBOARDING CHALLENGES (detect these):
1. Master data inconsistency - Item IDs, locations, carrier codes don't match between systems
2. Communication protocol hurdles - AS2 certificate issues, SFTP connectivity, firewall rules
3. Non-standard implementation guides - Partner deviates from standard EDI specs
4. Resource constraints / ownership ambiguity - Unclear who owns what, no dedicated resources
5. Inadequate testing environment - Prod-only testing, no test data, unrealistic scenarios
6. Certificate management risks - Expiring certs, missing exchange, wrong formats
7. Legacy system rigidity - Old WMS can't support required transactions or fields
8. Vague business rules / edge case handling - "How do we handle split shipments?" unclear
9. Lack of visibility / error reason unknown - No logging, can't trace failures
10. Compliance / chargeback risk - Non-compliance with partner SLAs, format errors cause fees

MAPPING ISSUES (detect these):
1. Mandatory segment missing - Required EDI segments not in source data
2. Date/time format mismatch - YYMMDD vs YYYYMMDD, timezone confusion
3. Code conversion errors - Internal codes don't map to partner codes
4. Looping/nesting logic errors - Incorrect loop structures, wrong hierarchy
5. Character encoding issues - Special chars break EDI, ASCII vs UTF-8
6. Truncation overflow - Field length limits cause data loss
7. Rounding discrepancies - Decimal handling, quantity precision mismatches
8. Qualifier misuse - Wrong ID qualifiers (DUNS vs GLN), incorrect usage
9. Conditional dependency failures - If segment X exists, Y is required but missing
10. Version mismatch - Using 4010 when partner expects 5010

CONFIDENCE SCORING:
- Confidence < 0.6: Label as "Needs Validation"
- Confidence >= 0.6: Label as "Likely Risk"

Return STRICT JSON format:
{
  "diagnostics_version": "1.0",
  "intake_id": "intake-id",
  "overall_risk_level": "Low|Medium|High",
  "items": [
    {
      "category": "Mapping Issue|Onboarding Challenge|Compliance",
      "type": "Specific type from taxonomy",
      "severity": "Low|Medium|High|Critical",
      "confidence": 0.0-1.0,
      "confidence_label": "Needs Validation|Likely Risk",
      "why_it_matters": "1-2 sentences explaining business impact",
      "evidence": [
        {
          "source": "intake|document|analysis",
          "snippet": "Short relevant quote or data point",
          "field": "field_name"
        }
      ],
      "recommended_actions": [
        {
          "action": "Clear imperative statement",
          "owner_role": "EDI Ops|Integration|WMS SME|Partner",
          "priority": "P1|P2|P3"
        }
      ],
      "questions_to_confirm": ["Question 1", "Question 2"]
    }
  ]
}`);

    const userPrompt = `Analyze this EDI onboarding for risks and mapping issues:

INTAKE DATA:
${JSON.stringify(intake, null, 2)}

DOCUMENT METADATA:
${document ? JSON.stringify(document.metadata, null, 2) : 'No document metadata'}

READINESS ANALYSIS:
${analysis ? JSON.stringify(analysis, null, 2) : 'No analysis available'}

REAL-WORLD PATTERN EXAMPLES TO REFERENCE:
1. UOM Conflict: Customer orders by CASE, WMS ships by PALLET, no conversion table exists
2. AS2 Certificate Missing: Go-live date approaching, partner hasn't sent AS2 certificate
3. Non-standard 856: Partner requires custom segments not in standard 856 implementation guide
4. WMS Field Length: JDA WMS batch field limited to 20 chars, but customer PO numbers are 25 chars
5. Date Format Mismatch: Customer sends CCYYMMDD, system expects YYMMDD
6. Missing Qualifier: Customer location codes don't specify qualifier (92 vs ZZ)
7. Test Environment Gap: No test AS2 endpoint available, must test in production
8. Conditional Dependency: If shipment has multiple cartons, CTT segment required but customer doesn't send it
9. Master Data Sync: Customer item IDs in 810 don't match WMS item master, causing invoice failures
10. Rounding Issue: Weights rounded to 2 decimals cause EDI validation errors (expects 3)
11. Legacy Constraint: Old WMS version doesn't support cross-dock transactions needed for 943/944
12. Chargeback Risk: Partner SLA requires 856 within 2 hours of ship, but batch processing is every 4 hours

Identify 5-10 most critical risks with evidence. Be specific and realistic. Focus on what will actually block go-live or cause production issues.`;

    const aiResponse = await callOpenAIWithGuardrails({
      messages: [
        systemPrompt,
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
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

    const diagnostics = aiResponse.data;

    diagnostics.items = diagnostics.items.map((item: any) => ({
      ...item,
      confidence_label: item.confidence < 0.6 ? 'Needs Validation' : 'Likely Risk'
    }));

    await supabase.from('risk_diagnostics').insert({
      intake_id: intakeId,
      diagnostics_version: diagnostics.diagnostics_version,
      overall_risk_level: diagnostics.overall_risk_level,
      items: diagnostics.items
    });

    await supabase.from('ai_runs').update({
      status: 'success',
      output_json: aiResponse.data,
      token_usage: aiResponse.tokenUsage
    }).eq('id', aiRunId);

    return new Response(
      JSON.stringify({
        success: true,
        diagnostics
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
