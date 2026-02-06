
import { AdminFormBuilder } from "./intakeForms/AdminFormBuilder";
import { Chat } from "./intakeForms/Chat";
import { Avatar } from "./intakeForms/Avatar";
import { ArrowLeft, Send, Download, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { useEffect, useState } from "react";
import { ChatMessage, FormTemplate, UserProfile, FormData } from "../types";
import { GuidedFormCompletion } from "./intakeForms/GuidedFormCompletion";
import { supabase } from '../components/intakeForms/lib/supabase';
import { generateSummary } from '../components/intakeForms/lib/formUtils'
import { ReviewSubmit } from "./intakeForms/ReviewSubmit";

export default function AIIntakeForm() {

  const profile:UserProfile =   {
      id: '1',
      full_name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street, San Francisco, CA 94102',
      date_of_birth: '1990-05-15',
      emergency_contact_name: 'Jane Doe',
      emergency_contact_phone: '+1 (555) 987-6543',
      company_name: 'Demo Company Inc',
      country: 'United States',
      job_title: 'Senior Software Engineer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
  }
  const [userProfile, setUserProfile] = useState<UserProfile | null>(profile);
  const [currentTemplate, setCurrentTemplate] = useState<FormTemplate | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>();
  const [screen, setScreen] = useState<'picker' | 'form' | 'review' | 'success' | undefined>();
  const [formData, setFormData] = useState<FormData>({});
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [skippedFields, setSkippedFields] = useState<string[]>([]);
  const [avatarModeStarted, setAvatarModeStarted] = useState(false);

  const normalizeTemplate = (template: FormTemplate): FormTemplate => {
    const normalizedSections = template.sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) => {
        if (!field.options) {
          return field;
        }

        const normalizedOptions = field.options
          .map((option: any) => {
            if (typeof option === 'string') {
              return { value: option, label: option };
            }
            if (option && typeof option === 'object') {
              const value = option.value ?? option.id ?? option.label ?? '';
              const label = option.label ?? option.value ?? option.id ?? '';
              if (value === '' && label === '') {
                return null;
              }
              return { value: String(value), label: String(label) };
            }
            return null;
          })
          .filter(Boolean) as { value: string; label: string }[];

        return {
          ...field,
          options: normalizedOptions,
        };
      }),
    }));

    return {
      ...template,
      sections: normalizedSections,
    };
  };

   useEffect(() => {
    if (userProfile) {
      seedDefaultTemplates();
      handleStart('1');
    }
  }, [userProfile]);
    const seedDefaultTemplates = async () => {
    const { data: existing } = await supabase
      .from('form_templates')
      .select('id')
      .limit(1);

    if (existing && existing.length > 0) {
      return;
    }

    const employeeOnboarding = {
      name: 'Employee Onboarding',
      description: 'Complete your employee onboarding information',
      icon: 'UserCircle',
      is_active: true,
      sections: [
        {
          id: 'personal',
          title: 'Personal Details',
          fields: [
            {
              id: 'full_name',
              label: 'Full Legal Name',
              type: 'text',
              required: true,
              avatarPrompt: "Let's start with your full legal name. What name should we use for official documents?",
              placeholder: 'John Doe',
            },
            {
              id: 'email',
              label: 'Email Address',
              type: 'email',
              required: true,
              avatarPrompt: 'What email address should we use for your work communications?',
              placeholder: 'john.doe@company.com',
            },
            {
              id: 'phone',
              label: 'Phone Number',
              type: 'phone',
              required: true,
              avatarPrompt: 'Please provide a phone number where we can reach you.',
              placeholder: '+1 (555) 123-4567',
            },
            {
              id: 'emergency_contact',
              label: 'Emergency Contact',
              type: 'text',
              required: true,
              avatarPrompt: "Who should we contact in case of an emergency? Please provide their name and phone number.",
              placeholder: 'Jane Doe - +1 (555) 987-6543',
            },
          ],
        },
        {
          id: 'job',
          title: 'Job Details',
          fields: [
            {
              id: 'start_date',
              label: 'Start Date',
              type: 'date',
              required: true,
              avatarPrompt: "When will you be starting with us? You can say it naturally like 'February 3rd' or provide a specific date.",
              placeholder: '2024-02-01',
            },
            {
              id: 'department',
              label: 'Department',
              type: 'select',
              required: true,
              options: [
                { value: 'hr', label: 'Human Resources' },
                { value: 'it', label: 'Information Technology' },
                { value: 'ops', label: 'Operations' },
                { value: 'sales', label: 'Sales' },
                { value: 'marketing', label: 'Marketing' },
                { value: 'finance', label: 'Finance' },
              ],
              avatarPrompt: 'Which department will you be joining? I can show you the options.',
            },
            {
              id: 'job_title',
              label: 'Job Title',
              type: 'text',
              required: true,
              avatarPrompt: 'What will your job title be?',
              placeholder: 'Software Engineer',
            },
            {
              id: 'manager',
              label: 'Manager Name',
              type: 'text',
              required: true,
              avatarPrompt: "Who will be your direct manager? Please provide their full name.",
              placeholder: 'Sarah Johnson',
            },
          ],
        },
        {
          id: 'setup',
          title: 'Work Setup',
          fields: [
            {
              id: 'work_location',
              label: 'Work Location',
              type: 'select',
              required: true,
              options: [
                { value: 'remote', label: 'Remote' },
                { value: 'office', label: 'Office' },
                { value: 'hybrid', label: 'Hybrid' },
              ],
              avatarPrompt: 'Where will you be working from primarily?',
            },
            {
              id: 'office_location',
              label: 'Office Location',
              type: 'text',
              required: false,
              avatarPrompt: 'If you selected office or hybrid, which office location will you be based at?',
              placeholder: 'New York HQ',
            },
            {
              id: 'home_address',
              label: 'Home Address',
              type: 'textarea',
              required: true,
              avatarPrompt: 'Please provide your home address for our records and equipment delivery.',
              placeholder: '123 Main St, Apt 4B, New York, NY 10001',
            },
          ],
        },
        {
          id: 'accounts',
          title: 'Accounts & Access',
          fields: [
            {
              id: 'preferred_username',
              label: 'Preferred Username',
              type: 'text',
              required: true,
              avatarPrompt: 'What username would you like for your company accounts? This will be used for email and other systems.',
              placeholder: 'jdoe',
            },
            {
              id: 'systems_access',
              label: 'Systems Access Needed',
              type: 'textarea',
              required: false,
              avatarPrompt: 'Are there any specific systems or tools you know you will need access to? List them if you know, or we can skip this for now.',
              placeholder: 'GitHub, Jira, Slack, AWS',
            },
          ],
        },
        {
          id: 'equipment',
          title: 'Equipment',
          fields: [
            {
              id: 'laptop_preference',
              label: 'Laptop Preference',
              type: 'select',
              required: true,
              options: [
                { value: 'mac', label: 'MacBook Pro' },
                { value: 'windows', label: 'Windows Laptop' },
                { value: 'linux', label: 'Linux Laptop' },
              ],
              avatarPrompt: 'What type of laptop would you prefer to work with?',
            },
            {
              id: 'additional_equipment',
              label: 'Additional Equipment',
              type: 'textarea',
              required: false,
              avatarPrompt: 'Do you need any additional equipment like monitors, keyboard, mouse, or headphones?',
              placeholder: 'External monitor, wireless keyboard and mouse',
            },
          ],
        },
      ],
    };

    try {
      await supabase.from('form_templates').insert([employeeOnboarding]);
    } catch (error) {
      console.error('Error seeding templates:', error);
    }
  };

   const handleStart = async (templateId: string) => {
    const { data: template } = await supabase
      .from('form_templates')
      .select('*')
      .eq('id', "b5d6a466-8a0f-4563-98c0-78b99067d833")
      .single();

    if (template) {
      setCurrentTemplate(normalizeTemplate(template));
      setFormData({});
      setChatHistory([]);
      setCurrentDraftId(undefined);
      setScreen('form');
    }
  };

  const handleReview = (data?: FormData, chat?: ChatMessage[], skipped?: string[], avatarStarted?: boolean) => {
    if (data) setFormData(data);
    if (chat) setChatHistory(chat);
    if (skipped) setSkippedFields(skipped);
    if (avatarStarted !== undefined) setAvatarModeStarted(avatarStarted);
    setScreen('review');
  };

  const handleSubmit = async (summary: string) => {
    // console.log("current template: ", currentTemplate)
    if (!currentTemplate) return;

    try {
      await supabase.from('form_submissions').insert({
        template_id: currentTemplate.id,
        template_name: currentTemplate.name,
        data: formData,
        summary,
      });

      if (currentDraftId) {
        await supabase.from('form_drafts').delete().eq('id', currentDraftId);
      }

      setScreen('success');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form');
    }
  };

  const handleBackToForm = () => {
    setScreen('form');
  };

  const handleExit = () => {
  
    setCurrentTemplate(null);
    setFormData({});
    setChatHistory([]);
    setSkippedFields([]);
    setAvatarModeStarted(false);
    setCurrentDraftId(undefined);
    setScreen('form');
    handleStart('1');
  };

  const handleDataChange = (fieldId: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleLogout = () => {
    setUserProfile(null);
    handleExit();
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  const handleDownloadJSON = () => {
    if (!currentTemplate) return;
    console.log('Downloading JSON with formData:', formData);
    const downloadData = {
      template: currentTemplate.name,
      submittedAt: new Date().toISOString(),
      data: formData
    };
    const json = JSON.stringify(downloadData, null, 2);
    console.log('JSON to download:', json);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTemplate.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSummary = () => {
    if (!currentTemplate) return;
    console.log('Generating summary with formData:', formData);
    const summary = generateSummary(currentTemplate, formData);
    console.log('Generated summary:', summary);
    console.log('Summary length:', summary.length);
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTemplate.name.toLowerCase().replace(/\s+/g, '-')}-summary-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (screen === 'form' && currentTemplate) {
    return (
      <GuidedFormCompletion
        template={currentTemplate}
        draftId={currentDraftId}
        initialData={formData}
        initialChatHistory={chatHistory}
        initialSkippedFields={skippedFields}
        initialAvatarModeStarted={avatarModeStarted}
        userProfile={userProfile}
        onDataChange={setFormData}
        onReview={handleReview}
        onSubmit={(summary, data, template) => {
          setFormData(data);
          setCurrentTemplate(template);
          // console.log(summary);
          // console.log(template);
          setScreen('success');
        }}
        onExit={handleExit}
      />
    );
  }
    if (screen === 'review' && currentTemplate) {
    return (
      <ReviewSubmit
        template={currentTemplate}
        data={formData}
        onBack={handleBackToForm}
        onSubmit={handleSubmit}
        onChange={handleDataChange}
      />
    );
  }

  if (screen === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Form Submitted Successfully!
          </h1>
          <p className="text-slate-600 mb-6">
            Your {(currentTemplate as unknown as FormTemplate)?.name} has been submitted. You'll receive a confirmation email shortly.
          </p>

          <div className="space-y-3 mb-6">
            <button
              onClick={handleDownloadSummary}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-all border border-slate-300"
            >
              <Download size={20} />
              Download Summary
            </button>
            <button
              onClick={handleDownloadJSON}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-all border border-slate-300"
            >
              <FileJson size={20} />
              Export as JSON
            </button>
          </div>

          <button
            onClick={handleExit}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all shadow-md hover:shadow-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  // return (
  //   <div className="space-y-6">
  //     <h2 className="text-xl font-semibold">AI Intake Form</h2>
  //     {/* <AdminFormBuilder />
  //     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //       <Chat />
  //       <Avatar />
  //     </div> */}

  //     {/* <GuidedFormCompletion
  //       template={currentTemplate}
  //       draftId={currentDraftId}
  //       initialData={formData}
  //       initialChatHistory={chatHistory}
  //       initialSkippedFields={skippedFields}
  //       initialAvatarModeStarted={avatarModeStarted}
  //       userProfile={userProfile}
  //       onReview={handleReview}
  //       onSubmit={(summary) => {
  //         setScreen('success');
  //       }}
  //       onExit={handleExit}
  //     /> */}
  //   </div>
  // );
}
