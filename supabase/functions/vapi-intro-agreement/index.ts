import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function logRequest(
  supabase: SupabaseClient | null,
  row: {
    status_code: number;
    raw_body: string;
    parsed_email: string;
    parsed_date_time: string | null;
    error: string | null;
    user_agent: string;
  },
) {
  if (!supabase) return;
  try {
    await supabase.from("vapi_intro_agreement_logs").insert(row);
  } catch {
    // swallow logging failures
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabase =
    supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;
  const userAgent = req.headers.get("user-agent") ?? "";

  if (req.method !== "POST") {
    await logRequest(supabase, {
      status_code: 405,
      raw_body: "",
      parsed_email: "",
      parsed_date_time: null,
      error: `method ${req.method} not allowed`,
      user_agent: userAgent,
    });
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  const rawBody = await req.text();

  let body: Record<string, unknown> = {};
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    await logRequest(supabase, {
      status_code: 400,
      raw_body: rawBody,
      parsed_email: "",
      parsed_date_time: null,
      error: "invalid JSON body",
      user_agent: userAgent,
    });
    return jsonResponse({ error: "invalid JSON body" }, 400);
  }

  function extractArgs(payload: any): { seller_email: string; date_time: string } {
    let seller_email = "";
    let date_time = "";

    const pick = (args: any) => {
      if (!args) return;
      let parsed: any = args;
      if (typeof args === "string") {
        try {
          parsed = JSON.parse(args);
        } catch {
          parsed = {};
        }
      }
      if (parsed && typeof parsed === "object") {
        if (!seller_email && typeof parsed.seller_email === "string") {
          seller_email = parsed.seller_email.trim();
        }
        if (!date_time && typeof parsed.date_time === "string") {
          date_time = parsed.date_time.trim();
        }
      }
    };

    if (payload && typeof payload === "object") {
      pick(payload);
      const msg = payload.message;
      if (msg && typeof msg === "object") {
        const lists = [msg.toolCalls, msg.toolCallList].filter(Array.isArray);
        for (const list of lists) {
          for (const tc of list) {
            pick(tc?.function?.arguments);
            if (seller_email && date_time) break;
          }
          if (seller_email && date_time) break;
        }
        if (!seller_email || !date_time) {
          pick(msg.toolCall?.function?.arguments);
        }
      }
    }

    return { seller_email, date_time };
  }

  const extracted = extractArgs(body);
  const seller_email = extracted.seller_email;
  const rawDate = extracted.date_time;

  if (!seller_email) {
    await logRequest(supabase, {
      status_code: 400,
      raw_body: rawBody,
      parsed_email: "",
      parsed_date_time: null,
      error: "seller_email is required",
      user_agent: userAgent,
    });
    return jsonResponse({ error: "seller_email is required" }, 400);
  }

  if (!rawDate) {
    await logRequest(supabase, {
      status_code: 400,
      raw_body: rawBody,
      parsed_email: seller_email,
      parsed_date_time: null,
      error: "date_time is required",
      user_agent: userAgent,
    });
    return jsonResponse({ error: "date_time is required" }, 400);
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    await logRequest(supabase, {
      status_code: 400,
      raw_body: rawBody,
      parsed_email: seller_email,
      parsed_date_time: null,
      error: "date_time must be an ISO date string",
      user_agent: userAgent,
    });
    return jsonResponse({ error: "date_time must be an ISO date string" }, 400);
  }

  if (!supabase) {
    return jsonResponse({ error: "server misconfigured" }, 500);
  }

  const isoDate = parsed.toISOString();

  const { data, error } = await supabase
    .from("advisor_intro_agreements")
    .insert({ seller_email, date_time: isoDate })
    .select()
    .maybeSingle();

  if (error) {
    await logRequest(supabase, {
      status_code: 500,
      raw_body: rawBody,
      parsed_email: seller_email,
      parsed_date_time: isoDate,
      error: error.message,
      user_agent: userAgent,
    });
    return jsonResponse({ error: error.message }, 500);
  }

  await logRequest(supabase, {
    status_code: 200,
    raw_body: rawBody,
    parsed_email: seller_email,
    parsed_date_time: isoDate,
    error: null,
    user_agent: userAgent,
  });

  return jsonResponse({ ok: true, agreement: data });
});
