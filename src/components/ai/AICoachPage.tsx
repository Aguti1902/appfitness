import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles,
  Dumbbell,
  Utensils,
  Lightbulb,
  RefreshCw,
  ArrowLeftRight,
  Calendar
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { chatWithAI, generateWorkoutRecommendation } from '../../lib/openai';
import type { ChatMessage, AIRecommendation, GeneratedPlan } from '../../types';

const QUICK_PROMPTS = [
  { icon: Dumbbell, label: '¿Qué entreno hoy?', prompt: '¿Qué entrenamiento me recomiendas hacer hoy?' },
  { icon: Utensils, label: 'Ideas para comer', prompt: '¿Qué puedo comer hoy que sea saludable y rápido?' },
  { icon: Lightbulb, label: 'Consejos', prompt: 'Dame consejos para mejorar mis resultados' },
  { icon: ArrowLeftRight, label: 'Cambiar días', prompt: 'Quiero intercambiar el entrenamiento de dos días' },
];

const ROUTINE_ACTIONS = [
  { id: 'swap', label: 'Intercambiar días', icon: ArrowLeftRight, description: 'Cambia el entreno de un día por otro' },
  { id: 'change', label: 'Cambiar ejercicio', icon: RefreshCw, description: 'Sustituye un ejercicio por otro' },
  { id: 'view', label: 'Ver rutina', icon: Calendar, description: 'Muestra tu rutina completa' },
];

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function AICoachPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '¡Hola! 👋 Soy FitBot, tu asistente de fitness personal. Puedo ayudarte a:\n\n• Modificar tu rutina de gimnasio\n• Intercambiar días de entrenamiento\n• Cambiar ejercicios\n• Darte consejos de nutrición\n\n¿Qué necesitas?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapDay1, setSwapDay1] = useState<number | null>(null);
  const [swapDay2, setSwapDay2] = useState<number | null>(null);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar plan
    const savedPlan = localStorage.getItem('fitapp-generated-plan');
    if (savedPlan) {
      try {
        setPlan(JSON.parse(savedPlan));
      } catch (e) {
        console.error('Error loading plan:', e);
      }
    }
  }, []);

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

    // Detectar comandos especiales
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('intercambiar') || lowerContent.includes('cambiar día') || lowerContent.includes('swap')) {
      setShowSwapModal(true);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: '¡Claro! Selecciona los dos días que quieres intercambiar usando el panel de abajo. 👇',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
      return;
    }

    if (lowerContent.includes('ver rutina') || lowerContent.includes('mi rutina') || lowerContent.includes('mostrar rutina')) {
      const routineMessage = getRoutineSummary();
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: routineMessage,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
      return;
    }

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

  const getRoutineSummary = (): string => {
    if (!plan?.workout_plan?.days) {
      return 'No tienes una rutina generada aún. Completa el onboarding o regenera tu plan desde Ajustes.';
    }

    let summary = '📋 **Tu rutina semanal de gimnasio:**\n\n';
    plan.workout_plan.days.forEach((day, index) => {
      const emoji = day.is_rest_day ? '😴' : '💪';
      summary += `${emoji} **${DAY_NAMES[index]}**: ${day.title}\n`;
      if (!day.is_rest_day && day.exercises) {
        summary += `   └ ${day.exercises.slice(0, 3).map(e => e.name).join(', ')}...\n`;
      }
    });
    summary += '\n¿Quieres intercambiar algún día o cambiar algún ejercicio?';
    return summary;
  };

  const handleSwapDays = () => {
    if (swapDay1 === null || swapDay2 === null || !plan?.workout_plan?.days) return;
    
    // Crear copia del plan
    const newPlan = JSON.parse(JSON.stringify(plan)) as GeneratedPlan;
    const days = newPlan.workout_plan!.days!;
    
    // Intercambiar días (mantener day y day_name, intercambiar el resto)
    const day1Data = { ...days[swapDay1] };
    const day2Data = { ...days[swapDay2] };
    
    // Intercambiar contenido pero mantener índice y nombre del día
    days[swapDay1] = {
      ...day2Data,
      day: swapDay1,
      day_name: DAY_NAMES[swapDay1]
    };
    days[swapDay2] = {
      ...day1Data,
      day: swapDay2,
      day_name: DAY_NAMES[swapDay2]
    };
    
    // Guardar
    localStorage.setItem('fitapp-generated-plan', JSON.stringify(newPlan));
    setPlan(newPlan);
    
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: `✅ ¡Hecho! He intercambiado:\n\n• **${DAY_NAMES[swapDay1]}**: Ahora es ${day2Data.title}\n• **${DAY_NAMES[swapDay2]}**: Ahora es ${day1Data.title}\n\nLos cambios se han guardado. ¿Necesitas algo más?`,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, assistantMessage]);
    
    setShowSwapModal(false);
    setSwapDay1(null);
    setSwapDay2(null);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleRoutineAction = (actionId: string) => {
    if (actionId === 'swap') {
      setShowSwapModal(true);
    } else if (actionId === 'view') {
      const routineMessage = getRoutineSummary();
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: routineMessage,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } else if (actionId === 'change') {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: 'Dime qué ejercicio quieres cambiar y por cuál. Por ejemplo: "Quiero cambiar press banca por press con mancuernas"',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
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
            <p className="text-sm text-gray-500">Modifica tu rutina de gimnasio</p>
          </div>
        </div>
        <button
          onClick={generateQuickWorkout}
          disabled={isLoading}
          className="btn btn-outline"
        >
          <Sparkles className="w-5 h-5" />
          Sugerir entreno
        </button>
      </div>

      {/* Routine Actions */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {ROUTINE_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => handleRoutineAction(action.id)}
            className="p-3 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
          >
            <action.icon className="w-5 h-5 mx-auto mb-1 text-primary-600" />
            <p className="text-xs font-medium text-gray-900">{action.label}</p>
          </button>
        ))}
      </div>

      {/* Swap Modal */}
      {showSwapModal && (
        <div className="card mb-4 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-purple-600" />
              Intercambiar días
            </h3>
            <button
              onClick={() => {
                setShowSwapModal(false);
                setSwapDay1(null);
                setSwapDay2(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">Selecciona los dos días que quieres intercambiar:</p>
          
          <div className="grid grid-cols-7 gap-2 mb-4">
            {DAY_NAMES.map((day, index) => {
              const dayData = plan?.workout_plan?.days?.[index];
              const isSelected = swapDay1 === index || swapDay2 === index;
              const isRestDay = dayData?.is_rest_day;
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (swapDay1 === index) {
                      setSwapDay1(null);
                    } else if (swapDay2 === index) {
                      setSwapDay2(null);
                    } else if (swapDay1 === null) {
                      setSwapDay1(index);
                    } else if (swapDay2 === null) {
                      setSwapDay2(index);
                    }
                  }}
                  className={`p-2 rounded-lg text-center transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white'
                      : isRestDay
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-purple-300'
                  }`}
                >
                  <p className="text-xs font-medium">{day.slice(0, 3)}</p>
                  <p className="text-[10px] truncate">{dayData?.title?.split(' ')[0] || '—'}</p>
                </button>
              );
            })}
          </div>
          
          {swapDay1 !== null && swapDay2 !== null && (
            <button
              onClick={handleSwapDays}
              className="w-full btn btn-primary"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Intercambiar {DAY_NAMES[swapDay1].slice(0, 3)} ↔ {DAY_NAMES[swapDay2].slice(0, 3)}
            </button>
          )}
          
          {(swapDay1 !== null || swapDay2 !== null) && !(swapDay1 !== null && swapDay2 !== null) && (
            <p className="text-xs text-purple-600 text-center">
              Selecciona otro día para intercambiar
            </p>
          )}
        </div>
      )}

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
              className={`max-w-[85%] p-4 rounded-2xl ${
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
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
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
          placeholder="Ej: Intercambia lunes y martes, cambia press banca..."
          disabled={isLoading}
          className="input flex-1 text-gray-900"
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
