import { useEffect, useState } from 'react';
import { RefreshCw, Phone, Calendar, Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CallAttempt {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  status: string;
  error: string | null;
  created_at: string;
}

interface IntroAgreement {
  id: string;
  seller_email: string;
  date_time: string | null;
  created_at: string;
}

interface AgreementLog {
  id: string;
  status_code: number;
  raw_body: string;
  parsed_email: string;
  parsed_date_time: string | null;
  error: string | null;
  user_agent: string;
  created_at: string;
}

export default function AdminAICaller() {
  const [calls, setCalls] = useState<CallAttempt[]>([]);
  const [agreements, setAgreements] = useState<IntroAgreement[]>([]);
  const [logs, setLogs] = useState<AgreementLog[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [callsRes, agreementsRes, logsRes] = await Promise.all([
        supabase
          .from('vapi_call_attempts')
          .select('id, email, name, phone, status, error, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('advisor_intro_agreements')
          .select('id, seller_email, date_time, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('vapi_intro_agreement_logs')
          .select('id, status_code, raw_body, parsed_email, parsed_date_time, error, user_agent, created_at')
          .order('created_at', { ascending: false })
          .limit(200),
      ]);
      if (callsRes.error) throw callsRes.error;
      if (agreementsRes.error) throw agreementsRes.error;
      if (logsRes.error) throw logsRes.error;
      setCalls(callsRes.data ?? []);
      setAgreements(agreementsRes.data ?? []);
      setLogs(logsRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totalCalls = calls.length;
  const placedCalls = calls.filter((c) => c.status === 'placed').length;
  const failedCalls = calls.filter((c) => c.status === 'failed').length;
  const totalAgreements = agreements.length;
  const conversion = placedCalls > 0 ? (totalAgreements / placedCalls) * 100 : 0;

  const agreedEmails = new Set(
    agreements.map((a) => a.seller_email.trim().toLowerCase()).filter(Boolean),
  );

  function formatDate(iso: string | null) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('en-US', { timeZone: 'America/Denver' });
    } catch {
      return iso;
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1
            className="font-playfair font-bold mb-1"
            style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', color: '#0D1B2A' }}
          >
            AI Caller Analytics
          </h1>
          <p className="text-sm" style={{ color: '#5A6573' }}>
            Call attempts placed by the AI caller and leads that agreed to a realtor intro.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-white"
          style={{ borderColor: '#E0DAD0', color: '#0D1B2A' }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: '#5A6573' }}>
          Loading analytics…
        </div>
      ) : error ? (
        <div
          className="rounded-lg border p-4 text-sm"
          style={{ borderColor: '#F1D6D6', backgroundColor: '#FBEEEE', color: '#8A2A2A' }}
        >
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Phone size={18} />}
              label="Total call attempts"
              value={totalCalls.toString()}
              hint={`${placedCalls} placed · ${failedCalls} failed`}
            />
            <StatCard
              icon={<CheckCircle2 size={18} />}
              label="Intros agreed"
              value={totalAgreements.toString()}
              hint="via POST to /vapi-intro-agreement"
            />
            <StatCard
              icon={<Calendar size={18} />}
              label="Conversion"
              value={`${conversion.toFixed(1)}%`}
              hint="agreements ÷ placed calls"
            />
            <StatCard
              icon={<Mail size={18} />}
              label="Unique sellers agreed"
              value={agreedEmails.size.toString()}
              hint="distinct emails"
            />
          </div>

          <Section title={`Leads who agreed to an intro (${agreements.length})`}>
            {agreements.length === 0 ? (
              <Empty>No intro agreements yet.</Empty>
            ) : (
              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: '#E0DAD0', backgroundColor: 'white' }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#F7F4EE', color: '#0D1B2A' }}>
                      <Th>Seller email</Th>
                      <Th>Agreed date/time</Th>
                      <Th>Recorded at</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {agreements.map((a) => (
                      <tr key={a.id} style={{ borderTop: '1px solid #F0EDE8' }}>
                        <Td>{a.seller_email || '—'}</Td>
                        <Td>{formatDate(a.date_time)}</Td>
                        <Td style={{ color: '#5A6573' }}>{formatDate(a.created_at)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title={`Endpoint request logs (${logs.length})`}>
            {logs.length === 0 ? (
              <Empty>No requests received yet.</Empty>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => {
                  const isOpen = expandedLog === log.id;
                  const ok = log.status_code >= 200 && log.status_code < 300;
                  return (
                    <div
                      key={log.id}
                      className="rounded-lg border overflow-hidden"
                      style={{ borderColor: '#E0DAD0', backgroundColor: 'white' }}
                    >
                      <button
                        onClick={() => setExpandedLog(isOpen ? null : log.id)}
                        className="w-full text-left px-4 py-3 flex flex-wrap items-center gap-3 hover:bg-stone-50 transition-colors"
                      >
                        <span
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-bold"
                          style={{
                            backgroundColor: ok ? '#E5F3EA' : '#FBEEEE',
                            color: ok ? '#1F6F3F' : '#8A2A2A',
                          }}
                        >
                          {log.status_code}
                        </span>
                        <span className="text-sm font-medium" style={{ color: '#0D1B2A' }}>
                          {log.parsed_email || '(no email)'}
                        </span>
                        {log.error && (
                          <span className="text-xs" style={{ color: '#8A2A2A' }}>
                            {log.error}
                          </span>
                        )}
                        <span
                          className="ml-auto text-xs"
                          style={{ color: '#5A6573' }}
                        >
                          {formatDate(log.created_at)}
                        </span>
                      </button>
                      {isOpen && (
                        <div
                          className="border-t px-4 py-3 text-xs space-y-2"
                          style={{ borderColor: '#F0EDE8', color: '#0D1B2A' }}
                        >
                          <div>
                            <span style={{ color: '#5A6573' }}>Parsed date_time: </span>
                            {formatDate(log.parsed_date_time)}
                          </div>
                          <div>
                            <span style={{ color: '#5A6573' }}>User agent: </span>
                            {log.user_agent || '—'}
                          </div>
                          <div>
                            <div style={{ color: '#5A6573' }} className="mb-1">
                              Raw body:
                            </div>
                            <pre
                              className="p-3 rounded overflow-auto font-mono"
                              style={{ backgroundColor: '#F7F4EE', fontSize: '11px' }}
                            >
                              {log.raw_body || '(empty)'}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          <Section title={`Call attempts (${calls.length})`}>
            {calls.length === 0 ? (
              <Empty>No call attempts yet.</Empty>
            ) : (
              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: '#E0DAD0', backgroundColor: 'white' }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#F7F4EE', color: '#0D1B2A' }}>
                      <Th>Lead</Th>
                      <Th>Email</Th>
                      <Th>Phone</Th>
                      <Th>Status</Th>
                      <Th>Agreed?</Th>
                      <Th>Created</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((c) => {
                      const agreed = c.email
                        ? agreedEmails.has(c.email.trim().toLowerCase())
                        : false;
                      return (
                        <tr key={c.id} style={{ borderTop: '1px solid #F0EDE8' }}>
                          <Td>{c.name || '—'}</Td>
                          <Td>{c.email || '—'}</Td>
                          <Td>{c.phone || '—'}</Td>
                          <Td>
                            <StatusBadge status={c.status} />
                          </Td>
                          <Td>
                            {agreed ? (
                              <span
                                className="inline-flex items-center gap-1 text-xs font-semibold"
                                style={{ color: '#1F6F3F' }}
                              >
                                <CheckCircle2 size={12} /> Yes
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: '#5A6573' }}>
                                No
                              </span>
                            )}
                          </Td>
                          <Td style={{ color: '#5A6573' }}>{formatDate(c.created_at)}</Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ borderColor: '#E0DAD0', backgroundColor: 'white' }}
    >
      <div
        className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide mb-3"
        style={{ color: '#C9A84C' }}
      >
        {icon}
        {label}
      </div>
      <div className="font-playfair font-bold text-3xl" style={{ color: '#0D1B2A' }}>
        {value}
      </div>
      {hint && (
        <div className="text-xs mt-1" style={{ color: '#5A6573' }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2
        className="font-playfair font-semibold mb-3"
        style={{ fontSize: '1.2rem', color: '#0D1B2A' }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wide"
      style={{ color: '#0D1B2A' }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td className="px-4 py-3 align-middle" style={{ color: '#0D1B2A', ...style }}>
      {children}
    </td>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg border p-8 text-center text-sm"
      style={{ borderColor: '#E0DAD0', backgroundColor: 'white', color: '#5A6573' }}
    >
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    placed: { bg: '#E5F3EA', fg: '#1F6F3F' },
    failed: { bg: '#FBEEEE', fg: '#8A2A2A' },
    pending: { bg: '#FDF6E3', fg: '#8A6A12' },
  };
  const colors = map[status] ?? { bg: '#EDEBE6', fg: '#5A6573' };
  return (
    <span
      className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold"
      style={{ backgroundColor: colors.bg, color: colors.fg }}
    >
      {status}
    </span>
  );
}
