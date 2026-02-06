import OpenAI from 'openai';
import type { 
  UserGoals, 
  TrainingType, 
  Recipe, 
  AIRecommendation, 
  DietPlan,
  UserProfileData,
  GeneratedPlan,
  WeeklyWorkoutPlan,
  WeeklyDietPlan,
  ShoppingListItem,
  PlannedExercise
} from '../types';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

const openai = apiKey ? new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true // Solo para desarrollo, en producción usar backend
}) : null;

// Modo demo cuando no hay API key
const DEMO_MODE = !apiKey;

export async function generateWorkoutRecommendation(
  goals: UserGoals,
  trainingTypes: TrainingType[],
  recentWorkouts: string[]
): Promise<AIRecommendation> {
  if (DEMO_MODE) {
    return getDemoWorkoutRecommendation(trainingTypes);
  }

  try {
    const response = await openai!.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Eres un entrenador personal experto. Genera recomendaciones de entrenamiento personalizadas en español.
          Responde SIEMPRE en formato JSON con esta estructura:
          {
            "title": "Título corto del entreno",
            "content": "Descripción detallada del entrenamiento con ejercicios, series y repeticiones",
            "reasoning": "Explicación de por qué este entreno es adecuado"
          }`
        },
        {
          role: 'user',
          content: `Genera un entrenamiento para hoy. 
          Objetivo: ${goals.primary}
          Tipos de entrenamiento: ${trainingTypes.join(', ')}
          Nivel de actividad: ${goals.activity_level}
          Entrenamientos recientes: ${recentWorkouts.join(', ') || 'Ninguno registrado'}
          
          Ten en cuenta la recuperación muscular y varía los grupos musculares.`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      type: 'workout',
      title: result.title || 'Entrenamiento del día',
      content: result.content || 'No se pudo generar el entrenamiento',
      reasoning: result.reasoning
    };
  } catch (error) {
    console.error('Error generating workout:', error);
    return getDemoWorkoutRecommendation(trainingTypes);
  }
}

export async function generateDietPlan(
  goals: UserGoals,
  preferences: string[] = [],
  restrictions: string[] = []
): Promise<DietPlan | null> {
  if (DEMO_MODE) {
    return getDemoDietPlan(goals);
  }

  try {
    const response = await openai!.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Eres un nutricionista deportivo experto. Genera planes de dieta personalizados en español.
          Responde en formato JSON con esta estructura:
          {
            "name": "Nombre del plan",
            "daily_calories": número,
            "meals": [
              {
                "meal_type": "breakfast|lunch|dinner|snack",
                "recipes": [{ nombre, ingredientes, instrucciones, calorías, etc }],
                "target_calories": número
              }
            ]
          }`
        },
        {
          role: 'user',
          content: `Genera un plan de dieta diario.
          Objetivo: ${goals.primary}
          Peso actual: ${goals.current_weight || 'No especificado'} kg
          Peso objetivo: ${goals.target_weight || 'No especificado'} kg
          Calorías diarias objetivo: ${goals.daily_calories || calculateTDEE(goals)} kcal
          Preferencias: ${preferences.join(', ') || 'Ninguna'}
          Restricciones: ${restrictions.join(', ') || 'Ninguna'}
          
          Incluye desayuno, comida, cena y 2 snacks.`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      id: crypto.randomUUID(),
      user_id: '',
      name: result.name || 'Plan personalizado',
      daily_calories: result.daily_calories || goals.daily_calories || 2000,
      meals: result.meals || [],
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating diet:', error);
    return getDemoDietPlan(goals);
  }
}

export async function generateRecipe(
  name: string,
  goals: UserGoals
): Promise<Recipe | null> {
  if (DEMO_MODE) {
    return getDemoRecipe(name);
  }

  try {
    const response = await openai!.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Eres un chef nutricionista. Genera recetas saludables detalladas en español.
          Responde en formato JSON con esta estructura:
          {
            "name": "nombre",
            "description": "descripción",
            "ingredients": [{ "name": "ingrediente", "quantity": número, "unit": "unidad" }],
            "instructions": ["paso 1", "paso 2", ...],
            "prep_time_minutes": número,
            "cook_time_minutes": número,
            "servings": número,
            "calories_per_serving": número,
            "protein_per_serving": número,
            "carbs_per_serving": número,
            "fat_per_serving": número,
            "tags": ["tag1", "tag2"]
          }`
        },
        {
          role: 'user',
          content: `Genera una receta detallada para: ${name}
          Objetivo del usuario: ${goals.primary}
          Debe ser saludable y nutritiva.`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      id: crypto.randomUUID(),
      ...result
    };
  } catch (error) {
    console.error('Error generating recipe:', error);
    return getDemoRecipe(name);
  }
}

export async function generateShoppingList(
  meals: { name: string; servings: number }[]
): Promise<{ ingredient: string; quantity: number; unit: string; category: string }[]> {
  // Lista básica de fallback
  const basicList = [
    { ingredient: 'Pechuga de pollo', quantity: 1500, unit: 'g', category: 'meat' },
    { ingredient: 'Salmón fresco', quantity: 600, unit: 'g', category: 'meat' },
    { ingredient: 'Ternera magra', quantity: 500, unit: 'g', category: 'meat' },
    { ingredient: 'Huevos', quantity: 24, unit: 'unidades', category: 'dairy' },
    { ingredient: 'Leche semidesnatada', quantity: 3, unit: 'litros', category: 'dairy' },
    { ingredient: 'Yogur griego natural', quantity: 8, unit: 'unidades', category: 'dairy' },
    { ingredient: 'Queso fresco', quantity: 400, unit: 'g', category: 'dairy' },
    { ingredient: 'Arroz integral', quantity: 1, unit: 'kg', category: 'grains' },
    { ingredient: 'Avena', quantity: 500, unit: 'g', category: 'grains' },
    { ingredient: 'Pan integral', quantity: 2, unit: 'barras', category: 'grains' },
    { ingredient: 'Pasta integral', quantity: 500, unit: 'g', category: 'grains' },
    { ingredient: 'Quinoa', quantity: 500, unit: 'g', category: 'grains' },
    { ingredient: 'Brócoli', quantity: 1, unit: 'kg', category: 'produce' },
    { ingredient: 'Espinacas frescas', quantity: 500, unit: 'g', category: 'produce' },
    { ingredient: 'Tomates', quantity: 10, unit: 'unidades', category: 'produce' },
    { ingredient: 'Plátanos', quantity: 14, unit: 'unidades', category: 'produce' },
    { ingredient: 'Manzanas', quantity: 7, unit: 'unidades', category: 'produce' },
    { ingredient: 'Aguacates', quantity: 5, unit: 'unidades', category: 'produce' },
    { ingredient: 'Zanahorias', quantity: 1, unit: 'kg', category: 'produce' },
    { ingredient: 'Pimientos', quantity: 6, unit: 'unidades', category: 'produce' },
    { ingredient: 'Cebolla', quantity: 5, unit: 'unidades', category: 'produce' },
    { ingredient: 'Ajo', quantity: 2, unit: 'cabezas', category: 'produce' },
    { ingredient: 'Frutos rojos', quantity: 500, unit: 'g', category: 'produce' },
    { ingredient: 'Patatas', quantity: 2, unit: 'kg', category: 'produce' },
    { ingredient: 'Boniato', quantity: 1, unit: 'kg', category: 'produce' },
    { ingredient: 'Nueces', quantity: 300, unit: 'g', category: 'other' },
    { ingredient: 'Almendras', quantity: 300, unit: 'g', category: 'other' },
    { ingredient: 'Aceite de oliva virgen extra', quantity: 1, unit: 'litro', category: 'other' },
    { ingredient: 'Miel', quantity: 1, unit: 'bote', category: 'other' },
    { ingredient: 'Mantequilla de cacahuete', quantity: 1, unit: 'bote', category: 'other' },
  ];

  if (DEMO_MODE) {
    return basicList;
  }

  try {
    const response = await openai!.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Genera una lista de compras consolidada en español.
          Responde en formato JSON: { "items": [{ "ingredient": "nombre", "quantity": número, "unit": "unidad", "category": "produce|meat|dairy|grains|other" }] }`
        },
        {
          role: 'user',
          content: `Genera lista de compras semanal para estas comidas: ${meals.map(m => `${m.name} (${m.servings} porciones)`).join(', ')}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.items || [];
  } catch (error) {
    console.error('Error generating shopping list:', error);
    return basicList;
  }
}

export async function chatWithAI(
  message: string,
  context: { goals: UserGoals; trainingTypes: TrainingType[] }
): Promise<string> {
  if (DEMO_MODE) {
    return getDemoChatResponse(message);
  }

  try {
    const response = await openai!.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Eres FitBot, un asistente de fitness y nutrición. Responde en español de forma amigable y motivadora.
          Contexto del usuario:
          - Objetivo: ${context.goals.primary}
          - Entrena: ${context.trainingTypes.join(', ')}
          - Nivel de actividad: ${context.goals.activity_level}`
        },
        {
          role: 'user',
          content: message
        }
      ]
    });

    return response.choices[0].message.content || 'Lo siento, no pude procesar tu mensaje.';
  } catch (error) {
    console.error('Error in chat:', error);
    return getDemoChatResponse(message);
  }
}

// Función principal para generar plan completo personalizado
export async function generateCompletePlan(
  goals: UserGoals,
  trainingTypes: TrainingType[],
  profileData?: UserProfileData
): Promise<GeneratedPlan> {
  console.log('=== GENERATING COMPLETE PLAN ===');
  console.log('Goals:', goals);
  console.log('Training types:', trainingTypes);
  console.log('Profile data:', profileData);

  const dailyCalories = goals.daily_calories || calculateTDEE(goals);
  
  // Si no hay API key, usar datos de demo
  if (DEMO_MODE) {
    console.log('Using demo mode for plan generation');
    return generateDemoPlanFallback(goals, trainingTypes, profileData, dailyCalories);
  }

  try {
    // Generar el plan con OpenAI
    const workoutPlan = await generateWeeklyWorkoutPlan(goals, trainingTypes, profileData);
    const dietPlan = await generateWeeklyDietPlan(goals, profileData, dailyCalories);
    const shoppingList = await generateWeeklyShoppingList(dietPlan);
    
    const plan: GeneratedPlan = {
      workout_plan: workoutPlan,
      diet_plan: dietPlan,
      shopping_list: shoppingList,
      recommendations: generatePersonalizedTips(goals, profileData),
      generated_at: new Date().toISOString()
    };
    
    console.log('Plan generated successfully');
    return plan;
  } catch (error) {
    console.error('Error generating complete plan:', error);
    return generateDemoPlanFallback(goals, trainingTypes, profileData, dailyCalories);
  }
}

