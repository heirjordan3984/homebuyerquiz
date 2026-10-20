import { useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ClientLogin({ portalMode = false, clientName }: { portalMode?: boolean; clientName?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setError('That email and password combination could not be verified.');
      setLoading(false);
      return;
    }

    if (portalMode) {
      setAuthReadyAndReload();
    } else {
      window.location.hash = 'client-dashboard';
    }
  }

  function setAuthReadyAndReload() {
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#07111B' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/WildfireMarketingWhiteTransparent copy 2.png" alt="Wildfire Marketing" className="w-64 max-w-full h-auto mx-auto mb-8" />
          <h1 className="font-playfair font-bold mt-0" style={{ fontSize: 'clamp(2rem, 7vw, 3.1rem)', color: '#FFFFFF' }}>Lead Portal</h1>
          {portalMode && clientName && <p className="font-dm text-sm mt-2" style={{ color: '#FFB347' }}>{clientName}</p>}
        </div>

        <div className="rounded-3xl p-6 sm:p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E6E0D5', boxShadow: '0 18px 60px rgba(13,27,42,0.08)' }}>
          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#FFF0E8', color: '#D54822' }}>
              <LockKeyhole size={20} />
            </div>
            <div>
              <p className="font-dm font-semibold text-sm" style={{ color: '#081827' }}>Private client access</p>
              <p className="font-dm text-xs mt-0.5" style={{ color: '#8A8A8A' }}>Your leads are visible only to your team.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="font-dm text-xs font-semibold uppercase tracking-wider" style={{ color: '#5A6573' }}>Email address</span>
              <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl px-4 py-3.5 outline-none font-dm text-sm" style={{ border: '1px solid #DDD7CB', color: '#081827', backgroundColor: '#FCFBF8' }} />
            </label>
            <label className="block">
              <span className="font-dm text-xs font-semibold uppercase tracking-wider" style={{ color: '#5A6573' }}>Password</span>
              <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl px-4 py-3.5 outline-none font-dm text-sm" style={{ border: '1px solid #DDD7CB', color: '#081827', backgroundColor: '#FCFBF8' }} />
            </label>
            {error && <p role="alert" className="rounded-xl px-4 py-3 text-sm font-dm" style={{ color: '#8A2A2A', backgroundColor: '#FBEEEE', border: '1px solid #F1D6D6' }}>{error}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-dm font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60" style={{ backgroundColor: '#081827', color: '#FFFFFF' }}>
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 mt-6 pt-5" style={{ borderTop: '1px solid #F0EDE8' }}>
            <ShieldCheck size={14} style={{ color: '#2D6A4F' }} />
            <span className="font-dm text-xs" style={{ color: '#8A8A8A' }}>Protected client workspace</span>
          </div>
        </div>

        {portalMode ? (
          <a href="/" className="block text-center mt-6 font-dm text-sm font-semibold" style={{ color: '#B8C4CE' }}>Back to home</a>
        ) : (
          <a href="#" className="block text-center mt-6 font-dm text-sm font-semibold" style={{ color: '#081827' }}>Back to quiz preview</a>
        )}
      </div>
    </main>
  );
}
