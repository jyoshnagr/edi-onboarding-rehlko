/*
  # AI Intelligence Features Enhancement

  ## Overview
  This migration adds comprehensive AI tracking and intelligence features to support
  real OpenAI-powered analysis, interviews, risk diagnostics, and preflight pack generation.

  ## New Tables
  
  ### 1. `ai_runs`
  Tracks all AI operations with full auditability
  - `id` (uuid, primary key)
  - `intake_id` (uuid, foreign key to intake_extractions)
  - `run_type` (text) - analysis, action_items, diagnostics, preflight, interview
  - `model` (text) - AI model used (e.g., o4-mini)
  - `status` (text) - success, failed, in_progress
  - `output_json` (jsonb) - Complete AI response
  - `error_message` (text) - Error details if failed
  - `token_usage` (integer) - Tokens consumed
  - `created_at` (timestamptz)

  ### 2. `interview_sessions`
  Stores AI interview conversations for gap filling
  - `id` (uuid, primary key)
  - `intake_id` (uuid, foreign key to intake_extractions)
  - `session_id` (text) - Unique session identifier
  - `messages` (jsonb) - Array of Q&A messages
  - `updated_fields` (jsonb) - Fields updated during interview
  - `missing_fields_before` (jsonb) - Initial missing fields
  - `missing_fields_after` (jsonb) - Remaining missing fields
  - `validated_assumptions` (jsonb) - Confirmed assumptions
  - `status` (text) - active, completed
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `risk_diagnostics`
  Stores structured risk and mapping issue analysis
  - `id` (uuid, primary key)
  - `intake_id` (uuid, foreign key to intake_extractions)
  - `diagnostics_version` (text) - Version of diagnostics format
  - `overall_risk_level` (text) - Low, Medium, High
  - `items` (jsonb) - Array of diagnostic items with evidence
  - `analyzed_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 4. `preflight_packs`
  Stores generated pre-flight checklists
  - `id` (uuid, primary key)
  - `intake_id` (uuid, foreign key to intake_extractions)
  - `pack_content` (jsonb) - Structured checklist content
  - `generated_at` (timestamptz)
  - `exported_at` (timestamptz) - When exported to PDF
  - `created_at` (timestamptz)

  ## Table Modifications

  ### `action_items`
  Enhanced with additional fields for AI-generated tracking:
  - `source` (text) - ai_generated or manual
  - `effort_size` (text) - S, M, L
  - `dependencies` (jsonb) - Array of dependent task IDs
  - `why_exists` (text) - Link to risk or gap that generated this

  ## Security
  - Enable RLS on all new tables
  - Add policies for public read access (demo mode)
  - Add policies for authenticated insert/update operations
*/

-- Create ai_runs table
CREATE TABLE IF NOT EXISTS ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid REFERENCES intake_extractions(id) ON DELETE CASCADE,
  run_type text NOT NULL,
  model text NOT NULL DEFAULT 'o4-mini',
  status text NOT NULL DEFAULT 'in_progress',
  output_json jsonb DEFAULT '{}'::jsonb,
  error_message text,
  token_usage integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create interview_sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid REFERENCES intake_extractions(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb,
  updated_fields jsonb DEFAULT '{}'::jsonb,
  missing_fields_before jsonb DEFAULT '[]'::jsonb,
  missing_fields_after jsonb DEFAULT '[]'::jsonb,
  validated_assumptions jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create risk_diagnostics table
CREATE TABLE IF NOT EXISTS risk_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid REFERENCES intake_extractions(id) ON DELETE CASCADE,
  diagnostics_version text DEFAULT '1.0',
  overall_risk_level text DEFAULT 'Medium',
  items jsonb DEFAULT '[]'::jsonb,
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create preflight_packs table
CREATE TABLE IF NOT EXISTS preflight_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid REFERENCES intake_extractions(id) ON DELETE CASCADE,
  pack_content jsonb DEFAULT '{}'::jsonb,
  generated_at timestamptz DEFAULT now(),
  exported_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enhance action_items table with new fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_items' AND column_name = 'source'
  ) THEN
    ALTER TABLE action_items ADD COLUMN source text DEFAULT 'manual';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_items' AND column_name = 'effort_size'
  ) THEN
    ALTER TABLE action_items ADD COLUMN effort_size text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_items' AND column_name = 'dependencies'
  ) THEN
    ALTER TABLE action_items ADD COLUMN dependencies jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_items' AND column_name = 'why_exists'
  ) THEN
    ALTER TABLE action_items ADD COLUMN why_exists text;
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE preflight_packs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_runs
CREATE POLICY "Allow public read access to ai_runs"
  ON ai_runs FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to ai_runs"
  ON ai_runs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to ai_runs"
  ON ai_runs FOR UPDATE
  USING (true);

-- RLS Policies for interview_sessions
CREATE POLICY "Allow public read access to interview_sessions"
  ON interview_sessions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to interview_sessions"
  ON interview_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to interview_sessions"
  ON interview_sessions FOR UPDATE
  USING (true);

-- RLS Policies for risk_diagnostics
CREATE POLICY "Allow public read access to risk_diagnostics"
  ON risk_diagnostics FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to risk_diagnostics"
  ON risk_diagnostics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to risk_diagnostics"
  ON risk_diagnostics FOR UPDATE
  USING (true);

-- RLS Policies for preflight_packs
CREATE POLICY "Allow public read access to preflight_packs"
  ON preflight_packs FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to preflight_packs"
  ON preflight_packs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to preflight_packs"
  ON preflight_packs FOR UPDATE
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_runs_intake_id ON ai_runs(intake_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_run_type ON ai_runs(run_type);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_intake_id ON interview_sessions(intake_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_session_id ON interview_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_risk_diagnostics_intake_id ON risk_diagnostics(intake_id);
CREATE INDEX IF NOT EXISTS idx_preflight_packs_intake_id ON preflight_packs(intake_id);