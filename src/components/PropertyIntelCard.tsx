import { User, Home, Banknote, Receipt, Calendar, Users, Sparkles, Building2, AlertTriangle } from 'lucide-react';
import type { BatchDataResponse } from '../types/batchdata';

interface Props {
  batchData: BatchDataResponse | null;
  loading: boolean;
}

function fmtCurrency(v?: number | null): string | null {
  if (v == null || !isFinite(v)) return null;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v.toLocaleString()}`;
}

function fmtNumber(v?: number | null): string | null {
  if (v == null || !isFinite(v)) return null;
  return v.toLocaleString();
}

function fmtDate(d?: string | null): string | null {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function fmtPercent(v?: number | null, decimals = 1): string | null {
  if (v == null || !isFinite(v)) return null;
  return `${v.toFixed(decimals)}%`;
}

function StatRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex items-center justify-between py-2.5 gap-3" style={{ borderBottom: '1px solid rgba(232,224,200,0.45)' }}>
      <span className="font-dm text-xs" style={{ color: '#7A7A7A' }}>{label}</span>
      <span className="font-dm text-sm text-right" style={{ color: '#1A1A1A' }}>{value}</span>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EDE6D6' }}>
        {icon}
      </div>
      <p className="font-dm font-medium tracking-widest uppercase text-xs" style={{ color: '#1A1A1A' }}>
        {title}
      </p>
    </div>
  );
}

function FlagPill({ label, tone = 'neutral' }: { label: string; tone?: 'good' | 'warn' | 'alert' | 'neutral' }) {
  const toneMap = {
    good: { bg: '#D8F3DC', color: '#2D6A4F' },
    warn: { bg: '#FFF3E4', color: '#B5530A' },
    alert: { bg: '#FADBD8', color: '#922B21' },
    neutral: { bg: '#EDE6D6', color: '#7A5E1F' },
  };
  const style = toneMap[tone];
  return (
    <span
      className="inline-block font-dm font-medium text-xs px-2.5 py-1 rounded-full"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {label}
    </span>
  );
}

export default function PropertyIntelCard({ batchData, loading }: Props) {
  if (loading && !batchData) {
    return (
      <div className="rounded-2xl overflow-hidden mb-8 animate-pulse" style={{ border: '1.5px solid #E8E0C8' }}>
        <div className="px-6 py-4 flex items-center gap-3" style={{ backgroundColor: '#0D1B2A' }}>
          <div className="w-9 h-9 rounded-full shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.15)' }} />
          <div className="flex-1">
            <div className="h-2.5 rounded w-40 mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div className="h-3.5 rounded w-56" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
          </div>
        </div>
        <div className="px-6 py-8 space-y-3" style={{ backgroundColor: '#F9F7F2' }}>
          <div className="h-3 rounded w-full" style={{ backgroundColor: '#E8E0C8' }} />
          <div className="h-3 rounded w-3/4" style={{ backgroundColor: '#E8E0C8' }} />
          <div className="h-3 rounded w-5/6" style={{ backgroundColor: '#EDE8DC' }} />
        </div>
      </div>
    );
  }

  if (!batchData?.property) return null;

  const p = batchData.property;
  const owner = p.owner;
  const building = p.building;
  const valuation = p.valuation;
  const assessment = p.assessment;
  const lien = p.openLien;
  const mortgage = lien?.mortgages?.[0];
  const lists = p.quickLists;
  const demo = p.demographics;
  const permit = p.permit;
  const foreclosure = p.foreclosure;
  const ownerProfile = p.propertyOwnerProfile;

  const lastSale = p.sale?.lastSale;
  const priorSale = p.sale?.priorSale;
  const lastSaleDate = lastSale?.saleDate ?? lastSale?.recordingDate ?? p.sale?.lastSaleDate;
  const lastSalePrice = lastSale?.salePrice ?? p.sale?.lastSalePrice;
  const priorSaleDate = priorSale?.saleDate ?? priorSale?.recordingDate ?? p.sale?.priorSaleDate;
  const priorSalePrice = priorSale?.salePrice ?? p.sale?.priorSalePrice;

  const joinedName = [owner?.firstName, owner?.lastName].filter(Boolean).join(' ');
  const ownerName = owner?.fullName ?? owner?.names?.[0]?.full ?? (joinedName || null);

  const mailing = owner?.mailingAddress;
  const mailingStr = mailing
    ? mailing.formattedAddress
      ?? [mailing.street, mailing.city, mailing.state, mailing.zip].filter(Boolean).join(', ')
    : null;


  const flags: { label: string; tone: 'good' | 'warn' | 'alert' | 'neutral' }[] = [];
  if (lists?.ownerOccupied) flags.push({ label: 'Owner-Occupied', tone: 'good' });
  if (lists?.absenteeOwner) flags.push({ label: 'Absentee Owner', tone: 'warn' });
  if (lists?.absenteeOwnerOutOfState) flags.push({ label: 'Out-of-State Owner', tone: 'warn' });
  if (lists?.corporateOwned) flags.push({ label: 'Corporate Owned', tone: 'neutral' });
  if (lists?.highEquity) flags.push({ label: 'High Equity', tone: 'good' });
  if (lists?.freeAndClear) flags.push({ label: 'Free & Clear', tone: 'good' });
  if (lists?.activeListing || lists?.onMarket) flags.push({ label: 'Currently Listed', tone: 'warn' });
  if (lists?.recentlySold) flags.push({ label: 'Recently Sold', tone: 'neutral' });
  if (lists?.vacant) flags.push({ label: 'Vacant', tone: 'alert' });
  if (lists?.preforeclosure || lists?.noticeOfDefault) flags.push({ label: 'Pre-Foreclosure', tone: 'alert' });
  if (lists?.activeAuction || lists?.noticeOfSale) flags.push({ label: 'Auction', tone: 'alert' });
  if (lists?.reo) flags.push({ label: 'REO', tone: 'alert' });
  if (lists?.taxDefault) flags.push({ label: 'Tax Default', tone: 'alert' });
  if (lists?.noticeOfLisPendens) flags.push({ label: 'Lis Pendens', tone: 'alert' });
  if (lists?.involuntaryLien) flags.push({ label: 'Involuntary Lien', tone: 'alert' });
  if (lists?.inherited) flags.push({ label: 'Inherited', tone: 'neutral' });
  if (lists?.trustOwned) flags.push({ label: 'Trust Owned', tone: 'neutral' });
  if (lists?.tiredLandlord) flags.push({ label: 'Tired Landlord', tone: 'warn' });
  if (lists?.cashBuyer) flags.push({ label: 'Cash Buyer', tone: 'neutral' });
  if (lists?.fixAndFlip) flags.push({ label: 'Fix & Flip', tone: 'neutral' });
  if (lists?.forSaleByOwner) flags.push({ label: 'For Sale By Owner', tone: 'warn' });

  const features: string[] = [];
  if (building?.pool) features.push('Pool');
  if (building?.fireplace) features.push('Fireplace');
  if (building?.garageParkingSpaceCount) features.push(`${building.garageParkingSpaceCount}-car garage`);

  const hasOwner = !!(ownerName || mailingStr || owner?.ownershipLength != null);
  const hasBuilding = !!(building && (building.bedroomCount || building.bathroomCount || building.totalBuildingAreaSquareFeet || building.yearBuilt));
  const hasValuation = !!(valuation && (valuation.estimatedValue || valuation.equityCurrentEstimatedBalance != null));
  const hasAssessment = !!(assessment && (assessment.assessedValue || assessment.taxAmount));
  const hasSale = !!(lastSalePrice || lastSaleDate);
  const hasMortgage = !!(mortgage?.loanAmount || lien?.totalOpenLienBalance);
  const hasDemo = !!(demo?.medianHouseholdIncome || demo?.medianHomeValue);
  const hasForeclosure = !!(foreclosure?.status || foreclosure?.filingDate);
  void permit; void ownerProfile;
  const hasInvoluntaryLien = !!(p.involuntaryLien?.liens?.length);


  return (
    <div className="rounded-2xl overflow-hidden mb-8" style={{ border: '1.5px solid #E8E0C8' }}>
      <div className="px-6 py-4 flex items-center gap-3" style={{ backgroundColor: '#0D1B2A' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.2)' }}>
          <Sparkles size={15} style={{ color: '#C9A84C' }} />
        </div>
        <div>
          <p className="font-dm font-medium tracking-widest uppercase text-white/50" style={{ fontSize: '9px' }}>
            Deep Property Intelligence
          </p>
          <p className="font-playfair text-white text-sm leading-snug">
            Owner, Equity &amp; Tax Record
          </p>
        </div>
      </div>

      <div className="px-6 py-6" style={{ backgroundColor: '#F9F7F2' }}>
        {flags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {flags.map((f) => (
              <FlagPill key={f.label} label={f.label} tone={f.tone} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          {hasOwner && (
            <div className="mb-6">
              <SectionHeader icon={<User size={13} style={{ color: '#C9A84C' }} />} title="Ownership" />
              <StatRow label="Owner" value={ownerName} />
              <StatRow label="Mailing" value={mailingStr} />
              <StatRow label="Years owned" value={owner?.ownershipLength != null ? `${owner.ownershipLength} yrs` : null} />
              <StatRow
                label="Occupancy"
                value={
                  lists?.ownerOccupied ? 'Owner-occupied'
                    : lists?.absenteeOwner ? 'Absentee'
                    : p.intel?.ownerOccupied === true ? 'Owner-occupied'
                    : p.intel?.ownerOccupied === false ? 'Absentee'
                    : null
                }
              />
            </div>
          )}

          {hasBuilding && (
            <div className="mb-6">
              <SectionHeader icon={<Home size={13} style={{ color: '#C9A84C' }} />} title="Building" />
              <StatRow label="Bedrooms" value={fmtNumber(building?.bedroomCount)} />
              <StatRow label="Bathrooms" value={building?.bathroomCount != null ? String(building.bathroomCount) : null} />
              <StatRow label="Living area" value={building?.totalBuildingAreaSquareFeet ? `${fmtNumber(building.totalBuildingAreaSquareFeet)} sq ft` : null} />
              <StatRow label="Lot size" value={building?.lotSizeSquareFeet ? `${fmtNumber(building.lotSizeSquareFeet)} sq ft` : null} />
              <StatRow label="Year built" value={fmtNumber(building?.yearBuilt)} />
              <StatRow label="Stories" value={fmtNumber(building?.stories)} />
              <StatRow label="Type" value={building?.propertyType} />
              <StatRow label="Features" value={features.length ? features.join(', ') : null} />
            </div>
          )}

          {hasValuation && (
            <div className="mb-6">
              <SectionHeader icon={<Building2 size={13} style={{ color: '#C9A84C' }} />} title="Valuation & Equity" />
              <StatRow label="Estimated value" value={fmtCurrency(valuation?.estimatedValue)} />
              <StatRow
                label="Value range"
                value={
                  valuation?.priceRangeMin != null && valuation?.priceRangeMax != null
                    ? `${fmtCurrency(valuation.priceRangeMin)} – ${fmtCurrency(valuation.priceRangeMax)}`
                    : null
                }
              />
              <StatRow label="Estimated equity" value={fmtCurrency(valuation?.equityCurrentEstimatedBalance)} />
              <StatRow label="Equity %" value={fmtPercent(valuation?.equityPercent)} />
              <StatRow label="Loan-to-value" value={fmtPercent(valuation?.ltv)} />
              <StatRow label="Confidence" value={valuation?.confidenceScore != null ? String(valuation.confidenceScore) : null} />
              <StatRow label="As of date" value={fmtDate(valuation?.asOfDate)} />
            </div>
          )}

          {hasMortgage && (
            <div className="mb-6">
              <SectionHeader icon={<Banknote size={13} style={{ color: '#C9A84C' }} />} title="Mortgage & Liens" />
              <StatRow label="Original loan" value={fmtCurrency(mortgage?.loanAmount)} />
              <StatRow label="Lender" value={mortgage?.assignedLenderName ?? mortgage?.lenderName} />
              <StatRow label="Loan date" value={fmtDate(mortgage?.recordingDate ?? mortgage?.loanDate)} />
              <StatRow label="Loan type" value={mortgage?.loanType} />
              <StatRow label="Financing" value={mortgage?.financingType} />
              <StatRow label="Interest rate" value={fmtPercent(mortgage?.currentEstimatedInterestRate ?? mortgage?.interestRate, 2)} />
              <StatRow label="Lender type" value={mortgage?.lenderType} />
              <StatRow label="Est. balance" value={fmtCurrency(mortgage?.currentEstimatedBalance)} />
              <StatRow label="Total open liens" value={fmtCurrency(lien?.totalOpenLienBalance)} />
              <StatRow label="Open lien count" value={fmtNumber(lien?.totalOpenLienCount)} />
              {lien?.allLoanTypes && lien.allLoanTypes.length > 0 && (
                <StatRow label="Loan types" value={lien.allLoanTypes.join(', ')} />
              )}
              <StatRow label="Last recorded" value={fmtDate(lien?.lastLoanRecordingDate)} />
            </div>
          )}

          {hasAssessment && (
            <div className="mb-6">
              <SectionHeader icon={<Receipt size={13} style={{ color: '#C9A84C' }} />} title="Tax Assessment" />
              <StatRow label="Assessed value" value={fmtCurrency(assessment?.assessedValue)} />
              <StatRow label="Market value" value={fmtCurrency(assessment?.marketValue)} />
              <StatRow label="Annual tax" value={fmtCurrency(assessment?.taxAmount)} />
              <StatRow label="Tax year" value={fmtNumber(assessment?.taxYear)} />
            </div>
          )}

          {hasSale && (
            <div className="mb-6">
              <SectionHeader icon={<Calendar size={13} style={{ color: '#C9A84C' }} />} title="Sale History" />
              <StatRow label="Last sale price" value={fmtCurrency(lastSalePrice)} />
              <StatRow label="Last sale date" value={fmtDate(lastSaleDate)} />
              {lastSale?.buyers && lastSale.buyers.length > 0 && (
                <StatRow label="Buyer" value={lastSale.buyers.join(', ')} />
              )}
              {lastSale?.sellers && lastSale.sellers.length > 0 && (
                <StatRow label="Seller" value={lastSale.sellers.join(', ')} />
              )}
              <StatRow label="Last sale type" value={lastSale?.documentType} />
              <StatRow label="Prior sale price" value={fmtCurrency(priorSalePrice)} />
              <StatRow label="Prior sale date" value={fmtDate(priorSaleDate)} />
            </div>
          )}

          {hasForeclosure && (
            <div className="mb-6">
              <SectionHeader icon={<AlertTriangle size={13} style={{ color: '#C9A84C' }} />} title="Foreclosure" />
              <StatRow label="Status" value={foreclosure?.status} />
              <StatRow label="Filing date" value={fmtDate(foreclosure?.filingDate ?? foreclosure?.recordingDate)} />
              <StatRow label="Default date" value={fmtDate(foreclosure?.defaultDate)} />
              <StatRow label="Borrower" value={foreclosure?.borrowerName} />
              <StatRow label="Lender" value={foreclosure?.currentLenderName} />
              <StatRow label="Document type" value={foreclosure?.documentType} />
            </div>
          )}

          {hasInvoluntaryLien && (
            <div className="mb-6">
              <SectionHeader icon={<AlertTriangle size={13} style={{ color: '#C9A84C' }} />} title="Involuntary Liens" />
              {p.involuntaryLien!.liens!.map((lienItem, i) => (
                <div key={i}>
                  <StatRow label="Type" value={lienItem.lienType} />
                  <StatRow label="Document" value={lienItem.documentType} />
                  <StatRow label="Recorded" value={fmtDate(lienItem.recordingDate)} />
                </div>
              ))}
            </div>
          )}

          {hasDemo && (
            <div className="mb-6">
              <SectionHeader icon={<Users size={13} style={{ color: '#C9A84C' }} />} title="Neighborhood" />
              <StatRow label="Median income" value={fmtCurrency(demo?.medianHouseholdIncome)} />
              <StatRow label="Median home value" value={fmtCurrency(demo?.medianHomeValue)} />
              <StatRow label="Avg household size" value={demo?.householdSize != null ? demo.householdSize.toFixed(1) : null} />
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
