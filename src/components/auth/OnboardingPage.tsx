import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Dumbbell, 
  Scale, 
  Activity, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Clock,
  Utensils,
  AlertTriangle,
  Camera,
  User,
  Briefcase
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import type { UserGoals, TrainingType, UserProfileData } from '../../types';

const GOALS = [
  { id: 'lose_weight', label: 'Perder peso', icon: Scale, description: 'Reducir grasa corporal' },
  { id: 'gain_muscle', label: 'Ganar músculo', icon: Dumbbell, description: 'Aumentar masa muscular' },
  { id: 'maintain', label: 'Mantenerme', icon: Target, description: 'Mantener mi forma actual' },
  { id: 'improve_endurance', label: 'Mejorar resistencia', icon: Activity, description: 'Más energía y aguante' },
] as const;

const TRAINING_TYPES: { id: TrainingType; label: string; emoji: string }[] = [
  { id: 'gym', label: 'Gimnasio', emoji: '🏋️' },
  { id: 'crossfit', label: 'CrossFit', emoji: '💪' },
  { id: 'running', label: 'Running', emoji: '🏃' },
  { id: 'swimming', label: 'Natación', emoji: '🏊' },
  { id: 'cycling', label: 'Ciclismo', emoji: '🚴' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘' },
  { id: 'pilates', label: 'Pilates', emoji: '🤸' },
  { id: 'calisthenics', label: 'Calistenia', emoji: '🤾' },
  { id: 'boxing', label: 'Boxeo', emoji: '🥊' },
  { id: 'martial_arts', label: 'Artes marciales', emoji: '🥋' },
  { id: 'tennis', label: 'Tenis', emoji: '🎾' },
  { id: 'padel', label: 'Pádel', emoji: '🏸' },
  { id: 'basketball', label: 'Baloncesto', emoji: '🏀' },
  { id: 'football', label: 'Fútbol', emoji: '⚽' },
  { id: 'hiking', label: 'Senderismo', emoji: '🥾' },
  { id: 'dance', label: 'Baile', emoji: '💃' },
  { id: 'other', label: 'Otro', emoji: '🎯' },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentario', description: 'Poco o nada de ejercicio' },
  { id: 'light', label: 'Ligero', description: '1-2 días/semana' },
  { id: 'moderate', label: 'Moderado', description: '3-4 días/semana' },
  { id: 'active', label: 'Activo', description: '5-6 días/semana' },
  { id: 'very_active', label: 'Muy activo', description: 'Ejercicio diario intenso' },
] as const;

const DIET_TYPES = [
  { id: 'omnivore', label: 'Omnívoro', description: 'Como de todo' },
  { id: 'vegetarian', label: 'Vegetariano', description: 'Sin carne' },
  { id: 'vegan', label: 'Vegano', description: 'Sin productos animales' },
  { id: 'pescatarian', label: 'Pescetariano', description: 'Sin carne pero sí pescado' },
  { id: 'keto', label: 'Keto', description: 'Bajo en carbohidratos' },
  { id: 'paleo', label: 'Paleo', description: 'Dieta paleolítica' },
] as const;

const COMMON_ALLERGIES = [
  'Gluten', 'Lactosa', 'Frutos secos', 'Mariscos', 'Huevos', 
  'Soja', 'Pescado', 'Cacahuetes', 'Sésamo', 'Mostaza'
];

const COMMON_INJURIES = [
  'Espalda baja', 'Rodillas', 'Hombros', 'Cuello', 'Muñecas',
  'Codos', 'Tobillos', 'Cadera', 'Hernias', 'Ninguna'
];

const WORKOUT_TIMES = [
  { id: 'morning', label: 'Mañana', description: '6:00 - 12:00', emoji: '🌅' },
  { id: 'afternoon', label: 'Tarde', description: '12:00 - 18:00', emoji: '☀️' },
  { id: 'evening', label: 'Noche', description: '18:00 - 22:00', emoji: '🌙' },
  { id: 'flexible', label: 'Flexible', description: 'Cualquier hora', emoji: '🔄' },
] as const;

export function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 1: Datos básicos
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  
  // Step 2: Objetivo
  const [goal, setGoal] = useState<UserGoals['primary']>('maintain');
  const [activityLevel, setActivityLevel] = useState<UserGoals['activity_level']>('moderate');
  const [fitnessExperience, setFitnessExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  
  // Step 3: Deportes
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([]);
  const [preferredWorkoutTime, setPreferredWorkoutTime] = useState<'morning' | 'afternoon' | 'evening' | 'flexible'>('flexible');
  const [workoutDuration, setWorkoutDuration] = useState('60');
  
  // Step 4: Horario laboral
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]); // L-V
  
  // Step 5: Alimentación
  const [dietType, setDietType] = useState<'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo'>('omnivore');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState('4');
  const [favoriteFoods, setFavoriteFoods] = useState('');
  const [dislikedFoods, setDislikedFoods] = useState('');
  
  // Step 6: Lesiones
  const [injuries, setInjuries] = useState<string[]>([]);
  const [customInjury, setCustomInjury] = useState('');
  
  // Step 7: Fotos (opcional)
  const [photos, setPhotos] = useState<{ front?: string; side?: string; back?: string }>({});

  const { user, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();

  const toggleTrainingType = (type: TrainingType) => {
    setTrainingTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleWorkDay = (day: number) => {
    setWorkDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const toggleAllergy = (allergy: string) => {
    setAllergies(prev =>
      prev.includes(allergy)
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  const toggleInjury = (injury: string) => {
    if (injury === 'Ninguna') {
      setInjuries(['Ninguna']);
    } else {
      setInjuries(prev => {
        const filtered = prev.filter(i => i !== 'Ninguna');
        return filtered.includes(injury)
          ? filtered.filter(i => i !== injury)
          : [...filtered, injury];
      });
    }
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
      setAllergies([...allergies, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const addCustomInjury = () => {
    if (customInjury.trim() && !injuries.includes(customInjury.trim())) {
      setInjuries(prev => [...prev.filter(i => i !== 'Ninguna'), customInjury.trim()]);
      setCustomInjury('');
    }
  };

  const handlePhotoUpload = async (category: 'front' | 'side' | 'back', file: File) => {
    // Obtener userId de la sesión
    let userId = user?.id;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id;
    }
    if (!userId) return;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/initial_${category}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('progress-photos')
      .upload(fileName, file);
    
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);
      
      setPhotos(prev => ({ ...prev, [category]: publicUrl }));
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    console.log('=== STARTING ONBOARDING COMPLETE ===');

    try {
      // Obtener sesión
      const { data: { session } } = await supabase.auth.getSession();
      const userId = user?.id || session?.user?.id;
      
      console.log('User ID:', userId);

      if (!userId) {
        console.error('No user found - redirecting to login');
        navigate('/login');
        return;
      }

      const goals: UserGoals = {
        primary: goal,
        current_weight: weight ? parseFloat(weight) : undefined,
        target_weight: targetWeight ? parseFloat(targetWeight) : undefined,
        height: height ? parseFloat(height) : undefined,
        age: age ? parseInt(age) : undefined,
        activity_level: activityLevel,
      };

      const profileData: UserProfileData = {
        gender,
        work_schedule: {
          start_time: workStartTime,
          end_time: workEndTime,
          days: workDays,
        },
        preferred_workout_time: preferredWorkoutTime,
        workout_duration_preference: parseInt(workoutDuration),
        diet_type: dietType,
        allergies: allergies.length > 0 ? allergies : undefined,
        food_dislikes: dislikedFoods ? dislikedFoods.split(',').map(f => f.trim()).filter(Boolean) : undefined,
        favorite_foods: favoriteFoods ? favoriteFoods.split(',').map(f => f.trim()).filter(Boolean) : undefined,
        meals_per_day: parseInt(mealsPerDay),
        injuries: injuries.filter(i => i !== 'Ninguna').length > 0 
          ? injuries.filter(i => i !== 'Ninguna') 
          : undefined,
        fitness_experience: fitnessExperience,
        initial_photos: Object.keys(photos).length > 0 ? photos : undefined,
      };

      console.log('Saving profile data...');

      // Guardar en Supabase con timeout
      const updatePromise = supabase
        .from('profiles')
        .update({
          goals,
          training_types: trainingTypes,
          profile_data: profileData,
        })
        .eq('id', userId);

      // Timeout de 10 segundos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );

      try {
        const { error } = await Promise.race([updatePromise, timeoutPromise]) as any;
        if (error) {
          console.error('Error guardando perfil:', error);
        } else {
          console.log('Perfil guardado correctamente');
        }
      } catch (e) {
        console.error('Error o timeout guardando:', e);
      }

      // Actualizar store local
      const { setUser } = useAuthStore.getState();
      setUser({
        id: userId,
        email: session?.user?.email || user?.email || '',
        name: user?.name || session?.user?.user_metadata?.name || '',
        avatar_url: user?.avatar_url,
        goals,
        training_types: trainingTypes,
        profile_data: profileData,
        created_at: user?.created_at || new Date().toISOString()
      });

      console.log('Navigating to AI processing...');
      
      // Navegar siempre, incluso si hubo error
      navigate('/ai-processing');
    } catch (error) {
      console.error('Error completando onboarding:', error);
      // Navegar de todas formas para no dejar al usuario colgado
      navigate('/ai-processing');
    } finally {
      setIsLoading(false);
    }
  };

  const totalSteps = 7;
  const DAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  // Mostrar loading mientras se carga la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Paso {step} de {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="card">
          {/* Step 1: Datos básicos */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Información básica</h2>
                  <p className="text-sm text-gray-500">Cuéntanos sobre ti</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Género</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'male', label: 'Hombre', emoji: '👨' },
                      { id: 'female', label: 'Mujer', emoji: '👩' },
                      { id: 'other', label: 'Otro', emoji: '🧑' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGender(g.id as any)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          gender === g.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{g.emoji}</span>
                        <span className="text-sm font-medium">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Edad</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="input"
                      placeholder="28"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Altura (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="input"
                      placeholder="175"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Peso actual (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="input"
                      placeholder="75"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Peso objetivo (kg)</label>
                    <input
                      type="number"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                      className="input"
                      placeholder="70"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Objetivo */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tu objetivo</h2>
                  <p className="text-sm text-gray-500">¿Qué quieres conseguir?</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid gap-3">
                  {GOALS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        goal === g.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        goal === g.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <g.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{g.label}</p>
                        <p className="text-sm text-gray-500">{g.description}</p>
                      </div>
                      {goal === g.id && <Check className="w-5 h-5 text-primary-600" />}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experiencia fitness</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'beginner', label: 'Principiante', desc: '< 1 año' },
                      { id: 'intermediate', label: 'Intermedio', desc: '1-3 años' },
                      { id: 'advanced', label: 'Avanzado', desc: '> 3 años' },
                    ].map((exp) => (
                      <button
                        key={exp.id}
                        onClick={() => setFitnessExperience(exp.id as any)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          fitnessExperience === exp.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-sm">{exp.label}</p>
                        <p className="text-xs text-gray-500">{exp.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de actividad actual</label>
                  <div className="grid gap-2">
                    {ACTIVITY_LEVELS.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => setActivityLevel(level.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                          activityLevel === level.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-gray-900">{level.label}</p>
                          <p className="text-sm text-gray-500">{level.description}</p>
                        </div>
                        {activityLevel === level.id && <Check className="w-5 h-5 text-primary-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Deportes */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Deportes y entreno</h2>
                  <p className="text-sm text-gray-500">¿Qué actividades practicas?</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona todos los que practiques
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {TRAINING_TYPES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => toggleTrainingType(t.id)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          trainingTypes.includes(t.id)
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl block">{t.emoji}</span>
                        <span className="text-xs font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Cuándo prefieres entrenar?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {WORKOUT_TIMES.map((time) => (
                      <button
                        key={time.id}
                        onClick={() => setPreferredWorkoutTime(time.id)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          preferredWorkoutTime === time.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl">{time.emoji}</span>
                        <p className="font-medium text-sm mt-1">{time.label}</p>
                        <p className="text-xs text-gray-500">{time.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Duración preferida del entreno: <span className="text-primary-600 font-bold">{workoutDuration} min</span>
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="30"
                      max="120"
                      step="15"
                      value={workoutDuration}
                      onChange={(e) => setWorkoutDuration(e.target.value)}
                      className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-6
                        [&::-webkit-slider-thumb]:h-6
                        [&::-webkit-slider-thumb]:bg-primary-600
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:shadow-lg
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:border-4
                        [&::-webkit-slider-thumb]:border-white
                        [&::-webkit-slider-thumb]:transition-all
                        [&::-webkit-slider-thumb]:hover:scale-110
                        [&::-moz-range-thumb]:w-6
                        [&::-moz-range-thumb]:h-6
                        [&::-moz-range-thumb]:bg-primary-600
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:border-4
                        [&::-moz-range-thumb]:border-white
                        [&::-moz-range-thumb]:cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #16a34a ${((parseInt(workoutDuration) - 30) / 90) * 100}%, #e5e7eb ${((parseInt(workoutDuration) - 30) / 90) * 100}%)`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>30 min</span>
                    <span>60 min</span>
                    <span>90 min</span>
                    <span>120 min</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Horario laboral */}
          {step === 4 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tu horario</h2>
                  <p className="text-sm text-gray-500">Para recomendarte los mejores horarios de entreno</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Días de trabajo</label>
                  <div className="flex gap-2">
                    {DAYS.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => toggleWorkDay(index)}
                        className={`w-10 h-10 rounded-full font-medium transition-all ${
                          workDays.includes(index)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Entrada al trabajo
                    </label>
                    <input
                      type="time"
                      value={workStartTime}
                      onChange={(e) => setWorkStartTime(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Salida del trabajo
                    </label>
                    <input
                      type="time"
                      value={workEndTime}
                      onChange={(e) => setWorkEndTime(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💡 Con esta información, la IA te recomendará los mejores horarios para entrenar según tu disponibilidad.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Alimentación */}
          {step === 5 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Alimentación</h2>
                  <p className="text-sm text-gray-500">Para crear tu dieta personalizada</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de dieta</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIET_TYPES.map((diet) => (
                      <button
                        key={diet.id}
                        onClick={() => setDietType(diet.id)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          dietType === diet.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-sm">{diet.label}</p>
                        <p className="text-xs text-gray-500">{diet.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alergias o intolerancias
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {COMMON_ALLERGIES.map((allergy) => (
                      <button
                        key={allergy}
                        onClick={() => toggleAllergy(allergy)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          allergies.includes(allergy)
                            ? 'bg-red-100 text-red-700 border-2 border-red-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {allergy}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customAllergy}
                      onChange={(e) => setCustomAllergy(e.target.value)}
                      className="input flex-1"
                      placeholder="Otra alergia..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAllergy())}
                    />
                    <button type="button" onClick={addCustomAllergy} className="btn btn-secondary">
                      Añadir
                    </button>
                  </div>
                  {/* Mostrar alergias personalizadas añadidas */}
                  {allergies.filter(a => !COMMON_ALLERGIES.includes(a)).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {allergies.filter(a => !COMMON_ALLERGIES.includes(a)).map((allergy) => (
                        <span
                          key={allergy}
                          className="px-3 py-1.5 rounded-full text-sm bg-red-100 text-red-700 border-2 border-red-300 flex items-center gap-1"
                        >
                          {allergy}
                          <button
                            type="button"
                            onClick={() => setAllergies(prev => prev.filter(a => a !== allergy))}
                            className="ml-1 hover:text-red-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comidas al día
                  </label>
                  <div className="flex gap-2">
                    {[3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        onClick={() => setMealsPerDay(n.toString())}
                        className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                          mealsPerDay === n.toString()
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="text-lg font-bold">{n}</p>
                        <p className="text-xs text-gray-500">comidas</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comidas favoritas (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={favoriteFoods}
                    onChange={(e) => setFavoriteFoods(e.target.value)}
                    className="input"
                    placeholder="Pollo, arroz, pasta, huevos..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comidas que no te gustan (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={dislikedFoods}
                    onChange={(e) => setDislikedFoods(e.target.value)}
                    className="input"
                    placeholder="Brócoli, hígado..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Lesiones */}
          {step === 6 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Lesiones o limitaciones</h2>
                  <p className="text-sm text-gray-500">Para adaptar los ejercicios a tu situación</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Tienes alguna lesión o zona sensible?
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {COMMON_INJURIES.map((injury) => (
                      <button
                        key={injury}
                        onClick={() => toggleInjury(injury)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          injuries.includes(injury)
                            ? injury === 'Ninguna'
                              ? 'bg-green-100 text-green-700 border-2 border-green-300'
                              : 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {injury}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customInjury}
                      onChange={(e) => setCustomInjury(e.target.value)}
                      className="input flex-1"
                      placeholder="Otra lesión o limitación..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomInjury())}
                    />
                    <button type="button" onClick={addCustomInjury} className="btn btn-secondary">
                      Añadir
                    </button>
                  </div>
                  {/* Mostrar lesiones personalizadas añadidas */}
                  {injuries.filter(i => !COMMON_INJURIES.includes(i)).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {injuries.filter(i => !COMMON_INJURIES.includes(i)).map((injury) => (
                        <span
                          key={injury}
                          className="px-3 py-1.5 rounded-full text-sm bg-orange-100 text-orange-700 border-2 border-orange-300 flex items-center gap-1"
                        >
                          {injury}
                          <button
                            type="button"
                            onClick={() => setInjuries(prev => prev.filter(i => i !== injury))}
                            className="ml-1 hover:text-orange-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ La IA evitará recomendar ejercicios que puedan afectar las zonas que indiques.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Fotos */}
          {step === 7 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Fotos de progreso (opcional)</h2>
                  <p className="text-sm text-gray-500">Para comparar tu evolución con el tiempo</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {(['front', 'side', 'back'] as const).map((position) => (
                    <div key={position} className="text-center">
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {position === 'front' ? 'Frontal' : position === 'side' ? 'Lateral' : 'Espalda'}
                      </label>
                      <div className={`aspect-[3/4] rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${
                        photos[position] 
                          ? 'border-primary-600 bg-primary-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        {photos[position] ? (
                          <img 
                            src={photos[position]} 
                            alt={position} 
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                            <Camera className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">Subir foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(position, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    📸 Las fotos son opcionales pero te ayudarán a ver tu progreso. Puedes subirlas después desde la sección de Progreso.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                step === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Anterior
            </button>

            {step < totalSteps ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 3 && trainingTypes.length === 0}
                className="btn btn-primary"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? 'Guardando...' : 'Completar'}
                <Check className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Skip option */}
        <p className="text-center text-gray-500 mt-4">
          <button 
            onClick={() => navigate('/')} 
            className="hover:text-gray-700 underline"
          >
            Saltar y configurar después
          </button>
        </p>
      </div>
    </div>
  );
}
