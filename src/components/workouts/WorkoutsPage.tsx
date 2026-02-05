import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Dumbbell, 
  Calendar,
  Search,
  Trophy,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import type { Workout, TrainingType } from '../../types';

export function WorkoutsPage() {
  const { user } = useAuthStore();
  const { workouts, fetchWorkouts, getPersonalRecords, isLoading } = useWorkoutStore();
  const [filter, setFilter] = useState<TrainingType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPRs, setShowPRs] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchWorkouts(user.id);
    }
  }, [user?.id]);

  const personalRecords = getPersonalRecords();

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

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entrenamientos</h1>
          <p className="text-gray-500">Registra y revisa tus entrenamientos</p>
        </div>
        <Link to="/workouts/new" className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nuevo entreno
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card py-4">
          <p className="text-sm text-gray-500">Esta semana</p>
          <p className="text-2xl font-bold text-gray-900">
            {workouts.filter(w => {
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return new Date(w.workout_date) >= weekAgo;
            }).length}
          </p>
        </div>
        <div className="card py-4">
          <p className="text-sm text-gray-500">Este mes</p>
          <p className="text-2xl font-bold text-gray-900">
            {workouts.filter(w => {
              const monthStart = new Date();
              monthStart.setDate(1);
              return new Date(w.workout_date) >= monthStart;
            }).length}
          </p>
        </div>
        <div className="card py-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{workouts.length}</p>
        </div>
        <button 
          onClick={() => setShowPRs(true)}
          className="card py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <p className="text-sm text-gray-500">PRs registrados</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-primary-600">
              {Object.keys(personalRecords).length}
            </p>
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
        </button>
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
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as TrainingType | 'all')}
            className="input w-auto"
          >
            <option value="all">Todos los tipos</option>
            <option value="gym">Gimnasio</option>
            <option value="crossfit">CrossFit</option>
            <option value="running">Running</option>
            <option value="swimming">Natación</option>
            <option value="yoga">Yoga</option>
            <option value="other">Otro</option>
          </select>
        </div>
      </div>

      {/* Workouts List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando entrenamientos...</p>
        </div>
      ) : filteredWorkouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No hay entrenamientos"
          description={searchQuery || filter !== 'all' 
            ? "No se encontraron entrenamientos con esos filtros"
            : "Empieza registrando tu primer entrenamiento"
          }
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

      {/* PRs Modal */}
      <Modal isOpen={showPRs} onClose={() => setShowPRs(false)} title="Récords Personales" size="lg">
        {Object.keys(personalRecords).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(personalRecords).map(([exercise, pr]) => (
              <div key={exercise} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 capitalize">{exercise}</p>
                  <p className="text-sm text-gray-500">{new Date(pr.date).toLocaleDateString('es-ES')}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-600">{pr.weight} kg</p>
                  <p className="text-sm text-gray-500">{pr.reps} reps</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            Aún no tienes récords registrados. Sigue entrenando y registrando tus pesos.
          </p>
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
          <span className="badge badge-info capitalize">{workout.type}</span>
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
          <span>{workout.exercises.length} ejercicios</span>
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-gray-400" />
    </Link>
  );
}
