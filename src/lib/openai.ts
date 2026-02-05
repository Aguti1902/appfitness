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
  if (DEMO_MODE) {
    return getDemoShoppingList();
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
    return getDemoShoppingList();
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
    return generateDemoPlan(goals, trainingTypes, profileData, dailyCalories);
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
    return generateDemoPlan(goals, trainingTypes, profileData, dailyCalories);
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

// Función para generar plan de demo cuando no hay API key
function generateDemoPlan(
  goals: UserGoals,
  trainingTypes: TrainingType[],
  profileData?: UserProfileData,
  dailyCalories?: number
): GeneratedPlan {
  const calories = dailyCalories || calculateTDEE(goals);
  const isCrossfit = trainingTypes.includes('crossfit');
  
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  // Generar plan de entrenamiento
  const workoutDays = dayNames.map((dayName, index) => {
    const isRestDay = index === 0 || index === 3; // Domingo y Miércoles descanso
    
    if (isRestDay) {
      return {
        day: index,
        day_name: dayName,
        workout_type: 'gym' as TrainingType,
        title: 'Día de Descanso Activo',
        duration_minutes: 0,
        is_rest_day: true,
        exercises: [],
        notes: 'Descansa o haz actividad ligera como caminar o estiramientos.'
      };
    }
    
    // Rotación de entrenamientos
    const workoutTypes = isCrossfit 
      ? ['Fuerza + WOD', 'Cardio + Técnica', 'Full Body', 'Gimnásticos + Metcon', 'Olímpicos']
      : ['Pecho y Tríceps', 'Espalda y Bíceps', 'Piernas', 'Hombros y Core', 'Full Body'];
    
    const workoutIndex = [1, 2, 4, 5, 6].indexOf(index);
    const workout = workoutTypes[workoutIndex] || 'Full Body';
    
    return {
      day: index,
      day_name: dayName,
      workout_type: isCrossfit ? 'crossfit' as TrainingType : 'gym' as TrainingType,
      title: workout,
      duration_minutes: profileData?.workout_duration_preference || 60,
      is_rest_day: false,
      exercises: generateDemoExercises(workout, isCrossfit, profileData?.injuries),
      notes: `Entreno de ${workout.toLowerCase()}`
    };
  });
  
  const workoutPlan: WeeklyWorkoutPlan = {
    name: isCrossfit ? 'Plan CrossFit Personalizado' : 'Plan de Hipertrofia',
    description: `Plan diseñado para ${getGoalText(goals.primary).toLowerCase()}`,
    days: workoutDays,
    rest_days: [0, 3],
    estimated_calories_burned_weekly: isCrossfit ? 3500 : 2500
  };
  
  // Generar plan de dieta
  const dietDays = dayNames.map((dayName, index) => ({
    day: index,
    day_name: dayName,
    meals: generateDemoMeals(calories, profileData),
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
  
  return {
    workout_plan: workoutPlan,
    diet_plan: dietPlan,
    shopping_list: getDemoShoppingList().map(item => ({ 
      ...item, 
      checked: false,
      category: item.category as ShoppingListItem['category']
    })),
    recommendations: generatePersonalizedTips(goals, profileData),
    generated_at: new Date().toISOString()
  };
}

function generateDemoExercises(workoutType: string, isCrossfit: boolean, injuries?: string[]): PlannedExercise[] {
  const hasBackInjury = injuries?.some(i => i.toLowerCase().includes('espalda'));
  const hasKneeInjury = injuries?.some(i => i.toLowerCase().includes('rodilla'));
  
  if (isCrossfit) {
    if (workoutType.includes('Fuerza')) {
      return [
        { name: 'Back Squat', sets: 5, reps: '5', weight_recommendation: '75% RM', rest_seconds: 120, alternatives: hasKneeInjury ? ['Leg Press', 'Goblet Squat'] : undefined },
        { name: 'Strict Press', sets: 5, reps: '5', weight_recommendation: '70% RM', rest_seconds: 120 },
        { name: 'WOD: 21-15-9', sets: 1, reps: 'Thrusters + Pull-ups', rest_seconds: 0, notes: 'Por tiempo' }
      ];
    }
    return [
      { name: 'EMOM 10 min', sets: 10, reps: '5 Power Clean', weight_recommendation: '60% RM', rest_seconds: 0 },
      { name: 'AMRAP 15 min', sets: 1, reps: '12 Cal Row, 9 Burpees, 6 C2B', rest_seconds: 0 }
    ];
  }
  
  // Gimnasio tradicional
  if (workoutType.includes('Pecho')) {
    return [
      { name: 'Press de Banca', sets: 4, reps: '8-10', weight_recommendation: '75% RM', rest_seconds: 90 },
      { name: 'Press Inclinado Mancuernas', sets: 3, reps: '10-12', rest_seconds: 60 },
      { name: 'Aperturas en Polea', sets: 3, reps: '12-15', rest_seconds: 60 },
      { name: 'Fondos en Paralelas', sets: 3, reps: '10-12', rest_seconds: 60 },
      { name: 'Press Francés', sets: 3, reps: '10-12', rest_seconds: 60 },
      { name: 'Extensiones en Polea', sets: 3, reps: '12-15', rest_seconds: 45 }
    ];
  }
  
  if (workoutType.includes('Espalda')) {
    const exercises: PlannedExercise[] = [
      { name: 'Dominadas', sets: 4, reps: '8-10', rest_seconds: 90, alternatives: ['Jalón al Pecho'] },
      { name: 'Remo con Barra', sets: 4, reps: '8-10', weight_recommendation: '70% RM', rest_seconds: 90 },
      { name: 'Remo en Polea Baja', sets: 3, reps: '10-12', rest_seconds: 60 },
      { name: 'Face Pulls', sets: 3, reps: '15', rest_seconds: 45 },
      { name: 'Curl con Barra', sets: 3, reps: '10-12', rest_seconds: 60 },
      { name: 'Curl Martillo', sets: 3, reps: '12', rest_seconds: 45 }
    ];
    if (hasBackInjury) {
      exercises[1] = { name: 'Remo en Máquina', sets: 4, reps: '10-12', rest_seconds: 60 };
    }
    return exercises;
  }
  
  if (workoutType.includes('Piernas')) {
    const exercises: PlannedExercise[] = [
      { name: 'Sentadilla', sets: 4, reps: '8-10', weight_recommendation: '75% RM', rest_seconds: 120 },
      { name: 'Prensa de Piernas', sets: 4, reps: '10-12', rest_seconds: 90 },
      { name: 'Peso Muerto Rumano', sets: 3, reps: '10-12', rest_seconds: 90 },
      { name: 'Extensiones de Cuádriceps', sets: 3, reps: '12-15', rest_seconds: 60 },
      { name: 'Curl Femoral', sets: 3, reps: '12-15', rest_seconds: 60 },
      { name: 'Elevaciones de Gemelos', sets: 4, reps: '15-20', rest_seconds: 45 }
    ];
    if (hasKneeInjury) {
      exercises[0] = { name: 'Sentadilla Goblet', sets: 4, reps: '12-15', rest_seconds: 90, notes: 'Peso moderado' };
    }
    return exercises;
  }
  
  // Default: Full Body
  return [
    { name: 'Sentadilla', sets: 3, reps: '10', weight_recommendation: '70% RM', rest_seconds: 90 },
    { name: 'Press de Banca', sets: 3, reps: '10', weight_recommendation: '70% RM', rest_seconds: 90 },
    { name: 'Remo con Barra', sets: 3, reps: '10', rest_seconds: 90 },
    { name: 'Press Militar', sets: 3, reps: '10', rest_seconds: 60 },
    { name: 'Peso Muerto', sets: 3, reps: '8', weight_recommendation: '70% RM', rest_seconds: 120 }
  ];
}

function generateDemoMeals(dailyCalories: number, profileData?: UserProfileData) {
  const mealsPerDay = profileData?.meals_per_day || 4;
  const isVegetarian = profileData?.diet_type === 'vegetarian' || profileData?.diet_type === 'vegan';
  
  const breakfastCalories = Math.round(dailyCalories * 0.25);
  const lunchCalories = Math.round(dailyCalories * 0.35);
  const dinnerCalories = Math.round(dailyCalories * 0.25);
  const snackCalories = Math.round(dailyCalories * 0.15);
  
  const meals = [
    {
      meal_type: 'breakfast' as const,
      name: 'Desayuno Energético',
      time_suggestion: '08:00',
      foods: [
        { name: 'Avena', quantity: '60g', calories: 230, protein: 8, carbs: 40, fat: 5 },
        { name: isVegetarian ? 'Leche de almendras' : 'Leche', quantity: '200ml', calories: 100, protein: 7, carbs: 10, fat: 4 },
        { name: 'Plátano', quantity: '1 unidad', calories: 90, protein: 1, carbs: 23, fat: 0 }
      ],
      calories: breakfastCalories,
      protein: 16,
      carbs: 73,
      fat: 9,
      recipe: {
        ingredients: ['60g avena', '200ml leche', '1 plátano', '1 cdta miel', 'Canela al gusto'],
        instructions: ['Calentar leche', 'Añadir avena y cocinar 3-5 min', 'Servir con plátano y miel'],
        prep_time: 10
      }
    },
    {
      meal_type: 'lunch' as const,
      name: isVegetarian ? 'Bowl de Legumbres y Quinoa' : 'Pollo con Arroz y Verduras',
      time_suggestion: '13:30',
      foods: isVegetarian ? [
        { name: 'Quinoa', quantity: '80g', calories: 280, protein: 10, carbs: 50, fat: 4 },
        { name: 'Garbanzos', quantity: '150g', calories: 220, protein: 12, carbs: 35, fat: 4 },
        { name: 'Verduras mixtas', quantity: '150g', calories: 50, protein: 3, carbs: 10, fat: 0 }
      ] : [
        { name: 'Pechuga de pollo', quantity: '200g', calories: 220, protein: 45, carbs: 0, fat: 3 },
        { name: 'Arroz integral', quantity: '80g', calories: 280, protein: 6, carbs: 58, fat: 2 },
        { name: 'Brócoli', quantity: '150g', calories: 50, protein: 4, carbs: 10, fat: 0 }
      ],
      calories: lunchCalories,
      protein: isVegetarian ? 25 : 55,
      carbs: isVegetarian ? 95 : 68,
      fat: isVegetarian ? 8 : 5,
      recipe: {
        ingredients: isVegetarian 
          ? ['80g quinoa', '150g garbanzos', '150g verduras', '1 cda aceite', 'Especias']
          : ['200g pollo', '80g arroz', '150g brócoli', '1 cda aceite', 'Especias'],
        instructions: isVegetarian
          ? ['Cocinar quinoa 15 min', 'Saltear verduras', 'Mezclar con garbanzos', 'Aliñar al gusto']
          : ['Cocinar arroz 20 min', 'Grillar pollo con especias', 'Hervir brócoli 5 min'],
        prep_time: 25
      }
    },
    {
      meal_type: 'snack' as const,
      name: 'Snack Proteico',
      time_suggestion: '17:00',
      foods: [
        { name: 'Yogur griego', quantity: '200g', calories: 130, protein: 20, carbs: 8, fat: 2 },
        { name: 'Nueces', quantity: '30g', calories: 200, protein: 5, carbs: 4, fat: 19 }
      ],
      calories: snackCalories,
      protein: 25,
      carbs: 12,
      fat: 21
    },
    {
      meal_type: 'dinner' as const,
      name: isVegetarian ? 'Revuelto de Tofu y Verduras' : 'Salmón al Horno con Verduras',
      time_suggestion: '21:00',
      foods: isVegetarian ? [
        { name: 'Tofu', quantity: '200g', calories: 180, protein: 20, carbs: 4, fat: 10 },
        { name: 'Verduras al horno', quantity: '200g', calories: 80, protein: 3, carbs: 16, fat: 1 },
        { name: 'Aguacate', quantity: '50g', calories: 80, protein: 1, carbs: 4, fat: 7 }
      ] : [
        { name: 'Salmón', quantity: '180g', calories: 350, protein: 36, carbs: 0, fat: 22 },
        { name: 'Patata', quantity: '150g', calories: 120, protein: 3, carbs: 27, fat: 0 },
        { name: 'Espárragos', quantity: '100g', calories: 20, protein: 2, carbs: 4, fat: 0 }
      ],
      calories: dinnerCalories,
      protein: isVegetarian ? 24 : 41,
      carbs: isVegetarian ? 24 : 31,
      fat: isVegetarian ? 18 : 22,
      recipe: {
        ingredients: isVegetarian
          ? ['200g tofu', '200g verduras', '50g aguacate', '1 cda aceite', 'Salsa soja']
          : ['180g salmón', '150g patata', '100g espárragos', 'Limón', 'Hierbas'],
        instructions: isVegetarian
          ? ['Cortar tofu en cubos', 'Saltear con verduras', 'Añadir salsa soja', 'Servir con aguacate']
          : ['Hornear salmón 20 min a 180°C', 'Asar patatas', 'Grillar espárragos'],
        prep_time: 25
      }
    }
  ];
  
  return meals.slice(0, mealsPerDay);
}

// Helper functions
function calculateTDEE(goals: UserGoals): number {
  const weight = goals.current_weight || 70;
  const height = goals.height || 170;
  const age = goals.age || 30;
  
  // Mifflin-St Jeor
  let bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  
  let tdee = bmr * activityMultipliers[goals.activity_level];
  
  if (goals.primary === 'lose_weight') tdee -= 500;
  if (goals.primary === 'gain_muscle') tdee += 300;
  
  return Math.round(tdee);
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

function getDemoShoppingList() {
  return [
    { ingredient: 'Pechuga de pollo', quantity: 1, unit: 'kg', category: 'meat' },
    { ingredient: 'Salmón', quantity: 500, unit: 'g', category: 'meat' },
    { ingredient: 'Huevos', quantity: 12, unit: 'unidades', category: 'dairy' },
    { ingredient: 'Leche', quantity: 2, unit: 'litros', category: 'dairy' },
    { ingredient: 'Yogur griego', quantity: 4, unit: 'unidades', category: 'dairy' },
    { ingredient: 'Arroz integral', quantity: 500, unit: 'g', category: 'grains' },
    { ingredient: 'Avena', quantity: 500, unit: 'g', category: 'grains' },
    { ingredient: 'Pan integral', quantity: 1, unit: 'unidad', category: 'grains' },
    { ingredient: 'Brócoli', quantity: 500, unit: 'g', category: 'produce' },
    { ingredient: 'Espinacas', quantity: 300, unit: 'g', category: 'produce' },
    { ingredient: 'Tomates', quantity: 6, unit: 'unidades', category: 'produce' },
    { ingredient: 'Plátanos', quantity: 6, unit: 'unidades', category: 'produce' },
    { ingredient: 'Manzanas', quantity: 4, unit: 'unidades', category: 'produce' },
    { ingredient: 'Aguacates', quantity: 3, unit: 'unidades', category: 'produce' },
    { ingredient: 'Nueces', quantity: 200, unit: 'g', category: 'other' },
    { ingredient: 'Aceite de oliva', quantity: 500, unit: 'ml', category: 'other' }
  ];
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
