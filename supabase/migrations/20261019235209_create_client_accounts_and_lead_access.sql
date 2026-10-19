/*
# Create client accounts and secure lead access

1. New Tables
- `client_accounts` — one row per client organization, with a stable identifier and display name.
- `client_members` — connects authenticated Supabase users to a client account for future multi-user access.

2. Modified Tables
- `lead_submissions.client_account_id` — assigns each lead to the client that owns it.
- Existing leads are assigned to the initial Wildfire Local client account.
- New public quiz submissions default to the initial client account until client-specific quiz routing is added.

3. Security
- RLS is enabled on both new tables.
- Authenticated client members can read only their own client account and membership row.
- Authenticated users can read only leads assigned to their client account.
- Public visitors retain insert-only access to create quiz leads.
- Client users cannot insert, update, or delete client accounts, memberships, or leads.

4. Important Notes
- The initial client account uses a fixed identifier so the template can safely assign current quiz submissions.
- Additional users can be added later by creating an auth user and a matching `client_members` row.
*/

CREATE TABLE IF NOT EXISTS client_accounts (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO client_accounts (id, name)
VALUES ('1c5d9e55-4b6e-4f4c-8e0f-1a9dc8f7b211', 'Wildfire Local')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS client_members (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  client_account_id uuid NOT NULL REFERENCES client_accounts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lead_submissions
  ADD COLUMN IF NOT EXISTS client_account_id uuid REFERENCES client_accounts(id);

UPDATE lead_submissions
SET client_account_id = '1c5d9e55-4b6e-4f4c-8e0f-1a9dc8f7b211'
WHERE client_account_id IS NULL;

ALTER TABLE lead_submissions
  ALTER COLUMN client_account_id SET DEFAULT '1c5d9e55-4b6e-4f4c-8e0f-1a9dc8f7b211';

CREATE INDEX IF NOT EXISTS lead_submissions_client_created_idx
  ON lead_submissions (client_account_id, created_at DESC);

ALTER TABLE client_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_members ENABLE ROW LEVEL SECURITY;

REVOKE INSERT, UPDATE, DELETE ON client_accounts FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON client_members FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON lead_submissions FROM authenticated;

DROP POLICY IF EXISTS "Members can view their client account" ON client_accounts;
CREATE POLICY "Members can view their client account"
  ON client_accounts FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM client_members
    WHERE client_members.client_account_id = client_accounts.id
      AND client_members.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Members can view their membership" ON client_members;
CREATE POLICY "Members can view their membership"
  ON client_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Members can view their client leads" ON lead_submissions;
CREATE POLICY "Members can view their client leads"
  ON lead_submissions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM client_members
    WHERE client_members.client_account_id = lead_submissions.client_account_id
      AND client_members.user_id = auth.uid()
  ));
