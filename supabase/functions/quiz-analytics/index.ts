import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

interface SessionRow {
  id: string;
  session_token: string;
  current_step: number;
  step_type: string;
  step_label: string;
  questions_answered: number;
  total_questions: number;
  completed: boolean;
  lead_email: string | null;
  created_at: string;
  updated_at: string;
}

const TOTAL_QUESTIONS = 18;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const startDate = url.searchParams.get("start");
    const endDate = url.searchParams.get("end");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let leadsQuery = supabase
      .from("lead_submissions")
      .select(
        "id, name, email, phone, property_address, property_lat, property_lng, quiz_answers, created_at"
      )
      .order("created_at", { ascending: false });

    let sessionsQuery = supabase
      .from("quiz_sessions")
      .select(
        "id, session_token, current_step, step_type, step_label, questions_answered, total_questions, completed, lead_email, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (startDate) {
      leadsQuery = leadsQuery.gte("created_at", startDate);
      sessionsQuery = sessionsQuery.gte("created_at", startDate);
    }
    if (endDate) {
      leadsQuery = leadsQuery.lt("created_at", endDate);
      sessionsQuery = sessionsQuery.lt("created_at", endDate);
    }

    const [leadsResult, sessionsResult] = await Promise.all([
      leadsQuery,
      sessionsQuery,
    ]);

    if (leadsResult.error) {
      return new Response(JSON.stringify({ error: leadsResult.error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (sessionsResult.error) {
      return new Response(JSON.stringify({ error: sessionsResult.error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const leads = (leadsResult.data ?? []) as LeadRow[];
    const sessions = (sessionsResult.data ?? []) as SessionRow[];

    const recordedCompletions = sessions.filter((s) => s.completed).length;
    const completedSessions = Math.max(recordedCompletions, leads.length);
    const totalSessions = Math.max(sessions.length, completedSessions);
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    const dropOffMap = new Map<string, { count: number; step: number; label: string }>();
    for (const s of sessions) {
      if (s.completed) continue;
      const key = `${s.current_step}`;
      const existing = dropOffMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        dropOffMap.set(key, { count: 1, step: s.current_step, label: s.step_label });
      }
    }
    const dropOffs = Array.from(dropOffMap.values()).sort((a, b) => b.count - a.count);

    const submittedAnswerCounts = leads
      .map((lead) => Array.isArray(lead.quiz_answers) ? lead.quiz_answers.length : 0)
      .filter((count) => count > 0);
    const avgQuestionsAnswered =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.questions_answered, 0) / sessions.length
        : submittedAnswerCounts.length > 0
          ? submittedAnswerCounts.reduce((sum, count) => sum + count, 0) / submittedAnswerCounts.length
          : totalSessions > 0 ? TOTAL_QUESTIONS : 0;

    const answerDistribution = new Map<
      number,
      { questionId: number; topic: string; question: string; options: Map<string, number> }
    >();

    for (const lead of leads) {
      if (!Array.isArray(lead.quiz_answers)) continue;
      for (const ans of lead.quiz_answers) {
        const value =
          ans.type === "text"
            ? ans.text_answer ?? "(no answer)"
            : ans.selected_option_text ??
              (ans.selected_option_index != null ? `Option ${ans.selected_option_index}` : "(no answer)");

        let entry = answerDistribution.get(ans.id);
        if (!entry) {
          entry = {
            questionId: ans.id,
            topic: ans.topic ?? "",
            question: ans.question ?? "",
            options: new Map(),
          };
          answerDistribution.set(ans.id, entry);
        }
        const currentCount = entry.options.get(value) ?? 0;
        entry.options.set(value, currentCount + 1);
      }
    }

    const answerStats = Array.from(answerDistribution.values())
      .map((entry) => ({
        questionId: entry.questionId,
        topic: entry.topic,
        question: entry.question,
        options: Array.from(entry.options.entries())
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => a.questionId - b.questionId);

    const dailyTrend = new Map<string, { date: string; starts: number; completions: number }>();

    function mstDate(iso: string): string {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Denver",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(new Date(iso));
      const year = parts.find((part) => part.type === "year")?.value;
      const month = parts.find((part) => part.type === "month")?.value;
      const day = parts.find((part) => part.type === "day")?.value;
      return `${year}-${month}-${day}`;
    }

    for (const s of sessions) {
      const day = mstDate(s.created_at);
      let entry = dailyTrend.get(day);
      if (!entry) {
        entry = { date: day, starts: 0, completions: 0 };
        dailyTrend.set(day, entry);
      }
      entry.starts++;
      if (s.completed) entry.completions++;
    }
    for (const lead of leads) {
      const day = mstDate(lead.created_at);
      let entry = dailyTrend.get(day);
      if (!entry) {
        entry = { date: day, starts: 0, completions: 0 };
        dailyTrend.set(day, entry);
      }
      entry.completions = Math.max(entry.completions, 1);
    }
    const trend = Array.from(dailyTrend.values()).sort((a, b) => a.date.localeCompare(b.date));

    return new Response(
      JSON.stringify({
        leads,
        sessions,
        stats: {
          totalLeads: leads.length,
          totalSessions,
          completedSessions,
          completionRate,
          avgQuestionsAnswered,
          dropOffs,
          answerStats,
          dailyTrend: trend,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