async function generateWeeklyWorkoutPlan(
  goals: UserGoals,
  trainingTypes: TrainingType[],
  profileData?: UserProfileData
): Promise<WeeklyWorkoutPlan> {
  const prompt = `Genera un plan de entrenamiento semanal completo y personalizado.

DATOS DEL USUARIO:
- Objetivo: ${getGoalText(goals.primary)}
- Peso actual: ${goals.current_weight || 70} kg
- Peso objetivo: ${goals.target_weight || goals.current_weight || 70} kg
- Altura: ${goals.height || 170} cm
- Edad: ${goals.age || 30} años
- Nivel de actividad: ${goals.activity_level}
- Deportes que practica: ${trainingTypes.join(', ') || 'gimnasio'}
- Experiencia: ${profileData?.fitness_experience || 'intermediate'}
- Horario preferido: ${profileData?.preferred_workout_time || 'flexible'}
- Duración preferida: ${profileData?.workout_duration_preference || 60} minutos
- Lesiones/limitaciones: ${profileData?.injuries?.join(', ') || 'ninguna'}

Responde en JSON con esta estructura:
{
  "name": "Nombre del plan",
  "description": "Descripción breve",
  "days": [
    {
      "day": 0,
      "day_name": "Domingo",
      "workout_type": "gym",
      "title": "Título del entreno",
      "duration_minutes": 60,
      "is_rest_day": false,
      "exercises": [
        {
          "name": "Nombre ejercicio",
          "sets": 4,
          "reps": "8-10",
          "weight_recommendation": "70% RM",
          "rest_seconds": 90,
          "notes": "Notas opcionales",
          "alternatives": ["alternativa1", "alternativa2"]
        }
      ],
      "notes": "Notas del día"
    }
  ],
  "rest_days": [0, 3],
  "estimated_calories_burned_weekly": 2500
}

Incluye los 7 días de la semana. Para los días de descanso, pon is_rest_day: true y exercises vacío.
Adapta los ejercicios a las lesiones mencionadas.`;

  try {
    const response = await openai!.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Eres un entrenador personal profesional con años de experiencia. Creas planes de entrenamiento detallados y personalizados en español.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as WeeklyWorkoutPlan;
  } catch (error) {
    console.error('Error generating workout plan:', error);
    throw error;
  }
}

async function generateWeeklyDietPlan(
  goals: UserGoals,
  profileData?: UserProfileData,
  dailyCalories?: number
): Promise<WeeklyDietPlan> {
  const calories = dailyCalories || calculateTDEE(goals);
  const protein = Math.round((calories * 0.3) / 4); // 30% proteína
  const carbs = Math.round((calories * 0.4) / 4); // 40% carbos
  const fat = Math.round((calories * 0.3) / 9); // 30% grasas

  const prompt = `Genera un plan de alimentación semanal completo y personalizado.

DATOS DEL USUARIO:
- Objetivo: ${getGoalText(goals.primary)}
- Calorías diarias objetivo: ${calories} kcal
- Macros objetivo: ${protein}g proteína, ${carbs}g carbos, ${fat}g grasas
- Tipo de dieta: ${profileData?.diet_type || 'omnívora'}
- Alergias: ${profileData?.allergies?.join(', ') || 'ninguna'}
- Comidas que no le gustan: ${profileData?.food_dislikes?.join(', ') || 'ninguna'}
- Comidas favoritas: ${profileData?.favorite_foods?.join(', ') || 'no especificado'}
- Comidas al día: ${profileData?.meals_per_day || 4}
- Horario de trabajo: ${profileData?.work_schedule ? `${profileData.work_schedule.start_time} - ${profileData.work_schedule.end_time}` : 'flexible'}

Responde en JSON con esta estructura:
{
  "name": "Nombre del plan",
  "description": "Descripción breve",
  "daily_calories": ${calories},
  "macros": {
    "protein_grams": ${protein},
    "carbs_grams": ${carbs},
    "fat_grams": ${fat}
  },
  "days": [
    {
      "day": 0,
      "day_name": "Domingo",
      "meals": [
        {
          "meal_type": "breakfast",
          "name": "Nombre de la comida",
          "time_suggestion": "08:00",
          "foods": [
            {
              "name": "Alimento",
              "quantity": "100g",
              "calories": 200,
              "protein": 20,
              "carbs": 10,
              "fat": 8
            }
          ],
          "calories": 400,
          "protein": 30,
          "carbs": 40,
          "fat": 12,
          "recipe": {
            "ingredients": ["ingrediente 1", "ingrediente 2"],
            "instructions": ["paso 1", "paso 2"],
            "prep_time": 10
          }
        }
      ],
      "total_calories": ${calories}
    }
  ]
}

Incluye los 7 días con variedad. Ajusta los horarios según el horario laboral.
Evita completamente los alérgenos mencionados.
Incluye recetas fáciles y rápidas para cada comida principal.`;

  try {
    const response = await openai!.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Eres un nutricionista deportivo profesional. Creas planes de alimentación detallados, equilibrados y deliciosos en español. Siempre respetas las restricciones alimentarias.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as WeeklyDietPlan;
  } catch (error) {
    console.error('Error generating diet plan:', error);
    throw error;
  }
}

async function generateWeeklyShoppingList(dietPlan: WeeklyDietPlan): Promise<ShoppingListItem[]> {
  // Extraer todos los alimentos del plan de dieta
  const allFoods: string[] = [];
  dietPlan.days?.forEach(day => {
    day.meals?.forEach(meal => {
      meal.foods?.forEach(food => {
        allFoods.push(`${food.name} (${food.quantity})`);
      });
      meal.recipe?.ingredients?.forEach(ing => allFoods.push(ing));
    });
  });

  const prompt = `Genera una lista de compra semanal consolidada basada en estos alimentos:
${allFoods.join('\n')}

Agrupa cantidades del mismo ingrediente y redondea hacia arriba.
Responde en JSON: { "items": [{ "ingredient": "nombre", "quantity": 1, "unit": "kg", "category": "produce|meat|dairy|grains|other", "checked": false }] }`;

  try {
    const response = await openai!.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Genera listas de compra organizadas y prácticas en español.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.items || [];
  } catch (error) {
    console.error('Error generating shopping list:', error);
    return [];
  }
}

function getGoalText(goal: string): string {
  switch (goal) {
    case 'lose_weight': return 'Perder peso/grasa';
    case 'gain_muscle': return 'Ganar masa muscular';
    case 'improve_endurance': return 'Mejorar resistencia y condición física';
    default: return 'Mantener peso y mejorar composición corporal';
  }
}

function generatePersonalizedTips(goals: UserGoals, profileData?: UserProfileData): string[] {
  const tips: string[] = [];
  
  if (goals.primary === 'lose_weight') {
    tips.push('Mantén un déficit calórico moderado de 300-500 kcal para perder grasa sin perder músculo.');
    tips.push('Prioriza la proteína en cada comida para preservar masa muscular.');
  } else if (goals.primary === 'gain_muscle') {
    tips.push('Come en superávit calórico moderado de 200-300 kcal.');
    tips.push('Consume proteína cada 3-4 horas para maximizar la síntesis proteica.');
  }
  
  if (profileData?.injuries?.length) {
    tips.push('Calienta bien antes de entrenar y presta atención a tus zonas lesionadas.');
  }
  
  tips.push('Duerme al menos 7-8 horas para optimizar la recuperación.');
  tips.push('Mantente hidratado bebiendo 2-3 litros de agua al día.');
  tips.push('La consistencia es clave: es mejor entrenar 4 días siempre que 6 días una semana y 2 la siguiente.');
  
  return tips;
}

// Función para generar plan de demo - exportada para fallback
export function generateDemoPlanFallback(
  goals: UserGoals,
  _trainingTypes: TrainingType[],
  profileData?: UserProfileData,
  dailyCalories?: number
): GeneratedPlan {
  const calories = dailyCalories || calculateTDEE(goals, profileData);
  const experience = profileData?.fitness_experience || 'intermediate';
  
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  // Rutina de gimnasio fija:
  // Lunes (1): Pecho, Martes (2): Espalda, Miércoles (3): Pierna
  // Jueves (4): Pecho, Viernes (5): Espalda, Sábado (6): Descanso, Domingo (0): Descanso
  const gymSchedule: Record<number, { title: string; focus: string } | null> = {
    0: null, // Domingo - Descanso
    1: { title: 'Pecho + Abdomen', focus: 'chest' },
    2: { title: 'Espalda + Abdomen', focus: 'back' },
    3: { title: 'Pierna + Abdomen', focus: 'legs' },
    4: { title: 'Pecho + Abdomen', focus: 'chest2' },
    5: { title: 'Espalda + Abdomen', focus: 'back2' },
    6: null, // Sábado - Descanso
  };
  
  const restDays = [0, 6]; // Domingo y Sábado
  const duration = profileData?.workout_duration_preference || (experience === 'advanced' ? 90 : experience === 'intermediate' ? 75 : 60);
  
  // Generar plan de entrenamiento de gimnasio
  const workoutDays = dayNames.map((dayName, index) => {
    const schedule = gymSchedule[index];
    
    if (!schedule) {
      return {
        day: index,
        day_name: dayName,
        workout_type: 'gym' as TrainingType,
        title: 'Descanso',
        duration_minutes: 0,
        is_rest_day: true,
        exercises: [],
        notes: index === 0 
          ? 'Día de descanso completo. Puedes hacer estiramientos o paseo suave.' 
          : 'Descanso activo: cardio suave, movilidad o yoga.'
      };
    }
    
    const exercises = generateGymExercises(schedule.focus, experience, profileData?.injuries);
    
    return {
      day: index,
      day_name: dayName,
      workout_type: 'gym' as TrainingType,
      title: schedule.title,
      duration_minutes: duration,
      is_rest_day: false,
      exercises: exercises,
      notes: getGymWorkoutNotes(schedule.focus, experience)
    };
  });
  
  const workoutPlan: WeeklyWorkoutPlan = {
    name: `Plan Gimnasio ${experience === 'advanced' ? 'Avanzado' : experience === 'intermediate' ? 'Intermedio' : 'Principiante'}`,
    description: `Rutina de 5 días enfocada en ${getGoalText(goals.primary).toLowerCase()}. Pecho 2x, Espalda 2x, Pierna 1x por semana + abdomen diario${profileData?.injuries?.length ? `. Adaptado a: ${profileData.injuries.join(', ').toLowerCase()}` : ''}.`,
    days: workoutDays,
    rest_days: restDays,
    estimated_calories_burned_weekly: experience === 'advanced' ? 3500 : experience === 'intermediate' ? 3000 : 2500
  };
  
  // Generar plan de dieta con menús diferentes cada día
  const dietDays = dayNames.map((dayName, index) => ({
    day: index,
    day_name: dayName,
    meals: generateDemoMeals(calories, profileData, index),
    total_calories: calories
  }));
  
  const protein = Math.round((calories * 0.3) / 4);
  const carbs = Math.round((calories * 0.4) / 4);
  const fat = Math.round((calories * 0.3) / 9);
  
  const dietPlan: WeeklyDietPlan = {
    name: 'Plan Nutricional Equilibrado',
    description: `${calories} kcal diarias para ${getGoalText(goals.primary).toLowerCase()}`,
    daily_calories: calories,
    macros: { protein_grams: protein, carbs_grams: carbs, fat_grams: fat },
    days: dietDays
  };
  
  // Generar lista de compra basada en el plan de dieta real
  const shoppingList = generateWeeklyShoppingListFromDiet(dietPlan);
  
  return {
    workout_plan: workoutPlan,
    diet_plan: dietPlan,
    shopping_list: shoppingList.map(item => ({ 
      ...item, 
      category: item.category as ShoppingListItem['category']
    })),
    recommendations: generatePersonalizedTips(goals, profileData),
    generated_at: new Date().toISOString()
  };
}

