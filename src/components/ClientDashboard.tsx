import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CalendarDays, ChevronDown, LogOut, Search, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PreviewMenu from './PreviewMenu';

interface QuizAnswer {
  id: number;
  topic?: string;
  question?: string;
  type?: string;
  selected_option_text?: string | null;
  text_answer?: string | null;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  property_address: string;
  quiz_answers: QuizAnswer[] | null;
  created_at: string;
}

type Period = 'week' | 'month' | 'quarter' | 'year';
type SortOrder = 'desc' | 'asc';

const periodLabels: Record<Period, string> = { week: 'Week', month: 'Month', quarter: 'Quarter', year: 'Year' };

function getPeriodStart(date: Date, period: Period, offset = 0): Date {
  const start = new Date(date);
  if (period === 'week') {
    const day = start.getDay();
    start.setDate(start.getDate() - day + offset * 7);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    start.setMonth(start.getMonth() + offset, 1);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'quarter') {
    const quarterStart = Math.floor(start.getMonth() / 3) * 3;
    start.setMonth(quarterStart + offset * 3, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setFullYear(start.getFullYear() + offset, 0, 1);
    start.setHours(0, 0, 0, 0);
  }
  return start;
}

function getPeriodEnd(start: Date, period: Period): Date {
  const end = new Date(start);
  if (period === 'week') end.setDate(end.getDate() + 7);
  if (period === 'month') end.setMonth(end.getMonth() + 1);
  if (period === 'quarter') end.setMonth(end.getMonth() + 3);
  if (period === 'year') end.setFullYear(end.getFullYear() + 1);
  return end;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function getAnswer(lead: Lead, questionId: number): string {
  const answer = lead.quiz_answers?.find((item) => item.id === questionId);
  return answer?.selected_option_text ?? answer?.text_answer ?? '';
}

export default function ClientDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [period, setPeriod] = useState<Period>('week');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [search, setSearch] = useState('');
  const [answerQuestion, setAnswerQuestion] = useState('');
  const [answerValue, setAnswerValue] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!active) return;
      if (!sessionData.session) {
        window.location.hash = 'client-login';
        setAuthReady(true);
        setLoading(false);
        return;
      }

      const { data, error: loadError } = await supabase
        .from('lead_submissions')
        .select('id, name, email, phone, property_address, quiz_answers, created_at')
        .order('created_at', { ascending: false });

      if (!active) return;
      if (loadError) {
        setError('We could not load your leads right now. Please try again.');
      } else {
        setLeads((data ?? []) as Lead[]);
      }
      setAuthReady(true);
      setLoading(false);
    }

    load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) window.location.hash = 'client-login';
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const answerFilters = useMemo(() => {
    const questions = new Map<number, { id: number; label: string; options: Set<string> }>();
    leads.forEach((lead) => lead.quiz_answers?.forEach((answer) => {
      if (answer.type === 'text' || !answer.selected_option_text) return;
      const entry = questions.get(answer.id) ?? { id: answer.id, label: answer.question ?? `Question ${answer.id}`, options: new Set<string>() };
      entry.options.add(answer.selected_option_text);
      questions.set(answer.id, entry);
    }));
    return Array.from(questions.values()).sort((a, b) => a.id - b.id);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads
      .filter((lead) => {
        const matchesSearch = !query || [lead.name, lead.email, lead.phone, lead.property_address].some((value) => value.toLowerCase().includes(query));
        const matchesAnswer = !answerQuestion || getAnswer(lead, Number(answerQuestion)) === answerValue;
        const created = new Date(lead.created_at);
        const matchesFrom = !fromDate || created >= new Date(`${fromDate}T00:00:00`);
        const matchesTo = !toDate || created < new Date(`${toDate}T23:59:59.999`);
        return matchesSearch && matchesAnswer && matchesFrom && matchesTo;
      })
      .sort((a, b) => sortOrder === 'desc'
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [answerQuestion, answerValue, fromDate, leads, search, sortOrder, toDate]);

  const periodStats = useMemo(() => {
    const now = new Date();
    const currentStart = getPeriodStart(now, period);
    const previousStart = getPeriodStart(now, period, -1);
    const currentEnd = getPeriodEnd(currentStart, period);
    const current = leads.filter((lead) => {
      const time = new Date(lead.created_at).getTime();
      return time >= currentStart.getTime() && time < currentEnd.getTime();
    });
    const previous = leads.filter((lead) => {
      const time = new Date(lead.created_at).getTime();
      return time >= previousStart.getTime() && time < currentStart.getTime();
    });
    const change = previous.length === 0 ? (current.length > 0 ? 100 : 0) : ((current.length - previous.length) / previous.length) * 100;
    const dayCount = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 12 : 12;
    const buckets = Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(currentStart);
      if (period === 'year') date.setMonth(index);
      else if (period === 'quarter') date.setDate(index * 7);
      else date.setDate(index);
      const next = new Date(date);
      if (period === 'year') next.setMonth(next.getMonth() + 1);
      else if (period === 'quarter') next.setDate(next.getDate() + 7);
      else next.setDate(next.getDate() + 1);
      return { label: period === 'year' ? date.toLocaleDateString('en-US', { month: 'short' }) : date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }), count: current.filter((lead) => { const time = new Date(lead.created_at).getTime(); return time >= date.getTime() && time < next.getTime(); }).length };
    });
    return { current, previous, change, buckets };
  }, [leads, period]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.hash = 'client-login';
  }

  function clearFilters() {
    setSearch('');
    setAnswerQuestion('');
    setAnswerValue('');
    setFromDate('');
    setToDate('');
  }

  if (!authReady || loading) return <div className="min-h-screen flex items-center justify-center font-dm" style={{ backgroundColor: '#07111B', color: '#5A6573' }}>Loading your workspace…</div>;

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#07111B' }}>
      <PreviewMenu />
      <div className="w-full h-1" style={{ backgroundColor: '#F15B2A' }} />
      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-7 pb-5 flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center rounded-xl px-3 py-2" style={{ backgroundColor: '#07111B' }}>
            <img src="/WildfireMarketingLogoTransparent.png" alt="Wildfire Marketing" className="w-44 sm:w-52 h-auto" />
          </div>
          <h1 className="font-playfair font-bold mt-2" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#FFFFFF' }}>Lead Portal</h1>
          <p className="font-dm text-sm mt-1" style={{ color: '#B8C4CE' }}>A clear view of the people raising their hand.</p>
        </div>
        <button onClick={signOut} className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-white" style={{ color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.24)' }}><LogOut size={15} /> Sign out</button>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {error && <div className="rounded-xl px-4 py-3 mb-6 font-dm text-sm" style={{ color: '#8A2A2A', backgroundColor: '#FBEEEE', border: '1px solid #F1D6D6' }}>{error}</div>}
        <section className="rounded-3xl p-5 sm:p-7 mb-6" style={{ backgroundColor: '#081827', color: '#FFFFFF', boxShadow: '0 18px 60px rgba(13,27,42,0.12)' }}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div><p className="font-dm text-xs uppercase tracking-[0.18em]" style={{ color: '#FFB347' }}>Lead pulse</p><h2 className="font-playfair text-2xl font-semibold mt-1">Performance at a glance</h2></div>
            <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              {(Object.keys(periodLabels) as Period[]).map((value) => <button key={value} onClick={() => setPeriod(value)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors" style={{ backgroundColor: period === value ? '#F15B2A' : 'transparent', color: period === value ? '#081827' : '#D8DEE7' }}>{periodLabels[value]}</button>)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard label={`Leads this ${period}`} value={periodStats.current.length.toString()} detail={`${periodStats.change >= 0 ? '+' : ''}${periodStats.change.toFixed(0)}% vs previous`} positive={periodStats.change >= 0} />
            <MetricCard label={`Previous ${period}`} value={periodStats.previous.length.toString()} detail="Comparison period" />
            <MetricCard label="All-time leads" value={leads.length.toString()} detail="Captured submissions" />
          </div>
          <div className="mt-7 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
            <div><div className="flex items-center justify-between mb-3"><span className="font-dm text-xs uppercase tracking-wider" style={{ color: '#AAB5C5' }}>Lead volume</span><span className="font-dm text-xs" style={{ color: '#AAB5C5' }}>Current {period.toLowerCase()}</span></div><LeadTrend buckets={periodStats.buckets} /></div>
            <ComparisonChart current={periodStats.current.length} previous={periodStats.previous.length} period={period} />
          </div>
        </section>

        <section className="rounded-2xl p-4 sm:p-5 mb-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E6E0D5' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4"><div><h2 className="font-playfair font-semibold text-xl" style={{ color: '#081827' }}>Lead submissions</h2><p className="font-dm text-xs mt-1" style={{ color: '#8A8A8A' }}>{filteredLeads.length} matching {filteredLeads.length === 1 ? 'lead' : 'leads'}</p></div>{(search || answerQuestion || fromDate || toDate) && <button onClick={clearFilters} className="flex items-center gap-1.5 font-dm text-xs font-semibold" style={{ color: '#B5530A' }}><X size={14} /> Clear filters</button>}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-2.5">
            <label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search leads…" className="w-full rounded-xl pl-9 pr-3 py-2.5 font-dm text-sm outline-none" style={{ border: '1px solid #DDD7CB', color: '#081827' }} /></label>
            <select value={answerQuestion} onChange={(event) => { setAnswerQuestion(event.target.value); setAnswerValue(''); }} className="rounded-xl px-3 py-2.5 font-dm text-sm outline-none" style={{ border: '1px solid #DDD7CB', color: '#081827', backgroundColor: '#FFFFFF' }}><option value="">Filter by quiz answer</option>{answerFilters.map((filter) => <option key={filter.id} value={filter.id}>Q{filter.id} · {filter.label.slice(0, 24)}</option>)}</select>
            <select value={answerValue} onChange={(event) => setAnswerValue(event.target.value)} disabled={!answerQuestion} className="rounded-xl px-3 py-2.5 font-dm text-sm outline-none disabled:opacity-50" style={{ border: '1px solid #DDD7CB', color: '#081827', backgroundColor: '#FFFFFF' }}><option value="">All answers</option>{answerFilters.find((filter) => filter.id === Number(answerQuestion))?.options && Array.from(answerFilters.find((filter) => filter.id === Number(answerQuestion))!.options).sort().map((option) => <option key={option} value={option}>{option}</option>)}</select>
            <div className="flex gap-2"><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} aria-label="From date" className="min-w-0 w-1/2 rounded-xl px-2.5 py-2.5 font-dm text-xs outline-none" style={{ border: '1px solid #DDD7CB', color: '#081827' }} /><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} aria-label="To date" className="min-w-0 w-1/2 rounded-xl px-2.5 py-2.5 font-dm text-xs outline-none" style={{ border: '1px solid #DDD7CB', color: '#081827' }} /></div>
            <button onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 font-dm text-sm font-semibold" style={{ backgroundColor: '#FFF0E8', color: '#7A5E1F' }}>{sortOrder === 'desc' ? <ArrowDown size={15} /> : <ArrowUp size={15} />} {sortOrder === 'desc' ? 'Newest' : 'Oldest'}</button>
          </div>
        </section>

        <section className="space-y-3">
          {filteredLeads.length === 0 ? <div className="rounded-2xl py-14 text-center font-dm text-sm" style={{ backgroundColor: '#FFFFFF', color: '#8A8A8A', border: '1px solid #E6E0D5' }}><Users size={24} className="mx-auto mb-3" style={{ color: '#F15B2A' }} />No leads match these filters.</div> : filteredLeads.map((lead) => <LeadRow key={lead.id} lead={lead} expanded={expanded === lead.id} onToggle={() => setExpanded(expanded === lead.id ? null : lead.id)} />)}
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value, detail, positive }: { label: string; value: string; detail: string; positive?: boolean }) {
  return <div className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}><p className="font-dm text-xs" style={{ color: '#AAB5C5' }}>{label}</p><p className="font-playfair font-bold text-3xl mt-2">{value}</p><p className="font-dm text-xs mt-2" style={{ color: positive === undefined ? '#AAB5C5' : positive ? '#9FD6BF' : '#F0A58B' }}>{detail}</p></div>;
}

