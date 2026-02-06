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

    const { intakeId, sessionId, userMessage, conversationHistory } = await req.json();

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
      .single();

    const { data: session } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    const aiRunId = crypto.randomUUID();

    await supabase.from('ai_runs').insert({
      id: aiRunId,
      intake_id: intakeId,
      run_type: 'interview',
      model: 'gpt-4o-mini',
      status: 'in_progress'
    });

    const systemPrompt = createSystemPrompt(`You are an EDI onboarding specialist conducting an interactive interview to fill gaps in intake data.

OBJECTIVES:
1. Identify missing critical information
2. Clarify ambiguous requirements
3. Validate assumptions
4. Confirm technical details

IMPORTANT CONSTRAINTS:
- Do NOT invent or assume values
- Only ask questions based on provided intake and analysis data
- Focus on clarification and confirmation
- Ask one focused question at a time
- Be specific about protocol details (AS2, SFTP, etc.)

QUESTION FOCUS AREAS:
- Protocol specifics: AS2 IDs, qualifiers, endpoints, certificates
- WMS constraints: JDA/Manhattan/SAP rules, batch limits, label requirements
- UOM handling: CASE/PALLET/EACH, conversion rules
- Master data: Qualifier formats, address limits, carrier codes
- Testing environment: Realistic test data, endpoint availability

Return JSON format:
{
  "assistant_question": "Clear, specific question",
  "reason_for_question": "Why this matters for onboarding",
  "expected_answer_type": "text|choice|date|list",
  "field_to_update": "field_name or null",
  "suggested_choices": ["option1", "option2"] or null,
  "updated_fields": {},
  "new_missing_fields": [],
  "validated_assumptions": []
}`);

    const conversationContext = conversationHistory && conversationHistory.length > 0
      ? `\n\nPREVIOUS CONVERSATION:\n${conversationHistory.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`
      : '';

    const userPrompt = `INTAKE DATA:
${JSON.stringify(intake, null, 2)}

ANALYSIS:
- Readiness Score: ${analysis?.readiness_score || 'Unknown'}%
- Missing Information: ${JSON.stringify(analysis?.missing_information || [])}
- Identified Risks: ${JSON.stringify(analysis?.identified_risks || [])}

CURRENT SESSION DATA:
${session ? `- Updated Fields: ${JSON.stringify(session.updated_fields)}
- Remaining Missing Fields: ${JSON.stringify(session.missing_fields_after)}` : 'New session'}
${conversationContext}

USER MESSAGE: ${userMessage}

Based on the user's message, either:
1. If this is a response to your previous question, extract the information and update fields
2. If this is the start or you need more info, ask the next most important clarifying question

Focus on: protocol details, WMS constraints, UOM handling, master data formats, and testing readiness.`;

    const aiResponse = await callOpenAIWithGuardrails({
      messages: [
        systemPrompt,
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      maxTokens: 1500,
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

    const result = aiResponse.data;

    const newMessages = [
      ...(conversationHistory || []),
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
      { role: 'assistant', content: result.assistant_question, timestamp: new Date().toISOString() }
    ];

    const updatedFieldsData = {
      ...(session?.updated_fields || {}),
      ...(result.updated_fields || {})
    };

    if (session) {
      await supabase.from('interview_sessions').update({
        messages: newMessages,
        updated_fields: updatedFieldsData,
        missing_fields_after: result.new_missing_fields || session.missing_fields_after,
        validated_assumptions: [...(session.validated_assumptions || []), ...(result.validated_assumptions || [])],
        updated_at: new Date().toISOString()
      }).eq('id', session.id);
    } else {
      await supabase.from('interview_sessions').insert({
        intake_id: intakeId,
        session_id: sessionId,
        messages: newMessages,
        updated_fields: updatedFieldsData,
        missing_fields_before: analysis?.missing_information || [],
        missing_fields_after: result.new_missing_fields || analysis?.missing_information || [],
        validated_assumptions: result.validated_assumptions || [],
        status: 'active'
      });
    }

    if (result.updated_fields && Object.keys(result.updated_fields).length > 0) {
      await supabase.from('intake_extractions').update(result.updated_fields).eq('id', intakeId);
    }

    await supabase.from('ai_runs').update({
      status: 'success',
      output_json: aiResponse.data,
      token_usage: aiResponse.tokenUsage
    }).eq('id', aiRunId);

    return new Response(
      JSON.stringify({
        success: true,
        result: {
          ...result,
          messages: newMessages
        }
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
