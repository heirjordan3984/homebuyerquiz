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
  const raw = (Array.isArray(marketData) ? marketData[0] : marketData) as Record<string, unknown> | undefined;
  if (!raw || typeof raw !== 'object') return null;
  const saleDataRaw = raw.saleData ?? raw.data ?? raw;
  const saleData = (Array.isArray(saleDataRaw) ? saleDataRaw[0] : saleDataRaw) as Record<string, unknown> | undefined;
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
    const { address, lat, lng, priceMin, priceMax } = await req.json();

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
    // Try zip-based cache first, then lat/lng-based fetch
    let marketRaw: unknown = null;
    let marketFromCache = false;
    const cacheKey = zip ?? (hasCoords ? `${lat.toFixed(2)},${lng.toFixed(2)}` : null);

    if (cacheKey) {
      const { data: cached } = await supabase
        .from("market_stats_cache")
        .select("payload, fetched_at")
        .eq("zip", cacheKey)
        .maybeSingle();

      if (cached && cached.fetched_at) {
        const age = Date.now() - new Date(cached.fetched_at).getTime();
        if (age < MARKET_CACHE_TTL_MS) {
          marketRaw = cached.payload;
          marketFromCache = true;
        }
      }

      if (!marketRaw) {
        const marketUrl = zip
          ? `${RENTCAST_BASE}/markets?zipCode=${zip}&dataType=Sale&historyRange=12`
          : hasCoords
            ? `${RENTCAST_BASE}/markets?latitude=${lat}&longitude=${lng}&dataType=Sale&historyRange=12`
            : null;

        if (marketUrl) {
          const fresh = await fetchJson(marketUrl);
          if (fresh) {
            marketRaw = fresh;
            await supabase
              .from("market_stats_cache")
              .upsert({ zip: cacheKey, payload: fresh, fetched_at: new Date().toISOString() });
          }
        }
      }
    }

    // --- Nearby active listings (city-level, not property-specific) ---
    // Fetch more listings than we need so we can filter by the buyer's budget
    const listingLimit = 25;
    let listingsData: unknown = null;
    if (hasCoords) {
      listingsData = await fetchJson(
        `${RENTCAST_BASE}/listings/sale?latitude=${lat}&longitude=${lng}&radius=5&limit=${listingLimit}&status=Active`
      );
    } else {
      listingsData = await fetchJson(
        `${RENTCAST_BASE}/listings/sale?address=${encodedAddress}&radius=5&limit=${listingLimit}&status=Active`
      );
    }

    // Filter listings by the buyer's budget range; if too few match, return closest-to-range
    let filteredListings: unknown[] = [];
    if (Array.isArray(listingsData)) {
      const all = listingsData as Array<Record<string, unknown>>;
      const inRange = all.filter((l) => {
        const p = typeof l.price === 'number' ? l.price : null;
        if (p == null) return false;
        if (priceMin != null && p < priceMin) return false;
        if (priceMax != null && p > priceMax) return false;
        return true;
      });

      if (inRange.length >= 3) {
        filteredListings = inRange.slice(0, 5);
      } else {
        // Not enough in-range — sort by closeness to the range midpoint
        const mid = priceMin != null && priceMax != null
          ? (priceMin + priceMax) / 2
          : priceMin ?? priceMax ?? null;
        if (mid != null) {
          filteredListings = all
            .filter((l) => typeof l.price === 'number')
            .sort((a, b) => Math.abs((a.price as number) - mid) - Math.abs((b.price as number) - mid))
            .slice(0, 5);
        } else {
          filteredListings = all.slice(0, 5);
        }
      }
    }

    const market = buildMarketSummary(marketRaw);
    const listingValues = Array.isArray(filteredListings)
      ? filteredListings
          .map((listing) => (listing as Record<string, unknown>).price)
          .filter((price): price is number => typeof price === 'number')
      : [];
    const fallbackAveragePrice = listingValues.length > 0
      ? Math.round(listingValues.reduce((sum, price) => sum + price, 0) / listingValues.length)
      : null;
    const resolvedMarket = market ?? (fallbackAveragePrice
      ? { averageSalePrice: fallbackAveragePrice, medianSalePrice: fallbackAveragePrice, history: [] }
      : null);

    return new Response(
      JSON.stringify({
        avm: null,
        comparables: null,
        nearbyListings: filteredListings.length > 0 ? filteredListings : null,
        market: resolvedMarket,
        _debug: {
          zip: cacheKey,
          hasCoords,
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
