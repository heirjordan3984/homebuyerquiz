import { useState } from 'react';
import {
  TrendingUp, DollarSign, MapPin, Clock,
  ArrowRight, Zap, Star, CheckCircle, ChevronRight,
  Home, Calculator, Percent, Wallet, ShieldCheck, Building2,
} from 'lucide-react';
import type { QuizResult } from '../utils/quizLogic';
import type { PlaceDetails } from './AddressAutocomplete';
import type { RentcastData } from '../types/rentcast';

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

const BUDGET_RANGES: [number, number | null][] = [
  [0, 250_000],
  [250_000, 450_000],
  [450_000, 700_000],
  [700_000, 1_000_000],
  [1_000_000, null],
];

const BUDGET_LABELS = ['Under $250K', '$250K–$450K', '$450K–$700K', '$700K–$1M', '$1M+'];

interface SlideProps {
  result: QuizResult;
  placeDetails?: PlaceDetails | null;
  addressText?: string | null;
  rentcastData?: RentcastData | null;
  rentcastLoading?: boolean;
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  downPaymentAnswer?: number | null;
  budgetAnswer?: number | null;
  onNext: () => void;
  isLoading?: boolean;
  onRetake?: () => void;
}

function extractCity(address: string | null | undefined): string | null {
  if (!address) return null;
  const parts = address.replace(/, USA$/, '').split(',');
  return parts.length >= 1 ? parts[0].trim() : null;
}

function extractCityState(address: string | null | undefined): string | null {
  if (!address) return null;
  const cleaned = address.replace(/, USA$/, '').trim();
  return cleaned || address;
}

/* ---------- Mortgage calculation helpers ---------- */

function calcMonthlyPayment(principal: number, annualRate: number, years: number): number {
  if (annualRate <= 0) return principal / (years * 12);
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
}

function calcAffordablePrice(
  monthlyPayment: number,
  annualRate: number,
  downPaymentPct: number,
  years = 30,
): number {
  if (annualRate <= 0) return (monthlyPayment * years * 12) / (1 - downPaymentPct);
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  const loanFactor = (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  const maxLoan = monthlyPayment / loanFactor;
  return maxLoan / (1 - downPaymentPct);
}

/* ---------- Fairway Home Mortgage box ---------- */

function FairwayMortgageBox({ city, budgetAnswer }: { city: string | null; budgetAnswer?: number | null }) {
  const budgetLabel = budgetAnswer != null ? BUDGET_LABELS[budgetAnswer] : null;

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6"
      style={{ border: '1.5px solid #E8E0C8', backgroundColor: '#FDFAF4' }}
    >
      <div
        className="px-5 py-3.5 flex items-center gap-2.5"
        style={{ backgroundColor: '#0D1B2A', borderBottom: '1px solid rgba(201,168,76,0.2)' }}
      >
        <Building2 size={14} style={{ color: '#C9A84C' }} />
        <span className="font-dm font-medium tracking-widest uppercase text-white/70" style={{ fontSize: '12.5px' }}>
          Recommended Lender
        </span>
      </div>

      <div className="px-5 pt-5 pb-5">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#0D1B2A' }}
          >
            <span className="font-playfair font-bold text-lg" style={{ color: '#C9A84C' }}>F</span>
          </div>
          <div>
            <p className="font-playfair font-semibold" style={{ fontSize: '17px', color: '#0D1B2A', lineHeight: 1.2 }}>
              Fairway Home Mortgage
            </p>
            <p className="font-dm mt-0.5" style={{ fontSize: '12px', color: '#6B7280' }}>
              Independent Mortgage Lender
            </p>
          </div>
        </div>

        <div
          className="rounded-xl px-4 py-3 mb-4"
          style={{ backgroundColor: '#FFF8EC', border: '1px solid rgba(201,168,76,0.25)' }}
        >
          <p className="font-dm leading-relaxed" style={{ fontSize: '13.5px', color: '#3A3A3A' }}>
            Getting pre-qualified is the first real step to buying a home. It tells you exactly what you can afford,
            shows sellers you're serious, and locks in your budget before you start touring.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-lg px-2 py-2 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0C8' }}>
            <Clock size={13} style={{ color: '#C9A84C' }} className="mx-auto mb-1" />
            <p className="font-dm font-medium" style={{ fontSize: '10.5px', color: '#0D1B2A' }}>Quick</p>
            <p className="font-dm" style={{ fontSize: '9px', color: '#9CA3AF' }}>~10 min</p>
          </div>
          <div className="rounded-lg px-2 py-2 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0C8' }}>
            <ShieldCheck size={13} style={{ color: '#2D6A4F' }} className="mx-auto mb-1" />
            <p className="font-dm font-medium" style={{ fontSize: '10.5px', color: '#0D1B2A' }}>No Cost</p>
            <p className="font-dm" style={{ fontSize: '9px', color: '#9CA3AF' }}>Free, no obligation</p>
          </div>
          <div className="rounded-lg px-2 py-2 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0C8' }}>
            <Zap size={13} style={{ color: '#C9A84C' }} className="mx-auto mb-1" />
            <p className="font-dm font-medium" style={{ fontSize: '10.5px', color: '#0D1B2A' }}>Strengthens</p>
            <p className="font-dm" style={{ fontSize: '9px', color: '#9CA3AF' }}>Your offer</p>
          </div>
        </div>

        {budgetLabel && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(45,106,79,0.06)', border: '1px solid rgba(45,106,79,0.15)' }}>
            <Wallet size={12} style={{ color: '#2D6A4F' }} />
            <p className="font-dm" style={{ fontSize: '12px', color: '#2D6A4F' }}>
              Based on your <strong>{budgetLabel}</strong> range, a pre-qualification will confirm your exact buying power.
            </p>
          </div>
        )}

        <a
          href="https://www.fairwayindependentmc.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full font-dm font-medium py-3.5 rounded-full text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#C9A84C', color: '#0D1B2A' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#D4B86A'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#C9A84C'; }}
        >
          Get Pre-Qualified with Fairway
          <ArrowRight size={14} />
        </a>
        <p className="font-dm text-center mt-2" style={{ fontSize: '10px', color: '#9CA3AF' }}>
          Soft recommendation — you're free to use any lender.
        </p>
      </div>
    </div>
  );
}

