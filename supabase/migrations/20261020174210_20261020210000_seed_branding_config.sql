/*
# Seed branding config rows

1. Description
- Adds default branding config to the existing `integration_config` table so the quiz
  business name and logo are editable from the admin Integrations page.
- `business_name`: the wordmark text shown on every quiz page (replaces the hard-coded "HomeIQ").
- `logo_url`: optional URL to a logo image. When set, the home page shows the logo image
  instead of the plain text wordmark.

2. Tables modified
- `integration_config` — no schema changes, just new rows via ON CONFLICT DO NOTHING.

3. Security
- No new tables. RLS already allows anon + authenticated CRUD on `integration_config`.
*/

INSERT INTO integration_config (key, value) VALUES
  ('business_name', '"HomeIQ"'),
  ('logo_url', 'null')
ON CONFLICT (key) DO NOTHING;
