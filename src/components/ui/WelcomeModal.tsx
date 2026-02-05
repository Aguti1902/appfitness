import { useState } from 'react';
import { X, Dumbbell, Utensils, Calendar, Target, ChevronRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);

  const goals = user?.goals;
  const profileData = user?.profile_data;
  const trainingTypes = user?.training_types || [];

  // Generar resumen basado en los datos del usuario
  const getGoalText = () => {
    switch (goals?.primary) {
      case 'lose_weight': return 'Perder peso';
      case 'gain_muscle': return 'Ganar músculo';
      case 'improve_endurance': return 'Mejorar resistencia';
      default: return 'Mantener forma';
    }
  };

  const getCaloriesEstimate = () => {
    const weight = goals?.current_weight || 70;
    const activity = goals?.activity_level || 'moderate';
    const baseCalories = weight * 24;
    const activityMultiplier = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    }[activity] || 1.55;
    
    let calories = Math.round(baseCalories * activityMultiplier);
    
    if (goals?.primary === 'lose_weight') calories -= 300;
    if (goals?.primary === 'gain_muscle') calories += 300;
    
    return calories;
  };

  const slides = [
    {
      icon: Sparkles,
      title: `¡Bienvenido, ${user?.name?.split(' ')[0] || 'Campeón'}!`,
      content: (
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Tu plan personalizado está listo. Hemos analizado tus datos y creado una estrategia perfecta para ti.
          </p>
          <div className="bg-primary-50 rounded-xl p-4 inline-block">
            <p className="text-sm text-primary-600 font-medium">Tu objetivo principal</p>
            <p className="text-2xl font-bold text-primary-700">{getGoalText()}</p>
          </div>
        </div>
      )
    },
    {
      icon: Dumbbell,
      title: 'Tu Rutina de Entrenamiento',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 text-center">
            Basado en tus preferencias, te recomendamos:
          </p>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Días de entreno</span>
              <span className="font-semibold">{goals?.activity_level === 'very_active' ? '6' : goals?.activity_level === 'active' ? '5' : '4'} días/semana</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Duración</span>
              <span className="font-semibold">{profileData?.workout_duration_preference || 60} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Horario ideal</span>
              <span className="font-semibold capitalize">{profileData?.preferred_workout_time === 'morning' ? 'Mañana' : profileData?.preferred_workout_time === 'evening' ? 'Noche' : 'Tarde'}</span>
            </div>
          </div>
          {trainingTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {trainingTypes.slice(0, 4).map((type: string) => (
                <span key={type} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  {type === 'gym' ? '🏋️ Gimnasio' : 
                   type === 'crossfit' ? '💪 CrossFit' :
                   type === 'running' ? '🏃 Running' :
                   type === 'swimming' ? '🏊 Natación' :
                   type === 'cycling' ? '🚴 Ciclismo' :
                   type === 'yoga' ? '🧘 Yoga' : type}
                </span>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      icon: Utensils,
      title: 'Tu Plan Nutricional',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 text-center">
            Hemos calculado tus necesidades nutricionales:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{getCaloriesEstimate()}</p>
              <p className="text-sm text-orange-700">kcal/día</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{profileData?.meals_per_day || 4}</p>
              <p className="text-sm text-blue-700">comidas/día</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-2">Macros recomendados</p>
            <div className="flex justify-between text-sm">
              <div className="text-center">
                <p className="font-bold text-gray-800">{Math.round(getCaloriesEstimate() * 0.3 / 4)}g</p>
                <p className="text-gray-500">Proteína</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800">{Math.round(getCaloriesEstimate() * 0.4 / 4)}g</p>
                <p className="text-gray-500">Carbos</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800">{Math.round(getCaloriesEstimate() * 0.3 / 9)}g</p>
                <p className="text-gray-500">Grasas</p>
              </div>
            </div>
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
            Todo está listo para comenzar tu transformación. Recuerda:
          </p>
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3 bg-green-50 p-3 rounded-lg">
              <span className="text-green-500 text-xl">✓</span>
              <p className="text-green-800 text-sm">Registra tus entrenamientos para ver tu progreso</p>
            </div>
            <div className="flex items-start gap-3 bg-green-50 p-3 rounded-lg">
              <span className="text-green-500 text-xl">✓</span>
              <p className="text-green-800 text-sm">Sigue tu plan de comidas y ajústalo según necesites</p>
            </div>
            <div className="flex items-start gap-3 bg-green-50 p-3 rounded-lg">
              <span className="text-green-500 text-xl">✓</span>
              <p className="text-green-800 text-sm">Usa el AI Coach para resolver cualquier duda</p>
            </div>
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
        <div className="p-6">
          {currentSlide.content}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex items-center justify-between">
          {/* Dots */}
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <div 
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          {step < slides.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="btn btn-primary"
            >
              Siguiente
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="btn btn-primary"
            >
              ¡Empezar!
              <Sparkles className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
