import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Meal, Recipe, DietPlan, ShoppingListItem } from '../types';

interface NutritionState {
  meals: Meal[];
  recipes: Recipe[];
  dietPlan: DietPlan | null;
  shoppingList: ShoppingListItem[];
  isLoading: boolean;
  
  // Actions
  fetchMeals: (userId: string, date?: string) => Promise<void>;
  addMeal: (meal: Omit<Meal, 'id'>) => Promise<{ error?: string }>;
  deleteMeal: (id: string) => Promise<{ error?: string }>;
  
  fetchRecipes: (userId?: string) => Promise<void>;
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<{ error?: string }>;
  
  setDietPlan: (plan: DietPlan | null) => void;
  
  generateShoppingList: (meals: Recipe[]) => void;
  toggleShoppingItem: (index: number) => void;
  clearShoppingList: () => void;
  
  // Stats
  getTodayNutrition: () => { calories: number; protein: number; carbs: number; fat: number };
  getWeeklyCalories: () => { date: string; calories: number }[];
}

// Demo data
const DEMO_MEALS: Meal[] = [
  {
    id: '1',
    user_id: 'demo-user-id',
    meal_type: 'breakfast',
    foods: [
      { name: 'Avena', quantity: 60, unit: 'g', calories: 230, protein: 8, carbs: 40, fat: 5 },
      { name: 'Plátano', quantity: 1, unit: 'unidad', calories: 105, protein: 1, carbs: 27, fat: 0 },
      { name: 'Leche', quantity: 200, unit: 'ml', calories: 100, protein: 7, carbs: 10, fat: 4 }
    ],
    total_calories: 435,
    total_protein: 16,
    total_carbs: 77,
    total_fat: 9,
    meal_date: new Date().toISOString().split('T')[0],
    meal_time: '08:00'
  },
  {
    id: '2',
    user_id: 'demo-user-id',
    meal_type: 'lunch',
    foods: [
      { name: 'Pechuga de pollo', quantity: 200, unit: 'g', calories: 330, protein: 62, carbs: 0, fat: 7 },
      { name: 'Arroz integral', quantity: 100, unit: 'g', calories: 350, protein: 8, carbs: 72, fat: 3 },
      { name: 'Brócoli', quantity: 150, unit: 'g', calories: 50, protein: 4, carbs: 10, fat: 0 }
    ],
    total_calories: 730,
    total_protein: 74,
    total_carbs: 82,
    total_fat: 10,
    meal_date: new Date().toISOString().split('T')[0],
    meal_time: '14:00'
  },
  {
    id: '3',
    user_id: 'demo-user-id',
    meal_type: 'snack',
    foods: [
      { name: 'Yogur griego', quantity: 200, unit: 'g', calories: 130, protein: 20, carbs: 6, fat: 3 },
      { name: 'Almendras', quantity: 30, unit: 'g', calories: 175, protein: 6, carbs: 6, fat: 15 }
    ],
    total_calories: 305,
    total_protein: 26,
    total_carbs: 12,
    total_fat: 18,
    meal_date: new Date().toISOString().split('T')[0],
    meal_time: '17:00'
  }
];

