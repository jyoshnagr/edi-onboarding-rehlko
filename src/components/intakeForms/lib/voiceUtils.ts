export class VoiceManager {
  private synthesis: SpeechSynthesis | null = null;
  private recognition: any = null;
  private isListening = false;
  private isPaused = false;
  private pausedTranscript = '';
  private onResultCallback: ((transcript: string, confidence?: number, isFinal?: boolean, alternatives?: string[]) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private currentLanguage: string = 'en-US';

  constructor() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;
      this.recognition.lang = this.currentLanguage;
    }
  }

  setLanguage(language: string): void {
    this.currentLanguage = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  getLanguage(): string {
    return this.currentLanguage;
  }

  speak(text: string, onEnd?: () => void): void {
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported');
      if (onEnd) onEnd();
      return;
    }

    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.25;
    utterance.pitch = 0.95;
    utterance.volume = 1;

    const voices = this.synthesis.getVoices();

    const isItalian = this.currentLanguage.startsWith('it');

    if (isItalian) {
      // Italian voice selection
      const professionalItalianMaleVoices = [
        'Google italiano',
        'Microsoft Cosimo',
        'Diego',
        'Luca',
        'Paolo'
      ];

      let selectedVoice = voices.find(voice => {
        const isItalianLang = voice.lang.startsWith('it');
        const isMale = voice.name.toLowerCase().includes('male') ||
                       professionalItalianMaleVoices.some(pv => voice.name.includes(pv));
        const notPremium = !voice.name.includes('Premium') && !voice.name.includes('Enhanced');
        const notRobotic = !voice.name.includes('eSpeak') && !voice.name.includes('Compact');

        return isItalianLang && isMale && notPremium && notRobotic;
      });

      if (!selectedVoice) {
        selectedVoice = voices.find(voice => {
          const isItalianLang = voice.lang.startsWith('it');
          const notRobotic = !voice.name.includes('eSpeak') && !voice.name.includes('Compact');
          return isItalianLang && notRobotic;
        });
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      // English voice selection
      const professionalMaleVoices = [
        'Google UK English Male',
        'Google US English Male',
        'Microsoft David',
        'Microsoft Mark',
        'Daniel',
        'Alex',
        'Fred',
        'Oliver',
        'Thomas',
        'Google Australian English Male',
        'Google Indian English Male',
        'James',
        'Ryan'
      ];

      let selectedVoice = voices.find(voice => {
        const isEnglish = voice.lang.startsWith('en');
        const isMale = voice.name.toLowerCase().includes('male') ||
                       professionalMaleVoices.some(pv => voice.name.includes(pv));
        const notPremium = !voice.name.includes('Premium') && !voice.name.includes('Enhanced');
        const notRobotic = !voice.name.includes('eSpeak') && !voice.name.includes('Compact');

        return isEnglish && isMale && notPremium && notRobotic &&
               professionalMaleVoices.some(pv => voice.name.includes(pv));
      });

      if (!selectedVoice) {
        selectedVoice = voices.find(voice => {
          const isEnglish = voice.lang.startsWith('en');
          const isMale = voice.name.toLowerCase().includes('male');
          const notRobotic = !voice.name.includes('eSpeak') && !voice.name.includes('Compact');
          return isEnglish && isMale && notRobotic;
        });
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    this.synthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  startListening(
    onResult: (transcript: string, confidence?: number, isFinal?: boolean, alternatives?: string[]) => void,
    onError?: (error: string) => void
  ): void {
    if (!this.recognition) {
      console.warn('Speech recognition not supported');
      if (onError) onError('Speech recognition not supported in this browser');
      return;
    }

    if (this.isListening) {
      return;
    }

    // Store callbacks for resume functionality
    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;

    this.recognition.onresult = (event: any) => {
      const lastResultIndex = event.results.length - 1;
      const result = event.results[lastResultIndex];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence || 0.9;
      const isFinal = result.isFinal;

      // Collect alternative transcriptions
      const alternatives: string[] = [];
      for (let i = 1; i < Math.min(result.length, 3); i++) {
        alternatives.push(result[i].transcript);
      }

      if (isFinal) {
        this.recognition.stop();
        this.isListening = false;
        this.isPaused = false;
      }

      onResult(transcript, confidence, isFinal, alternatives);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (onError) onError(event.error);
      this.isListening = false;
      this.isPaused = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.isPaused) {
        // Don't reset paused state when recognition ends due to pause
        return;
      }
      this.isPaused = false;
    };

    try {
      this.recognition.start();
      this.isListening = true;
      this.isPaused = false;
    } catch (error) {
      console.error('Error starting recognition:', error);
      if (onError) onError('Failed to start listening');
      this.isListening = false;
      this.isPaused = false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.isPaused = false;
      this.onResultCallback = null;
      this.onErrorCallback = null;
    }
  }

  pauseListening(): void {
    if (this.recognition && this.isListening && !this.isPaused) {
      this.recognition.stop();
      this.isListening = false;
      this.isPaused = true;
    }
  }

  resumeListening(): void {
    if (this.recognition && this.isPaused && this.onResultCallback) {
      this.isPaused = false;
      this.startListening(this.onResultCallback, this.onErrorCallback || undefined);
    }
  }

  get listening(): boolean {
    return this.isListening;
  }

  get paused(): boolean {
    return this.isPaused;
  }

  get supported(): { tts: boolean; stt: boolean } {
    return {
      tts: this.synthesis !== null,
      stt: this.recognition !== null,
    };
  }
}
