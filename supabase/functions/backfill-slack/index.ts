import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EXCLUDED_EMAILS = new Set([
  "alex@maximumfloats.com",
  "nathan@wildfirelocal.net",
]);

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const SLACK_TOKEN = Deno.env.get("SLACK_BOT_TOKEN")!;
const SLACK_CHANNEL = Deno.env.get("SLACK_CHANNEL_ID")!;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, " ");
}

function fmtCurrency(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "Unknown";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function fmtScheduled(iso: string, timezone: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone || "UTC",
      timeZoneName: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

async function lookupValueFromCache(address: string): Promise<number | null> {
  if (!address) return null;
  const key = normalizeAddress(address);
  const { data: cached } = await supabase
    .from("batchdata_lookups")
    .select("response, fetched_at")
    .eq("address", key)
    .maybeSingle();
  if (!cached) return null;
  const fresh = Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (!fresh) return null;
  const v = (cached.response as { property?: { valuation?: { estimatedValue?: number } } })
    ?.property?.valuation?.estimatedValue;
  return typeof v === "number" ? v : null;
}

async function postSlack(text: string) {
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ channel: SLACK_CHANNEL, text, mrkdwn: true }),
  });
  const j = await res.json().catch(() => ({}));
  return { ok: !!j.ok, error: j.error };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
    const kind = url.searchParams.get("kind") ?? "leads";

    const results: Array<Record<string, unknown>> = [];

    if (kind === "leads") {
      const { data: leads, error } = await supabase
        .from("lead_submissions")
        .select("name, email, phone, property_address, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;

      const filtered = (leads ?? []).filter(
        (l) => !EXCLUDED_EMAILS.has((l.email ?? "").toLowerCase()),
      );
      const slice = filtered.slice(offset, offset + limit);

      for (const lead of slice) {
        const value = await lookupValueFromCache(lead.property_address ?? "");
        const text = [
          "*New lead submitted* _(backfill)_",
          `*Name:* ${lead.name || "—"}`,
          `*Email:* ${lead.email || "—"}`,
          `*Phone:* ${lead.phone || "—"}`,
          `*Address:* ${lead.property_address || "—"}`,
          `*Property value:* ${fmtCurrency(value)}`,
          `*Submitted:* ${new Date(lead.created_at).toISOString()}`,
        ].join("\n");
        const r = await postSlack(text);
        results.push({ email: lead.email, ...r });
        await sleep(1100);
      }

      return new Response(
        JSON.stringify({
          kind,
          totalFiltered: filtered.length,
          processed: slice.length,
          offset,
          nextOffset: offset + slice.length,
          results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (kind === "bookings") {
      const { data: bookings, error } = await supabase
        .from("advisor_bookings")
        .select("name, email, call_type, scheduled_at, timezone, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;

      const filtered = (bookings ?? []).filter(
        (b) => !EXCLUDED_EMAILS.has((b.email ?? "").toLowerCase()),
      );
      const slice = filtered.slice(offset, offset + limit);

      for (const b of slice) {
        const callLabel = b.call_type === "zoom" ? "Zoom call" : "Phone call";
        const text = [
          "*New advisor call booked* _(backfill)_",
          `*Name:* ${b.name || "—"}`,
          `*Call type:* ${callLabel}`,
          `*Scheduled for:* ${fmtScheduled(b.scheduled_at, b.timezone ?? "UTC")}`,
        ].join("\n");
        const r = await postSlack(text);
        results.push({ email: b.email, ...r });
        await sleep(1100);
      }

      return new Response(
        JSON.stringify({
          kind,
          totalFiltered: filtered.length,
          processed: slice.length,
          offset,
          nextOffset: offset + slice.length,
          results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "kind must be 'leads' or 'bookings'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[backfill-slack] error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
