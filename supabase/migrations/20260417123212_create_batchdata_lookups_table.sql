/*
  # Create batchdata_lookups cache table

  1. New Tables
    - `batchdata_lookups`
      - `address` (text, primary key) — normalized full address used as cache key
      - `response` (jsonb) — full BatchData property payload
      - `fetched_at` (timestamptz) — when the lookup was performed

  2. Security
    - Enable RLS on `batchdata_lookups`
    - NO public policies are created. Only the service role (used by the
      `batchdata-lookup` edge function) can read or write this table, which
      bypasses RLS. Anonymous and authenticated clients cannot read cached
      property data directly.

  3. Notes
    - Acts as a 30-day cache layer in front of the paid BatchData API
    - `fetched_at` drives cache invalidation in the edge function
*/

CREATE TABLE IF NOT EXISTS batchdata_lookups (
  address text PRIMARY KEY,
  response jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE batchdata_lookups ENABLE ROW LEVEL SECURITY;