/* ---------- Top-Buyer Checklist ---------- */

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

/* ---------- Homes in Your Price Range Grid ---------- */

const HOME_THUMBNAILS = [
  'https://images.pexels.com/photos/30580640/pexels-photo-30580640.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'https://images.pexels.com/photos/8583638/pexels-photo-8583638.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'https://images.pexels.com/photos/33350023/pexels-photo-33350023.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'https://images.pexels.com/photos/4832530/pexels-photo-4832530.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'https://images.pexels.com/photos/7710011/pexels-photo-7710011.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
];

function HomesInBudgetGrid({ city, listings }: {
  city: string | null;
  listings: { id: string; formattedAddress: string; price: number; bedrooms?: number; bathrooms?: number; squareFootage?: number }[] | null;
}) {
  const location = city ?? 'Your Area';
  const top6 = (listings ?? []).slice(0, 6);

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
          <Home size={13} style={{ color: '#C9A84C' }} />
          <span className="font-dm font-medium tracking-widest uppercase text-white/70" style={{ fontSize: '12.5px' }}>
            Homes in {location} in Your Price Range
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
          <span className="font-dm text-white/50 text-xs">Live Listings</span>
        </div>
      </div>

      <div className="px-5 pt-4 pb-3">
        <div className="grid grid-cols-2 gap-3">
          {top6.map((home, i) => (
            <div
              key={home.id}
              className="rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.03]"
              style={{ border: '1px solid #E8E0C8', backgroundColor: '#FFFFFF' }}
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: '3 / 2' }}>
                <img
                  src={HOME_THUMBNAILS[i % HOME_THUMBNAILS.length]}
                  alt="Home listing"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5"
                  style={{ background: 'linear-gradient(to top, rgba(13,27,42,0.85), transparent)' }}
                >
                  <span className="font-playfair font-bold text-white" style={{ fontSize: '16px' }}>
                    {formatCurrencyShort(home.price)}
                  </span>
                </div>
              </div>
              <div className="px-2.5 py-2">
                <p className="font-dm truncate" style={{ fontSize: '10.5px', color: '#6B7280', lineHeight: 1.3 }}>
                  {home.formattedAddress}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {home.bedrooms != null && (
                    <span className="font-dm" style={{ fontSize: '10px', color: '#0D1B2A' }}>
                      {home.bedrooms} bd
                    </span>
                  )}
                  {home.bathrooms != null && (
                    <span className="font-dm" style={{ fontSize: '10px', color: '#0D1B2A' }}>
                      {home.bathrooms} ba
                    </span>
                  )}
                  {home.squareFootage != null && (
                    <span className="font-dm" style={{ fontSize: '10px', color: '#6B7280' }}>
                      {home.squareFootage.toLocaleString()} sqft
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {top6.length === 0 && (
          <div className="text-center py-8">
            <Home size={28} style={{ color: '#C9A84C', margin: '0 auto 8px' }} />
            <p className="font-dm" style={{ fontSize: '13px', color: '#6B7280' }}>
              No active listings found in your price range right now.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pb-1 pt-3 mt-1" style={{ borderTop: '1px solid #EDE6D6' }}>
          <span className="font-dm text-xs" style={{ color: '#9CA3AF' }}>
            Active listings in your budget range
          </span>
          <span className="font-dm font-medium text-xs" style={{ color: '#C9A84C' }}>
            Updated daily
          </span>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, subLabel, valueColor, accent }: {
  label: string;
  value: string;
  subLabel?: string;
  valueColor?: string;
  accent?: 'gold';
}) {
  return (
    <div
      className="rounded-lg px-3 py-2.5 text-center"
      style={{
        backgroundColor: accent === 'gold' ? 'rgba(201,168,76,0.08)' : 'rgba(74,222,128,0.06)',
        border: accent === 'gold' ? '1px solid rgba(201,168,76,0.18)' : '1px solid rgba(74,222,128,0.2)',
      }}
    >
      <p className="font-dm font-medium tracking-widest uppercase mb-1" style={{ fontSize: '11px', color: '#0D1B2A' }}>{label}</p>
      <p className="font-playfair font-semibold leading-none" style={{ fontSize: '20px', color: valueColor ?? '#0D1B2A' }}>{value}</p>
      {subLabel && <p className="font-dm mt-0.5" style={{ fontSize: '10px', color: '#6B7280' }}>{subLabel}</p>}
    </div>
  );
}

/* ============================================================
   SLIDE 1 — Market Intelligence for Your Area
   ============================================================ */

function Slide1MarketOpportunity({ placeDetails, addressText, rentcastData, onNext, isLoading, onRetake }: SlideProps) {
  const address = placeDetails?.address ?? addressText ?? 'Your Market';
  const cityState = extractCityState(address) ?? address;
  const city = extractCity(address);

  const market = rentcastData?.market ?? null;

  const marketAvgDays = market?.averageDaysOnMarket ? Math.round(market.averageDaysOnMarket) : null;
  const avgDays = marketAvgDays;
  const saleListRatio = market?.saleToListRatio ? (market.saleToListRatio * 100).toFixed(1) : null;
  const medianSale = market?.medianSalePrice ? formatCurrencyShort(market.medianSalePrice) : null;
  const pricePerSqft = market?.averagePricePerSquareFoot ? `${Math.round(market.averagePricePerSquareFoot)}` : null;

  // Homes for sale in the user's budget (from nearby listings already filtered by price range)
  const nearbyListings = rentcastData?.nearbyListings ?? null;
  const homesInBudget = nearbyListings ? nearbyListings.length : null;

  // Derive avg days on market from active listings when the market endpoint doesn't provide it
  const avgDaysFromListings = (() => {
    if (!nearbyListings || nearbyListings.length === 0) return null;
    const days = nearbyListings
      .map((l) => l.daysOnMarket)
      .filter((d): d is number => typeof d === 'number' && d >= 0);
    if (days.length === 0) return null;
    return Math.round(days.reduce((s, d) => s + d, 0) / days.length);
  })();

  const resolvedAvgDays = avgDays ?? avgDaysFromListings;

  const history = market?.history ?? [];

  const last6Months = history.slice(-6);
  const prev6Months = history.slice(-12, -6);
  const priceTrend = (() => {
    if (last6Months.length === 0 || prev6Months.length === 0) return null;
    const recentAvg = last6Months.reduce((s, h) => s + (h.medianPrice ?? 0), 0) / last6Months.length;
    const prevAvg = prev6Months.reduce((s, h) => s + (h.medianPrice ?? 0), 0) / prev6Months.length;
    if (prevAvg === 0) return null;
    return ((recentAvg - prevAvg) / prevAvg) * 100;
  })();

  const marketAngle = (() => {
    if (!market) return 'opportunity';
    if (market.saleToListRatio && market.saleToListRatio >= 0.99) return 'buyers';
    if (market.averageDaysOnMarket && market.averageDaysOnMarket <= 30) return 'fast';
    return 'opportunity';
  })();

  const headlineMap: Record<string, string> = {
    buyers: `${city ?? 'Your Area'} Is a Fast-Moving Market`,
    fast: `${city ?? 'Your Area'} Homes Are Selling Fast`,
    opportunity: `${city ?? 'Your Area'} Has Real Opportunity Right Now`,
  };

  const subheadMap: Record<string, string> = {
    buyers: `Inventory is tight and homes are going under contract quickly. Buyers who move with financing ready are winning.`,
    fast: resolvedAvgDays ? `The average home here goes under contract in just ${resolvedAvgDays} days. Prepared buyers with pre-approval letters are the ones getting accepted offers.` : `Prepared buyers with pre-approval letters are the ones getting accepted offers.`,
    opportunity: `Prices are holding steady${priceTrend !== null ? (priceTrend >= 0 ? ' and trending up' : ' but softening') : ''}. Well-prepared buyers have room to negotiate.`,
  };

  const headline = headlineMap[marketAngle];
  const subhead = subheadMap[marketAngle];

  const insights: { icon: React.ElementType; title: string; body: string }[] = [];

  if (saleListRatio) {
    const ratioNum = parseFloat(saleListRatio);
    insights.push({
      icon: TrendingUp,
      title: `${saleListRatio}% Sale-to-List Ratio`,
      body: ratioNum >= 99
        ? `Homes in ${city ?? 'this area'} are selling at or above asking price. You need a strong, clean offer to win.`
        : `Homes are selling close to list price at ${saleListRatio}%. There's room to negotiate if you're prepared.`,
    });
  }

  if (pricePerSqft) {
    insights.push({
      icon: Home,
      title: `$${pricePerSqft}/sq ft Average`,
      body: `The average price per square foot in ${city ?? 'this area'} is $${pricePerSqft}. This helps you compare homes apples-to-apples — a 1,500 sq ft home should run roughly $${(parseInt(pricePerSqft) * 1500).toLocaleString()}.`,
    });
  }

  if (priceTrend !== null) {
    insights.push({
      icon: priceTrend >= 0 ? TrendingUp : TrendingUp,
      title: priceTrend >= 0 ? `Prices Up ${priceTrend.toFixed(1)}% (6-mo trend)` : `Prices Down ${Math.abs(priceTrend).toFixed(1)}% (6-mo trend)`,
      body: priceTrend >= 0
        ? `Median prices in ${city ?? 'this area'} have risen ${priceTrend.toFixed(1)}% over the last 6 months compared to the prior 6. Waiting could cost you more in purchase price.`
        : `Median prices have softened ${Math.abs(priceTrend).toFixed(1)}% recently. This can work in your favor — sellers may be more open to negotiation.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: TrendingUp,
      title: 'Be Ready to Act',
      body: `Market data for ${city ?? 'this area'} is limited, but the principle holds: prepared buyers with pre-approval get better deals. Start with your financing.`,
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
            style={{ fontSize: 'clamp(1.75rem, 6vw, 3rem)', color: '#0D1B2A' }}
          >
            {isLoading ? 'Analyzing Your Market…' : headline}
          </h1>
          {!isLoading && (
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
            {/* Key insights */}
            <div className="space-y-3 mb-6">
              {insights.map((m, i) => (
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

            {/* Live market data for the user's city */}
            {(medianSale || resolvedAvgDays != null || saleListRatio || pricePerSqft || homesInBudget != null) && (
              <div className="mb-6">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: '1.5px solid #E8E0C8', backgroundColor: '#FDFAF4' }}
                >
                  <div className="px-5 py-4 text-center" style={{ backgroundColor: '#0D1B2A' }}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <MapPin size={16} style={{ color: '#C9A84C' }} />
                      <span className="font-dm font-medium tracking-widest uppercase" style={{ fontSize: '10px', color: 'rgba(201,168,76,0.7)' }}>
                        Live Market Data
                      </span>
                    </div>
                    <p className="font-playfair font-bold" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                      {city ?? 'Your Area'}
                    </p>
                    {cityState && cityState !== city && (
                      <p className="font-dm mt-0.5" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                        {cityState}
                      </p>
                    )}
                  </div>
                  <div className="px-5 py-5">
                    {/* Primary stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {medianSale && <StatBox label="Median Sale" value={medianSale} />}
                      {resolvedAvgDays != null && <StatBox label="Avg Days on Market" value={String(resolvedAvgDays)} subLabel={avgDaysFromListings != null ? 'from active listings' : 'avg time to contract'} />}
                      {saleListRatio && <StatBox label="Sale/List Ratio" value={`${saleListRatio}%`} valueColor="#2D6A4F" />}
                      {pricePerSqft && <StatBox label="Price / Sq Ft" value={pricePerSqft} />}
                    </div>

                    {/* Inventory stats row */}
                    {homesInBudget != null && (
                      <div className="mt-3 pt-4" style={{ borderTop: '1px solid #E8E0C8' }}>
                        <div className="grid grid-cols-2 gap-3">
                          {homesInBudget != null && (
                            <StatBox label="Homes in Your Budget" value={String(homesInBudget)} subLabel="active listings nearby" accent="gold" />
                          )}
                          <StatBox label="Monthly Buyer-Intent Searches" value="36,500" subLabel="organic search volume" accent="gold" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Homes in your price range */}
            <div className="mb-6">
              <HomesInBudgetGrid city={city} listings={nearbyListings} />
            </div>

            <div
              className="rounded-xl px-5 py-4 mb-8 flex items-start gap-3"
              style={{ backgroundColor: '#FFF8EC', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              <Zap size={14} style={{ color: '#C9A84C', flexShrink: 0, marginTop: '2px' }} />
              <p className="font-dm leading-relaxed" style={{ fontSize: '15px', color: '#3A3A3A' }}>
                <strong style={{ color: '#0D1B2A' }}>The bottom line:</strong>{' '}
                {city ? `${city} is` : 'Your area is'} a market where preparation beats speed. Knowing your budget, having financing ready, and understanding local price trends puts you ahead of most buyers.
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
          See Your Budget & Mortgage Numbers
          <ArrowRight size={15} />
        </button>
        {onRetake && (
          <button
            onClick={onRetake}
            className="w-full font-dm font-medium py-3 rounded-full text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 mt-3"
            style={{ backgroundColor: 'transparent', color: '#5A6573', border: '1px solid #E0DAD0' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9F7F2'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
          >
            Start Over
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SLIDE 2 — Budget & Mortgage: What Can You Actually Afford?
   ============================================================ */

function Slide2BudgetMortgage({ placeDetails, addressText, rentcastData, downPaymentAnswer, budgetAnswer, isLoading, onNext, onRetake }: SlideProps) {
  const city = extractCity(placeDetails?.address ?? addressText);
  const market = rentcastData?.market ?? null;
  const medianPrice = market?.medianSalePrice ?? market?.averageSalePrice ?? null;

  // User's budget range from the quiz answer
  const userBudgetRange = budgetAnswer != null ? BUDGET_RANGES[budgetAnswer] : null;
  const userBudgetLabel = budgetAnswer != null ? BUDGET_LABELS[budgetAnswer] : null;

  // Down payment
  const defaultDownPaymentPct = 19;
  const [downPaymentPct, setDownPaymentPct] = useState(defaultDownPaymentPct);

  // Current mortgage rate environment (as of 2026, realistic range)
  const rateLow = 6.25;
  const rateHigh = 7.25;
  const rateMid = (rateLow + rateHigh) / 2;

  // Determine the affordable price range
  // Use the user's budget range as the starting point, then show what they could actually afford
  // based on a 28% DTI rule with median income estimates

  // If we have market data, use it to show what homes actually cost here
  // and combine with their budget to give a realistic range

  const affordablePriceLow = (() => {
    if (userBudgetRange) return userBudgetRange[0];
    if (medianPrice) return Math.round(medianPrice * 0.85);
    return 250_000;
  })();

  const affordablePriceHigh = (() => {
    if (userBudgetRange && userBudgetRange[1]) return userBudgetRange[1];
    if (userBudgetRange && !userBudgetRange[1]) return userBudgetRange[0] * 1.5;
    if (medianPrice) return Math.round(medianPrice * 1.15);
    return 450_000;
  })();

  // If we have median price, blend it in to show the real picture
  const displayLow = medianPrice
    ? Math.min(affordablePriceLow, Math.round(medianPrice * 0.9))
    : affordablePriceLow;
  const displayHigh = medianPrice
    ? Math.max(affordablePriceHigh ?? 0, Math.round(medianPrice * 1.1))
    : affordablePriceHigh;

  // Loan amounts at low and high ends
  const loanLow = Math.round(displayLow * (1 - downPaymentPct / 100));
  const loanHigh = Math.round(displayHigh * (1 - downPaymentPct / 100));

  // Monthly payments at low/high rates for low/high prices
  const monthlyPaymentLowRateLowPrice = Math.round(calcMonthlyPayment(loanLow, rateLow, 30));
  const monthlyPaymentHighRateLowPrice = Math.round(calcMonthlyPayment(loanLow, rateHigh, 30));
  const monthlyPaymentLowRateHighPrice = Math.round(calcMonthlyPayment(loanHigh, rateLow, 30));
  const monthlyPaymentHighRateHighPrice = Math.round(calcMonthlyPayment(loanHigh, rateHigh, 30));

  // Down payment dollar amounts
  const dpLow = Math.round(displayLow * (downPaymentPct / 100));
  const dpHigh = Math.round(displayHigh * (downPaymentPct / 100));

  // What you can afford at 28% DTI (estimate using budget range midpoint)
  const estimatedIncome = (() => {
    if (!userBudgetRange) return 80_000;
    const mid = userBudgetRange[1] ? (userBudgetRange[0] + userBudgetRange[1]) / 2 : userBudgetRange[0] * 1.2;
    // Reverse-engineer income from budget: assume ~3.5x income = affordable home
    return Math.round(mid / 3.5);
  })();

  const maxMonthlyPI = Math.round((estimatedIncome / 12) * 0.28);
  const maxAffordablePrice = Math.round(calcAffordablePrice(maxMonthlyPI, rateMid, downPaymentPct / 100));

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
            Your Budget & Mortgage
          </p>
          <h1
            className="font-playfair leading-tight text-center mb-3"
            style={{ fontSize: 'clamp(1.75rem, 6vw, 3rem)', color: '#0D1B2A' }}
          >
            {isLoading ? 'Calculating Your Numbers…' : `What You Can Afford in ${city ?? 'Your Area'}`}
          </h1>
          {!isLoading && (
            <p className="font-dm text-sm leading-relaxed text-center" style={{ color: '#6B7280', maxWidth: '480px', margin: '0 auto' }}>
              Based on your budget range{userBudgetLabel ? ` (${userBudgetLabel})` : ''} and a {downPaymentPct}% down payment, here's what your purchase could look like — with real mortgage rate and payment estimates.
            </p>
          )}
        </div>

        {isLoading && (
          <div className="space-y-4 mb-8 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #E8E0C8' }}>
                <div className="h-4 rounded w-32 mx-auto mb-4" style={{ backgroundColor: '#E5E7EB' }} />
                <div className="h-12 rounded w-48 mx-auto" style={{ backgroundColor: '#E8E0C8' }} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (
          <>
            {/* Affordable price range */}
            <div
              className="rounded-2xl overflow-hidden mb-5"
              style={{ border: '1.5px solid #E8E0C8' }}
            >
              <div className="px-5 py-3.5 flex items-center gap-2.5" style={{ backgroundColor: '#0D1B2A' }}>
                <Home size={14} style={{ color: '#C9A84C' }} />
                <span className="font-dm font-medium tracking-widest uppercase text-white/70" style={{ fontSize: '12.5px' }}>
                  Your Affordable Price Range
                </span>
              </div>

              <div className="px-5 py-5" style={{ backgroundColor: '#FDFAF4' }}>
                <div className="text-center mb-5">
                  <p className="font-playfair font-bold leading-none mb-2" style={{ fontSize: 'clamp(1.75rem, 7vw, 2.75rem)', color: '#2D6A4F', letterSpacing: '-0.02em' }}>
                    {formatCurrencyShort(displayLow)} – {formatCurrencyShort(displayHigh)}
                  </p>
                  <p className="font-dm" style={{ fontSize: '13px', color: '#6B7280' }}>
                    {medianPrice
                      ? `Median sale price in ${city ?? 'this area'}: ${formatCurrencyShort(medianPrice)}`
                      : userBudgetLabel
                        ? `Based on your stated range of ${userBudgetLabel}`
                        : 'Estimated based on typical buyer profiles'}
                  </p>
                </div>

                {/* Price range visual bar */}
                <div className="mb-5">
                  <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
                    <div
                      className="absolute h-full rounded-full"
                      style={{
                        left: '15%',
                        right: '15%',
                        background: 'linear-gradient(to right, #2D6A4F, #C9A84C)',
                      }}
                    />
                    {medianPrice && (
                      <div
                        className="absolute top-0 h-full"
                        style={{
                          left: '50%',
                          width: '2px',
                          backgroundColor: '#0D1B2A',
                          transform: 'translateX(-50%)',
                        }}
                      />
                    )}
                  </div>
                  {medianPrice && (
                    <p className="font-dm text-center mt-1.5" style={{ fontSize: '10px', color: '#9CA3AF' }}>
                      <span style={{ color: '#0D1B2A', fontWeight: 600 }}>|</span> = area median ({formatCurrencyShort(medianPrice)})
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3.5 text-center" style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                    <p className="font-dm font-medium tracking-widest uppercase mb-1" style={{ fontSize: '11px', color: '#0D1B2A' }}>
                      Conservative End
                    </p>
                    <p className="font-playfair font-semibold" style={{ fontSize: '18px', color: '#0D1B2A' }}>
                      {formatCurrencyShort(displayLow)}
                    </p>
                    <p className="font-dm mt-0.5" style={{ fontSize: '10px', color: '#6B7280' }}>
                      Down: {formatCurrencyShort(dpLow)}
                    </p>
                  </div>
                  <div className="rounded-xl p-3.5 text-center" style={{ backgroundColor: '#FFF8EC', border: '1px solid rgba(201,168,76,0.25)' }}>
                    <p className="font-dm font-medium tracking-widest uppercase mb-1" style={{ fontSize: '11px', color: '#0D1B2A' }}>
                      Top of Range
                    </p>
                    <p className="font-playfair font-semibold" style={{ fontSize: '18px', color: '#0D1B2A' }}>
                      {formatCurrencyShort(displayHigh)}
                    </p>
                    <p className="font-dm mt-0.5" style={{ fontSize: '10px', color: '#6B7280' }}>
                      Down: {formatCurrencyShort(dpHigh)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Down payment slider */}
            <div
              className="rounded-2xl overflow-hidden mb-5"
              style={{ border: '1.5px solid #E8E0C8', backgroundColor: '#FDFAF4' }}
            >
              <div className="px-5 py-3.5 flex items-center gap-2.5" style={{ borderBottom: '1px solid #E8E0C8' }}>
                <Wallet size={14} style={{ color: '#C9A84C' }} />
                <span className="font-dm font-medium tracking-widest uppercase" style={{ fontSize: '11px', color: '#0D1B2A' }}>
                  Down Payment: {downPaymentPct}%
                </span>
              </div>
              <div className="px-5 py-4">
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
                <div className="flex justify-between mt-1.5">
                  <span className="font-dm" style={{ fontSize: '10px', color: '#9CA3AF' }}>5%</span>
                  <span className="font-dm" style={{ fontSize: '10px', color: '#9CA3AF' }}>20%</span>
                  <span className="font-dm" style={{ fontSize: '10px', color: '#9CA3AF' }}>50%</span>
                  <span className="font-dm" style={{ fontSize: '10px', color: '#9CA3AF' }}>100%</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="text-center">
                    <p className="font-dm font-medium tracking-widest uppercase mb-0.5" style={{ fontSize: '11px', color: '#0D1B2A' }}>
                      At {formatCurrencyShort(displayLow)}
                    </p>
                    <p className="font-playfair font-semibold" style={{ fontSize: '17px', color: '#0D1B2A' }}>
                      {formatCurrencyShort(dpLow)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-dm font-medium tracking-widest uppercase mb-0.5" style={{ fontSize: '11px', color: '#0D1B2A' }}>
                      At {formatCurrencyShort(displayHigh)}
                    </p>
                    <p className="font-playfair font-semibold" style={{ fontSize: '17px', color: '#0D1B2A' }}>
                      {formatCurrencyShort(dpHigh)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mortgage rate & monthly payment */}
            <div
              className="rounded-2xl overflow-hidden mb-5"
              style={{ border: '1.5px solid #E8E0C8' }}
            >
              <div className="px-5 py-3.5 flex items-center gap-2.5" style={{ backgroundColor: '#0D1B2A' }}>
                <Percent size={14} style={{ color: '#C9A84C' }} />
                <span className="font-dm font-medium tracking-widest uppercase text-white/70" style={{ fontSize: '12.5px' }}>
                  Expected Mortgage Rate & Monthly Payment
                </span>
              </div>

              <div className="px-5 py-5" style={{ backgroundColor: '#FDFAF4' }}>
                {/* Rate range */}
                <div className="text-center mb-5">
                  <p className="font-dm font-medium tracking-widest uppercase mb-1" style={{ fontSize: '9px', color: '#9CA3AF' }}>
                    Current 30-Year Fixed Rate Range
                  </p>
                  <p className="font-playfair font-bold leading-none" style={{ fontSize: 'clamp(1.5rem, 6vw, 2.25rem)', color: '#0D1B2A', letterSpacing: '-0.02em' }}>
                    {rateLow.toFixed(2)}% – {rateHigh.toFixed(2)}%
                  </p>
                  <p className="font-dm mt-1.5" style={{ fontSize: '11px', color: '#6B7280' }}>
                    Rates vary by credit score, loan type, and lender. Your actual rate depends on your profile.
                  </p>
                </div>

                {/* Payment scenarios grid */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid #E8E0C8' }}
                >
                  <div className="grid grid-cols-3 px-3 py-2" style={{ backgroundColor: '#F3F4F6', borderBottom: '1px solid #E8E0C8' }}>
                    <p className="font-dm font-medium tracking-widest uppercase" style={{ fontSize: '11px', color: '#0D1B2A' }}>Scenario</p>
                    <p className="font-dm font-medium tracking-widest uppercase text-center" style={{ fontSize: '11px', color: '#0D1B2A' }}>Rate</p>
                    <p className="font-dm font-medium tracking-widest uppercase text-right" style={{ fontSize: '11px', color: '#0D1B2A' }}>Mo. Payment</p>
                  </div>

                  <PaymentRow label="Lower price, best rate" rate={rateLow} payment={monthlyPaymentLowRateLowPrice} highlight="green" />
                  <PaymentRow label="Lower price, higher rate" rate={rateHigh} payment={monthlyPaymentHighRateLowPrice} />
                  <PaymentRow label="Higher price, best rate" rate={rateLow} payment={monthlyPaymentLowRateHighPrice} />
                  <PaymentRow label="Higher price, higher rate" rate={rateHigh} payment={monthlyPaymentHighRateHighPrice} highlight="gold" />
                </div>

                <p className="font-dm mt-3" style={{ fontSize: '10.5px', color: '#9CA3AF', lineHeight: 1.4 }}>
                  Principal & interest only. Add ~1% of home value annually for property tax, ~$1,200/yr for insurance, and PMI if down payment is below 20%.
                </p>
              </div>
            </div>

            {/* What you can afford at 28% DTI */}
            <div
              className="rounded-2xl overflow-hidden mb-8"
              style={{ border: '1.5px solid #E8E0C8', backgroundColor: '#0D1B2A' }}
            >
              <div className="px-5 py-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <Calculator size={14} style={{ color: '#C9A84C' }} />
                  <span className="font-dm font-medium tracking-widest uppercase" style={{ fontSize: '10px', color: 'rgba(201,168,76,0.8)' }}>
                    28% Rule: Max Affordable Payment
                  </span>
                </div>
                <p className="font-dm text-white/60 leading-relaxed mb-4" style={{ fontSize: '13px' }}>
                  Lenders typically want your monthly housing payment (P&I + taxes + insurance) at or below 28% of gross monthly income.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
                    <p className="font-dm font-medium tracking-widest uppercase mb-1" style={{ fontSize: '11px', color: 'rgba(201,168,76,0.6)' }}>
                      Est. Max Monthly Payment
                    </p>
                    <p className="font-playfair font-semibold leading-none" style={{ fontSize: '22px', color: '#C9A84C' }}>
                      {formatCurrencyShort(maxMonthlyPI)}
                    </p>
                  </div>
                  <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
                    <p className="font-dm font-medium tracking-widest uppercase mb-1" style={{ fontSize: '11px', color: 'rgba(201,168,76,0.6)' }}>
                      Max Affordable Price
                    </p>
                    <p className="font-playfair font-semibold leading-none" style={{ fontSize: '22px', color: '#FFFFFF' }}>
                      {formatCurrencyShort(maxAffordablePrice)}
                    </p>
                  </div>
                </div>
                <p className="font-dm mt-3" style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.3)' }}>
                  Estimate based on a {downPaymentPct}% down payment and {rateMid.toFixed(2)}% rate. Actual qualification depends on credit, debt, and income verification.
                </p>
              </div>
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
          See Your Buyer Checklist & Lender Rec
          <ArrowRight size={15} />
        </button>
        {onRetake && (
          <button
            onClick={onRetake}
            className="w-full font-dm font-medium py-3 rounded-full text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 mt-3"
            style={{ backgroundColor: 'transparent', color: '#5A6573', border: '1px solid #E0DAD0' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9F7F2'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
          >
            Start Over
          </button>
        )}
      </div>
    </div>
  );
}

function PaymentRow({ label, rate, payment, highlight }: { label: string; rate: number; payment: number; highlight?: 'green' | 'gold' }) {
  const bg = highlight === 'green' ? 'rgba(45,106,79,0.06)' : highlight === 'gold' ? 'rgba(201,168,76,0.08)' : 'transparent';
  const labelColor = highlight === 'green' ? '#2D6A4F' : highlight === 'gold' ? '#92700F' : '#3A3A3A';
  const paymentColor = highlight === 'green' ? '#2D6A4F' : highlight === 'gold' ? '#C9A84C' : '#0D1B2A';

  return (
    <div className="grid grid-cols-3 px-3 py-2.5 items-center" style={{ backgroundColor: bg, borderBottom: '1px solid #F0EBE0' }}>
      <p className="font-dm" style={{ fontSize: '11.5px', color: labelColor }}>{label}</p>
      <p className="font-dm font-medium text-center" style={{ fontSize: '12px', color: '#6B7280' }}>{rate.toFixed(2)}%</p>
      <p className="font-playfair font-semibold text-right" style={{ fontSize: '15px', color: paymentColor }}>
        {formatCurrencyShort(payment)}/mo
      </p>
    </div>
  );
}

/* ============================================================
   SLIDE 3 — Buyer Checklist + Fairway Home Mortgage
   ============================================================ */

function Slide3ChecklistLender({ placeDetails, addressText, rentcastData, budgetAnswer, leadName, isLoading, onRetake }: SlideProps) {
  void leadName;
  const city = extractCity(placeDetails?.address ?? addressText);
  const market = rentcastData?.market ?? null;
  const medianPrice = market?.medianSalePrice ?? market?.averageSalePrice ?? null;

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
            Your Action Plan
          </p>
          <h1
            className="font-playfair leading-tight text-center mb-3"
            style={{ fontSize: 'clamp(1.75rem, 6vw, 3rem)', color: '#0D1B2A' }}
          >
            {isLoading ? 'Building Your Plan…' : `${city ? city + ': ' : ''}Your Complete Buyer Playbook`}
          </h1>
          {!isLoading && (
            <div
              className="rounded-2xl px-6 py-8 sm:p-10 text-center mb-8 mt-6"
              style={{ backgroundColor: '#0D1B2A' }}
            >
              <p className="font-dm font-medium tracking-widest uppercase mb-3 text-white/40" style={{ fontSize: '9px' }}>
                The Bottom Line
              </p>
              <h2
                className="font-playfair text-white leading-snug mb-4"
                style={{ fontSize: 'clamp(1.15rem, 4vw, 1.875rem)' }}
              >
                {medianPrice
                  ? `The median home in ${city ?? 'your area'} costs ${formatCurrencyShort(medianPrice)}. Getting pre-qualified is the single fastest way to turn this data into a real purchase.`
                  : `Getting pre-qualified is the single fastest way to turn this data into a real purchase.`}
              </h2>
              <p
                className="font-dm text-white/60 leading-relaxed mb-5 text-sm mx-auto"
                style={{ maxWidth: '440px' }}
              >
                You've done the research. You know the market. The buyers who win are the ones who turn knowledge into action — starting with a 10-minute pre-qualification that costs nothing.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                <div className="flex items-center gap-2 font-dm text-xs" style={{ color: 'rgba(201,168,76,0.7)' }}>
                  <ChevronRight size={12} style={{ color: '#C9A84C' }} />
                  <span>10-minute application</span>
                </div>
                <div className="flex items-center gap-2 font-dm text-xs" style={{ color: 'rgba(201,168,76,0.7)' }}>
                  <ChevronRight size={12} style={{ color: '#C9A84C' }} />
                  <span>No cost, no obligation</span>
                </div>
                <div className="flex items-center gap-2 font-dm text-xs" style={{ color: 'rgba(201,168,76,0.7)' }}>
                  <ChevronRight size={12} style={{ color: '#C9A84C' }} />
                  <span>Strengthens your offer</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {!isLoading && (
          <>
            {/* Top-Buyer Checklist */}
            <TopBuyerChecklist />

            {/* Fairway Home Mortgage recommendation */}
            <FairwayMortgageBox city={city} budgetAnswer={budgetAnswer} />


          </>
        )}

        {onRetake && (
          <button
            onClick={onRetake}
            className="w-full font-dm font-medium py-3 rounded-full text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 mt-4"
            style={{ backgroundColor: 'transparent', color: '#5A6573', border: '1px solid #E0DAD0' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9F7F2'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
          >
            Start Over
          </button>
        )}
      </div>
    </div>
  );
}

export type { SlideProps };
export { Slide1MarketOpportunity, Slide2BudgetMortgage, Slide3ChecklistLender };
