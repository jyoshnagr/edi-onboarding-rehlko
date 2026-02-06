import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TradingPartner {
  id: string;
  name: string;
  is_existing: boolean;
  previous_onboardings: number;
  typical_requirements: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OnboardingRequest {
  id: string;
  trading_partner_id: string;
  request_number: string;
  status: string;
  priority: string;
  warehouse_location: string;
  wms_type: string;
  protocol: string;
  transaction_types: string[];
  requested_go_live_date: string;
  estimated_completion_date: string;
  business_value_score: number;
  intake_completeness: number;
  readiness_score: number;
  confidence_percentage: number;
  cycle_time_days: number;
  ai_summary: string;
  missing_items: string[];
  conflicts: string[];
  jira_epic_id: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  trading_partner?: TradingPartner;
}

export interface Meeting {
  id: string;
  onboarding_request_id: string;
  meeting_type: string;
  meeting_date: string;
  participants: string[];
  transcript: string;
  decisions_made: string[];
  assumptions: string[];
  open_questions: string[];
  constraints: string[];
  ai_summary: string;
  created_at: string;
  updated_at: string;
}

export interface ReadinessScore {
  id: string;
  onboarding_request_id: string;
  score: number;
  confidence: number;
  score_factors: Record<string, number>;
  recommendations: string[];
  calculated_at: string;
  created_at: string;
}

export interface Blocker {
  id: string;
  onboarding_request_id: string;
  blocker_type: string;
  severity: string;
  title: string;
  description: string;
  resolution_required: boolean;
  resolved: boolean;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Decision {
  id: string;
  onboarding_request_id: string;
  decision_type: string;
  decision_maker: string;
  rationale: string;
  action_items: string[];
  decided_at: string;
  created_at: string;
}
