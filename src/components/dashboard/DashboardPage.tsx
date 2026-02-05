import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Dumbbell, 
  Flame, 
  TrendingUp, 
  ChevronRight,
  Zap,
  Target,
  Utensils
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useNutritionStore } from '../../stores/nutritionStore';
import { useScheduleStore } from '../../stores/scheduleStore';
import { StatCard } from '../ui/StatCard';
import { generateWorkoutRecommendation } from '../../lib/openai';
import type { AIRecommendation } from '../../types';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { workouts, fetchWorkouts, getWorkoutStats } = useWorkoutStore();
  const { fetchMeals, getTodayNutrition } = useNutritionStore();
  const { fetchSchedules, getTodaySchedules } = useScheduleStore();
  
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchWorkouts(user.id);
      fetchMeals(user.id, new Date().toISOString().split('T')[0]);
      fetchSchedules(user.id);
    }
  }, [user?.id]);

  const stats = user ? getWorkoutStats(user.id) : { thisWeek: 0, thisMonth: 0, total: 0, streak: 0 };
  const todayNutrition = getTodayNutrition();
  const todaySchedules = getTodaySchedules();
  const targetCalories = user?.goals?.daily_calories || 2000;

  const handleGetRecommendation = async () => {
    if (!user) return;
    setLoadingRec(true);
    
    const recentWorkouts = workouts
      .slice(0, 5)
      .map(w => `${w.type}: ${w.exercises.map(e => e.name).join(', ')}`);
    
    const rec = await generateWorkoutRecommendation(
      user.goals,
      user.training_types,
      recentWorkouts
    );
    
    setRecommendation(rec);
    setLoadingRec(false);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {greeting()}, {user?.name?.split(' ')[0] || 'Usuario'}
        </h1>
        <p className="text-gray-500">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Entrenamientos"
          value={stats.thisWeek}
          subtitle="Esta semana"
          icon={Dumbbell}
          color="primary"
        />
        <StatCard
          title="Racha actual"
          value={`${stats.streak} días`}
          subtitle="Sigue así"
          icon={Flame}
          color="orange"
        />
        <StatCard
          title="Calorías hoy"
          value={todayNutrition.calories}
          subtitle={`/ ${targetCalories} kcal`}
          icon={Utensils}
          color="blue"
        />
        <StatCard
          title="Entrenamientos"
          value={stats.total}
          subtitle="Total"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Recommendation */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Recomendación IA</h2>
                  <p className="text-sm text-gray-500">Entrenamiento personalizado</p>
                </div>
              </div>
              <button
                onClick={handleGetRecommendation}
                disabled={loadingRec}
                className="btn btn-outline text-sm"
              >
                {loadingRec ? 'Generando...' : 'Generar nuevo'}
              </button>
            </div>

            {recommendation ? (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{recommendation.title}</h3>
                <div className="prose prose-sm text-gray-600 whitespace-pre-wrap">
                  {recommendation.content}
                </div>
                {recommendation.reasoning && (
                  <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-200">
                    <strong>Por qué:</strong> {recommendation.reasoning}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  Pulsa "Generar nuevo" para obtener una recomendación de entrenamiento personalizada
                </p>
              </div>
            )}
          </div>

          {/* Recent Workouts */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Entrenamientos recientes</h2>
              <Link to="/workouts" className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1">
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {workouts.length > 0 ? (
              <div className="space-y-3">
                {workouts.slice(0, 3).map((workout) => (
                  <div key={workout.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      workout.type === 'crossfit' 
                        ? 'bg-orange-100 text-orange-600' 
                        : 'bg-primary-100 text-primary-600'
                    }`}>
                      <Dumbbell className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 capitalize">{workout.type}</p>
                      <p className="text-sm text-gray-500">
                        {workout.exercises.length} ejercicios · {new Date(workout.workout_date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    {workout.duration_minutes && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{workout.duration_minutes} min</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No hay entrenamientos registrados aún
              </p>
            )}
          </div>

          {/* Nutrition Summary */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Nutrición de hoy</h2>
              <Link to="/nutrition" className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1">
                Ver detalles <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="#e5e7eb"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="#22c55e"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${(todayNutrition.calories / targetCalories) * 175.9} 175.9`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                    {Math.round((todayNutrition.calories / targetCalories) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">Calorías</p>
                <p className="text-sm font-medium">{todayNutrition.calories} kcal</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">{Math.round(todayNutrition.protein)}g</span>
                </div>
                <p className="text-xs text-gray-500">Proteína</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-yellow-600">{Math.round(todayNutrition.carbs)}g</span>
                </div>
                <p className="text-xs text-gray-500">Carbos</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-red-600">{Math.round(todayNutrition.fat)}g</span>
                </div>
                <p className="text-xs text-gray-500">Grasas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Hoy</h2>
              <Link to="/schedule" className="text-primary-600 text-sm font-medium hover:text-primary-700">
                Editar
              </Link>
            </div>

            {todaySchedules.length > 0 ? (
              <div className="space-y-3">
                {todaySchedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      schedule.activity_type === 'meal'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-primary-100 text-primary-600'
                    }`}>
                      {schedule.activity_type === 'meal' 
                        ? <Utensils className="w-5 h-5" />
                        : <Dumbbell className="w-5 h-5" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{schedule.title}</p>
                      <p className="text-xs text-gray-500">{schedule.scheduled_time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                No hay actividades programadas para hoy
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
            <div className="space-y-2">
              <Link
                to="/workouts/new"
                className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
              >
                <Dumbbell className="w-5 h-5" />
                <span className="font-medium">Registrar entreno</span>
              </Link>
              <Link
                to="/nutrition"
                className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
              >
                <Utensils className="w-5 h-5" />
                <span className="font-medium">Añadir comida</span>
              </Link>
              <Link
                to="/progress"
                className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Registrar peso</span>
              </Link>
            </div>
          </div>

          {/* Goals */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Tu objetivo</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900 capitalize">
                  {user?.goals?.primary === 'lose_weight' && 'Perder peso'}
                  {user?.goals?.primary === 'gain_muscle' && 'Ganar músculo'}
                  {user?.goals?.primary === 'maintain' && 'Mantener'}
                  {user?.goals?.primary === 'improve_endurance' && 'Mejorar resistencia'}
                </p>
                {user?.goals?.current_weight && user?.goals?.target_weight && (
                  <p className="text-sm text-gray-500">
                    {user.goals.current_weight}kg → {user.goals.target_weight}kg
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
