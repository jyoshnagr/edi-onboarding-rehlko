export const translations = {
  'en-US': {
    welcome: (name: string, prepopulatedFields: string[]) =>
      `Welcome! I'm RHELO, your virtual assistant. I've already filled in some information from your profile. Here's what I have:\n${prepopulatedFields.join('\n')}\n\nPlease confirm if these details are correct, or let me know if you'd like to update anything.`,
    welcomeNoPrepopulated: (templateName: string) =>
      `Let's complete your ${templateName} form. I'll guide you through each field. You can answer with voice or text, and edit any field at any time.`,
    allComplete: 'Great! All required fields are complete. You can review and submit your form now.',
    gotIt: 'Got it, thank you!',
    looksGood: 'Looks good',
    needToUpdate: 'Need to update something',
    looksGoodResponse: `Perfect! Now let's fill in the remaining fields. I'll guide you through each one.`,
    needToUpdateResponse: `No problem! You can update any field on the right side. Once you're ready, I'll help with the remaining fields.`,
    skipForNow: 'Skip for now',
    skipResponse: 'No problem, we can come back to this later.',
    didntCatch: "I didn't catch that. Could you try again?",
    validationError: (count: number) =>
      `I found ${count} issue${count !== 1 ? 's' : ''} that need to be fixed before submitting. Please review the highlighted fields.`,
    submitError: 'There was an error submitting your form. Please try again.',
    helpWith: (label: string, prompt: string) => `Let me help you with ${label}. ${prompt}`,
    languageChanged: 'Great! I will now speak in English.',
  },
  'it-IT': {
    welcome: (name: string, prepopulatedFields: string[]) =>
      `Benvenuto! Sono RHELO, il tuo assistente virtuale. Ho già compilato alcune informazioni dal tuo profilo. Ecco cosa ho:\n${prepopulatedFields.join('\n')}\n\nPer favore conferma se questi dettagli sono corretti, o fammi sapere se vuoi aggiornare qualcosa.`,
    welcomeNoPrepopulated: (templateName: string) =>
      `Completiamo il tuo modulo ${templateName}. Ti guiderò attraverso ogni campo. Puoi rispondere con voce o testo, e modificare qualsiasi campo in qualsiasi momento.`,
    allComplete: 'Ottimo! Tutti i campi obbligatori sono completi. Ora puoi rivedere e inviare il tuo modulo.',
    gotIt: 'Capito, grazie!',
    looksGood: 'Va bene',
    needToUpdate: 'Devo aggiornare qualcosa',
    looksGoodResponse: `Perfetto! Ora compiliamo i campi rimanenti. Ti guiderò attraverso ognuno.`,
    needToUpdateResponse: `Nessun problema! Puoi aggiornare qualsiasi campo sul lato destro. Quando sei pronto, ti aiuterò con i campi rimanenti.`,
    skipForNow: 'Salta per ora',
    skipResponse: 'Nessun problema, possiamo tornarci più tardi.',
    didntCatch: "Non ho capito. Potresti riprovare?",
    validationError: (count: number) =>
      `Ho trovato ${count} problema${count !== 1 ? 'i' : ''} da correggere prima dell'invio. Rivedi i campi evidenziati.`,
    submitError: 'Si è verificato un errore durante l\'invio del modulo. Riprova.',
    helpWith: (label: string, prompt: string) => `Lascia che ti aiuti con ${label}. ${prompt}`,
    languageChanged: 'Perfetto! Ora parlerò in italiano.',
  },
};

export type Language = keyof typeof translations;

export function translate(
  language: Language,
  key: keyof typeof translations['en-US'],
  ...args: any[]
): string {
  const langTranslations = translations[language] || translations['en-US'];
  const translation = langTranslations[key];

  if (typeof translation === 'function') {
    return translation(...args);
  }

  return translation as string;
}

export function translateFieldPrompt(prompt: string, language: Language): string {
  if (language === 'en-US') {
    return prompt;
  }

  // Italian translations for common field prompts
  const italianTranslations: Record<string, string> = {
    'What is your full name?': 'Qual è il tuo nome completo?',
    'What is your company name?': 'Qual è il nome della tua azienda?',
    'What is your email address?': 'Qual è il tuo indirizzo email?',
    'What is your phone number?': 'Qual è il tuo numero di telefono?',
    'What is your address?': 'Qual è il tuo indirizzo?',
    'What is your city?': 'Qual è la tua città?',
    'What is your state?': 'Qual è il tuo stato?',
    'What is your zip code?': 'Qual è il tuo codice postale?',
    'What is your job title?': 'Qual è il tuo titolo di lavoro?',
    'What is your date of birth?': 'Qual è la tua data di nascita?',
    'What is your country?': 'Qual è il tuo paese?',
  };

  // Try exact match first
  if (italianTranslations[prompt]) {
    return italianTranslations[prompt];
  }

  // Try partial matches for dynamic prompts
  for (const [english, italian] of Object.entries(italianTranslations)) {
    if (prompt.includes(english)) {
      return prompt.replace(english, italian);
    }
  }

  // Basic word replacements for any remaining prompts
  return prompt
    .replace(/What is your/gi, 'Qual è il tuo')
    .replace(/What is the/gi, 'Qual è il')
    .replace(/Please provide/gi, 'Per favore fornisci')
    .replace(/Please enter/gi, 'Per favore inserisci')
    .replace(/Could you provide/gi, 'Potresti fornire')
    .replace(/What should I put for/gi, 'Cosa devo inserire per')
    .replace(/Please tell me your/gi, 'Per favore dimmi il tuo');
}