// Función para generar ejercicios de GIMNASIO específicos
function generateGymExercises(
  focus: string,
  experience: string,
  injuries?: string[]
): PlannedExercise[] {
  const hasBackInjury = injuries?.some(i => i.toLowerCase().includes('espalda'));
  const hasShoulderInjury = injuries?.some(i => i.toLowerCase().includes('hombro'));
  const hasKneeInjury = injuries?.some(i => i.toLowerCase().includes('rodilla'));
  
  const getIntensity = () => {
    if (experience === 'advanced') return { sets: 4, reps: '8-10', rest: 90 };
    if (experience === 'intermediate') return { sets: 4, reps: '10-12', rest: 75 };
    return { sets: 3, reps: '12-15', rest: 60 };
  };
  
  const intensity = getIntensity();
  const exercises: PlannedExercise[] = [];
  
  // PECHO
  if (focus === 'chest' || focus === 'chest2') {
    exercises.push(
      {
        name: 'Press Banca',
        sets: intensity.sets,
        reps: intensity.reps,
        rest_seconds: intensity.rest,
        weight_recommendation: experience === 'advanced' ? '80-85% RM' : '70-75% RM',
        notes: hasShoulderInjury ? 'Reduce el rango de movimiento si hay molestias' : 'Controla la bajada 2-3 segundos',
        alternatives: ['Press Banca Mancuernas', 'Press Máquina']
      },
      {
        name: focus === 'chest' ? 'Press Inclinado Mancuernas' : 'Press Inclinado Barra',
        sets: intensity.sets,
        reps: intensity.reps,
        rest_seconds: intensity.rest,
        weight_recommendation: '70-75% RM',
        notes: 'Banco a 30-45 grados',
        alternatives: ['Press Inclinado Máquina']
      },
      {
        name: focus === 'chest' ? 'Aperturas con Mancuernas' : 'Cruces en Polea',
        sets: 3,
        reps: '12-15',
        rest_seconds: 60,
        notes: 'Enfoca en la contracción del pectoral',
        alternatives: ['Pec Deck', 'Aperturas en Máquina']
      },
      {
        name: focus === 'chest' ? 'Fondos en Paralelas' : 'Press Declinado',
        sets: 3,
        reps: experience === 'beginner' ? '8-10' : '10-12',
        rest_seconds: 75,
        notes: focus === 'chest' ? 'Inclínate hacia adelante para enfatizar pecho' : 'Banco a 15-20 grados de declive',
        alternatives: ['Fondos Asistidos', 'Press Declinado Máquina']
      },
      {
        name: 'Pullover con Mancuerna',
        sets: 3,
        reps: '12-15',
        rest_seconds: 60,
        notes: 'Excelente para expandir la caja torácica',
        alternatives: ['Pullover en Polea']
      }
    );
  }
  
  // ESPALDA
  if (focus === 'back' || focus === 'back2') {
    exercises.push(
      {
        name: hasBackInjury ? 'Jalón al Pecho' : 'Dominadas',
        sets: intensity.sets,
        reps: hasBackInjury ? '10-12' : (experience === 'beginner' ? '6-8' : '8-12'),
        rest_seconds: intensity.rest,
        notes: hasBackInjury ? 'Mantén la espalda recta' : 'Agarre prono, ancho de hombros',
        alternatives: ['Dominadas Asistidas', 'Jalón al Pecho']
      },
      {
        name: focus === 'back' ? 'Remo con Barra' : 'Remo con Mancuerna',
        sets: intensity.sets,
        reps: intensity.reps,
        rest_seconds: intensity.rest,
        weight_recommendation: '70-75% RM',
        notes: hasBackInjury ? 'Usa peso moderado y técnica estricta' : 'Mantén la espalda neutra',
        alternatives: ['Remo en Máquina', 'Remo T-Bar']
      },
      {
        name: focus === 'back' ? 'Jalón Agarre Cerrado' : 'Jalón Agarre Neutro',
        sets: 3,
        reps: '10-12',
        rest_seconds: 60,
        notes: 'Enfoca en contraer los dorsales',
        alternatives: ['Pulldown Máquina']
      },
      {
        name: 'Remo en Polea Baja',
        sets: 3,
        reps: '10-12',
        rest_seconds: 60,
        notes: 'Tira hacia el ombligo, no hacia el pecho',
        alternatives: ['Remo Sentado Máquina']
      },
      {
        name: focus === 'back' ? 'Face Pulls' : 'Encogimientos con Barra',
        sets: 3,
        reps: '15-20',
        rest_seconds: 45,
        notes: focus === 'back' ? 'Excelente para salud de hombros' : 'Sube solo los hombros, no los brazos',
        alternatives: ['Encogimientos con Mancuernas']
      },
      {
        name: 'Curl de Bíceps con Barra',
        sets: 3,
        reps: '10-12',
        rest_seconds: 60,
        notes: 'Sin balanceo, codos pegados al cuerpo',
        alternatives: ['Curl con Mancuernas']
      },
      {
        name: focus === 'back' ? 'Curl Martillo' : 'Curl Concentrado',
        sets: 3,
        reps: '12-15',
        rest_seconds: 45,
        notes: 'Contracción controlada',
        alternatives: ['Curl en Polea']
      }
    );
  }
  
  // PIERNA
  if (focus === 'legs') {
    exercises.push(
      {
        name: hasKneeInjury ? 'Prensa de Piernas' : 'Sentadilla con Barra',
        sets: intensity.sets,
        reps: hasKneeInjury ? '12-15' : intensity.reps,
        rest_seconds: 120,
        weight_recommendation: hasKneeInjury ? '60-65% RM' : '75-80% RM',
        notes: hasKneeInjury ? 'Rango de movimiento cómodo' : 'Baja hasta paralelo mínimo',
        alternatives: ['Sentadilla Goblet', 'Hack Squat']
      },
      {
        name: 'Prensa de Piernas',
        sets: intensity.sets,
        reps: '10-12',
        rest_seconds: 90,
        notes: 'Pies a la altura de los hombros',
        alternatives: ['Prensa 45°']
      },
      {
        name: hasKneeInjury ? 'Puente de Glúteos' : 'Peso Muerto Rumano',
        sets: intensity.sets,
        reps: hasKneeInjury ? '15-20' : '10-12',
        rest_seconds: 90,
        notes: hasKneeInjury ? 'Aprieta glúteos arriba' : 'Piernas semi-flexionadas, espalda recta',
        alternatives: ['Hip Thrust', 'Buenos Días']
      },
      {
        name: 'Extensiones de Cuádriceps',
        sets: 3,
        reps: '12-15',
        rest_seconds: 60,
        notes: hasKneeInjury ? 'Peso ligero, movimiento controlado' : 'Contrae arriba 1 segundo',
        alternatives: []
      },
      {
        name: 'Curl Femoral Tumbado',
        sets: 3,
        reps: '12-15',
        rest_seconds: 60,
        notes: 'No despegues la cadera del banco',
        alternatives: ['Curl Femoral Sentado']
      },
      {
        name: 'Elevaciones de Gemelos',
        sets: 4,
        reps: '15-20',
        rest_seconds: 45,
        notes: 'Rango completo de movimiento, pausa arriba',
        alternatives: ['Gemelos en Prensa', 'Gemelos Sentado']
      }
    );
  }
  
  // ABDOMEN (se añade al final de cada día)
  const abExercises: PlannedExercise[] = [
    {
      name: 'Crunch en Máquina o Polea',
      sets: 3,
      reps: '15-20',
      rest_seconds: 30,
      notes: 'Contrae el abdomen, no tires del cuello'
    },
    {
      name: 'Plancha',
      sets: 3,
      reps: '30-45 seg',
      rest_seconds: 30,
      notes: 'Mantén el core apretado y la espalda recta'
    },
    {
      name: 'Elevación de Piernas Colgado',
      sets: 3,
      reps: '12-15',
      rest_seconds: 30,
      notes: hasBackInjury ? 'Flexiona las rodillas si es necesario' : 'Sube las piernas sin balanceo',
      alternatives: ['Elevación en Banco', 'Crunch Inverso']
    }
  ];
  
  // Añadir abdomen a todos los días de entrenamiento
  exercises.push(...abExercises);
  
  return exercises;
}

// Notas específicas para entrenamientos de gimnasio
function getGymWorkoutNotes(focus: string, experience: string): string {
  const notes: Record<string, string> = {
    chest: `Día de pecho: Enfócate en la conexión mente-músculo. ${experience === 'advanced' ? 'Puedes añadir técnicas de intensidad como drop sets en el último ejercicio.' : 'Controla el movimiento en todo momento.'}`,
    chest2: `Segundo día de pecho de la semana. ${experience === 'advanced' ? 'Varía ángulos y agarres respecto al primer día.' : 'Mantén la técnica aunque estés fatigado.'}`,
    back: `Día de espalda: Tira con los codos, no con las manos. ${experience === 'advanced' ? 'Puedes usar straps para los ejercicios pesados.' : 'Prioriza sentir el músculo trabajar.'}`,
    back2: `Segundo día de espalda. ${experience === 'advanced' ? 'Enfócate en ejercicios de aislamiento y bombeo.' : 'Si estás muy fatigado, reduce el peso y aumenta las repeticiones.'}`,
    legs: `Día de pierna: El más exigente de la semana. ${experience === 'advanced' ? 'Puedes hacer superseries en ejercicios de aislamiento.' : 'Hidratación extra importante hoy.'}`
  };
  
  return notes[focus] || 'Mantén buena técnica y controla el movimiento.';
}

