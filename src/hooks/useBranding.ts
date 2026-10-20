import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Branding = {
  businessName: string;
  logoUrl: string | null;
};

const DEFAULT_BRANDING: Branding = { businessName: 'HomeIQ', logoUrl: null };

let cached: Branding | null = null;

export function useBranding() {
  const [branding, setBranding] = useState<Branding>(cached ?? DEFAULT_BRANDING);

  useEffect(() => {
    if (cached) return;
    let active = true;
    supabase
      .from('integration_config')
      .select('key, value')
      .in('key', ['business_name', 'logo_url'])
      .then(({ data, error }) => {
        if (!active || error || !data) return;
        const map: Record<string, unknown> = {};
        data.forEach((row: { key: string; value: unknown }) => { map[row.key] = row.value; });
        const next: Branding = {
          businessName: typeof map.business_name === 'string' && map.business_name ? map.business_name : DEFAULT_BRANDING.businessName,
          logoUrl: typeof map.logo_url === 'string' ? map.logo_url : null,
        };
        cached = next;
        setBranding(next);
      });
    return () => { active = false; };
  }, []);

  return branding;
}

export function refreshBranding(next: Branding) {
  cached = next;
}