function LeadTrend({ buckets }: { buckets: { label: string; count: number }[] }) {
  const max = Math.max(...buckets.map((bucket) => bucket.count), 1);
  return <div className="h-32 flex items-end gap-1.5 sm:gap-2">{buckets.map((bucket, index) => <div key={`${bucket.label}-${index}`} className="flex-1 h-full flex flex-col justify-end items-center gap-2"><div className="w-full rounded-t-md transition-all duration-500" style={{ height: `${Math.max((bucket.count / max) * 100, bucket.count ? 8 : 2)}%`, background: bucket.count ? 'linear-gradient(180deg, #FFB347, #F15B2A)' : 'rgba(255,255,255,0.12)' }} title={`${bucket.label}: ${bucket.count}`} /><span className="font-dm text-[9px] truncate max-w-full" style={{ color: '#8390A2' }}>{bucket.label}</span></div>)}</div>;
}

function ComparisonChart({ current, previous, period }: { current: number; previous: number; period: Period }) {
  const max = Math.max(current, previous, 1);
  return <div className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}><div className="flex items-center justify-between mb-4"><span className="font-dm text-xs uppercase tracking-wider" style={{ color: '#AAB5C5' }}>Period comparison</span><CalendarDays size={15} style={{ color: '#FFB347' }} /></div><div className="flex items-end justify-center gap-5 h-24"><div className="h-full flex flex-col justify-end items-center gap-2"><div className="w-14 rounded-t-lg" style={{ height: `${Math.max((previous / max) * 78, previous ? 8 : 3)}px`, backgroundColor: '#66788D' }} /><span className="font-dm text-[10px]" style={{ color: '#AAB5C5' }}>Previous</span></div><div className="h-full flex flex-col justify-end items-center gap-2"><div className="w-14 rounded-t-lg" style={{ height: `${Math.max((current / max) * 78, current ? 8 : 3)}px`, backgroundColor: '#F15B2A' }} /><span className="font-dm text-[10px]" style={{ color: '#FFB347' }}>Current</span></div></div><p className="font-dm text-xs text-center mt-3" style={{ color: '#AAB5C5' }}>This {period} compared with the prior one</p></div>;
}

