/*
  # Add Sample Readiness Scoring Data

  ## Summary
  Adds comprehensive sample data for the Readiness Scoring feature including trading partners,
  onboarding requests with varying readiness scores, detailed score breakdowns, and blockers.

  ## New Data

  ### Trading Partners
  - Lowe's (existing partner, 3 previous onboardings)
  - Home Depot (existing partner, 2 previous onboardings)
  - Ace Hardware (new partner, 0 previous onboardings)
  - Menards (existing partner, 5 previous onboardings)
  - Tractor Supply Co. (new partner, 0 previous onboardings)

  ### Onboarding Requests
  Creates 5 onboarding requests with different readiness scenarios:
  1. High readiness (85%) - Lowe's repeat partner with complete information
  2. Medium readiness (65%) - Home Depot with some missing data
  3. Low readiness (45%) - Ace Hardware new partner with significant gaps
  4. High readiness (90%) - Menards well-established partner
  5. Medium-low readiness (55%) - Tractor Supply Co. with technical complexities

  ### Readiness Scores
  - Detailed score factor breakdowns for each request
  - AI-generated recommendations based on readiness level
  - Confidence percentages matching request data

  ### Blockers
  - Active blockers for lower-scoring requests
  - Various blocker types (missing_data, wms_constraint, protocol_requirement, scope_ambiguity)
  - Severity levels from low to critical

  ## Purpose
  Provides realistic test data to demonstrate the Readiness Scoring feature's capabilities
  including visualization of scores, factors, recommendations, and blockers.
*/

-- Insert Trading Partners
INSERT INTO trading_partners (id, name, is_existing, previous_onboardings, typical_requirements, created_at, updated_at)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lowe''s', true, 3, '{"protocol": "AS2", "wms": "Manhattan", "transactions": ["850", "856", "810"]}', now() - interval '2 years', now()),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Home Depot', true, 2, '{"protocol": "AS2", "wms": "Blue Yonder", "transactions": ["850", "855", "856"]}', now() - interval '1 year', now()),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Ace Hardware', false, 0, '{}', now() - interval '1 month', now()),
  ('d4e5f6a7-b8c9-0123-def1-234567890123', 'Menards', true, 5, '{"protocol": "SFTP", "wms": "SAP EWM", "transactions": ["850", "856", "810", "997"]}', now() - interval '3 years', now()),
  ('e5f6a7b8-c9d0-1234-ef12-345678901234', 'Tractor Supply Co.', false, 0, '{}', now() - interval '2 weeks', now())
ON CONFLICT (id) DO NOTHING;

