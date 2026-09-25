import { useEffect, useState } from 'react';
import { Download, RefreshCw, Mail, Phone, MapPin, Calendar } from 'lucide-react';

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

export default function AdminLeads({ embedded = false }: { embedded?: boolean } = {}) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { url, headers } = downloadUrl('json');
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const text = await res.text();
      const parsed = JSON.parse(text) as LeadRow[];
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
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        Apikey: supabaseKey,
      },
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
    try {
      return new Date(iso).toLocaleString('en-US', { timeZone: 'America/Denver' });
    } catch {
      return iso;
    }
  }

  const body = (
    <>
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1
              className="font-playfair font-bold mb-1"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', color: '#0D1B2A' }}
            >
              Lead Submissions
            </h1>
            <p className="text-sm" style={{ color: '#5A6573' }}>
              All form submissions are stored indefinitely. Use the buttons to export.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-white"
              style={{ borderColor: '#E0DAD0', color: '#0D1B2A' }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              onClick={() => handleDownload('csv')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0D1B2A' }}
            >
              <Download size={14} />
              Download CSV
            </button>
            <button
              onClick={() => handleDownload('json')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#C9A84C', color: '#0D1B2A' }}
            >
              <Download size={14} />
              Download JSON
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16" style={{ color: '#5A6573' }}>
            Loading leads…
          </div>
        ) : error ? (
          <div
            className="rounded-lg border p-4 text-sm"
            style={{ borderColor: '#F1D6D6', backgroundColor: '#FBEEEE', color: '#8A2A2A' }}
          >
            {error}
          </div>
        ) : leads.length === 0 ? (
          <div
            className="rounded-lg border p-10 text-center text-sm"
            style={{ borderColor: '#E0DAD0', backgroundColor: 'white', color: '#5A6573' }}
          >
            No submissions yet.
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => {
              const isOpen = expanded === lead.id;
              return (
                <div
                  key={lead.id}
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: '#E0DAD0', backgroundColor: 'white' }}
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : lead.id)}
                    className="w-full text-left px-5 py-4 flex flex-wrap items-center justify-between gap-3 hover:bg-stone-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-base" style={{ color: '#0D1B2A' }}>
                        {lead.name || '(no name)'}
                      </div>
                      <div
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1"
                        style={{ color: '#5A6573' }}
                      >
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
                    <span
                      className="text-xs font-medium uppercase tracking-wide"
                      style={{ color: '#C9A84C' }}
                    >
                      {isOpen ? 'Hide' : 'View'} answers
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      className="border-t px-5 py-4 text-sm"
                      style={{ borderColor: '#F0EDE8' }}
                    >
                      {Array.isArray(lead.quiz_answers) && lead.quiz_answers.length > 0 ? (
                        <ul className="space-y-3">
                          {lead.quiz_answers.map((ans) => {
                            const value =
                              ans.type === 'text'
                                ? ans.text_answer ?? '—'
                                : ans.selected_option_text ??
                                  (ans.selected_option_index != null
                                    ? `Option ${ans.selected_option_index}`
                                    : '—');
                            return (
                              <li key={ans.id}>
                                <div className="text-xs uppercase tracking-wide" style={{ color: '#C9A84C' }}>
                                  Q{ans.id} · {ans.topic ?? ''}
                                </div>
                                <div className="font-medium" style={{ color: '#0D1B2A' }}>
                                  {ans.question}
                                </div>
                                <div style={{ color: '#5A6573' }}>{value}</div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div style={{ color: '#5A6573' }}>No answers stored.</div>
                      )}
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
