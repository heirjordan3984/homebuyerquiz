import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type QuizAnswer = {
  id: number;
  question?: string;
  selected_option_text?: string | null;
  text_answer?: string | null;
};

type LeadPayload = {
  name: string;
  email: string;
  phone: string;
  address: string;
  propertyValue?: number | null;
  quizAnswers?: QuizAnswer[];
};

async function getConfig(key: string): Promise<unknown> {
  try {
    const { data, error } = await supabaseAdmin
      .from("integration_config")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return null;
    return data.value;
  } catch {
    return null;
  }
}

async function getEmailRecipients(): Promise<string[]> {
  const recipients = await getConfig("email_recipients");
  if (Array.isArray(recipients) && recipients.length > 0) {
    return recipients.filter((r: unknown) => typeof r === "string" && r.includes("@"));
  }
  return ["jordan@wildfirelocal.net"];
}

async function getBusinessName(): Promise<string> {
  const name = await getConfig("business_name");
  if (typeof name === "string" && name) return name;
  return "HomeIQ";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function display(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function buildEmailHtml(data: LeadPayload, businessName: string): string {
  const contactRows = [
    ["Name", display(data.name)],
    ["Phone", display(data.phone)],
    ["Email", display(data.email)],
  ];
  const detailRows = [
    ["Property address", display(data.address)],
    ["Estimated property value", formatCurrency(data.propertyValue)],
    ...(data.quizAnswers ?? []).map((answer) => [`Q${answer.id} · ${display(answer.question)}`, display(answer.selected_option_text ?? answer.text_answer)]),
  ];
  const rows = [...contactRows, ...detailRows].map(([label, value]) => `<tr><td style="padding:10px 12px;border-bottom:1px solid #e7e1d8;color:#697586;font-size:13px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:10px 12px;border-bottom:1px solid #e7e1d8;color:#17202a;font-size:14px;vertical-align:top">${escapeHtml(value)}</td></tr>`).join("");
  return `<div style="font-family:Arial,sans-serif;max-width:680px;color:#17202a"><h1 style="font-size:24px;margin:0 0 8px">New Mortgage Lead Generated</h1><p style="color:#697586;margin:0 0 20px">A new ${escapeHtml(businessName)} form submission has been received.</p><table style="width:100%;border-collapse:collapse;background:#faf9f6">${rows}</table></div>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Email credentials not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = (await req.json()) as LeadPayload;
    if (!data.name || !data.email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const recipients = await getEmailRecipients();
    const businessName = await getBusinessName();
    const from = `${businessName} <leads@updates.wildfirelocal.net>`;
    const subject = `New Mortgage Lead: ${data.name}`;
    const html = buildEmailHtml(data, businessName);

    const results = await Promise.all(
      recipients.map(async (recipient) => {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from, to: [recipient], subject, html }),
          });
          if (!response.ok) {
            const detail = await response.text();
            console.error(`[resend-notify] Resend API error for ${recipient}:`, detail);
            return { recipient, ok: false, detail };
          }
          return { recipient, ok: true };
        } catch (err) {
          console.error(`[resend-notify] send error for ${recipient}:`, err);
          return { recipient, ok: false, detail: String(err) };
        }
      })
    );

    const succeeded = results.filter((r) => r.ok);
    const failed = results.filter((r) => !r.ok);

    if (succeeded.length === 0) {
      return new Response(JSON.stringify({ error: "Email provider rejected all recipients", failed }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, sent: succeeded.length, failed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[resend-notify] error:", error);
    return new Response(JSON.stringify({ error: "Unable to send notification" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
