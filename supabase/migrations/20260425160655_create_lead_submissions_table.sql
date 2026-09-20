/*
  # Create lead_submissions table

  Stores every quiz form submission (lead capture) indefinitely so the operator
  can review and export leads.

  1. New Tables
    - `lead_submissions`
      - `id` (uuid, primary key) — internal identifier
      - `name` (text) — lead's name from gate screen
      - `email` (text) — lead's email
      - `phone` (text) — lead's phone (optional)
      - `property_address` (text) — full property address
      - `property_lat` (double precision) — property latitude (optional)
      - `property_lng` (double precision) — property longitude (optional)
      - `quiz_answers` (jsonb) — full quiz answers payload (option indexes & text answers, with question text)
      - `created_at` (timestamptz) — submission time
  2. Security
    - Enable RLS on `lead_submissions`
    - Add INSERT policy for anon and authenticated users so the public-facing
      quiz can persist a submission (lead capture is the entire purpose of the table).
    - No SELECT/UPDATE/DELETE policies — reads are intentionally restricted to
      the service role (used by the export edge function), keeping captured leads
      private and never readable from the browser.
  3. Indexes
    - btree on `created_at desc` to support efficient export ordering.
*/

CREATE TABLE IF NOT EXISTS lead_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  property_address text NOT NULL DEFAULT '',
  property_lat double precision,
  property_lng double precision,
  quiz_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_submissions_created_at_idx
  ON lead_submissions (created_at DESC);

ALTER TABLE lead_submissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lead_submissions'
      AND policyname = 'Anyone can submit a lead'
  ) THEN
    CREATE POLICY "Anyone can submit a lead"
      ON lead_submissions
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;
