/*
  # Create vapi_call_attempts table

  1. New Tables
    - `vapi_call_attempts`
      - `id` (uuid, primary key)
      - `lead_submission_id` (uuid, FK to lead_submissions, nullable)
      - `name` (text)
      - `phone` (text)
      - `email` (text)
      - `address` (text)
      - `scheduled_for` (timestamptz) — when call should fire
      - `status` (text) — 'pending' | 'placed' | 'failed' | 'cancelled'
      - `vapi_call_id` (text, nullable) — id returned from VAPI
      - `error` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS
    - No public policies (service role only writes/reads via edge functions)
*/

CREATE TABLE IF NOT EXISTS vapi_call_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_submission_id uuid REFERENCES lead_submissions(id) ON DELETE SET NULL,
  name text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'pending',
  vapi_call_id text,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vapi_call_attempts ENABLE ROW LEVEL SECURITY;
