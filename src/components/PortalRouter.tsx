import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ClientLogin from './ClientLogin';
import ClientDashboard from './ClientDashboard';

export function formatClientName(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function PortalRouter({ clientSlug }: { clientSlug: string }) {
  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!active) return;
      setAuthenticated(!!sessionData.session);
      setAuthReady(true);
    }

    check();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
      setAuthReady(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center font-dm" style={{ backgroundColor: '#07111B', color: '#5A6573' }}>
        Loading your workspace…
      </div>
    );
  }

  const clientName = formatClientName(clientSlug);

  if (!authenticated) {
    return <ClientLogin portalMode />;
  }

  return <ClientDashboard portalMode clientName={clientName} />;
}
