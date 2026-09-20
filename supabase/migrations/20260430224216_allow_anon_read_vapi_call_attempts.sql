/*
  # Allow anon read on vapi_call_attempts

  1. Security
    - Adds a SELECT policy allowing anon role to read call attempts for the
      admin analytics dashboard. No INSERT/UPDATE/DELETE is granted.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vapi_call_attempts' AND policyname = 'anon can read call attempts'
  ) THEN
    CREATE POLICY "anon can read call attempts"
      ON vapi_call_attempts FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;