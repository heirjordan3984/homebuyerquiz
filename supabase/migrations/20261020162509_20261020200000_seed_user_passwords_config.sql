/*
# Seed user_passwords key in integration_config

1. Purpose
   Supabase Auth stores passwords as one-way hashes, so they cannot be
   retrieved after creation. To let the admin panel show the current password
   when editing a user, we store a JSON map of { userId: password } in the
   existing integration_config table under the key 'user_passwords'.
   The manage-users edge function will keep this map in sync on create/update/delete.

2. Changes
   - Inserts a 'user_passwords' row with an empty JSON object {} if it does not
     already exist. Existing data is never overwritten (ON CONFLICT DO NOTHING).

3. Security
   - No new tables. RLS on integration_config already allows anon/authenticated
     CRUD (admin panel has no auth screen).
*/

INSERT INTO integration_config (key, value)
VALUES ('user_passwords', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;