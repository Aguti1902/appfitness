import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trash2, 
  Clock,
  Dumbbell,
  Check
} from 'lucide-react';
import { useWorkoutStore } from '../../stores/workoutStore';
import { Modal } from '../ui/Modal';

export function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workouts, deleteWorkout } = useWorkoutStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const workout = workouts.find(w => w.id === id);

  if (!workout) {
    return (
      <div className="page-content">
        <div className="text-center py-12">
          <p className="text-gray-500">Entrenamiento no encontrado</p>
          <button
            onClick={() => navigate('/workouts')}
            className="btn btn-primary mt-4"
          >
            Volver a entrenamientos
          </button>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteWorkout(workout.id);
    navigate('/workouts');
  };

  const totalVolume = workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.reduce((setTotal, set) => {
      return setTotal + (set.weight || 0) * (set.reps || 0);
    }, 0);
  }, 0);

  const completedSets = workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.filter(s => s.completed).length;
  }, 0);

  const totalSets = workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.length;
  }, 0);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/workouts')}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {workout.type}
            </h1>
            <p className="text-gray-500">
              {new Date(workout.workout_date).toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-secondary text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card py-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Dumbbell className="w-4 h-4" />
            <span className="text-sm">Ejercicios</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{workout.exercises.length}</p>
        </div>
        <div className="card py-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Check className="w-4 h-4" />
            <span className="text-sm">Series</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{completedSets}/{totalSets}</p>
        </div>
        <div className="card py-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Duración</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {workout.duration_minutes ? `${workout.duration_minutes} min` : '-'}
          </p>
        </div>
        <div className="card py-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <span className="text-sm">Volumen total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalVolume.toLocaleString()} kg</p>
        </div>
      </div>

      {/* Notes */}
      {workout.notes && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Notas</h3>
          <p className="text-gray-600">{workout.notes}</p>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-4">
        {workout.exercises.map((exercise, index) => (
          <div key={exercise.id} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 font-bold">
                {index + 1}
              </div>
              <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                    <th className="pb-2 w-16">Serie</th>
                    <th className="pb-2">Peso</th>
                    <th className="pb-2">Reps</th>
                    <th className="pb-2 w-20 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.sets.map((set, setIndex) => (
                    <tr 
                      key={setIndex} 
                      className={`border-b border-gray-50 ${set.completed ? 'bg-green-50' : ''}`}
                    >
                      <td className="py-3">
                        <span className="w-8 h-8 bg-gray-100 rounded-full inline-flex items-center justify-center text-sm font-medium">
                          {setIndex + 1}
                        </span>
                      </td>
                      <td className="py-3 font-medium">
                        {set.weight ? `${set.weight} kg` : '-'}
                      </td>
                      <td className="py-3 font-medium">
                        {set.reps || '-'}
                      </td>
                      <td className="py-3 text-center">
                        {set.completed ? (
                          <span className="w-6 h-6 bg-green-500 rounded-full inline-flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </span>
                        ) : (
                          <span className="w-6 h-6 bg-gray-200 rounded-full inline-flex items-center justify-center">
                            <span className="w-2 h-2 bg-gray-400 rounded-full" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Exercise summary */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-sm text-gray-500">
              <span>
                <strong className="text-gray-900">
                  {exercise.sets.filter(s => s.completed).length}
                </strong> / {exercise.sets.length} series
              </span>
              <span>
                Volumen: <strong className="text-gray-900">
                  {exercise.sets.reduce((t, s) => t + (s.weight || 0) * (s.reps || 0), 0).toLocaleString()} kg
                </strong>
              </span>
              {exercise.sets.some(s => s.weight) && (
                <span>
                  Peso máx: <strong className="text-gray-900">
                    {Math.max(...exercise.sets.map(s => s.weight || 0))} kg
                  </strong>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Modal */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title="Eliminar entrenamiento"
      >
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que quieres eliminar este entrenamiento? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="btn btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn btn-danger flex-1"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
