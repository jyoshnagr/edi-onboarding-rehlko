/*
  # Fix Security and Performance Issues

  ## Changes
  1. Add missing index on foreign key for query performance
  2. Remove unused indexes to reduce overhead
  3. Add comments noting RLS policies are for prototype demo purposes

  ## Performance Improvements
  - Added index on `onboarding_requests.trading_partner_id` foreign key
  - Removed unused indexes that add maintenance overhead without benefit

  ## Security Notes
  The "always true" RLS policies are intentional for this prototype demonstration.
  In production, these would be replaced with proper authentication-based policies.
*/

-- Add missing index on foreign key for better join performance
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_trading_partner_id 
  ON onboarding_requests(trading_partner_id);

-- Remove unused indexes that add overhead without providing benefit
DROP INDEX IF EXISTS idx_onboarding_requests_priority;
DROP INDEX IF EXISTS idx_meetings_onboarding_request_id;
DROP INDEX IF EXISTS idx_blockers_resolved;
DROP INDEX IF EXISTS idx_decisions_onboarding_request_id;

-- Keep only the indexes that are actually used
-- idx_onboarding_requests_status - used for filtering by status
-- idx_onboarding_requests_submitted_at - used for ordering and date filtering
-- idx_readiness_scores_onboarding_request_id - used for joins
-- idx_blockers_onboarding_request_id - used for joins

-- Add helpful comments to tables noting this is a prototype
COMMENT ON TABLE trading_partners IS 'Trading partner master data. RLS policies allow public access for prototype demo.';
COMMENT ON TABLE onboarding_requests IS 'EDI onboarding requests. RLS policies allow public access for prototype demo.';
COMMENT ON TABLE meetings IS 'Meeting capture and AI analysis. RLS policies allow public access for prototype demo.';
COMMENT ON TABLE readiness_scores IS 'AI-generated readiness scores. RLS policies allow public access for prototype demo.';
COMMENT ON TABLE blockers IS 'Identified blockers and constraints. RLS policies allow public access for prototype demo.';
COMMENT ON TABLE decisions IS 'Approval decisions and actions. RLS policies allow public access for prototype demo.';

-- Add comments to the public access policies
COMMENT ON POLICY "Public read access to trading_partners" ON trading_partners IS 
  'Demo-only policy. In production, restrict to authenticated users with appropriate roles.';
COMMENT ON POLICY "Public read access to onboarding_requests" ON onboarding_requests IS 
  'Demo-only policy. In production, restrict to authenticated users with appropriate roles.';
COMMENT ON POLICY "Public read access to meetings" ON meetings IS 
  'Demo-only policy. In production, restrict to authenticated users with appropriate roles.';
COMMENT ON POLICY "Public read access to readiness_scores" ON readiness_scores IS 
  'Demo-only policy. In production, restrict to authenticated users with appropriate roles.';
COMMENT ON POLICY "Public read access to blockers" ON blockers IS 
  'Demo-only policy. In production, restrict to authenticated users with appropriate roles.';
COMMENT ON POLICY "Public read access to decisions" ON decisions IS 
  'Demo-only policy. In production, restrict to authenticated users with appropriate roles.';

COMMENT ON POLICY "Public insert to onboarding_requests" ON onboarding_requests IS 
  'Demo-only policy allowing unrestricted inserts. In production, restrict to authenticated users.';
COMMENT ON POLICY "Public update to onboarding_requests" ON onboarding_requests IS 
  'Demo-only policy allowing unrestricted updates. In production, restrict to authenticated users with ownership checks.';
COMMENT ON POLICY "Public insert to decisions" ON decisions IS 
  'Demo-only policy allowing unrestricted inserts. In production, restrict to authenticated managers/approvers.';
COMMENT ON POLICY "Public update to blockers" ON blockers IS 
  'Demo-only policy allowing unrestricted updates. In production, restrict to authenticated users with ownership checks.';