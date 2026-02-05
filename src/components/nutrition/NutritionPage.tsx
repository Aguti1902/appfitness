import { useEffect, useState } from 'react';
import { 
  Plus, 
  Utensils, 
  ChefHat,
  ShoppingCart,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNutritionStore } from '../../stores/nutritionStore';
import { generateDietPlan } from '../../lib/openai';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { RecipesSection } from './RecipesSection';
import { ShoppingListSection } from './ShoppingListSection';
import { MealForm } from './MealForm';
import type { Meal } from '../../types';

type Tab = 'diary' | 'recipes' | 'shopping' | 'diet';

export function NutritionPage() {
  const { user } = useAuthStore();
  const { 
    meals, 
    fetchMeals, 
    fetchRecipes,
    dietPlan,
    setDietPlan,
    getTodayNutrition
  } = useNutritionStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('diary');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showMealForm, setShowMealForm] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<Meal['meal_type']>('breakfast');
  const [generatingDiet, setGeneratingDiet] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchMeals(user.id, selectedDate);
      fetchRecipes(user.id);
    }
  }, [user?.id, selectedDate]);

  const todayNutrition = getTodayNutrition();
  const targetCalories = user?.goals?.daily_calories || 2000;
  
  const dayMeals = meals.filter(m => m.meal_date === selectedDate);

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleGenerateDiet = async () => {
    if (!user) return;
    setGeneratingDiet(true);
    const plan = await generateDietPlan(user.goals);
    if (plan) {
      setDietPlan(plan);
    }
    setGeneratingDiet(false);
    setActiveTab('diet');
  };

  const tabs = [
    { id: 'diary', label: 'Diario', icon: Calendar },
    { id: 'recipes', label: 'Recetas', icon: ChefHat },
    { id: 'shopping', label: 'Lista compra', icon: ShoppingCart },
    { id: 'diet', label: 'Mi dieta', icon: Sparkles },
  ] as const;

  const mealTypes = [
    { type: 'breakfast', label: 'Desayuno', time: '08:00' },
    { type: 'lunch', label: 'Comida', time: '14:00' },
    { type: 'snack', label: 'Snack', time: '17:00' },
    { type: 'dinner', label: 'Cena', time: '21:00' },
  ] as const;

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nutrición</h1>
          <p className="text-gray-500">Controla tu alimentación y alcanza tus objetivos</p>
        </div>
        <button
          onClick={handleGenerateDiet}
          disabled={generatingDiet}
          className="btn btn-primary"
        >
          <Sparkles className="w-5 h-5" />
          {generatingDiet ? 'Generando...' : 'Generar dieta IA'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Diary Tab */}
      {activeTab === 'diary' && (
        <div>
          {/* Date Navigator */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="font-semibold text-gray-900">
                {new Date(selectedDate).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
              {selectedDate === new Date().toISOString().split('T')[0] && (
                <span className="text-xs text-primary-600 font-medium">Hoy</span>
              )}
            </div>
            <button
              onClick={() => changeDate(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Nutrition Summary */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Resumen del día</h3>
              <span className="text-sm text-gray-500">
                {todayNutrition.calories} / {targetCalories} kcal
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
              <div 
                className={`h-full rounded-full transition-all ${
                  todayNutrition.calories > targetCalories 
                    ? 'bg-red-500' 
                    : 'bg-primary-500'
                }`}
                style={{ width: `${Math.min((todayNutrition.calories / targetCalories) * 100, 100)}%` }}
              />
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="font-bold text-blue-600">{Math.round(todayNutrition.protein)}g</span>
                </div>
                <p className="text-xs text-gray-500">Proteína</p>
              </div>
              <div>
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="font-bold text-yellow-600">{Math.round(todayNutrition.carbs)}g</span>
                </div>
                <p className="text-xs text-gray-500">Carbos</p>
              </div>
              <div>
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="font-bold text-red-600">{Math.round(todayNutrition.fat)}g</span>
                </div>
                <p className="text-xs text-gray-500">Grasas</p>
              </div>
            </div>
          </div>

          {/* Meals by type */}
          <div className="space-y-4">
            {mealTypes.map(({ type, label, time }) => {
              const meal = dayMeals.find(m => m.meal_type === type);
              
              return (
                <div key={type} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Utensils className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{label}</h4>
                        <p className="text-xs text-gray-500">{time}</p>
                      </div>
                    </div>
                    {meal && (
                      <span className="font-semibold text-gray-900">
                        {meal.total_calories} kcal
                      </span>
                    )}
                  </div>

                  {meal ? (
                    <div className="space-y-2">
                      {meal.foods.map((food, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                          <span className="text-gray-600">{food.name}</span>
                          <span className="text-gray-500">{food.quantity} {food.unit} · {food.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedMealType(type);
                        setShowMealForm(true);
                      }}
                      className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Añadir {label.toLowerCase()}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recipes Tab */}
      {activeTab === 'recipes' && <RecipesSection />}

      {/* Shopping List Tab */}
      {activeTab === 'shopping' && <ShoppingListSection />}

      {/* Diet Plan Tab */}
      {activeTab === 'diet' && (
        <div>
          {dietPlan ? (
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{dietPlan.name}</h3>
                    <p className="text-sm text-gray-500">
                      {dietPlan.daily_calories} kcal/día
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateDiet}
                    disabled={generatingDiet}
                    className="btn btn-outline text-sm"
                  >
                    {generatingDiet ? 'Generando...' : 'Regenerar'}
                  </button>
                </div>
              </div>

              {dietPlan.meals.map((meal, i) => (
                <div key={i} className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Utensils className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {meal.meal_type === 'breakfast' && 'Desayuno'}
                        {meal.meal_type === 'lunch' && 'Comida'}
                        {meal.meal_type === 'dinner' && 'Cena'}
                        {meal.meal_type === 'snack' && 'Snack'}
                      </h4>
                      <p className="text-xs text-gray-500">{meal.target_calories} kcal</p>
                    </div>
                  </div>

                  {meal.recipes.map((recipe, j) => (
                    <div key={j} className="p-4 bg-gray-50 rounded-xl mb-3 last:mb-0">
                      <h5 className="font-medium text-gray-900 mb-2">{recipe.name}</h5>
                      <p className="text-sm text-gray-500 mb-3">{recipe.description}</p>
                      
                      <div className="grid grid-cols-4 gap-2 text-center text-sm">
                        <div className="p-2 bg-white rounded-lg">
                          <p className="font-semibold text-gray-900">{recipe.calories_per_serving}</p>
                          <p className="text-xs text-gray-500">kcal</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg">
                          <p className="font-semibold text-blue-600">{recipe.protein_per_serving}g</p>
                          <p className="text-xs text-gray-500">Prot</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg">
                          <p className="font-semibold text-yellow-600">{recipe.carbs_per_serving}g</p>
                          <p className="text-xs text-gray-500">Carb</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg">
                          <p className="font-semibold text-red-600">{recipe.fat_per_serving}g</p>
                          <p className="text-xs text-gray-500">Grasa</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="Sin plan de dieta"
              description="Genera un plan de dieta personalizado con IA basado en tus objetivos"
              action={{
                label: "Generar dieta",
                onClick: handleGenerateDiet
              }}
            />
          )}
        </div>
      )}

      {/* Meal Form Modal */}
      <Modal
        isOpen={showMealForm}
        onClose={() => setShowMealForm(false)}
        title={`Añadir ${selectedMealType === 'breakfast' ? 'desayuno' : selectedMealType === 'lunch' ? 'comida' : selectedMealType === 'dinner' ? 'cena' : 'snack'}`}
        size="lg"
      >
        <MealForm
          mealType={selectedMealType}
          date={selectedDate}
          onClose={() => setShowMealForm(false)}
        />
      </Modal>
    </div>
  );
}
