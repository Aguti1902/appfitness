import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Workout, Exercise, ExerciseSet } from '../types';

interface WorkoutState {
  workouts: Workout[];
  currentWorkout: Workout | null;
  isLoading: boolean;
  
  // Actions
  fetchWorkouts: (userId: string) => Promise<void>;
  addWorkout: (workout: Omit<Workout, 'id' | 'created_at'>) => Promise<{ error?: string }>;
  updateWorkout: (id: string, data: Partial<Workout>) => Promise<{ error?: string }>;
  deleteWorkout: (id: string) => Promise<{ error?: string }>;
  setCurrentWorkout: (workout: Workout | null) => void;
  
  // Exercise helpers
  addExerciseToWorkout: (exercise: Exercise) => void;
  updateExerciseInWorkout: (exerciseId: string, data: Partial<Exercise>) => void;
  removeExerciseFromWorkout: (exerciseId: string) => void;
  addSetToExercise: (exerciseId: string, set: ExerciseSet) => void;
  updateSetInExercise: (exerciseId: string, setIndex: number, data: Partial<ExerciseSet>) => void;
  
  // Stats
  getWorkoutStats: (userId: string) => { thisWeek: number; thisMonth: number; total: number; streak: number };
  getPersonalRecords: () => Record<string, { weight: number; reps: number; date: string }>;
}

