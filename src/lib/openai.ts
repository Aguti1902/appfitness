import OpenAI from 'openai';
import type { UserGoals, TrainingType, Recipe, AIRecommendation, DietPlan } from '../types';

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
