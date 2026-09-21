/*
# Create quiz_sessions table for drop-off analytics

1. New Tables
  - `quiz_sessions`
    - `id` (uuid, primary key) — unique session identifier
    - `session_token` (text, unique) — anonymous token generated client-side to tie progress events together
    - `current_step` (int) — index into the screen sequence the user has reached
    - `step_type` (text) — type of the current screen: 'question', 'infoSlide', 'evaluating', 'gate', 'results'
    - `step_label` (text) — human-readable label for the current step (e.g. "Q3: Property Address")
    - `questions_answered` (int) — count of questions answered so far
    - `total_questions` (int) — total questions in the quiz (always 18)
    - `completed` (boolean, default false) — whether the user reached the gate (lead form)
    - `lead_email` (text, nullable) — email of the lead if they completed
    - `created_at` (timestamptz) — when the session started
    - `updated_at` (timestamptz) — last activity time

2. Security
  - Enable RLS on `quiz_sessions`.
  - Allow anon + authenticated INSERT and UPDATE so the public quiz can record progress.
  - No SELECT/DELETE from the browser — reads happen through the quiz-analytics edge function using the service role key.

3. Indexes
  - btree on `created_at desc` for date-range queries
  - btree on `session_token` for upsert lookups
*/

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text UNIQUE NOT NULL,
  current_step int NOT NULL DEFAULT 0,
  step_type text NOT NULL DEFAULT 'question',
  step_label text NOT NULL DEFAULT 'Start',
  questions_answered int NOT NULL DEFAULT 0,
  total_questions int NOT NULL DEFAULT 18,
  completed boolean NOT NULL DEFAULT false,
  lead_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_sessions_created_at_idx ON quiz_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS quiz_sessions_session_token_idx ON quiz_sessions (session_token);

ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert quiz sessions" ON quiz_sessions;
CREATE POLICY "Anyone can insert quiz sessions"
  ON quiz_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update quiz sessions" ON quiz_sessions;
CREATE POLICY "Anyone can update quiz sessions"
  ON quiz_sessions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
