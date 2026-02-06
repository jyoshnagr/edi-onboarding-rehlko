import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface InterviewAssistantProps {
  intakeId: string;
  missingFieldsCount: number;
  onFieldsUpdated: () => void;
}

export default function InterviewAssistant({ intakeId, missingFieldsCount, onFieldsUpdated }: InterviewAssistantProps) {
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const startInterview = async () => {
    setHasStarted(true);
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-ai-interview`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intakeId,
          sessionId,
          userMessage: 'Start interview to fill missing information',
          conversationHistory: []
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(data.result.messages);
      } else {
        setError(data.error || 'Failed to start interview');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error starting interview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newUserMessage: Message = {
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-ai-interview`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intakeId,
          sessionId,
          userMessage: userInput,
          conversationHistory: messages
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(data.result.messages);
        if (data.result.updated_fields && Object.keys(data.result.updated_fields).length > 0) {
          onFieldsUpdated();
        }
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!hasStarted) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Meet JEDI - Your AI Interview Assistant
          </h3>
          <p className="text-gray-700 mb-6">
            I'm JEDI, your energetic AI assistant! I'll help you complete your intake by asking smart questions
            and guiding you through any gaps. Let's work together to gather all the information we need!
          </p>

          <div className="bg-white rounded-lg p-4 mb-6 inline-flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-700">
              <strong className="text-orange-600">{missingFieldsCount}</strong> missing fields detected
            </span>
          </div>

          <button
            onClick={startInterview}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting Interview...
              </>
            ) : (
              <>
                <MessageCircle className="w-5 h-5" />
                Start Interview
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ height: '500px' }}>
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">JEDI - Your AI Assistant</h3>
              <p className="text-sm text-gray-600">Energetically helping you complete your intake!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">Active Session</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900 border border-gray-200'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your response..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !userInput.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
