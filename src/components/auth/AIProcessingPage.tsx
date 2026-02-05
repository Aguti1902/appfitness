import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Dumbbell, Utensils, Calendar, CheckCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

const PROCESSING_STEPS = [
  { id: 1, icon: Brain, label: 'Analizando tu perfil', sublabel: 'Procesando tus datos personales...' },
  { id: 2, icon: Dumbbell, label: 'Creando tu rutina de entrenamiento', sublabel: 'Diseñando ejercicios personalizados...' },
  { id: 3, icon: Utensils, label: 'Generando tu plan de alimentación', sublabel: 'Calculando macros y comidas...' },
  { id: 4, icon: Calendar, label: 'Organizando tu calendario', sublabel: 'Programando tus entrenamientos...' },
  { id: 5, icon: CheckCircle, label: '¡Todo listo!', sublabel: 'Tu plan personalizado está preparado' },
];

export function AIProcessingPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    // Simular el procesamiento de la IA
    const processSteps = async () => {
      for (let i = 0; i < PROCESSING_STEPS.length; i++) {
        setCurrentStep(i);
        
        // Tiempo variable por paso para que parezca más real
        const delay = i === PROCESSING_STEPS.length - 1 ? 1500 : 2000 + Math.random() * 1500;
        
        await new Promise(resolve => setTimeout(resolve, delay));
        setCompletedSteps(prev => [...prev, i]);
      }
      
      // Antes de redirigir, asegurar que el store está actualizado
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          // Actualizar el store con los datos más recientes
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: profile?.name || session.user.user_metadata?.name || session.user.email!.split('@')[0],
            avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
            goals: profile?.goals || { primary: 'maintain', activity_level: 'moderate' },
            training_types: profile?.training_types || [],
            profile_data: profile?.profile_data,
            created_at: session.user.created_at
          });
          
          console.log('User data refreshed before redirect');
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
      
      // Esperar un momento antes de redirigir
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    };

    processSteps();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Preparando tu experiencia
          </h1>
          <p className="text-primary-100">
            Nuestra IA está creando tu plan personalizado
          </p>
        </div>

        {/* Steps */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 space-y-4">
          {PROCESSING_STEPS.map((step, index) => {
            const isActive = currentStep === index;
            const isCompleted = completedSteps.includes(index);
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                  isActive 
                    ? 'bg-white/20 scale-[1.02]' 
                    : isCompleted 
                      ? 'bg-white/10' 
                      : 'opacity-40'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-green-500' 
                    : isActive 
                      ? 'bg-white/30' 
                      : 'bg-white/10'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <Icon className={`w-6 h-6 text-white ${isActive ? 'animate-pulse' : ''}`} />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${isCompleted || isActive ? 'text-white' : 'text-white/60'}`}>
                    {step.label}
                  </p>
                  <p className={`text-sm ${isCompleted || isActive ? 'text-primary-100' : 'text-white/40'}`}>
                    {isCompleted ? '✓ Completado' : step.sublabel}
                  </p>
                </div>
                {isActive && !isCompleted && (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-8">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${((completedSteps.length) / PROCESSING_STEPS.length) * 100}%` }}
            />
          </div>
          <p className="text-center text-primary-100 text-sm mt-3">
            {Math.round((completedSteps.length / PROCESSING_STEPS.length) * 100)}% completado
          </p>
        </div>

        {/* Fun fact */}
        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            💡 Sabías que con un plan personalizado puedes alcanzar tus objetivos hasta 3x más rápido
          </p>
        </div>
      </div>
    </div>
  );
}
