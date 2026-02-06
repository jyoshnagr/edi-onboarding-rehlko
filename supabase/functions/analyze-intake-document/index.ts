import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callOpenAIWithGuardrails, createSystemPrompt } from "../_shared/openai-helper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DocumentInput {
  text: string;
  fileName: string;
  category?: string;
}

interface AnalysisRequest {
  documentText: string;
  fileName: string;
  attachments?: DocumentInput[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { documentText, fileName, attachments = [] }: AnalysisRequest = await req.json();

    if (!documentText || !fileName) {
      return new Response(
        JSON.stringify({ error: "Document text and file name are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Truncate document if too large (max ~15000 chars to stay well under token limit)
    const maxChars = 15000;
    const truncatedText = documentText.length > maxChars
      ? documentText.substring(0, maxChars) + "\n\n[Document truncated for analysis]"
      : documentText;

    // Process attachments and combine with main document
    let combinedDocumentText = `MAIN INTAKE DOCUMENT (${fileName}):\n${truncatedText}`;

    if (attachments.length > 0) {
      combinedDocumentText += "\n\n" + "=".repeat(80) + "\n";
      combinedDocumentText += "SUPPORTING DOCUMENTS:\n" + "=".repeat(80) + "\n\n";

      for (const attachment of attachments) {
        const categoryLabel = attachment.category
          ? ` [${attachment.category.replace(/_/g, ' ').toUpperCase()}]`
          : '';
        combinedDocumentText += `\nDOCUMENT: ${attachment.fileName}${categoryLabel}\n`;
        combinedDocumentText += "-".repeat(80) + "\n";

        // Truncate each attachment if needed
        const attachmentMaxChars = 5000;
        const attachmentText = attachment.text.length > attachmentMaxChars
          ? attachment.text.substring(0, attachmentMaxChars) + "\n[Attachment truncated]"
          : attachment.text;

        combinedDocumentText += attachmentText + "\n\n";
      }
    }

    const systemPrompt = createSystemPrompt(`You are an EDI onboarding specialist. Analyze intake documents and extract ALL available information.

CRITICAL REQUIREMENTS:

1. READINESS SCORE: Calculate 0-100 based on:
   - Information completeness (40%): All required fields present
   - Technical clarity (30%): Protocol, format, transactions defined
   - Contact quality (20%): Complete contact info with email/phone
   - Experience level (10%): EDI experience documented
   MUST return a realistic score, NOT 0. Typical range: 30-85.

2. LOCATIONS: Extract ALL location mentions - addresses, city names, facility names, warehouse names, site IDs, distribution centers. If you find ANY location reference, include it. If NO locations mentioned, use ["Main facility - location TBD"]. NEVER return empty array.

3. INFORMATION NEEDS: MANDATORY - Generate AT LEAST 5 items (can be more). Use constructive, supportive language that focuses on partnership:

   REQUIRED LANGUAGE PATTERN - Always check for these and phrase supportively:
   - If no contacts: "Contact details needed" with description "Contact information will help us coordinate effectively"
   - If no protocol: "Protocol specification needed" with description "Technical protocol details will help us set up the connection properly"
   - If no data format: "Data format details needed" with description "Defining data formats and transaction types helps us configure everything correctly"
   - If new to EDI: "New to EDI" with description "We'll provide extra support and training throughout the onboarding process"
   - If no tech requirements: "Technical requirements to be defined" with description "Working together to document technical requirements prevents misunderstandings"
   - If multiple locations: "Multiple location coordination opportunity" with description "Coordinating across locations together ensures consistency"

   Impact statements should be POSITIVE and focus on what we'll accomplish together, NOT on what will go wrong.

4. RECOMMENDATIONS: MANDATORY - Generate AT LEAST 7 recommendations (can be more). Use collaborative language:

   REQUIRED RECOMMENDATIONS (use these exact collaborative phrases):
   1. "Gather contact information" - "Work together to gather complete contact information for seamless communication"
   2. "Define technical protocols together" - "Collaborate to clarify EDI protocols and data formats for successful integration"
   3. "Schedule kickoff meeting" - "Organize a collaborative meeting to align on goals, timeline, and expectations"
   4. "Develop testing strategy together" - "Partner on a comprehensive testing plan to ensure successful EDI transactions"
   5. "Document requirements collaboratively" - "Work together to document all technical and business requirements for clarity"
   6. "Set up communication channels" - "Establish regular communication for updates and collaborative problem-solving"
   7. "Plan phased rollout together" - "Develop a phased approach to manage complexity and ensure smooth implementation"

5. TIMELINE: MAXIMUM 6 weeks. Choose based on complexity:
   - Low complexity: 2-4 weeks
   - Medium complexity: 3-5 weeks
   - High complexity: 4-6 weeks

LANGUAGE RULES:
- NEVER use: "missing", "lack of", "inability", "cannot", "delays", "errors", "risks", "failures"
- ALWAYS use: "needed", "to be defined", "will enable", "working together", "partnership", "collaboration", "support"
- Frame everything as opportunities to work together, not problems

Extract real data from the document. Calculate meaningful readiness scores.`, true);

    // Calculate default go-live date (4-6 weeks from today)
    const today = new Date();
    const defaultGoLiveDate = new Date(today);
    defaultGoLiveDate.setDate(today.getDate() + 35); // 5 weeks from today
    const defaultGoLiveDateStr = defaultGoLiveDate.toISOString().split('T')[0];

    const userPrompt = {
      role: 'user' as const,
      content: `Analyze this EDI onboarding intake submission. The main intake form is provided along with ${attachments.length} supporting document(s). Consider ALL documents together for a comprehensive analysis.

${combinedDocumentText}

IMPORTANT RULES:
- If no go-live date is found in the document, use: ${defaultGoLiveDateStr} (5 weeks from today)
- Timeline MUST be maximum 6 weeks: use "2-4 weeks", "3-5 weeks", or "4-6 weeks" based on complexity
- Extract ALL location mentions from the document

Return JSON:
{
  "company_name": "actual company name from document",
  "customer_contacts": [{"name": "full name", "title": "job title", "email": "email@domain.com", "phone": "phone number"}],
  "go_live_date": "YYYY-MM-DD (use ${defaultGoLiveDateStr} if not found in document)",
  "edi_experience": "detailed experience description",
  "data_format": "specific format (X12, EDIFACT, etc)",
  "transactions": ["specific transaction codes like 850-PO, 810-Invoice"],
  "locations": ["specific location names/addresses found - extract ALL mentions"],
  "protocol": "specific protocol (AS2, SFTP, etc)",
  "unique_requirements": "detailed special requirements",
  "readiness_score": number 0-100,
  "complexity_level": "low|medium|high",
  "identified_risks": [
    {
      "type": "high|medium|low",
      "title": "INFORMATION NEED TITLE (from the 5+ required information needs above)",
      "description": "supportive description explaining what we need to gather together",
      "impact": "POSITIVE next steps statement about how this helps us succeed together"
    }
  ],
  "missing_information": ["specific missing fields"],
  "recommendations": [
    {
      "priority": "critical|high|medium|low",
      "title": "specific action title",
      "description": "detailed actionable recommendation"
    }
  ],
  "estimated_timeline": "2-4 weeks" | "3-5 weeks" | "4-6 weeks"
}`
    };

    const result = await callOpenAIWithGuardrails({
      messages: [systemPrompt, userPrompt],
      temperature: 0.3,
      maxTokens: 3000,
      enforceJSON: true,
    });

    if (!result.success || !result.data) {
      return new Response(
        JSON.stringify({
          error: result.error || "Failed to analyze document",
          details: "OpenAI analysis failed"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: result.data,
        tokenUsage: result.tokenUsage
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error analyzing document:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Failed to process request"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
