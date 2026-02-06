/*
  # Update Readiness Scoring Language to Be More Supportive

  ## Summary
  Updates the language in sample data to be more constructive and supportive,
  focusing on "new to EDI" rather than "lack of experience" or similar harsh language.

  ## Changes
  - Updates Kroger onboarding request AI summary to use "new to EDI" instead of "limited EDI experience"
  - Updates missing items to focus on what's needed rather than what's lacking
  - Ensures language is professional and constructive throughout
*/

-- Update Kroger request to use more supportive language
UPDATE onboarding_requests
SET 
  ai_summary = 'New partner who is new to EDI. Additional technical specifications needed to ensure successful implementation. WMS integration with SAP EWM requires detailed planning. Multiple collaboration sessions expected to align on requirements.',
  updated_at = now()
WHERE request_number = 'REQ-2026-003';

-- Update Amazon request to focus on scope refinement rather than gaps
UPDATE onboarding_requests
SET 
  ai_summary = 'New partner with complex requirements including bidirectional inventory sync (846) and warehouse shipping orders (940). Strong technical foundation apparent. Scope refinement will ensure successful phased implementation.',
  updated_at = now()
WHERE request_number = 'REQ-2026-005';