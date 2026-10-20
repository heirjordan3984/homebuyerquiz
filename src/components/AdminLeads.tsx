import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, Mail, Phone, Search, ArrowDown, ArrowUp, X, ChevronDown } from 'lucide-react';

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

type SortOrder = 'desc' | 'asc';
type DateRange = 'all' | 'today' | '7d' | '30d' | 'custom';

export default function AdminLeads({ embedded = false }: { embedded?: boolean } = {}) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/export-leads?format=json`, {
        headers: { Authorization: `Bearer ${supabaseKey}`, Apikey: supabaseKey },
      });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const parsed = JSON.parse(await res.text()) as LeadRow[];
      setLeads(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function downloadUrl(format: 'csv' | 'json') {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return {
      url: `${supabaseUrl}/functions/v1/export-leads?format=${format}`,
      headers: { Authorization: `Bearer ${supabaseKey}`, Apikey: supabaseKey },
    };
  }

  async function handleDownload(format: 'csv' | 'json') {
    try {
      const { url, headers } = downloadUrl(format);
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      link.href = objectUrl;
      link.download = `lead_submissions_${stamp}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed');
    }
  }

  function formatDate(iso: string) {
    try { return new Date(iso).toLocaleString('en-US', { timeZone: 'America/Denver' }); } catch { return iso; }
  }

  function formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length === 11 && digits[0] === '1') return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    return phone;
  }

  function clearFilters() {
    setSearch('');
    setDateRange('all');
    setCustomStart('');
    setCustomEnd('');
  }

  const hasFilters = search || dateRange !== 'all' || customStart || customEnd;

  function denverDateString(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  }

  function denverBoundary(dateStr: string, endOfDay: boolean): number {
    const [y, m, d] = dateStr.split('-').map(Number);
    const noonUTC = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const denverHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', hour: '2-digit', hour12: false }).format(noonUTC));
    const offsetHours = 12 - denverHour;
    const midnightUTC = Date.UTC(y, m - 1, d, offsetHours, 0, 0, 0);
    return endOfDay ? midnightUTC + 24 * 3600 * 1000 : midnightUTC;
  }

  const filteredLeads = useMemo(() => {
    let result = leads;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        l.property_address.toLowerCase().includes(q)
      );
    }

    if (dateRange !== 'all') {
      const todayStr = denverDateString(new Date());
      let startMs: number | null = null;
      let endMs: number | null = null;

      if (dateRange === 'today') {
        startMs = denverBoundary(todayStr, false);
        endMs = denverBoundary(todayStr, true);
      } else if (dateRange === '7d') {
        const [y, m, d] = todayStr.split('-').map(Number);
        const past = new Date(Date.UTC(y, m - 1, d - 6));
        startMs = denverBoundary(denverDateString(past), false);
        endMs = denverBoundary(todayStr, true);
      } else if (dateRange === '30d') {
        const [y, m, d] = todayStr.split('-').map(Number);
        const past = new Date(Date.UTC(y, m - 1, d - 29));
        startMs = denverBoundary(denverDateString(past), false);
        endMs = denverBoundary(todayStr, true);
      } else if (dateRange === 'custom') {
        if (customStart) startMs = denverBoundary(customStart, false);
        if (customEnd) endMs = denverBoundary(customEnd, true);
      }

      result = result.filter((l) => {
        const created = new Date(l.created_at).getTime();
        if (startMs !== null && created < startMs) return false;
        if (endMs !== null && created >= endMs) return false;
        return true;
      });
    }

    return [...result].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? -diff : diff;
    });
  }, [leads, search, dateRange, customStart, customEnd, sortOrder]);

  const body = (
    <>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-playfair font-bold mb-1" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', color: '#0D1B2A' }}>
            Lead Submissions
          </h1>
          <p className="text-sm" style={{ color: '#5A6573' }}>
            {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-white" style={{ borderColor: '#E0DAD0', color: '#0D1B2A' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={() => handleDownload('csv')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: '#0D1B2A' }}>
            <Download size={14} />
            CSV
          </button>
          <button onClick={() => handleDownload('json')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: '#C9A84C', color: '#0D1B2A' }}>
            <Download size={14} />
            JSON
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4 sm:p-5 mb-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E6E0D5' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_auto_auto_auto] gap-2.5 items-center">
          <label className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email, address…" className="w-full rounded-xl pl-9 pr-3 py-2.5 font-dm text-sm outline-none" style={{ border: '1px solid #DDD7CB', color: '#081027' }} />
          </label>
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#F5F2EC' }}>
            {(['all', 'today', '7d', '30d', 'custom'] as DateRange[]).map((r) => (
              <button key={r} onClick={() => setDateRange(r)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors" style={{ backgroundColor: dateRange === r ? '#C9A84C' : 'transparent', color: dateRange === r ? '#0D1B2A' : '#5A6573' }}>
                {r === 'all' ? 'All' : r === 'today' ? 'Today' : r === '7d' ? '7d' : r === '30d' ? '30d' : 'Custom'}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <div className="flex gap-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} aria-label="From date" className="min-w-0 w-1/2 rounded-xl px-2.5 py-2.5 font-dm text-xs outline-none" style={{ border: '1px solid #DDD7CB', color: '#081027' }} />
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} aria-label="To date" className="min-w-0 w-1/2 rounded-xl px-2.5 py-2.5 font-dm text-xs outline-none" style={{ border: '1px solid #DDD7CB', color: '#081027' }} />
            </div>
          )}
          <button onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 font-dm text-sm font-semibold" style={{ backgroundColor: '#FFF0E8', color: '#7A5E1F' }}>
            {sortOrder === 'desc' ? <ArrowDown size={15} /> : <ArrowUp size={15} />} {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </button>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 mt-3 font-dm text-xs font-semibold" style={{ color: '#B5530A' }}>
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: '#5A6573' }}>Loading leads…</div>
      ) : error ? (
        <div className="rounded-lg border p-4 text-sm" style={{ borderColor: '#F1D6D6', backgroundColor: '#FBEEEE', color: '#8A2A2A' }}>{error}</div>
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-2xl py-14 text-center font-dm text-sm" style={{ backgroundColor: '#FFFFFF', color: '#8A8A8A', border: '1px solid #E6E0D5' }}>No leads match these filters.</div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const isOpen = expanded === lead.id;
            return (
              <div key={lead.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E6E0D5' }}>
                <button onClick={() => setExpanded(isOpen ? null : lead.id)} className="w-full text-left px-4 sm:px-5 py-4 flex items-center justify-between gap-4 hover:bg-stone-50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-dm font-semibold text-sm truncate" style={{ color: '#081027' }}>{lead.name || 'Unnamed lead'}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 font-dm text-xs" style={{ color: '#536273' }}>
                      <span className="inline-flex items-center gap-1.5"><Phone size={13} style={{ color: '#D54822' }} />{lead.phone ? formatPhone(lead.phone) : 'No phone'}</span>
                      <span className="inline-flex items-center gap-1.5"><Mail size={13} style={{ color: '#D54822' }} />{lead.email || 'No email'}</span>
                      <span>{formatDate(lead.created_at)}</span>
                      {lead.property_address && <span className="truncate max-w-xs">{lead.property_address}</span>}
                    </div>
                  </div>
                  <ChevronDown size={17} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: '#C9A84C' }} />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 py-4 space-y-4" style={{ backgroundColor: '#FCFBF8', borderTop: '1px solid #F0EDE8' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl px-3.5 py-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E6E0D5' }}>
                        <p className="font-dm text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#7A8491' }}>Phone</p>
                        <p className="font-dm text-sm font-medium mt-1" style={{ color: '#081027' }}>{lead.phone ? formatPhone(lead.phone) : 'No phone provided'}</p>
                      </div>
                      <div className="rounded-xl px-3.5 py-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E6E0D5' }}>
                        <p className="font-dm text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#7A8491' }}>Email</p>
                        <p className="font-dm text-sm font-medium mt-1 break-all" style={{ color: '#081027' }}>{lead.email || 'No email provided'}</p>
                      </div>
                    </div>
                    {lead.quiz_answers?.map((ans, i) => (
                      <div key={`${ans.id}-${i}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2" style={{ borderBottom: i < (lead.quiz_answers?.length ?? 0) - 1 ? '1px solid #F0EDE8' : 'none' }}>
                        <span className="font-dm text-xs" style={{ color: '#7A8491' }}>Q{ans.id} · {ans.question}</span>
                        <span className="font-dm text-sm font-medium sm:text-right" style={{ color: '#081027' }}>{ans.selected_option_text ?? ans.text_answer ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  if (embedded) return body;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="w-full h-1" style={{ backgroundColor: '#C9A84C' }} />
      <div className="max-w-6xl mx-auto px-6 py-10">{body}</div>
    </div>
  );
}
