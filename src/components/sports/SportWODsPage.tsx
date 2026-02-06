import { useState, useEffect } from 'react';
import { 
  Save, 
  Trash2, 
  Dumbbell,
  Clock,
  Sparkles,
  CheckCircle,
  Edit3,
  LucideIcon
} from 'lucide-react';
import type { WeeklyCrossfitWODs } from '../../types';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Lunes', short: 'Lun' },
  { id: 'tuesday', label: 'Martes', short: 'Mar' },
  { id: 'wednesday', label: 'Miércoles', short: 'Mié' },
  { id: 'thursday', label: 'Jueves', short: 'Jue' },
  { id: 'friday', label: 'Viernes', short: 'Vie' },
  { id: 'saturday', label: 'Sábado', short: 'Sáb' },
  { id: 'sunday', label: 'Domingo', short: 'Dom' },
];

interface SportWODsPageProps {
  sportId: string;
  sportName: string;
  sportIcon: LucideIcon;
  iconColor: string;
  bgGradient: string;
  templates: { name: string; content: string }[];
}

export function SportWODsPage({ 
  sportId, 
  sportName, 
  sportIcon: SportIcon,
  iconColor,
  bgGradient,
  templates 
}: SportWODsPageProps) {
  const storageKey = `fitapp-${sportId}-wods`;
  const [wods, setWods] = useState<WeeklyCrossfitWODs>({});
  const [selectedDay, setSelectedDay] = useState<string>('monday');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sportType, setSportType] = useState<'class' | 'open' | null>(null);

  useEffect(() => {
    const savedWods = localStorage.getItem(storageKey);
    if (savedWods) {
      setWods(JSON.parse(savedWods));
    }

    // Cargar tipo de entrenamiento desde el perfil
    const savedGoals = localStorage.getItem('fitapp-goals');
    if (savedGoals) {
      try {
        const goals = JSON.parse(savedGoals);
        if (goals.profile_data?.sports_frequency?.[sportId]?.type) {
          setSportType(goals.profile_data.sports_frequency[sportId].type);
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      }
    }
  }, [sportId, storageKey]);

  const handleSaveWods = async () => {
    setIsSaving(true);
    localStorage.setItem(storageKey, JSON.stringify(wods));
    
    // También actualizar el plan generado
    const savedPlan = localStorage.getItem('fitapp-generated-plan');
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        plan[`${sportId}_wods`] = wods;
        localStorage.setItem('fitapp-generated-plan', JSON.stringify(plan));
      } catch (e) {
        console.error('Error updating plan:', e);
      }
    }
    
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 500);
  };

  const updateWodField = (day: string, field: 'strength' | 'wod' | 'notes', value: string) => {
    setWods(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const clearDay = (day: string) => {
    setWods(prev => {
      const updated = { ...prev };
      delete updated[day];
      return updated;
    });
  };

  const selectedDayData = wods[selectedDay] || {};
  const selectedDayInfo = DAYS_OF_WEEK.find(d => d.id === selectedDay);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${bgGradient} rounded-xl flex items-center justify-center`}>
            <SportIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{sportName} WODs</h1>
            <p className="text-sm text-gray-500">Registra tus entrenos semanales</p>
          </div>
        </div>
        <button
          onClick={handleSaveWods}
          disabled={isSaving}
          className={`btn ${saveSuccess ? 'bg-green-600 hover:bg-green-700' : 'btn-primary'} transition-colors`}
        >
          {saveSuccess ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Guardado
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </>
          )}
        </button>
      </div>

      {/* Info box según tipo */}
      {sportType && (
        <div className={`mb-6 p-4 rounded-xl ${sportType === 'class' ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'}`}>
          <p className={`text-sm ${sportType === 'class' ? 'text-blue-800' : 'text-green-800'}`}>
            {sportType === 'class' ? (
              <>📋 <strong>Clase dirigida:</strong> Añade los WODs que te ponen en tu box para que la IA adapte el resto de tu plan de entrenamiento.</>
            ) : (
              <>🔓 <strong>Open Box:</strong> La IA te sugiere WODs, pero puedes personalizarlos aquí.</>
            )}
          </p>
        </div>
      )}

      {/* Weekly Summary - Day Selector */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Resumen semanal</h3>
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const dayWod = wods[day.id];
            const hasContent = dayWod?.strength || dayWod?.wod;
            const isSelected = selectedDay === day.id;
            
            return (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`p-2 rounded-lg text-center transition-all ${
                  isSelected
                    ? `${bgGradient} text-white shadow-md`
                    : hasContent
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <p className="text-xs font-medium">{day.short}</p>
                {hasContent && !isSelected && (
                  <CheckCircle className="w-3 h-3 mx-auto mt-1" />
                )}
                {isSelected && (
                  <Edit3 className="w-3 h-3 mx-auto mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Editor */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Edit3 className={`w-5 h-5 ${iconColor}`} />
            {selectedDayInfo?.label}
          </h3>
          {(selectedDayData.strength || selectedDayData.wod) && (
            <button
              onClick={() => clearDay(selectedDay)}
              className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Fuerza / Técnica */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Dumbbell className="w-4 h-4 text-gray-500" />
              Fuerza / Técnica
            </label>
            <textarea
              value={selectedDayData.strength || ''}
              onChange={(e) => updateWodField(selectedDay, 'strength', e.target.value)}
              placeholder="Ej: Back Squat 5x5 @80%"
              className="input min-h-[80px] text-gray-900"
            />
          </div>

          {/* WOD */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              WOD
            </label>
            <textarea
              value={selectedDayData.wod || ''}
              onChange={(e) => updateWodField(selectedDay, 'wod', e.target.value)}
              placeholder="Ej: 21-15-9 Thrusters + Pull-ups"
              className="input min-h-[100px] text-gray-900"
            />
          </div>

          {/* Notas / Resultado */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Edit3 className="w-4 h-4 text-gray-500" />
              Notas / Resultado
            </label>
            <input
              type="text"
              value={selectedDayData.notes || ''}
              onChange={(e) => updateWodField(selectedDay, 'notes', e.target.value)}
              placeholder="Ej: 8:45 Rx"
              className="input text-gray-900"
            />
          </div>
        </div>

        {/* Quick Templates */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Plantillas rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {templates.map((template, i) => (
              <button
                key={i}
                onClick={() => updateWodField(selectedDay, 'wod', template.content)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 transition-colors"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Info */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-purple-900">¿Cómo usa esto la IA?</p>
            <p className="text-sm text-purple-700 mt-1">
              Al añadir tus WODs, la IA ajusta tu rutina de gimnasio para complementar tu entrenamiento 
              y evitar sobreentrenar grupos musculares específicos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
