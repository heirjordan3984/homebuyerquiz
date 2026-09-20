import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");

    if (!lat || !lng) {
      return new Response(JSON.stringify({ error: "lat and lng required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("VITE_GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const center = `${lat},${lng}`;
    const parts = [
      `center=${encodeURIComponent(center)}`,
      `zoom=16`,
      `size=600x280`,
      `scale=2`,
      `maptype=roadmap`,
      `markers=color:0xC9A84C|${encodeURIComponent(center)}`,
      `style=feature:poi|visibility:off`,
      `style=feature:transit|visibility:off`,
      `key=${apiKey}`,
    ];
    const mapsUrl = `https://maps.googleapis.com/maps/api/staticmap?${parts.join("&")}`;

    const response = await fetch(mapsUrl);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Maps API error" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageBuffer = await response.arrayBuffer();
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