function generateDemoMeals(dailyCalories: number, profileData?: UserProfileData, dayIndex: number = 0) {
  const mealsPerDay = profileData?.meals_per_day || 4;
  const isVegetarian = profileData?.diet_type === 'vegetarian' || profileData?.diet_type === 'vegan';
  const allergies = profileData?.allergies || [];
  const hasGlutenAllergy = allergies.some(a => a.toLowerCase().includes('gluten'));
  const hasDairyAllergy = allergies.some(a => a.toLowerCase().includes('lactosa') || a.toLowerCase().includes('lácteo'));
  
  const breakfastCalories = Math.round(dailyCalories * 0.25);
  const lunchCalories = Math.round(dailyCalories * 0.35);
  const dinnerCalories = Math.round(dailyCalories * 0.25);
  const snackCalories = Math.round(dailyCalories * 0.15);

  // DESAYUNOS VARIADOS (7 opciones)
  const breakfasts = [
    {
      name: 'Bowl de Avena con Frutas',
      foods: [
        { name: hasGlutenAllergy ? 'Avena sin gluten' : 'Avena', quantity: '80g', calories: 300, protein: 10, carbs: 54, fat: 6 },
        { name: hasDairyAllergy ? 'Leche de almendras' : 'Leche', quantity: '250ml', calories: 120, protein: 8, carbs: 12, fat: 5 },
        { name: 'Plátano', quantity: '1 unidad', calories: 105, protein: 1, carbs: 27, fat: 0 },
        { name: 'Arándanos', quantity: '50g', calories: 30, protein: 0, carbs: 7, fat: 0 },
        { name: 'Mantequilla de cacahuete', quantity: '20g', calories: 120, protein: 5, carbs: 4, fat: 10 }
      ],
      recipe: { ingredients: ['80g avena', '250ml leche', '1 plátano', '50g arándanos', '20g mantequilla cacahuete', 'Canela'], instructions: ['Cocinar avena con leche 5 min', 'Añadir frutas y mantequilla'], prep_time: 10 }
    },
    {
      name: 'Tostadas con Aguacate y Huevos',
      foods: [
        { name: hasGlutenAllergy ? 'Pan sin gluten' : 'Pan integral', quantity: '2 rebanadas', calories: 180, protein: 8, carbs: 30, fat: 3 },
        { name: 'Aguacate', quantity: '100g', calories: 160, protein: 2, carbs: 9, fat: 15 },
        { name: isVegetarian ? 'Tofu revuelto' : 'Huevos revueltos', quantity: isVegetarian ? '150g' : '3 huevos', calories: 220, protein: 18, carbs: 2, fat: 15 },
        { name: 'Tomate cherry', quantity: '80g', calories: 15, protein: 1, carbs: 3, fat: 0 }
      ],
      recipe: { ingredients: ['2 rebanadas pan', '1 aguacate', '3 huevos', 'Tomates', 'Sal, pimienta'], instructions: ['Tostar pan', 'Machacar aguacate', 'Revolver huevos', 'Montar tostadas'], prep_time: 15 }
    },
    {
      name: 'Smoothie Bowl Proteico',
      foods: [
        { name: 'Proteína whey', quantity: '30g', calories: 120, protein: 24, carbs: 3, fat: 1 },
        { name: 'Plátano congelado', quantity: '1 unidad', calories: 105, protein: 1, carbs: 27, fat: 0 },
        { name: 'Fresas', quantity: '100g', calories: 33, protein: 1, carbs: 8, fat: 0 },
        { name: hasDairyAllergy ? 'Leche de coco' : 'Leche', quantity: '200ml', calories: 100, protein: 6, carbs: 10, fat: 4 },
        { name: 'Granola', quantity: '40g', calories: 180, protein: 4, carbs: 28, fat: 6 },
        { name: 'Semillas de chía', quantity: '10g', calories: 50, protein: 2, carbs: 4, fat: 3 }
      ],
      recipe: { ingredients: ['30g proteína', '1 plátano', '100g fresas', '200ml leche', '40g granola', '10g chía'], instructions: ['Batir proteína, plátano, fresas y leche', 'Servir en bowl', 'Añadir granola y chía'], prep_time: 8 }
    },
    {
      name: 'Tortilla de Claras con Verduras',
      foods: [
        { name: isVegetarian ? 'Tofu firme' : 'Claras de huevo', quantity: isVegetarian ? '200g' : '6 claras', calories: 100, protein: 22, carbs: 1, fat: 0 },
        { name: 'Espinacas', quantity: '80g', calories: 20, protein: 2, carbs: 3, fat: 0 },
        { name: 'Champiñones', quantity: '100g', calories: 22, protein: 3, carbs: 3, fat: 0 },
        { name: 'Pimiento rojo', quantity: '80g', calories: 25, protein: 1, carbs: 5, fat: 0 },
        { name: hasGlutenAllergy ? 'Tostada sin gluten' : 'Pan integral', quantity: '2 rebanadas', calories: 180, protein: 8, carbs: 30, fat: 3 },
        { name: hasDairyAllergy ? 'Queso vegano' : 'Queso bajo en grasa', quantity: '30g', calories: 80, protein: 7, carbs: 1, fat: 5 }
      ],
      recipe: { ingredients: ['6 claras', 'Espinacas', 'Champiñones', 'Pimiento', 'Queso', 'Pan'], instructions: ['Saltear verduras', 'Añadir claras batidas', 'Cocinar tortilla', 'Servir con tostadas'], prep_time: 15 }
    },
    {
      name: 'Gachas de Avena con Proteína',
      foods: [
        { name: 'Avena', quantity: '70g', calories: 260, protein: 9, carbs: 47, fat: 5 },
        { name: 'Proteína en polvo', quantity: '25g', calories: 100, protein: 20, carbs: 2, fat: 1 },
        { name: hasDairyAllergy ? 'Bebida de soja' : 'Leche', quantity: '300ml', calories: 150, protein: 10, carbs: 15, fat: 6 },
        { name: 'Manzana', quantity: '1 unidad', calories: 80, protein: 0, carbs: 21, fat: 0 },
        { name: 'Almendras', quantity: '20g', calories: 120, protein: 4, carbs: 3, fat: 10 }
      ],
      recipe: { ingredients: ['70g avena', '25g proteína', '300ml leche', '1 manzana', '20g almendras', 'Canela'], instructions: ['Cocinar avena con leche', 'Mezclar proteína', 'Añadir manzana troceada y almendras'], prep_time: 12 }
    },
    {
      name: 'Yogur con Granola y Frutas',
      foods: [
        { name: hasDairyAllergy ? 'Yogur de coco' : 'Yogur griego', quantity: '300g', calories: 200, protein: 30, carbs: 12, fat: 3 },
        { name: 'Granola casera', quantity: '50g', calories: 220, protein: 5, carbs: 35, fat: 8 },
        { name: 'Mango', quantity: '100g', calories: 60, protein: 1, carbs: 15, fat: 0 },
        { name: 'Kiwi', quantity: '1 unidad', calories: 40, protein: 1, carbs: 9, fat: 0 },
        { name: 'Miel', quantity: '15g', calories: 45, protein: 0, carbs: 12, fat: 0 }
      ],
      recipe: { ingredients: ['300g yogur', '50g granola', '100g mango', '1 kiwi', '15g miel'], instructions: ['Poner yogur en bowl', 'Añadir frutas troceadas', 'Cubrir con granola y miel'], prep_time: 5 }
    },
    {
      name: 'Huevos Benedictinos Fitness',
      foods: [
        { name: isVegetarian ? 'Tofu revuelto' : 'Huevos pochados', quantity: isVegetarian ? '150g' : '3 huevos', calories: 210, protein: 18, carbs: 1, fat: 15 },
        { name: isVegetarian ? 'Bacon vegano' : 'Bacon de pavo', quantity: '60g', calories: 90, protein: 12, carbs: 1, fat: 4 },
        { name: 'English muffin integral', quantity: '1 unidad', calories: 130, protein: 5, carbs: 25, fat: 1 },
        { name: 'Espinacas', quantity: '50g', calories: 12, protein: 1, carbs: 2, fat: 0 },
        { name: 'Aguacate', quantity: '50g', calories: 80, protein: 1, carbs: 4, fat: 7 }
      ],
      recipe: { ingredients: ['3 huevos', '60g bacon pavo', '1 muffin', 'Espinacas', 'Aguacate'], instructions: ['Pochar huevos', 'Tostar muffin', 'Cocinar bacon', 'Montar con espinacas y aguacate'], prep_time: 20 }
    }
  ];

  // COMIDAS VARIADAS (7 opciones)
  const lunches = [
    {
      name: isVegetarian ? 'Buddha Bowl de Legumbres' : 'Pollo a la Plancha con Arroz',
      foods: isVegetarian ? [
        { name: 'Garbanzos', quantity: '200g', calories: 280, protein: 15, carbs: 45, fat: 5 },
        { name: 'Quinoa', quantity: '100g', calories: 350, protein: 13, carbs: 62, fat: 6 },
        { name: 'Boniato asado', quantity: '150g', calories: 130, protein: 2, carbs: 30, fat: 0 },
        { name: 'Aguacate', quantity: '80g', calories: 130, protein: 2, carbs: 7, fat: 12 },
        { name: 'Verduras mixtas', quantity: '150g', calories: 50, protein: 3, carbs: 10, fat: 0 }
      ] : [
        { name: 'Pechuga de pollo', quantity: '250g', calories: 275, protein: 55, carbs: 0, fat: 4 },
        { name: 'Arroz integral', quantity: '120g (peso seco)', calories: 420, protein: 9, carbs: 87, fat: 3 },
        { name: 'Brócoli', quantity: '200g', calories: 68, protein: 6, carbs: 14, fat: 0 },
        { name: 'Aceite de oliva', quantity: '15ml', calories: 135, protein: 0, carbs: 0, fat: 15 }
      ],
      recipe: { ingredients: isVegetarian ? ['200g garbanzos', '100g quinoa', '150g boniato', '80g aguacate', 'Verduras'] : ['250g pollo', '120g arroz', '200g brócoli', 'Aceite', 'Especias'], instructions: isVegetarian ? ['Cocinar quinoa', 'Asar boniato', 'Montar bowl con todos los ingredientes'] : ['Cocinar arroz 20 min', 'Grillar pollo con especias', 'Hervir brócoli al dente'], prep_time: 30 }
    },
    {
      name: isVegetarian ? 'Curry de Lentejas' : 'Ternera con Patatas',
      foods: isVegetarian ? [
        { name: 'Lentejas', quantity: '200g', calories: 230, protein: 18, carbs: 40, fat: 1 },
        { name: 'Arroz basmati', quantity: '100g', calories: 350, protein: 7, carbs: 77, fat: 1 },
        { name: 'Leche de coco', quantity: '100ml', calories: 180, protein: 2, carbs: 3, fat: 18 },
        { name: 'Espinacas', quantity: '100g', calories: 25, protein: 3, carbs: 4, fat: 0 },
        { name: 'Tomate', quantity: '150g', calories: 27, protein: 1, carbs: 6, fat: 0 }
      ] : [
        { name: 'Filete de ternera', quantity: '200g', calories: 280, protein: 50, carbs: 0, fat: 8 },
        { name: 'Patatas al horno', quantity: '250g', calories: 213, protein: 5, carbs: 48, fat: 0 },
        { name: 'Judías verdes', quantity: '150g', calories: 47, protein: 3, carbs: 10, fat: 0 },
        { name: 'Champiñones', quantity: '100g', calories: 22, protein: 3, carbs: 3, fat: 0 }
      ],
      recipe: { ingredients: isVegetarian ? ['200g lentejas', '100g arroz', '100ml leche coco', 'Espinacas', 'Curry en polvo'] : ['200g ternera', '250g patatas', 'Judías', 'Champiñones', 'Romero'], instructions: isVegetarian ? ['Cocinar lentejas con curry y leche de coco', 'Añadir espinacas', 'Servir con arroz'] : ['Hornear patatas 40 min', 'Grillar ternera a punto', 'Saltear judías y champiñones'], prep_time: 35 }
    },
    {
      name: isVegetarian ? 'Tacos de Tofu' : 'Pavo con Verduras Salteadas',
      foods: isVegetarian ? [
        { name: 'Tofu firme', quantity: '250g', calories: 225, protein: 25, carbs: 5, fat: 12 },
        { name: 'Tortillas de maíz', quantity: '3 unidades', calories: 210, protein: 6, carbs: 42, fat: 3 },
        { name: 'Frijoles negros', quantity: '150g', calories: 200, protein: 13, carbs: 35, fat: 1 },
        { name: 'Aguacate', quantity: '100g', calories: 160, protein: 2, carbs: 9, fat: 15 },
        { name: 'Pico de gallo', quantity: '100g', calories: 20, protein: 1, carbs: 4, fat: 0 }
      ] : [
        { name: 'Pechuga de pavo', quantity: '250g', calories: 275, protein: 58, carbs: 0, fat: 3 },
        { name: 'Arroz integral', quantity: '100g', calories: 350, protein: 8, carbs: 73, fat: 3 },
        { name: 'Pimiento tricolor', quantity: '200g', calories: 52, protein: 2, carbs: 12, fat: 0 },
        { name: 'Calabacín', quantity: '150g', calories: 26, protein: 2, carbs: 5, fat: 0 },
        { name: 'Salsa de soja', quantity: '15ml', calories: 10, protein: 2, carbs: 1, fat: 0 }
      ],
      recipe: { ingredients: isVegetarian ? ['250g tofu', '3 tortillas', 'Frijoles', 'Aguacate', 'Especias mexicanas'] : ['250g pavo', '100g arroz', 'Pimientos', 'Calabacín', 'Salsa soja'], instructions: isVegetarian ? ['Marinar y cocinar tofu', 'Calentar tortillas', 'Montar tacos con todos los ingredientes'] : ['Cortar pavo en tiras', 'Saltear con verduras', 'Servir con arroz'], prep_time: 25 }
    },
    {
      name: isVegetarian ? 'Ensalada de Garbanzos' : 'Salmón con Quinoa',
      foods: isVegetarian ? [
        { name: 'Garbanzos', quantity: '250g', calories: 350, protein: 19, carbs: 56, fat: 6 },
        { name: 'Tomate', quantity: '150g', calories: 27, protein: 1, carbs: 6, fat: 0 },
        { name: 'Pepino', quantity: '100g', calories: 16, protein: 1, carbs: 4, fat: 0 },
        { name: 'Cebolla roja', quantity: '50g', calories: 20, protein: 0, carbs: 5, fat: 0 },
        { name: 'Aceite de oliva', quantity: '20ml', calories: 180, protein: 0, carbs: 0, fat: 20 },
        { name: 'Queso feta', quantity: '50g', calories: 130, protein: 7, carbs: 2, fat: 11 }
      ] : [
        { name: 'Salmón', quantity: '200g', calories: 400, protein: 40, carbs: 0, fat: 25 },
        { name: 'Quinoa', quantity: '100g', calories: 350, protein: 13, carbs: 62, fat: 6 },
        { name: 'Espárragos', quantity: '150g', calories: 30, protein: 4, carbs: 6, fat: 0 },
        { name: 'Limón', quantity: '1 unidad', calories: 20, protein: 1, carbs: 6, fat: 0 }
      ],
      recipe: { ingredients: isVegetarian ? ['250g garbanzos', 'Tomate', 'Pepino', 'Cebolla', 'Aceite', 'Feta'] : ['200g salmón', '100g quinoa', 'Espárragos', 'Limón', 'Eneldo'], instructions: isVegetarian ? ['Mezclar todos los ingredientes', 'Aliñar con aceite y limón'] : ['Hornear salmón 15 min a 200°C', 'Cocinar quinoa', 'Grillar espárragos'], prep_time: 25 }
    },
    {
      name: isVegetarian ? 'Pasta con Verduras' : 'Pollo al Curry con Arroz',
      foods: isVegetarian ? [
        { name: hasGlutenAllergy ? 'Pasta de arroz' : 'Pasta integral', quantity: '120g', calories: 420, protein: 15, carbs: 80, fat: 3 },
        { name: 'Calabacín', quantity: '150g', calories: 26, protein: 2, carbs: 5, fat: 0 },
        { name: 'Berenjena', quantity: '150g', calories: 38, protein: 2, carbs: 9, fat: 0 },
        { name: 'Tomate triturado', quantity: '200g', calories: 40, protein: 2, carbs: 8, fat: 0 },
        { name: 'Aceite de oliva', quantity: '20ml', calories: 180, protein: 0, carbs: 0, fat: 20 }
      ] : [
        { name: 'Muslos de pollo', quantity: '250g', calories: 300, protein: 45, carbs: 0, fat: 12 },
        { name: 'Arroz basmati', quantity: '120g', calories: 420, protein: 8, carbs: 92, fat: 1 },
        { name: 'Leche de coco light', quantity: '100ml', calories: 60, protein: 1, carbs: 2, fat: 6 },
        { name: 'Verduras para curry', quantity: '150g', calories: 50, protein: 2, carbs: 10, fat: 0 }
      ],
      recipe: { ingredients: isVegetarian ? ['120g pasta', 'Calabacín', 'Berenjena', 'Tomate', 'Aceite', 'Ajo'] : ['250g pollo', '120g arroz', 'Leche coco', 'Curry', 'Verduras'], instructions: isVegetarian ? ['Cocinar pasta', 'Saltear verduras', 'Mezclar con tomate'] : ['Saltear pollo con curry', 'Añadir leche coco y verduras', 'Servir con arroz'], prep_time: 30 }
    },
    {
      name: isVegetarian ? 'Bowl Mexicano' : 'Atún con Ensalada',
      foods: isVegetarian ? [
        { name: 'Arroz integral', quantity: '100g', calories: 350, protein: 8, carbs: 73, fat: 3 },
        { name: 'Frijoles negros', quantity: '150g', calories: 200, protein: 13, carbs: 35, fat: 1 },
        { name: 'Maíz', quantity: '80g', calories: 86, protein: 3, carbs: 19, fat: 1 },
        { name: 'Aguacate', quantity: '100g', calories: 160, protein: 2, carbs: 9, fat: 15 },
        { name: 'Salsa', quantity: '50g', calories: 20, protein: 1, carbs: 4, fat: 0 }
      ] : [
        { name: 'Atún fresco', quantity: '200g', calories: 260, protein: 52, carbs: 0, fat: 5 },
        { name: 'Lechuga variada', quantity: '150g', calories: 25, protein: 2, carbs: 4, fat: 0 },
        { name: 'Tomate', quantity: '150g', calories: 27, protein: 1, carbs: 6, fat: 0 },
        { name: 'Huevo cocido', quantity: '2 unidades', calories: 140, protein: 12, carbs: 1, fat: 10 },
        { name: 'Aceitunas', quantity: '30g', calories: 45, protein: 0, carbs: 1, fat: 5 },
        { name: 'Aceite de oliva', quantity: '20ml', calories: 180, protein: 0, carbs: 0, fat: 20 }
      ],
      recipe: { ingredients: isVegetarian ? ['100g arroz', 'Frijoles', 'Maíz', 'Aguacate', 'Salsa', 'Lima'] : ['200g atún', 'Lechuga', 'Tomate', '2 huevos', 'Aceitunas', 'Aceite'], instructions: isVegetarian ? ['Cocinar arroz', 'Montar bowl con ingredientes', 'Aliñar con lima'] : ['Sellar atún por fuera', 'Preparar ensalada', 'Añadir huevos y aceitunas'], prep_time: 20 }
    },
    {
      name: isVegetarian ? 'Wok de Tempeh' : 'Cerdo con Verduras al Wok',
      foods: isVegetarian ? [
        { name: 'Tempeh', quantity: '200g', calories: 340, protein: 40, carbs: 8, fat: 18 },
        { name: 'Fideos de arroz', quantity: '100g', calories: 350, protein: 3, carbs: 83, fat: 0 },
        { name: 'Verduras asiáticas', quantity: '200g', calories: 50, protein: 3, carbs: 10, fat: 0 },
        { name: 'Salsa de soja', quantity: '20ml', calories: 15, protein: 2, carbs: 1, fat: 0 },
        { name: 'Aceite de sésamo', quantity: '10ml', calories: 90, protein: 0, carbs: 0, fat: 10 }
      ] : [
        { name: 'Solomillo de cerdo', quantity: '200g', calories: 260, protein: 46, carbs: 0, fat: 8 },
        { name: 'Arroz integral', quantity: '100g', calories: 350, protein: 8, carbs: 73, fat: 3 },
        { name: 'Verduras wok', quantity: '250g', calories: 65, protein: 4, carbs: 13, fat: 0 },
        { name: 'Salsa teriyaki', quantity: '30ml', calories: 45, protein: 1, carbs: 10, fat: 0 }
      ],
      recipe: { ingredients: isVegetarian ? ['200g tempeh', '100g fideos', 'Verduras', 'Soja', 'Sésamo', 'Jengibre'] : ['200g cerdo', '100g arroz', 'Verduras', 'Teriyaki', 'Ajo'], instructions: isVegetarian ? ['Saltear tempeh', 'Cocinar fideos', 'Añadir verduras y salsas'] : ['Cortar cerdo en tiras', 'Saltear con verduras', 'Añadir salsa teriyaki', 'Servir con arroz'], prep_time: 25 }
    }
  ];

  // CENAS VARIADAS (7 opciones)
  const dinners = [
    {
      name: isVegetarian ? 'Revuelto de Tofu con Verduras' : 'Salmón al Horno',
      foods: isVegetarian ? [
        { name: 'Tofu sedoso', quantity: '200g', calories: 110, protein: 10, carbs: 3, fat: 6 },
        { name: 'Espinacas', quantity: '150g', calories: 35, protein: 4, carbs: 5, fat: 0 },
        { name: 'Champiñones', quantity: '150g', calories: 33, protein: 5, carbs: 5, fat: 0 },
        { name: 'Pimiento', quantity: '100g', calories: 30, protein: 1, carbs: 6, fat: 0 },
        { name: 'Patata cocida', quantity: '200g', calories: 170, protein: 4, carbs: 38, fat: 0 }
      ] : [
        { name: 'Salmón', quantity: '200g', calories: 400, protein: 40, carbs: 0, fat: 25 },
        { name: 'Patata al horno', quantity: '200g', calories: 170, protein: 4, carbs: 38, fat: 0 },
        { name: 'Espárragos', quantity: '150g', calories: 30, protein: 4, carbs: 6, fat: 0 },
        { name: 'Aceite de oliva', quantity: '15ml', calories: 135, protein: 0, carbs: 0, fat: 15 }
      ],
      recipe: { ingredients: isVegetarian ? ['200g tofu', 'Espinacas', 'Champiñones', 'Pimiento', 'Patata', 'Ajo'] : ['200g salmón', '200g patata', 'Espárragos', 'Limón', 'Eneldo'], instructions: isVegetarian ? ['Saltear verduras', 'Añadir tofu desmenuzado', 'Servir con patata'] : ['Hornear salmón 18 min a 200°C', 'Asar patata y espárragos'], prep_time: 25 }
    },
    {
      name: isVegetarian ? 'Hamburguesa de Legumbres' : 'Pechuga de Pollo con Verduras',
      foods: isVegetarian ? [
        { name: 'Hamburguesa de lentejas', quantity: '2 unidades', calories: 300, protein: 20, carbs: 40, fat: 8 },
        { name: 'Pan de hamburguesa integral', quantity: '1 unidad', calories: 150, protein: 5, carbs: 28, fat: 2 },
        { name: 'Boniato frito', quantity: '150g', calories: 200, protein: 2, carbs: 45, fat: 3 },
        { name: 'Ensalada verde', quantity: '100g', calories: 20, protein: 2, carbs: 3, fat: 0 }
      ] : [
        { name: 'Pechuga de pollo', quantity: '200g', calories: 220, protein: 44, carbs: 0, fat: 3 },
        { name: 'Boniato al horno', quantity: '200g', calories: 180, protein: 3, carbs: 41, fat: 0 },
        { name: 'Brócoli', quantity: '200g', calories: 68, protein: 6, carbs: 14, fat: 0 },
        { name: 'Aceite de oliva', quantity: '15ml', calories: 135, protein: 0, carbs: 0, fat: 15 }
      ],
      recipe: { ingredients: isVegetarian ? ['2 hamburguesas lentejas', 'Pan', 'Boniato', 'Lechuga', 'Tomate'] : ['200g pollo', '200g boniato', 'Brócoli', 'Aceite', 'Hierbas'], instructions: isVegetarian ? ['Cocinar hamburguesas', 'Hornear boniato', 'Montar con ensalada'] : ['Grillar pollo', 'Hornear boniato 35 min', 'Vapor brócoli'], prep_time: 30 }
    },
    {
      name: isVegetarian ? 'Ensalada César Vegana' : 'Lubina al Horno',
      foods: isVegetarian ? [
        { name: 'Tofu marinado', quantity: '150g', calories: 135, protein: 15, carbs: 4, fat: 7 },
        { name: 'Lechuga romana', quantity: '200g', calories: 34, protein: 2, carbs: 6, fat: 0 },
        { name: 'Picatostes integrales', quantity: '40g', calories: 160, protein: 4, carbs: 28, fat: 4 },
        { name: 'Salsa césar vegana', quantity: '30ml', calories: 90, protein: 1, carbs: 2, fat: 9 },
        { name: 'Aguacate', quantity: '80g', calories: 130, protein: 2, carbs: 7, fat: 12 }
      ] : [
        { name: 'Lubina', quantity: '200g', calories: 200, protein: 38, carbs: 0, fat: 5 },
        { name: 'Patatas baby', quantity: '200g', calories: 170, protein: 4, carbs: 38, fat: 0 },
        { name: 'Tomate cherry', quantity: '150g', calories: 27, protein: 1, carbs: 6, fat: 0 },
        { name: 'Aceite de oliva', quantity: '20ml', calories: 180, protein: 0, carbs: 0, fat: 20 }
      ],
      recipe: { ingredients: isVegetarian ? ['150g tofu', 'Lechuga', 'Picatostes', 'Salsa', 'Aguacate'] : ['200g lubina', 'Patatas', 'Tomates', 'Aceite', 'Hierbas'], instructions: isVegetarian ? ['Marinar y dorar tofu', 'Mezclar con lechuga', 'Añadir salsa y picatostes'] : ['Hornear lubina con patatas 25 min', 'Añadir tomates al final'], prep_time: 30 }
    },
    {
      name: isVegetarian ? 'Crema de Calabaza con Garbanzos' : 'Merluza con Pisto',
      foods: isVegetarian ? [
        { name: 'Calabaza', quantity: '300g', calories: 78, protein: 3, carbs: 18, fat: 0 },
        { name: 'Garbanzos', quantity: '150g', calories: 210, protein: 11, carbs: 34, fat: 3 },
        { name: 'Leche de coco', quantity: '100ml', calories: 180, protein: 2, carbs: 3, fat: 18 },
        { name: 'Pan integral tostado', quantity: '2 rebanadas', calories: 160, protein: 6, carbs: 28, fat: 2 }
      ] : [
        { name: 'Merluza', quantity: '200g', calories: 180, protein: 36, carbs: 0, fat: 3 },
        { name: 'Pimiento rojo', quantity: '100g', calories: 30, protein: 1, carbs: 6, fat: 0 },
        { name: 'Calabacín', quantity: '150g', calories: 26, protein: 2, carbs: 5, fat: 0 },
        { name: 'Berenjena', quantity: '150g', calories: 38, protein: 2, carbs: 9, fat: 0 },
        { name: 'Tomate', quantity: '200g', calories: 36, protein: 2, carbs: 8, fat: 0 },
        { name: 'Aceite de oliva', quantity: '20ml', calories: 180, protein: 0, carbs: 0, fat: 20 }
      ],
      recipe: { ingredients: isVegetarian ? ['300g calabaza', '150g garbanzos', 'Leche coco', 'Pan', 'Curry'] : ['200g merluza', 'Pimiento', 'Calabacín', 'Berenjena', 'Tomate', 'Aceite'], instructions: isVegetarian ? ['Hervir y triturar calabaza', 'Añadir garbanzos y coco', 'Servir con tostadas'] : ['Preparar pisto con verduras', 'Hornear merluza', 'Servir sobre el pisto'], prep_time: 35 }
    },
    {
      name: isVegetarian ? 'Pizza Casera Vegetal' : 'Tacos de Pollo',
      foods: isVegetarian ? [
        { name: 'Masa de pizza integral', quantity: '1 base', calories: 350, protein: 10, carbs: 65, fat: 6 },
        { name: 'Tomate triturado', quantity: '100g', calories: 20, protein: 1, carbs: 4, fat: 0 },
        { name: 'Mozzarella vegana', quantity: '80g', calories: 200, protein: 4, carbs: 8, fat: 16 },
        { name: 'Champiñones', quantity: '100g', calories: 22, protein: 3, carbs: 3, fat: 0 },
        { name: 'Pimiento', quantity: '80g', calories: 25, protein: 1, carbs: 5, fat: 0 },
        { name: 'Aceitunas', quantity: '30g', calories: 45, protein: 0, carbs: 1, fat: 5 }
      ] : [
        { name: 'Pollo desmenuzado', quantity: '200g', calories: 220, protein: 44, carbs: 0, fat: 3 },
        { name: 'Tortillas de maíz', quantity: '3 unidades', calories: 210, protein: 6, carbs: 42, fat: 3 },
        { name: 'Aguacate', quantity: '100g', calories: 160, protein: 2, carbs: 9, fat: 15 },
        { name: 'Pico de gallo', quantity: '80g', calories: 16, protein: 1, carbs: 3, fat: 0 },
        { name: 'Queso rallado', quantity: '30g', calories: 120, protein: 8, carbs: 1, fat: 10 }
      ],
      recipe: { ingredients: isVegetarian ? ['1 base pizza', 'Tomate', 'Mozzarella vegana', 'Champiñones', 'Pimiento', 'Aceitunas'] : ['200g pollo', '3 tortillas', 'Aguacate', 'Pico de gallo', 'Queso', 'Lima'], instructions: isVegetarian ? ['Extender tomate en base', 'Añadir ingredientes', 'Hornear 15 min a 220°C'] : ['Cocinar y desmenuzar pollo', 'Calentar tortillas', 'Montar tacos'], prep_time: 25 }
    },
    {
      name: isVegetarian ? 'Tortilla de Patatas Vegana' : 'Dorada con Ensalada',
      foods: isVegetarian ? [
        { name: 'Patata', quantity: '300g', calories: 255, protein: 6, carbs: 57, fat: 0 },
        { name: 'Harina de garbanzo', quantity: '60g', calories: 210, protein: 13, carbs: 35, fat: 4 },
        { name: 'Cebolla', quantity: '100g', calories: 40, protein: 1, carbs: 9, fat: 0 },
        { name: 'Aceite de oliva', quantity: '30ml', calories: 270, protein: 0, carbs: 0, fat: 30 },
        { name: 'Ensalada', quantity: '100g', calories: 20, protein: 2, carbs: 3, fat: 0 }
      ] : [
        { name: 'Dorada', quantity: '200g', calories: 180, protein: 38, carbs: 0, fat: 3 },
        { name: 'Lechuga variada', quantity: '150g', calories: 25, protein: 2, carbs: 4, fat: 0 },
        { name: 'Tomate', quantity: '150g', calories: 27, protein: 1, carbs: 6, fat: 0 },
        { name: 'Pepino', quantity: '100g', calories: 16, protein: 1, carbs: 4, fat: 0 },
        { name: 'Aceite de oliva', quantity: '20ml', calories: 180, protein: 0, carbs: 0, fat: 20 },
        { name: 'Pan integral', quantity: '1 rebanada', calories: 80, protein: 3, carbs: 14, fat: 1 }
      ],
      recipe: { ingredients: isVegetarian ? ['300g patata', '60g harina garbanzo', 'Cebolla', 'Aceite', 'Agua'] : ['200g dorada', 'Lechuga', 'Tomate', 'Pepino', 'Aceite', 'Pan'], instructions: isVegetarian ? ['Freír patata y cebolla', 'Mezclar con masa de garbanzo', 'Cuajar tortilla'] : ['Hornear dorada 20 min', 'Preparar ensalada', 'Aliñar con aceite y limón'], prep_time: 30 }
    },
    {
      name: isVegetarian ? 'Pad Thai Vegano' : 'Ternera a la Plancha con Ensalada',
      foods: isVegetarian ? [
        { name: 'Fideos de arroz', quantity: '100g', calories: 350, protein: 3, carbs: 83, fat: 0 },
        { name: 'Tofu', quantity: '150g', calories: 135, protein: 15, carbs: 4, fat: 7 },
        { name: 'Brotes de soja', quantity: '100g', calories: 31, protein: 3, carbs: 6, fat: 0 },
        { name: 'Cacahuetes', quantity: '30g', calories: 170, protein: 8, carbs: 5, fat: 14 },
        { name: 'Salsa pad thai', quantity: '40ml', calories: 60, protein: 1, carbs: 12, fat: 1 }
      ] : [
        { name: 'Entrecot de ternera', quantity: '180g', calories: 252, protein: 45, carbs: 0, fat: 7 },
        { name: 'Rúcula', quantity: '100g', calories: 25, protein: 3, carbs: 4, fat: 0 },
        { name: 'Tomate', quantity: '150g', calories: 27, protein: 1, carbs: 6, fat: 0 },
        { name: 'Parmesano', quantity: '20g', calories: 80, protein: 7, carbs: 1, fat: 6 },
        { name: 'Aceite de oliva', quantity: '15ml', calories: 135, protein: 0, carbs: 0, fat: 15 }
      ],
      recipe: { ingredients: isVegetarian ? ['100g fideos', '150g tofu', 'Brotes soja', 'Cacahuetes', 'Salsa', 'Lima'] : ['180g ternera', 'Rúcula', 'Tomate', 'Parmesano', 'Aceite', 'Limón'], instructions: isVegetarian ? ['Cocinar fideos', 'Saltear tofu', 'Mezclar todo con salsa'] : ['Grillar ternera al punto', 'Preparar ensalada', 'Añadir láminas de parmesano'], prep_time: 25 }
    }
  ];

  // SNACKS VARIADOS (7 opciones)
  const snacks = [
    { name: 'Yogur Griego con Frutos Secos', foods: [{ name: 'Yogur griego', quantity: '200g', calories: 130, protein: 20, carbs: 8, fat: 2 }, { name: 'Nueces', quantity: '30g', calories: 200, protein: 5, carbs: 4, fat: 19 }] },
    { name: 'Batido de Proteína', foods: [{ name: 'Proteína whey', quantity: '30g', calories: 120, protein: 24, carbs: 3, fat: 1 }, { name: 'Plátano', quantity: '1 unidad', calories: 105, protein: 1, carbs: 27, fat: 0 }, { name: 'Leche', quantity: '250ml', calories: 125, protein: 8, carbs: 12, fat: 5 }] },
    { name: 'Tostada con Aguacate', foods: [{ name: 'Pan integral', quantity: '2 rebanadas', calories: 160, protein: 6, carbs: 28, fat: 2 }, { name: 'Aguacate', quantity: '100g', calories: 160, protein: 2, carbs: 9, fat: 15 }] },
    { name: 'Mix de Frutos Secos y Frutas', foods: [{ name: 'Almendras', quantity: '25g', calories: 150, protein: 5, carbs: 3, fat: 13 }, { name: 'Pasas', quantity: '25g', calories: 75, protein: 1, carbs: 20, fat: 0 }, { name: 'Manzana', quantity: '1 unidad', calories: 80, protein: 0, carbs: 21, fat: 0 }] },
    { name: 'Queso Cottage con Frutas', foods: [{ name: 'Queso cottage', quantity: '200g', calories: 160, protein: 24, carbs: 6, fat: 4 }, { name: 'Piña', quantity: '100g', calories: 50, protein: 1, carbs: 13, fat: 0 }] },
    { name: 'Hummus con Crudités', foods: [{ name: 'Hummus', quantity: '100g', calories: 180, protein: 8, carbs: 15, fat: 10 }, { name: 'Zanahoria', quantity: '150g', calories: 62, protein: 1, carbs: 14, fat: 0 }, { name: 'Pepino', quantity: '100g', calories: 16, protein: 1, carbs: 4, fat: 0 }] },
    { name: 'Tortitas de Arroz con Crema de Cacahuete', foods: [{ name: 'Tortitas de arroz', quantity: '4 unidades', calories: 100, protein: 2, carbs: 22, fat: 1 }, { name: 'Crema de cacahuete', quantity: '30g', calories: 180, protein: 7, carbs: 6, fat: 15 }] }
  ];

  // Seleccionar comidas según el día
  const breakfast = { ...breakfasts[dayIndex % breakfasts.length], meal_type: 'breakfast' as const, time_suggestion: '08:00', calories: breakfastCalories, protein: 30, carbs: 50, fat: 15 };
  const lunch = { ...lunches[dayIndex % lunches.length], meal_type: 'lunch' as const, time_suggestion: '13:30', calories: lunchCalories, protein: 45, carbs: 60, fat: 18 };
  const snack = { ...snacks[dayIndex % snacks.length], meal_type: 'snack' as const, time_suggestion: '17:00', calories: snackCalories, protein: 15, carbs: 25, fat: 12 };
  const dinner = { ...dinners[dayIndex % dinners.length], meal_type: 'dinner' as const, time_suggestion: '21:00', calories: dinnerCalories, protein: 35, carbs: 40, fat: 15 };
  
  const meals = [breakfast, lunch, snack, dinner];
  return meals.slice(0, mealsPerDay);
}