const DEMO_RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'Bowl de proteína post-entreno',
    description: 'Perfecto para después de entrenar, rico en proteínas y carbohidratos',
    ingredients: [
      { name: 'Pechuga de pollo', quantity: 200, unit: 'g' },
      { name: 'Arroz integral', quantity: 100, unit: 'g' },
      { name: 'Aguacate', quantity: 0.5, unit: 'unidad' },
      { name: 'Huevo', quantity: 2, unit: 'unidades' },
      { name: 'Espinacas', quantity: 50, unit: 'g' },
      { name: 'Salsa de soja', quantity: 1, unit: 'cucharada' }
    ],
    instructions: [
      'Cocina el arroz integral según las instrucciones del paquete',
      'Corta la pechuga en tiras y saltéala con un poco de aceite',
      'Fríe los huevos a tu gusto',
      'Monta el bowl: arroz de base, pollo, huevos, aguacate en láminas y espinacas',
      'Aliña con salsa de soja y sirve'
    ],
    prep_time_minutes: 10,
    cook_time_minutes: 25,
    servings: 1,
    calories_per_serving: 680,
    protein_per_serving: 55,
    carbs_per_serving: 45,
    fat_per_serving: 28,
    tags: ['post-entreno', 'alto en proteína', 'fácil']
  },
  {
    id: '2',
    name: 'Batido de proteínas casero',
    description: 'Batido natural rico en proteínas sin necesidad de suplementos',
    ingredients: [
      { name: 'Leche', quantity: 300, unit: 'ml' },
      { name: 'Plátano', quantity: 1, unit: 'unidad' },
      { name: 'Mantequilla de cacahuete', quantity: 2, unit: 'cucharadas' },
      { name: 'Avena', quantity: 40, unit: 'g' },
      { name: 'Cacao en polvo', quantity: 1, unit: 'cucharada' }
    ],
    instructions: [
      'Añade todos los ingredientes a la batidora',
      'Bate hasta conseguir una textura homogénea',
      'Sirve frío inmediatamente'
    ],
    prep_time_minutes: 5,
    cook_time_minutes: 0,
    servings: 1,
    calories_per_serving: 520,
    protein_per_serving: 22,
    carbs_per_serving: 65,
    fat_per_serving: 18,
    tags: ['batido', 'desayuno', 'rápido']
  },
  {
    id: '3',
    name: 'Salmón al horno con verduras',
    description: 'Cena saludable rica en omega-3 y fibra',
    ingredients: [
      { name: 'Salmón', quantity: 200, unit: 'g' },
      { name: 'Espárragos', quantity: 150, unit: 'g' },
      { name: 'Tomates cherry', quantity: 100, unit: 'g' },
      { name: 'Limón', quantity: 1, unit: 'unidad' },
      { name: 'Aceite de oliva', quantity: 2, unit: 'cucharadas' },
      { name: 'Ajo', quantity: 2, unit: 'dientes' }
    ],
    instructions: [
      'Precalienta el horno a 200°C',
      'Coloca el salmón en una bandeja de horno',
      'Rodea con espárragos y tomates cherry',
      'Aliña con aceite de oliva, zumo de limón y ajo picado',
      'Hornea 20-25 minutos hasta que el salmón esté hecho',
      'Sirve con rodajas de limón'
    ],
    prep_time_minutes: 10,
    cook_time_minutes: 25,
    servings: 1,
    calories_per_serving: 450,
    protein_per_serving: 42,
    carbs_per_serving: 12,
    fat_per_serving: 26,
    tags: ['cena', 'omega-3', 'bajo en carbohidratos']
  }
];

