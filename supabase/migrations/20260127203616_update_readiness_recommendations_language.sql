/*
  # Update Readiness Recommendations to Be More Supportive

  ## Summary
  Updates AI recommendations to use constructive, supportive language that focuses
  on collaboration and successful outcomes rather than critical language.

  ## Changes
  - Updates Kroger recommendations to be more collaborative
  - Removes negative phrasing like "Do NOT approve"
  - Focuses on partnership and knowledge transfer
*/

-- Update Kroger readiness score recommendations to be more supportive
UPDATE readiness_scores
SET 
  recommendations = '[
    "Additional information needed before starting development",
    "Schedule collaborative intake workshop with partner technical team",
    "Provide detailed intake template with SAP EWM integration requirements",
    "Assign solution architect to partner with team on WMS integration planning",
    "Recommend extending go-live date by 30 days to ensure quality implementation",
    "Request test environment access for early validation and partnership"
  ]',
  calculated_at = now()
WHERE onboarding_request_id = (
  SELECT id FROM onboarding_requests WHERE request_number = 'REQ-2026-003'
);