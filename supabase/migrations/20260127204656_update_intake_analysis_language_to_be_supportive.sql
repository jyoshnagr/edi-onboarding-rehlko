/*
  # Update Intake Analysis Language to Be More Supportive

  ## Summary
  Updates all identified_risks and recommendations in the ai_analysis table to use
  constructive, supportive language that focuses on collaboration and partnership
  rather than highlighting deficiencies or using harsh terminology.

  ## Changes
  - Updates all "Missing" or "Lack of" language to "Additional details needed" or "New to"
  - Changes "Obtain" to collaborative language like "Partner with" or "Work together to gather"
  - Removes harsh words like "inability", "cannot proceed", "delays"
  - Focuses on what we'll accomplish together rather than what's missing
  - Changes priority language from "critical" to "high priority" where appropriate
*/

-- Update all records with missing contact information risk
UPDATE ai_analysis
SET identified_risks = jsonb_set(
  identified_risks,
  '{0}',
  jsonb_build_object(
    'type', (identified_risks->0->>'type'),
    'title', 'Contact details needed',
    'impact', 'Additional coordination will ensure smooth communication',
    'description', 'Contact information will help us coordinate effectively'
  )
)
WHERE identified_risks->0->>'title' = 'Missing contact information';

-- Update all records with protocol specification risk
UPDATE ai_analysis
SET identified_risks = (
  SELECT jsonb_agg(
    CASE 
      WHEN item->>'title' = 'Unclear or missing protocol specification'
      THEN jsonb_build_object(
        'type', item->>'type',
        'title', 'Protocol specification needed',
        'impact', 'Defining protocols together will ensure reliable data exchange',
        'description', 'Technical protocol details will help us set up the connection properly'
      )
      ELSE item
    END
  )
  FROM jsonb_array_elements(identified_risks) AS item
)
WHERE jsonb_path_exists(identified_risks, '$[*] ? (@.title == "Unclear or missing protocol specification")');

-- Update all records with data formats risk
UPDATE ai_analysis
SET identified_risks = (
  SELECT jsonb_agg(
    CASE 
      WHEN item->>'title' = 'Undefined data formats or transaction types'
      THEN jsonb_build_object(
        'type', item->>'type',
        'title', 'Data format details needed',
        'impact', 'Clarifying formats together ensures seamless data processing',
        'description', 'Defining data formats and transaction types helps us configure everything correctly'
      )
      ELSE item
    END
  )
  FROM jsonb_array_elements(identified_risks) AS item
)
WHERE jsonb_path_exists(identified_risks, '$[*] ? (@.title == "Undefined data formats or transaction types")');

-- Update all records with EDI experience risk
UPDATE ai_analysis
SET identified_risks = (
  SELECT jsonb_agg(
    CASE 
      WHEN item->>'title' = 'Lack of EDI experience'
      THEN jsonb_build_object(
        'type', item->>'type',
        'title', 'New to EDI',
        'impact', 'Additional guidance and support will ensure successful implementation',
        'description', 'We''ll provide extra support and training throughout the onboarding process'
      )
      ELSE item
    END
  )
  FROM jsonb_array_elements(identified_risks) AS item
)
WHERE jsonb_path_exists(identified_risks, '$[*] ? (@.title == "Lack of EDI experience")');

-- Update all records with missing technical requirements risk
UPDATE ai_analysis
SET identified_risks = (
  SELECT jsonb_agg(
    CASE 
      WHEN item->>'title' = 'Missing technical requirements'
      THEN jsonb_build_object(
        'type', item->>'type',
        'title', 'Technical requirements to be defined',
        'impact', 'Gathering requirements together ensures alignment',
        'description', 'Working together to document technical requirements prevents misunderstandings'
      )
      ELSE item
    END
  )
  FROM jsonb_array_elements(identified_risks) AS item
)
WHERE jsonb_path_exists(identified_risks, '$[*] ? (@.title == "Missing technical requirements")');

