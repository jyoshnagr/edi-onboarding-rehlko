export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'textarea'
  | 'number';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: FieldOption[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    message?: string;
  };
  avatarPrompt: string;
  placeholder?: string;
  helpText?: string;
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  sections: FormSection[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  type: 'avatar' | 'user';
  content: string;
  timestamp: Date;
  fieldId?: string;
  quickReplies?: string[];
  confidence?: number;
}

export interface FormData {
  [fieldId: string]: string | string[];
}

export interface FormDraft {
  id: string;
  template_id: string;
  template_name: string;
  data: FormData;
  progress_percent: number;
  missing_required: number;
  chat_history: ChatMessage[];
  current_field_id: string;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  template_id: string;
  template_name: string;
  data: FormData;
  summary: string;
  submitted_at: string;
  created_at: string;
}

export type AvatarStatus = 'idle' | 'speaking' | 'listening' | 'thinking' | 'paused';

export interface ValidationError {
  fieldId: string;
  message: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  company_name: string | null;
  country: string | null;
  job_title: string | null;
  created_at: string;
  updated_at: string;
}
