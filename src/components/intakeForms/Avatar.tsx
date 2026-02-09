import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic, MicOff, RotateCcw, MessageSquare, SkipForward, Pause, Play } from 'lucide-react';
import { AvatarStatus } from '../../types';

interface AvatarProps {
  status: AvatarStatus;
  voiceEnabled: boolean;
  isListening: boolean;
  isPaused: boolean;
  onToggleVoice: () => void;
  onToggleMic: () => void;
  onPauseResume: () => void;
  onRepeat: () => void;
  onRephrase: () => void;
  onSkip: () => void;
  sttSupported: boolean;
  ttsSupported: boolean;
}

export function Avatar({
  status,
  voiceEnabled,
  isListening,
  isPaused,
  onToggleVoice,
  onToggleMic,
  onPauseResume,
  onRepeat,
  onRephrase,
  onSkip,
  sttSupported,
  ttsSupported,
}: AvatarProps) {
  const [showBlink, setShowBlink] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setShowBlink(true);
      setTimeout(() => setShowBlink(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-slate-50 p-2 overflow-y-auto">
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.02) translateY(-2px); }
        }
        @keyframes subtleTilt {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-1deg); }
          75% { transform: rotate(1deg); }
        }
        @keyframes mouthMove {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        @keyframes waveform {
          0%, 100% { height: 8px; }
          50% { height: 20px; }
        }
        @keyframes waveform2 {
          0%, 100% { height: 12px; }
          50% { height: 24px; }
        }
        @keyframes waveform3 {
          0%, 100% { height: 6px; }
          50% { height: 16px; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        .avatar-breathe {
          animation: breathe 4s ease-in-out infinite;
        }
        .avatar-tilt {
          animation: subtleTilt 6s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-col items-center justify-center mb-3">
        <div className="relative">
          <div className={`relative w-24 h-24 lg:w-32 lg:h-32 ${status === 'idle' ? 'avatar-breathe avatar-tilt' : ''}`}>
            {status === 'speaking' && (
              <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 blur-xl"
                   style={{ animation: 'glowPulse 1s ease-in-out infinite' }} />
            )}
            {status === 'listening' && (
              <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 blur-xl"
                   style={{ animation: 'glowPulse 1.5s ease-in-out infinite' }} />
            )}

            <div
              className={`absolute inset-0 rounded-full transition-all duration-500 ${
                status === 'speaking'
                  ? 'ring-4 ring-green-400 ring-offset-4 ring-offset-blue-50 shadow-lg shadow-green-400/50'
                  : status === 'listening'
                  ? 'ring-4 ring-blue-400 ring-offset-4 ring-offset-blue-50 shadow-lg shadow-blue-400/50'
                  : status === 'thinking'
                  ? 'ring-4 ring-amber-400 ring-offset-4 ring-offset-blue-50 shadow-lg shadow-amber-400/50'
                  : status === 'paused'
                  ? 'ring-4 ring-orange-400 ring-offset-4 ring-offset-blue-50 shadow-lg shadow-orange-400/50'
                  : 'ring-2 ring-slate-300 ring-offset-4 ring-offset-blue-50 shadow-xl'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden shadow-2xl bg-gradient-to-br from-slate-100 to-slate-200 relative">
                {status === 'speaking' ? (
                  <video
                    src="/rhelo-speaking.mp4"
                    muted
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-cover transition-all duration-300 scale-110"
                     style={{
                      filter: 'brightness(1.22)',
                    }}
                  />
                ) : (
                  <img
                    src="/rhelo-avatar.jpg"
                    alt="Professional Avatar"
                    className="w-full h-full object-cover"
                      style={{
                      filter: 'brightness(1.22)',
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 pointer-events-none" />
              </div>

              {status === 'speaking' && (
                <>
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2">
                    <div className="flex gap-1 items-end">
                      <div className="w-1 bg-gradient-to-t from-green-600 to-green-400 rounded-full"
                           style={{ animation: 'waveform 0.6s ease-in-out infinite' }} />
                      <div className="w-1 bg-gradient-to-t from-green-600 to-green-400 rounded-full"
                           style={{ animation: 'waveform2 0.6s ease-in-out 0.1s infinite' }} />
                      <div className="w-1 bg-gradient-to-t from-green-600 to-green-400 rounded-full"
                           style={{ animation: 'waveform3 0.6s ease-in-out 0.2s infinite' }} />
                      <div className="w-1 bg-gradient-to-t from-green-600 to-green-400 rounded-full"
                           style={{ animation: 'waveform 0.6s ease-in-out 0.3s infinite' }} />
                    </div>
                  </div>
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2">
                    <div className="flex gap-1 items-end">
                      <div className="w-1 bg-gradient-to-t from-green-600 to-green-400 rounded-full"
                           style={{ animation: 'waveform 0.6s ease-in-out 0.3s infinite' }} />
                      <div className="w-1 bg-gradient-to-t from-green-600 to-green-400 rounded-full"
                           style={{ animation: 'waveform3 0.6s ease-in-out 0.2s infinite' }} />
                      <div className="w-1 bg-gradient-to-t from-green-600 to-green-400 rounded-full"
                           style={{ animation: 'waveform2 0.6s ease-in-out 0.1s infinite' }} />
                      <div className="w-1 bg-gradient-to-t from-green-600 to-green-400 rounded-full"
                           style={{ animation: 'waveform 0.6s ease-in-out infinite' }} />
                    </div>
                  </div>
                </>
              )}

              {status === 'listening' && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-20" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="relative">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg shadow-blue-500/50" />
                      <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-40" />
                    </div>
                  </div>
                </>
              )}

              {status === 'thinking' && (
                <>
                  <div className="absolute -top-2 -right-2 flex gap-1">
                    <div className="w-2 h-2 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50"
                         style={{ animation: 'bounce 1.5s ease-in-out infinite' }} />
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50"
                         style={{ animation: 'bounce 1.5s ease-in-out 0.3s infinite' }} />
                    <div className="w-3 h-3 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50"
                         style={{ animation: 'bounce 1.5s ease-in-out 0.6s infinite' }} />
                  </div>
                </>
              )}

              {status === 'paused' && (
                <>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex gap-1 bg-orange-600 rounded-lg p-1 shadow-lg shadow-orange-500/50">
                      <div className="w-1.5 h-4 bg-white rounded-sm" />
                      <div className="w-1.5 h-4 bg-white rounded-sm" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 text-center">
          <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">RHELO</div>
          <div className="text-xs text-slate-600 mb-2 font-medium">Professional AI Assistant</div>
          <div className={`px-4 py-1.5 rounded-full shadow-md text-xs font-semibold border-2 inline-block ${
            status === 'speaking'
              ? 'bg-green-500 text-white border-green-600'
              : status === 'listening'
              ? 'bg-blue-500 text-white border-blue-600'
              : status === 'thinking'
              ? 'bg-amber-500 text-white border-amber-600'
              : status === 'paused'
              ? 'bg-orange-500 text-white border-orange-600'
              : 'bg-white text-slate-700 border-slate-200'
          }`}>
            {status === 'speaking' && 'Speaking...'}
            {status === 'listening' && 'Listening...'}
            {status === 'thinking' && 'Thinking...'}
            {status === 'paused' && 'Paused'}
            {status === 'idle' && 'Ready to help!'}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-1.5 justify-center flex-wrap">
          {ttsSupported && (
            <button
              onClick={onToggleVoice}
              className={`
                flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all text-xs
                ${voiceEnabled
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }
              `}
              title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>Voice</span>
            </button>
          )}

          {sttSupported && isListening && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium animate-pulse">
              <Mic size={14} />
              <span>Listening</span>
            </div>
          )}

          {sttSupported && isPaused && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-medium">
              <Pause size={14} />
              <span>Paused</span>
            </div>
          )}

          {sttSupported && (isListening || isPaused) && (
            <button
              onClick={onPauseResume}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all text-xs font-medium"
              title={isPaused ? 'Resume listening' : 'Pause listening'}
            >
              {isPaused ? (
                <>
                  <Play size={14} />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause size={14} />
                  <span>Pause</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex gap-1.5 justify-center flex-wrap">
          <button
            onClick={onRepeat}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all text-xs font-medium"
            title="Repeat last message"
          >
            <RotateCcw size={14} />
            <span>Repeat</span>
          </button>

          <button
            onClick={onRephrase}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all text-xs font-medium"
            title="Rephrase question"
          >
            <MessageSquare size={14} />
            <span>Rephrase</span>
          </button>

          <button
            onClick={onSkip}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all text-xs font-medium"
            title="Skip for now"
          >
            <SkipForward size={14} />
            <span>Skip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