// Helper functions
function calculateTDEE(goals: UserGoals, profileData?: UserProfileData): number {
  const weight = goals.current_weight || 70;
  const height = goals.height || 170;
  const age = goals.age || 30;
  
  // Mifflin-St Jeor (para hombres, ajustar -161 para mujeres)
  let bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  
  // Multiplicadores base de actividad
  const activityMultipliers = {
    sedentary: 1.2,      // Oficina, sin ejercicio
    light: 1.375,        // 1-2 días/semana
    moderate: 1.55,      // 3-4 días/semana
    active: 1.725,       // 5-6 días/semana
    very_active: 1.9     // 6-7 días intenso
  };
  
  let tdee = bmr * activityMultipliers[goals.activity_level];
  
  // Si hay datos de deportes específicos, calcular más precisamente
  if (profileData?.sports_frequency) {
    const sportsData = profileData.sports_frequency;
    let weeklyExtraCalories = 0;
    
    // Calorías quemadas por hora según deporte (aproximado para 70kg)
    const caloriesPerHour: Record<string, number> = {
      gym: 400,
      crossfit: 600,
      running: 700,
      swimming: 500,
      cycling: 450,
      yoga: 200,
      other: 350
    };
    
    // Calcular calorías extra semanales por cada deporte
    Object.entries(sportsData).forEach(([sport, data]) => {
      if (data && typeof data === 'object' && 'days' in data) {
        const sportData = data as { days: number; duration?: number };
        const daysPerWeek = sportData.days || 0;
        const durationHours = (sportData.duration || 60) / 60;
        const caloriesBurned = (caloriesPerHour[sport] || 350) * (weight / 70); // Ajustar por peso
        weeklyExtraCalories += daysPerWeek * durationHours * caloriesBurned;
      }
    });
    
    // Añadir calorías extra diarias promedio
    tdee += weeklyExtraCalories / 7;
  }
  
  // Ajuste según objetivo
  if (goals.primary === 'lose_weight') {
    tdee -= 400; // Déficit moderado
  } else if (goals.primary === 'gain_muscle') {
    tdee += 400; // Superávit para ganar masa
  }
  
  // Mínimo saludable
  return Math.max(Math.round(tdee), 1500);
}

