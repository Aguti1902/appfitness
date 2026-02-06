import { useState, useEffect } from 'react';
import { 
  Flame, 
  Save, 
  Trash2, 
  Dumbbell,
  Clock,
  Sparkles,
  CheckCircle,
  Edit3
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

export function CrossfitWODsPage() {
  const [wods, setWods] = useState<WeeklyCrossfitWODs>({});
  const [selectedDay, setSelectedDay] = useState<string>('monday');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [crossfitType, setCrossfitType] = useState<'class' | 'open' | null>(null);

  useEffect(() => {
    const savedWods = localStorage.getItem('fitapp-crossfit-wods');
    if (savedWods) {
      setWods(JSON.parse(savedWods));
    }

    const savedPlan = localStorage.getItem('fitapp-generated-plan');
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        if (plan.profile_data?.sports_frequency?.crossfit?.type) {
          setCrossfitType(plan.profile_data.sports_frequency.crossfit.type);
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      }
    }
  }, []);

  const handleSaveWods = async () => {
    setIsSaving(true);
    localStorage.setItem('fitapp-crossfit-wods', JSON.stringify(wods));
    
    const savedPlan = localStorage.getItem('fitapp-generated-plan');
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        plan.crossfit_wods = wods;
        localStorage.setItem('fitapp-generated-plan', JSON.stringify(plan));
      } catch (e) {
        console.error('Error updating plan:', e);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
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
      const newWods = { ...prev };
      delete newWods[day];
      return newWods;
    });
  };

  const getDayStatus = (day: string) => {
    const dayWod = wods[day];
    if (!dayWod) return 'empty';
    if (dayWod.strength || dayWod.wod) return 'complete';
    return 'partial';
  };

  const completedDays = DAYS_OF_WEEK.filter(d => getDayStatus(d.id) === 'complete').length;
  const dayWod = wods[selectedDay] || {};

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CrossFit WODs</h1>
          <p className="text-gray-500">Registra los WODs de tu box</p>
        </div>
        <button
          onClick={handleSaveWods}
          disabled={isSaving}
          className={`btn ${saveSuccess ? 'btn-secondary bg-green-50 text-green-600 border-green-200' : 'btn-primary'}`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Guardado
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar
            </>
          )}
        </button>
      </div>

      {/* Info box */}
      {crossfitType === 'class' && (
        <div className="card bg-orange-50 border-orange-200 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-orange-800">Modo Clase Dirigida</p>
              <p className="text-sm text-orange-700">
                Añade los WODs de tu box para que la IA ajuste tu plan de gym.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Week Summary */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Semana actual</h3>
          <span className="badge badge-primary">
            {completedDays}/7 días
          </span>
        </div>
        
        {/* Day Selector */}
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const status = getDayStatus(day.id);
            const isSelected = selectedDay === day.id;
            
            return (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`p-3 rounded-xl text-center transition-all ${
                  isSelected
                    ? 'bg-primary-600 text-white shadow-lg scale-105'
                    : status === 'complete'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <p className="text-xs font-medium">{day.short}</p>
                {status === 'complete' && !isSelected && (
                  <CheckCircle className="w-4 h-4 mx-auto mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Editor */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              getDayStatus(selectedDay) === 'complete' 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {DAYS_OF_WEEK.find(d => d.id === selectedDay)?.label}
              </h3>
              <p className="text-sm text-gray-500">
                {getDayStatus(selectedDay) === 'complete' ? 'WOD añadido' : 'Sin WOD'}
              </p>
            </div>
          </div>
          {getDayStatus(selectedDay) !== 'empty' && (
            <button
              onClick={() => clearDay(selectedDay)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Strength */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Dumbbell className="w-4 h-4 text-primary-600" />
              Fuerza / Técnica
            </label>
            <textarea
              value={dayWod.strength || ''}
              onChange={(e) => updateWodField(selectedDay, 'strength', e.target.value)}
              placeholder="Ej: Back Squat 5x5 @75%&#10;Strict Press 4x8"
              className="input min-h-[80px] resize-none text-gray-900"
            />
          </div>

          {/* WOD */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              WOD
            </label>
            <textarea
              value={dayWod.wod || ''}
              onChange={(e) => updateWodField(selectedDay, 'wod', e.target.value)}
              placeholder="Ej: AMRAP 15min&#10;10 Thrusters (40kg)&#10;15 Pull-ups&#10;200m Run"
              className="input min-h-[120px] resize-none text-gray-900"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Notas / Resultado
            </label>
            <input
              type="text"
              value={dayWod.notes || ''}
              onChange={(e) => updateWodField(selectedDay, 'notes', e.target.value)}
              placeholder="Ej: 6 rondas + 5 thrusters, PR en back squat"
              className="input text-gray-900"
            />
          </div>

          {/* Quick templates */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Plantillas rápidas:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'AMRAP', template: 'AMRAP __ min\n' },
                { name: 'EMOM', template: 'EMOM __ min\n' },
                { name: 'For Time', template: 'For Time:\n' },
                { name: 'Hero WOD', template: 'Hero WOD:\n' },
              ].map((t) => (
                <button
                  key={t.name}
                  onClick={() => updateWodField(selectedDay, 'wod', t.template + (dayWod.wod || ''))}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Info */}
      <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100 mt-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">La IA optimiza tu semana</h3>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• Evita trabajar los mismos músculos en días seguidos</li>
              <li>• Ajusta la intensidad del gym según el CrossFit</li>
              <li>• Recomienda descanso cuando detecta alta carga</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
