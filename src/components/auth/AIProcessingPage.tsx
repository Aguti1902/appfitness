import { useEffect, useState, useRef } from 'react';
import { Brain, Dumbbell, Utensils, Calendar, CheckCircle, Sparkles, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { generateCompletePlan } from '../../lib/openai';
import type { GeneratedPlan, UserGoals, TrainingType, UserProfileData } from '../../types';

const PROCESSING_STEPS = [
  { id: 1, icon: Brain, label: 'Analizando tu perfil', sublabel: 'Procesando tus datos personales...' },
  { id: 2, icon: Dumbbell, label: 'Creando tu rutina de entrenamiento', sublabel: 'Diseñando ejercicios personalizados...' },
  { id: 3, icon: Utensils, label: 'Generando tu plan de alimentación', sublabel: 'Calculando macros y comidas...' },
  { id: 4, icon: ShoppingCart, label: 'Preparando tu lista de compra', sublabel: 'Organizando ingredientes...' },
  { id: 5, icon: Calendar, label: 'Organizando tu calendario', sublabel: 'Programando tus entrenamientos...' },
  { id: 6, icon: CheckCircle, label: '¡Todo listo!', sublabel: 'Tu plan personalizado está preparado' },
];

const FUN_FACTS = [
  '💪 El músculo quema más calorías en reposo que la grasa',
  '🏃 30 minutos de ejercicio mejoran tu humor durante 24 horas',
  '🥗 Comer proteína en cada comida ayuda a mantener la saciedad',
  '😴 El descanso es tan importante como el entrenamiento',
  '💧 Beber agua aumenta tu metabolismo hasta un 30%',
  '🧠 El ejercicio mejora la memoria y concentración',
];

export function AIProcessingPage() {
  const { setUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentFact, setCurrentFact] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    // Rotar facts cada 4 segundos
    const factInterval = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % FUN_FACTS.length);
    }, 4000);
    return () => clearInterval(factInterval);
  }, []);

  useEffect(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    const processAndGeneratePlan = async () => {
      console.log('=== AI PROCESSING START ===');
      
      try {
        // Paso 1: Analizar perfil - Obtener datos del usuario
        setCurrentStep(0);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.error('No session found');
          setError('Sesión no encontrada. Redirigiendo...');
          setTimeout(() => window.location.href = '/login', 2000);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        console.log('Profile loaded:', profile);
        
        const goals: UserGoals = profile?.goals || { primary: 'maintain', activity_level: 'moderate' };
        const trainingTypes: TrainingType[] = profile?.training_types || ['gym'];
        const profileData: UserProfileData | undefined = profile?.profile_data;
        
        setCompletedSteps(prev => [...prev, 0]);
        
        // Paso 2-5: Generar plan completo con IA
        setCurrentStep(1);
        console.log('Generating complete plan...');
        
        let generatedPlan: GeneratedPlan;
        
        try {
          // Generar el plan (esto puede tomar tiempo si usa OpenAI real)
          generatedPlan = await generateCompletePlan(goals, trainingTypes, profileData);
          console.log('Plan generated:', generatedPlan);
        } catch (genError) {
          console.error('Error generating plan:', genError);
          // Continuar con plan vacío si falla
          generatedPlan = {
            workout_plan: { name: 'Plan básico', description: '', days: [], rest_days: [], estimated_calories_burned_weekly: 0 },
            diet_plan: { name: 'Plan básico', description: '', daily_calories: 2000, macros: { protein_grams: 150, carbs_grams: 200, fat_grams: 70 }, days: [] },
            shopping_list: [],
            recommendations: ['Consulta con un profesional para un plan más detallado.'],
            generated_at: new Date().toISOString()
          };
        }
        
        // Animar los pasos de generación
        for (let i = 1; i < PROCESSING_STEPS.length - 1; i++) {
          setCurrentStep(i);
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
          setCompletedSteps(prev => [...prev, i]);
        }
        
        // Paso final: Guardar plan en Supabase
        setCurrentStep(PROCESSING_STEPS.length - 1);
        
        console.log('Saving plan to Supabase...');
        
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              generated_plan: generatedPlan,
              plan_generated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);
          
          if (updateError) {
            console.warn('Error saving plan:', updateError);
            // El plan se guardará en localStorage como fallback
          }
        } catch (saveError) {
          console.warn('Error saving plan to DB:', saveError);
        }
        
        // Guardar plan en localStorage como backup
        localStorage.setItem('fitapp-generated-plan', JSON.stringify(generatedPlan));
        
        setCompletedSteps(prev => [...prev, PROCESSING_STEPS.length - 1]);
        
        // Actualizar el store con todos los datos
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: profile?.name || session.user.user_metadata?.name || session.user.email!.split('@')[0],
          avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
          goals: goals,
          training_types: trainingTypes,
          profile_data: profileData,
          created_at: session.user.created_at
        });
        
        console.log('Processing complete, redirecting...');
        
        // Esperar un momento para mostrar completado
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Marcar que es un usuario nuevo para mostrar el tutorial
        localStorage.setItem('fitapp-show-welcome', 'true');
        
        // Redirigir al dashboard
        window.location.href = '/';
        
      } catch (err) {
        console.error('Processing error:', err);
        setError('Hubo un error. Redirigiendo al dashboard...');
        
        // Aún así redirigir después de unos segundos
        setTimeout(() => {
          localStorage.setItem('fitapp-show-welcome', 'true');
          window.location.href = '/';
        }, 2000);
      }
    };

    processAndGeneratePlan();
  }, [setUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Creando tu plan personalizado
          </h1>
          <p className="text-primary-100">
            La IA está analizando tus datos y generando todo para ti
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 mb-6 text-center">
            <p className="text-white">{error}</p>
          </div>
        )}

        {/* Steps */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 space-y-3">
          {PROCESSING_STEPS.map((step, index) => {
            const isActive = currentStep === index;
            const isCompleted = completedSteps.includes(index);
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-500 ${
                  isActive 
                    ? 'bg-white/20 scale-[1.02]' 
                    : isCompleted 
                      ? 'bg-white/10' 
                      : 'opacity-40'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-green-500' 
                    : isActive 
                      ? 'bg-white/30' 
                      : 'bg-white/10'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Icon className={`w-5 h-5 text-white ${isActive ? 'animate-pulse' : ''}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${isCompleted || isActive ? 'text-white' : 'text-white/60'}`}>
                    {step.label}
                  </p>
                  <p className={`text-xs truncate ${isCompleted || isActive ? 'text-primary-100' : 'text-white/40'}`}>
                    {isCompleted ? '✓ Completado' : step.sublabel}
                  </p>
                </div>
                {isActive && !isCompleted && (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-8">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${((completedSteps.length) / PROCESSING_STEPS.length) * 100}%` }}
            />
          </div>
          <p className="text-center text-primary-100 text-sm mt-3">
            {Math.round((completedSteps.length / PROCESSING_STEPS.length) * 100)}% completado
          </p>
        </div>

        {/* Fun fact - rotating */}
        <div className="mt-8 text-center min-h-[60px] flex items-center justify-center">
          <p className="text-white/70 text-sm px-4 transition-opacity duration-500">
            {FUN_FACTS[currentFact]}
          </p>
        </div>
        
        {/* What's being created */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Dumbbell className="w-6 h-6 text-white mx-auto mb-1" />
            <p className="text-white/80 text-xs">Rutina semanal</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Utensils className="w-6 h-6 text-white mx-auto mb-1" />
            <p className="text-white/80 text-xs">Plan de comidas</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <ShoppingCart className="w-6 h-6 text-white mx-auto mb-1" />
            <p className="text-white/80 text-xs">Lista de compra</p>
          </div>
        </div>
      </div>
    </div>
  );
}