// Demo data functions
function getDemoWorkoutRecommendation(trainingTypes: TrainingType[]): AIRecommendation {
  const isCrossfit = trainingTypes.includes('crossfit');
  
  if (isCrossfit) {
    return {
      type: 'workout',
      title: 'WOD: Fuerza y Cardio',
      content: `🏋️ **Calentamiento (10 min)**
- 400m carrera suave
- 20 air squats
- 10 push-ups
- 10 ring rows

💪 **Fuerza (15 min)**
- Back Squat: 5x5 al 75% RM
- Descanso 2 min entre series

⏱️ **WOD - AMRAP 12 min**
- 12 Wall balls (9/6 kg)
- 9 Toes-to-bar
- 6 Burpees over the bar

🧘 **Enfriamiento (5 min)**
- Estiramientos de cadera y hombros`,
      reasoning: 'Este WOD combina trabajo de fuerza con un metcon que mejora tu capacidad cardiovascular y resistencia muscular.'
    };
  }
  
  return {
    type: 'workout',
    title: 'Día de Pecho y Tríceps',
    content: `🏋️ **Calentamiento (10 min)**
- 5 min cardio ligero
- Rotaciones de hombros
- Press con banda elástica

💪 **Ejercicios principales**

1. **Press de banca** - 4x8-10
   - Peso: 70-80% RM
   - Descanso: 90 seg

2. **Press inclinado con mancuernas** - 3x10-12
   - Descanso: 60 seg

3. **Aperturas en polea** - 3x12-15
   - Enfoque en contracción

4. **Fondos en paralelas** - 3x10-12
   - Añadir peso si es fácil

5. **Press francés** - 3x10-12

6. **Extensiones en polea** - 3x12-15

🔥 **Finisher**
- 100 flexiones (series al fallo)`,
    reasoning: 'Entrenamiento de hipertrofia enfocado en pecho y tríceps. Buena combinación de ejercicios compuestos y aislamiento.'
  };
}

