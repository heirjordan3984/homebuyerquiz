import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DELAY_MS = 0;

interface QuizAnswer {
  id: number;
  topic: string;
  question: string;
  type?: string;
  selected_option_index?: number | null;
  selected_option_text?: string | null;
  text_answer?: string | null;
}

interface SchedulePayload {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  state?: string | null;
  quizAnswers?: QuizAnswer[];
  leadSubmissionId?: string | null;
}

function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (raw.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

function formatQuizAnswers(quiz: QuizAnswer[] | undefined): string {
  if (!quiz || quiz.length === 0) return "";
  return quiz
    .map((q) => {
      const answer = q.text_answer ?? q.selected_option_text ?? "(no answer)";
      return `- ${q.topic}: ${answer}`;
    })
    .join("\n");
}

function summarizeBatchData(property: Record<string, unknown> | null): string {
  if (!property) return "";
  const p = property as any;
  const lines: string[] = [];
  const b = p.building ?? {};
  const v = p.valuation ?? {};
  const o = p.owner ?? {};
  const lastSale = p.sale?.lastSale ?? {};
  const ql = p.quickLists ?? {};

  if (b.bedroomCount || b.bathroomCount || b.totalBuildingAreaSquareFeet) {
    lines.push(
      `Building: ${b.bedroomCount ?? "?"} bd / ${b.bathroomCount ?? "?"} ba, ${b.totalBuildingAreaSquareFeet ?? "?"} sqft, built ${b.yearBuilt ?? "?"}, type ${b.propertyType ?? "?"}`,
    );
  }
  if (v.estimatedValue) {
    lines.push(
      `Valuation: ~$${v.estimatedValue} (range $${v.priceRangeMin ?? "?"}-$${v.priceRangeMax ?? "?"}), equity ${v.equityPercent ?? "?"}%, LTV ${v.ltv ?? "?"}`,
    );
  }
  if (o.fullName) {
    lines.push(
      `Owner: ${o.fullName}${o.ownershipLength ? ` (owned ${o.ownershipLength} yrs)` : ""}${o.isAbsenteeOwner ? " [absentee]" : ""}${o.isCorporateOwner ? " [corporate]" : ""}`,
    );
  }
  if (lastSale.salePrice || lastSale.saleDate) {
    lines.push(`Last sale: $${lastSale.salePrice ?? "?"} on ${lastSale.saleDate ?? "?"}`);
  }
  const flags = Object.entries(ql)
    .filter(([, val]) => val === true)
    .map(([k]) => k);
  if (flags.length) lines.push(`Flags: ${flags.join(", ")}`);

  return lines.join("\n");
}

function summarizeMarketStats(payload: Record<string, unknown> | null): string {
  if (!payload) return "";
  const p = payload as any;
  const sale = p?.saleData ?? p;
  const parts: string[] = [];
  if (sale?.averagePrice) parts.push(`avg price $${Math.round(sale.averagePrice)}`);
  if (sale?.medianPrice) parts.push(`median price $${Math.round(sale.medianPrice)}`);
  if (sale?.averageDaysOnMarket) parts.push(`avg DOM ${Math.round(sale.averageDaysOnMarket)}`);
  if (sale?.totalListings) parts.push(`${sale.totalListings} listings`);
  if (sale?.averagePricePerSquareFoot) parts.push(`$${Math.round(sale.averagePricePerSquareFoot)}/sqft`);
  return parts.join(", ");
}

function summarizeRentcast(data: Record<string, unknown> | null): string {
  if (!data) return "";
  const d = data as any;
  const lines: string[] = [];
  const avm = d.avm;
  if (avm?.price) {
    lines.push(
      `AVM: ~$${Math.round(avm.price)} (range $${avm.priceRangeLow ? Math.round(avm.priceRangeLow) : "?"}-$${avm.priceRangeHigh ? Math.round(avm.priceRangeHigh) : "?"})`,
    );
  }
  const comps = Array.isArray(d.comparables) ? d.comparables : [];
  if (comps.length) {
    const prices = comps
      .map((c: any) => c?.price)
      .filter((n: unknown): n is number => typeof n === "number");
    if (prices.length) {
      const avg = Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);
      lines.push(`${comps.length} comps, avg sold $${avg}`);
    } else {
      lines.push(`${comps.length} comps available`);
    }
  }
  const nearby = Array.isArray(d.nearbyListings) ? d.nearbyListings : [];
  if (nearby.length) lines.push(`${nearby.length} active nearby listings`);
  return lines.join("\n");
}

