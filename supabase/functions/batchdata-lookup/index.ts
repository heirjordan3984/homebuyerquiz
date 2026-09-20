import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BATCHDATA_API_KEY = "yNnOoC4dqoioSjwI7V1cpvCFhyAUGJnxhCMCH38w";
const BATCHDATA_URL = "https://api.batchdata.com/api/v1/property/search";

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function normalize(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, " ");
}

async function callBatchData(address: string) {
  const requestBody = {
    searchCriteria: { query: address },
    options: { skip: 0, take: 1 },
  };

  const res = await fetch(BATCHDATA_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${BATCHDATA_API_KEY}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const rawText = await res.text().catch(() => "");
  const responseHeaders: Record<string, string> = {};
  res.headers.forEach((v, k) => { responseHeaders[k] = v; });

  let parsed: unknown = null;
  try { parsed = rawText ? JSON.parse(rawText) : null; } catch { parsed = null; }

  if (!res.ok) {
    console.error(
      `BatchData ${res.status} for "${address}"\n` +
      `URL: ${BATCHDATA_URL}\n` +
      `Request body: ${JSON.stringify(requestBody)}\n` +
      `Response headers: ${JSON.stringify(responseHeaders)}\n` +
      `Response body: ${rawText}`
    );
    return {
      error: `BatchData returned ${res.status}`,
      status: res.status,
      upstreamBody: parsed ?? rawText,
      upstreamHeaders: responseHeaders,
      requestSent: { url: BATCHDATA_URL, body: requestBody },
    };
  }

  return parsed;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { address } = await req.json();

    if (!address || typeof address !== "string") {
      return new Response(
        JSON.stringify({ error: "address required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cacheKey = normalize(address);

    const { data: cached } = await supabase
      .from("batchdata_lookups")
      .select("response, fetched_at")
      .eq("address", cacheKey)
      .maybeSingle();

    if (cached && cached.response && Object.keys(cached.response).length > 0) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < CACHE_TTL_MS) {
        return new Response(
          JSON.stringify({ ...cached.response, _cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const raw = await callBatchData(address);

    if (raw && typeof raw === "object" && "error" in raw) {
      const r = raw as Record<string, unknown>;
      return new Response(
        JSON.stringify({
          error: r.error,
          status: r.status ?? 502,
          upstreamBody: r.upstreamBody ?? null,
          upstreamHeaders: r.upstreamHeaders ?? null,
          requestSent: r.requestSent ?? null,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawObj = (raw && typeof raw === "object") ? raw as Record<string, any> : {};
    const property = rawObj?.results?.properties?.[0] ?? null;

    const payload = {
      property,
      meta: rawObj?.status ?? null,
      resultCount: rawObj?.results?.properties?.length ?? 0,
    };

    await supabase
      .from("batchdata_lookups")
      .upsert({
        address: cacheKey,
        response: payload,
        fetched_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({ ...payload, _cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("batchdata-lookup error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
