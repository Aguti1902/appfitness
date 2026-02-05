import { useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNutritionStore } from '../../stores/nutritionStore';
import type { Food, Meal } from '../../types';

interface MealFormProps {
  mealType: Meal['meal_type'];
  date: string;
  onClose: () => void;
}

const COMMON_FOODS: Partial<Food>[] = [
  { name: 'Pechuga de pollo', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Arroz integral', calories: 350, protein: 7, carbs: 77, fat: 2.7 },
  { name: 'Huevo', calories: 155, protein: 13, carbs: 1, fat: 11 },
  { name: 'Plátano', calories: 89, protein: 1, carbs: 23, fat: 0.3 },
  { name: 'Avena', calories: 389, protein: 17, carbs: 66, fat: 7 },
  { name: 'Leche', calories: 42, protein: 3.4, carbs: 5, fat: 1 },
  { name: 'Yogur griego', calories: 59, protein: 10, carbs: 3.6, fat: 0.7 },
  { name: 'Salmón', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: 'Brócoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: 'Patata', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  { name: 'Atún en lata', calories: 116, protein: 26, carbs: 0, fat: 1 },
  { name: 'Pan integral', calories: 247, protein: 13, carbs: 41, fat: 3.4 },
];

export function MealForm({ mealType, date, onClose }: MealFormProps) {
  const { user } = useAuthStore();
  const { addMeal } = useNutritionStore();
  
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customFood, setCustomFood] = useState({
    name: '',
    quantity: 100,
    unit: 'g',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filteredFoods = COMMON_FOODS.filter(f => 
    f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addFood = (food: Partial<Food>, quantity = 100) => {
    const newFood: Food = {
      name: food.name || '',
      quantity,
      unit: 'g',
      calories: Math.round((food.calories || 0) * quantity / 100),
      protein: Math.round((food.protein || 0) * quantity / 100 * 10) / 10,
      carbs: Math.round((food.carbs || 0) * quantity / 100 * 10) / 10,
      fat: Math.round((food.fat || 0) * quantity / 100 * 10) / 10
    };
    setFoods([...foods, newFood]);
    setSearchQuery('');
  };

  const removeFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const addCustomFood = () => {
    if (!customFood.name) return;
    setFoods([...foods, customFood]);
    setCustomFood({
      name: '',
      quantity: 100,
      unit: 'g',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    });
    setShowCustomForm(false);
  };

  const handleSave = async () => {
    if (!user || foods.length === 0) return;
    
    setIsSaving(true);
    
    const meal: Omit<Meal, 'id'> = {
      user_id: user.id,
      meal_type: mealType,
      foods,
      total_calories: foods.reduce((t, f) => t + f.calories, 0),
      total_protein: foods.reduce((t, f) => t + f.protein, 0),
      total_carbs: foods.reduce((t, f) => t + f.carbs, 0),
      total_fat: foods.reduce((t, f) => t + f.fat, 0),
      meal_date: date
    };
    
    await addMeal(meal);
    onClose();
  };

  const totals = foods.reduce((acc, f) => ({
    calories: acc.calories + f.calories,
    protein: acc.protein + f.protein,
    carbs: acc.carbs + f.carbs,
    fat: acc.fat + f.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar alimento..."
          className="input pl-10"
        />
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-xl p-2">
          {filteredFoods.map((food, i) => (
            <button
              key={i}
              onClick={() => addFood(food)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 text-left"
            >
              <span className="font-medium text-gray-900">{food.name}</span>
              <span className="text-sm text-gray-500">{food.calories} kcal/100g</span>
            </button>
          ))}
          {filteredFoods.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              No se encontraron alimentos
            </p>
          )}
        </div>
      )}

      {/* Added Foods */}
      {foods.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Alimentos añadidos</h4>
          {foods.map((food, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">{food.name}</p>
                <p className="text-sm text-gray-500">{food.quantity} {food.unit}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{food.calories} kcal</span>
                <button
                  onClick={() => removeFood(i)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Food Form */}
      {showCustomForm ? (
        <div className="p-4 border border-gray-200 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Alimento personalizado</h4>
            <button
              onClick={() => setShowCustomForm(false)}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <input
            type="text"
            value={customFood.name}
            onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
            placeholder="Nombre del alimento"
            className="input"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Cantidad (g)</label>
              <input
                type="number"
                value={customFood.quantity}
                onChange={(e) => setCustomFood({ ...customFood, quantity: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Calorías</label>
              <input
                type="number"
                value={customFood.calories}
                onChange={(e) => setCustomFood({ ...customFood, calories: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-500">Proteína (g)</label>
              <input
                type="number"
                value={customFood.protein}
                onChange={(e) => setCustomFood({ ...customFood, protein: parseFloat(e.target.value) || 0 })}
                className="input"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Carbos (g)</label>
              <input
                type="number"
                value={customFood.carbs}
                onChange={(e) => setCustomFood({ ...customFood, carbs: parseFloat(e.target.value) || 0 })}
                className="input"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Grasas (g)</label>
              <input
                type="number"
                value={customFood.fat}
                onChange={(e) => setCustomFood({ ...customFood, fat: parseFloat(e.target.value) || 0 })}
                className="input"
              />
            </div>
          </div>
          
          <button
            onClick={addCustomFood}
            disabled={!customFood.name}
            className="btn btn-primary w-full"
          >
            Añadir alimento
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowCustomForm(true)}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Añadir alimento personalizado
        </button>
      )}

      {/* Totals */}
      {foods.length > 0 && (
        <div className="p-4 bg-primary-50 rounded-xl">
          <h4 className="font-medium text-gray-900 mb-3">Total</h4>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">{totals.calories}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{Math.round(totals.protein * 10) / 10}g</p>
              <p className="text-xs text-gray-500">Proteína</p>
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-600">{Math.round(totals.carbs * 10) / 10}g</p>
              <p className="text-xs text-gray-500">Carbos</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-600">{Math.round(totals.fat * 10) / 10}g</p>
              <p className="text-xs text-gray-500">Grasas</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onClose} className="btn btn-secondary flex-1">
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={foods.length === 0 || isSaving}
          className="btn btn-primary flex-1"
        >
          {isSaving ? 'Guardando...' : 'Guardar comida'}
        </button>
      </div>
    </div>
  );
}
