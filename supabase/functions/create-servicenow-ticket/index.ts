import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TicketRequest {
  intakeId: string;
  workflowId: string;
  category: 'network' | 'wms_config' | 'security' | 'integration';
  short_description: string;
  description: string;
  priority: 'P1' | 'P2' | 'P3';
  assignment_group?: string;
  providerType?: 'mock' | 'real';
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

    const {
      intakeId,
      workflowId,
      category,
      short_description,
      description,
      priority,
      assignment_group,
      providerType = 'mock'
    }: TicketRequest = await req.json();

    if (!intakeId || !workflowId || !category || !short_description || !description) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const automationRunId = crypto.randomUUID();

    const requestPayload = {
      category,
      short_description,
      description,
      priority,
      assignment_group: assignment_group || getDefaultAssignmentGroup(category),
      urgency: mapPriorityToUrgency(priority),
      impact: mapPriorityToImpact(priority)
    };

    await supabase.from('automation_runs').insert({
      id: automationRunId,
      intake_id: intakeId,
      workflow_id: workflowId,
      run_type: 'servicenow_ticket',
      provider: providerType,
      status: 'executing',
      request_payload_json: requestPayload
    });

    let ticketResponse;

    if (providerType === 'mock') {
      ticketResponse = await createMockTicket(requestPayload);
    } else {
      const serviceNowUrl = Deno.env.get('SERVICENOW_INSTANCE_URL');
      const serviceNowUser = Deno.env.get('SERVICENOW_USERNAME');
      const serviceNowPass = Deno.env.get('SERVICENOW_PASSWORD');

      if (!serviceNowUrl || !serviceNowUser || !serviceNowPass) {
        ticketResponse = {
          error: "ServiceNow credentials not configured, falling back to mock",
          ...await createMockTicket(requestPayload)
        };
      } else {
        try {
          ticketResponse = await createRealTicket(
            serviceNowUrl,
            serviceNowUser,
            serviceNowPass,
            requestPayload
          );
        } catch (error) {
          ticketResponse = {
            error: error instanceof Error ? error.message : "ServiceNow API call failed",
            fallback: await createMockTicket(requestPayload)
          };
        }
      }
    }

    await supabase.from('automation_runs').update({
      status: ticketResponse.error ? 'failed' : 'completed',
      response_payload_json: ticketResponse,
      error_message: ticketResponse.error || null,
      updated_at: new Date().toISOString()
    }).eq('id', automationRunId);

    return new Response(
      JSON.stringify({
        success: !ticketResponse.error,
        automationRunId,
        ticket: ticketResponse
      }),
      {
        status: ticketResponse.error ? 500 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error creating ServiceNow ticket:", error);
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

function getDefaultAssignmentGroup(category: string): string {
  const groups: Record<string, string> = {
    network: 'Network Operations',
    wms_config: 'WMS Configuration Team',
    security: 'Information Security',
    integration: 'EDI Integration Team'
  };
  return groups[category] || 'General Support';
}

function mapPriorityToUrgency(priority: string): string {
  const mapping: Record<string, string> = {
    P1: '1 - Critical',
    P2: '2 - High',
    P3: '3 - Medium'
  };
  return mapping[priority] || '3 - Medium';
}

function mapPriorityToImpact(priority: string): string {
  const mapping: Record<string, string> = {
    P1: '1 - High',
    P2: '2 - Medium',
    P3: '3 - Low'
  };
  return mapping[priority] || '3 - Low';
}

async function createMockTicket(payload: any) {
  const ticketNumber = `INC${Math.floor(Math.random() * 9000000) + 1000000}`;
  const sysId = crypto.randomUUID();

  return {
    ticket_number: ticketNumber,
    ticket_sys_id: sysId,
    status: 'New',
    state: '1',
    url: `https://demo.service-now.com/nav_to.do?uri=incident.do?sys_id=${sysId}`,
    created_at: new Date().toISOString(),
    short_description: payload.short_description,
    assignment_group: payload.assignment_group,
    priority: payload.priority,
    category: payload.category,
    provider: 'mock'
  };
}

async function createRealTicket(
  instanceUrl: string,
  username: string,
  password: string,
  payload: any
) {
  const auth = btoa(`${username}:${password}`);

  const response = await fetch(`${instanceUrl}/api/now/table/incident`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      short_description: payload.short_description,
      description: payload.description,
      category: payload.category,
      priority: payload.priority,
      urgency: payload.urgency,
      impact: payload.impact,
      assignment_group: payload.assignment_group
    })
  });

  if (!response.ok) {
    throw new Error(`ServiceNow API returned ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const result = data.result;

  return {
    ticket_number: result.number,
    ticket_sys_id: result.sys_id,
    status: result.state,
    url: `${instanceUrl}/nav_to.do?uri=incident.do?sys_id=${result.sys_id}`,
    created_at: result.sys_created_on,
    provider: 'servicenow_real'
  };
}
