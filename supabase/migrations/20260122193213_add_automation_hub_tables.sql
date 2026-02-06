/*
  # Automation Hub Tables

  ## Overview
  This migration adds comprehensive automation and workflow management capabilities 
  to support post-analysis enrichment, workflow recommendations, and ServiceNow integration.

  ## New Tables

  ### 1. `customer_enrichment`
  Stores customer/account context pulled from external systems (Salesforce, WRA)
  - `id` (uuid, primary key)
  - `intake_id` (uuid, foreign key to intake_extractions)
  - `provider_type` (text) - salesforce_mock, salesforce_real, wra_mock, wra_real
  - `status` (text) - not_run, running, completed, failed
  - `input_context_json` (jsonb) - Context used for enrichment request
  - `output_json` (jsonb) - Raw enrichment data from provider
  - `merged_updates_json` (jsonb) - Suggested updates to intake (reviewable diff)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `workflow_recommendations`
  Stores AI-generated workflow recommendations based on risks and action items
  - `id` (uuid, primary key)
  - `intake_id` (uuid, foreign key to intake_extractions)
  - `status` (text) - not_run, running, completed, failed
  - `model` (text) - AI model used (e.g., o4-mini)
  - `recommendations_json` (jsonb) - Array of recommended workflows
  - `created_at` (timestamptz)

  ### 3. `automation_runs`
  Tracks all automation executions (ServiceNow tickets, internal tasks, enrichment)
  - `id` (uuid, primary key)
  - `intake_id` (uuid, foreign key to intake_extractions)
  - `workflow_id` (text) - Reference to specific workflow
  - `run_type` (text) - servicenow_ticket, internal_task, enrichment
  - `provider` (text) - mock or real provider identifier
  - `status` (text) - draft, awaiting_approval, approved, executing, completed, failed
  - `request_payload_json` (jsonb) - Request sent to external system
  - `response_payload_json` (jsonb) - Response from external system
  - `error_message` (text) - Error details if failed
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Table Modifications

  ### `action_items`
  Extended with workflow linking fields:
  - `linked_workflow_id` (text) - Reference to workflow that created this action
  - `execution_status` (text) - pending, executed, blocked

  ## Security
  - Enable RLS on all new tables
  - Add policies for public access (demo mode)
  - Create indexes for performance

  ## Notes
  - All tables support both mock and real provider integrations
  - Designed for demo-readiness with realistic mock data
  - Full audit trail for all automation operations
*/

-- Create customer_enrichment table
CREATE TABLE IF NOT EXISTS customer_enrichment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid REFERENCES intake_extractions(id) ON DELETE CASCADE,
  provider_type text NOT NULL DEFAULT 'salesforce_mock',
  status text NOT NULL DEFAULT 'not_run',
  input_context_json jsonb DEFAULT '{}'::jsonb,
  output_json jsonb DEFAULT '{}'::jsonb,
  merged_updates_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workflow_recommendations table
CREATE TABLE IF NOT EXISTS workflow_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid REFERENCES intake_extractions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_run',
  model text DEFAULT 'o4-mini',
  recommendations_json jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create automation_runs table
CREATE TABLE IF NOT EXISTS automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid REFERENCES intake_extractions(id) ON DELETE CASCADE,
  workflow_id text,
  run_type text NOT NULL,
  provider text DEFAULT 'mock',
  status text NOT NULL DEFAULT 'draft',
  request_payload_json jsonb DEFAULT '{}'::jsonb,
  response_payload_json jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Extend action_items table with workflow fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_items' AND column_name = 'linked_workflow_id'
  ) THEN
    ALTER TABLE action_items ADD COLUMN linked_workflow_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_items' AND column_name = 'execution_status'
  ) THEN
    ALTER TABLE action_items ADD COLUMN execution_status text DEFAULT 'pending';
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE customer_enrichment ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_enrichment
CREATE POLICY "Allow public read access to customer_enrichment"
  ON customer_enrichment FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to customer_enrichment"
  ON customer_enrichment FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to customer_enrichment"
  ON customer_enrichment FOR UPDATE
  USING (true);

-- RLS Policies for workflow_recommendations
CREATE POLICY "Allow public read access to workflow_recommendations"
  ON workflow_recommendations FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to workflow_recommendations"
  ON workflow_recommendations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to workflow_recommendations"
  ON workflow_recommendations FOR UPDATE
  USING (true);

-- RLS Policies for automation_runs
CREATE POLICY "Allow public read access to automation_runs"
  ON automation_runs FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to automation_runs"
  ON automation_runs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to automation_runs"
  ON automation_runs FOR UPDATE
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_enrichment_intake_id ON customer_enrichment(intake_id);
CREATE INDEX IF NOT EXISTS idx_customer_enrichment_status ON customer_enrichment(status);
CREATE INDEX IF NOT EXISTS idx_workflow_recommendations_intake_id ON workflow_recommendations(intake_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_intake_id ON automation_runs(intake_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_workflow_id ON automation_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_action_items_linked_workflow_id ON action_items(linked_workflow_id);
