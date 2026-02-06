/*
  # Enhance action items for JIRA export and better tracking

  1. Changes
    - Add JIRA-compatible fields to action_items table
    - Add story_points for effort estimation
    - Add labels for categorization
    - Add epic_link for grouping
    - Add jira_issue_key for tracking exported items
    - Add acceptance_criteria for clear completion definition
    - Add custom_fields for additional JIRA mappings
    - Add exported_at timestamp
    - Add modified tracking fields
  
  2. Security
    - No RLS changes needed
*/

-- Add JIRA-compatible fields to action_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'action_items' AND column_name = 'story_points'
  ) THEN
    ALTER TABLE action_items ADD COLUMN story_points integer DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'action_items' AND column_name = 'labels'
  ) THEN
    ALTER TABLE action_items ADD COLUMN labels jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'action_items' AND column_name = 'epic_link'
  ) THEN
    ALTER TABLE action_items ADD COLUMN epic_link text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'action_items' AND column_name = 'jira_issue_key'
  ) THEN
    ALTER TABLE action_items ADD COLUMN jira_issue_key text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'action_items' AND column_name = 'acceptance_criteria'
  ) THEN
    ALTER TABLE action_items ADD COLUMN acceptance_criteria text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'action_items' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE action_items ADD COLUMN custom_fields jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'action_items' AND column_name = 'exported_at'
  ) THEN
    ALTER TABLE action_items ADD COLUMN exported_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'action_items' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE action_items ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'action_items' AND column_name = 'category'
  ) THEN
    ALTER TABLE action_items ADD COLUMN category text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'action_items' AND column_name = 'blocked_reason'
  ) THEN
    ALTER TABLE action_items ADD COLUMN blocked_reason text DEFAULT NULL;
  END IF;
END $$;

-- Create index for JIRA issue key lookups
CREATE INDEX IF NOT EXISTS idx_action_items_jira_issue_key ON action_items(jira_issue_key);

-- Create index for status tracking
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);

-- Create index for priority sorting
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_action_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS action_items_updated_at_trigger ON action_items;

CREATE TRIGGER action_items_updated_at_trigger
  BEFORE UPDATE ON action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_action_items_updated_at();