function getDemoDietPlan(goals: UserGoals): DietPlan {
  const calories = goals.daily_calories || calculateTDEE(goals);
  
  return {
    id: crypto.randomUUID(),
    user_id: '',
    name: 'Plan Equilibrado',
    daily_calories: calories,
    meals: [
      {
        meal_type: 'breakfast',
        recipes: [{
          id: '1',
          name: 'Bowl de avena con frutas',
          description: 'Desayuno energético y nutritivo',
          ingredients: [
            { name: 'Avena', quantity: 60, unit: 'g' },
            { name: 'Leche', quantity: 200, unit: 'ml' },
            { name: 'Plátano', quantity: 1, unit: 'unidad' },
            { name: 'Frutos rojos', quantity: 50, unit: 'g' },
            { name: 'Miel', quantity: 1, unit: 'cucharada' }
          ],
          instructions: ['Cocinar avena con leche', 'Añadir frutas encima', 'Decorar con miel'],
          prep_time_minutes: 5,
          cook_time_minutes: 5,
          servings: 1,
          calories_per_serving: 420,
          protein_per_serving: 14,
          carbs_per_serving: 72,
          fat_per_serving: 8,
          tags: ['desayuno', 'energético']
        }],
        target_calories: Math.round(calories * 0.25)
      },
      {
        meal_type: 'lunch',
        recipes: [{
          id: '2',
          name: 'Pollo a la plancha con arroz y verduras',
          description: 'Comida completa y equilibrada',
          ingredients: [
            { name: 'Pechuga de pollo', quantity: 200, unit: 'g' },
            { name: 'Arroz integral', quantity: 80, unit: 'g' },
            { name: 'Brócoli', quantity: 150, unit: 'g' },
            { name: 'Aceite de oliva', quantity: 1, unit: 'cucharada' }
          ],
          instructions: ['Cocinar arroz', 'Grillar pollo con especias', 'Saltear brócoli'],
          prep_time_minutes: 10,
          cook_time_minutes: 25,
          servings: 1,
          calories_per_serving: 550,
          protein_per_serving: 45,
          carbs_per_serving: 55,
          fat_per_serving: 12,
          tags: ['almuerzo', 'proteína', 'bajo en grasa']
        }],
        target_calories: Math.round(calories * 0.35)
      },
      {
        meal_type: 'snack',
        recipes: [{
          id: '3',
          name: 'Yogur griego con nueces',
          description: 'Snack proteico',
          ingredients: [
            { name: 'Yogur griego', quantity: 200, unit: 'g' },
            { name: 'Nueces', quantity: 30, unit: 'g' }
          ],
          instructions: ['Mezclar yogur con nueces'],
          prep_time_minutes: 2,
          cook_time_minutes: 0,
          servings: 1,
          calories_per_serving: 280,
          protein_per_serving: 18,
          carbs_per_serving: 12,
          fat_per_serving: 18,
          tags: ['snack', 'proteína']
        }],
        target_calories: Math.round(calories * 0.10)
      },
      {
        meal_type: 'dinner',
        recipes: [{
          id: '4',
          name: 'Salmón al horno con patata y espárragos',
          description: 'Cena rica en omega-3',
          ingredients: [
            { name: 'Salmón', quantity: 180, unit: 'g' },
            { name: 'Patata', quantity: 150, unit: 'g' },
            { name: 'Espárragos', quantity: 100, unit: 'g' },
            { name: 'Limón', quantity: 1, unit: 'unidad' }
          ],
          instructions: ['Hornear salmón con limón', 'Asar patatas', 'Grillar espárragos'],
          prep_time_minutes: 10,
          cook_time_minutes: 25,
          servings: 1,
          calories_per_serving: 480,
          protein_per_serving: 38,
          carbs_per_serving: 35,
          fat_per_serving: 20,
          tags: ['cena', 'omega-3', 'saludable']
        }],
        target_calories: Math.round(calories * 0.30)
      }
    ],
    created_at: new Date().toISOString()
  };
}

