import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles,
  Dumbbell,
  Utensils,
  Lightbulb
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { chatWithAI, generateWorkoutRecommendation } from '../../lib/openai';
import type { ChatMessage, AIRecommendation } from '../../types';

const QUICK_PROMPTS = [
  { icon: Dumbbell, label: '¿Qué entreno hoy?', prompt: '¿Qué entrenamiento me recomiendas hacer hoy?' },
  { icon: Utensils, label: 'Ideas para comer', prompt: '¿Qué puedo comer hoy que sea saludable y rápido?' },
  { icon: Lightbulb, label: 'Consejos', prompt: 'Dame consejos para mejorar mis resultados' },
];

export function AICoachPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '¡Hola! 👋 Soy FitBot, tu asistente de fitness personal. Estoy aquí para ayudarte con:\n\n• Recomendaciones de entrenamiento\n• Consejos de nutrición\n• Recetas saludables\n• Motivación y tips\n\n¿En qué puedo ayudarte hoy?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !user) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const response = await chatWithAI(content, {
      goals: user.goals,
      trainingTypes: user.training_types
    });

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const generateQuickWorkout = async () => {
    if (!user) return;
    setIsLoading(true);
    
    const rec = await generateWorkoutRecommendation(
      user.goals,
      user.training_types,
      []
    );
    
    setRecommendation(rec);
    setIsLoading(false);
  };

  return (
    <div className="page-content h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">FitBot AI Coach</h1>
            <p className="text-sm text-gray-500">Tu asistente personal de fitness</p>
          </div>
        </div>
        <button
          onClick={generateQuickWorkout}
          disabled={isLoading}
          className="btn btn-outline"
        >
          <Sparkles className="w-5 h-5" />
          Generar entreno
        </button>
      </div>

      {/* Quick Recommendation */}
      {recommendation && (
        <div className="card mb-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">{recommendation.title}</h3>
            <button
              onClick={() => setRecommendation(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="prose prose-sm text-gray-600 whitespace-pre-wrap">
            {recommendation.content}
          </div>
          {recommendation.reasoning && (
            <p className="text-sm text-purple-600 mt-3 pt-3 border-t border-purple-200">
              💡 {recommendation.reasoning}
            </p>
          )}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-5 h-5 text-purple-500" />
                  <span className="font-medium text-purple-600">FitBot</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>
              <p className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-primary-200' : 'text-gray-400'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-md">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-500" />
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleQuickPrompt(prompt.prompt)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 whitespace-nowrap transition-colors"
          >
            <prompt.icon className="w-4 h-4" />
            {prompt.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder="Escribe tu mensaje..."
          disabled={isLoading}
          className="input flex-1"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          className="btn btn-primary px-4"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
