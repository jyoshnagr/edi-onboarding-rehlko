/*
  # Update RLS Policies for Public Access

  ## Changes
  Update all read policies to allow anonymous/public access for the prototype demo.
  This allows the application to function without requiring authentication setup.

  ## Security Note
  In production, these would be restricted to authenticated users only.
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow read access to trading_partners" ON trading_partners;
DROP POLICY IF EXISTS "Allow read access to onboarding_requests" ON onboarding_requests;
DROP POLICY IF EXISTS "Allow read access to meetings" ON meetings;
DROP POLICY IF EXISTS "Allow read access to readiness_scores" ON readiness_scores;
DROP POLICY IF EXISTS "Allow read access to blockers" ON blockers;
DROP POLICY IF EXISTS "Allow read access to decisions" ON decisions;

DROP POLICY IF EXISTS "Allow insert to trading_partners" ON trading_partners;
DROP POLICY IF EXISTS "Allow update to trading_partners" ON trading_partners;
DROP POLICY IF EXISTS "Allow insert to onboarding_requests" ON onboarding_requests;
DROP POLICY IF EXISTS "Allow update to onboarding_requests" ON onboarding_requests;
DROP POLICY IF EXISTS "Allow insert to meetings" ON meetings;
DROP POLICY IF EXISTS "Allow insert to readiness_scores" ON readiness_scores;
DROP POLICY IF EXISTS "Allow insert to blockers" ON blockers;
DROP POLICY IF EXISTS "Allow update to blockers" ON blockers;
DROP POLICY IF EXISTS "Allow insert to decisions" ON decisions;

-- Create new public access policies for SELECT (read)
CREATE POLICY "Public read access to trading_partners"
  ON trading_partners FOR SELECT
  USING (true);

CREATE POLICY "Public read access to onboarding_requests"
  ON onboarding_requests FOR SELECT
  USING (true);

CREATE POLICY "Public read access to meetings"
  ON meetings FOR SELECT
  USING (true);

CREATE POLICY "Public read access to readiness_scores"
  ON readiness_scores FOR SELECT
  USING (true);

CREATE POLICY "Public read access to blockers"
  ON blockers FOR SELECT
  USING (true);

CREATE POLICY "Public read access to decisions"
  ON decisions FOR SELECT
  USING (true);

-- Allow public insert/update for demo purposes
CREATE POLICY "Public insert to onboarding_requests"
  ON onboarding_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update to onboarding_requests"
  ON onboarding_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public insert to decisions"
  ON decisions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update to blockers"
  ON blockers FOR UPDATE
  USING (true)
  WITH CHECK (true);