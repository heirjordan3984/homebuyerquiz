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
  { auth: { autoRefreshToken: false, persistSession: false } },
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const method = req.method;

    if (method === "GET") {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: pwRow } = await supabaseAdmin
        .from("integration_config")
        .select("value")
        .eq("key", "user_passwords")
        .maybeSingle();
      const pwMap = (pwRow?.value as Record<string, string> | null) ?? {};
      const users = data.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        password: pwMap[u.id] ?? "",
      }));
      return new Response(JSON.stringify({ users }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let body: Record<string, unknown> = {};
    if (method !== "DELETE") {
      body = await req.json();
    }

    if (method === "POST") {
      const { email, password } = body as { email?: string; password?: string };
      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email and password are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
      });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const userId = data.user.id;
      // Link the new user to the default Wildfire Local client account
      await supabaseAdmin
        .from("client_members")
        .upsert({ user_id: userId, client_account_id: "1c5d9e55-4b6e-4f4c-8e0f-1a9dc8f7b211" }, { onConflict: "user_id" });
      // Persist password so it can be shown later in the admin panel
      const { data: pwRow } = await supabaseAdmin
        .from("integration_config")
        .select("value")
        .eq("key", "user_passwords")
        .maybeSingle();
      const pwMap = (pwRow?.value as Record<string, string> | null) ?? {};
      pwMap[userId] = password;
      await supabaseAdmin
        .from("integration_config")
        .upsert({ key: "user_passwords", value: pwMap, updated_at: new Date().toISOString() }, { onConflict: "key" });
      return new Response(JSON.stringify({ user: { id: userId, email: data.user.email, created_at: data.user.created_at } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (method === "PUT") {
      const { userId, email, password } = body as { userId?: string; email?: string; password?: string };
      if (!userId) {
        return new Response(JSON.stringify({ error: "User ID is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const attrs: { email?: string; password?: string } = {};
      if (email) attrs.email = email.trim();
      if (password) attrs.password = password;
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, attrs);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      // Sync stored password if it was changed
      if (password) {
        const { data: pwRow } = await supabaseAdmin
          .from("integration_config")
          .select("value")
          .eq("key", "user_passwords")
          .maybeSingle();
        const pwMap = (pwRow?.value as Record<string, string> | null) ?? {};
        pwMap[userId] = password;
        await supabaseAdmin
          .from("integration_config")
          .upsert({ key: "user_passwords", value: pwMap, updated_at: new Date().toISOString() }, { onConflict: "key" });
      }
      return new Response(JSON.stringify({ user: { id: data.user.id, email: data.user.email, created_at: data.user.created_at } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (method === "DELETE") {
      const userId = url.searchParams.get("userId");
      if (!userId) {
        return new Response(JSON.stringify({ error: "User ID is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      // Remove client membership before deleting the auth user
      await supabaseAdmin.from("client_members").delete().eq("user_id", userId);
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      // Remove stored password for deleted user
      const { data: pwRow } = await supabaseAdmin
        .from("integration_config")
        .select("value")
        .eq("key", "user_passwords")
        .maybeSingle();
      const pwMap = (pwRow?.value as Record<string, string> | null) ?? {};
      if (pwMap[userId]) {
        delete pwMap[userId];
        await supabaseAdmin
          .from("integration_config")
          .upsert({ key: "user_passwords", value: pwMap, updated_at: new Date().toISOString() }, { onConflict: "key" });
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[manage-users] error:", error);
    return new Response(JSON.stringify({ error: "Unable to manage users" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
