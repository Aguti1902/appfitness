import { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  Trophy,
  Dumbbell,
  Timer,
  TrendingUp,
  Sparkles,
  CheckCircle,
  Clock,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';

interface UserGoal {
  id: string;
  title: string;
  description: string;
  category: 'strength' | 'cardio' | 'weight' | 'habit' | 'other';
  target_value: number;
  current_value: number;
  unit: string;
  deadline?: string;
  ai_plan?: string[];
  milestones?: { value: number; description: string; completed: boolean }[];
  created_at: string;
  completed: boolean;
}

const CATEGORY_OPTIONS = [
  { id: 'strength', label: 'Fuerza', icon: Dumbbell, color: 'bg-red-100 text-red-600', example: 'Ej: 130kg press banca' },
  { id: 'cardio', label: 'Cardio', icon: Timer, color: 'bg-blue-100 text-blue-600', example: 'Ej: Correr 21km' },
  { id: 'weight', label: 'Peso corporal', icon: TrendingUp, color: 'bg-green-100 text-green-600', example: 'Ej: Llegar a 75kg' },
  { id: 'habit', label: 'Hábito', icon: CheckCircle, color: 'bg-purple-100 text-purple-600', example: 'Ej: Entrenar 5 días/semana' },
  { id: 'other', label: 'Otro', icon: Target, color: 'bg-gray-100 text-gray-600', example: 'Cualquier otro objetivo' },
];

export function GoalsPage() {
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  // Form state
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'strength' as UserGoal['category'],
    target_value: '',
    current_value: '',
    unit: 'kg',
    deadline: ''
  });

  useEffect(() => {
    // Cargar objetivos desde localStorage
    const saved = localStorage.getItem('fitapp-user-goals');
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading goals:', e);
      }
    }
  }, []);

  const saveGoals = (updatedGoals: UserGoal[]) => {
    setGoals(updatedGoals);
    localStorage.setItem('fitapp-user-goals', JSON.stringify(updatedGoals));
  };

  const generateAIPlan = async (goal: UserGoal): Promise<string[]> => {
    // Generar plan con IA basado en el objetivo
    const plans: Record<string, string[]> = {
      strength: [
        `Semana 1-2: Trabaja al 70% de tu RM actual (${Math.round(goal.current_value * 0.7)}${goal.unit}), enfocándote en técnica perfecta`,
        `Semana 3-4: Aumenta a 75% RM. Haz 5x5 con ${Math.round(goal.current_value * 0.75)}${goal.unit}`,
        `Semana 5-6: Trabaja al 80% RM. Incluye pausas largas (3-4 min) entre series`,
        `Semana 7-8: Intenta 85% RM para series de 3 repeticiones`,
        `Cada 2 semanas: Añade 2.5-5kg si completas todas las series`,
        `Nutrición: Asegura 2g de proteína por kg de peso corporal`,
        `Descanso: Entrena el mismo grupo muscular máximo 2 veces por semana`,
        `Meta intermedia: Llegar a ${Math.round((goal.target_value + goal.current_value) / 2)}${goal.unit} en la mitad del tiempo`
      ],
      cardio: [
        `Semana 1-2: Corre 3 veces/semana. Distancia actual + 10% cada semana`,
        `Base aeróbica: 80% de tus carreras deben ser a ritmo conversacional`,
        `Semana 3-4: Añade una sesión de intervalos (ej: 6x400m con 90s descanso)`,
        `Semana 5-6: Aumenta la carrera larga semanal un 15%`,
        `Semana 7-8: Introduce cuestas o fartlek una vez por semana`,
        `Nutrición: Carbohidratos antes de carreras largas, proteína después`,
        `Hidratación: Bebe 500ml 2h antes de correr, lleva agua en carreras +10km`,
        `Descanso: Al menos 1-2 días de descanso activo (caminata, natación suave)`
      ],
      weight: [
        `Déficit calórico moderado: 300-500 kcal menos que tu mantenimiento`,
        `Proteína alta: 2-2.5g por kg de peso para preservar músculo`,
        `Entrena fuerza 3-4 veces/semana para mantener masa muscular`,
        `Cardio LISS: 2-3 sesiones de 30-45 min a ritmo moderado`,
        `Pésate cada día a la misma hora, usa la media semanal`,
        `Meta: Perder 0.5-1% de peso corporal por semana máximo`,
        `Refeed: Cada 10-14 días come a mantenimiento para regular hormonas`,
        `Ajusta calorías si el peso se estanca más de 2 semanas`
      ],
      habit: [
        `Empieza pequeño: Si quieres 5 días, empieza con 3 y añade 1 cada 2 semanas`,
        `Mismo horario: Entrena siempre a la misma hora para crear rutina`,
        `Prepara todo la noche anterior: ropa, comida, bolsa de gimnasio`,
        `Regla de los 2 minutos: Si no tienes ganas, comprométete solo a 2 min`,
        `Tracking visual: Marca cada día completado en un calendario`,
        `Recompensas: Celebra cada semana que cumplas tu objetivo`,
        `Plan B: Ten entrenamientos cortos (20 min) para días difíciles`,
        `Accountability: Comparte tu progreso con amigos o en la app`
      ],
      other: [
        `Define métricas claras para medir tu progreso`,
        `Divide el objetivo en hitos mensuales más pequeños`,
        `Identifica los obstáculos potenciales y planifica cómo superarlos`,
        `Busca recursos específicos (videos, artículos, coaches)`,
        `Practica consistentemente, aunque sea poco tiempo cada día`,
        `Registra tu progreso semanalmente`,
        `Ajusta el plan según los resultados que vayas obteniendo`,
        `Celebra los pequeños logros en el camino`
      ]
    };

    // Simular delay de IA
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return plans[goal.category] || plans.other;
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title || !newGoal.target_value) return;

    setGeneratingPlan(true);

    const goal: UserGoal = {
      id: crypto.randomUUID(),
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category,
      target_value: parseFloat(newGoal.target_value),
      current_value: parseFloat(newGoal.current_value) || 0,
      unit: newGoal.unit,
      deadline: newGoal.deadline || undefined,
      created_at: new Date().toISOString(),
      completed: false,
      milestones: generateMilestones(
        parseFloat(newGoal.current_value) || 0,
        parseFloat(newGoal.target_value),
        newGoal.unit
      )
    };

    // Generar plan con IA
    goal.ai_plan = await generateAIPlan(goal);

    const updatedGoals = [...goals, goal];
    saveGoals(updatedGoals);
    
    setNewGoal({
      title: '',
      description: '',
      category: 'strength',
      target_value: '',
      current_value: '',
      unit: 'kg',
      deadline: ''
    });
    setShowNewGoal(false);
    setGeneratingPlan(false);
    setSelectedGoal(goal);
  };

  const generateMilestones = (current: number, target: number, unit: string) => {
    const diff = target - current;
    const steps = 4;
    const increment = diff / steps;
    
    return Array.from({ length: steps }, (_, i) => ({
      value: Math.round((current + increment * (i + 1)) * 10) / 10,
      description: `Llegar a ${Math.round((current + increment * (i + 1)) * 10) / 10}${unit}`,
      completed: false
    }));
  };

  const updateProgress = (goalId: string, newValue: number) => {
    const updatedGoals = goals.map(g => {
      if (g.id !== goalId) return g;
      
      const updated = { ...g, current_value: newValue };
      
      // Actualizar milestones
      if (updated.milestones) {
        updated.milestones = updated.milestones.map(m => ({
          ...m,
          completed: newValue >= m.value
        }));
      }
      
      // Comprobar si se completó
      if (newValue >= g.target_value) {
        updated.completed = true;
      }
      
      return updated;
    });
    
    saveGoals(updatedGoals);
    
    // Actualizar goal seleccionado si es el mismo
    if (selectedGoal?.id === goalId) {
      setSelectedGoal(updatedGoals.find(g => g.id === goalId) || null);
    }
  };

  const deleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(g => g.id !== goalId);
    saveGoals(updatedGoals);
    setSelectedGoal(null);
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Objetivos</h1>
          <p className="text-gray-500">Define tus metas y la IA te ayudará a alcanzarlas</p>
        </div>
        <button onClick={() => setShowNewGoal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nuevo objetivo
        </button>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Sin objetivos definidos"
          description="Crea tu primer objetivo y la IA te ayudará con un plan personalizado para alcanzarlo"
          action={{
            label: "Crear objetivo",
            onClick: () => setShowNewGoal(true)
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                Objetivos activos ({activeGoals.length})
              </h3>
              <div className="space-y-3">
                {activeGoals.map(goal => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal} 
                    onClick={() => setSelectedGoal(goal)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                Completados ({completedGoals.length})
              </h3>
              <div className="space-y-3">
                {completedGoals.map(goal => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal} 
                    onClick={() => setSelectedGoal(goal)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Goal Modal */}
      <Modal
        isOpen={showNewGoal}
        onClose={() => setShowNewGoal(false)}
        title="Nuevo objetivo"
        size="lg"
      >
        <div className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setNewGoal(prev => ({ 
                    ...prev, 
                    category: cat.id as UserGoal['category'],
                    unit: cat.id === 'cardio' ? 'km' : cat.id === 'habit' ? 'días' : 'kg'
                  }))}
                  className={`p-3 rounded-xl border-2 transition-colors text-left ${
                    newGoal.category === cat.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center mb-2`}>
                    <cat.icon className="w-4 h-4" />
                  </div>
                  <p className="font-medium text-gray-900 text-sm">{cat.label}</p>
                  <p className="text-xs text-gray-500">{cat.example}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Cuál es tu objetivo?
            </label>
            <input
              type="text"
              value={newGoal.title}
              onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Correr una media maratón, Levantar 130kg en press banca..."
              className="input"
            />
          </div>

          {/* Values */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor actual
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newGoal.current_value}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, current_value: e.target.value }))}
                  placeholder="0"
                  className="input flex-1"
                />
                <select
                  value={newGoal.unit}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
                  className="input w-20"
                >
                  <option value="kg">kg</option>
                  <option value="km">km</option>
                  <option value="min">min</option>
                  <option value="días">días</option>
                  <option value="reps">reps</option>
                  <option value="%">%</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor objetivo
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target_value: e.target.value }))}
                  placeholder="0"
                  className="input flex-1"
                />
                <span className="input w-20 flex items-center justify-center bg-gray-50">
                  {newGoal.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha límite (opcional)
            </label>
            <input
              type="date"
              value={newGoal.deadline}
              onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
              className="input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción adicional (opcional)
            </label>
            <textarea
              value={newGoal.description}
              onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Añade más detalles sobre tu objetivo..."
              className="input min-h-[80px]"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleCreateGoal}
            disabled={!newGoal.title || !newGoal.target_value || generatingPlan}
            className="w-full btn btn-primary"
          >
            {generatingPlan ? (
              <>
                <Sparkles className="w-5 h-5 animate-pulse" />
                Generando plan con IA...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Crear objetivo y generar plan
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* Goal Detail Modal */}
      <Modal
        isOpen={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
        title={selectedGoal?.title || ''}
        size="lg"
      >
        {selectedGoal && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Progreso</span>
                <span className="font-semibold">
                  {selectedGoal.current_value} / {selectedGoal.target_value} {selectedGoal.unit}
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    selectedGoal.completed ? 'bg-green-500' : 'bg-primary-500'
                  }`}
                  style={{ 
                    width: `${Math.min((selectedGoal.current_value / selectedGoal.target_value) * 100, 100)}%` 
                  }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">
                {Math.round((selectedGoal.current_value / selectedGoal.target_value) * 100)}% completado
              </p>
            </div>

            {/* Update Progress */}
            {!selectedGoal.completed && (
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={`Nuevo valor (${selectedGoal.unit})`}
                  className="input flex-1"
                  id="progress-input"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('progress-input') as HTMLInputElement;
                    if (input.value) {
                      updateProgress(selectedGoal.id, parseFloat(input.value));
                      input.value = '';
                    }
                  }}
                  className="btn btn-primary"
                >
                  Actualizar
                </button>
              </div>
            )}

            {/* Milestones */}
            {selectedGoal.milestones && selectedGoal.milestones.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Hitos</h4>
                <div className="space-y-2">
                  {selectedGoal.milestones.map((milestone, i) => (
                    <div 
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        milestone.completed ? 'bg-green-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        milestone.completed ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        {milestone.completed && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <span className={milestone.completed ? 'text-green-700' : 'text-gray-600'}>
                        {milestone.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Plan */}
            {selectedGoal.ai_plan && selectedGoal.ai_plan.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-600" />
                  Plan de la IA para alcanzar tu objetivo
                </h4>
                <div className="space-y-2">
                  {selectedGoal.ai_plan.map((step, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-primary-50 rounded-lg">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deadline */}
            {selectedGoal.deadline && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                Fecha límite: {new Date(selectedGoal.deadline).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            )}

            {/* Delete */}
            <button
              onClick={() => {
                if (confirm('¿Seguro que quieres eliminar este objetivo?')) {
                  deleteGoal(selectedGoal.id);
                }
              }}
              className="w-full btn btn-secondary text-red-600"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar objetivo
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function GoalCard({ goal, onClick }: { goal: UserGoal; onClick: () => void }) {
  const category = CATEGORY_OPTIONS.find(c => c.id === goal.category);
  const Icon = category?.icon || Target;
  const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);

  return (
    <button
      onClick={onClick}
      className="w-full card-hover flex items-center gap-4 text-left"
    >
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
        goal.completed ? 'bg-green-100' : category?.color || 'bg-gray-100'
      }`}>
        {goal.completed ? (
          <Trophy className="w-7 h-7 text-green-600" />
        ) : (
          <Icon className="w-7 h-7" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-gray-900">{goal.title}</h4>
          {goal.completed && (
            <span className="badge badge-success">Completado</span>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
          <div 
            className={`h-full rounded-full ${goal.completed ? 'bg-green-500' : 'bg-primary-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-sm text-gray-500">
          {goal.current_value} / {goal.target_value} {goal.unit} ({Math.round(progress)}%)
        </p>
      </div>

      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </button>
  );
}
