import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RENTCAST_API_KEY = "27e236d0dc82428c978dc53489001768";
const RENTCAST_BASE = "https://api.rentcast.io/v1";
const MARKET_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: {
      "X-Api-Key": RENTCAST_API_KEY,
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`RentCast ${res.status} for: ${url} — ${body}`);
    return null;
  }
  return res.json();
}

function extractZip(address: string): string | null {
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : null;
}

function buildMarketSummary(marketData: unknown) {
  if (!marketData || typeof marketData !== 'object') return null;
  const raw = marketData as Record<string, unknown>;
  const saleData = (raw.saleData ?? raw) as Record<string, unknown> | undefined;
  if (!saleData || typeof saleData !== 'object') return null;

  const historyRaw = (saleData.history ?? {}) as Record<string, Record<string, unknown>>;
  const historyEntries = Object.entries(historyRaw)
    .map(([key, v]) => ({
      key,
      date: (v.date as string | undefined) ?? `${key}-01`,
      newListings: typeof v.newListings === 'number' ? v.newListings : null,
      totalListings: typeof v.totalListings === 'number' ? v.totalListings : null,
      averageDaysOnMarket: typeof v.averageDaysOnMarket === 'number' ? v.averageDaysOnMarket : null,
      medianDaysOnMarket: typeof v.medianDaysOnMarket === 'number' ? v.medianDaysOnMarket : null,
      medianPrice: typeof v.medianPrice === 'number' ? v.medianPrice : null,
      averagePrice: typeof v.averagePrice === 'number' ? v.averagePrice : null,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  return {
    averageSalePrice: typeof saleData.averagePrice === 'number' ? saleData.averagePrice : null,
    medianSalePrice: typeof saleData.medianPrice === 'number' ? saleData.medianPrice : null,
    averageDaysOnMarket: typeof saleData.averageDaysOnMarket === 'number' ? saleData.averageDaysOnMarket : null,
    medianDaysOnMarket: typeof saleData.medianDaysOnMarket === 'number' ? saleData.medianDaysOnMarket : null,
    averagePricePerSquareFoot: typeof saleData.averagePricePerSquareFoot === 'number' ? saleData.averagePricePerSquareFoot : null,
    newListings: typeof saleData.newListings === 'number' ? saleData.newListings : null,
    totalListings: typeof saleData.totalListings === 'number' ? saleData.totalListings : null,
    lastUpdatedDate: typeof saleData.lastUpdatedDate === 'string' ? saleData.lastUpdatedDate : null,
    history: historyEntries,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { address, lat, lng } = await req.json();

    if (!address) {
      return new Response(JSON.stringify({ error: "address required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encodedAddress = encodeURIComponent(address);
    const zip = extractZip(address);
    const hasCoords = lat && lng;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // --- Market data (with Supabase cache, 24h TTL) ---
    let marketRaw: unknown = null;
    let marketFromCache = false;

    if (zip) {
      const { data: cached } = await supabase
        .from("market_stats_cache")
        .select("payload, fetched_at")
        .eq("zip", zip)
        .maybeSingle();

      if (cached && cached.fetched_at) {
        const age = Date.now() - new Date(cached.fetched_at).getTime();
        if (age < MARKET_CACHE_TTL_MS) {
          marketRaw = cached.payload;
          marketFromCache = true;
        }
      }

      if (!marketRaw) {
        const fresh = await fetchJson(
          `${RENTCAST_BASE}/markets?zipCode=${zip}&dataType=Sale&historyRange=12`
        );
        if (fresh) {
          marketRaw = fresh;
          await supabase
            .from("market_stats_cache")
            .upsert({ zip, payload: fresh, fetched_at: new Date().toISOString() });
        }
      }
    }

    const avmUrl = `${RENTCAST_BASE}/avm/value?address=${encodedAddress}&compCount=5`;
    const [avmData, listingsData] = await Promise.all([
      fetchJson(avmUrl),
      hasCoords
        ? fetchJson(`${RENTCAST_BASE}/listings/sale?latitude=${lat}&longitude=${lng}&radius=2&limit=5&status=Active`)
        : fetchJson(`${RENTCAST_BASE}/listings/sale?address=${encodedAddress}&radius=2&limit=5&status=Active`),
    ]);

    const comparables = avmData?.comparables ?? null;
    const avmCore = avmData
      ? {
          price: avmData.price,
          priceRangeLow: avmData.priceRangeLow,
          priceRangeHigh: avmData.priceRangeHigh,
          latitude: avmData.latitude,
          longitude: avmData.longitude,
        }
      : null;

    const market = buildMarketSummary(marketRaw);

    return new Response(
      JSON.stringify({
        avm: avmCore,
        comparables,
        nearbyListings: Array.isArray(listingsData) ? listingsData : null,
        market,
        _debug: {
          zip,
          hasCoords,
          avmOk: !!avmData,
          listingsOk: !!listingsData,
          marketOk: !!marketRaw,
          marketFromCache,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
