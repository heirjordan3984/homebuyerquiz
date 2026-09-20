/*
  # Create grid_images table

  1. New Tables
    - `grid_images`
      - `id` (uuid, primary key)
      - `url` (text, unique) - the image URL, unique constraint prevents duplicates
      - `filename` (text) - original filename for reference
      - `sort_order` (integer) - controls display order; lower = shown first
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `grid_images` table
    - Public read access (grid is shown to all visitors)
    - No insert/update/delete from client (managed via edge function with service role)

  3. Notes
    - The UNIQUE constraint on `url` is the primary safeguard against duplicates
    - sort_order allows custom images (uploaded by admin) to appear before Pexels fallbacks
*/

CREATE TABLE IF NOT EXISTS grid_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text UNIQUE NOT NULL,
  filename text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 999,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grid_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view grid images"
  ON grid_images
  FOR SELECT
  TO anon, authenticated
  USING (true);
