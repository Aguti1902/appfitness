import { useState, useEffect } from 'react';
import { X, Dumbbell, Utensils, Calendar, Target, ChevronRight, Sparkles, ShoppingCart, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import type { GeneratedPlan } from '../../types';

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);

  useEffect(() => {
    // Cargar el plan generado desde localStorage
    const savedPlan = localStorage.getItem('fitapp-generated-plan');
    if (savedPlan) {
      try {
        setPlan(JSON.parse(savedPlan));
      } catch (e) {
        console.error('Error parsing plan:', e);
      }
    }
  }, []);

  const goals = user?.goals;
  const workoutPlan = plan?.workout_plan;
  const dietPlan = plan?.diet_plan;

  const getGoalText = () => {
    switch (goals?.primary) {
      case 'lose_weight': return 'Perder peso';
      case 'gain_muscle': return 'Ganar músculo';
      case 'improve_endurance': return 'Mejorar resistencia';
      default: return 'Mantener forma';
    }
  };

  const trainingDays = workoutPlan?.days?.filter(d => !d.is_rest_day).length || 5;
  const restDays = workoutPlan?.rest_days?.length || 2;

  const slides = [
    {
      icon: Sparkles,
      title: `¡Bienvenido, ${user?.name?.split(' ')[0] || 'Campeón'}!`,
      content: (
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Tu plan personalizado está listo. Hemos creado una estrategia completa basada en tus datos.
          </p>
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6">
            <p className="text-sm text-primary-600 font-medium mb-1">Tu objetivo principal</p>
            <p className="text-3xl font-bold text-primary-700 mb-2">{getGoalText()}</p>
            {goals?.current_weight && goals?.target_weight && (
              <p className="text-primary-600">
                {goals.current_weight}kg → {goals.target_weight}kg
              </p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-800">{trainingDays}</p>
              <p className="text-xs text-gray-500">días entreno</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-800">{dietPlan?.daily_calories || '-'}</p>
              <p className="text-xs text-gray-500">kcal/día</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-800">{restDays}</p>
              <p className="text-xs text-gray-500">días descanso</p>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: Dumbbell,
      title: workoutPlan?.name || 'Tu Rutina de Entrenamiento',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 text-center text-sm">
            {workoutPlan?.description || 'Plan diseñado específicamente para ti'}
          </p>
          
          {/* Días de la semana */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {workoutPlan?.days?.map((day, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  day.is_rest_day 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-primary-50 border-primary-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`font-medium text-sm ${day.is_rest_day ? 'text-gray-600' : 'text-primary-700'}`}>
                      {day.day_name}
                    </p>
                    <p className={`text-xs ${day.is_rest_day ? 'text-gray-400' : 'text-primary-600'}`}>
                      {day.is_rest_day ? 'Descanso activo' : day.title}
                    </p>
                  </div>
                  {!day.is_rest_day && (
                    <span className="text-xs bg-primary-200 text-primary-700 px-2 py-1 rounded-full">
                      {day.duration_minutes} min
                    </span>
                  )}
                </div>
                {!day.is_rest_day && day.exercises?.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {day.exercises.slice(0, 3).map(e => e.name).join(', ')}
                    {day.exercises.length > 3 && ` +${day.exercises.length - 3} más`}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          {workoutPlan?.estimated_calories_burned_weekly && (
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <p className="text-orange-600 text-sm">
                🔥 Quemarás aprox. <span className="font-bold">{workoutPlan.estimated_calories_burned_weekly}</span> kcal/semana
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      icon: Utensils,
      title: dietPlan?.name || 'Tu Plan Nutricional',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 text-center text-sm">
            {dietPlan?.description || 'Alimentación equilibrada para tus objetivos'}
          </p>
          
          {/* Calorías y macros */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{dietPlan?.daily_calories || 2000}</p>
              <p className="text-sm text-orange-700">kcal/día</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{dietPlan?.days?.[0]?.meals?.length || 4}</p>
              <p className="text-sm text-blue-700">comidas/día</p>
            </div>
          </div>
          
          {/* Macros */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-3 text-center">Distribución de macronutrientes</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <span className="text-lg">🥩</span>
                </div>
                <p className="font-bold text-gray-800">{dietPlan?.macros?.protein_grams || 150}g</p>
                <p className="text-xs text-gray-500">Proteína</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <span className="text-lg">🍚</span>
                </div>
                <p className="font-bold text-gray-800">{dietPlan?.macros?.carbs_grams || 200}g</p>
                <p className="text-xs text-gray-500">Carbos</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <span className="text-lg">🥑</span>
                </div>
                <p className="font-bold text-gray-800">{dietPlan?.macros?.fat_grams || 70}g</p>
                <p className="text-xs text-gray-500">Grasas</p>
              </div>
            </div>
          </div>
          
          {/* Preview de comida de hoy */}
          {dietPlan?.days?.[0]?.meals && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 text-center">Ejemplo de un día:</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dietPlan.days[0].meals.slice(0, 4).map((meal, i) => (
                  <div key={i} className="flex-shrink-0 bg-white border rounded-lg p-2 w-24">
                    <p className="text-xs font-medium text-gray-700 truncate">{meal.name}</p>
                    <p className="text-xs text-gray-400">{meal.calories} kcal</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      icon: ShoppingCart,
      title: 'Tu Lista de Compra',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 text-center text-sm">
            Hemos preparado tu lista de compra semanal
          </p>
          
          {plan?.shopping_list && plan.shopping_list.length > 0 ? (
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {/* Agrupar por categoría */}
              {['produce', 'meat', 'dairy', 'grains', 'other'].map(category => {
                const items = plan.shopping_list.filter(item => item.category === category);
                if (items.length === 0) return null;
                
                const categoryNames: Record<string, string> = {
                  produce: '🥬 Frutas y Verduras',
                  meat: '🥩 Carnes y Pescados',
                  dairy: '🥛 Lácteos',
                  grains: '🌾 Cereales',
                  other: '📦 Otros'
                };
                
                return (
                  <div key={category}>
                    <p className="text-xs font-medium text-gray-500 mb-1">{categoryNames[category]}</p>
                    <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                      {items.slice(0, 4).map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.ingredient}</span>
                          <span className="text-gray-500">{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                      {items.length > 4 && (
                        <p className="text-xs text-gray-400">+{items.length - 4} más...</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                La lista completa está disponible en la sección de Nutrición
              </p>
            </div>
          )}
          
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-green-700 text-sm">
              ✓ La lista se actualiza automáticamente cada semana
            </p>
          </div>
        </div>
      )
    },
    {
      icon: Target,
      title: '¡Empezamos!',
      content: (
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            Todo está listo para comenzar tu transformación
          </p>
          
          {/* Recomendaciones */}
          {plan?.recommendations && plan.recommendations.length > 0 && (
            <div className="space-y-2 text-left">
              {plan.recommendations.slice(0, 4).map((tip, i) => (
                <div key={i} className="flex items-start gap-3 bg-green-50 p-3 rounded-lg">
                  <span className="text-green-500 text-lg flex-shrink-0">✓</span>
                  <p className="text-green-800 text-sm">{tip}</p>
                </div>
              ))}
            </div>
          )}
          
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4 mt-4">
            <p className="text-primary-700 font-medium">
              🎯 Tu plan está personalizado al 100%
            </p>
            <p className="text-primary-600 text-sm mt-1">
              Puedes modificarlo en cualquier momento desde Configuración
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentSlide = slides[step];
  const Icon = currentSlide.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-center">{currentSlide.title}</h2>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {currentSlide.content}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex items-center justify-between border-t bg-gray-50">
          {/* Back button */}
          <div className="w-24">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center text-gray-500 hover:text-gray-700 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
            )}
          </div>
          
          {/* Dots */}
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button 
                key={i}
                onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === step ? 'bg-primary-600 w-4' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Next/Finish button */}
          <div className="w-24 flex justify-end">
            {step < slides.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="btn btn-primary btn-sm"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="btn btn-primary btn-sm"
              >
                ¡Vamos!
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
