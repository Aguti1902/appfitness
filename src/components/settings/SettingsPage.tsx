import { useState, useEffect } from 'react';
import { 
  User, 
  Target, 
  Bell, 
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Save,
  Check,
  Sparkles,
  RefreshCw,
  Trash2,
  Dumbbell,
  Utensils,
  Briefcase,
  Heart
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { requestNotificationPermission } from '../../lib/notifications';
import { generateCompletePlan, generateDemoPlanFallback } from '../../lib/openai';
import type { UserGoals, TrainingType, UserProfileData } from '../../types';

const TRAINING_TYPES = [
  { id: 'gym', label: 'Gimnasio', emoji: '🏋️' },
  { id: 'crossfit', label: 'CrossFit', emoji: '💪' },
  { id: 'hyrox', label: 'Hyrox', emoji: '🔥' },
  { id: 'hybrid', label: 'Hybrid', emoji: '⚡' },
  { id: 'running', label: 'Running', emoji: '🏃' },
];

const DIET_TYPES = [
  { id: 'omnivore', label: 'Omnívoro' },
  { id: 'vegetarian', label: 'Vegetariano' },
  { id: 'vegan', label: 'Vegano' },
  { id: 'pescatarian', label: 'Pescetariano' },
  { id: 'keto', label: 'Keto' },
  { id: 'paleo', label: 'Paleo' },
];

const COMMON_ALLERGIES = [
  'Gluten', 'Lactosa', 'Frutos secos', 'Mariscos', 'Huevos', 
  'Soja', 'Pescado', 'Cacahuetes'
];

const COMMON_INJURIES = [
  'Espalda baja', 'Rodillas', 'Hombros', 'Cuello', 'Muñecas',
  'Codos', 'Tobillos', 'Cadera'
];

export function SettingsPage() {
  const { user, logout, setUser } = useAuthStore();
  
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateSuccess, setRegenerateSuccess] = useState(false);

  // Datos del perfil
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  
  // Objetivos
  const [primaryGoal, setPrimaryGoal] = useState<string>('maintain');
  const [activityLevel, setActivityLevel] = useState<string>('moderate');
  
  // Deportes
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([]);
  const [sportsFrequency, setSportsFrequency] = useState<Record<string, { days: number; duration: number; type?: 'class' | 'open' }>>({});
  
  // Horario
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [preferredWorkoutTime, setPreferredWorkoutTime] = useState<string>('morning');
  
  // Dieta
  const [dietType, setDietType] = useState('omnivore');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [mealsPerDay, setMealsPerDay] = useState('4');
  const [dislikedFoods, setDislikedFoods] = useState('');
  const [favoriteFoods, setFavoriteFoods] = useState('');
  
  // Salud
  const [injuries, setInjuries] = useState<string[]>([]);
  const [fitnessExperience, setFitnessExperience] = useState<string>('intermediate');

  // Cargar datos del usuario al montar
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      
      // Goals
      const goals = user.goals || {};
      setPrimaryGoal(goals.primary || 'maintain');
      setActivityLevel(goals.activity_level || 'moderate');
      setCurrentWeight(goals.current_weight?.toString() || '');
      setTargetWeight(goals.target_weight?.toString() || '');
      setHeight(goals.height?.toString() || '');
      setAge(goals.age?.toString() || '');
      
      // Training types
      setTrainingTypes(user.training_types || []);
      
      // Profile data
      const profileData = user.profile_data || {};
      setGender(profileData.gender || 'male');
      setWorkDays(profileData.work_schedule?.days || [1, 2, 3, 4, 5]);
      setWorkStartTime(profileData.work_schedule?.start_time || '09:00');
      setWorkEndTime(profileData.work_schedule?.end_time || '18:00');
      setPreferredWorkoutTime(profileData.preferred_workout_time || 'morning');
      setDietType(profileData.diet_type || 'omnivore');
      setAllergies(profileData.allergies || []);
      setMealsPerDay(profileData.meals_per_day?.toString() || '4');
      setDislikedFoods(profileData.food_dislikes?.join(', ') || '');
      setFavoriteFoods(profileData.favorite_foods?.join(', ') || '');
      setInjuries(profileData.injuries || []);
      setFitnessExperience(profileData.fitness_experience || 'intermediate');
      if (profileData.sports_frequency) {
        // Asegurar que todos los valores tienen duration definido
        const freq: Record<string, { days: number; duration: number; type?: 'class' | 'open' }> = {};
        Object.entries(profileData.sports_frequency).forEach(([key, value]) => {
          freq[key] = {
            days: value.days || 3,
            duration: value.duration || 60,
            type: value.type
          };
        });
        setSportsFrequency(freq);
      }
    }
  }, [user]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    
    const goals: UserGoals = {
      primary: primaryGoal as UserGoals['primary'],
      activity_level: activityLevel as UserGoals['activity_level'],
      current_weight: currentWeight ? parseFloat(currentWeight) : undefined,
      target_weight: targetWeight ? parseFloat(targetWeight) : undefined,
      height: height ? parseFloat(height) : undefined,
      age: age ? parseInt(age) : undefined,
    };

    const profileData: UserProfileData = {
      gender,
      work_schedule: {
        start_time: workStartTime,
        end_time: workEndTime,
        days: workDays,
      },
      preferred_workout_time: preferredWorkoutTime as UserProfileData['preferred_workout_time'],
      diet_type: dietType as UserProfileData['diet_type'],
      allergies: allergies.length > 0 ? allergies : undefined,
      food_dislikes: dislikedFoods ? dislikedFoods.split(',').map(f => f.trim()).filter(Boolean) : undefined,
      favorite_foods: favoriteFoods ? favoriteFoods.split(',').map(f => f.trim()).filter(Boolean) : undefined,
      meals_per_day: parseInt(mealsPerDay),
      injuries: injuries.length > 0 ? injuries : undefined,
      fitness_experience: fitnessExperience as UserProfileData['fitness_experience'],
      sports_frequency: Object.keys(sportsFrequency).length > 0 ? sportsFrequency : undefined,
    };

    // Combinar goals con profile_data para Supabase
    const combinedGoals = {
      ...goals,
      profile_data: profileData
    };

    try {
      if (user?.id) {
        // Guardar en Supabase
        const { error } = await supabase
          .from('profiles')
          .update({
            name,
            goals: combinedGoals,
            training_types: trainingTypes,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error saving to Supabase:', error);
        } else {
          console.log('✅ Saved to Supabase');
        }
      }

      // Actualizar store local
      setUser({
        ...user!,
        name,
        goals,
        training_types: trainingTypes,
        profile_data: profileData
      });

      // Guardar en localStorage
      localStorage.setItem('fitapp-profile-data', JSON.stringify(profileData));
      localStorage.setItem('fitapp-training-types', JSON.stringify(trainingTypes));
      localStorage.setItem('fitapp-goals', JSON.stringify(goals));

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Error saving:', e);
    }
    
    setIsSaving(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    window.location.href = '/login';
  };

  const toggleTrainingType = (type: TrainingType) => {
    setTrainingTypes(prev => {
      const newTypes = prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type];
      
      // Actualizar sportsFrequency
      if (!prev.includes(type)) {
        setSportsFrequency(current => ({
          ...current,
          [type]: { days: 3, duration: 60 }
        }));
      } else {
        setSportsFrequency(current => {
          const updated = { ...current };
          delete updated[type];
          return updated;
        });
      }
      
      return newTypes;
    });
  };

  const toggleAllergy = (allergy: string) => {
    setAllergies(prev => 
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const toggleInjury = (injury: string) => {
    setInjuries(prev => 
      prev.includes(injury) ? prev.filter(i => i !== injury) : [...prev, injury]
    );
  };

  const toggleWorkDay = (day: number) => {
    setWorkDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleRegeneratePlan = async () => {
    // Primero guardar los cambios
    await handleSaveAll();
    
    setIsRegenerating(true);
    setRegenerateSuccess(false);
    
    const userGoals: UserGoals = {
      primary: primaryGoal as UserGoals['primary'],
      activity_level: activityLevel as UserGoals['activity_level'],
      current_weight: currentWeight ? parseFloat(currentWeight) : undefined,
      target_weight: targetWeight ? parseFloat(targetWeight) : undefined,
      height: height ? parseFloat(height) : undefined,
      age: age ? parseInt(age) : undefined,
    };

    const profileData: UserProfileData = {
      gender,
      work_schedule: { start_time: workStartTime, end_time: workEndTime, days: workDays },
      preferred_workout_time: preferredWorkoutTime as UserProfileData['preferred_workout_time'],
      diet_type: dietType as UserProfileData['diet_type'],
      allergies: allergies.length > 0 ? allergies : undefined,
      food_dislikes: dislikedFoods ? dislikedFoods.split(',').map(f => f.trim()).filter(Boolean) : undefined,
      favorite_foods: favoriteFoods ? favoriteFoods.split(',').map(f => f.trim()).filter(Boolean) : undefined,
      meals_per_day: parseInt(mealsPerDay),
      injuries: injuries.length > 0 ? injuries : undefined,
      fitness_experience: fitnessExperience as UserProfileData['fitness_experience'],
      sports_frequency: Object.keys(sportsFrequency).length > 0 ? sportsFrequency : undefined,
    };
    
    let newPlan;
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)
      );
      
      newPlan = await Promise.race([
        generateCompletePlan(userGoals, trainingTypes, profileData),
        timeoutPromise
      ]);
    } catch (error) {
      console.warn('Error/timeout generating plan:', error);
      newPlan = generateDemoPlanFallback(userGoals, trainingTypes, profileData);
    }
    
    localStorage.setItem('fitapp-generated-plan', JSON.stringify(newPlan));
    
    setRegenerateSuccess(true);
    setIsRegenerating(false);
    setTimeout(() => setRegenerateSuccess(false), 3000);
  };

  const DAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  const sections = [
    { id: 'profile', label: 'Datos personales', icon: User },
    { id: 'sports', label: 'Deportes', icon: Dumbbell },
    { id: 'schedule', label: 'Horarios', icon: Briefcase },
    { id: 'diet', label: 'Alimentación', icon: Utensils },
    { id: 'health', label: 'Salud y lesiones', icon: Heart },
    { id: 'goals', label: 'Objetivos', icon: Target },
    { id: 'ai', label: 'Plan IA', icon: Sparkles },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'privacy', label: 'Privacidad', icon: Shield },
    { id: 'help', label: 'Ayuda', icon: HelpCircle },
  ];

  return (
    <div className="page-content">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ajustes</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                activeSection === section.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <section.icon className="w-5 h-5" />
                <span className="font-medium">{section.label}</span>
              </div>
              <ChevronRight className={`w-5 h-5 transition-transform ${
                activeSection === section.id ? 'rotate-90' : ''
              }`} />
            </button>
          ))}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-2">
          {/* Datos personales */}
          {activeSection === 'profile' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Datos personales</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Género</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'male', label: 'Hombre', emoji: '👨' },
                      { id: 'female', label: 'Mujer', emoji: '👩' },
                      { id: 'other', label: 'Otro', emoji: '🧑' }
                    ].map(g => (
                      <button
                        key={g.id}
                        onClick={() => setGender(g.id as 'male' | 'female' | 'other')}
                        className={`p-3 rounded-xl border-2 text-center ${
                          gender === g.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{g.emoji}</span>
                        <p className="text-sm mt-1">{g.label}</p>
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
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
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

                <button onClick={handleSaveAll} disabled={isSaving} className="btn btn-primary">
                  {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {isSaving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}

          {/* Deportes */}
          {activeSection === 'sports' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Deportes que practicas</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TRAINING_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => toggleTrainingType(type.id as TrainingType)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        trainingTypes.includes(type.id as TrainingType)
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{type.emoji}</span>
                      <p className="text-sm font-medium mt-1">{type.label}</p>
                    </button>
                  ))}
                </div>

                {/* Frecuencia por deporte */}
                {trainingTypes.length > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium text-gray-900">Frecuencia por deporte</h3>
                    {trainingTypes.map(sport => {
                      const freq = sportsFrequency[sport] || { days: 3, duration: 60 };
                      const sportInfo = TRAINING_TYPES.find(t => t.id === sport);
                      
                      return (
                        <div key={sport} className="bg-gray-50 rounded-xl p-4">
                          <p className="font-medium mb-3">{sportInfo?.emoji} {sportInfo?.label}</p>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-gray-500">Días/semana</label>
                              <div className="flex gap-1 mt-1">
                                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                  <button
                                    key={d}
                                    onClick={() => setSportsFrequency(prev => ({
                                      ...prev,
                                      [sport]: { ...freq, days: d }
                                    }))}
                                    className={`w-8 h-8 rounded-full text-xs font-medium ${
                                      freq.days === d
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-white text-gray-600'
                                    }`}
                                  >
                                    {d}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Duración</label>
                              <select
                                value={freq.duration}
                                onChange={(e) => setSportsFrequency(prev => ({
                                  ...prev,
                                  [sport]: { ...freq, duration: parseInt(e.target.value) }
                                }))}
                                className="input mt-1 text-sm"
                              >
                                <option value="30">30 min</option>
                                <option value="45">45 min</option>
                                <option value="60">60 min</option>
                                <option value="75">75 min</option>
                                <option value="90">90 min</option>
                                <option value="120">120 min</option>
                              </select>
                            </div>
                          </div>

                          {['crossfit', 'hyrox', 'hybrid'].includes(sport) && (
                            <div className="mt-3 pt-3 border-t">
                              <label className="text-xs text-gray-500">Tipo de entreno</label>
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <button
                                  onClick={() => setSportsFrequency(prev => ({
                                    ...prev,
                                    [sport]: { ...freq, type: 'class' }
                                  }))}
                                  className={`p-2 rounded-lg text-xs ${
                                    freq.type === 'class'
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-white text-gray-600'
                                  }`}
                                >
                                  📋 Clase dirigida
                                </button>
                                <button
                                  onClick={() => setSportsFrequency(prev => ({
                                    ...prev,
                                    [sport]: { ...freq, type: 'open' }
                                  }))}
                                  className={`p-2 rounded-lg text-xs ${
                                    freq.type === 'open'
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-white text-gray-600'
                                  }`}
                                >
                                  🔓 Open Box
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <button onClick={handleSaveAll} disabled={isSaving} className="btn btn-primary">
                  {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {isSaving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}

          {/* Horarios */}
          {activeSection === 'schedule' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Tu horario</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Días de trabajo</label>
                  <div className="flex gap-2">
                    {DAYS.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => toggleWorkDay(index)}
                        className={`w-10 h-10 rounded-full font-medium ${
                          workDays.includes(index)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hora entrada</label>
                    <input
                      type="time"
                      value={workStartTime}
                      onChange={(e) => setWorkStartTime(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hora salida</label>
                    <input
                      type="time"
                      value={workEndTime}
                      onChange={(e) => setWorkEndTime(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">¿Cuándo prefieres entrenar?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'morning', label: 'Mañana', emoji: '🌅' },
                      { id: 'afternoon', label: 'Tarde', emoji: '☀️' },
                      { id: 'evening', label: 'Noche', emoji: '🌙' }
                    ].map(time => (
                      <button
                        key={time.id}
                        onClick={() => setPreferredWorkoutTime(time.id)}
                        className={`p-3 rounded-xl border-2 text-center ${
                          preferredWorkoutTime === time.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <span className="text-xl">{time.emoji}</span>
                        <p className="text-xs mt-1">{time.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleSaveAll} disabled={isSaving} className="btn btn-primary">
                  {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {isSaving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}

          {/* Alimentación */}
          {activeSection === 'diet' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Alimentación</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de dieta</label>
                  <select
                    value={dietType}
                    onChange={(e) => setDietType(e.target.value)}
                    className="input"
                  >
                    {DIET_TYPES.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comidas al día</label>
                  <select
                    value={mealsPerDay}
                    onChange={(e) => setMealsPerDay(e.target.value)}
                    className="input"
                  >
                    <option value="3">3 comidas</option>
                    <option value="4">4 comidas</option>
                    <option value="5">5 comidas</option>
                    <option value="6">6 comidas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alergias e intolerancias</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ALLERGIES.map(allergy => (
                      <button
                        key={allergy}
                        onClick={() => toggleAllergy(allergy)}
                        className={`px-3 py-1.5 rounded-full text-sm ${
                          allergies.includes(allergy)
                            ? 'bg-red-100 text-red-700 border-2 border-red-300'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {allergy}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alimentos que no te gustan (separados por comas)
                  </label>
                  <input
                    type="text"
                    value={dislikedFoods}
                    onChange={(e) => setDislikedFoods(e.target.value)}
                    className="input"
                    placeholder="ej: brócoli, hígado, olivas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alimentos favoritos (separados por comas)
                  </label>
                  <input
                    type="text"
                    value={favoriteFoods}
                    onChange={(e) => setFavoriteFoods(e.target.value)}
                    className="input"
                    placeholder="ej: pollo, arroz, plátano"
                  />
                </div>

                <button onClick={handleSaveAll} disabled={isSaving} className="btn btn-primary">
                  {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {isSaving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}

          {/* Salud */}
          {activeSection === 'health' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Salud y lesiones</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experiencia fitness</label>
                  <select
                    value={fitnessExperience}
                    onChange={(e) => setFitnessExperience(e.target.value)}
                    className="input"
                  >
                    <option value="beginner">Principiante (menos de 1 año)</option>
                    <option value="intermediate">Intermedio (1-3 años)</option>
                    <option value="advanced">Avanzado (más de 3 años)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lesiones o zonas a evitar
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_INJURIES.map(injury => (
                      <button
                        key={injury}
                        onClick={() => toggleInjury(injury)}
                        className={`px-3 py-1.5 rounded-full text-sm ${
                          injuries.includes(injury)
                            ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {injury}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-xl">
                  <p className="text-sm text-yellow-800">
                    ⚠️ La IA tendrá en cuenta tus lesiones para adaptar los ejercicios y evitar movimientos que puedan afectarte.
                  </p>
                </div>

                <button onClick={handleSaveAll} disabled={isSaving} className="btn btn-primary">
                  {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {isSaving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}

          {/* Objetivos */}
          {activeSection === 'goals' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Objetivos</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Objetivo principal</label>
                  <select
                    value={primaryGoal}
                    onChange={(e) => setPrimaryGoal(e.target.value)}
                    className="input"
                  >
                    <option value="lose_weight">Perder peso</option>
                    <option value="gain_muscle">Ganar músculo</option>
                    <option value="maintain">Mantenerme</option>
                    <option value="improve_endurance">Mejorar resistencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de actividad general</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="input"
                  >
                    <option value="sedentary">Sedentario (trabajo de oficina)</option>
                    <option value="light">Ligero (caminas bastante)</option>
                    <option value="moderate">Moderado (activo en el día a día)</option>
                    <option value="active">Activo (trabajo físico)</option>
                    <option value="very_active">Muy activo (trabajo muy físico)</option>
                  </select>
                </div>

                <button onClick={handleSaveAll} disabled={isSaving} className="btn btn-primary">
                  {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {isSaving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}

          {/* Plan IA */}
          {activeSection === 'ai' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Plan generado por IA</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-primary-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-primary-900">Tu plan personalizado</p>
                      <p className="text-sm text-primary-700 mt-1">
                        Si has cambiado algún dato, regenera tu plan para que la IA lo tenga en cuenta.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRegeneratePlan}
                  disabled={isRegenerating}
                  className={`w-full btn ${regenerateSuccess ? 'btn-success' : 'btn-primary'}`}
                >
                  {isRegenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generando plan...
                    </>
                  ) : regenerateSuccess ? (
                    <>
                      <Check className="w-5 h-5" />
                      ¡Plan regenerado!
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Regenerar plan con IA
                    </>
                  )}
                </button>

                {regenerateSuccess && (
                  <p className="text-center text-sm text-green-600">
                    Ve a Entrenamientos o Nutrición para ver tu nuevo plan
                  </p>
                )}

                <div className="p-4 border border-red-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Borrar plan actual</p>
                      <p className="text-sm text-gray-500">Elimina el plan para empezar de cero</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('¿Seguro que quieres borrar tu plan actual?')) {
                          localStorage.removeItem('fitapp-generated-plan');
                          alert('Plan eliminado');
                        }
                      }}
                      className="btn btn-secondary text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notificaciones */}
          {activeSection === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Notificaciones</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Notificaciones push</p>
                    <p className="text-sm text-gray-500">Recibe recordatorios</p>
                  </div>
                  <button
                    onClick={requestNotificationPermission}
                    className="btn btn-primary text-sm"
                  >
                    {typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'Activadas' : 'Activar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacidad */}
          {activeSection === 'privacy' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Privacidad</h2>
              <p className="text-gray-500">Opciones de privacidad próximamente.</p>
            </div>
          )}

          {/* Ayuda */}
          {activeSection === 'help' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Ayuda</h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  FitApp v1.0.0 - Tu asistente de fitness con IA
                </p>
                <p className="text-sm text-gray-500">
                  Si tienes problemas, contacta con soporte.
                </p>
              </div>
            </div>
          )}

          {/* Default */}
          {!activeSection && (
            <div className="card text-center py-12">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Selecciona una sección para ver los ajustes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
