import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Dumbbell, 
  Calendar,
  Search,
  Trophy,
  Clock,
  ChevronRight,
  Play,
  CheckCircle,
  Flame
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import type { Workout, TrainingType, GeneratedPlan, DayWorkout } from '../../types';

type Tab = 'routine' | 'history' | 'prs';

// Mapeo de grupos musculares para split
const MUSCLE_GROUPS = {
  push: { name: 'Push (Pecho/Hombro/Tríceps)', color: 'bg-red-100 text-red-600', emoji: '💪' },
  pull: { name: 'Pull (Espalda/Bíceps)', color: 'bg-blue-100 text-blue-600', emoji: '🔙' },
  legs: { name: 'Pierna', color: 'bg-green-100 text-green-600', emoji: '🦵' },
  full: { name: 'Full Body', color: 'bg-purple-100 text-purple-600', emoji: '🏋️' },
  cardio: { name: 'Cardio', color: 'bg-orange-100 text-orange-600', emoji: '🏃' },
  rest: { name: 'Descanso', color: 'bg-gray-100 text-gray-500', emoji: '😴' }
};

export function WorkoutsPage() {
  const { user } = useAuthStore();
  const { workouts, fetchWorkouts, isLoading } = useWorkoutStore();
  const [activeTab, setActiveTab] = useState<Tab>('routine');
  const [filter, setFilter] = useState<TrainingType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [activeWorkout, setActiveWorkout] = useState<DayWorkout | null>(null);
  const [exerciseWeights, setExerciseWeights] = useState<Record<string, { weight: string; reps: string; completed: boolean }[]>>({});
  const [personalRecords, setPersonalRecords] = useState<Record<string, { weight: number; reps: number; date: string }>>({});

  useEffect(() => {
    const savedPlan = localStorage.getItem('fitapp-generated-plan');
    if (savedPlan) {
      try {
        setGeneratedPlan(JSON.parse(savedPlan));
      } catch (e) {
        console.error('Error loading plan:', e);
      }
    }

    // Cargar PRs desde localStorage
    const savedPRs = localStorage.getItem('fitapp-personal-records');
    if (savedPRs) {
      try {
        setPersonalRecords(JSON.parse(savedPRs));
      } catch (e) {
        console.error('Error loading PRs:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchWorkouts(user.id);
    }
  }, [user?.id]);

  const workoutPlan = generatedPlan?.workout_plan;
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const todayWorkout = workoutPlan?.days?.[selectedDay];

  const filteredWorkouts = workouts.filter(w => {
    const matchesFilter = filter === 'all' || w.type === filter;
    const matchesSearch = searchQuery === '' || 
      w.exercises.some(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const groupedWorkouts = filteredWorkouts.reduce((acc, workout) => {
    const date = new Date(workout.workout_date);
    const monthKey = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(workout);
    return acc;
  }, {} as Record<string, Workout[]>);

  const startWorkout = (day: DayWorkout) => {
    setActiveWorkout(day);
    const initialWeights: Record<string, { weight: string; reps: string; completed: boolean }[]> = {};
    day.exercises?.forEach(ex => {
      initialWeights[ex.name] = Array(ex.sets).fill(null).map(() => ({
        weight: '',
        reps: ex.reps?.split('-')[0] || '10',
        completed: false
      }));
    });
    setExerciseWeights(initialWeights);
  };

  const updateSet = (exerciseName: string, setIndex: number, field: 'weight' | 'reps' | 'completed', value: string | boolean) => {
    setExerciseWeights(prev => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map((set, i) => 
        i === setIndex ? { ...set, [field]: value } : set
      )
    }));
  };

  const finishWorkout = () => {
    // Guardar PRs basados en los pesos registrados
    const newPRs = { ...personalRecords };
    let hasNewPR = false;

    Object.entries(exerciseWeights).forEach(([exerciseName, sets]) => {
      sets.forEach(set => {
        if (set.completed && set.weight) {
          const weight = parseFloat(set.weight);
          const reps = parseInt(set.reps);
          const currentPR = newPRs[exerciseName];
          
          if (!currentPR || weight > currentPR.weight || 
              (weight === currentPR.weight && reps > currentPR.reps)) {
            newPRs[exerciseName] = {
              weight,
              reps,
              date: new Date().toISOString()
            };
            hasNewPR = true;
          }
        }
      });
    });

    if (hasNewPR) {
      setPersonalRecords(newPRs);
      localStorage.setItem('fitapp-personal-records', JSON.stringify(newPRs));
    }

    setActiveWorkout(null);
  };

  // Obtener ejercicios de la rutina para mostrar en PRs
  const routineExercises = new Set<string>();
  workoutPlan?.days?.forEach(day => {
    day.exercises?.forEach(ex => {
      if (!day.is_rest_day) {
        routineExercises.add(ex.name);
      }
    });
  });

  // Filtrar PRs solo de ejercicios de la rutina
  const routinePRs = Object.entries(personalRecords)
    .filter(([exercise]) => routineExercises.has(exercise));

  const getWorkoutType = (workout: DayWorkout): keyof typeof MUSCLE_GROUPS => {
    if (workout.is_rest_day) return 'rest';
    const title = workout.title?.toLowerCase() || '';
    if (title.includes('push') || title.includes('pecho') || title.includes('hombro')) return 'push';
    if (title.includes('pull') || title.includes('espalda') || title.includes('bíceps')) return 'pull';
    if (title.includes('pierna') || title.includes('leg')) return 'legs';
    if (title.includes('cardio') || title.includes('running') || title.includes('correr')) return 'cardio';
    return 'full';
  };

  const tabs = [
    { id: 'routine', label: 'Mi Rutina', icon: Dumbbell },
    { id: 'history', label: 'Historial', icon: Calendar },
    { id: 'prs', label: 'Récords', icon: Trophy },
  ] as const;

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entrenamientos</h1>
          <p className="text-gray-500">Tu rutina de gimnasio personalizada</p>
        </div>
        <Link to="/workouts/new" className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nuevo entreno
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Routine Tab */}
      {activeTab === 'routine' && (
        <div>
          {workoutPlan && workoutPlan.days?.length > 0 ? (
            <>
              {/* Plan Info */}
              <div className="card mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{workoutPlan.name}</h3>
                    <p className="text-sm text-gray-500">{workoutPlan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-600 flex items-center gap-1">
                      <Flame className="w-5 h-5" />
                      {workoutPlan.estimated_calories_burned_weekly}
                    </p>
                    <p className="text-xs text-gray-500">kcal/semana</p>
                  </div>
                </div>
              </div>

              {/* Day Selector */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {dayNames.map((day, index) => {
                  const dayData = workoutPlan.days?.[index];
                  const isRestDay = dayData?.is_rest_day;
                  const isToday = index === new Date().getDay();
                  const workoutType = dayData ? getWorkoutType(dayData) : 'rest';
                  
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(index)}
                      className={`flex flex-col items-center px-4 py-2 rounded-xl transition-all min-w-[60px] ${
                        selectedDay === index
                          ? 'bg-primary-600 text-white shadow-lg'
                          : isRestDay 
                            ? 'bg-gray-100 text-gray-400' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-xs font-medium">{day}</span>
                      {!isRestDay && selectedDay !== index && (
                        <span className="text-lg mt-1">{MUSCLE_GROUPS[workoutType].emoji}</span>
                      )}
                      {isToday && (
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Today's Workout */}
              {todayWorkout && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                        MUSCLE_GROUPS[getWorkoutType(todayWorkout)].color
                      }`}>
                        {MUSCLE_GROUPS[getWorkoutType(todayWorkout)].emoji}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{todayWorkout.title}</h3>
                        <p className="text-sm text-gray-500">
                          {todayWorkout.is_rest_day ? 'Día de descanso' : `${todayWorkout.duration_minutes} minutos`}
                        </p>
                      </div>
                    </div>
                    {!todayWorkout.is_rest_day && (
                      <button 
                        onClick={() => startWorkout(todayWorkout)}
                        className="btn btn-primary"
                      >
                        <Play className="w-5 h-5" />
                        Empezar
                      </button>
                    )}
                  </div>

                  {todayWorkout.is_rest_day ? (
                    <div className="bg-gray-50 rounded-xl p-6 text-center">
                      <p className="text-4xl mb-3">😴</p>
                      <p className="text-gray-600">{todayWorkout.notes || 'Descansa, tu cuerpo lo necesita.'}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Puedes hacer stretching o cardio suave.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayWorkout.exercises?.map((exercise, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                            <span className="text-sm text-primary-600 font-semibold">
                              {exercise.sets} x {exercise.reps}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {exercise.weight_recommendation && (
                              <span className="bg-white px-2 py-1 rounded text-gray-600">
                                💪 {exercise.weight_recommendation}
                              </span>
                            )}
                            <span className="bg-white px-2 py-1 rounded text-gray-600">
                              ⏱️ {exercise.rest_seconds}s descanso
                            </span>
                          </div>
                          {exercise.notes && (
                            <p className="text-xs text-gray-500 mt-2">📝 {exercise.notes}</p>
                          )}
                        </div>
                      ))}
                      
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={Dumbbell}
              title="Rutina no generada"
              description="Completa el onboarding para que la IA genere tu rutina de gimnasio"
            />
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card py-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {workouts.filter(w => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(w.workout_date) >= weekAgo;
                }).length}
              </p>
              <p className="text-sm text-gray-500">Esta semana</p>
            </div>
            <div className="card py-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {workouts.filter(w => {
                  const monthStart = new Date();
                  monthStart.setDate(1);
                  return new Date(w.workout_date) >= monthStart;
                }).length}
              </p>
              <p className="text-sm text-gray-500">Este mes</p>
            </div>
            <div className="card py-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{workouts.length}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar ejercicio..."
                className="input pl-10"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as TrainingType | 'all')}
              className="input w-auto"
            >
              <option value="all">Todos</option>
              <option value="gym">Gimnasio</option>
              <option value="running">Running</option>
            </select>
          </div>

          {/* Workouts List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredWorkouts.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Sin entrenamientos"
              description="Empieza a registrar tus entrenamientos"
              action={{
                label: "Registrar entreno",
                onClick: () => window.location.href = '/workouts/new'
              }}
            />
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedWorkouts).map(([month, monthWorkouts]) => (
                <div key={month}>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 capitalize">
                    {month}
                  </h3>
                  <div className="space-y-3">
                    {monthWorkouts.map((workout) => (
                      <WorkoutCard key={workout.id} workout={workout} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PRs Tab */}
      {activeTab === 'prs' && (
        <div>
          {routinePRs.length > 0 ? (
            <>
              <div className="card bg-yellow-50 border-yellow-200 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-yellow-800">Tus récords personales</p>
                    <p className="text-sm text-yellow-700">
                      Basados en los ejercicios de tu rutina de gimnasio
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {routinePRs.map(([exercise, pr]) => (
                  <div key={exercise} className="card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{exercise}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(pr.date).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary-600">{pr.weight} kg</p>
                      <p className="text-sm text-gray-500">{pr.reps} reps</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon={Trophy}
              title="Sin récords aún"
              description="Completa entrenamientos y registra tus pesos para ver tus récords aquí"
            />
          )}
        </div>
      )}

      {/* Active Workout Modal */}
      <Modal 
        isOpen={!!activeWorkout} 
        onClose={() => setActiveWorkout(null)} 
        title={activeWorkout?.title || 'Entrenamiento'}
        size="lg"
      >
        {activeWorkout && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {activeWorkout.exercises?.map((exercise, exIndex) => (
              <div key={exIndex} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{exercise.name}</h4>
                  <span className="text-sm text-gray-500">
                    {exercise.sets} x {exercise.reps}
                  </span>
                </div>
                
                {/* Sets */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-2">
                    <div className="col-span-2">Serie</div>
                    <div className="col-span-4">Peso (kg)</div>
                    <div className="col-span-4">Reps</div>
                    <div className="col-span-2">✓</div>
                  </div>
                  
                  {exerciseWeights[exercise.name]?.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-2 text-center font-medium text-gray-700">
                        {setIndex + 1}
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          value={set.weight}
                          onChange={(e) => updateSet(exercise.name, setIndex, 'weight', e.target.value)}
                          placeholder={exercise.weight_recommendation?.replace(/[^0-9]/g, '') || '0'}
                          className="input text-center py-2 text-gray-900"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(exercise.name, setIndex, 'reps', e.target.value)}
                          className="input text-center py-2 text-gray-900"
                        />
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <button
                          onClick={() => updateSet(exercise.name, setIndex, 'completed', !set.completed)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            set.completed 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {exercise.rest_seconds && (
                  <p className="text-xs text-gray-500 mt-2">
                    ⏱️ {exercise.rest_seconds}s descanso
                  </p>
                )}
              </div>
            ))}
            
            <button 
              onClick={finishWorkout}
              className="w-full btn btn-primary"
            >
              <CheckCircle className="w-5 h-5" />
              Finalizar y guardar récords
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function WorkoutCard({ workout }: { workout: Workout }) {
  return (
    <Link 
      to={`/workouts/${workout.id}`}
      className="card-hover flex items-center gap-4"
    >
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
        workout.type === 'running'
        ? 'bg-orange-100 text-orange-600'
        : 'bg-primary-100 text-primary-600'
      }`}>
        <Dumbbell className="w-7 h-7" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-gray-900 capitalize">{workout.type}</h4>
        </div>
        <p className="text-sm text-gray-500 truncate">
          {workout.exercises.map(e => e.name).join(', ')}
        </p>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(workout.workout_date).toLocaleDateString('es-ES', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short' 
            })}
          </span>
          {workout.duration_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {workout.duration_minutes} min
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-gray-400" />
    </Link>
  );
}