async function placeVapiCall(params: {
  attemptId: string;
  payload: SchedulePayload;
  phone: string;
  supabaseAdmin: ReturnType<typeof createClient>;
}) {
  const { attemptId, payload, phone, supabaseAdmin } = params;
  const apiKey = Deno.env.get("VAPI_API_KEY");
  const assistantId = Deno.env.get("VAPI_ASSISTANT_ID");
  const phoneNumberId = Deno.env.get("VAPI_PHONE_NUMBER_ID");

  if (!apiKey || !assistantId || !phoneNumberId) {
    const missing = [
      !apiKey && "VAPI_API_KEY",
      !assistantId && "VAPI_ASSISTANT_ID",
      !phoneNumberId && "VAPI_PHONE_NUMBER_ID",
    ].filter(Boolean).join(", ");
    await supabaseAdmin.from("vapi_call_attempts").update({
      status: "failed",
      error: `Missing env vars: ${missing}`,
      updated_at: new Date().toISOString(),
    }).eq("id", attemptId);
    return;
  }

  const name = payload.name ?? "";
  const email = payload.email ?? "";
  const address = payload.address ?? "";
  const lat = payload.lat ?? null;
  const lng = payload.lng ?? null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const fnHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${serviceKey}`,
    Apikey: serviceKey,
  };

  let batchProperty: Record<string, unknown> | null = null;
  if (address) {
    try {
      const normalized = address.trim().toLowerCase().replace(/\s+/g, " ");
      const { data: cached } = await supabaseAdmin
        .from("batchdata_lookups")
        .select("response")
        .eq("address", normalized)
        .maybeSingle();
      const cachedResp = (cached as any)?.response;
      if (cachedResp?.property) {
        batchProperty = cachedResp.property;
      } else {
        const res = await fetch(`${supabaseUrl}/functions/v1/batchdata-lookup`, {
          method: "POST",
          headers: fnHeaders,
          body: JSON.stringify({ address }),
        });
        if (res.ok) {
          const data = await res.json();
          batchProperty = data?.property ?? null;
        }
      }
    } catch (e) {
      console.error("[vapi] batchdata fetch error:", e);
    }
  }

  let rentcastData: Record<string, unknown> | null = null;
  if (address) {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/rentcast-lookup`, {
        method: "POST",
        headers: fnHeaders,
        body: JSON.stringify({ address, lat, lng }),
      });
      if (res.ok) {
        rentcastData = await res.json();
      }
    } catch (e) {
      console.error("[vapi] rentcast fetch error:", e);
    }
  }

  const state = payload.state ?? null;
  let marketPayload: Record<string, unknown> | null = null;
  if (state) {
    const { data } = await supabaseAdmin
      .from("market_stats_cache")
      .select("payload")
      .eq("state", state)
      .maybeSingle();
    marketPayload = ((data as any)?.payload ?? null) as Record<string, unknown> | null;
  }

  const propertyValue =
    (batchProperty as any)?.valuation?.estimatedValue ??
    (rentcastData as any)?.avm?.price ??
    null;

  const screenStateContext = `Completed 19-question home-buying quiz and submitted contact info on the gate screen. Results screen displayed estimated property value of ${propertyValue !== null ? `${propertyValue}` : "(unknown)"}.`;

  const quizAnswersFormatted = formatQuizAnswers(payload.quizAnswers);
  const timelineAnswer =
    payload.quizAnswers?.find((q) => q.topic === "Timeline")?.selected_option_text ?? "";

  const variableValues: Record<string, string> = {
    name,
    phone,
    email,
    property_address: address,
    property_lat: lat !== null ? String(lat) : "",
    property_lng: lng !== null ? String(lng) : "",
    quiz_answers: quizAnswersFormatted,
    batchdata_lookups: summarizeBatchData(batchProperty),
    rentcast_lookup: summarizeRentcast(rentcastData),
    market_stats: summarizeMarketStats(marketPayload),
    propertyValue: propertyValue !== null ? `$${propertyValue}` : "",
    screen_state_context: screenStateContext,
    timeline_to_move: timelineAnswer,
  };

  const body = {
    assistantId,
    phoneNumberId,
    customer: {
      number: phone,
      name: name || undefined,
    },
    assistantOverrides: {
      variableValues,
    },
  };

  try {
    const res = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      await supabaseAdmin.from("vapi_call_attempts").update({
        status: "failed",
        error: `VAPI HTTP ${res.status}: ${JSON.stringify(data).slice(0, 1000)}`,
        updated_at: new Date().toISOString(),
      }).eq("id", attemptId);
      return;
    }
    await supabaseAdmin.from("vapi_call_attempts").update({
      status: "placed",
      vapi_call_id: data?.id ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", attemptId);
  } catch (err) {
    await supabaseAdmin.from("vapi_call_attempts").update({
      status: "failed",
      error: `fetch error: ${err instanceof Error ? err.message : String(err)}`,
      updated_at: new Date().toISOString(),
    }).eq("id", attemptId);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as SchedulePayload;
    const phone = normalizePhone(payload.phone ?? "");
    if (!phone) {
      return new Response(
        JSON.stringify({ error: "phone required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const scheduledFor = new Date(Date.now() + DELAY_MS).toISOString();

    const { data: attempt, error: insertErr } = await supabaseAdmin
      .from("vapi_call_attempts")
      .insert({
        lead_submission_id: payload.leadSubmissionId ?? null,
        name: payload.name ?? "",
        phone,
        email: payload.email ?? "",
        address: payload.address ?? "",
        scheduled_for: scheduledFor,
        status: "pending",
      })
      .select("id")
      .maybeSingle();

    if (insertErr || !attempt) {
      return new Response(
        JSON.stringify({ error: insertErr?.message ?? "insert failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const attemptId = attempt.id as string;

    EdgeRuntime.waitUntil((async () => {
      await new Promise((r) => setTimeout(r, DELAY_MS));
      await placeVapiCall({
        attemptId,
        payload,
        phone,
        supabaseAdmin,
      });
    })());

    return new Response(
      JSON.stringify({ ok: true, attemptId, scheduledFor }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
