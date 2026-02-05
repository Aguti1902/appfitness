import { useState } from 'react';
import { 
  Search, 
  Clock, 
  Users
} from 'lucide-react';
import { useNutritionStore } from '../../stores/nutritionStore';
import { Modal } from '../ui/Modal';
import type { Recipe } from '../../types';

export function RecipesSection() {
  const { recipes } = useNutritionStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [filterTag, setFilterTag] = useState<string>('');

  const allTags = [...new Set(recipes.flatMap(r => r.tags))];

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !filterTag || r.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div>
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar recetas..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterTag('')}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
            !filterTag 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setFilterTag(tag)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              filterTag === tag 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Recipes Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.map((recipe) => (
          <button
            key={recipe.id}
            onClick={() => setSelectedRecipe(recipe)}
            className="card-hover text-left"
          >
            {recipe.image_url && (
              <img
                src={recipe.image_url}
                alt={recipe.name}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
            )}
            <h4 className="font-semibold text-gray-900 mb-1">{recipe.name}</h4>
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{recipe.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {recipe.prep_time_minutes + recipe.cook_time_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {recipe.servings}
              </span>
              <span className="font-medium text-primary-600">
                {recipe.calories_per_serving} kcal
              </span>
            </div>

            {recipe.tags.length > 0 && (
              <div className="flex gap-1 mt-3">
                {recipe.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="badge badge-info">{tag}</span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <Modal
          isOpen={!!selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          title={selectedRecipe.name}
          size="xl"
        >
          <div className="space-y-6">
            {/* Macros */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{selectedRecipe.calories_per_serving}</p>
                <p className="text-xs text-gray-500">kcal</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{selectedRecipe.protein_per_serving}g</p>
                <p className="text-xs text-gray-500">Proteína</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{selectedRecipe.carbs_per_serving}g</p>
                <p className="text-xs text-gray-500">Carbos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{selectedRecipe.fat_per_serving}g</p>
                <p className="text-xs text-gray-500">Grasas</p>
              </div>
            </div>

            {/* Info */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Prep: {selectedRecipe.prep_time_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Cocción: {selectedRecipe.cook_time_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {selectedRecipe.servings} porciones
              </span>
            </div>

            <p className="text-gray-600">{selectedRecipe.description}</p>

            {/* Ingredients */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Ingredientes</h4>
              <ul className="space-y-2">
                {selectedRecipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <span className="w-2 h-2 bg-primary-500 rounded-full" />
                    {ing.quantity} {ing.unit} de {ing.name}
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Instrucciones</h4>
              <ol className="space-y-3">
                {selectedRecipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-gray-600">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tags */}
            {selectedRecipe.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {selectedRecipe.tags.map((tag) => (
                  <span key={tag} className="badge badge-info">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
