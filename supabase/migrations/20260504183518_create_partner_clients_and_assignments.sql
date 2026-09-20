/*
  # Partner round-robin routing

  1. New Tables
    - `partner_clients` — the pool of GHL sub-account clients the AI agent can route calls to.
      - `id` (uuid, pk)
      - `name` (text) — display name of the client / brokerage
      - `ghl_subaccount_id` (text) — GHL Location ID, optional
      - `forwarding_number` (text) — E.164 phone number to transfer the call to
      - `region` (text) — optional territory tag, e.g. a state, metro, or zip prefix
      - `active` (bool) — whether this client is eligible for routing
      - `priority_weight` (int) — higher weight = larger share (default 1)
      - `last_assigned_at` (timestamptz) — updated each time we route to this client
      - `assigned_count` (int) — cumulative counter for auditing
      - `created_at` / `updated_at` (timestamptz)

    - `partner_call_assignments` — audit log of every routed call.
      - `id` (uuid, pk)
      - `partner_client_id` (uuid, fk)
      - `call_id` (text) — Vapi call id
      - `region` (text) — region requested at dispatch time
      - `reason` (text) — "round_robin" / "fallback" / etc.
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on both tables.
    - `anon` may SELECT for read-only admin dashboards (no write access).
    - All mutations happen via the service role from edge functions.
*/

CREATE TABLE IF NOT EXISTS partner_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  ghl_subaccount_id text NOT NULL DEFAULT '',
  forwarding_number text NOT NULL,
  region text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  priority_weight int NOT NULL DEFAULT 1,
  last_assigned_at timestamptz,
  assigned_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_clients_active_region_idx
  ON partner_clients (active, region, last_assigned_at NULLS FIRST);

CREATE TABLE IF NOT EXISTS partner_call_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_client_id uuid REFERENCES partner_clients(id) ON DELETE SET NULL,
  call_id text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT 'round_robin',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_call_assignments_created_idx
  ON partner_call_assignments (created_at DESC);

ALTER TABLE partner_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_call_assignments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='partner_clients' AND policyname='anon can read partner clients') THEN
    CREATE POLICY "anon can read partner clients" ON partner_clients FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='partner_call_assignments' AND policyname='anon can read partner call assignments') THEN
    CREATE POLICY "anon can read partner call assignments" ON partner_call_assignments FOR SELECT TO anon USING (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION pick_next_partner_client(p_region text DEFAULT NULL)
RETURNS partner_clients
LANGUAGE plpgsql
AS $$
DECLARE
  chosen partner_clients;
BEGIN
  -- Lock the row with the oldest last_assigned_at among eligible clients, preferring exact region match.
  SELECT * INTO chosen
  FROM partner_clients
  WHERE active = true
    AND (p_region IS NULL OR p_region = '' OR region = p_region)
  ORDER BY last_assigned_at NULLS FIRST, assigned_count ASC, created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF chosen.id IS NULL AND p_region IS NOT NULL AND p_region <> '' THEN
    -- Fall back to any active client regardless of region.
    SELECT * INTO chosen
    FROM partner_clients
    WHERE active = true
    ORDER BY last_assigned_at NULLS FIRST, assigned_count ASC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1;
  END IF;

  IF chosen.id IS NOT NULL THEN
    UPDATE partner_clients
    SET last_assigned_at = now(),
        assigned_count = assigned_count + 1,
        updated_at = now()
    WHERE id = chosen.id
    RETURNING * INTO chosen;
  END IF;

  RETURN chosen;
END;
$$;