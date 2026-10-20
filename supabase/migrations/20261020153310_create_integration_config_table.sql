/*
# Create integration_config table

1. New Tables
- `integration_config`
  - `id` (uuid, primary key)
  - `key` (text, unique, not null) — identifies the config entry (e.g. 'quiz_url', 'portal_path', 'tracking_codes', 'email_recipients', 'zapier_webhook')
  - `value` (jsonb, not null) — the config value(s), shape depends on the key
  - `updated_at` (timestamptz, default now())
2. Security
- Enable RLS on `integration_config`.
- Allow anon + authenticated full CRUD because the admin panel (no auth) reads and writes these settings directly from the browser.
*/

CREATE TABLE IF NOT EXISTS integration_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE integration_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_integration_config" ON integration_config;
CREATE POLICY "anon_select_integration_config" ON integration_config
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_integration_config" ON integration_config;
CREATE POLICY "anon_insert_integration_config" ON integration_config
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_integration_config" ON integration_config;
CREATE POLICY "anon_update_integration_config" ON integration_config
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_integration_config" ON integration_config;
CREATE POLICY "anon_delete_integration_config" ON integration_config
  FOR DELETE TO anon, authenticated USING (true);

-- Seed default rows
INSERT INTO integration_config (key, value) VALUES
  ('quiz_url', '"https://homeiqquiz.com"'),
  ('portal_path', '"/portal"'),
  ('tracking_codes', '[{"pixelId":"", "events":["PageView","Lead"]}]'),
  ('email_recipients', '["jordan@wildfirelocal.net"]'),
  ('zapier_webhook', '""')
ON CONFLICT (key) DO NOTHING;
