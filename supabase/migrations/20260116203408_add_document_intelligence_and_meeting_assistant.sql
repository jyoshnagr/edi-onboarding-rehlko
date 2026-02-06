/*
  # Document Intelligence and AI Meeting Assistant Schema

  1. New Tables
    - `uploaded_documents`
      - `id` (uuid, primary key)
      - `file_name` (text) - Original filename
      - `file_type` (text) - MIME type
      - `file_size` (integer) - Size in bytes
      - `file_url` (text) - Storage URL
      - `upload_date` (timestamptz) - Upload timestamp
      - `status` (text) - processing, completed, failed
      - `metadata` (jsonb) - Additional file metadata
      
    - `intake_extractions`
      - `id` (uuid, primary key)
      - `document_id` (uuid, foreign key) - Reference to uploaded document
      - `company_name` (text) - Extracted company name
      - `customer_contacts` (jsonb) - Business and EDI contacts
      - `americold_contacts` (jsonb) - Americold contacts
      - `go_live_date` (date) - Target go-live date
      - `edi_experience` (text) - Level of EDI experience
      - `data_format` (text) - X12, EDIFACT, etc.
      - `transactions` (jsonb) - EDI transaction types
      - `locations` (jsonb) - Warehouse locations
      - `protocol` (text) - Communication protocol (AS2, SFTP, etc.)
      - `unique_requirements` (text) - Special requirements
      - `extracted_at` (timestamptz) - Extraction timestamp
      
    - `ai_analysis`
      - `id` (uuid, primary key)
      - `intake_id` (uuid, foreign key) - Reference to intake extraction
      - `readiness_score` (integer) - Overall readiness score (0-100)
      - `complexity_level` (text) - low, medium, high, critical
      - `identified_risks` (jsonb) - Array of risk objects
      - `missing_information` (jsonb) - Array of missing data points
      - `recommendations` (jsonb) - Array of recommendations
      - `estimated_timeline` (text) - Estimated implementation timeline
      - `analyzed_at` (timestamptz) - Analysis timestamp
      
    - `action_items`
      - `id` (uuid, primary key)
      - `intake_id` (uuid, foreign key) - Reference to intake
      - `title` (text) - Action item title
      - `description` (text) - Detailed description
      - `priority` (text) - critical, high, medium, low
      - `assigned_to` (text) - Assignee
      - `status` (text) - pending, in_progress, completed, blocked
      - `due_date` (date) - Due date
      - `created_at` (timestamptz) - Creation timestamp
      - `completed_at` (timestamptz) - Completion timestamp
      
    - `meeting_sessions`
      - `id` (uuid, primary key)
      - `intake_id` (uuid, foreign key) - Related intake
      - `meeting_title` (text) - Meeting name
      - `meeting_date` (timestamptz) - Meeting start time
      - `participants` (jsonb) - Array of participants
      - `status` (text) - scheduled, in_progress, completed
      - `ai_avatar_active` (boolean) - Whether AI avatar participated
      - `transcript` (text) - Full meeting transcript
      - `key_decisions` (jsonb) - Key decisions made
      - `questions_asked` (jsonb) - Questions asked by AI avatar
      - `created_at` (timestamptz) - Creation timestamp
      
    - `meeting_insights`
      - `id` (uuid, primary key)
      - `meeting_id` (uuid, foreign key) - Reference to meeting
      - `insight_type` (text) - gap, risk, opportunity, clarification
      - `content` (text) - Insight content
      - `related_context` (jsonb) - Related JIRA/intake data
      - `confidence_score` (float) - AI confidence level
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their data
    
  3. Indexes
    - Add indexes for foreign keys and frequently queried fields
*/

-- Create uploaded_documents table
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  file_url text,
  upload_date timestamptz DEFAULT now(),
  status text DEFAULT 'processing',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create intake_extractions table
CREATE TABLE IF NOT EXISTS intake_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES uploaded_documents(id) ON DELETE CASCADE,
  company_name text,
  customer_contacts jsonb DEFAULT '[]'::jsonb,
  americold_contacts jsonb DEFAULT '[]'::jsonb,
  go_live_date date,
  edi_experience text,
  data_format text,
  transactions jsonb DEFAULT '[]'::jsonb,
  locations jsonb DEFAULT '[]'::jsonb,
  protocol text,
  unique_requirements text,
  extracted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create ai_analysis table
CREATE TABLE IF NOT EXISTS ai_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid REFERENCES intake_extractions(id) ON DELETE CASCADE,
  readiness_score integer DEFAULT 0,
  complexity_level text DEFAULT 'medium',
  identified_risks jsonb DEFAULT '[]'::jsonb,
  missing_information jsonb DEFAULT '[]'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  estimated_timeline text,
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create action_items table
CREATE TABLE IF NOT EXISTS action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid REFERENCES intake_extractions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium',
  assigned_to text,
  status text DEFAULT 'pending',
  due_date date,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create meeting_sessions table
CREATE TABLE IF NOT EXISTS meeting_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid REFERENCES intake_extractions(id) ON DELETE SET NULL,
  meeting_title text NOT NULL,
  meeting_date timestamptz DEFAULT now(),
  participants jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'scheduled',
  ai_avatar_active boolean DEFAULT false,
  transcript text,
  key_decisions jsonb DEFAULT '[]'::jsonb,
  questions_asked jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create meeting_insights table
CREATE TABLE IF NOT EXISTS meeting_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES meeting_sessions(id) ON DELETE CASCADE,
  insight_type text NOT NULL,
  content text NOT NULL,
  related_context jsonb DEFAULT '{}'::jsonb,
  confidence_score float DEFAULT 0.0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since RLS was disabled in previous migration)
CREATE POLICY "Allow public read access to uploaded_documents"
  ON uploaded_documents FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to uploaded_documents"
  ON uploaded_documents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to uploaded_documents"
  ON uploaded_documents FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access to intake_extractions"
  ON intake_extractions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to intake_extractions"
  ON intake_extractions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to intake_extractions"
  ON intake_extractions FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access to ai_analysis"
  ON ai_analysis FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to ai_analysis"
  ON ai_analysis FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to ai_analysis"
  ON ai_analysis FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access to action_items"
  ON action_items FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to action_items"
  ON action_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to action_items"
  ON action_items FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to action_items"
  ON action_items FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to meeting_sessions"
  ON meeting_sessions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to meeting_sessions"
  ON meeting_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to meeting_sessions"
  ON meeting_sessions FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access to meeting_insights"
  ON meeting_insights FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to meeting_insights"
  ON meeting_insights FOR INSERT
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_intake_extractions_document_id ON intake_extractions(document_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_intake_id ON ai_analysis(intake_id);
CREATE INDEX IF NOT EXISTS idx_action_items_intake_id ON action_items(intake_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_intake_id ON meeting_sessions(intake_id);
CREATE INDEX IF NOT EXISTS idx_meeting_insights_meeting_id ON meeting_insights(meeting_id);