-- Update all records with missing network details risk
UPDATE ai_analysis
SET identified_risks = (
  SELECT jsonb_agg(
    CASE 
      WHEN item->>'title' = 'Missing Network Details'
      THEN jsonb_build_object(
        'type', item->>'type',
        'title', 'Network configuration details needed',
        'impact', 'Network details will enable technical setup',
        'description', 'IP and port information helps us configure the connection properly'
      )
      ELSE item
    END
  )
  FROM jsonb_array_elements(identified_risks) AS item
)
WHERE jsonb_path_exists(identified_risks, '$[*] ? (@.title == "Missing Network Details")');

-- Update recommendations to use collaborative language
UPDATE ai_analysis
SET recommendations = (
  SELECT jsonb_agg(
    CASE 
      WHEN item->>'title' = 'Obtain missing contact details'
      THEN jsonb_build_object(
        'title', 'Gather contact information',
        'priority', CASE WHEN item->>'priority' = 'critical' THEN 'high' ELSE item->>'priority' END,
        'description', 'Work together to gather complete contact information for seamless communication'
      )
      WHEN item->>'title' = 'Define technical protocols and formats'
      THEN jsonb_build_object(
        'title', 'Define technical protocols together',
        'priority', CASE WHEN item->>'priority' = 'critical' THEN 'high' ELSE item->>'priority' END,
        'description', 'Collaborate to clarify EDI protocols and data formats for successful integration'
      )
      WHEN item->>'title' = 'Schedule kickoff meeting'
      THEN jsonb_build_object(
        'title', 'Schedule kickoff meeting',
        'priority', item->>'priority',
        'description', 'Organize a collaborative meeting to align on goals, timeline, and expectations'
      )
      WHEN item->>'title' = 'Create testing strategy'
      THEN jsonb_build_object(
        'title', 'Develop testing strategy together',
        'priority', item->>'priority',
        'description', 'Partner on a comprehensive testing plan to ensure successful EDI transactions'
      )
      WHEN item->>'title' = 'Document requirements'
      THEN jsonb_build_object(
        'title', 'Document requirements collaboratively',
        'priority', item->>'priority',
        'description', 'Work together to document all technical and business requirements for clarity'
      )
      WHEN item->>'title' = 'Establish communication channels'
      THEN jsonb_build_object(
        'title', 'Set up communication channels',
        'priority', item->>'priority',
        'description', 'Establish regular communication for updates and collaborative problem-solving'
      )
      WHEN item->>'title' = 'Plan phased rollout approach'
      THEN jsonb_build_object(
        'title', 'Plan phased rollout together',
        'priority', item->>'priority',
        'description', 'Develop a phased approach to manage complexity and ensure smooth implementation'
      )
      WHEN item->>'title' = 'Collect Network Configuration'
      THEN jsonb_build_object(
        'title', 'Gather network configuration',
        'priority', CASE WHEN item->>'priority' = 'critical' THEN 'high' ELSE item->>'priority' END,
        'description', 'Work together to gather IP addresses, ports, and trading partner IDs for test and production'
      )
      WHEN item->>'title' = 'Obtain Primary Contact'
      THEN jsonb_build_object(
        'title', 'Identify primary contact',
        'priority', CASE WHEN item->>'priority' = 'critical' THEN 'high' ELSE item->>'priority' END,
        'description', 'Connect with the primary contact to ensure smooth project coordination'
      )
      WHEN item->>'title' = 'Complete Missing Information'
      THEN jsonb_build_object(
        'title', 'Gather additional information',
        'priority', CASE WHEN item->>'priority' = 'critical' THEN 'high' ELSE item->>'priority' END,
        'description', 'Partner to collect remaining details for complete requirements'
      )
      ELSE item
    END
  )
  FROM jsonb_array_elements(recommendations) AS item
)
WHERE true;

-- Update the timestamps
UPDATE ai_analysis SET analyzed_at = now() WHERE true;