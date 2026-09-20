/*
  # Create vapi_intro_agreement_logs table

  1. New Tables
    - `vapi_intro_agreement_logs`
      - `id` (uuid, primary key)
      - `status_code` (int) — HTTP response code returned to caller
      - `raw_body` (text) — raw request body as received
      - `parsed_email` (text) — seller_email extracted if any
      - `parsed_date_time` (timestamptz) — date_time parsed if valid
      - `error` (text) — error message if the request failed
      - `user_agent` (text) — user agent header
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Allow anon SELECT for the admin dashboard
*/

CREATE TABLE IF NOT EXISTS vapi_intro_agreement_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status_code int NOT NULL DEFAULT 0,
  raw_body text NOT NULL DEFAULT '',
  parsed_email text NOT NULL DEFAULT '',
  parsed_date_time timestamptz,
  error text,
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vapi_intro_agreement_logs_created_idx
  ON vapi_intro_agreement_logs (created_at DESC);

ALTER TABLE vapi_intro_agreement_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vapi_intro_agreement_logs' AND policyname = 'anon can read intro agreement logs'
  ) THEN
    CREATE POLICY "anon can read intro agreement logs"
      ON vapi_intro_agreement_logs FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;