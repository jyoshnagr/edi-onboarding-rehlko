import { useEffect, useRef, useState } from 'react';
import { Bot, User, Send, SkipForward } from 'lucide-react';
import { ChatMessage } from '../../types';

interface ChatProps {
  messages: ChatMessage[];
  onQuickReply: (reply: string) => void;
  onSendMessage?: (message: string) => void;
  onSkip?: () => void;
}

export function Chat({ messages, onQuickReply, onSendMessage, onSkip }: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages?.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                ${message.type === 'avatar'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-slate-100 text-slate-600'
                }
              `}
            >
              {message.type === 'avatar' ? <Bot size={18} /> : <User size={18} />}
            </div>

            <div className={`flex-1 ${message.type === 'user' ? 'flex justify-end' : ''}`}>
              <div
                className={`
                  inline-block px-4 py-2 rounded-lg max-w-[85%]
                  ${message.type === 'avatar'
                    ? 'bg-slate-100 text-slate-900'
                    : 'bg-blue-600 text-white'
                  }
                `}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                {message.confidence !== undefined && message.confidence < 0.7 && (
                  <p className="text-xs mt-2 opacity-70">
                    I'm not sure I captured that correctly. Please confirm.
                  </p>
                )}
              </div>

              {message.quickReplies && message.quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {message.quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => onQuickReply(reply)}
                      className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-full hover:bg-slate-50 transition-colors text-slate-700 font-medium"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {onSendMessage && (
        <div className="border-t border-slate-200 p-4 bg-white flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your answer or use voice..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            {onSkip && (
              <button
                onClick={onSkip}
                className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all flex items-center gap-1.5"
                title="Skip this question"
              >
                <SkipForward size={18} />
                <span className="text-sm font-medium hidden sm:inline">Skip</span>
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
