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

// Timeout helper
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ]);
};

export function AIProcessingPage() {
  const { setUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentFact, setCurrentFact] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
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
      
      let session: any = null;
      let profile: any = null;
      
      // Paso 1: Obtener sesión y perfil (con timeout de 5s)
      setCurrentStep(0);
      
      try {
        console.log('Getting session...');
        const sessionResult = await withTimeout(supabase.auth.getSession(), 5000);
        session = sessionResult.data?.session;
        console.log('Session:', session ? 'found' : 'not found');
        
        if (session?.user) {
          console.log('Getting profile...');
          const profileResult = await withTimeout(
            supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
            5000
          );
          profile = profileResult.data;
          console.log('Profile:', profile ? 'found' : 'not found');
        }
      } catch (err) {
        console.warn('Error getting session/profile:', err);
      }
      
      // Marcar paso 1 como completado
      await new Promise(resolve => setTimeout(resolve, 800));
      setCompletedSteps(prev => [...prev, 0]);
      
      // Datos por defecto si no hay perfil
      const goals: UserGoals = profile?.goals || { primary: 'maintain', activity_level: 'moderate' };
      const trainingTypes: TrainingType[] = profile?.training_types || ['gym'];
      const profileData: UserProfileData | undefined = profile?.profile_data;
      
      // Paso 2-4: Generar plan
      setCurrentStep(1);
      
      let generatedPlan: GeneratedPlan;
      
      try {
        console.log('Generating plan...');
        generatedPlan = await withTimeout(
          generateCompletePlan(goals, trainingTypes, profileData),
          15000 // 15 segundos máximo
        );
        console.log('Plan generated successfully');
      } catch (genError) {
        console.warn('Error/timeout generating plan, using default:', genError);
        // Plan de demo
        generatedPlan = {
          workout_plan: { 
            name: 'Plan de Entrenamiento', 
            description: 'Plan personalizado para ti',
            days: [], 
            rest_days: [0, 3], 
            estimated_calories_burned_weekly: 2500 
          },
          diet_plan: { 
            name: 'Plan Nutricional', 
            description: '2000 kcal diarias',
            daily_calories: 2000, 
            macros: { protein_grams: 150, carbs_grams: 200, fat_grams: 70 }, 
            days: [] 
          },
          shopping_list: [],
          recommendations: [
            'Entrena con consistencia para ver resultados',
            'Mantente hidratado bebiendo 2-3L de agua al día',
            'Descansa al menos 7-8 horas'
          ],
          generated_at: new Date().toISOString()
        };
      }
      
      // Animar pasos restantes rápidamente
      for (let i = 1; i < PROCESSING_STEPS.length - 1; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 600));
        setCompletedSteps(prev => [...prev, i]);
      }
      
      // Paso final
      setCurrentStep(PROCESSING_STEPS.length - 1);
      
      // Guardar en localStorage (siempre funciona)
      localStorage.setItem('fitapp-generated-plan', JSON.stringify(generatedPlan));
      
      // Intentar guardar en Supabase (no bloquear si falla)
      if (session?.user) {
        try {
          await withTimeout(
            supabase.from('profiles').update({
              generated_plan: generatedPlan,
              plan_generated_at: new Date().toISOString()
            }).eq('id', session.user.id),
            3000
          );
          console.log('Plan saved to Supabase');
        } catch (saveErr) {
          console.warn('Could not save to Supabase:', saveErr);
        }
        
        // Actualizar store
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
      }
      
      setCompletedSteps(prev => [...prev, PROCESSING_STEPS.length - 1]);
      
      console.log('Processing complete!');
      
      // Esperar un momento y redirigir
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.setItem('fitapp-show-welcome', 'true');
      window.location.href = '/';
    };

    // Ejecutar con un timeout global de seguridad
    processAndGeneratePlan().catch(err => {
      console.error('Fatal error:', err);
      setError('Error en el procesamiento');
    });
    
    // Timeout de seguridad: si después de 30s no ha terminado, redirigir
    const safetyTimeout = setTimeout(() => {
      console.log('Safety timeout reached, redirecting...');
      localStorage.setItem('fitapp-show-welcome', 'true');
      window.location.href = '/';
    }, 30000);
    
    return () => clearTimeout(safetyTimeout);
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

        {/* Fun fact */}
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
