import { TrendingUp, MapPin, ExternalLink, Clock, TrendingDown } from 'lucide-react';
import type { QuizResult } from '../utils/quizLogic';
import type { PlaceDetails } from './AddressAutocomplete';
import type { RentcastData } from '../types/rentcast';

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const PEXELS_FALLBACKS = [
  'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
  'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
  'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
  'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
  'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
];

function getPexelsFallback(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) hash = (hash * 31 + address.charCodeAt(i)) >>> 0;
  return PEXELS_FALLBACKS[hash % PEXELS_FALLBACKS.length];
}

function stripUnit(address: string): string {
  return address
    .replace(/,?\s*(unit|apt|apartment|suite|ste|#)\s*[\w-]+/i, '')
    .trim();
}

function streetViewUrl(address: string): string {
  const cleaned = stripUnit(address);
  return `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${encodeURIComponent(cleaned)}&fov=90&pitch=5&return_error_code=true&key=${GMAPS_KEY}`;
}

function mapStaticUrl(address: string): string {
  const cleaned = stripUnit(address);
  return `https://maps.googleapis.com/maps/api/staticmap?size=600x300&zoom=18&maptype=satellite&markers=color:0xC9A84C%7C${encodeURIComponent(cleaned)}&key=${GMAPS_KEY}`;
}

import { useState, useEffect } from 'react';

type PhotoStage = 'streetview' | 'staticmap' | 'pexels';

function PropertyPhoto({ address }: { address: string }) {
  const [stage, setStage] = useState<PhotoStage>('streetview');

  useEffect(() => {
    setStage('streetview');
  }, [address]);

  const src = !GMAPS_KEY || stage === 'pexels'
    ? getPexelsFallback(address)
    : stage === 'streetview'
      ? streetViewUrl(address)
      : mapStaticUrl(address);

  return (
    <div className="w-full h-full relative">
      <img
        src={src}
        alt={address}
        onError={() => {
          if (stage === 'streetview') setStage('staticmap');
          else if (stage === 'staticmap') setStage('pexels');
        }}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

interface Props {
  result: QuizResult;
  placeDetails?: PlaceDetails | null;
  addressText?: string | null;
  rentcastData?: RentcastData | null;
  rentcastLoading?: boolean;
  budgetAnswer?: number | null;
  onNext?: () => void;
  onRetake?: () => void;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  return `$${value.toLocaleString('en-US')}`;
}

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value.toLocaleString()}`;
}

function calcAgentGap(price: number, lowPct = 0.03, highPct = 0.07): [string, string] {
  return [formatCurrencyShort(price * lowPct), formatCurrencyShort(price * highPct)];
}

const BUDGET_RANGES: [number, number | null][] = [
  [0, 250_000],
  [250_000, 450_000],
  [450_000, 700_000],
  [700_000, 1_000_000],
  [1_000_000, null],
];

const BUDGET_LABELS = ['Under $250K', '$250K–$450K', '$450K–$700K', '$700K–$1M', '$1M+'];

export default function ResultsFullAnalysis({ result, placeDetails, addressText, rentcastData, rentcastLoading, budgetAnswer, onNext, onRetake }: Props) {
  void result;
  const nearbyListings = rentcastData?.nearbyListings ?? null;
  const market = rentcastData?.market ?? null;

  const city = (() => {
    const addr = placeDetails?.address ?? addressText ?? '';
    const parts = addr.replace(/, USA$/, '').split(',');
    return parts.length >= 1 ? parts[0].trim() : null;
  })();

  const listingPrices = nearbyListings
    ?.map((listing) => listing.price)
    .filter((price): price is number => typeof price === 'number') ?? [];
  const listingAverage = listingPrices.length > 0
    ? Math.round(listingPrices.reduce((sum, price) => sum + price, 0) / listingPrices.length)
    : null;
  const medianPrice = market?.medianSalePrice ?? market?.averageSalePrice ?? listingAverage;
  const hasMarketData = medianPrice !== null;
  const [gapLow, gapHigh] = hasMarketData ? calcAgentGap(medianPrice!) : ['$15K', '$35K'];

  // Filter listings by budget; if too few in range, get closest to range
  const budgetRange = budgetAnswer != null ? BUDGET_RANGES[budgetAnswer] : null;
  const budgetLabel = budgetAnswer != null ? BUDGET_LABELS[budgetAnswer] : null;

  const topListings = (() => {
    if (!nearbyListings || nearbyListings.length === 0) return [];
    if (!budgetRange) return nearbyListings.slice(0, 3);
    const [min, max] = budgetRange;
    const inRange = nearbyListings.filter((l) => {
      const p = typeof l.price === 'number' ? l.price : null;
      if (p == null) return false;
      if (min != null && p < min) return false;
      if (max != null && p > max) return false;
      return true;
    });
    if (inRange.length >= 3) return inRange.slice(0, 3);
    // Not enough in range — sort by closeness to range midpoint
    const mid = min != null && max != null ? (min + max) / 2 : min ?? max ?? 0;
    return [...nearbyListings]
      .filter((l) => typeof l.price === 'number')
      .sort((a, b) => Math.abs((a.price ?? 0) - mid) - Math.abs((b.price ?? 0) - mid))
      .slice(0, 3);
  })();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="w-full h-1" style={{ backgroundColor: '#C9A84C' }} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8 text-center">
          <span
            className="font-dm font-medium tracking-[0.25em] text-xs uppercase"
            style={{ color: '#C9A84C' }}
          >
            HomeIQ
          </span>
        </div>

        <div className="text-center mb-10">
          <p
            className="font-dm font-medium tracking-[0.12em] uppercase text-xs mb-3"
            style={{ color: '#C9A84C' }}
          >
            Your Buying Situation
          </p>
          <h1
            className="font-playfair leading-tight"
            style={{ fontSize: 'clamp(1.85rem, 6.5vw, 3.25rem)', color: '#1A1A1A' }}
          >
            {city ? `The ${city} Market Is Moving. Here's What We Know About This Market` : `Here's What We Know About This Market`}
          </h1>
        </div>

        {/* Area summary: address + average home value + budget */}
        <div
          className="mb-8 rounded-2xl overflow-hidden"
          style={{ border: '1.5px solid #E8E0C8' }}
        >
          <div className="px-5 py-4" style={{ backgroundColor: '#0D1B2A' }}>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(201,168,76,0.2)' }}
              >
                <MapPin size={15} style={{ color: '#C9A84C' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-dm font-medium tracking-widest uppercase text-white" style={{ fontSize: '11px' }}>
                  Target Area
                </p>
                <p className="font-dm text-sm truncate" style={{ color: '#FFFFFF' }}>
                  {placeDetails?.address ?? addressText ?? city ?? 'Your Area'}
                </p>
              </div>
              {placeDetails?.mapsUrl && (
                <a
                  href={placeDetails.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-dm text-xs font-medium shrink-0 transition-colors duration-150 px-3 py-1.5 rounded-lg"
                  style={{ color: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(201,168,76,0.18)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(201,168,76,0.1)'; }}
                >
                  Maps
                  <ExternalLink size={11} strokeWidth={2} />
                </a>
              )}
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-dm font-medium tracking-widest uppercase text-white" style={{ fontSize: '11px' }}>
                  {market?.medianSalePrice ? 'Median Sale Price' : listingAverage ? 'Avg Active Listing Price' : 'Average Home Value'}
                </p>
                <p
                  className="font-playfair font-bold leading-none mt-1"
                  style={{ fontSize: 'clamp(1.75rem, 6vw, 2.5rem)', color: '#C9A84C', letterSpacing: '-0.02em' }}
                >
                  {hasMarketData ? formatCurrency(medianPrice!) : rentcastLoading ? 'Loading…' : 'Unavailable'}
                </p>
              </div>
              {budgetLabel && (
                <div className="text-right shrink-0">
                  <p className="font-dm font-medium tracking-widest uppercase text-white" style={{ fontSize: '11px' }}>
                    Your Budget
                  </p>
                  <p className="font-dm font-semibold text-sm" style={{ color: '#FFFFFF' }}>
                    {budgetLabel}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {rentcastLoading && !hasMarketData && (placeDetails || addressText) && (
          <div
            className="rounded-2xl overflow-hidden mb-8 animate-pulse"
            style={{ border: '1.5px solid #E8E0C8' }}
          >
            <div className="px-6 py-4 flex items-center gap-3" style={{ backgroundColor: '#0D1B2A' }}>
              <div className="w-9 h-9 rounded-full shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.15)' }} />
              <div className="flex-1">
                <div className="h-2.5 rounded w-32 mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <div className="h-3.5 rounded w-48" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
              </div>
            </div>
            <div className="px-6 py-7 text-center" style={{ backgroundColor: '#F9F7F2' }}>
              <div className="h-12 rounded w-48 mx-auto mb-3" style={{ backgroundColor: '#E8E0C8' }} />
              <div className="h-4 rounded w-36 mx-auto" style={{ backgroundColor: '#EDE8DC' }} />
            </div>
          </div>
        )}

        {hasMarketData && (
          <div
            className="rounded-2xl overflow-hidden mb-8"
            style={{ border: '1.5px solid #E8E0C8' }}
          >
            <div
              className="px-5 py-3 flex items-center gap-2"
              style={{ backgroundColor: '#0D1B2A', borderBottom: '1px solid rgba(201,168,76,0.15)' }}
            >
              <TrendingUp size={12} style={{ color: '#C9A84C' }} />
              <p className="font-dm font-medium tracking-widest uppercase" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                Market Details
              </p>
            </div>

            <div className="px-6 py-5" style={{ backgroundColor: '#F9F7F2' }}>
              <div className="grid grid-cols-2 gap-4 mb-5">
                {market?.averageDaysOnMarket != null && (
                  <div className="text-center">
                    <p className="font-playfair text-lg font-semibold" style={{ color: '#0D1B2A' }}>
                      {Math.round(market.averageDaysOnMarket)}
                    </p>
                    <p className="font-dm text-xs mt-0.5" style={{ color: '#7A7A7A' }}>Avg days on market</p>
                  </div>
                )}
                {market?.totalListings != null && (
                  <div className="text-center">
                    <p className="font-playfair text-lg font-semibold" style={{ color: '#0D1B2A' }}>
                      {market.totalListings.toLocaleString()}
                    </p>
                    <p className="font-dm text-xs mt-0.5" style={{ color: '#7A7A7A' }}>Active listings</p>
                  </div>
                )}
                {market?.newListings != null && (
                  <div className="text-center">
                    <p className="font-playfair text-lg font-semibold" style={{ color: '#0D1B2A' }}>
                      {market.newListings.toLocaleString()}
                    </p>
                    <p className="font-dm text-xs mt-0.5" style={{ color: '#7A7A7A' }}>New listings</p>
                  </div>
                )}
                {market?.averagePricePerSquareFoot != null && (
                  <div className="text-center">
                    <p className="font-playfair text-lg font-semibold" style={{ color: '#0D1B2A' }}>
                      ${Math.round(market.averagePricePerSquareFoot)}
                    </p>
                    <p className="font-dm text-xs mt-0.5" style={{ color: '#7A7A7A' }}>Avg $/sq ft</p>
                  </div>
                )}
              </div>

              <div
                className="rounded-xl px-5 py-4 flex items-start gap-3"
                style={{ backgroundColor: '#FFF8EC', border: '1px solid rgba(201,168,76,0.3)' }}
              >
                <TrendingUp size={15} style={{ color: '#C9A84C', marginTop: '2px', flexShrink: 0 }} />
                <p className="font-dm text-sm leading-relaxed" style={{ color: '#3A3A3A' }}>
                  The spread between a top-performing buyer's agent and an average one in most markets is{' '}
                  <strong style={{ color: '#0D1B2A' }}>3–7%</strong> of final purchase price. In {city ?? 'this market'}, that's{' '}
                  <strong style={{ color: '#C9A84C' }}>{gapLow}–{gapHigh}</strong> in real dollars saved.
                </p>
              </div>
            </div>
          </div>
        )}

        {topListings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={13} style={{ color: '#C9A84C' }} />
              <p className="font-dm font-medium tracking-widest uppercase text-xs" style={{ color: '#C9A84C' }}>
                Active Listings{budgetLabel ? ` in Your Range (${budgetLabel})` : ' Near You'}
              </p>
            </div>

            <div className="space-y-3">
              {topListings.map((listing, i) => (
                <div
                  key={listing.id ?? i}
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
                >
                  <div
                    className="relative w-full overflow-hidden"
                    style={{ height: '140px', backgroundColor: '#E8E4DA' }}
                  >
                    <PropertyPhoto address={listing.formattedAddress} />
                    <div
                      className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full font-dm text-xs font-medium"
                      style={{ backgroundColor: 'rgba(45,106,79,0.85)', color: '#fff', backdropFilter: 'blur(4px)' }}
                    >
                      <TrendingDown size={10} />
                      Active
                    </div>
                    <div
                      className="absolute bottom-0 left-0 right-0 h-12"
                      style={{ background: 'linear-gradient(to top, rgba(13,27,42,0.55), transparent)' }}
                    />
                  </div>
                  <div className="px-4 py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-dm text-sm truncate" style={{ color: '#1A1A1A' }}>
                        {listing.formattedAddress}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {listing.bedrooms != null && (
                          <span className="font-dm text-xs" style={{ color: '#8A8A8A' }}>{listing.bedrooms} bd</span>
                        )}
                        {listing.bathrooms != null && (
                          <span className="font-dm text-xs" style={{ color: '#8A8A8A' }}>{listing.bathrooms} ba</span>
                        )}
                        {listing.squareFootage != null && (
                          <span className="font-dm text-xs" style={{ color: '#8A8A8A' }}>{listing.squareFootage.toLocaleString()} sq ft</span>
                        )}
                        {listing.daysOnMarket != null && (
                          <span className="font-dm text-xs" style={{ color: '#8A8A8A' }}>{listing.daysOnMarket}d on market</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-playfair font-semibold text-base" style={{ color: '#0D1B2A' }}>
                        {formatCurrencyShort(listing.price)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="font-dm text-xs mt-3 text-center" style={{ color: '#A0A0A0' }}>
              These are your options — homes you could be making an offer on right now.
            </p>
          </div>
        )}

        {!hasMarketData && (
          <>
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,168,76,0.3)' }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(201,168,76,0.5)' }} />
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,168,76,0.3)' }} />
            </div>

            <div
              className="rounded-2xl px-6 py-8 sm:p-10 text-center"
              style={{ backgroundColor: '#0D1B2A' }}
            >
              <h2
                className="font-playfair text-white leading-snug mb-4"
                style={{ fontSize: 'clamp(1.15rem, 4vw, 1.875rem)' }}
              >
                The biggest factor between the asking price and what you actually pay? Strategy.
              </h2>
              <p
                className="font-dm text-white/60 leading-relaxed mb-7 text-sm mx-auto"
                style={{ maxWidth: '440px' }}
              >
                Most buyers overpay not because of the home, but because of how their offer was positioned. The right agent doesn't just find you a home. They build a case for why you should pay less than the seller is asking.
              </p>
            </div>
          </>
        )}

        {onNext && (
          <div className="space-y-3 mt-6">
            <button
              onClick={onNext}
              className="w-full font-dm font-medium py-4 rounded-full text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#C9A84C', color: '#0D1B2A' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#D4B86A'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#C9A84C'; }}
            >
              Continue to Market Report
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
            {onRetake && (
              <button
                onClick={onRetake}
                className="w-full font-dm font-medium py-3 rounded-full text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95"
                style={{ backgroundColor: 'transparent', color: '#5A6573', border: '1px solid #E0DAD0' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9F7F2'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
              >
                Start Over
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
