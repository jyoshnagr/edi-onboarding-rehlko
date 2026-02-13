import { useState, useEffect, useRef } from 'react';
import { Save, Eye, Home, Send, RefreshCcw, X } from 'lucide-react';
import { FormTemplate, FormData, ChatMessage, AvatarStatus, FormField, ValidationError, UserProfile } from '../../types';
import { Avatar } from './Avatar';
import { Chat } from './Chat';
import { LiveForm } from './LiveForm'
import { VoiceManager } from './lib/voiceUtils';
import { calculateProgress, getNextMissingField, validateAllFields, extractValueFromResponse, parseAddressComponents, generateSummary } from './lib/formUtils';
import { supabase } from '../intakeForms/lib/supabase';
import { translate, translateFieldPrompt, Language } from './lib/translations';

interface GuidedFormCompletionProps {
  template: FormTemplate;
  draftId?: string;
  initialData?: FormData;
  initialChatHistory?: ChatMessage[];
  initialSkippedFields?: string[];
  initialAvatarModeStarted?: boolean;
  userProfile: UserProfile | null;
  onReview: (data?: FormData, chat?: ChatMessage[], skipped?: string[], avatarStarted?: boolean) => void;
  onSubmit?: (summary: string, data: FormData, template: FormTemplate) => void;
  onDataChange?: (data: FormData) => void;
  onExit: () => void;
}

