// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  goals: UserGoals;
  training_types: TrainingType[];
  profile_data?: UserProfileData;
  created_at: string;
}

export interface UserGoals {
  primary: 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_endurance';
  target_weight?: number;
  current_weight?: number;
  height?: number;
  age?: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  daily_calories?: number;
}

export interface UserProfileData {
  // Horario laboral
  work_schedule?: {
    start_time: string; // "09:00"
    end_time: string; // "18:00"
    days: number[]; // 0-6 (domingo a sábado)
  };
  // Preferencias de entrenamiento
  preferred_workout_time?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  workout_duration_preference?: number; // minutos
  // Frecuencia por deporte (días por semana y duración)
  sports_frequency?: {
    [sport: string]: {
      days: number;
      duration?: number; // minutos por sesión
      type?: 'class' | 'open'; // para CrossFit: clase o open box
    };
  };
  // CrossFit específico
  crossfit_wods?: WeeklyCrossfitWODs;
  // Alimentación
  diet_type?: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo';
  allergies?: string[];
  food_dislikes?: string[];
  favorite_foods?: string[];
  meals_per_day?: number;
  // Lesiones y limitaciones
  injuries?: string[];
  physical_limitations?: string[];
  // Experiencia
  fitness_experience?: 'beginner' | 'intermediate' | 'advanced';
  years_training?: number;
  // Fotos iniciales
  initial_photos?: {
    front?: string;
    side?: string;
    back?: string;
  };
  // Otros
  gender?: 'male' | 'female' | 'other';
  sleep_hours?: number;
  stress_level?: 'low' | 'medium' | 'high';
  water_intake?: number; // litros
}

// WODs de CrossFit semanales (para clases)
export interface WeeklyCrossfitWODs {
  [day: string]: {
    strength?: string;
    wod?: string;
    notes?: string;
  };
}

export type TrainingType = 
  | 'gym' 
  | 'crossfit' 
  | 'hyrox'
  | 'hybrid'
  | 'running';

// Workout types
export interface Workout {
  id: string;
  user_id: string;
  type: TrainingType;
  workout_date: string;
  exercises: Exercise[];
  notes?: string;
  duration_minutes?: number;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface ExerciseSet {
  reps?: number;
  weight?: number;
  time_seconds?: number;
  distance_meters?: number;
  completed: boolean;
}

// Measurement types
export interface Measurement {
  id: string;
  user_id: string;
  weight: number;
  body_measurements?: BodyMeasurements;
  measured_at: string;
}

export interface BodyMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
  calves?: number;
}

// Photo types
export interface ProgressPhoto {
  id: string;
  user_id: string;
  url: string;
  category: 'front' | 'side' | 'back';
  taken_at: string;
  notes?: string;
}

// Nutrition types
export interface Meal {
  id: string;
  user_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: Food[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meal_date: string;
  meal_time?: string;
}

export interface Food {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  image_url?: string;
  tags: string[];
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface DietPlan {
  id: string;
  user_id: string;
  name: string;
  daily_calories: number;
  meals: DietMeal[];
  created_at: string;
}

export interface DietMeal {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipes: Recipe[];
  target_calories: number;
}

export interface ShoppingListItem {
  ingredient: string;
  quantity: number;
  unit: string;
  category: 'produce' | 'meat' | 'dairy' | 'grains' | 'other';
  checked: boolean;
}

// Social types
export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface FriendProfile {
  id: string;
  name: string;
  avatar_url?: string;
  stats: FriendStats;
}

export interface FriendStats {
  workouts_this_week: number;
  workouts_this_month: number;
  total_workouts: number;
  current_streak: number;
  weight_change?: number;
}

export interface RankingEntry {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  score: number;
  rank: number;
}

// Schedule types
export interface Schedule {
  id: string;
  user_id: string;
  activity_type: TrainingType | 'meal';
  title: string;
  scheduled_time: string;
  days_of_week: number[]; // 0 = Sunday, 6 = Saturday
  reminder_enabled: boolean;
  reminder_minutes_before: number;
  is_active: boolean;
}

// AI types
export interface AIRecommendation {
  type: 'workout' | 'nutrition' | 'tip';
  title: string;
  content: string;
  reasoning?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Plan completo generado por IA
export interface GeneratedPlan {
  workout_plan: WeeklyWorkoutPlan;
  diet_plan: WeeklyDietPlan;
  shopping_list: ShoppingListItem[];
  recommendations: string[];
  generated_at: string;
}

export interface WeeklyWorkoutPlan {
  name: string;
  description: string;
  days: DayWorkout[];
  rest_days: number[]; // 0-6
  estimated_calories_burned_weekly: number;
}

export interface DayWorkout {
  day: number; // 0-6 (domingo a sábado)
  day_name: string;
  workout_type: TrainingType;
  title: string;
  duration_minutes: number;
  exercises: PlannedExercise[];
  notes?: string;
  is_rest_day: boolean;
}

export interface PlannedExercise {
  name: string;
  sets: number;
  reps?: string; // "8-10" o "12"
  weight_recommendation?: string; // "70% RM" o "20kg"
  rest_seconds: number;
  notes?: string;
  alternatives?: string[];
}

export interface WeeklyDietPlan {
  name: string;
  description: string;
  daily_calories: number;
  macros: {
    protein_grams: number;
    carbs_grams: number;
    fat_grams: number;
  };
  days: DayMeals[];
}

export interface DayMeals {
  day: number;
  day_name: string;
  meals: PlannedMeal[];
  total_calories: number;
}

export interface PlannedMeal {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
  name: string;
  time_suggestion: string;
  foods: PlannedFood[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipe?: {
    ingredients: string[];
    instructions: string[];
    prep_time: number;
  };
}

export interface PlannedFood {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
