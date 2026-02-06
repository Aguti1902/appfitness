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

export function WorkoutsPage() {
  const { user } = useAuthStore();
  const { workouts, fetchWorkouts, getPersonalRecords, isLoading } = useWorkoutStore();
  const [activeTab, setActiveTab] = useState<Tab>('routine');
  const [filter, setFilter] = useState<TrainingType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [activeWorkout, setActiveWorkout] = useState<DayWorkout | null>(null);
  const [exerciseWeights, setExerciseWeights] = useState<Record<string, { weight: string; reps: string; completed: boolean }[]>>({});

  useEffect(() => {
    // Cargar plan generado desde localStorage
    const savedPlan = localStorage.getItem('fitapp-generated-plan');
    if (savedPlan) {
      try {
        setGeneratedPlan(JSON.parse(savedPlan));
      } catch (e) {
        console.error('Error loading plan:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchWorkouts(user.id);
    }
  }, [user?.id]);

  const personalRecords = getPersonalRecords();
  const workoutPlan = generatedPlan?.workout_plan;
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
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
    // Inicializar pesos para cada ejercicio
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
          <p className="text-gray-500">Tu plan de entrenamiento personalizado</p>
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

      {/* Routine Tab - Mi rutina semanal */}
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
                  
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(index)}
                      className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors relative ${
                        selectedDay === index
                          ? isRestDay ? 'bg-gray-600 text-white' : 'bg-primary-600 text-white'
                          : isRestDay 
                            ? 'bg-gray-100 text-gray-400' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                      {isToday && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Today's Workout */}
              {todayWorkout && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{todayWorkout.title}</h3>
                      <p className="text-sm text-gray-500">
                        {todayWorkout.is_rest_day ? 'Día de descanso' : `${todayWorkout.duration_minutes} minutos`}
                      </p>
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
                      <p className="text-gray-600">{todayWorkout.notes || 'Descansa, tu cuerpo lo necesita para recuperarse y crecer.'}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Puedes hacer actividad ligera como caminar o estiramientos.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayWorkout.exercises?.map((exercise, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                            <span className="text-sm text-primary-600 font-medium">
                              {exercise.sets} x {exercise.reps}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                            {exercise.weight_recommendation && (
                              <span className="bg-white px-2 py-1 rounded">
                                💪 {exercise.weight_recommendation}
                              </span>
                            )}
                            <span className="bg-white px-2 py-1 rounded">
                              ⏱️ {exercise.rest_seconds}s descanso
                            </span>
                            {exercise.alternatives && exercise.alternatives.length > 0 && (
                              <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                                Alt: {exercise.alternatives.join(', ')}
                              </span>
                            )}
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
              description="Completa el onboarding para que la IA genere tu rutina de entrenamiento personalizada"
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
              <option value="crossfit">CrossFit</option>
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
              title="No hay entrenamientos registrados"
              description="Empieza a registrar tus entrenamientos para ver tu historial"
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
          {Object.keys(personalRecords).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(personalRecords).map(([exercise, pr]) => (
                <div key={exercise} className="card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{exercise}</p>
                      <p className="text-sm text-gray-500">{new Date(pr.date).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-600">{pr.weight} kg</p>
                    <p className="text-sm text-gray-500">{pr.reps} reps</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Trophy}
              title="Sin récords aún"
              description="Registra tus entrenamientos con pesos para ver tus récords personales aquí"
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
                    {exercise.sets} series x {exercise.reps} reps
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
                          placeholder={exercise.weight_recommendation || '0'}
                          className="input text-center py-2"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(exercise.name, setIndex, 'reps', e.target.value)}
                          className="input text-center py-2"
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
                    ⏱️ Descanso: {exercise.rest_seconds}s entre series
                  </p>
                )}
              </div>
            ))}
            
            <button 
              onClick={() => {
                // TODO: Guardar el entrenamiento
                alert('Entrenamiento guardado!');
                setActiveWorkout(null);
              }}
              className="w-full btn btn-primary"
            >
              <CheckCircle className="w-5 h-5" />
              Finalizar entrenamiento
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
        workout.type === 'crossfit' 
          ? 'bg-orange-100 text-orange-600' 
          : workout.type === 'running'
          ? 'bg-blue-100 text-blue-600'
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
