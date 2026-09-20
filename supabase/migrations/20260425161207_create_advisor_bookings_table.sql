/*
  # Create advisor_bookings table

  Stores advisor call bookings made from the results screen, including the
  preferred call type (phone or zoom) and scheduled time. Bookings are kept
  indefinitely so they can be exported alongside leads.

  1. New Tables
    - `advisor_bookings`
      - `id` (uuid, primary key)
      - `name` (text) — booker's name
      - `email` (text) — booker's email
      - `phone` (text) — booker's phone (required for phone calls)
      - `property_address` (text) — property address from quiz, if known
      - `call_type` (text) — 'phone' or 'zoom'
      - `scheduled_at` (timestamptz) — selected appointment time
      - `timezone` (text) — IANA timezone the user booked from
      - `notes` (text) — optional additional context from the user
      - `created_at` (timestamptz) — record creation time
  2. Security
    - Enable RLS on `advisor_bookings`
    - Add INSERT policy for anon and authenticated users so the public
      results page can create a booking.
    - No SELECT/UPDATE/DELETE policies — reads are restricted to the service
      role (used by exports), keeping bookings private from the browser.
  3. Indexes
    - btree on `scheduled_at` for upcoming-bookings views
    - btree on `created_at desc` for export ordering
*/

CREATE TABLE IF NOT EXISTS advisor_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  property_address text NOT NULL DEFAULT '',
  call_type text NOT NULL DEFAULT 'phone',
  scheduled_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS advisor_bookings_scheduled_at_idx
  ON advisor_bookings (scheduled_at);

CREATE INDEX IF NOT EXISTS advisor_bookings_created_at_idx
  ON advisor_bookings (created_at DESC);

ALTER TABLE advisor_bookings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'advisor_bookings'
      AND policyname = 'Anyone can create a booking'
  ) THEN
    CREATE POLICY "Anyone can create a booking"
      ON advisor_bookings
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;
