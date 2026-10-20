import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Link2, Copy, Check, Users, Plus, Trash2, Mail, Eye, EyeOff, Save,
  Webhook, Facebook, AlertCircle, Loader2, Pencil, X,
} from 'lucide-react';

type ConfigMap = Record<string, unknown>;

type AuthUser = {
  id: string;
  email: string;
  created_at: string;
  password?: string;
};

type TrackingCode = {
  pixelId: string;
  events: string[];
};

export default function AdminIntegrations() {
  const [config, setConfig] = useState<ConfigMap | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSaving, setUserSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: configData, error: configError }, usersRes] = await Promise.all([
        supabase.from('integration_config').select('key, value'),
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        }),
      ]);
      if (configError) throw configError;
      const map: ConfigMap = {};
      (configData ?? []).forEach((row: { key: string; value: unknown }) => { map[row.key] = row.value; });
      setConfig(map);
      if (usersRes.ok) {
        const parsed = await usersRes.json() as { users: AuthUser[] };
        setUsers(parsed.users ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveConfig(key: string, value: unknown) {
    setSaving(key);
    setError(null);
    try {
      const { error: upsertError } = await supabase
        .from('integration_config')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (upsertError) throw upsertError;
      setConfig((prev) => ({ ...prev, [key]: value }));
    } catch (err) {
      setError(`Failed to save ${key}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(null);
    }
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback
    }
  }

  async function saveUser() {
    setUserSaving(true);
    setUserError(null);
    try {
      const headers = { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
      if (editingUser) {
        const body: { userId: string; email?: string; password?: string } = { userId: editingUser.id };
        if (userEmail && userEmail !== editingUser.email) body.email = userEmail;
        if (userPassword) body.password = userPassword;
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, { method: 'PUT', headers, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to update user'); }
      } else {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, { method: 'POST', headers, body: JSON.stringify({ email: userEmail, password: userPassword }) });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to create user'); }
      }
      setShowUserForm(false);
      setEditingUser(null);
      setUserEmail('');
      setUserPassword('');
      await load();
    } catch (err) {
      setUserError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setUserSaving(false);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('Remove this user login?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users?userId=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to delete user'); }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  }

  function startEditUser(user: AuthUser) {
    setEditingUser(user);
    setUserEmail(user.email);
    setUserPassword(user.password ?? '');
    setShowUserPassword(false);
    setShowUserForm(true);
    setUserError(null);
  }

  function startAddUser() {
    setEditingUser(null);
    setUserEmail('');
    setUserPassword('');
    setShowUserForm(true);
    setUserError(null);
  }

  const portalDomain = 'portal.wildfirelocal.net';
  const portalPath = (config?.portal_path as string) || '/client-name';
  const trackingCodes = (config?.tracking_codes as TrackingCode[]) || [];
  const emailRecipients = (config?.email_recipients as string[]) || [];
  const zapierWebhook = (config?.zapier_webhook as string) || '';
  const portalFullUrl = `https://${portalDomain}${portalPath}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: '#5A6573' }}>
        <Loader2 size={20} className="animate-spin mr-2" /> Loading integrations…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair font-bold mb-1" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', color: '#0D1B2A' }}>
          Integrations
        </h1>
        <p className="text-sm" style={{ color: '#5A6573' }}>
          View and edit the connections, URLs, and settings powering this project.
        </p>
      </div>

      {error && (
        <div className="rounded-xl p-4 flex items-start gap-3 text-sm" style={{ backgroundColor: '#FBEEEE', border: '1px solid #F1D6D6', color: '#8A2A2A' }}>
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Lead Portal URL */}
      <SectionCard icon={<Link2 size={18} />} title="Lead Portal URL" description="The URL clients visit to log in and view their leads. The domain is fixed; edit the path for each client.">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-dm text-sm" style={{ color: '#8A8A8A' }}>https://{portalDomain}</span>
            <input
              value={portalPath}
              onChange={(e) => {
                const v = e.target.value.startsWith('/') ? e.target.value : '/' + e.target.value;
                setConfig((prev) => ({ ...prev, portal_path: v }));
              }}
              className="rounded-xl px-3 py-2.5 font-dm text-sm outline-none flex-1 min-w-[120px]"
              style={{ border: '1px solid #DDD7CB', color: '#081027' }}
              placeholder="/client-name"
            />
            <button onClick={() => copyToClipboard(portalFullUrl, 'portal-url')} className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 font-dm text-xs font-semibold transition-colors" style={{ border: '1px solid #DDD7CB', color: '#081027' }}>
              {copied === 'portal-url' ? <Check size={14} style={{ color: '#2D6A4F' }} /> : <Copy size={14} />} Copy link
            </button>
            <button onClick={() => saveConfig('portal_path', portalPath)} disabled={saving === 'portal_path'} className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 font-dm text-xs font-semibold text-white transition-opacity disabled:opacity-60" style={{ backgroundColor: '#0D1B2A' }}>
              {saving === 'portal_path' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
            </button>
          </div>
          <p className="font-dm text-xs" style={{ color: '#8A8A8A' }}>Full URL: <span className="font-medium" style={{ color: '#5A6573' }}>{portalFullUrl}</span></p>
        </div>
      </SectionCard>

      {/* Users */}
      <SectionCard icon={<Users size={18} />} title="Users" description="People with login access to the Lead Portal. Create, edit, or remove logins.">
        <div className="space-y-3">
          {users.length === 0 && !showUserForm && (
            <p className="font-dm text-sm py-4 text-center" style={{ color: '#8A8A8A' }}>No portal users yet.</p>
          )}
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ border: '1px solid #E6E0D5', backgroundColor: '#FCFBF8' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF0E8' }}>
                  <Mail size={15} style={{ color: '#D54822' }} />
                </div>
                <div className="min-w-0">
                  <p className="font-dm text-sm font-semibold truncate" style={{ color: '#081027' }}>{user.email}</p>
                  <p className="font-dm text-xs" style={{ color: '#8A8A8A' }}>Added {new Date(user.created_at).toLocaleDateString('en-US')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => startEditUser(user)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 font-dm text-xs font-semibold transition-colors hover:bg-stone-100" style={{ color: '#5A6573' }}>
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => deleteUser(user.id)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 font-dm text-xs font-semibold transition-colors hover:bg-red-50" style={{ color: '#8A2A2A' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {showUserForm && (
            <div className="rounded-xl p-4 space-y-3" style={{ border: '1px solid #C9A84C', backgroundColor: '#FFFDF7' }}>
              <div className="flex items-center justify-between">
                <p className="font-dm text-sm font-semibold" style={{ color: '#0D1B2A' }}>{editingUser ? 'Edit user' : 'New user login'}</p>
                <button onClick={() => { setShowUserForm(false); setEditingUser(null); }} className="p-1 rounded-lg hover:bg-stone-100"><X size={16} style={{ color: '#8A8A8A' }} /></button>
              </div>
              <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Email address" className="w-full rounded-xl px-3.5 py-2.5 font-dm text-sm outline-none" style={{ border: '1px solid #DDD7CB', color: '#081027' }} />
              <div className="relative">
                <input type={showUserPassword ? 'text' : 'password'} value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder={editingUser ? (editingUser.password ? 'Leave blank to keep current' : 'Set a new password to save') : 'Password'} className="w-full rounded-xl px-3.5 py-2.5 pr-20 font-dm text-sm outline-none" style={{ border: '1px solid #DDD7CB', color: '#081027' }} />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button type="button" onClick={() => { if (userPassword) copyToClipboard(userPassword, 'user-password'); }} disabled={!userPassword} className="p-1.5 rounded-lg transition-colors hover:bg-stone-100 disabled:opacity-40" title="Copy password">
                    {copied === 'user-password' ? <Check size={15} style={{ color: '#2D6A4F' }} /> : <Copy size={15} style={{ color: '#8A8A8A' }} />}
                  </button>
                  <button type="button" onClick={() => setShowUserPassword((v) => !v)} className="p-1.5 rounded-lg transition-colors hover:bg-stone-100" title={showUserPassword ? 'Hide password' : 'Show password'}>
                    {showUserPassword ? <EyeOff size={16} style={{ color: '#8A8A8A' }} /> : <Eye size={16} style={{ color: '#8A8A8A' }} />}
                  </button>
                </div>
              </div>
              {userError && <p className="font-dm text-xs" style={{ color: '#8A2A2A' }}>{userError}</p>}
              <button onClick={saveUser} disabled={userSaving || !userEmail || (!editingUser && !userPassword)} className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-dm font-semibold text-sm text-white transition-opacity disabled:opacity-60" style={{ backgroundColor: '#0D1B2A' }}>
                {userSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {editingUser ? 'Save changes' : 'Create login'}
              </button>
            </div>
          )}

          {!showUserForm && (
            <button onClick={startAddUser} className="flex items-center justify-center gap-2 w-full rounded-xl py-3 font-dm text-sm font-semibold transition-colors hover:bg-stone-50" style={{ border: '1px dashed #C9A84C', color: '#0D1B2A' }}>
              <Plus size={15} /> Add user
            </button>
          )}
        </div>
      </SectionCard>

      {/* Tracking Codes */}
      <SectionCard icon={<Facebook size={18} />} title="Tracking Codes" description="Facebook Pixel and event tracking codes installed on the quiz.">
        <div className="space-y-4">
          {trackingCodes.map((code, index) => (
            <div key={index} className="rounded-xl p-4 space-y-3" style={{ border: '1px solid #E6E0D5', backgroundColor: '#FCFBF8' }}>
              <div className="flex items-center justify-between">
                <span className="font-dm text-xs font-semibold uppercase tracking-wider" style={{ color: '#C9A84C' }}>Facebook Pixel</span>
                <button onClick={() => {
                  const updated = trackingCodes.filter((_, i) => i !== index);
                  saveConfig('tracking_codes', updated);
                }} className="p-1 rounded-lg hover:bg-red-50"><Trash2 size={14} style={{ color: '#8A2A2A' }} /></button>
              </div>
              <div>
                <label className="font-dm text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: '#7A8491' }}>Pixel ID</label>
                <input value={code.pixelId} onChange={(e) => {
                  const updated = [...trackingCodes];
                  updated[index] = { ...code, pixelId: e.target.value };
                  setConfig((prev) => ({ ...prev, tracking_codes: updated }));
                }} placeholder="e.g. 123456789012345" className="w-full rounded-xl px-3.5 py-2.5 font-dm text-sm outline-none" style={{ border: '1px solid #DDD7CB', color: '#081027' }} />
              </div>
              <div>
                <label className="font-dm text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: '#7A8491' }}>Events fired</label>
                <div className="space-y-1.5">
                  {code.events.map((event, ei) => (
                    <div key={ei} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#FFF0E8' }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-dm text-xs font-semibold" style={{ color: '#7A5E1F' }}>{event}</span>
                        <span className="font-dm text-xs" style={{ color: '#A07B3B' }}>— {eventTriggerLabel(event)}</span>
                      </div>
                      <button onClick={() => {
                        const updated = [...trackingCodes];
                        updated[index] = { ...code, events: code.events.filter((_, i) => i !== ei) };
                        setConfig((prev) => ({ ...prev, tracking_codes: updated }));
                      }} className="shrink-0"><X size={12} style={{ color: '#A07B3B' }} /></button>
                    </div>
                  ))}
                  <input
                    placeholder="Add event…"
                    className="rounded-lg px-2.5 py-1.5 font-dm text-xs outline-none w-full"
                    style={{ border: '1px solid #DDD7CB', color: '#081027' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          const updated = [...trackingCodes];
                          updated[index] = { ...code, events: [...code.events, val] };
                          setConfig((prev) => ({ ...prev, tracking_codes: updated }));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <button onClick={() => {
              const updated = [...trackingCodes, { pixelId: '', events: ['PageView', 'Lead'] }];
              saveConfig('tracking_codes', updated);
            }} className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-dm text-sm font-semibold transition-colors hover:bg-stone-50" style={{ border: '1px dashed #C9A84C', color: '#0D1B2A' }}>
              <Plus size={14} /> Add tracking code
            </button>
            {trackingCodes.length > 0 && (
              <button onClick={() => saveConfig('tracking_codes', trackingCodes)} disabled={saving === 'tracking_codes'} className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 font-dm text-sm font-semibold text-white transition-opacity disabled:opacity-60" style={{ backgroundColor: '#0D1B2A' }}>
                {saving === 'tracking_codes' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save changes
              </button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Email Notifications */}
      <SectionCard icon={<Mail size={18} />} title="Email Notifications" description="Where lead notification emails are sent via Resend. Add or remove recipient addresses.">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {emailRecipients.map((email, index) => (
              <span key={index} className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 font-dm text-sm font-medium" style={{ backgroundColor: '#FFF0E8', color: '#7A5E1F' }}>
                {email}
                <button onClick={() => {
                  const updated = emailRecipients.filter((_, i) => i !== index);
                  saveConfig('email_recipients', updated);
                }}><X size={13} /></button>
              </span>
            ))}
            {emailRecipients.length === 0 && <p className="font-dm text-sm py-2" style={{ color: '#8A8A8A' }}>No recipients configured.</p>}
          </div>
          <EmailAddField onAdd={(email) => {
            const updated = [...emailRecipients, email];
            saveConfig('email_recipients', updated);
          }} saving={saving === 'email_recipients'} />
        </div>
      </SectionCard>

      {/* External Integrations */}
      <SectionCard icon={<Webhook size={18} />} title="External Integrations" description="Webhook URL for sending lead submissions to Zapier or other automation platforms.">
        <UrlField
          value={zapierWebhook}
          onChange={(v) => setConfig((prev) => ({ ...prev, zapier_webhook: v }))}
          onSave={() => saveConfig('zapier_webhook', zapierWebhook)}
          onCopy={() => copyToClipboard(zapierWebhook, 'zapier-webhook')}
          copied={copied === 'zapier-webhook'}
          saving={saving === 'zapier_webhook'}
          placeholder="https://hooks.zapier.com/hooks/catch/…"
        />
      </SectionCard>
    </div>
  );
}

function eventTriggerLabel(event: string): string {
  switch (event) {
    case 'PageView':
      return 'Fires on page load';
    case 'Lead':
      return 'Fires when the lead form is submitted';
    case 'Purchase':
      return 'Fires when a lead with good credit submits the form';
    case 'Schedule':
      return 'Fires when a booking is confirmed';
    default:
      return 'Custom event';
  }
}

function SectionCard({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E6E0D5', backgroundColor: '#FFFFFF' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: '#F0EDE8' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FFF0E8' }}>
            <span style={{ color: '#D54822' }}>{icon}</span>
          </div>
          <div>
            <h2 className="font-playfair font-semibold text-base" style={{ color: '#0D1B2A' }}>{title}</h2>
            <p className="font-dm text-xs mt-0.5" style={{ color: '#8A8A8A' }}>{description}</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

function UrlField({ value, onChange, onSave, onCopy, copied, saving, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCopy: () => void;
  copied: boolean;
  saving: boolean;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1 min-w-[200px] rounded-xl px-3.5 py-2.5 font-dm text-sm outline-none" style={{ border: '1px solid #DDD7CB', color: '#081027' }} />
      <button onClick={onCopy} className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 font-dm text-xs font-semibold transition-colors" style={{ border: '1px solid #DDD7CB', color: '#081027' }}>
        {copied ? <Check size={14} style={{ color: '#2D6A4F' }} /> : <Copy size={14} />} Copy
      </button>
      <button onClick={onSave} disabled={saving} className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 font-dm text-xs font-semibold text-white transition-opacity disabled:opacity-60" style={{ backgroundColor: '#0D1B2A' }}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
      </button>
    </div>
  );
}

function EmailAddField({ onAdd, saving }: { onAdd: (email: string) => void; saving: boolean }) {
  const [email, setEmail] = useState('');
  return (
    <div className="flex items-center gap-2">
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Add recipient email…" className="flex-1 rounded-xl px-3.5 py-2.5 font-dm text-sm outline-none" style={{ border: '1px solid #DDD7CB', color: '#081027' }} />
      <button
        onClick={() => { if (email.trim() && email.includes('@')) { onAdd(email.trim()); setEmail(''); } }}
        disabled={saving || !email.trim()}
        className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 font-dm text-xs font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ backgroundColor: '#0D1B2A' }}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
      </button>
    </div>
  );
}