function getDemoRecipe(name: string): Recipe {
  return {
    id: crypto.randomUUID(),
    name: name || 'Receta saludable',
    description: 'Una receta nutritiva y deliciosa',
    ingredients: [
      { name: 'Ingrediente 1', quantity: 200, unit: 'g' },
      { name: 'Ingrediente 2', quantity: 100, unit: 'g' },
      { name: 'Ingrediente 3', quantity: 50, unit: 'ml' }
    ],
    instructions: [
      'Preparar todos los ingredientes',
      'Mezclar los ingredientes principales',
      'Cocinar a fuego medio durante 15 minutos',
      'Servir caliente'
    ],
    prep_time_minutes: 15,
    cook_time_minutes: 20,
    servings: 2,
    calories_per_serving: 350,
    protein_per_serving: 25,
    carbs_per_serving: 30,
    fat_per_serving: 12,
    tags: ['saludable', 'fácil', 'rápido']
  };
}

// Genera lista de compra semanal basada en el plan de dieta real
function generateWeeklyShoppingListFromDiet(dietPlan: WeeklyDietPlan): { ingredient: string; quantity: number; unit: string; category: string; checked: boolean }[] {
  const ingredientMap = new Map<string, { quantity: number; unit: string; category: string }>();
  
  // Función para categorizar ingredientes
  const categorizeIngredient = (name: string): string => {
    const lower = name.toLowerCase();
    // Carnes y pescados
    if (['pollo', 'pavo', 'ternera', 'cerdo', 'salmón', 'atún', 'merluza', 'gambas', 'jamón', 'lomo', 'carne'].some(m => lower.includes(m))) return 'meat';
    // Lácteos
    if (['leche', 'yogur', 'queso', 'huevo', 'nata', 'mantequilla', 'requesón'].some(d => lower.includes(d))) return 'dairy';
    // Cereales y granos
    if (['arroz', 'pasta', 'pan', 'avena', 'quinoa', 'cereales', 'harina', 'tortita', 'tostada'].some(g => lower.includes(g))) return 'grains';
    // Frutas y verduras
    if (['tomate', 'lechuga', 'espinaca', 'brócoli', 'zanahoria', 'pimiento', 'cebolla', 'ajo', 'patata', 'boniato', 'aguacate',
         'manzana', 'plátano', 'naranja', 'fresa', 'arándano', 'kiwi', 'piña', 'melón', 'sandía', 'uva', 'pera', 'melocotón',
         'frambuesa', 'fruta', 'verdura', 'ensalada', 'champiñón', 'calabacín', 'berenjena', 'pepino', 'apio', 'judía', 'guisante'].some(p => lower.includes(p))) return 'produce';
    return 'other';
  };
  
  // Función para normalizar el nombre del ingrediente
  const normalizeIngredient = (name: string): string => {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  };
  
  // Función para parsear cantidad del string
  const parseQuantityFromString = (quantityStr: string): { quantity: number; unit: string } => {
    const match = quantityStr.match(/(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|litros?|unidades?|u\.|piezas?|rebanadas?|cucharadas?|tazas?)?/i);
    if (match) {
      const num = parseFloat(match[1].replace(',', '.'));
      const unit = match[2] || 'unidades';
      return { quantity: num, unit: unit.toLowerCase() };
    }
    return { quantity: 1, unit: 'unidad' };
  };
  
  // Recorrer todos los días y comidas
  dietPlan.days?.forEach(day => {
    day.meals?.forEach(meal => {
      // Extraer alimentos de la comida
      meal.foods?.forEach(food => {
        const normalizedName = normalizeIngredient(food.name);
        const { quantity, unit } = parseQuantityFromString(food.quantity);
        const category = categorizeIngredient(food.name);
        
        if (ingredientMap.has(normalizedName)) {
          const existing = ingredientMap.get(normalizedName)!;
          // Sumar cantidades si tienen la misma unidad
          if (existing.unit === unit || (existing.unit.startsWith('unidad') && unit.startsWith('unidad'))) {
            existing.quantity += quantity;
          }
        } else {
          ingredientMap.set(normalizedName, { quantity, unit, category });
        }
      });
      
      // Extraer ingredientes de las recetas
      meal.recipe?.ingredients?.forEach(ing => {
        const { quantity, unit } = parseQuantityFromString(ing);
        // Extraer nombre quitando la cantidad
        const namePart = ing.replace(/^\d+(?:[.,]\d+)?\s*(g|kg|ml|l|litros?|unidades?|u\.|piezas?|rebanadas?|cucharadas?|tazas?)?\s*/i, '').trim();
        const normalizedName = normalizeIngredient(namePart || ing);
        const category = categorizeIngredient(namePart || ing);
        
        if (ingredientMap.has(normalizedName)) {
          const existing = ingredientMap.get(normalizedName)!;
          if (existing.unit === unit) {
            existing.quantity += quantity;
          }
        } else {
          ingredientMap.set(normalizedName, { quantity, unit, category });
        }
      });
    });
  });
  
  // Convertir el mapa a array y redondear cantidades
  const shoppingList = Array.from(ingredientMap.entries())
    .map(([ingredient, data]) => ({
      ingredient: ingredient.charAt(0).toUpperCase() + ingredient.slice(1), // Capitalizar
      quantity: Math.ceil(data.quantity), // Redondear hacia arriba
      unit: data.unit,
      category: data.category,
      checked: false
    }))
    // Ordenar por categoría
    .sort((a, b) => {
      const categoryOrder = ['produce', 'meat', 'dairy', 'grains', 'other'];
      return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    });
  
  // Añadir items básicos que siempre se necesitan si no están
  const basics = [
    { ingredient: 'Aceite de oliva virgen extra', quantity: 1, unit: 'litro', category: 'other' },
    { ingredient: 'Sal', quantity: 1, unit: 'paquete', category: 'other' },
    { ingredient: 'Pimienta', quantity: 1, unit: 'bote', category: 'other' },
  ];
  
  basics.forEach(basic => {
    if (!shoppingList.some(item => item.ingredient.toLowerCase().includes(basic.ingredient.toLowerCase().split(' ')[0]))) {
      shoppingList.push({ ...basic, checked: false });
    }
  });
  
  return shoppingList;
}

function getDemoChatResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('entreno') || lowerMessage.includes('ejercicio')) {
    return '💪 ¡Genial que quieras entrenar! Te recomiendo alternar días de fuerza con días de cardio para obtener mejores resultados. Recuerda calentar siempre antes de empezar y estirar al terminar. ¿Qué tipo de entrenamiento te gustaría hacer hoy?';
  }
  
  if (lowerMessage.includes('dieta') || lowerMessage.includes('comer') || lowerMessage.includes('comida')) {
    return '🥗 La nutrición es clave para alcanzar tus objetivos. Te recomiendo comer proteína en cada comida, muchas verduras y carbohidratos complejos. Evita los ultraprocesados y mantente hidratado. ¿Quieres que te genere un plan de comidas personalizado?';
  }
  
  if (lowerMessage.includes('peso') || lowerMessage.includes('adelgazar') || lowerMessage.includes('músculo')) {
    return '⚖️ Para cambiar tu composición corporal, necesitas ser consistente tanto con el entrenamiento como con la alimentación. Si quieres perder grasa, mantén un déficit calórico moderado. Si quieres ganar músculo, necesitas superávit y suficiente proteína. ¿Cuál es tu objetivo principal?';
  }
  
  return '¡Hola! 👋 Soy FitBot, tu asistente de fitness. Puedo ayudarte con recomendaciones de entrenamiento, planes de nutrición, recetas saludables y más. ¿En qué puedo ayudarte hoy?';
}
