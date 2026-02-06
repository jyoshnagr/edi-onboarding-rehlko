/*
  # Rename Company-Specific Field to Generic Name
  
  1. Changes
    - Rename `americold_contacts` column to `vendor_contacts` in `intake_extractions` table
    
  2. Purpose
    - Remove company-specific branding from database schema
    - Make the application more generic for multi-client demos
    
  3. Data Safety
    - Uses `IF EXISTS` check to safely rename column
    - Preserves all existing data
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intake_extractions' AND column_name = 'americold_contacts'
  ) THEN
    ALTER TABLE intake_extractions RENAME COLUMN americold_contacts TO vendor_contacts;
  END IF;
END $$;