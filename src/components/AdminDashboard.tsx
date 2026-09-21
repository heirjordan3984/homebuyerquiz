import { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw, Calendar, TrendingDown, Users, CheckCircle2, BarChart3,
  Mail, Phone, MapPin, ChevronDown, ChevronUp, Filter, X,
} from 'lucide-react';

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

interface DropOff {
  count: number;
  step: number;
  label: string;
}

interface AnswerStat {
  questionId: number;
  topic: string;
  question: string;
  options: { label: string; count: number }[];
}

interface DailyTrend {
  date: string;
  starts: number;
  completions: number;
}

interface AnalyticsData {
  leads: LeadRow[];
  sessions: { id: string; current_step: number; step_type: string; step_label: string; questions_answered: number; completed: boolean; created_at: string }[];
  stats: {
    totalLeads: number;
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    avgQuestionsAnswered: number;
    dropOffs: DropOff[];
    answerStats: AnswerStat[];
    dailyTrend: DailyTrend[];
  };
}

type DateRange = 'all' | '7d' | '30d' | '90d' | 'custom';

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const params = new URLSearchParams();
      if (dateRange === '7d') {
        const d = new Date(); d.setDate(d.getDate() - 7);
        params.set('start', d.toISOString());
      } else if (dateRange === '30d') {
        const d = new Date(); d.setDate(d.getDate() - 30);
        params.set('start', d.toISOString());
      } else if (dateRange === '90d') {
        const d = new Date(); d.setDate(d.getDate() - 90);
        params.set('start', d.toISOString());
      } else if (dateRange === 'custom') {
        if (customStart) params.set('start', new Date(customStart).toISOString());
        if (customEnd) {
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          params.set('end', end.toISOString());
        }
      }
      const url = `${supabaseUrl}/functions/v1/quiz-analytics${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          Apikey: supabaseKey,
        },
      });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const parsed = await res.json() as AnalyticsData;
      setData(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    load();
  }, [load]);

  function formatDate(iso: string) {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  }

  const stats = data?.stats;
  const leads = data?.leads ?? [];
  const filteredLeads = searchQuery.trim()
    ? leads.filter((l) =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.property_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.phone.includes(searchQuery)
      )
    : leads;

  const maxDropOff = stats?.dropOffs?.[0]?.count ?? 1;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="w-full h-1" style={{ backgroundColor: '#C9A84C' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-playfair font-bold mb-1" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', color: '#0D1B2A' }}>
              Analytics Dashboard
            </h1>
            <p className="text-sm" style={{ color: '#5A6573' }}>
              Form submission results, completion stats, and drop-off analysis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-white"
              style={{ borderColor: '#E0DAD0', color: '#0D1B2A' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <a
              href="#admin"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0D1B2A' }}
            >
              Admin Panel
            </a>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#5A6573' }}>
            <Calendar size={15} />
            <span>Date range:</span>
          </div>
          {(['all', '7d', '30d', '90d', 'custom'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: dateRange === range ? '#0D1B2A' : 'transparent',
                color: dateRange === range ? 'white' : '#0D1B2A',
                border: `1px solid ${dateRange === range ? '#0D1B2A' : '#E0DAD0'}`,
              }}
            >
              {range === 'all' ? 'All time' : range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : range === '90d' ? 'Last 90 days' : 'Custom'}
            </button>
          ))}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs border outline-none"
                style={{ borderColor: '#E0DAD0', color: '#0D1B2A' }}
              />
              <span style={{ color: '#5A6573' }}>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs border outline-none"
                style={{ borderColor: '#E0DAD0', color: '#0D1B2A' }}
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20" style={{ color: '#5A6573' }}>Loading analytics…</div>
        ) : error ? (
          <div className="rounded-lg border p-4 text-sm" style={{ borderColor: '#F1D6D6', backgroundColor: '#FBEEEE', color: '#8A2A2A' }}>
            {error}
          </div>
        ) : !data || !stats ? (
          <div className="rounded-lg border p-10 text-center text-sm" style={{ borderColor: '#E0DAD0', backgroundColor: 'white', color: '#5A6573' }}>
            No data available.
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <StatCard
                icon={<Users size={18} />}
                label="Total Sessions"
                value={stats.totalSessions.toString()}
                accent="#0D1B2A"
              />
              <StatCard
                icon={<CheckCircle2 size={18} />}
                label="Completions"
                value={stats.completedSessions.toString()}
                sub={`${stats.totalLeads} leads captured`}
                accent="#2D6A4F"
              />
              <StatCard
                icon={<BarChart3 size={18} />}
                label="Completion Rate"
                value={`${stats.completionRate.toFixed(1)}%`}
                accent="#C9A84C"
              />
              <StatCard
                icon={<TrendingDown size={18} />}
                label="Avg Questions Answered"
                value={stats.avgQuestionsAnswered.toFixed(1)}
                sub={`out of ${stats.totalSessions > 0 ? '18' : '—'}`}
                accent="#B5530A"
              />
            </div>

            {/* Two-column: Drop-off + Daily trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Drop-off Analysis */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#E0DAD0', backgroundColor: 'white' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: '#F0EDE8' }}>
                  <div className="flex items-center gap-2">
                    <TrendingDown size={16} style={{ color: '#C9A84C' }} />
                    <h2 className="font-playfair font-semibold text-base" style={{ color: '#0D1B2A' }}>Drop-off Points</h2>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#8A8A8A' }}>Where users bounce before completing the form</p>
                </div>
                <div className="px-5 py-4">
                  {stats.dropOffs.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: '#8A8A8A' }}>No drop-offs recorded.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.dropOffs.slice(0, 8).map((drop, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate pr-3" style={{ color: '#0D1B2A' }}>
                              {drop.label}
                            </span>
                            <span className="text-xs font-semibold shrink-0" style={{ color: '#5A6573' }}>
                              {drop.count} {drop.count === 1 ? 'user' : 'users'}
                            </span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F0EDE8' }}>
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(drop.count / maxDropOff) * 100}%`,
                                backgroundColor: i < 3 ? '#B5530A' : '#C9A84C',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Daily Trend */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#E0DAD0', backgroundColor: 'white' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: '#F0EDE8' }}>
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} style={{ color: '#C9A84C' }} />
                    <h2 className="font-playfair font-semibold text-base" style={{ color: '#0D1B2A' }}>Daily Activity</h2>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#8A8A8A' }}>Quiz starts vs. completions over time</p>
                </div>
                <div className="px-5 py-4">
                  {stats.dailyTrend.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: '#8A8A8A' }}>No activity recorded.</p>
                  ) : (
                    <DailyTrendChart trend={stats.dailyTrend} />
                  )}
                </div>
              </div>
            </div>

            {/* Answer Distributions */}
            {stats.answerStats.length > 0 && (
              <div className="rounded-xl border overflow-hidden mb-8" style={{ borderColor: '#E0DAD0', backgroundColor: 'white' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: '#F0EDE8' }}>
                  <div className="flex items-center gap-2">
                    <Filter size={16} style={{ color: '#C9A84C' }} />
                    <h2 className="font-playfair font-semibold text-base" style={{ color: '#0D1B2A' }}>Answer Distribution</h2>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#8A8A8A' }}>How completed leads answered each question</p>
                </div>
                <div className="px-5 py-4 space-y-5">
                  {stats.answerStats.map((stat) => {
                    const total = stat.options.reduce((sum, o) => sum + o.count, 0);
                    const maxCount = stat.options[0]?.count ?? 1;
                    return (
                      <div key={stat.questionId}>
                        <div className="text-xs uppercase tracking-wide mb-0.5" style={{ color: '#C9A84C' }}>
                          Q{stat.questionId} · {stat.topic}
                        </div>
                        <div className="font-medium text-sm mb-2" style={{ color: '#0D1B2A' }}>
                          {stat.question}
                        </div>
                        <div className="space-y-2">
                          {stat.options.map((opt, i) => (
                            <div key={i}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs truncate pr-3" style={{ color: '#3A3A3A' }}>
                                  {opt.label}
                                </span>
                                <span className="text-xs font-semibold shrink-0" style={{ color: '#5A6573' }}>
                                  {opt.count} ({total > 0 ? ((opt.count / total) * 100).toFixed(0) : 0}%)
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F0EDE8' }}>
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${(opt.count / maxCount) * 100}%`, backgroundColor: '#C9A84C' }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submissions List */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#E0DAD0', backgroundColor: 'white' }}>
              <div className="px-5 py-4 border-b flex items-center justify-between gap-4 flex-wrap" style={{ borderColor: '#F0EDE8' }}>
                <div>
                  <h2 className="font-playfair font-semibold text-base" style={{ color: '#0D1B2A' }}>
                    All Submissions
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>
                    {filteredLeads.length} {filteredLeads.length === 1 ? 'submission' : 'submissions'}
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search name, email, address…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-8 py-2 rounded-lg text-sm border outline-none w-full sm:w-64"
                    style={{ borderColor: '#E0DAD0', color: '#0D1B2A' }}
                  />
                  <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#8A8A8A' }} />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <X size={14} style={{ color: '#8A8A8A' }} />
                    </button>
                  )}
                </div>
              </div>

              {filteredLeads.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm" style={{ color: '#5A6573' }}>
                  {leads.length === 0 ? 'No submissions yet.' : 'No results match your search.'}
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#F0EDE8' }}>
                  {filteredLeads.map((lead) => {
                    const isOpen = expanded === lead.id;
                    const answerCount = Array.isArray(lead.quiz_answers) ? lead.quiz_answers.length : 0;
                    return (
                      <div key={lead.id} style={{ borderColor: '#F0EDE8' }}>
                        <button
                          onClick={() => setExpanded(isOpen ? null : lead.id)}
                          className="w-full text-left px-5 py-4 flex flex-wrap items-center justify-between gap-3 hover:bg-stone-50 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-base" style={{ color: '#0D1B2A' }}>
                              {lead.name || '(no name)'}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1" style={{ color: '#5A6573' }}>
                              <span className="flex items-center gap-1">
                                <Mail size={12} />
                                {lead.email || '—'}
                              </span>
                              {lead.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone size={12} />
                                  {lead.phone}
                                </span>
                              )}
                              {lead.property_address && (
                                <span className="flex items-center gap-1 truncate max-w-xs">
                                  <MapPin size={12} />
                                  {lead.property_address}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {formatDate(lead.created_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#EDE6D6', color: '#7A5E1F' }}>
                              {answerCount} answers
                            </span>
                            {isOpen ? <ChevronUp size={16} style={{ color: '#C9A84C' }} /> : <ChevronDown size={16} style={{ color: '#8A8A8A' }} />}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-5 py-4 border-t" style={{ borderColor: '#F0EDE8', backgroundColor: '#FAFAF8' }}>
                            {Array.isArray(lead.quiz_answers) && lead.quiz_answers.length > 0 ? (
                              <div className="space-y-3">
                                {lead.quiz_answers.map((ans, i) => {
                                  const value =
                                    ans.type === 'text'
                                      ? ans.text_answer ?? '—'
                                      : ans.selected_option_text ??
                                        (ans.selected_option_index != null ? `Option ${ans.selected_option_index}` : '—');
                                  return (
                                    <div key={i} className="rounded-lg p-3" style={{ backgroundColor: 'white', border: '1px solid #F0EDE8' }}>
                                      <div className="text-xs uppercase tracking-wide mb-0.5" style={{ color: '#C9A84C' }}>
                                        Q{ans.id} · {ans.topic ?? ''}
                                      </div>
                                      <div className="font-medium text-sm mb-1" style={{ color: '#0D1B2A' }}>
                                        {ans.question}
                                      </div>
                                      <div className="text-sm" style={{ color: '#3A3A3A' }}>{value}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-sm" style={{ color: '#5A6573' }}>No answers stored.</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="rounded-xl border p-4 sm:p-5" style={{ borderColor: '#E0DAD0', backgroundColor: 'white' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
          <span style={{ color: accent }}>{icon}</span>
        </div>
      </div>
      <div className="font-playfair font-bold text-2xl sm:text-3xl leading-none mb-1" style={{ color: '#0D1B2A' }}>
        {value}
      </div>
      <div className="text-xs font-medium" style={{ color: '#5A6573' }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>{sub}</div>}
    </div>
  );
}

function DailyTrendChart({ trend }: { trend: DailyTrend[] }) {
  const recent = trend.slice(-14);
  if (recent.length === 0) return null;
  const maxVal = Math.max(...recent.map((d) => Math.max(d.starts, d.completions)), 1);

  return (
    <div>
      <div className="flex items-end gap-1 sm:gap-2 h-32 mb-3">
        {recent.map((d) => {
          const startH = (d.starts / maxVal) * 100;
          const compH = (d.completions / maxVal) * 100;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group">
              <div className="w-full flex flex-col justify-end items-center relative" style={{ height: '100%' }}>
                <div className="absolute bottom-0 w-full rounded-t transition-all duration-300" style={{ height: `${startH}%`, backgroundColor: '#E0DAD0' }} />
                <div className="absolute bottom-0 w-full rounded-t transition-all duration-300" style={{ height: `${compH}%`, backgroundColor: '#C9A84C' }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-end gap-1 sm:gap-2">
        {recent.map((d) => (
          <div key={d.date} className="flex-1 text-center" style={{ minWidth: 0 }}>
            <span className="text-[9px] font-medium block truncate" style={{ color: '#8A8A8A' }}>
              {new Date(d.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: '#5A6573' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#C9A84C' }} />
          Completions
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#E0DAD0' }} />
          Starts
        </span>
      </div>
    </div>
  );
}
