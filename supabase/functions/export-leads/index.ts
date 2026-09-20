import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface QuizAnswer {
  id: number;
  topic?: string;
  question?: string;
  type?: string;
  selected_option_index?: number | null;
  selected_option_text?: string | null;
  text_answer?: string | null;
}

interface LeadRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  property_address: string;
  property_lat: number | null;
  property_lng: number | null;
  quiz_answers: QuizAnswer[] | null;
  created_at: string;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(rows: LeadRow[], format: "json" | "csv"): string {
  if (format === "json") return JSON.stringify(rows, null, 2);

  const questionIds = new Set<number>();
  for (const row of rows) {
    if (Array.isArray(row.quiz_answers)) {
      for (const ans of row.quiz_answers) questionIds.add(ans.id);
    }
  }
  const sortedIds = Array.from(questionIds).sort((a, b) => a - b);

  const baseHeaders = [
    "id",
    "created_at",
    "name",
    "email",
    "phone",
    "property_address",
    "property_lat",
    "property_lng",
  ];
  const questionHeaders: string[] = [];
  const questionTopicById = new Map<number, string>();
  for (const id of sortedIds) {
    for (const row of rows) {
      const ans = row.quiz_answers?.find((q) => q.id === id);
      if (ans?.topic) {
        questionTopicById.set(id, ans.topic);
        break;
      }
    }
    const topic = questionTopicById.get(id) ?? `Q${id}`;
    questionHeaders.push(`Q${id} - ${topic}`);
  }

  const headers = [...baseHeaders, ...questionHeaders];
  const lines = [headers.map(csvEscape).join(",")];

  for (const row of rows) {
    const cells: string[] = [
      csvEscape(row.id),
      csvEscape(row.created_at),
      csvEscape(row.name),
      csvEscape(row.email),
      csvEscape(row.phone),
      csvEscape(row.property_address),
      csvEscape(row.property_lat),
      csvEscape(row.property_lng),
    ];
    for (const id of sortedIds) {
      const ans = row.quiz_answers?.find((q) => q.id === id);
      let value = "";
      if (ans) {
        if (ans.type === "text") {
          value = ans.text_answer ?? "";
        } else if (ans.selected_option_text != null) {
          value = ans.selected_option_text;
        } else if (ans.selected_option_index != null) {
          value = String(ans.selected_option_index);
        }
      }
      cells.push(csvEscape(value));
    }
    lines.push(cells.join(","));
  }

  return lines.join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") === "json" ? "json" : "csv") as
      | "json"
      | "csv";

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("lead_submissions")
      .select(
        "id, name, email, phone, property_address, property_lat, property_lng, quiz_answers, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = (data ?? []) as LeadRow[];
    const body = buildCsv(rows, format);

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const filename = `lead_submissions_${stamp}.${format}`;
    const contentType =
      format === "json" ? "application/json" : "text/csv; charset=utf-8";

    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