// Demo workouts
const DEMO_WORKOUTS: Workout[] = [
  {
    id: '1',
    user_id: 'demo-user-id',
    type: 'gym',
    workout_date: new Date().toISOString().split('T')[0],
    duration_minutes: 75,
    exercises: [
      {
        id: 'e1',
        name: 'Press de banca',
        sets: [
          { reps: 10, weight: 60, completed: true },
          { reps: 8, weight: 70, completed: true },
          { reps: 6, weight: 80, completed: true },
          { reps: 6, weight: 80, completed: true }
        ]
      },
      {
        id: 'e2',
        name: 'Press inclinado mancuernas',
        sets: [
          { reps: 12, weight: 24, completed: true },
          { reps: 10, weight: 26, completed: true },
          { reps: 10, weight: 26, completed: true }
        ]
      },
      {
        id: 'e3',
        name: 'Fondos en paralelas',
        sets: [
          { reps: 15, weight: 0, completed: true },
          { reps: 12, weight: 10, completed: true },
          { reps: 10, weight: 10, completed: true }
        ]
      }
    ],
    notes: 'Buen entrenamiento, subí peso en press de banca',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'demo-user-id',
    type: 'gym',
    workout_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    duration_minutes: 60,
    exercises: [
      {
        id: 'e4',
        name: 'Back Squat',
        sets: [
          { reps: 5, weight: 100, completed: true },
          { reps: 5, weight: 100, completed: true },
          { reps: 5, weight: 100, completed: true }
        ]
      },
      {
        id: 'e5',
        name: 'Peso muerto',
        sets: [
          { reps: 5, weight: 120, completed: true },
          { reps: 5, weight: 120, completed: true },
          { reps: 5, weight: 120, completed: true }
        ]
      }
    ],
    notes: 'Día de pierna y espalda baja',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '3',
    user_id: 'demo-user-id',
    type: 'gym',
    workout_date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    duration_minutes: 65,
    exercises: [
      {
        id: 'e6',
        name: 'Sentadilla',
        sets: [
          { reps: 8, weight: 90, completed: true },
          { reps: 8, weight: 100, completed: true },
          { reps: 6, weight: 110, completed: true },
          { reps: 6, weight: 110, completed: true }
        ]
      },
      {
        id: 'e7',
        name: 'Prensa',
        sets: [
          { reps: 12, weight: 180, completed: true },
          { reps: 12, weight: 200, completed: true },
          { reps: 10, weight: 220, completed: true }
        ]
      },
      {
        id: 'e8',
        name: 'Extensión de cuádriceps',
        sets: [
          { reps: 15, weight: 40, completed: true },
          { reps: 15, weight: 45, completed: true },
          { reps: 12, weight: 50, completed: true }
        ]
      }
    ],
    notes: 'Día de pierna, buenas sensaciones',
    created_at: new Date(Date.now() - 172800000).toISOString()
  }
];

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: [],
  currentWorkout: null,
  isLoading: false,

  fetchWorkouts: async (userId) => {
    set({ isLoading: true });

    // Demo mode
    if (userId === 'demo-user-id') {
      set({ workouts: DEMO_WORKOUTS, isLoading: false });
      return;
    }

    try {
      // Timeout de 3 segundos
      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) => 
        setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), 3000)
      );
      
      const fetchPromise = supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('workout_date', { ascending: false });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        console.warn('Error fetching workouts:', error);
        set({ workouts: [], isLoading: false });
        return;
      }
      
      set({ workouts: data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching workouts:', error);
      set({ workouts: [], isLoading: false });
    }
  },

  addWorkout: async (workout) => {
    // Demo mode
    if (workout.user_id === 'demo-user-id') {
      const newWorkout: Workout = {
        ...workout,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };
      set(state => ({ workouts: [newWorkout, ...state.workouts] }));
      return {};
    }

    try {
      const { data, error } = await supabase
        .from('workouts')
        .insert(workout)
        .select()
        .single();

      if (error) return { error: error.message };

      set(state => ({ workouts: [data, ...state.workouts] }));
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  updateWorkout: async (id, data) => {
    // Demo mode
    const { workouts } = get();
    const workout = workouts.find(w => w.id === id);
    if (workout?.user_id === 'demo-user-id') {
      set(state => ({
        workouts: state.workouts.map(w => w.id === id ? { ...w, ...data } : w)
      }));
      return {};
    }

    try {
      const { error } = await supabase
        .from('workouts')
        .update(data)
        .eq('id', id);

      if (error) return { error: error.message };

      set(state => ({
        workouts: state.workouts.map(w => w.id === id ? { ...w, ...data } : w)
      }));
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  deleteWorkout: async (id) => {
    // Demo mode
    const { workouts } = get();
    const workout = workouts.find(w => w.id === id);
    if (workout?.user_id === 'demo-user-id') {
      set(state => ({
        workouts: state.workouts.filter(w => w.id !== id)
      }));
      return {};
    }

    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id);

      if (error) return { error: error.message };

      set(state => ({
        workouts: state.workouts.filter(w => w.id !== id)
      }));
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  setCurrentWorkout: (workout) => set({ currentWorkout: workout }),

  addExerciseToWorkout: (exercise) => {
    set(state => {
      if (!state.currentWorkout) return state;
      return {
        currentWorkout: {
          ...state.currentWorkout,
          exercises: [...state.currentWorkout.exercises, exercise]
        }
      };
    });
  },

  updateExerciseInWorkout: (exerciseId, data) => {
    set(state => {
      if (!state.currentWorkout) return state;
      return {
        currentWorkout: {
          ...state.currentWorkout,
          exercises: state.currentWorkout.exercises.map(e =>
            e.id === exerciseId ? { ...e, ...data } : e
          )
        }
      };
    });
  },

  removeExerciseFromWorkout: (exerciseId) => {
    set(state => {
      if (!state.currentWorkout) return state;
      return {
        currentWorkout: {
          ...state.currentWorkout,
          exercises: state.currentWorkout.exercises.filter(e => e.id !== exerciseId)
        }
      };
    });
  },

  addSetToExercise: (exerciseId, newSet) => {
    set(state => {
      if (!state.currentWorkout) return state;
      return {
        currentWorkout: {
          ...state.currentWorkout,
          exercises: state.currentWorkout.exercises.map(e =>
            e.id === exerciseId ? { ...e, sets: [...e.sets, newSet] } : e
          )
        }
      };
    });
  },

  updateSetInExercise: (exerciseId, setIndex, data) => {
    set(state => {
      if (!state.currentWorkout) return state;
      return {
        currentWorkout: {
          ...state.currentWorkout,
          exercises: state.currentWorkout.exercises.map(e =>
            e.id === exerciseId ? {
              ...e,
              sets: e.sets.map((s, i) => i === setIndex ? { ...s, ...data } : s)
            } : e
          )
        }
      };
    });
  },

  getWorkoutStats: (userId) => {
    const { workouts } = get();
    const userWorkouts = workouts.filter(w => w.user_id === userId);
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisWeek = userWorkouts.filter(w => 
      new Date(w.workout_date) >= startOfWeek
    ).length;
    
    const thisMonth = userWorkouts.filter(w => 
      new Date(w.workout_date) >= startOfMonth
    ).length;
    
    // Calculate streak
    let streak = 0;
    const sortedWorkouts = [...userWorkouts].sort((a, b) => 
      new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime()
    );
    
    if (sortedWorkouts.length > 0) {
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (const workout of sortedWorkouts) {
        const workoutDate = new Date(workout.workout_date);
        workoutDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / 86400000);
        
        if (daysDiff <= 1) {
          streak++;
          currentDate = workoutDate;
        } else {
          break;
        }
      }
    }
    
    return {
      thisWeek,
      thisMonth,
      total: userWorkouts.length,
      streak
    };
  },

  getPersonalRecords: () => {
    const { workouts } = get();
    const records: Record<string, { weight: number; reps: number; date: string }> = {};
    
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (set.weight && set.completed) {
            const key = exercise.name.toLowerCase();
            if (!records[key] || set.weight > records[key].weight) {
              records[key] = {
                weight: set.weight,
                reps: set.reps || 1,
                date: workout.workout_date
              };
            }
          }
        });
      });
    });
    
    return records;
  }
}));
