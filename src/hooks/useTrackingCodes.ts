import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

type TrackingCode = {
  pixelId: string;
  events: string[];
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Loads tracking codes from the integration_config table and initializes
 * the Facebook Pixel with the configured pixel ID. Fires the events listed
 * in the config (e.g. PageView) on first load.
 *
 * This makes tracking codes two-way: editing them on the Integrations page
 * changes which pixel is loaded on the next quiz visit.
 */
export function useTrackingCodes() {
  const initialized = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data, error } = await supabase
          .from('integration_config')
          .select('value')
          .eq('key', 'tracking_codes')
          .maybeSingle();

        if (error || !active) return;

        const codes = data?.value as TrackingCode[] | null;
        if (!Array.isArray(codes)) return;

        for (const code of codes) {
          if (!code.pixelId || initialized.current.has(code.pixelId)) continue;
          initialized.current.add(code.pixelId);

          if (typeof window.fbq === 'function') {
            window.fbq('init', code.pixelId);
            // Fire events configured for this pixel
            for (const event of code.events) {
              if (event === 'PageView') {
                window.fbq('track', 'PageView');
              }
            }
          }
        }
      } catch {
        // Silent fail — tracking is non-critical
      }
    }

    load();
  }, []);
}