export function GuidedFormCompletion({
  template,
  draftId,
  initialData = {},
  initialChatHistory = [],
  initialSkippedFields = [],
  initialAvatarModeStarted = false,
  userProfile,
  onReview,
  onSubmit,
  onDataChange,
  onExit,
}: GuidedFormCompletionProps) {
  const prepopulateFromProfile = (): FormData => {
    if (!userProfile || Object.keys(initialData).length > 0) {
      return initialData;
    }

    const prepopulated: FormData = {};
    const allFields = template.sections.flatMap(s => s.fields);

    const addressComponents = userProfile.address ? parseAddressComponents(userProfile.address) : null;

    allFields.forEach(field => {
      const fieldId = field.id.toLowerCase();
      // console.log(fieldId)

      if (fieldId.includes('company') && (fieldId.includes('name') || fieldId.includes('legal'))) {
        if (userProfile.company_name) prepopulated[field.id] = userProfile.company_name;
      } else if (fieldId.includes('country')) {
        if (userProfile.country) prepopulated[field.id] = userProfile.country;
      } else if (fieldId.includes('job') && fieldId.includes('title')) {
        if (userProfile.job_title) prepopulated[field.id] = userProfile.job_title;
      } else if (fieldId.includes('name') && !fieldId.includes('emergency') && !fieldId.includes('username') && !fieldId.includes('company')) {
        if (userProfile.full_name) prepopulated[field.id] = userProfile.full_name;
      } else if (fieldId.includes('email') && !fieldId.includes('company')) {
        if (userProfile.email) prepopulated[field.id] = userProfile.email;
      } else if (fieldId.includes('phone') && !fieldId.includes('emergency') && !fieldId.includes('company')) {
        if (userProfile.phone) prepopulated[field.id] = userProfile.phone;
      } else if (fieldId.includes('address') || fieldId.includes('street')) {
        // if (addressComponents?.street) {
        //   prepopulated[field.id] = addressComponents.street;
        // } else if (userProfile.address) {
        //   prepopulated[field.id] = userProfile.address;
        // }
         if (userProfile.address) {
          prepopulated[field.id] = userProfile.address;
        }
      } else if (fieldId.includes('city')) {
        if (addressComponents?.city) prepopulated[field.id] = addressComponents.city;
      } else if (fieldId.includes('state')) {
        if (addressComponents?.state) prepopulated[field.id] = addressComponents.state;
      } else if (fieldId.includes('zip') || fieldId.includes('postal')) {
        if (addressComponents?.zip) prepopulated[field.id] = addressComponents.zip;
      } else if (fieldId.includes('birth') || fieldId.includes('dob')) {
        if (userProfile.date_of_birth) prepopulated[field.id] = userProfile.date_of_birth;
      } else if (fieldId.includes('emergency') && fieldId.includes('name')) {
        if (userProfile.emergency_contact_name) prepopulated[field.id] = userProfile.emergency_contact_name;
      } else if (fieldId.includes('emergency') && fieldId.includes('phone')) {
        if (userProfile.emergency_contact_phone) prepopulated[field.id] = userProfile.emergency_contact_phone;
      }
    });
    return prepopulated;
  };

  const [data, setData] = useState<FormData>(prepopulateFromProfile());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatHistory);
  const [currentFieldId, setCurrentFieldId] = useState<string>('');
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>('idle');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lastAvatarMessage, setLastAvatarMessage] = useState<string>('');
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(draftId);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [pendingTranscript, setPendingTranscript] = useState<string>('');
  const [transcriptAlternatives, setTranscriptAlternatives] = useState<string[]>([]);
  const [skippedFields, setSkippedFields] = useState<string[]>(initialSkippedFields);
  const [avatarModeStarted, setAvatarModeStarted] = useState(initialAvatarModeStarted);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en-US');

  const voiceManager = useRef(new VoiceManager());
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const { tts, stt } = voiceManager.current.supported;

  // Enable voice by default if TTS is supported
  useEffect(() => {
    if (tts && !voiceEnabled && avatarModeStarted) {
      setVoiceEnabled(true);
    }
  }, [avatarModeStarted]);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, chatMessages, currentFieldId]);

  useEffect(() => {
    if (onDataChange) {
      onDataChange(data);
    }
  }, [data, onDataChange]);

  const addAvatarMessage = (content: string, fieldId?: string, quickReplies?: string[], shouldSpeak?: boolean) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'avatar',
      content,
      timestamp: new Date(),
      fieldId,
      quickReplies,
    };
    setChatMessages((prev) => [...prev, message]);
    setLastAvatarMessage(content);

    const enableVoice = shouldSpeak !== undefined ? shouldSpeak : voiceEnabled;

    if (enableVoice && tts) {
      setAvatarStatus('speaking');
      voiceManager.current.speak(content, () => {
        setAvatarStatus('idle');
        // Auto-start listening after speaking if STT is supported and we're waiting for input
        if (stt && fieldId) {
          setTimeout(() => {
            startListening();
          }, 500);
        }
      });
    }
  };

  const addUserMessage = (content: string, confidence: number = 1.0) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
      confidence,
    };
    setChatMessages((prev) => [...prev, message]);
  };

  const startAvatarMode = () => {
    setAvatarModeStarted(true);
    const shouldEnableVoice = tts;
    if (shouldEnableVoice) {
      setVoiceEnabled(true);
    }

    const prepopulatedFields: string[] = [];
    const allFields = template.sections.flatMap(s => s.fields);

    allFields.forEach(field => {
      if (data[field.id]) {
        prepopulatedFields.push(`${field.label}: ${data[field.id]}`);
      }
    });

    if (prepopulatedFields.length > 0) {
      const quickReplies = [
        translate(currentLanguage, 'looksGood'),
        translate(currentLanguage, 'needToUpdate')
      ];

      addAvatarMessage(
        translate(currentLanguage, 'welcome', template.name, prepopulatedFields),
        undefined,
        quickReplies,
        shouldEnableVoice
      );
    } else {
      addAvatarMessage(
        translate(currentLanguage, 'welcomeNoPrepopulated', template.name),
        undefined,
        undefined,
        shouldEnableVoice
      );

      setTimeout(() => {
        startNextField();
      }, 3500);
    }
  };

  const normalizeOptions = (options: any[]) => {
    if (!options || options.length === 0) return [];
    return options.map(option => {
      if (typeof option === 'string') {
        return { label: option, value: option };
      }
      return { label: option.label, value: option.value };
    });
  };

  const startNextField = () => {
    const nextField = getNextMissingField(template, data, currentFieldId, skippedFields);

    if (!nextField) {
      addAvatarMessage(
        translate(currentLanguage, 'allComplete'),
        undefined
      );
      return;
    }

    setCurrentFieldId(nextField.id);

    const quickReplies = nextField.type === 'select' && nextField.options
      ? normalizeOptions(nextField.options).slice(0, 4).map((o) => o.label)
      : undefined;

    // Provide fallback prompt if avatarPrompt is missing
    const defaultPrompt = currentLanguage === 'it-IT'
      ? `Qual è il tuo ${nextField.label.toLowerCase()}?`
      : `What is your ${nextField.label.toLowerCase()}?`;

    const promptToTranslate = nextField.avatarPrompt || defaultPrompt;
    const translatedPrompt = translateFieldPrompt(promptToTranslate, currentLanguage);

    addAvatarMessage(translatedPrompt, nextField.id, quickReplies);
  };

  const handleFieldChange = (fieldId: string, value: string | string[]) => {
    // console.log('Field change:', fieldId, '=', value, '(current:', currentFieldId + ')');

    // Only auto-advance if this is the current field being asked about
    if (fieldId === currentFieldId) {
      // Check if value is non-empty
      const hasValue = Array.isArray(value)
        ? value.length > 0
        : typeof value === 'string' && value.trim() !== '';

      // console.log('Has value:', hasValue);

      if (hasValue) {
        // Update data with the new value
        const updatedData = { ...data, [fieldId]: value };
        setData(updatedData);

        // console.log('Updated data:', updatedData);

        voiceManager.current.stopSpeaking();
        setAvatarStatus('thinking');

        setTimeout(() => {
          setAvatarStatus('idle');
          addAvatarMessage(translate(currentLanguage, 'gotIt'));

          setTimeout(() => {
            // Find next field using the updated data
            const nextField = getNextMissingField(template, updatedData, fieldId, skippedFields);

            console.log('Next field:', nextField?.id || 'none (all complete)');

            if (!nextField) {
              addAvatarMessage(
                translate(currentLanguage, 'allComplete'),
                undefined
              );
              return;
            }

            setCurrentFieldId(nextField.id);

            const quickReplies = nextField.type === 'select' && nextField.options
              ? normalizeOptions(nextField.options).slice(0, 4).map((o) => o.label)
              : undefined;

            // Provide fallback prompt if avatarPrompt is missing
            const defaultPrompt = currentLanguage === 'it-IT'
              ? `Qual è il tuo ${nextField.label.toLowerCase()}?`
              : `What is your ${nextField.label.toLowerCase()}?`;

            const promptToTranslate = nextField.avatarPrompt || defaultPrompt;
            const translatedPrompt = translateFieldPrompt(promptToTranslate, currentLanguage);

            addAvatarMessage(translatedPrompt, nextField.id, quickReplies);
          }, 1800);
        }, 1000);
      }
    } else {
      // Just update data without advancing
      console.log('Not current field - updating data only');
      setData((prev) => ({ ...prev, [fieldId]: value }));
    }
  };

  const handleQuickReply = (reply: string) => {
    addUserMessage(reply);

    const looksGoodText = translate(currentLanguage, 'looksGood');
    const needToUpdateText = translate(currentLanguage, 'needToUpdate');

    if (reply === looksGoodText || reply === 'Looks good' || reply === needToUpdateText || reply === 'Need to update something') {
      voiceManager.current.stopSpeaking();
      setAvatarStatus('thinking');

      setTimeout(() => {
        setAvatarStatus('idle');
        const isLooksGood = reply === looksGoodText || reply === 'Looks good';
        addAvatarMessage(
          isLooksGood
            ? translate(currentLanguage, 'looksGoodResponse')
            : translate(currentLanguage, 'needToUpdateResponse')
        );

        setTimeout(() => {
          startNextField();
        }, 3000);
      }, 1000);
      return;
    }

    if (currentFieldId) {
      const field = template.sections
        .flatMap(s => s.fields)
        .find(f => f.id === currentFieldId);

      if (field?.type === 'select' && field.options) {
        const normalizedOptions = normalizeOptions(field.options);
        const option = normalizedOptions.find(o => o.label === reply);
        if (option) {
          handleFieldChange(currentFieldId, option.value);
        }
      }
    }
  };

  const handleFieldClick = (fieldId: string) => {
    const field = template.sections
      .flatMap(s => s.fields)
      .find(f => f.id === fieldId);

    if (field) {
      setCurrentFieldId(fieldId);
      voiceManager.current.stopSpeaking();

      const quickReplies = field.type === 'select' && field.options
        ? normalizeOptions(field.options).slice(0, 4).map(o => o.label)
        : undefined;

      // Provide fallback prompt if avatarPrompt is missing
      const defaultPrompt = currentLanguage === 'it-IT'
        ? `Qual è il tuo ${field.label.toLowerCase()}?`
        : `What is your ${field.label.toLowerCase()}?`;

      const promptToTranslate = field.avatarPrompt || defaultPrompt;
      const translatedPrompt = translateFieldPrompt(promptToTranslate, currentLanguage);

      addAvatarMessage(
        translate(currentLanguage, 'helpWith', field.label, translatedPrompt),
        fieldId,
        quickReplies
      );
    }
  };

  const handleToggleVoice = () => {
    const newVoiceEnabled = !voiceEnabled;
    setVoiceEnabled(newVoiceEnabled);

    if (!newVoiceEnabled) {
      // Stop speaking and listening when voice is disabled
      voiceManager.current.stopSpeaking();
      if (isListening || isPaused) {
        voiceManager.current.stopListening();
        setIsListening(false);
        setIsPaused(false);
      }
      setAvatarStatus('idle');
    } else if (newVoiceEnabled && currentFieldId) {
      // Auto-start listening when voice is re-enabled
      setTimeout(() => {
        startListening();
      }, 500);
    }
  };

  const startListening = () => {
    if (!isListening && stt) {
      setAvatarStatus('listening');
      setIsListening(true);
      setInterimTranscript('');
      setPendingTranscript('');
      setTranscriptAlternatives([]);

      voiceManager.current.startListening(
        (transcript, confidence, isFinal, alternatives) => {
          console.log('Voice input received:', transcript, 'isFinal:', isFinal, 'confidence:', confidence);

          if (isFinal) {
            setIsListening(false);
            setAvatarStatus('idle');
            setInterimTranscript('');
            setPendingTranscript(transcript);
            setTranscriptAlternatives(alternatives || []);
          } else {
            setInterimTranscript(transcript);
          }
        },
        (error) => {
          console.error('Speech recognition error:', error);
          if (error !== 'no-speech' && error !== 'aborted') {
            addAvatarMessage(translate(currentLanguage, 'didntCatch'));
          }
          setIsListening(false);
          setAvatarStatus('idle');
          setInterimTranscript('');
          // Restart listening after error
          if (voiceEnabled && currentFieldId) {
            setTimeout(() => startListening(), 1000);
          }
        }
      );
    }
  };

  const handleConfirmTranscript = () => {
    if (pendingTranscript) {
      handleUserInput(pendingTranscript, 0.9);
      setPendingTranscript('');
      setTranscriptAlternatives([]);
    }
  };

  const handleRetryVoice = () => {
    setPendingTranscript('');
    setTranscriptAlternatives([]);
    setTimeout(() => startListening(), 300);
  };

  const handleEditTranscript = (text: string) => {
    setPendingTranscript(text);
  };

  const handleSelectAlternative = (alternative: string) => {
    setPendingTranscript(alternative);
  };

  const handleToggleMic = () => {
    if (isListening) {
      voiceManager.current.stopListening();
      setIsListening(false);
      setIsPaused(false);
      setAvatarStatus('idle');
    } else {
      startListening();
    }
  };

  const handleCloseListeningPopup = () => {
    if (isListening || isPaused) {
      voiceManager.current.stopListening();
      setIsListening(false);
      setIsPaused(false);
      setAvatarStatus('idle');
    }
    setInterimTranscript('');
  };

  const handlePauseResume = () => {
    if (isPaused) {
      // Resume listening
      voiceManager.current.resumeListening();
      setIsPaused(false);
      setIsListening(true);
      setAvatarStatus('listening');
    } else if (isListening) {
      // Pause listening
      voiceManager.current.pauseListening();
      setIsPaused(true);
      setIsListening(false);
      setAvatarStatus('paused');
    }
  };

  const handleUserInput = (input: string, confidence: number = 1.0) => {
    console.log('User input received:', input, 'for field:', currentFieldId);

    // Stop listening when user provides input
    if (isListening || isPaused) {
      voiceManager.current.stopListening();
      setIsListening(false);
      setIsPaused(false);
    }

    addUserMessage(input, confidence);

    if (currentFieldId) {
      setAvatarStatus('thinking');

      setTimeout(() => {
        console.log('Processing input for field:', currentFieldId);

        // Find the current field to extract value intelligently
        const field = template.sections
          .flatMap(s => s.fields)
          .find(f => f.id === currentFieldId);

        if (field) {
          // Extract the actual value from the conversational response
          const extractedValue = extractValueFromResponse(input, field);
          console.log('Extracted value:', extractedValue, 'from:', input);
          handleFieldChange(currentFieldId, extractedValue);
        } else {
          handleFieldChange(currentFieldId, input);
        }
      }, 800);
    } else {
      console.warn('No current field set - user input ignored');
    }
  };

  const handleRepeat = () => {
    if (lastAvatarMessage) {
      addAvatarMessage(lastAvatarMessage, currentFieldId);
    }
  };

  const handleRephrase = () => {
    if (currentFieldId) {
      const field = template.sections
        .flatMap(s => s.fields)
        .find(f => f.id === currentFieldId);

      if (field) {
        const labelLower = field.label.toLowerCase();
        let rephrasedPrompts: string[];

        if (currentLanguage === 'it-IT') {
          rephrasedPrompts = [
            `Potresti fornire il tuo ${labelLower}?`,
            `Cosa devo inserire per ${labelLower}?`,
            `Per favore dimmi il tuo ${labelLower}.`,
          ];
        } else {
          rephrasedPrompts = [
            `Could you provide your ${labelLower}?`,
            `What should I put for ${labelLower}?`,
            `Please tell me your ${labelLower}.`,
          ];
        }

        const randomPrompt = rephrasedPrompts[Math.floor(Math.random() * rephrasedPrompts.length)];
        addAvatarMessage(randomPrompt, currentFieldId);
      }
    }
  };

  const handleSkip = () => {
    if (currentFieldId) {
      // Add current field to skipped list
      setSkippedFields(prev => [...prev, currentFieldId]);
    }

    addUserMessage(translate(currentLanguage, 'skipForNow'));
    addAvatarMessage(translate(currentLanguage, 'skipResponse'));

    setTimeout(() => {
      startNextField();
    }, 1000);
  };

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    voiceManager.current.setLanguage(language);

    addAvatarMessage(translate(language, 'languageChanged'));
  };

  const saveDraft = async () => {
    const progress = calculateProgress(template, data);

    try {
      if (currentDraftId) {
        await supabase
          .from('form_drafts')
          .update({
            data,
            progress_percent: progress.percent,
            missing_required: progress.missingRequired,
            chat_history: chatMessages,
            current_field_id: currentFieldId,
            metadata: { skippedFields, avatarModeStarted },
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentDraftId);
      } else {
        const { data: newDraft } = await supabase
          .from('form_drafts')
          .insert({
            template_id: template.id,
            template_name: template.name,
            data,
            progress_percent: progress.percent,
            missing_required: progress.missingRequired,
            chat_history: chatMessages,
            current_field_id: currentFieldId,
            metadata: { skippedFields, avatarModeStarted },
          })
          .select()
          .single();

        if (newDraft) {
          setCurrentDraftId(newDraft.id);
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const handleReview = () => {
    const errors = validateAllFields(template, data);
    setValidationErrors(errors);

    if (errors.length > 0) {
      addAvatarMessage(translate(currentLanguage, 'validationError', errors.length));
    } else {
      onReview(data, chatMessages, skippedFields, avatarModeStarted);
    }
  };

  const handleSubmit = async () => {
    const errors = validateAllFields(template, data);
    setValidationErrors(errors);

    if (errors.length > 0) {
      addAvatarMessage(translate(currentLanguage, 'validationError', errors.length));
      return;
    }

    if (onSubmit) {
      const summary = generateSummary(template, data);

      try {
        await supabase.from('form_submissions').insert({
          template_id: template.id,
          template_name: template.name,
          data,
          summary,
        });

        if (currentDraftId) {
          await supabase.from('form_drafts').delete().eq('id', currentDraftId);
        }

        onSubmit(summary, data, template);
      } catch (error) {
        console.error('Error submitting form:', error);
        addAvatarMessage(translate(currentLanguage, 'submitError'));
      }
    }
  };

  const progress = calculateProgress(template, data);

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        {/* <div>
          <h1 className="text-xl font-bold text-slate-900">{template.name}</h1>
          <p className="text-sm text-slate-600">Guided by AI Assistant</p>
        </div> */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900">
            {template.name}
          </h1>
            <span className="text-slate-400">-</span>
          <p className="text-sm text-slate-600">
            Guided by RHELO (AI Assistant)
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={saveDraft}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
          >
            <Save size={16} />
            Save Draft
          </button>

          <button
            onClick={handleReview}
            disabled={progress.missingRequired > 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:bg-slate-200 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            <Eye size={16} />
            Review
          </button>

          <button
            onClick={handleSubmit}
            disabled={progress.missingRequired > 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            <Send size={16} />
            Submit
          </button>

          <button
            onClick={onExit}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Exit to home"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
        <div className="flex-1 lg:w-1/2 overflow-hidden flex flex-col border-r border-slate-200">
          <div className="h-auto border-b border-slate-200">
            <Avatar
              status={avatarStatus}
              voiceEnabled={voiceEnabled}
              isListening={isListening}
              isPaused={isPaused}
              onToggleVoice={handleToggleVoice}
              onToggleMic={handleToggleMic}
              onPauseResume={handlePauseResume}
              onRepeat={handleRepeat}
              onRephrase={handleRephrase}
              onSkip={handleSkip}
              sttSupported={stt}
              ttsSupported={tts}
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
          </div>

          <div className="flex-1 relative overflow-hidden">
            {!avatarModeStarted ? (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-50 p-4 mt-0 pt-0">
                <div className="max-w-sm text-center">
                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
                    <div className="mb-2">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg width="32" height="32" viewBox="0 0 40 40" className="text-white">
                          <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.2" />
                          <circle cx="14" cy="16" r="2" fill="currentColor" />
                          <circle cx="26" cy="16" r="2" fill="currentColor" />
                          <path d="M 12 24 Q 20 28 28 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">AI-Guided Form Completion</h3>
                    <p className="text-slate-600 mb-1 leading-relaxed text-sm">
                      Let our AI assistant guide you through the form with voice and text.
                    </p>
                    <button
                      onClick={startAvatarMode}
                      className="w-full px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Start AI Assistant
                    </button>
                    <p className="text-xs text-slate-500 mt-2">
                      Or fill out the form manually
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Chat
                messages={chatMessages}
                onQuickReply={handleQuickReply}
                onSendMessage={handleUserInput}
                onSkip={handleSkip}
              />
            )}

            {interimTranscript && (
              <div className="absolute bottom-20 left-2 right-4 bg-blue-50 border border-blue-300 rounded-lg p-2 shadow-lg relative">
                <button
                  type="button"
                  onClick={handleCloseListeningPopup}
                  className="absolute right-2 top-2 text-blue-500 hover:text-blue-700 transition-colors"
                  aria-label="Close listening popup"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-xs text-blue-600 font-medium mb-1">Listening...</p>
                <p className="text-sm text-blue-900 italic">"{interimTranscript}"</p>
              </div>
            )}

            {pendingTranscript && (
              <div className="absolute bottom-4 left-4 right-4 bg-white border-2 border-blue-500 rounded-lg p-4 shadow-xl">
                <p className="text-xs text-slate-600 font-medium mb-2">I heard:</p>
                <input
                  type="text"
                  value={pendingTranscript}
                  onChange={(e) => handleEditTranscript(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {transcriptAlternatives.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-600 mb-1">Did you mean:</p>
                    <div className="flex flex-wrap gap-1">
                      {transcriptAlternatives.map((alt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectAlternative(alt)}
                          className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                        >
                          {alt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmTranscript}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={handleRetryVoice}
                    className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all text-sm font-medium"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 lg:w-1/2 overflow-hidden">
          <LiveForm
            template={template}
            data={data}
            progress={progress.percent}
            missingRequired={progress.missingRequired}
            currentFieldId={currentFieldId}
            onChange={handleFieldChange}
            onFieldClick={handleFieldClick}
            validationErrors={validationErrors}
          />
        </div>
      </div>
    </div>
  );
}
