/**
 * Shared OpenAI helper with guardrails
 * Handles all OpenAI API calls with JSON validation and retry logic
 */

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAICallOptions {
  messages: OpenAIMessage[];
  temperature?: number;
  maxTokens?: number;
  enforceJSON?: boolean;
}

interface OpenAIResponse {
  success: boolean;
  data?: any;
  error?: string;
  tokenUsage?: number;
}

export async function callOpenAIWithGuardrails(
  options: OpenAICallOptions
): Promise<OpenAIResponse> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');

  if (!apiKey) {
    return {
      success: false,
      error: 'OpenAI API key not configured'
    };
  }

  const {
    messages,
    temperature = 0.7,
    maxTokens = 2000,
    enforceJSON = true
  } = options;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: enforceJSON ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error?.message || 'OpenAI API request failed'
      };
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    const tokenUsage = result.usage?.total_tokens || 0;

    if (!content) {
      return {
        success: false,
        error: 'No response content from OpenAI'
      };
    }

    if (enforceJSON) {
      try {
        const parsedData = JSON.parse(content);
        return {
          success: true,
          data: parsedData,
          tokenUsage
        };
      } catch (parseError) {
        // Retry with repair prompt
        const repairMessages: OpenAIMessage[] = [
          ...messages,
          { role: 'assistant', content },
          {
            role: 'user',
            content: 'The previous response was not valid JSON. Please fix it and return only valid JSON with no additional text.'
          }
        ];

        const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: repairMessages,
            temperature: 0.3,
            max_tokens: maxTokens,
            response_format: { type: 'json_object' },
          }),
        });

        if (!retryResponse.ok) {
          return {
            success: false,
            error: 'JSON validation failed and retry unsuccessful'
          };
        }

        const retryResult = await retryResponse.json();
        const retryContent = retryResult.choices?.[0]?.message?.content;
        const retryTokenUsage = (result.usage?.total_tokens || 0) + (retryResult.usage?.total_tokens || 0);

        try {
          const parsedData = JSON.parse(retryContent);
          return {
            success: true,
            data: parsedData,
            tokenUsage: retryTokenUsage
          };
        } catch (secondError) {
          return {
            success: false,
            error: 'Failed to parse JSON after retry'
          };
        }
      }
    }

    return {
      success: true,
      data: content,
      tokenUsage
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error calling OpenAI'
    };
  }
}

export function createSystemPrompt(content: string, enforceJSON: boolean = true): OpenAIMessage {
  const jsonInstruction = enforceJSON
    ? '\n\nIMPORTANT: You must return ONLY valid JSON. Do not include any text before or after the JSON object.'
    : '';

  return {
    role: 'system',
    content: content + jsonInstruction
  };
}