-- Insert Onboarding Requests
INSERT INTO onboarding_requests (
  id, trading_partner_id, request_number, status, priority, warehouse_location,
  wms_type, protocol, transaction_types, requested_go_live_date, estimated_completion_date,
  business_value_score, intake_completeness, readiness_score, confidence_percentage,
  cycle_time_days, ai_summary, missing_items, conflicts, jira_epic_id,
  submitted_at, reviewed_at, created_at, updated_at
)
VALUES
  (
    'f6a7b8c9-d0e1-2345-f123-456789012345',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'REQ-2026-001',
    'approved',
    'high',
    'Dallas, TX - DC 6012',
    'Manhattan WMOS',
    'AS2',
    '["850 - Purchase Order", "856 - Advance Ship Notice", "810 - Invoice"]',
    (now() + interval '45 days')::date,
    (now() + interval '38 days')::date,
    88,
    95,
    85,
    92,
    35,
    'Repeat partner with well-established EDI patterns. All technical requirements align with previous implementations. Complete intake documentation provided. Partner has experienced EDI team.',
    '[]',
    '[]',
    'JIRA-EDI-2026-001',
    now() - interval '5 days',
    now() - interval '2 days',
    now() - interval '5 days',
    now()
  ),
  (
    'a7b8c9d0-e1f2-3456-1234-567890123456',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'REQ-2026-002',
    'review',
    'high',
    'Atlanta, GA - DC 3027',
    'Blue Yonder WMS',
    'AS2',
    '["850 - Purchase Order", "855 - Purchase Order Acknowledgment", "856 - Advance Ship Notice"]',
    (now() + interval '60 days')::date,
    (now() + interval '52 days')::date,
    75,
    78,
    65,
    81,
    48,
    'Existing partner expanding to new facility. Some location-specific requirements need clarification. Additional testing scenarios required for 855 transaction.',
    '["Detailed test scenarios for 855 ACK", "Atlanta DC specific product codes", "Backup contact information"]',
    '[]',
    'JIRA-EDI-2026-002',
    now() - interval '3 days',
    now() - interval '1 day',
    now() - interval '3 days',
    now()
  ),
  (
    'b8c9d0e1-f2a3-4567-2345-678901234567',
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'REQ-2026-003',
    'intake',
    'medium',
    'Phoenix, AZ - DC 8045',
    'SAP EWM',
    'SFTP',
    '["850 - Purchase Order", "856 - Advance Ship Notice", "810 - Invoice", "997 - Functional Acknowledgment"]',
    (now() + interval '90 days')::date,
    (now() + interval '75 days')::date,
    62,
    48,
    45,
    58,
    65,
    'New partner with limited EDI experience. Significant gaps in technical specifications. WMS integration complexity high due to SAP EWM requirements. Multiple clarification rounds expected.',
    '["Complete FTP connection details", "Item master file format", "UOM conversion rules", "Lot/serial number handling requirements", "EDI mapping specifications", "Test environment access", "Trading partner contact escalation path"]',
    '["Go-live date may be unrealistic given complexity", "WMS customization requirements unclear"]',
    null,
    now() - interval '1 day',
    null,
    now() - interval '1 day',
    now()
  ),
  (
    'c9d0e1f2-a3b4-5678-3456-789012345678',
    'd4e5f6a7-b8c9-0123-def1-234567890123',
    'REQ-2026-004',
    'approved',
    'high',
    'Seattle, WA - DC 9012',
    'SAP EWM',
    'SFTP',
    '["850 - Purchase Order", "856 - Advance Ship Notice", "810 - Invoice", "997 - Functional Acknowledgment"]',
    (now() + interval '30 days')::date,
    (now() + interval '25 days')::date,
    95,
    98,
    90,
    95,
    28,
    'Highly experienced partner with 5 previous successful integrations. Complete and detailed intake documentation. All specifications match existing patterns. Fast-track candidate.',
    '[]',
    '[]',
    'JIRA-EDI-2026-004',
    now() - interval '7 days',
    now() - interval '4 days',
    now() - interval '7 days',
    now()
  ),
  (
    'd0e1f2a3-b4c5-6789-4567-890123456789',
    'e5f6a7b8-c9d0-1234-ef12-345678901234',
    'REQ-2026-005',
    'review',
    'high',
    'Columbus, OH - DC 4018',
    'Manhattan WMOS',
    'AS2',
    '["850 - Purchase Order", "856 - Advance Ship Notice", "810 - Invoice", "846 - Inventory Inquiry/Advice", "940 - Warehouse Shipping Order"]',
    (now() + interval '75 days')::date,
    (now() + interval '68 days')::date,
    82,
    72,
    55,
    73,
    62,
    'New partner with complex requirements including bidirectional inventory sync (846) and warehouse shipping orders (940). Technical capability appears strong but scope requires refinement.',
    '["846 real-time vs batch frequency", "940 acknowledgment requirements", "Inventory variance handling procedures", "EDI testing timeline"]',
    '["Bidirectional 846 transaction adds complexity", "940 transaction requires WMS configuration"]',
    null,
    now() - interval '4 days',
    now() - interval '1 day',
    now() - interval '4 days',
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Readiness Scores with detailed breakdowns
INSERT INTO readiness_scores (
  id, onboarding_request_id, score, confidence, score_factors, recommendations, calculated_at, created_at
)
VALUES
  (
    'e1f2a3b4-c5d6-7890-5678-901234567890',
    'f6a7b8c9-d0e1-2345-f123-456789012345',
    85,
    92,
    '{
      "partner_history": 95,
      "data_completeness": 95,
      "technical_feasibility": 88,
      "timeline_realism": 75,
      "wms_compatibility": 90,
      "protocol_readiness": 85
    }',
    '[
      "Fast-track approval recommended - all prerequisites met",
      "Leverage existing Lowe's mapping templates from previous integrations",
      "Schedule kickoff meeting within 3 business days",
      "Assign senior developer familiar with Lowe's patterns"
    ]',
    now() - interval '2 days',
    now() - interval '2 days'
  ),
  (
    'f2a3b4c5-d6e7-8901-6789-012345678901',
    'a7b8c9d0-e1f2-3456-1234-567890123456',
    65,
    81,
    '{
      "partner_history": 85,
      "data_completeness": 65,
      "technical_feasibility": 70,
      "timeline_realism": 60,
      "wms_compatibility": 75,
      "protocol_readiness": 80
    }',
    '[
      "Schedule clarification call with Home Depot EDI team within 48 hours",
      "Request detailed 855 ACK business rules and test scenarios",
      "Confirm Atlanta DC product code mapping requirements",
      "Extend timeline by 1 week to accommodate additional testing",
      "Assign analyst to document Atlanta-specific requirements"
    ]',
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  (
    'a3b4c5d6-e7f8-9012-7890-123456789012',
    'b8c9d0e1-f2a3-4567-2345-678901234567',
    45,
    58,
    '{
      "partner_history": 20,
      "data_completeness": 40,
      "technical_feasibility": 55,
      "timeline_realism": 35,
      "wms_compatibility": 50,
      "protocol_readiness": 60
    }',
    '[
      "Do NOT approve - critical information gaps must be resolved first",
      "Schedule comprehensive intake workshop with Ace Hardware technical team",
      "Provide detailed intake template with specific SAP EWM requirements",
      "Assign solution architect to assess WMS integration complexity",
      "Extend requested go-live date by 30 days minimum",
      "Request access to Ace Hardware test environment for early validation"
    ]',
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  (
    'b4c5d6e7-f8a9-0123-8901-234567890123',
    'c9d0e1f2-a3b4-5678-3456-789012345678',
    90,
    95,
    '{
      "partner_history": 100,
      "data_completeness": 98,
      "technical_feasibility": 92,
      "timeline_realism": 85,
      "wms_compatibility": 95,
      "protocol_readiness": 90
    }',
    '[
      "Immediate approval recommended - exemplary intake quality",
      "Clone previous Costco Seattle integration as starting template",
      "Prioritize in development queue due to tight timeline",
      "Minimal testing required - leverage established patterns",
      "Consider as reference implementation for future Costco sites"
    ]',
    now() - interval '4 days',
    now() - interval '4 days'
  ),
  (
    'c5d6e7f8-a9b0-1234-9012-345678901234',
    'd0e1f2a3-b4c5-6789-4567-890123456789',
    55,
    73,
    '{
      "partner_history": 30,
      "data_completeness": 60,
      "technical_feasibility": 52,
      "timeline_realism": 50,
      "wms_compatibility": 65,
      "protocol_readiness": 75
    }',
    '[
      "Conditional approval - scope refinement required before development",
      "Schedule scoping workshop focused on 846 and 940 requirements",
      "Request Tractor Supply Co. provide detailed use cases for bidirectional inventory",
      "Assess WMS configuration effort for 940 warehouse shipping orders",
      "Break implementation into phases: Phase 1 (850/856/810), Phase 2 (846/940)",
      "Extend timeline by 2 weeks to accommodate scope clarification"
    ]',
    now() - interval '1 day',
    now() - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Blockers for requests with lower readiness scores
