/*
# Create branding-assets storage bucket

1. Description
- Creates a public storage bucket `branding-assets` for storing the business logo
  uploaded from the admin Integrations page.
- Adds a public-read + anon/authenticated-upload policy so the admin (no-auth) panel
  can upload logos directly from the browser and the quiz can read them via public URL.

2. Storage changes
- New bucket: `branding-assets` (public = true).

3. Security
- SELECT (read) public for anon + authenticated — logos must render on the public quiz.
- INSERT/UPDATE/DELETE for anon + authenticated — the admin panel has no auth so anon
  must be able to upload. This is acceptable because the bucket only holds branding
  imagery, not sensitive data.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('branding-assets', 'branding-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_branding_assets" ON storage.objects;
CREATE POLICY "anon_read_branding_assets" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'branding-assets');

DROP POLICY IF EXISTS "anon_insert_branding_assets" ON storage.objects;
CREATE POLICY "anon_insert_branding_assets" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'branding-assets');

DROP POLICY IF EXISTS "anon_update_branding_assets" ON storage.objects;
CREATE POLICY "anon_update_branding_assets" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'branding-assets')
  WITH CHECK (bucket_id = 'branding-assets');

DROP POLICY IF EXISTS "anon_delete_branding_assets" ON storage.objects;
CREATE POLICY "anon_delete_branding_assets" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'branding-assets');
