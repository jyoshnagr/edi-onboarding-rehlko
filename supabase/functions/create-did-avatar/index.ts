import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DID_API_KEY = Deno.env.get('DID_API_KEY');
const DID_API_URL = 'https://api.d-id.com';

interface CreateStreamRequest {
  source_url: string;
}

interface TalkRequest {
  script: {
    type: string;
    input: string;
    provider?: {
      type: string;
      voice_id: string;
    };
  };
  config?: {
    stitch?: boolean;
    fluent?: boolean;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'create-stream') {
      const response = await fetch(`${DID_API_URL}/talks/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_url: 'https://images.pexels.com/photos/3756681/pexels-photo-3756681.jpeg',
        }),
      });

      const data = await response.json();

      return new Response(
        JSON.stringify(data),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (action === 'talk') {
      const { sessionId, text, streamId } = await req.json();

      const response = await fetch(
        `${DID_API_URL}/talks/streams/${streamId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${DID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            script: {
              type: 'text',
              input: text,
              provider: {
                type: 'microsoft',
                voice_id: 'en-US-JennyNeural',
              },
            },
            config: {
              stitch: true,
              fluent: true,
            },
            session_id: sessionId,
          }),
        }
      );

      const data = await response.json();

      return new Response(
        JSON.stringify(data),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (action === 'ice') {
      const { sessionId, candidate, sdpMLineIndex, sdpMid, streamId } = await req.json();

      const response = await fetch(
        `${DID_API_URL}/talks/streams/${streamId}/ice`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${DID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidate,
            sdpMLineIndex,
            sdpMid,
            session_id: sessionId,
          }),
        }
      );

      const data = await response.json();

      return new Response(
        JSON.stringify(data),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (action === 'sdp') {
      const { sessionId, answer, streamId } = await req.json();

      const response = await fetch(
        `${DID_API_URL}/talks/streams/${streamId}/sdp`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${DID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            answer,
            session_id: sessionId,
          }),
        }
      );

      const data = await response.json();

      return new Response(
        JSON.stringify(data),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (action === 'delete-stream') {
      const { sessionId, streamId } = await req.json();

      const response = await fetch(
        `${DID_API_URL}/talks/streams/${streamId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${DID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
          }),
        }
      );

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
