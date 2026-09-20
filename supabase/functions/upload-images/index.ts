import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const formData = await req.formData();
    const results: { name: string; url: string; skipped?: boolean }[] = [];

    const { data: existing } = await supabase
      .from("grid_images")
      .select("filename");

    const existingFilenames = new Set((existing ?? []).map((r: { filename: string }) => r.filename));

    const { data: countRow } = await supabase
      .from("grid_images")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextOrder = countRow ? countRow.sort_order + 1 : 1;

    for (const [, value] of formData.entries()) {
      if (!(value instanceof File)) continue;
      const file = value as File;

      if (existingFilenames.has(file.name)) {
        results.push({ name: file.name, url: "", skipped: true });
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const { error: storageError } = await supabase.storage
        .from("homeowner-images")
        .upload(file.name, uint8Array, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });

      if (storageError && storageError.message !== "The resource already exists") {
        return new Response(JSON.stringify({ error: storageError.message, file: file.name }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: urlData } = supabase.storage
        .from("homeowner-images")
        .getPublicUrl(file.name);

      const publicUrl = urlData.publicUrl;

      const { error: dbError } = await supabase
        .from("grid_images")
        .insert({ url: publicUrl, filename: file.name, sort_order: nextOrder });

      if (dbError && !dbError.message.includes("duplicate")) {
        return new Response(JSON.stringify({ error: dbError.message, file: file.name }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!dbError) {
        nextOrder++;
        results.push({ name: file.name, url: publicUrl });
      } else {
        results.push({ name: file.name, url: publicUrl, skipped: true });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
