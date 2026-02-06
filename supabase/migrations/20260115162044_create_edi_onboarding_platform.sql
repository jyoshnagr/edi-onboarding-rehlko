/*
  # EDI Onboarding Intelligence Platform Schema

  ## Overview
  This migration creates the complete database schema for the AI-driven EDI onboarding
  intelligence platform. The system manages trading partner onboarding,
  captures meeting intelligence, tracks readiness scores, and supports decision workflows.

  ## New Tables

  ### 1. trading_partners
  Stores known trading partners and their historical information
  - `id` (uuid, primary key)
  - `name` (text) - Partner company name
  - `is_existing` (boolean) - Whether this is a repeat partner
  - `previous_onboardings` (integer) - Count of previous onboardings
  - `typical_requirements` (jsonb) - Common requirements for this partner
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. onboarding_requests
  Main onboarding request records with AI-enriched data
  - `id` (uuid, primary key)
  - `trading_partner_id` (uuid, foreign key)
  - `request_number` (text) - Human-readable identifier
  - `status` (text) - Current status (intake, review, approved, deferred, in_progress, completed)
  - `priority` (text) - Priority level (high, medium, low)
  - `warehouse_location` (text) - Target warehouse
  - `wms_type` (text) - WMS system type
  - `protocol` (text) - EDI protocol (AS2, SFTP, etc.)
  - `transaction_types` (jsonb) - Array of EDI transaction types
  - `requested_go_live_date` (date)
  - `estimated_completion_date` (date)
  - `business_value_score` (integer) - 0-100
  - `intake_completeness` (integer) - 0-100
  - `readiness_score` (integer) - 0-100
  - `confidence_percentage` (integer) - 0-100
  - `cycle_time_days` (integer)
  - `ai_summary` (text) - AI-generated summary
  - `missing_items` (jsonb) - Array of missing data points
  - `conflicts` (jsonb) - Array of identified conflicts
  - `jira_epic_id` (text) - Simulated Jira reference
  - `submitted_at` (timestamptz)
  - `reviewed_at` (timestamptz)
  - `approved_at` (timestamptz)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. meetings
  Captured meeting intelligence from calls and discussions
  - `id` (uuid, primary key)
  - `onboarding_request_id` (uuid, foreign key)
  - `meeting_type` (text) - Type (intake, discovery, technical, review)
  - `meeting_date` (timestamptz)
  - `participants` (jsonb) - Array of participant names/roles
  - `transcript` (text) - Simulated transcript
  - `decisions_made` (jsonb) - Array of decisions
  - `assumptions` (jsonb) - Array of assumptions
  - `open_questions` (jsonb) - Array of open questions
  - `constraints` (jsonb) - Array of constraints identified
  - `ai_summary` (text) - AI-generated meeting summary
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. readiness_scores
  Historical readiness scoring and analysis
  - `id` (uuid, primary key)
  - `onboarding_request_id` (uuid, foreign key)
  - `score` (integer) - 0-100
  - `confidence` (integer) - 0-100
  - `score_factors` (jsonb) - Breakdown of scoring factors
  - `recommendations` (jsonb) - AI recommendations
  - `calculated_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 5. blockers
  Identified blockers and constraints
  - `id` (uuid, primary key)
  - `onboarding_request_id` (uuid, foreign key)
  - `blocker_type` (text) - Type (missing_data, wms_constraint, protocol_requirement, scope_ambiguity)
  - `severity` (text) - Severity (critical, high, medium, low)
  - `title` (text) - Blocker title
  - `description` (text) - Detailed description
  - `resolution_required` (boolean)
  - `resolved` (boolean)
  - `resolved_at` (timestamptz)
  - `resolution_notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. decisions
  Approval decisions and actions taken
  - `id` (uuid, primary key)
  - `onboarding_request_id` (uuid, foreign key)
  - `decision_type` (text) - Type (approve, defer, request_info, adjust)
  - `decision_maker` (text) - Person or role
  - `rationale` (text) - Explanation
  - `action_items` (jsonb) - Array of follow-up actions
  - `decided_at` (timestamptz)
  - `created_at` (timestamptz)

  ## Security
  Enable RLS on all tables with policies for authenticated users
*/

