import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, " ");
}

async function fetchBatchValue(address: string): Promise<number | null> {
  const key = normalizeAddress(address);

  const { data: cached } = await supabaseAdmin
    .from("batchdata_lookups")
    .select("response, fetched_at")
    .eq("address", key)
    .maybeSingle();

  const fresh =
    cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;

  if (fresh) {
    const v = (cached.response as { property?: { valuation?: { estimatedValue?: number } } })
      ?.property?.valuation?.estimatedValue;
    if (typeof v === "number") return v;
    return null;
  }

  try {
    const res = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/batchdata-lookup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ address }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const v = data?.property?.valuation?.estimatedValue;
    return typeof v === "number" ? v : null;
  } catch (err) {
    console.error("[slack-notify] batchdata lookup failed:", err);
    return null;
  }
}

async function fetchRentcastValue(address: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/rentcast-lookup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ address }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const v = data?.avm?.price;
    return typeof v === "number" ? v : null;
  } catch (err) {
    console.error("[slack-notify] rentcast lookup failed:", err);
    return null;
  }
}

async function lookupPropertyValue(address: string): Promise<number | null> {
  if (!address) return null;
  const batchValue = await fetchBatchValue(address);
  if (batchValue != null) return batchValue;
  return await fetchRentcastValue(address);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type LeadPayload = {
  type: "lead";
  data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    propertyValue?: number | null;
  };
};

type BookingPayload = {
  type: "booking";
  data: {
    name: string;
    callType: "phone" | "zoom";
    scheduledAt: string;
    timezone: string;
  };
};

type Payload = LeadPayload | BookingPayload;

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
    const tz = timezone || "UTC";
    const formatted = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
      timeZoneName: "short",
    }).format(d);
    return formatted;
  } catch {
    return iso;
  }
}

function buildLeadMessage(d: LeadPayload["data"]) {
  const lines = [
    "*New lead submitted*",
    `*Name:* ${d.name || "—"}`,
    `*Email:* ${d.email || "—"}`,
    `*Phone:* ${d.phone || "—"}`,
    `*Address:* ${d.address || "—"}`,
    `*Property value:* ${fmtCurrency(d.propertyValue)}`,
  ];
  return lines.join("\n");
}

function buildBookingMessage(d: BookingPayload["data"]) {
  const callLabel = d.callType === "zoom" ? "Zoom call" : "Phone call";
  const lines = [
    "*New advisor call booked*",
    `*Name:* ${d.name || "—"}`,
    `*Call type:* ${callLabel}`,
    `*Scheduled for:* ${fmtScheduled(d.scheduledAt, d.timezone)}`,
  ];
  return lines.join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("SLACK_BOT_TOKEN");
    const channel = Deno.env.get("SLACK_CHANNEL_ID");
    if (!token || !channel) {
      return new Response(
        JSON.stringify({ error: "Slack credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = (await req.json()) as Payload;
    let text = "";
    if (payload.type === "lead") {
      const data = { ...payload.data };
      if (data.propertyValue == null) {
        data.propertyValue = await lookupPropertyValue(data.address);
      }
      text = buildLeadMessage(data);
    } else if (payload.type === "booking") {
      text = buildBookingMessage(payload.data);
    } else {
      return new Response(
        JSON.stringify({ error: "Unknown payload type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ channel, text, mrkdwn: true }),
    });

    const slackJson = await slackRes.json();
    if (!slackJson.ok) {
      console.error("[slack-notify] Slack API error:", slackJson);
      return new Response(
        JSON.stringify({ error: "Slack API error", detail: slackJson }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[slack-notify] error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
