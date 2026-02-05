import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save,
  Dumbbell,
  Check,
  X
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import type { Exercise, ExerciseSet, TrainingType } from '../../types';

const COMMON_EXERCISES = {
  gym: [
    'Press de banca', 'Press inclinado', 'Sentadilla', 'Peso muerto',
    'Press militar', 'Dominadas', 'Remo con barra', 'Curl de bíceps',
    'Tríceps en polea', 'Extensión de cuádriceps', 'Curl femoral',
    'Elevaciones laterales', 'Prensa de pierna', 'Fondos'
  ],
  crossfit: [
    'Back Squat', 'Front Squat', 'Clean', 'Snatch', 'Thruster',
    'Wall Balls', 'Box Jumps', 'Burpees', 'Pull-ups', 'Toes-to-bar',
    'Double Unders', 'Kettlebell Swings', 'Rowing', 'Assault Bike'
  ]
};

export function NewWorkoutPage() {
  const { user } = useAuthStore();
  const { addWorkout } = useWorkoutStore();
  const navigate = useNavigate();

  const [type, setType] = useState<TrainingType>(
    user?.training_types?.[0] || 'gym'
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [customExercise, setCustomExercise] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addExercise = (name: string) => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name,
      sets: [{ reps: 0, weight: 0, completed: false }]
    };
    setExercises([...exercises, newExercise]);
    setShowExerciseModal(false);
    setCustomExercise('');
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(e => {
      if (e.id === exerciseId) {
        const lastSet = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [...e.sets, { 
            reps: lastSet?.reps || 0, 
            weight: lastSet?.weight || 0, 
            completed: false 
          }]
        };
      }
      return e;
    }));
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    setExercises(exercises.map(e => {
      if (e.id === exerciseId) {
        return {
          ...e,
          sets: e.sets.filter((_, i) => i !== setIndex)
        };
      }
      return e;
    }));
  };

  const updateSet = (exerciseId: string, setIndex: number, data: Partial<ExerciseSet>) => {
    setExercises(exercises.map(e => {
      if (e.id === exerciseId) {
        return {
          ...e,
          sets: e.sets.map((s, i) => i === setIndex ? { ...s, ...data } : s)
        };
      }
      return e;
    }));
  };

  const toggleSetComplete = (exerciseId: string, setIndex: number) => {
    setExercises(exercises.map(e => {
      if (e.id === exerciseId) {
        return {
          ...e,
          sets: e.sets.map((s, i) => 
            i === setIndex ? { ...s, completed: !s.completed } : s
          )
        };
      }
      return e;
    }));
  };

  const handleSave = async () => {
    if (!user || exercises.length === 0) return;
    
    setIsSaving(true);
    
    await addWorkout({
      user_id: user.id,
      type,
      workout_date: date,
      exercises,
      notes: notes || undefined,
      duration_minutes: duration ? parseInt(duration) : undefined
    });
    
    navigate('/workouts');
  };

  const suggestedExercises = type === 'crossfit' ? COMMON_EXERCISES.crossfit : COMMON_EXERCISES.gym;

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Nuevo entrenamiento</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || exercises.length === 0}
          className="btn btn-primary"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {/* Workout Info */}
      <div className="card mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de entreno
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TrainingType)}
              className="input"
            >
              <option value="gym">Gimnasio</option>
              <option value="crossfit">CrossFit</option>
              <option value="running">Running</option>
              <option value="swimming">Natación</option>
              <option value="yoga">Yoga</option>
              <option value="other">Otro</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración (min)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional..."
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4 mb-6">
        {exercises.map((exercise, exerciseIndex) => (
          <div key={exercise.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 font-bold">
                  {exerciseIndex + 1}
                </div>
                <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
              </div>
              <button
                onClick={() => removeExercise(exercise.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Sets Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="pb-2 w-16">Serie</th>
                    <th className="pb-2">Peso (kg)</th>
                    <th className="pb-2">Reps</th>
                    <th className="pb-2 w-20 text-center">Hecho</th>
                    <th className="pb-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.sets.map((set, setIndex) => (
                    <tr key={setIndex} className={set.completed ? 'bg-green-50' : ''}>
                      <td className="py-2">
                        <span className="w-8 h-8 bg-gray-100 rounded-full inline-flex items-center justify-center text-sm font-medium">
                          {setIndex + 1}
                        </span>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          value={set.weight || ''}
                          onChange={(e) => updateSet(exercise.id, setIndex, { weight: parseFloat(e.target.value) || 0 })}
                          className="input py-2 w-24"
                          placeholder="0"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) => updateSet(exercise.id, setIndex, { reps: parseInt(e.target.value) || 0 })}
                          className="input py-2 w-20"
                          placeholder="0"
                        />
                      </td>
                      <td className="py-2 text-center">
                        <button
                          onClick={() => toggleSetComplete(exercise.id, setIndex)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            set.completed 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      </td>
                      <td className="py-2">
                        {exercise.sets.length > 1 && (
                          <button
                            onClick={() => removeSet(exercise.id, setIndex)}
                            className="p-2 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => addSet(exercise.id)}
              className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Añadir serie
            </button>
          </div>
        ))}
      </div>

      {/* Add Exercise Button */}
      <button
        onClick={() => setShowExerciseModal(true)}
        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Añadir ejercicio
      </button>

      {/* Exercise Modal */}
      {showExerciseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Añadir ejercicio</h3>
              <button
                onClick={() => setShowExerciseModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="relative mb-4">
                <input
                  type="text"
                  value={customExercise}
                  onChange={(e) => setCustomExercise(e.target.value)}
                  placeholder="Escribir ejercicio personalizado..."
                  className="input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customExercise.trim()) {
                      addExercise(customExercise.trim());
                    }
                  }}
                />
                {customExercise && (
                  <button
                    onClick={() => addExercise(customExercise.trim())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary py-1.5 px-3 text-sm"
                  >
                    Añadir
                  </button>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mb-3">Ejercicios sugeridos:</p>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {suggestedExercises
                  .filter(e => !exercises.some(ex => ex.name === e))
                  .filter(e => !customExercise || e.toLowerCase().includes(customExercise.toLowerCase()))
                  .map((name) => (
                    <button
                      key={name}
                      onClick={() => addExercise(name)}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 flex items-center gap-3"
                    >
                      <Dumbbell className="w-5 h-5 text-gray-400" />
                      {name}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