-- Create trading_partners table
CREATE TABLE IF NOT EXISTS trading_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_existing boolean DEFAULT false,
  previous_onboardings integer DEFAULT 0,
  typical_requirements jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create onboarding_requests table
CREATE TABLE IF NOT EXISTS onboarding_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_partner_id uuid REFERENCES trading_partners(id),
  request_number text UNIQUE NOT NULL,
  status text DEFAULT 'intake',
  priority text DEFAULT 'medium',
  warehouse_location text,
  wms_type text,
  protocol text,
  transaction_types jsonb DEFAULT '[]',
  requested_go_live_date date,
  estimated_completion_date date,
  business_value_score integer DEFAULT 0,
  intake_completeness integer DEFAULT 0,
  readiness_score integer DEFAULT 0,
  confidence_percentage integer DEFAULT 0,
  cycle_time_days integer DEFAULT 0,
  ai_summary text,
  missing_items jsonb DEFAULT '[]',
  conflicts jsonb DEFAULT '[]',
  jira_epic_id text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_request_id uuid REFERENCES onboarding_requests(id) ON DELETE CASCADE,
  meeting_type text NOT NULL,
  meeting_date timestamptz DEFAULT now(),
  participants jsonb DEFAULT '[]',
  transcript text,
  decisions_made jsonb DEFAULT '[]',
  assumptions jsonb DEFAULT '[]',
  open_questions jsonb DEFAULT '[]',
  constraints jsonb DEFAULT '[]',
  ai_summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create readiness_scores table
CREATE TABLE IF NOT EXISTS readiness_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_request_id uuid REFERENCES onboarding_requests(id) ON DELETE CASCADE,
  score integer NOT NULL,
  confidence integer NOT NULL,
  score_factors jsonb DEFAULT '{}',
  recommendations jsonb DEFAULT '[]',
  calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create blockers table
CREATE TABLE IF NOT EXISTS blockers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_request_id uuid REFERENCES onboarding_requests(id) ON DELETE CASCADE,
  blocker_type text NOT NULL,
  severity text DEFAULT 'medium',
  title text NOT NULL,
  description text,
  resolution_required boolean DEFAULT true,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create decisions table
CREATE TABLE IF NOT EXISTS decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_request_id uuid REFERENCES onboarding_requests(id) ON DELETE CASCADE,
  decision_type text NOT NULL,
  decision_maker text,
  rationale text,
  action_items jsonb DEFAULT '[]',
  decided_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE trading_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read all data
CREATE POLICY "Allow read access to trading_partners"
  ON trading_partners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to onboarding_requests"
  ON onboarding_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to readiness_scores"
  ON readiness_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to blockers"
  ON blockers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to decisions"
  ON decisions FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for authenticated users to insert/update data
CREATE POLICY "Allow insert to trading_partners"
  ON trading_partners FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update to trading_partners"
  ON trading_partners FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow insert to onboarding_requests"
  ON onboarding_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update to onboarding_requests"
  ON onboarding_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow insert to meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow insert to readiness_scores"
  ON readiness_scores FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow insert to blockers"
  ON blockers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update to blockers"
  ON blockers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow insert to decisions"
  ON decisions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_status ON onboarding_requests(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_priority ON onboarding_requests(priority);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_submitted_at ON onboarding_requests(submitted_at);
CREATE INDEX IF NOT EXISTS idx_meetings_onboarding_request_id ON meetings(onboarding_request_id);
CREATE INDEX IF NOT EXISTS idx_readiness_scores_onboarding_request_id ON readiness_scores(onboarding_request_id);
CREATE INDEX IF NOT EXISTS idx_blockers_onboarding_request_id ON blockers(onboarding_request_id);
CREATE INDEX IF NOT EXISTS idx_blockers_resolved ON blockers(resolved);
CREATE INDEX IF NOT EXISTS idx_decisions_onboarding_request_id ON decisions(onboarding_request_id);