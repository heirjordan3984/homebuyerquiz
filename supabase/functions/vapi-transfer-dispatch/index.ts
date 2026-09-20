import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractToolCall(payload: any) {
  const msg = payload?.message;
  const list = msg?.toolCallList ?? msg?.toolCalls ?? [];
  const first = Array.isArray(list) && list.length ? list[0] : msg?.toolCall;
  if (!first) return { toolCallId: "", args: {} as Record<string, unknown> };
  let args: any = first?.function?.arguments ?? {};
  if (typeof args === "string") {
    try { args = JSON.parse(args); } catch { args = {}; }
  }
  return { toolCallId: first.id ?? "", args: args ?? {} };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }

  const { toolCallId, args } = extractToolCall(body);
  const region = typeof args.region === "string" ? args.region.trim() : "";
  const callId: string = body?.message?.call?.id ?? body?.call?.id ?? "";

  const buildResult = (result: unknown) => ({
    results: [{ toolCallId, result }],
  });

  try {
    const { data: client, error } = await supabase.rpc("pick_next_partner_client", {
      p_region: region || null,
    });
    if (error) throw error;

    const row = Array.isArray(client) ? client[0] : client;
    if (!row?.forwarding_number) {
      return json(buildResult({
        error: "No partner clients available to receive the call.",
      }));
    }

    await supabase.from("partner_call_assignments").insert({
      partner_client_id: row.id,
      call_id: callId,
      region,
      reason: region && row.region !== region ? "fallback" : "round_robin",
    });

    return json(buildResult({
      destination: {
        type: "number",
        number: row.forwarding_number,
        message: `Connecting you with ${row.name || "a local real estate professional"} now.`,
      },
    }));
  } catch (err) {
    return json({
      results: [{
        toolCallId,
        result: { error: (err as Error).message || "dispatch failed" },
      }],
    }, 500);
  }
});
