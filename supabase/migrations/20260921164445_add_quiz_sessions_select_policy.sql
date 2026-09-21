/*
# Allow anon to read quiz_sessions for upsert conflict detection

1. Security
  - Add SELECT policy on quiz_sessions for anon + authenticated.
  - The client uses upsert with onConflict: 'session_token', which requires
    the ability to read existing rows to detect conflicts. Without a SELECT
    policy, the upsert fails silently and no session rows are ever recorded.
  - This data is non-sensitive analytics metadata (step progress, no PII beyond
    email which is already stored in lead_submissions). Safe to expose.
*/

DROP POLICY IF EXISTS "Anyone can read quiz sessions" ON quiz_sessions;
CREATE POLICY "Anyone can read quiz sessions"
  ON quiz_sessions FOR SELECT
  TO anon, authenticated
  USING (true);
