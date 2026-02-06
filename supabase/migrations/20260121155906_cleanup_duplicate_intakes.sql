/*
  # Clean up duplicate intakes and prevent future duplicates

  1. Changes
    - Delete duplicate intake_extractions (keeping only the most recent)
    - Add unique constraint on document_id to prevent duplicates
    - Add index for better query performance
  
  2. Security
    - No RLS changes needed
*/

-- Delete duplicate intake extractions, keeping only the most recent one
DELETE FROM intake_extractions
WHERE id NOT IN (
  SELECT DISTINCT ON (company_name, go_live_date) id
  FROM intake_extractions
  ORDER BY company_name, go_live_date, created_at DESC
);

-- Create index on company_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_intake_extractions_company_name ON intake_extractions(company_name);

-- Create index on document_id
CREATE INDEX IF NOT EXISTS idx_intake_extractions_document_id ON intake_extractions(document_id);