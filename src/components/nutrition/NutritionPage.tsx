import { useEffect, useState } from 'react';
import { 
  Plus, 
  Utensils, 
  ShoppingCart,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNutritionStore } from '../../stores/nutritionStore';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { ShoppingListSection } from './ShoppingListSection';
import { MealForm } from './MealForm';
import type { Meal, GeneratedPlan } from '../../types';

type Tab = 'plan' | 'diary' | 'shopping';

export function NutritionPage() {
  const { user } = useAuthStore();
  const { 
    meals, 
    fetchMeals, 
    fetchRecipes,
    getTodayNutrition
  } = useNutritionStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showMealForm, setShowMealForm] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<Meal['meal_type']>('breakfast');
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  useEffect(() => {
    // Cargar plan generado desde localStorage
    const savedPlan = localStorage.getItem('fitapp-generated-plan');
    if (savedPlan) {
      try {
        setGeneratedPlan(JSON.parse(savedPlan));
      } catch (e) {
        console.error('Error loading plan:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchMeals(user.id, selectedDate);
      fetchRecipes(user.id);
    }
  }, [user?.id, selectedDate]);

  const todayNutrition = getTodayNutrition();
  const targetCalories = generatedPlan?.diet_plan?.daily_calories || user?.goals?.daily_calories || 2000;
  
  const dayMeals = meals.filter(m => m.meal_date === selectedDate);
  const dietPlan = generatedPlan?.diet_plan;
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const tabs = [
    { id: 'plan', label: 'Mi Plan', icon: Sparkles },
    { id: 'diary', label: 'Diario', icon: Calendar },
    { id: 'shopping', label: 'Lista compra', icon: ShoppingCart },
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
          <p className="text-gray-500">Tu plan de alimentación personalizado</p>
        </div>
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

      {/* Plan Tab - Mi dieta generada por IA */}
      {activeTab === 'plan' && (
        <div>
          {dietPlan && dietPlan.days?.length > 0 ? (
            <>
              {/* Plan Info */}
              <div className="card mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{dietPlan.name}</h3>
                    <p className="text-sm text-gray-500">{dietPlan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">{dietPlan.daily_calories}</p>
                    <p className="text-xs text-gray-500">kcal/día</p>
                  </div>
                </div>
                
                {/* Macros */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">{dietPlan.macros?.protein_grams}g</p>
                    <p className="text-xs text-gray-500">Proteína</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-yellow-600">{dietPlan.macros?.carbs_grams}g</p>
                    <p className="text-xs text-gray-500">Carbohidratos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-600">{dietPlan.macros?.fat_grams}g</p>
                    <p className="text-xs text-gray-500">Grasas</p>
                  </div>
                </div>
              </div>

              {/* Day Selector */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {dayNames.map((day, index) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(index)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      selectedDay === index
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>

              {/* Day Meals */}
              <div className="space-y-4">
                {dietPlan.days?.[selectedDay]?.meals?.map((meal, index) => (
                  <div key={index} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          meal.meal_type === 'breakfast' ? 'bg-orange-100' :
                          meal.meal_type === 'lunch' ? 'bg-green-100' :
                          meal.meal_type === 'dinner' ? 'bg-purple-100' :
                          'bg-blue-100'
                        }`}>
                          <Utensils className={`w-5 h-5 ${
                            meal.meal_type === 'breakfast' ? 'text-orange-600' :
                            meal.meal_type === 'lunch' ? 'text-green-600' :
                            meal.meal_type === 'dinner' ? 'text-purple-600' :
                            'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{meal.name}</h4>
                          <p className="text-xs text-gray-500">{meal.time_suggestion}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{meal.calories} kcal</p>
                        <p className="text-xs text-gray-500">P:{meal.protein}g C:{meal.carbs}g G:{meal.fat}g</p>
                      </div>
                    </div>

                    {/* Foods */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      {meal.foods?.map((food, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700">{food.name}</span>
                          <span className="text-gray-500">{food.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Recipe */}
                    {meal.recipe && (
                      <details className="mt-3">
                        <summary className="text-sm text-primary-600 cursor-pointer hover:text-primary-700">
                          Ver receta
                        </summary>
                        <div className="mt-3 p-3 bg-primary-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-2">Ingredientes:</p>
                          <ul className="text-sm text-gray-700 mb-3 list-disc list-inside">
                            {meal.recipe.ingredients?.map((ing, i) => (
                              <li key={i}>{ing}</li>
                            ))}
                          </ul>
                          <p className="text-xs text-gray-500 mb-2">Preparación:</p>
                          <ol className="text-sm text-gray-700 list-decimal list-inside">
                            {meal.recipe.instructions?.map((step, i) => (
                              <li key={i} className="mb-1">{step}</li>
                            ))}
                          </ol>
                          <p className="text-xs text-gray-500 mt-2">⏱️ {meal.recipe.prep_time} min</p>
                        </div>
                      </details>
                    )}
                  </div>
                ))}

                {(!dietPlan.days?.[selectedDay]?.meals || dietPlan.days[selectedDay].meals.length === 0) && (
                  <div className="card text-center py-8">
                    <p className="text-gray-500">No hay comidas programadas para este día</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="Plan de dieta no generado"
              description="Completa el onboarding para que la IA genere tu plan de alimentación personalizado"
            />
          )}
        </div>
      )}

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

      {/* Shopping List Tab */}
      {activeTab === 'shopping' && <ShoppingListSection plan={generatedPlan} />}

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