INSERT INTO blockers (
  id, onboarding_request_id, blocker_type, severity, title, description,
  resolution_required, resolved, created_at, updated_at
)
VALUES
  -- Blockers for Ace Hardware (REQ-2026-003) - Low readiness
  (
    'd6e7f8a9-b0c1-2345-0123-456789012345',
    'b8c9d0e1-f2a3-4567-2345-678901234567',
    'missing_data',
    'critical',
    'SFTP Connection Details Missing',
    'No FTP host, port, credentials, or directory structure provided. Cannot establish connectivity without this information. This is a hard blocker for any development or testing work.',
    true,
    false,
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  (
    'e7f8a9b0-c1d2-3456-1234-567890123456',
    'b8c9d0e1-f2a3-4567-2345-678901234567',
    'wms_constraint',
    'high',
    'SAP EWM Integration Complexity Unknown',
    'Partner has not provided SAP EWM version, customization details, or integration points. SAP EWM implementations vary significantly. Need to understand their specific configuration to estimate effort accurately.',
    true,
    false,
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  (
    'f8a9b0c1-d2e3-4567-2345-678901234567',
    'b8c9d0e1-f2a3-4567-2345-678901234567',
    'scope_ambiguity',
    'high',
    'EDI Mapping Specifications Incomplete',
    'No detailed mapping specifications provided for any transaction type. Item master format, UOM conversions, and lot/serial handling rules are undefined. Cannot begin development without these specifications.',
    true,
    false,
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  (
    'a9b0c1d2-e3f4-5678-3456-789012345678',
    'b8c9d0e1-f2a3-4567-2345-678901234567',
    'missing_data',
    'medium',
    'Test Environment Access Not Provided',
    'Partner has not granted access to test environment for early validation. This will delay testing phase and could reveal issues late in the cycle.',
    true,
    false,
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  
  -- Blockers for Home Depot (REQ-2026-002) - Medium readiness
  (
    'b0c1d2e3-f4a5-6789-4567-890123456789',
    'a7b8c9d0-e1f2-3456-1234-567890123456',
    'missing_data',
    'medium',
    'Purchase Order Acknowledgment (855) Test Scenarios Missing',
    'Home Depot requires 855 ACK transaction but has not provided detailed test scenarios or business rules. Need to understand acceptance/rejection logic, partial acceptance handling, and timing requirements.',
    true,
    false,
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  (
    'c1d2e3f4-a5b6-7890-5678-901234567890',
    'a7b8c9d0-e1f2-3456-1234-567890123456',
    'scope_ambiguity',
    'low',
    'Atlanta DC Product Code Mapping Unclear',
    'Partner mentioned location-specific product codes but has not provided mapping details or item master file. Low severity as can be resolved during development, but needs clarification.',
    false,
    false,
    now() - interval '1 day',
    now() - interval '1 day'
  ),

  -- Blockers for Tractor Supply Co. (REQ-2026-005) - Medium-low readiness
  (
    'd2e3f4a5-b6c7-8901-6789-012345678901',
    'd0e1f2a3-b4c5-6789-4567-890123456789',
    'scope_ambiguity',
    'high',
    'Bidirectional 846 Inventory Sync Requirements Undefined',
    'Tractor Supply Co. requires real-time inventory synchronization using 846 transactions, but has not specified frequency, variance thresholds, or error handling procedures. This is a complex requirement that needs detailed specification.',
    true,
    false,
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  (
    'e3f4a5b6-c7d8-9012-7890-123456789012',
    'd0e1f2a3-b4c5-6789-4567-890123456789',
    'wms_constraint',
    'medium',
    '940 Warehouse Shipping Order Requires WMS Configuration',
    'Implementation of 940 transaction requires Manhattan WMOS configuration changes. Need to assess effort, coordinate with WMS team, and validate configuration in test environment before go-live.',
    true,
    false,
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  (
    'f4a5b6c7-d8e9-0123-8901-234567890123',
    'd0e1f2a3-b4c5-6789-4567-890123456789',
    'protocol_requirement',
    'low',
    'EDI Testing Timeline Not Provided',
    'Tractor Supply Co. has not committed to specific testing timeline or resource availability. Need to coordinate testing schedule to meet aggressive go-live date.',
    false,
    false,
    now() - interval '1 day',
    now() - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;