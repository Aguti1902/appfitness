import { useState } from 'react';
import { 
  Check, 
  ShoppingCart, 
  Sparkles,
  Trash2,
  Apple,
  Beef,
  Milk,
  Wheat,
  Package
} from 'lucide-react';
import { useNutritionStore } from '../../stores/nutritionStore';
import { generateShoppingList } from '../../lib/openai';
import { EmptyState } from '../ui/EmptyState';

const CATEGORY_ICONS = {
  produce: Apple,
  meat: Beef,
  dairy: Milk,
  grains: Wheat,
  other: Package
};

const CATEGORY_LABELS = {
  produce: 'Frutas y verduras',
  meat: 'Carnes y pescados',
  dairy: 'Lácteos',
  grains: 'Cereales y granos',
  other: 'Otros'
};

const CATEGORY_COLORS = {
  produce: 'bg-green-100 text-green-600',
  meat: 'bg-red-100 text-red-600',
  dairy: 'bg-blue-100 text-blue-600',
  grains: 'bg-yellow-100 text-yellow-600',
  other: 'bg-gray-100 text-gray-600'
};

export function ShoppingListSection() {
  const { 
    shoppingList, 
    dietPlan
  } = useNutritionStore();
  
  const [generating, setGenerating] = useState(false);
  const [localList, setLocalList] = useState(shoppingList);

  const handleGenerateList = async () => {
    if (!dietPlan) return;
    
    setGenerating(true);
    
    // Get all recipes from diet plan
    const allRecipes = dietPlan.meals.flatMap(m => m.recipes);
    const items = await generateShoppingList(
      allRecipes.map(r => ({ name: r.name, servings: r.servings }))
    );
    
    const formattedItems = items.map(item => ({
      ...item,
      category: item.category as 'produce' | 'meat' | 'dairy' | 'grains' | 'other',
      checked: false
    }));
    
    setLocalList(formattedItems);
    setGenerating(false);
  };

  const toggleItem = (index: number) => {
    setLocalList(prev => prev.map((item, i) => 
      i === index ? { ...item, checked: !item.checked } : item
    ));
  };

  const clearList = () => {
    setLocalList([]);
  };

  // Group items by category
  const groupedItems = localList.reduce((acc, item, index) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push({ ...item, index });
    return acc;
  }, {} as Record<string, (typeof localList[0] & { index: number })[]>);

  const completedCount = localList.filter(i => i.checked).length;
  const totalCount = localList.length;

  if (localList.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Lista de compra vacía"
        description="Genera una lista de compra automática basada en tu plan de dieta"
        action={{
          label: generating ? "Generando..." : "Generar lista",
          onClick: handleGenerateList
        }}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">Lista de la compra</h3>
          <p className="text-sm text-gray-500">
            {completedCount} de {totalCount} items completados
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateList}
            disabled={generating}
            className="btn btn-outline text-sm"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? 'Generando...' : 'Regenerar'}
          </button>
          <button
            onClick={clearList}
            className="btn btn-secondary text-sm text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div 
          className="h-full bg-primary-500 transition-all"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Items by category */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => {
          const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
          const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS];
          const colorClass = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];
          
          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="font-medium text-gray-900">{label}</h4>
                <span className="text-sm text-gray-500">
                  ({items.filter(i => i.checked).length}/{items.length})
                </span>
              </div>
              
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.index}
                    onClick={() => toggleItem(item.index)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                      item.checked 
                        ? 'bg-gray-50 text-gray-400' 
                        : 'bg-white border border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      item.checked 
                        ? 'bg-primary-500 border-primary-500' 
                        : 'border-gray-300'
                    }`}>
                      {item.checked && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`flex-1 ${item.checked ? 'line-through' : ''}`}>
                      {item.ingredient}
                    </span>
                    <span className="text-sm text-gray-500">
                      {item.quantity} {item.unit}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
