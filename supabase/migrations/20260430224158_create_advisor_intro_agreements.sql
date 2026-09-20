/*
  # Create advisor_intro_agreements table

  1. New Tables
    - `advisor_intro_agreements`
      - `id` (uuid, primary key)
      - `seller_email` (text) — email captured by the AI caller
      - `date_time` (timestamptz) — ISO date of the agreed intro
      - `created_at` (timestamptz) — when the record was inserted

  2. Security
    - Enable RLS
    - Allow anon SELECT (admin dashboard uses anon key)
    - Allow anon INSERT (AI caller posts to the endpoint with anon key)
*/

CREATE TABLE IF NOT EXISTS advisor_intro_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_email text NOT NULL DEFAULT '',
  date_time timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS advisor_intro_agreements_email_idx
  ON advisor_intro_agreements (seller_email);

CREATE INDEX IF NOT EXISTS advisor_intro_agreements_created_idx
  ON advisor_intro_agreements (created_at DESC);

ALTER TABLE advisor_intro_agreements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'advisor_intro_agreements' AND policyname = 'anon can read intro agreements'
  ) THEN
    CREATE POLICY "anon can read intro agreements"
      ON advisor_intro_agreements FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'advisor_intro_agreements' AND policyname = 'anon can insert intro agreements'
  ) THEN
    CREATE POLICY "anon can insert intro agreements"
      ON advisor_intro_agreements FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;