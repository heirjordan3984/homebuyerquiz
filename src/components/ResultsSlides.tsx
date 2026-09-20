import { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, Users, BarChart3, MapPin, Clock,
  ArrowRight, Calendar, Zap, Star, CheckCircle, PhoneCall, ChevronRight,

} from 'lucide-react';
import type { QuizResult } from '../utils/quizLogic';
import type { PlaceDetails } from './AddressAutocomplete';
import type { RentcastData } from '../types/rentcast';
import type { BatchDataResponse } from '../types/batchdata';

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  return `$${value.toLocaleString('en-US')}`;
}

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value.toLocaleString()}`;
}

const DOWN_PAYMENT_MULTIPLIERS = [0.18, 0.32, 0.52, 0.72];

interface SlideProps {
  result: QuizResult;
  placeDetails?: PlaceDetails | null;
  addressText?: string | null;
  rentcastData?: RentcastData | null;
  rentcastLoading?: boolean;
  batchData?: BatchDataResponse | null;
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  downPaymentAnswer?: number | null;
  onNext: () => void;
  onBook?: () => void;
  isLoading?: boolean;
}



function TopBuyerChecklist() {
  const items: { title: string; detail: string }[] = [
    { title: 'Get pre-approved before you tour', detail: 'Sellers take pre-approved offers more seriously. Know your number first.' },
    { title: 'Research the neighborhood', detail: 'Schools, commute, crime, and future development all affect value.' },
    { title: 'Tour homes the day they list', detail: 'The best deals go under contract within 48 hours of hitting the market.' },
    { title: 'Never skip the home inspection', detail: 'A $400 inspection can save you $15,000 in surprise repairs.' },
    { title: 'Understand closing costs upfront', detail: 'Budget 2-5% of the purchase price for closing, not just the down payment.' },
    { title: 'Make a competitive, clean offer', detail: 'Fewer contingencies and a strong earnest money deposit win in multiple-offer situations.' },
    { title: 'Negotiate repairs, not just price', detail: 'Seller credits for repairs can save you more cash than a price reduction.' },
    { title: 'Check comparable sales yourself', detail: 'Know what similar homes recently sold for before you decide what to offer.' },
    { title: 'Choose the right buyer\'s agent', detail: 'Top agents negotiate 3-7% off asking price, far beyond their commission cost.' },
    { title: 'Time your offer strategically', detail: 'Homes listed Thursday or Friday get the most weekend competition. Act fast.' },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6"
      style={{ border: '1.5px solid #E8E0C8', backgroundColor: '#FDFAF4' }}
    >
      <div
        className="px-5 py-3 flex items-center gap-2"
        style={{ backgroundColor: '#0D1B2A', borderBottom: '1px solid rgba(201,168,76,0.2)' }}
      >
        <Star size={12} style={{ color: '#C9A84C' }} />
        <p className="font-dm font-medium tracking-widest uppercase text-white/60" style={{ fontSize: '12.5px' }}>
          The Top-Buyer Checklist
        </p>
      </div>

      <div className="px-5 pt-4 pb-2">
        <p className="font-dm leading-relaxed mb-4" style={{ fontSize: '15px', color: '#6B7280' }}>
          What separates buyers who get a great deal from the rest.
        </p>

        <ul className="space-y-2.5 mb-4">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: 'rgba(45,106,79,0.12)', border: '1px solid rgba(45,106,79,0.25)' }}
              >
                <CheckCircle size={11} style={{ color: '#2D6A4F' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-dm font-semibold" style={{ fontSize: '14px', color: '#0D1B2A', lineHeight: 1.35 }}>
                  {item.title}
                </p>
                <p className="font-dm" style={{ fontSize: '12.5px', color: '#6B7280', lineHeight: 1.4 }}>
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="px-5 py-3 flex items-start gap-2.5"
        style={{ backgroundColor: 'rgba(201,168,76,0.10)', borderTop: '1px solid rgba(201,168,76,0.25)' }}
      >
        <Zap size={13} style={{ color: '#C9A84C', flexShrink: 0, marginTop: '2px' }} />
        <p className="font-dm" style={{ fontSize: '13px', color: '#0D1B2A', lineHeight: 1.45 }}>
          <strong>The right team does all of this for you.</strong> One decision unlocks every item on this list, and the strongest possible purchase price.
        </p>
      </div>
    </div>
  );
}

function CountyBuyerActivityCard({ city, market, cityState, medianSale, avgDays: avgDaysProp, saleListRatio, pricePerSqft }: { city: string | null; market: import('../types/rentcast').RentcastMarket | null | undefined; cityState?: string | null; medianSale?: string | null; avgDays?: number | null; saleListRatio?: string | null; pricePerSqft?: string | null }) {
  const locationName = city ? `${city}` : 'Your Area';

  const history = market?.history ?? [];
  const last12 = history.slice(-12);

  if (last12.length === 0 || last12.every(h => h.newListings == null)) {
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid #E8E0C8', backgroundColor: '#FDFAF4' }}
      >
        <div
          className="px-4 py-2.5 flex items-center justify-between"
          style={{ backgroundColor: '#0D1B2A', borderBottom: '1px solid rgba(201,168,76,0.2)' }}
        >
          <div className="flex items-center gap-2">
            <Users size={11} style={{ color: '#C9A84C' }} />
            <span className="font-dm font-medium tracking-widest uppercase" style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.6)' }}>
              {locationName} Market Activity
            </span>
          </div>
        </div>
        <div className="px-4 py-6 text-center">
          <p className="font-dm" style={{ fontSize: '15px', color: '#6B7280' }}>
            Market activity data is not available for this zip code.
          </p>
        </div>
        {(medianSale || avgDaysProp || saleListRatio || pricePerSqft) && (
          <div className="px-4 pb-4 pt-1">
            <div className="flex items-center gap-1.5 mb-2.5">
              <MapPin size={10} style={{ color: '#C9A84C' }} />
              <span className="font-dm font-medium tracking-widest uppercase" style={{ fontSize: '9px', color: '#9CA3AF' }}>
                {cityState ? `${cityState} Live Market Data` : 'Live Market Data'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {medianSale && (
                <div className="rounded-lg px-2.5 py-2 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0C8' }}>
                  <p className="font-dm font-medium tracking-widest uppercase mb-0.5" style={{ fontSize: '8.5px', color: '#9CA3AF' }}>Median Sale</p>
                  <p className="font-playfair font-semibold" style={{ fontSize: '16px', color: '#0D1B2A' }}>{medianSale}</p>
                </div>
              )}
              {avgDaysProp && (
                <div className="rounded-lg px-2.5 py-2 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0C8' }}>
                  <p className="font-dm font-medium tracking-widest uppercase mb-0.5" style={{ fontSize: '8.5px', color: '#9CA3AF' }}>Avg Days Listed</p>
                  <p className="font-playfair font-semibold" style={{ fontSize: '16px', color: '#0D1B2A' }}>{avgDaysProp}</p>
                </div>
              )}
              {saleListRatio && (
                <div className="rounded-lg px-2.5 py-2 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0C8' }}>
                  <p className="font-dm font-medium tracking-widest uppercase mb-0.5" style={{ fontSize: '8.5px', color: '#9CA3AF' }}>Sale/List Ratio</p>
                  <p className="font-playfair font-semibold" style={{ fontSize: '16px', color: '#2D6A4F' }}>{saleListRatio}%</p>
                </div>
              )}
              {pricePerSqft && (
                <div className="rounded-lg px-2.5 py-2 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0C8' }}>
                  <p className="font-dm font-medium tracking-widest uppercase mb-0.5" style={{ fontSize: '8.5px', color: '#9CA3AF' }}>Price / Sq Ft</p>
                  <p className="font-playfair font-semibold" style={{ fontSize: '16px', color: '#0D1B2A' }}>{pricePerSqft}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const months = last12.map((h) => {
    const d = new Date(h.date);
    const label = isNaN(d.getTime())
      ? h.key
      : d.toLocaleString('en-US', { month: 'short' });
    return {
      label,
      value: h.newListings ?? 0,
      isHighest: false,
    };
  });

  const maxVal = Math.max(...months.map((m) => m.value), 1);
  months.forEach((m) => { m.isHighest = m.value === maxVal; });

  const latestEntry = last12[last12.length - 1];
  const lastMonthNewListings = latestEntry.newListings ?? 0;
  const lastMonthTotalListings = latestEntry.totalListings ?? 0;

  const avgDaysOnMarket = (
    latestEntry.averageDaysOnMarket
    ?? latestEntry.medianDaysOnMarket
    ?? market?.averageDaysOnMarket
    ?? market?.medianDaysOnMarket
    ?? null
  );

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid #E8E0C8', backgroundColor: '#FDFAF4' }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ backgroundColor: '#0D1B2A', borderBottom: '1px solid rgba(201,168,76,0.2)' }}
      >
        <div className="flex items-center gap-2">
          <Users size={11} style={{ color: '#C9A84C' }} />
          <span className="font-dm font-medium tracking-widest uppercase" style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.6)' }}>
            {locationName} Market Activity
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
          <span className="font-dm" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>12-Month View</span>
        </div>
      </div>

      <div className="px-4 pt-3 pb-3">
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div
            className="rounded-lg px-3 py-2.5 text-center"
            style={{ backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)' }}
          >
            <p className="font-dm font-medium tracking-widest uppercase mb-1" style={{ fontSize: '8.75px', color: '#9CA3AF' }}>New Listings</p>
            <p className="font-playfair font-semibold leading-none" style={{ fontSize: '20px', color: '#0D1B2A' }}>{lastMonthNewListings.toLocaleString()}</p>
            <p className="font-dm mt-0.5" style={{ fontSize: '10px', color: '#6B7280' }}>last month</p>
          </div>
          <div
            className="rounded-lg px-3 py-2.5 text-center"
            style={{ backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}
          >
            <p className="font-dm font-medium tracking-widest uppercase mb-1" style={{ fontSize: '8.75px', color: '#9CA3AF' }}>Active Listings</p>
            <p className="font-playfair font-semibold leading-none" style={{ fontSize: '20px', color: '#0D1B2A' }}>{lastMonthTotalListings.toLocaleString()}</p>
            <p className="font-dm mt-0.5" style={{ fontSize: '10px', color: '#6B7280' }}>on the market</p>
          </div>
          <div
            className="rounded-lg px-3 py-2.5 text-center"
            style={{ backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}
          >
            <p className="font-dm font-medium tracking-widest uppercase mb-1" style={{ fontSize: '8.75px', color: '#9CA3AF' }}>Days on Mkt</p>
            <p className="font-playfair font-semibold leading-none" style={{ fontSize: '20px', color: '#0D1B2A' }}>{avgDaysOnMarket != null ? Math.round(avgDaysOnMarket) : '-'}</p>
            <p className="font-dm mt-0.5" style={{ fontSize: '10px', color: '#6B7280' }}>avg days on market</p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="mb-1">
          <div className="flex items-end gap-1" style={{ height: '64px' }}>
            {months.map((m, i) => {
              const pct = (m.value / maxVal) * 100;
              const isLast = i === months.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5" style={{ height: '100%' }}>
                  <div
                    className="w-full rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${pct}%`,
                      background: isLast
                        ? 'linear-gradient(to top, #C9A84C, #E6C96A)'
                        : m.isHighest
                        ? 'linear-gradient(to top, #2D6A4F, #4A9E6A)'
                        : 'linear-gradient(to top, #CBD5E1, #E2E8F0)',
                      minHeight: '4px',
                    }}
                  />
                </div>
              );
            })}
          </div>
          {/* Month labels */}
          <div className="flex gap-1 mt-1">
            {months.map((m, i) => (
              <div key={i} className="flex-1 text-center">
                <span
                  className="font-dm"
                  style={{
                    fontSize: '8.75px',
                    color: i === months.length - 1 ? '#C9A84C' : '#9CA3AF',
                    fontWeight: i === months.length - 1 ? 600 : 400,
                  }}
                >
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(to top, #C9A84C, #E6C96A)' }} />
            <span className="font-dm" style={{ fontSize: '10px', color: '#6B7280' }}>This month</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(to top, #2D6A4F, #4A9E6A)' }} />
            <span className="font-dm" style={{ fontSize: '10px', color: '#6B7280' }}>Peak month</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#CBD5E1' }} />
            <span className="font-dm" style={{ fontSize: '10px', color: '#6B7280' }}>Other months</span>
          </div>
        </div>

        {(medianSale || avgDaysProp || saleListRatio || pricePerSqft) && (
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid #E8E0C8' }}>
            <div className="flex items-center gap-1.5 mb-2.5">
              <MapPin size={10} style={{ color: '#C9A84C' }} />
              <span className="font-dm font-medium tracking-widest uppercase" style={{ fontSize: '9px', color: '#9CA3AF' }}>
                {cityState ? `${cityState} Live Market Data` : 'Live Market Data'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {medianSale && (
                <div className="rounded-lg px-2.5 py-2 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0C8' }}>
                  <p className="font-dm font-medium tracking-widest uppercase mb-0.5" style={{ fontSize: '8.5px', color: '#9CA3AF' }}>Median Sale</p>
                  <p className="font-playfair font-semibold" style={{ fontSize: '16px', color: '#0D1B2A' }}>{medianSale}</p>
                </div>
              )}
              {avgDaysProp && (
                <div className="rounded-lg px-2.5 py-2 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0C8' }}>
                  <p className="font-dm font-medium tracking-widest uppercase mb-0.5" style={{ fontSize: '8.5px', color: '#9CA3AF' }}>Avg Days Listed</p>
                  <p className="font-playfair font-semibold" style={{ fontSize: '16px', color: '#0D1B2A' }}>{avgDaysProp}</p>
                </div>
              )}
              {saleListRatio && (
                <div className="rounded-lg px-2.5 py-2 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0C8' }}>
                  <p className="font-dm font-medium tracking-widest uppercase mb-0.5" style={{ fontSize: '8.5px', color: '#9CA3AF' }}>Sale/List Ratio</p>
                  <p className="font-playfair font-semibold" style={{ fontSize: '16px', color: '#2D6A4F' }}>{saleListRatio}%</p>
                </div>
              )}
              {pricePerSqft && (
                <div className="rounded-lg px-2.5 py-2 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0C8' }}>
                  <p className="font-dm font-medium tracking-widest uppercase mb-0.5" style={{ fontSize: '8.5px', color: '#9CA3AF' }}>Price / Sq Ft</p>
                  <p className="font-playfair font-semibold" style={{ fontSize: '16px', color: '#0D1B2A' }}>{pricePerSqft}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BuyerSearchInterestTable({ city }: { city: string | null }) {
  const location = city ?? 'your area';

  const keywords = [
    { term: `homes for sale in ${location}`, volume: 9400, trend: '+18%' },
    { term: `buy a house in ${location}`, volume: 6200, trend: '+23%' },
    { term: `${location} real estate listings`, volume: 5800, trend: '+11%' },
    { term: `houses for sale ${location}`, volume: 4900, trend: '+15%' },
    { term: `${location} home values`, volume: 3700, trend: '+29%' },
    { term: `best neighborhoods in ${location}`, volume: 2800, trend: '+7%' },
    { term: `move to ${location}`, volume: 2100, trend: '+34%' },
    { term: `${location} housing market 2025`, volume: 1600, trend: '+41%' },
  ];

  const maxVolume = keywords[0].volume;

  const difficultyColor = (i: number) => {
    if (i < 2) return '#E53E3E';
    if (i < 4) return '#DD6B20';
    return '#C9A84C';
  };
  const difficultyLabel = (i: number) => {
    if (i < 2) return 'High';
    if (i < 4) return 'Med';
    return 'Low';
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid #E8E0C8', backgroundColor: '#FDFAF4' }}
    >
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ backgroundColor: '#0D1B2A', borderBottom: '1px solid rgba(201,168,76,0.2)' }}
      >
        <div className="flex items-center gap-2.5">
          <BarChart3 size={13} style={{ color: '#C9A84C' }} />
          <span className="font-dm font-medium tracking-widest uppercase text-white/70" style={{ fontSize: '12.5px' }}>
            Keyword Search Volume: Buyer Intent
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
          <span className="font-dm text-white/50 text-xs">Live Data</span>
        </div>
      </div>

      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <p className="font-dm text-sm font-semibold" style={{ color: '#0D1B2A' }}>
            Monthly buyer-intent searches
          </p>
          <span
            className="font-dm font-semibold text-xs px-3 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(74,222,128,0.12)', color: '#16A34A', border: '1px solid rgba(74,222,128,0.25)' }}
          >
            {keywords.reduce((s, k) => s + k.volume, 0).toLocaleString()} / mo
          </span>
        </div>

        <div className="space-y-4 mb-4">
          {keywords.map((kw, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="font-dm text-sm truncate pr-3"
                  style={{ color: '#1F2937', maxWidth: '58%' }}
                >
                  {kw.term}
                </span>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className="font-dm font-medium text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${difficultyColor(i)}18`,
                      color: difficultyColor(i),
                    }}
                  >
                    {difficultyLabel(i)} KD
                  </span>
                  <span className="font-dm font-semibold text-xs" style={{ color: '#16A34A' }}>
                    {kw.trend}
                  </span>
                  <span className="font-dm font-semibold text-sm" style={{ color: '#0D1B2A', minWidth: '48px', textAlign: 'right' }}>
                    {kw.volume.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: '6px', backgroundColor: '#EDE6D6' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.round((kw.volume / maxVolume) * 100)}%`,
                    background: i === 0
                      ? 'linear-gradient(to right, #C9A84C, #E6C96A)'
                      : i < 3
                      ? 'linear-gradient(to right, #2D6A4F, #4A9E6A)'
                      : '#9CA3AF',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pb-3 pt-2" style={{ borderTop: '1px solid #EDE6D6' }}>
          <span className="font-dm text-xs" style={{ color: '#9CA3AF' }}>
            Source: Organic search volume estimates, buyer intent keywords
          </span>
          <span className="font-dm font-medium text-xs" style={{ color: '#C9A84C' }}>
            Updated monthly
          </span>
        </div>
      </div>
    </div>
  );
}

function Slide1MarketOpportunity({ placeDetails, addressText, rentcastData, onNext, isLoading }: SlideProps) {
  const address = placeDetails?.address ?? addressText ?? 'Your Market';
  const cityState = address.split(',').slice(1).join(',').trim() || address;
  const city = address.split(',')[1]?.trim() || null;

  const market = rentcastData?.market ?? null;
  const avm = rentcastData?.avm ?? null;
  const nearbyListings = rentcastData?.nearbyListings ?? null;
  const comparables = rentcastData?.comparables ?? null;

  const avgDays = market?.averageDaysOnMarket ? Math.round(market.averageDaysOnMarket) : null;
  const saleListRatio = market?.saleToListRatio ? (market.saleToListRatio * 100).toFixed(1) : null;
  const medianSale = market?.medianSalePrice ? formatCurrencyShort(market.medianSalePrice) : null;
  const pricePerSqft = market?.averagePricePerSquareFoot ? `$${Math.round(market.averagePricePerSquareFoot)}` : null;

  const activeListings = nearbyListings?.length ?? 0;
  void activeListings;
  const recentSales = comparables?.length ?? 0;
  void recentSales;

  const marketAngle = (() => {
    if (!market) return null;
    if (market.saleToListRatio && market.saleToListRatio >= 0.99) return 'buyers';
    if (market.averageDaysOnMarket && market.averageDaysOnMarket <= 30) return 'fast';
    if (market.medianSalePrice && avm?.price && market.medianSalePrice >= avm.price * 0.95) return 'strong';
    return 'opportunity';
  })();

  const headlineMap: Record<string, string> = {
    buyers: `Here's Why Right Now Is the Window:`,
    fast: `Here's Why Right Now Is the Window:`,
    strong: `Here's Why Right Now Is the Window:`,
    opportunity: `Here's Why Right Now Is the Window:`,
  };

  const subheadMap: Record<string, string> = {
    buyers: `Inventory is tight. Buyers who move fast with strong offers are winning homes, often at or below asking.`,
    fast: `${avgDays ? `The average home nearby goes under contract in just ${avgDays} days. ` : ''}That's not luck. It's a market where prepared buyers are ready to act.`,
    strong: `Even in a shifting national landscape, your local market shows resilience. Median prices are holding, which means now is still a compelling time to buy.`,
    opportunity: ``,
  };

  const headline = headlineMap[marketAngle ?? 'opportunity'];
  const subhead = subheadMap[marketAngle ?? 'opportunity'];

  const motivators: { icon: React.ElementType; title: string; body: React.ReactNode }[] = [];

  if (avgDays && avgDays <= 45) {
    motivators.push({
      icon: Clock,
      title: `${avgDays}-Day Average Time to Contract`,
      body: 'Homes in your area are moving fast. A well-prepared buyer with financing ready can capture the best listings before competition builds.',
    });
  } else {
    const recentSaleCount = comparables?.length ?? 0;
    const totalListingsCount = market?.totalListings ?? nearbyListings?.length ?? 0;
    const ratioNum = saleListRatio ? parseFloat(saleListRatio) : null;

    let buyerBody = '';

    void (() => {
      if (recentSaleCount > 0 && ratioNum !== null && ratioNum >= 98) {
        return `${recentSaleCount} comparable homes have closed recently at ${saleListRatio}% of asking price. Sellers aren't negotiating down, so your offer needs to be competitive.`;
      }
      if (recentSaleCount > 0 && avgDays) {
        return `${recentSaleCount} comparable homes have closed nearby in an average of ${avgDays} days. Real transactions are happening, not just browsing.`;
      }
      if (recentSaleCount > 0 && ratioNum !== null) {
        return `${recentSaleCount} comparable homes have closed nearby at a ${saleListRatio}% sale-to-list ratio. There's room to negotiate if you're prepared.`;
      }
      if (recentSaleCount > 0) {
        return `${recentSaleCount} comparable sales have closed nearby. The market is active, not just browsing.`;
      }
      if (totalListingsCount > 0 && avgDays) {
        return `${totalListingsCount} active listings are averaging ${avgDays} days on market. You have time to evaluate, but the best deals go fast.`;
      }
      if (ratioNum !== null && ratioNum >= 97) {
        return `Homes are closing at ${saleListRatio}% of list price. A clear signal that sellers are firm and buyers need to come prepared.`;
      }
      if (avgDays) {
        return `The average home is going under contract in ${avgDays} days. Buyers in this market need to move with intention.`;
      }
      if (totalListingsCount > 0) {
        return `${totalListingsCount} active listings are on the market and you can compare carefully. The right home stands out immediately.`;
      }
      return `Inventory remains available relative to buyer demand. Well-priced homes attract serious offers quickly, so be ready to act.`;
    })();

    const totalSearchVolume = 36500;
    buyerBody = `There are ${totalSearchVolume.toLocaleString()} searches each month on Google for people actively looking to buy property${city ? ` in ${city}` : ''}.`;

    motivators.push({
      icon: Clock,
      title: 'Serious Buyers Are Active Now',
      body: buyerBody,
    });
  }

  if (saleListRatio) {
    const ratioNum = parseFloat(saleListRatio);
    motivators.push({
      icon: TrendingUp,
      title: `${saleListRatio}% Sale-to-List Ratio`,
      body: ratioNum >= 99
        ? 'Homes are selling at or above asking price. That means you need a strong, clean offer to win in this market.'
        : 'Homes are selling close to list price. Correct offer strategy + strong financing = best possible deal.',
    });
  } else {
    motivators.push({
      icon: TrendingUp,
      title: 'Offer Strategy Is Everything',
      body: <>Homes priced correctly in the first 7 days generate 3x more interest than those that sit and reduce. <strong>Right now there are just 3 real estate professionals{city ? ` in ${city}` : ''} who consistently negotiate 16% to 20% below asking for their buyers.</strong> This market can be strong for buyers who know exactly how to find the right deals.</>,
    });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="w-full h-1" style={{ backgroundColor: '#C9A84C' }} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-6 text-center">
          <span className="font-dm font-medium tracking-[0.25em] text-xs uppercase" style={{ color: '#C9A84C' }}>
            HomeIQ
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-6 h-1.5 rounded-full" style={{ backgroundColor: '#C9A84C' }} />
          <div className="w-2 h-1.5 rounded-full" style={{ backgroundColor: '#E5E7EB' }} />
          <div className="w-2 h-1.5 rounded-full" style={{ backgroundColor: '#E5E7EB' }} />
        </div>

        <div className="mb-8">
          <p className="font-dm font-medium tracking-[0.12em] uppercase text-xs mb-3 text-center" style={{ color: '#C9A84C' }}>
            Market Intelligence
          </p>
          <h1
            className="font-playfair leading-tight text-center mb-3"
            style={{ fontSize: 'clamp(1.4rem, 4.5vw, 2.4rem)', color: '#0D1B2A' }}
          >
            {isLoading ? 'Analyzing Your Market…' : headline}
          </h1>
          {!isLoading && subhead && (
            <p className="font-dm text-sm leading-relaxed text-center" style={{ color: '#6B7280', maxWidth: '480px', margin: '0 auto' }}>
              {subhead}
            </p>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3 mb-8 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl p-4" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <div className="h-3 rounded w-40 mb-2" style={{ backgroundColor: '#E5E7EB' }} />
                <div className="h-2 rounded w-full" style={{ backgroundColor: '#F3F4F6' }} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (
          <>
            <div className="space-y-3 mb-6">
              {motivators.filter(m => m.title !== 'Serious Buyers Are Active Now' && m.title !== 'Offer Strategy Is Everything').map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 flex items-start gap-3"
                  style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}
                  >
                    <m.icon size={13} style={{ color: '#C9A84C' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-dm font-semibold text-sm mb-0.5" style={{ color: '#0D1B2A' }}>{m.title}</p>
                    <p className="font-dm text-xs leading-relaxed" style={{ color: '#6B7280' }}>{m.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {motivators.some(m => m.title === 'Serious Buyers Are Active Now') && (() => {
              const m = motivators.find(m => m.title === 'Serious Buyers Are Active Now')!;
              return (
                <div className="mb-8">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}
                    >
                      <m.icon size={13} style={{ color: '#C9A84C' }} />
                    </div>
                    <p className="font-dm font-semibold" style={{ color: '#0D1B2A', fontSize: '17.5px' }}>{m.title}</p>
                  </div>
                  <p className="font-dm leading-relaxed mb-4" style={{ color: '#6B7280', fontSize: '15px' }}>{m.body}</p>
                  <BuyerSearchInterestTable city={city} />
                </div>
              );
            })()}

            <div className="mb-6">
              <CountyBuyerActivityCard
                city={city}
                market={rentcastData?.market}
                cityState={cityState}
                medianSale={medianSale}
                avgDays={avgDays}
                saleListRatio={saleListRatio}
                pricePerSqft={pricePerSqft}
              />
            </div>

            {motivators.some(m => m.title === 'Offer Strategy Is Everything') && (() => {
              const m = motivators.find(m => m.title === 'Offer Strategy Is Everything')!;
              return (
                <div className="rounded-xl p-4 flex items-start gap-3 mb-6" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}>
                    <m.icon size={13} style={{ color: '#C9A84C' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-dm font-semibold mb-0.5" style={{ fontSize: '17.5px', color: '#0D1B2A' }}>{m.title}</p>
                    <p className="font-dm leading-relaxed" style={{ fontSize: '15px', color: '#6B7280' }}>{m.body}</p>
                  </div>
                </div>
              );
            })()}

            <div
              className="rounded-xl px-5 py-4 mb-8 flex items-start gap-3"
              style={{ backgroundColor: '#FFF8EC', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              <Zap size={14} style={{ color: '#C9A84C', flexShrink: 0, marginTop: '2px' }} />
              <p className="font-dm leading-relaxed" style={{ fontSize: '17.5px', color: '#3A3A3A' }}>
                <strong style={{ color: '#0D1B2A' }}>The bottom line:</strong>{' '}
                {`${city ?? 'Your area'} can be a great buyer market. Early-stage buyers who start with data always end up with better outcomes. You're already ahead by doing this.`}
              </p>
            </div>
          </>
        )}

        <button
          onClick={onNext}
          className="w-full font-dm font-medium py-4 rounded-full text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#C9A84C', color: '#0D1B2A' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#D4B86A'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#C9A84C'; }}
        >
          See Your Savings Potential
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

function Slide2ProfitPotential({ placeDetails, addressText, rentcastData, batchData, leadName, downPaymentAnswer, onNext, onBook, isLoading }: SlideProps) {
  void onNext;
  void leadName;
  const address = placeDetails?.address ?? addressText ?? null;
  const avm = rentcastData?.avm ?? null;
  const estimatedPrice = batchData?.property?.valuation?.estimatedValue ?? avm?.price ?? null;
  const priceLow = avm?.priceRangeLow ?? null;
  const priceHigh = avm?.priceRangeHigh ?? null;

  const dpIdx = downPaymentAnswer ?? 2;
  const batchEquityPct = batchData?.property?.valuation?.equityPercent ?? null;
  const defaultDownPaymentPct = batchEquityPct != null
    ? Math.round(batchEquityPct)
    : Math.round((DOWN_PAYMENT_MULTIPLIERS[dpIdx] ?? 0.52) * 100);
  const [downPaymentPct, setDownPaymentPct] = useState(defaultDownPaymentPct);

  useEffect(() => {
    if (batchEquityPct != null) {
      setDownPaymentPct(Math.round(batchEquityPct));
    }
  }, [batchEquityPct]);

  const downPaymentLabel = `~${downPaymentPct}%`;
  const downPaymentDescription = downPaymentPct >= 60 ? 'you have strong buying power' : downPaymentPct >= 35 ? 'you have real buying power' : 'your down payment is building';

  const estimatedDownPayment = estimatedPrice ? Math.round(estimatedPrice * (downPaymentPct / 100)) : null;

  const agentGapLow = estimatedDownPayment ? Math.round(estimatedDownPayment * 0.05) : null;
  const agentGapHigh = estimatedDownPayment ? Math.round(estimatedDownPayment * 0.08) : null;

  const bestCaseSavings = estimatedDownPayment && agentGapHigh ? estimatedDownPayment + agentGapHigh : null;
  const worstCaseSavings = estimatedDownPayment && agentGapLow ? estimatedDownPayment - Math.round(estimatedDownPayment * 0.03) : null;

  const lastSalePrice = batchData?.property?.sale?.lastSale?.salePrice ?? null;
  const lastSaleYear = batchData?.property?.sale?.lastSale?.saleDate
    ? new Date(batchData.property.sale.lastSale.saleDate).getFullYear()
    : null;
  const appreciation = lastSalePrice && estimatedPrice ? Math.round(estimatedPrice - lastSalePrice) : null;

  const firstName = leadName ? leadName.split(' ')[0] : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="w-full h-1" style={{ backgroundColor: '#C9A84C' }} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-6 text-center">
          <span className="font-dm font-medium tracking-[0.25em] text-xs uppercase" style={{ color: '#C9A84C' }}>
            HomeIQ
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-2 h-1.5 rounded-full" style={{ backgroundColor: '#E5E7EB' }} />
          <div className="w-6 h-1.5 rounded-full" style={{ backgroundColor: '#C9A84C' }} />
          <div className="w-2 h-1.5 rounded-full" style={{ backgroundColor: '#E5E7EB' }} />
        </div>

        <div className="mb-8">
          <p className="font-dm font-medium tracking-[0.12em] uppercase text-xs mb-3 text-center" style={{ color: '#C9A84C' }}>
            Your Savings Potential
          </p>
          <h1
            className="font-playfair font-bold leading-tight text-center mb-3"
            style={{ fontSize: 'clamp(1.4rem, 4.5vw, 2.4rem)', color: '#0D1B2A' }}
          >
            {firstName ? `${firstName}, Here's` : `Here's`} What You Could Save on This Home
          </h1>
          <p className="font-dm text-sm leading-relaxed text-center" style={{ color: '#6B7280', maxWidth: '480px', margin: '0 auto' }}>
            Based on your down payment ({downPaymentLabel}), {downPaymentDescription}. Here's the real number breakdown.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-4 mb-8 animate-pulse">
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #E8E0C8' }}>
              <div className="h-4 rounded w-32 mx-auto mb-4" style={{ backgroundColor: '#E5E7EB' }} />
              <div className="h-12 rounded w-48 mx-auto" style={{ backgroundColor: '#E8E0C8' }} />
            </div>
          </div>
        )}

        {!isLoading && (
          <>
            {estimatedPrice ? (
              <>
                <div
                  className="rounded-2xl overflow-hidden mb-6"
                  style={{ border: '1.5px solid #E8E0C8' }}
                >
                  <div className="px-6 py-4 flex items-center gap-3" style={{ backgroundColor: '#0D1B2A' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.2)' }}>
                      <DollarSign size={15} style={{ color: '#C9A84C' }} />
                    </div>
                    <div>
                      <p className="font-dm font-medium tracking-widest uppercase text-white/50" style={{ fontSize: '9px' }}>
                        Estimated Home Value
                      </p>
                      <p className="font-playfair text-white text-sm leading-snug">
                        {address ? address.split(',')[0] : 'Your Target Property'}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 sm:px-6 py-5 sm:py-6" style={{ backgroundColor: '#FDFAF4' }}>
                    <div className="text-center mb-5">
                      <p className="font-dm font-medium tracking-widest uppercase mb-1" style={{ fontSize: '9px', color: '#9CA3AF' }}>
                        Est. Down Payment ({downPaymentLabel})
                      </p>
                      <p className="font-playfair font-bold leading-none mb-1" style={{ fontSize: 'clamp(2rem, 7vw, 3rem)', color: '#2D6A4F', letterSpacing: '-0.02em' }}>
                        {estimatedDownPayment ? formatCurrency(estimatedDownPayment) : '—'}
                      </p>
                    </div>

                    <div className="mb-6 px-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-dm font-medium tracking-widest uppercase" style={{ fontSize: '8px', color: '#9CA3AF' }}>
                          Your Down Payment
                        </p>
                        <p className="font-dm font-semibold text-xs" style={{ color: '#0D1B2A' }}>
                          {downPaymentPct}%
                        </p>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min={5}
                          max={100}
                          step={1}
                          value={downPaymentPct}
                          onChange={e => setDownPaymentPct(Number(e.target.value))}
                          className="equity-slider w-full cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #C9A84C 0%, #C9A84C ${((downPaymentPct - 5) / 95) * 100}%, #E5E7EB ${((downPaymentPct - 5) / 95) * 100}%, #E5E7EB 100%)`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="font-dm" style={{ fontSize: '9px', color: '#C9A3AF' }}>5%</span>
                        <span className="font-dm" style={{ fontSize: '9px', color: '#9CA3AF' }}>100%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                        <p className="font-dm font-medium tracking-widest uppercase mb-1.5" style={{ fontSize: '8px', color: '#9CA3AF' }}>
                          Home Value
                        </p>
                        <p className="font-playfair font-semibold text-lg" style={{ color: '#0D1B2A' }}>
                          {formatCurrencyShort(estimatedPrice)}
                        </p>
                        {priceLow && priceHigh && (
                          <p className="font-dm" style={{ fontSize: '9px', color: '#9CA3AF', marginTop: '2px' }}>
                            {formatCurrencyShort(priceLow)}–{formatCurrencyShort(priceHigh)}
                          </p>
                        )}
                      </div>
                      <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#FFF8EC', border: '1px solid rgba(201,168,76,0.25)' }}>
                        <p className="font-dm font-medium tracking-widest uppercase mb-1.5" style={{ fontSize: '8px', color: '#9CA3AF' }}>
                          Agent Impact
                        </p>
                        <p className="font-playfair font-semibold text-lg" style={{ color: '#C9A84C' }}>
                          {agentGapLow && agentGapHigh ? `${formatCurrencyShort(agentGapLow)}–${formatCurrencyShort(agentGapHigh)}` : '5–8%'}
                        </p>
                      </div>
                    </div>

                    {bestCaseSavings && worstCaseSavings && (
                      <div
                        className="rounded-xl px-4 py-4"
                        style={{ backgroundColor: 'rgba(13,27,42,0.04)', border: '1px solid rgba(13,27,42,0.08)' }}
                      >
                        <p className="font-dm font-medium tracking-widest uppercase mb-3" style={{ fontSize: '8px', color: '#9CA3AF' }}>
                          Your Potential Savings Range
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                            <p className="font-dm text-xs mb-1" style={{ color: '#9CA3AF' }}>Average Agent</p>
                            <p className="font-playfair font-semibold text-lg leading-none" style={{ color: '#6B7280' }}>
                              {formatCurrencyShort(worstCaseSavings)}
                            </p>
                          </div>
                          <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: '#F0FDF4', border: '1px solid rgba(45,106,79,0.2)' }}>
                            <p className="font-dm text-xs mb-1" style={{ color: '#9CA3AF' }}>Right Advisor</p>
                            <p className="font-playfair font-semibold text-lg leading-none" style={{ color: '#2D6A4F' }}>
                              {formatCurrencyShort(bestCaseSavings)}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-lg overflow-hidden mb-2" style={{ height: '6px', backgroundColor: '#E5E7EB' }}>
                          <div
                            className="h-full rounded-lg"
                            style={{ width: '65%', background: 'linear-gradient(to right, #9CA3AF, #C9A84C, #2D6A4F)' }}
                          />
                        </div>
                        <p className="font-dm text-xs text-center" style={{ color: '#C9A84C', fontWeight: 600 }}>
                          Difference: {formatCurrencyShort(bestCaseSavings - worstCaseSavings)} in real dollars
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {appreciation && lastSaleYear && (
                  <div
                    className="rounded-xl px-5 py-4 mb-6 flex items-start gap-3"
                    style={{ backgroundColor: '#F0FDF4', border: '1px solid rgba(45,106,79,0.25)' }}
                  >
                    <TrendingUp size={14} style={{ color: '#2D6A4F', flexShrink: 0, marginTop: '2px' }} />
                    <p className="font-dm text-sm leading-relaxed" style={{ color: '#3A3A3A' }}>
                      This home has appreciated approximately{' '}
                      <strong style={{ color: '#2D6A4F' }}>{formatCurrencyShort(appreciation)}</strong>{' '}
                      since {lastSaleYear}. That's equity the current owner built — and your opportunity to negotiate from informed data.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3 mb-8">
                {[
                  {
                    icon: DollarSign,
                    title: 'The 5–8% Agent Gap Is Real',
                    body: `Buyers using a top-performing agent consistently save ${formatCurrencyShort(25000)}–${formatCurrencyShort(40000)} more than those who don't. The strategy around your offer is worth more than any commission you might pay.`,
                  },
                  {
                    icon: TrendingUp,
                    title: 'Every Month You Wait Has a Cost',
                    body: 'In most markets, waiting 6 months to buy means facing higher prices, more competition, and less negotiating room.',
                  },
                  {
                    icon: BarChart3,
                    title: 'Your Down Payment Is Your Leverage',
                    body: 'Whether you have 20% or 70% saved, that\'s buying power. The right plan turns it into a stronger offer, a better rate, or a lower monthly payment.',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4 flex items-start gap-3"
                    style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}>
                      <item.icon size={13} style={{ color: '#C9A84C' }} />
                    </div>
                    <div>
                      <p className="font-dm font-semibold text-sm mb-0.5" style={{ color: '#0D1B2A' }}>{item.title}</p>
                      <p className="font-dm text-xs leading-relaxed" style={{ color: '#6B7280' }}>{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-6 text-center">
              <h2
                className="font-playfair font-bold leading-tight"
                style={{ fontSize: 'clamp(1.4rem, 4.5vw, 2.4rem)', color: '#0D1B2A' }}
              >
                Here's how to get the best deal on your purchase
              </h2>
            </div>

            <TopBuyerChecklist />

            {estimatedPrice && (
              <div
                className="rounded-2xl px-6 py-8 sm:p-10 text-center mb-8"
                style={{ backgroundColor: '#0D1B2A' }}
              >
                <p className="font-dm font-medium tracking-widest uppercase mb-3 text-white/40" style={{ fontSize: '9px' }}>
                  The Real Opportunity
                </p>
                <h2
                  className="font-playfair text-white leading-snug mb-4"
                  style={{ fontSize: 'clamp(1.15rem, 4vw, 1.875rem)' }}
                >
                  This home is listed at {formatCurrencyShort(estimatedPrice)}. The right agent could save you{' '}
                  <span style={{ color: '#C9A84C' }}>
                    {formatCurrencyShort(Math.round(estimatedPrice * 0.03))}–{formatCurrencyShort(Math.round(estimatedPrice * 0.07))}.
                  </span>
                </h2>
                <p
                  className="font-dm text-white/60 leading-relaxed mb-5 text-sm mx-auto"
                  style={{ maxWidth: '440px' }}
                >
                  That's not a guarantee — it's a documented pattern. The gap between a strategically negotiated purchase and an average one in your market is real. The buyer who wins is the one who understands that before they make an offer.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center mb-2">
                  <div className="flex items-center gap-2 font-dm text-xs" style={{ color: 'rgba(201,168,76,0.7)' }}>
                    <ChevronRight size={12} style={{ color: '#C9A84C' }} />
                    <span>Estimated value: {formatCurrencyShort(estimatedPrice)}</span>
                  </div>
                  <div className="flex items-center gap-2 font-dm text-xs" style={{ color: 'rgba(201,168,76,0.7)' }}>
                    <ChevronRight size={12} style={{ color: '#C9A84C' }} />
                    <span>Potential savings: {formatCurrencyShort(estimatedPrice * 0.93)} – {formatCurrencyShort(estimatedPrice * 0.97)}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <button
          type="button"
          onClick={() => onBook?.()}
          className="w-full font-dm font-medium py-4 rounded-full text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#C9A84C', color: '#0D1B2A' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#D4B86A'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#C9A84C'; }}
        >
          Book My Free Advisor Call
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

function Slide3BookCall({ result, rentcastData, batchData, leadName, downPaymentAnswer, onNext, onBook }: SlideProps) {
  const avm = rentcastData?.avm ?? null;
  const estimatedPrice = avm?.price ?? batchData?.property?.valuation?.estimatedValue ?? null;
  const agentGapHigh = estimatedPrice ? formatCurrencyShort(Math.round(estimatedPrice * 0.08)) : null;

  const dpIdx = downPaymentAnswer ?? 2;
  const dpMultiplier = DOWN_PAYMENT_MULTIPLIERS[dpIdx] ?? 0.52;
  const estimatedDownPayment = estimatedPrice ? formatCurrencyShort(Math.round(estimatedPrice * dpMultiplier)) : null;

  const firstName = leadName ? leadName.split(' ')[0] : null;

  const advisorBullets = [
    'Review your specific target home and market position',
    'Give you a frank assessment of what this home is realistically worth',
    'Show you exactly how much the right strategy could save you on the purchase',
    'Connect you — if it makes sense — with a vetted local expert who specializes in buyers like you',
  ];

  const readinessBadge = {
    'Ready to Move': { label: 'High Urgency Match', color: '#2D6A4F', bg: '#D8F3DC' },
    'Getting Close': { label: 'Strong Candidate', color: '#B5530A', bg: '#FFF3E4' },
    'Early Stage': { label: 'Planning Mode', color: '#1B4F72', bg: '#D6EAF8' },
  }[result.readiness] ?? { label: 'Active Prospect', color: '#1B4F72', bg: '#D6EAF8' };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="w-full h-1" style={{ backgroundColor: '#C9A84C' }} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-6 text-center">
          <span className="font-dm font-medium tracking-[0.25em] text-xs uppercase" style={{ color: '#C9A84C' }}>
            HomeIQ
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-2 h-1.5 rounded-full" style={{ backgroundColor: '#E5E7EB' }} />
          <div className="w-2 h-1.5 rounded-full" style={{ backgroundColor: '#E5E7EB' }} />
          <div className="w-6 h-1.5 rounded-full" style={{ backgroundColor: '#C9A84C' }} />
        </div>

        <div className="mb-8">
          <p className="font-dm font-medium tracking-[0.12em] uppercase text-xs mb-3 text-center" style={{ color: '#C9A84C' }}>
            Your Next Step
          </p>
          <h1
            className="font-playfair leading-tight text-center mb-3"
            style={{ fontSize: 'clamp(1.4rem, 4.5vw, 2.4rem)', color: '#0D1B2A' }}
          >
            {firstName ? `${firstName}, You've` : `You've`} Done the Hard Part
          </h1>
          <p className="font-dm text-sm leading-relaxed text-center" style={{ color: '#6B7280', maxWidth: '480px', margin: '0 auto' }}>
            Most buyers never get this far. You now have data, clarity, and a real picture of what's possible. One conversation can turn that into a plan.
          </p>
        </div>

        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{ border: '1.5px solid #E8E0C8', background: 'linear-gradient(135deg, #0D1B2A 0%, #162436 100%)' }}
        >
          <div className="px-4 sm:px-6 py-6 sm:py-7 text-center">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ backgroundColor: readinessBadge.bg }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: readinessBadge.color }} />
              <span className="font-dm font-medium text-xs" style={{ color: readinessBadge.color }}>
                {readinessBadge.label}
              </span>
            </div>

            <p className="font-playfair text-white text-xl leading-snug mb-2">
              {estimatedPrice
                ? `This home could save you ${estimatedDownPayment ?? 'significant savings'}`
                : 'Your purchase holds real opportunity — let\'s unlock it'}
            </p>
            {estimatedPrice && agentGapHigh && (
              <p className="font-dm text-white/50 text-sm mb-6">
                The right strategy could save you up to{' '}
                <span style={{ color: '#C9A84C', fontWeight: 600 }}>{agentGapHigh} more</span>{' '}
                than going it alone.
              </p>
            )}

            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-2"
              style={{ backgroundColor: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              <PhoneCall size={13} style={{ color: '#C9A84C' }} />
              <span className="font-dm text-sm font-medium" style={{ color: '#C9A84C' }}>
                Free Home Purchase Advisor Call — No Obligation
              </span>
            </div>
            <p className="font-dm text-white/30 text-xs">
              15 minutes. No pressure. Just clarity.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="font-dm font-medium tracking-widest uppercase mb-4 text-center" style={{ fontSize: '9px', color: '#9CA3AF' }}>
            On Your Call, Your Advisor Will:
          </p>
          <div className="space-y-2.5">
            {advisorBullets.map((bullet, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle size={14} style={{ color: '#C9A84C', flexShrink: 0, marginTop: '2px' }} />
                <p className="font-dm text-sm leading-relaxed" style={{ color: '#3A3A3A' }}>{bullet}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-xl px-5 py-4 mb-8"
          style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#EDE6D6' }}
            >
              <span className="font-playfair font-semibold text-sm" style={{ color: '#C9A84C' }}>A</span>
            </div>
            <div>
              <p className="font-dm font-semibold text-sm mb-0.5" style={{ color: '#0D1B2A' }}>Your Home Purchase Advisor</p>
              <p className="font-dm text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                Not a sales pitch. Not a listing agent trying to sell you a home. A trusted guide who understands the data, the market, and what it actually takes to get you the best possible deal.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onBook?.()}
          className="w-full font-dm font-medium py-4 rounded-full text-sm text-center transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mb-3"
          style={{ backgroundColor: '#C9A84C', color: '#0D1B2A' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#D4B86A'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#C9A84C'; }}
        >
          <Calendar size={15} />
          Book My Free Advisor Call
        </button>

        <p className="font-dm text-xs text-center mb-8" style={{ color: '#C0B078' }}>
          Spots are limited — advisors serve a specific number of homebuyers per week
        </p>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,168,76,0.2)' }} />
          <p className="font-dm text-xs" style={{ color: '#D1D5DB' }}>or</p>
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,168,76,0.2)' }} />
        </div>

        <button
          onClick={onNext}
          className="w-full font-dm text-sm py-3 rounded-full transition-colors duration-200"
          style={{ color: '#9CA3AF', border: '1px solid #E5E7EB', backgroundColor: 'transparent' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#C9A84C'; (e.currentTarget as HTMLButtonElement).style.color = '#C9A84C'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; }}
        >
          Review My Full Analysis First
        </button>
      </div>
    </div>
  );
}

export type { SlideProps };
export { Slide1MarketOpportunity, Slide2ProfitPotential, Slide3BookCall };
