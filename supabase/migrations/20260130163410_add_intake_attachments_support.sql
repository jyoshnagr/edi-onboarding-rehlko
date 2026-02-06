/*
  # Add Attachment Support for EDI Intakes

  1. New Tables
    - `intake_attachments`
      - `id` (uuid, primary key)
      - `intake_id` (uuid, foreign key to intake_extractions)
      - `file_name` (text, name of the uploaded file)
      - `file_type` (text, MIME type)
      - `file_size` (integer, size in bytes)
      - `file_url` (text, URL or path to the file)
      - `uploaded_by` (text, user who uploaded)
      - `upload_category` (text, e.g., 'data_format', 'mapping_spec', 'test_data', 'other')
      - `description` (text, optional description)
      - `uploaded_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `intake_attachments` table
    - Add policies for public access (temporary for development)

  3. Indexes
    - Add index on intake_id for fast lookups
*/

CREATE TABLE IF NOT EXISTS intake_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid REFERENCES intake_extractions(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  file_url text NOT NULL,
  uploaded_by text NOT NULL DEFAULT 'system',
  upload_category text NOT NULL DEFAULT 'other',
  description text,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_intake_attachments_intake_id ON intake_attachments(intake_id);
CREATE INDEX IF NOT EXISTS idx_intake_attachments_category ON intake_attachments(upload_category);

-- Enable RLS
ALTER TABLE intake_attachments ENABLE ROW LEVEL SECURITY;

-- Public access policies for development
CREATE POLICY "Allow public read access to intake attachments"
  ON intake_attachments FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to intake attachments"
  ON intake_attachments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to intake attachments"
  ON intake_attachments FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to intake attachments"
  ON intake_attachments FOR DELETE
  USING (true);