export const useNutritionStore = create<NutritionState>((set, get) => ({
  meals: [],
  recipes: [],
  dietPlan: null,
  shoppingList: [],
  isLoading: false,

  fetchMeals: async (userId, date) => {
    set({ isLoading: true });

    // Demo mode
    if (userId === 'demo-user-id') {
      const filteredMeals = date 
        ? DEMO_MEALS.filter(m => m.meal_date === date)
        : DEMO_MEALS;
      set({ meals: filteredMeals, isLoading: false });
      return;
    }

    try {
      let query = supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('meal_date', { ascending: false });

      if (date) {
        query = query.eq('meal_date', date);
      }

      const { data, error } = await query;
      if (error) throw error;
      set({ meals: data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching meals:', error);
      set({ isLoading: false });
    }
  },

  addMeal: async (meal) => {
    // Demo mode
    if (meal.user_id === 'demo-user-id') {
      const newMeal: Meal = { ...meal, id: crypto.randomUUID() };
      set(state => ({ meals: [newMeal, ...state.meals] }));
      return {};
    }

    try {
      const { data, error } = await supabase
        .from('meals')
        .insert(meal)
        .select()
        .single();

      if (error) return { error: error.message };
      set(state => ({ meals: [data, ...state.meals] }));
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  deleteMeal: async (id) => {
    // Demo mode
    const { meals } = get();
    const meal = meals.find(m => m.id === id);
    if (meal?.user_id === 'demo-user-id') {
      set(state => ({ meals: state.meals.filter(m => m.id !== id) }));
      return {};
    }

    try {
      const { error } = await supabase.from('meals').delete().eq('id', id);
      if (error) return { error: error.message };
      set(state => ({ meals: state.meals.filter(m => m.id !== id) }));
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  fetchRecipes: async (userId) => {
    set({ isLoading: true });

    // Demo mode or no user
    if (!userId || userId === 'demo-user-id') {
      set({ recipes: DEMO_RECIPES, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .or(`user_id.eq.${userId},is_public.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ recipes: data || DEMO_RECIPES, isLoading: false });
    } catch (error) {
      console.error('Error fetching recipes:', error);
      set({ recipes: DEMO_RECIPES, isLoading: false });
    }
  },

  addRecipe: async (recipe) => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert(recipe)
        .select()
        .single();

      if (error) return { error: error.message };
      set(state => ({ recipes: [data, ...state.recipes] }));
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  setDietPlan: (plan) => set({ dietPlan: plan }),

  generateShoppingList: (recipes) => {
    const itemsMap: Record<string, ShoppingListItem> = {};
    
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        const key = ing.name.toLowerCase();
        if (itemsMap[key]) {
          itemsMap[key].quantity += ing.quantity;
        } else {
          itemsMap[key] = {
            ingredient: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: getCategoryForIngredient(ing.name),
            checked: false
          };
        }
      });
    });
    
    const sortedItems = Object.values(itemsMap).sort((a, b) => {
      const categoryOrder = ['produce', 'meat', 'dairy', 'grains', 'other'];
      return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    });
    
    set({ shoppingList: sortedItems });
  },

  toggleShoppingItem: (index) => {
    set(state => ({
      shoppingList: state.shoppingList.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      )
    }));
  },

  clearShoppingList: () => set({ shoppingList: [] }),

  getTodayNutrition: () => {
    const { meals } = get();
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = meals.filter(m => m.meal_date === today);
    
    return todayMeals.reduce((acc, meal) => ({
      calories: acc.calories + meal.total_calories,
      protein: acc.protein + meal.total_protein,
      carbs: acc.carbs + meal.total_carbs,
      fat: acc.fat + meal.total_fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  },

  getWeeklyCalories: () => {
    const { meals } = get();
    const result: { date: string; calories: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayCalories = meals
        .filter(m => m.meal_date === dateStr)
        .reduce((sum, m) => sum + m.total_calories, 0);
      
      result.push({
        date: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        calories: dayCalories
      });
    }
    
    return result;
  }
}));

function getCategoryForIngredient(name: string): ShoppingListItem['category'] {
  const lower = name.toLowerCase();
  
  const produce = ['tomate', 'lechuga', 'espinaca', 'brócoli', 'zanahoria', 'cebolla', 'ajo', 'pimiento', 'aguacate', 'plátano', 'manzana', 'naranja', 'limón', 'fresa', 'espárrago'];
  const meat = ['pollo', 'ternera', 'cerdo', 'salmón', 'atún', 'pescado', 'huevo', 'jamón', 'pavo'];
  const dairy = ['leche', 'yogur', 'queso', 'mantequilla', 'nata'];
  const grains = ['arroz', 'pasta', 'pan', 'avena', 'quinoa', 'harina'];
  
  if (produce.some(p => lower.includes(p))) return 'produce';
  if (meat.some(m => lower.includes(m))) return 'meat';
  if (dairy.some(d => lower.includes(d))) return 'dairy';
  if (grains.some(g => lower.includes(g))) return 'grains';
  
  return 'other';
}
