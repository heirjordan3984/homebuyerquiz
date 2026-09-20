/*
  # Create market_stats_cache table

  1. New Tables
    - `market_stats_cache`
      - `zip` (text, primary key) — 5-digit zip code
      - `payload` (jsonb) — full Rentcast /markets sale stats response
      - `fetched_at` (timestamptz) — when the data was fetched (used for 24h TTL)

  2. Security
    - Enable RLS on `market_stats_cache`
    - No client-side access. Only the service role (used by edge functions) can read/write.
    - No policies are added so authenticated/anon users cannot read or write directly.

  3. Notes
    - Edge functions use the service role key which bypasses RLS.
    - Cached entries are refreshed when older than 24 hours by the edge function.
*/

CREATE TABLE IF NOT EXISTS market_stats_cache (
  zip text PRIMARY KEY,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE market_stats_cache ENABLE ROW LEVEL SECURITY;