function LeadRow({ lead, expanded, onToggle }: { lead: Lead; expanded: boolean; onToggle: () => void }) {
  return <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E6E0D5' }}><button onClick={onToggle} className="w-full text-left px-4 sm:px-5 py-4 flex items-center justify-between gap-4 hover:bg-stone-50 transition-colors"><div className="min-w-0"><p className="font-dm font-semibold text-sm truncate" style={{ color: '#081827' }}>{lead.name || 'Unnamed lead'}</p><div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 font-dm text-xs" style={{ color: '#7A8491' }}><span>{lead.email || 'No email'}</span><span>{formatDate(lead.created_at)}</span>{lead.property_address && <span className="truncate max-w-xs">{lead.property_address}</span>}</div></div><ChevronDown size={17} className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} style={{ color: '#F15B2A' }} /></button>{expanded && <div className="px-4 sm:px-5 py-4 space-y-2" style={{ backgroundColor: '#FCFBF8', borderTop: '1px solid #F0EDE8' }}>{lead.quiz_answers?.map((answer, index) => <div key={`${answer.id}-${index}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2" style={{ borderBottom: index < (lead.quiz_answers?.length ?? 0) - 1 ? '1px solid #F0EDE8' : 'none' }}><span className="font-dm text-xs" style={{ color: '#7A8491' }}>Q{answer.id} · {answer.question}</span><span className="font-dm text-sm font-medium sm:text-right" style={{ color: '#081827' }}>{answer.selected_option_text ?? answer.text_answer ?? '—'}</span></div>)}</div>}</div>;
}
