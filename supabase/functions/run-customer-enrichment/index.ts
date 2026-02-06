import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EnrichmentRequest {
  intakeId: string;
  providerType?: 'salesforce_mock' | 'salesforce_real' | 'wra_mock' | 'wra_real';
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

    const { intakeId, providerType = 'salesforce_mock' }: EnrichmentRequest = await req.json();

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

    if (!intake) {
      return new Response(
        JSON.stringify({ error: "Intake not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const enrichmentId = crypto.randomUUID();

    const inputContext = {
      company_name: intake.company_name,
      protocol: intake.protocol,
      data_format: intake.data_format,
      locations: intake.locations
    };

    await supabase.from('customer_enrichment').insert({
      id: enrichmentId,
      intake_id: intakeId,
      provider_type: providerType,
      status: 'running',
      input_context_json: inputContext
    });

    let enrichmentData;
    let mergedUpdates;

    if (providerType.includes('mock')) {
      enrichmentData = generateMockEnrichment(intake);
      mergedUpdates = generateMergedUpdates(intake, enrichmentData);
    } else {
      enrichmentData = { error: "Real provider integration not yet implemented" };
      mergedUpdates = {};
    }

    await supabase.from('customer_enrichment').update({
      status: 'completed',
      output_json: enrichmentData,
      merged_updates_json: mergedUpdates,
      updated_at: new Date().toISOString()
    }).eq('id', enrichmentId);

    return new Response(
      JSON.stringify({
        success: true,
        enrichmentId,
        data: enrichmentData,
        suggestedUpdates: mergedUpdates
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in customer enrichment:", error);
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

function generateMockEnrichment(intake: any) {
  const companyName = intake.company_name || "Unknown Company";

  return {
    account_summary: {
      account_name: companyName,
      parent_account: `${companyName} Corporation`,
      industry: "Food & Beverage Distribution",
      region: "North America",
      account_type: "Strategic Partner",
      annual_revenue: "$50M - $100M",
      employee_count: "500-1000"
    },
    edi_maturity: {
      level: "Intermediate",
      notes: "Currently using EDI with 3 other trading partners. Familiar with X12 850/810 transactions.",
      existing_integrations: [
        { partner: "Sysco", protocol: "AS2", transactions: ["850", "810", "856"] },
        { partner: "US Foods", protocol: "SFTP", transactions: ["850", "810"] },
        { partner: "Gordon Food Service", protocol: "AS2", transactions: ["850", "810", "856", "997"] }
      ],
      known_pain_points: [
        "Manual intervention required for UOM mismatches",
        "Frequent item master data sync issues",
        "Certificate renewal process is error-prone"
      ]
    },
    contact_hierarchy: {
      primary_contact: {
        name: intake.customer_contacts?.[0]?.name || "John Mitchell",
        title: "IT Director",
        email: intake.customer_contacts?.[0]?.email || "john.mitchell@example.com",
        phone: intake.customer_contacts?.[0]?.phone || "+1 (555) 123-4567"
      },
      escalation_path: [
        { name: "Sarah Chen", title: "VP of Operations", email: "sarah.chen@example.com" },
        { name: "Robert Williams", title: "CTO", email: "robert.williams@example.com" }
      ],
      technical_sme: {
        name: "David Kumar",
        title: "EDI Specialist",
        email: "david.kumar@example.com",
        phone: "+1 (555) 123-4568"
      }
    },
    wra_attributes: {
      warehouse_count: intake.locations?.length || 2,
      primary_wms: "Manhattan WMS",
      integration_complexity: "Medium",
      special_handling: ["Temperature-controlled storage", "Lot tracking required"],
      business_hours: "24/7 operations",
      peak_season: "Q4 (October - December)"
    },
    contractual_details: {
      go_live_target: intake.go_live_date,
      priority_level: "High",
      sla_requirements: "99.5% uptime",
      support_tier: "Premium",
      penalties_for_delay: "Yes - contractual obligations",
      success_criteria: [
        "Zero data loss during cutover",
        "< 2% transaction error rate",
        "All locations live within timeline"
      ]
    },
    recommended_actions: [
      "Schedule technical deep-dive with David Kumar (EDI Specialist)",
      "Request item master data file for validation",
      "Align on UOM mapping strategy early (known pain point)",
      "Plan certificate exchange 2 weeks before go-live",
      "Set up bi-weekly status calls with Sarah Chen (escalation contact)"
    ]
  };
}

function generateMergedUpdates(intake: any, enrichment: any) {
  const updates: any = {};

  if (!intake.customer_contacts || intake.customer_contacts.length === 0) {
    updates.customer_contacts = [
      enrichment.contact_hierarchy.primary_contact,
      enrichment.contact_hierarchy.technical_sme
    ];
  }

  if (enrichment.edi_maturity.existing_integrations.length > 0 && !intake.edi_experience) {
    updates.edi_experience = `Intermediate - Active EDI with ${enrichment.edi_maturity.existing_integrations.length} partners. Known experience: ${enrichment.edi_maturity.notes}`;
  }

  if (!intake.unique_requirements || intake.unique_requirements === '') {
    updates.unique_requirements = enrichment.wra_attributes.special_handling.join(', ') + '. ' +
      enrichment.contractual_details.success_criteria.join('; ');
  }

  return {
    has_updates: Object.keys(updates).length > 0,
    fields_to_update: updates,
    review_required: true,
    confidence_score: 85
  };
}
