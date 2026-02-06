/*
  # Add Form Management Tables

  1. New Tables
    - `form_templates`
      - `id` (uuid, primary key)
      - `name` (text, NOT NULL) - Template display name
      - `description` (text) - Template description
      - `icon` (text) - Icon identifier for UI
      - `sections` (jsonb, NOT NULL) - Form sections and field definitions
      - `is_active` (boolean) - Whether template is available for use
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `form_drafts`
      - `id` (uuid, primary key)
      - `template_id` (uuid, FK to form_templates)
      - `template_name` (text, NOT NULL) - Cached template name
      - `data` (jsonb) - Current form data
      - `current_field_id` (text) - Current field being edited
      - `chat_history` (jsonb) - AI chat conversation history
      - `missing_required` (integer) - Count of missing required fields
      - `progress_percent` (integer) - Completion percentage (0-100)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `form_submissions`
      - `id` (uuid, primary key)
      - `template_id` (uuid, FK to form_templates)
      - `template_name` (text, NOT NULL) - Cached template name
      - `data` (jsonb, NOT NULL) - Final submitted form data
      - `summary` (text) - AI-generated summary of submission
      - `created_at` (timestamptz)
      - `submitted_at` (timestamptz) - When form was submitted
    
    - `user_profiles`
      - `id` (uuid, primary key)
      - `full_name` (text) - User's full name
      - `email` (text) - User's email address
      - `phone` (text) - Phone number
      - `address` (text) - Physical address
      - `date_of_birth` (date) - Date of birth
      - `emergency_contact_name` (text) - Emergency contact name
      - `emergency_contact_phone` (text) - Emergency contact phone
      - `company_name` (text) - Company name
      - `country` (text) - Country
      - `job_title` (text) - Job title
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (prototype demo)

  3. Important Notes
    - All timestamps default to now()
    - Boolean fields default to true/false as appropriate
    - JSONB fields default to empty object/array
    - Foreign key relationships established between drafts/submissions and templates
*/

-- Create form_templates table
CREATE TABLE IF NOT EXISTS form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create form_drafts table
CREATE TABLE IF NOT EXISTS form_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES form_templates(id) ON DELETE SET NULL,
  template_name text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  current_field_id text,
  chat_history jsonb DEFAULT '[]'::jsonb,
  missing_required integer DEFAULT 0,
  progress_percent integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES form_templates(id) ON DELETE SET NULL,
  template_name text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text,
  created_at timestamptz DEFAULT now(),
  submitted_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  address text,
  date_of_birth date,
  emergency_contact_name text,
  emergency_contact_phone text,
  company_name text,
  country text,
  job_title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for form_templates
CREATE POLICY "Allow public read access to form templates"
  ON form_templates FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to form templates"
  ON form_templates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to form templates"
  ON form_templates FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from form templates"
  ON form_templates FOR DELETE
  USING (true);

-- Create RLS Policies for form_drafts
CREATE POLICY "Allow public read access to form drafts"
  ON form_drafts FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to form drafts"
  ON form_drafts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to form drafts"
  ON form_drafts FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from form drafts"
  ON form_drafts FOR DELETE
  USING (true);

-- Create RLS Policies for form_submissions
CREATE POLICY "Allow public read access to form submissions"
  ON form_submissions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to form submissions"
  ON form_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to form submissions"
  ON form_submissions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from form submissions"
  ON form_submissions FOR DELETE
  USING (true);

-- Create RLS Policies for user_profiles
CREATE POLICY "Allow public read access to user profiles"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to user profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to user profiles"
  ON user_profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from user profiles"
  ON user_profiles FOR DELETE
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_form_drafts_template_id ON form_drafts(template_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_template_id ON form_submissions(template_id);
CREATE INDEX IF NOT EXISTS idx_form_templates_is_active ON form_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);