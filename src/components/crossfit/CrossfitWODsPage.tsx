import { useState, useEffect } from 'react';
import { 
  Flame, 
  Save, 
  Trash2, 
  Calendar,
  Dumbbell,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import type { WeeklyCrossfitWODs } from '../../types';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Lunes', short: 'L' },
  { id: 'tuesday', label: 'Martes', short: 'M' },
  { id: 'wednesday', label: 'Miércoles', short: 'X' },
  { id: 'thursday', label: 'Jueves', short: 'J' },
  { id: 'friday', label: 'Viernes', short: 'V' },
  { id: 'saturday', label: 'Sábado', short: 'S' },
  { id: 'sunday', label: 'Domingo', short: 'D' },
];

export function CrossfitWODsPage() {
  const [wods, setWods] = useState<WeeklyCrossfitWODs>({});
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [crossfitType, setCrossfitType] = useState<'class' | 'open' | null>(null);

  useEffect(() => {
    // Cargar WODs guardados
    const savedWods = localStorage.getItem('fitapp-crossfit-wods');
    if (savedWods) {
      setWods(JSON.parse(savedWods));
    }

    // Cargar tipo de CrossFit del profile
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
    
    // Guardar en localStorage
    localStorage.setItem('fitapp-crossfit-wods', JSON.stringify(wods));
    
    // También actualizar el plan generado con los WODs
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

  const toggleDay = (day: string) => {
    setExpandedDay(prev => prev === day ? null : day);
  };

  const getDayStatus = (day: string) => {
    const dayWod = wods[day];
    if (!dayWod) return 'empty';
    if (dayWod.strength || dayWod.wod) return 'complete';
    return 'partial';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Flame className="w-7 h-7 text-orange-500" />
            WODs de CrossFit
          </h1>
          <p className="text-gray-600 mt-1">Añade los entrenos de tu box para optimizar tu plan</p>
        </div>
        <button
          onClick={handleSaveWods}
          disabled={isSaving}
          className="btn btn-primary"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : saveSuccess ? (
            <>
              <Save className="w-4 h-4" />
              ¡Guardado!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar WODs
            </>
          )}
        </button>
      </div>

      {/* Info box */}
      {crossfitType === 'class' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-800 font-medium">Modo Clase Dirigida</p>
              <p className="text-sm text-orange-700 mt-1">
                Añade los WODs que tienes programados en tu box esta semana. La IA ajustará 
                automáticamente tus otros entrenamientos para complementar el trabajo realizado en CrossFit.
              </p>
            </div>
          </div>
        </div>
      )}

      {crossfitType === 'open' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-800 font-medium">Modo Open Box</p>
              <p className="text-sm text-blue-700 mt-1">
                Como entrenas por tu cuenta, la IA te genera WODs personalizados. Pero si quieres 
                registrar lo que has hecho, puedes añadirlo aquí para llevar un seguimiento.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Weekly calendar */}
      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day) => {
          const status = getDayStatus(day.id);
          const isExpanded = expandedDay === day.id;
          const dayWod = wods[day.id] || {};
          
          return (
            <div 
              key={day.id}
              className={`bg-white rounded-xl border-2 transition-all ${
                status === 'complete' ? 'border-green-300' :
                status === 'partial' ? 'border-orange-300' :
                'border-gray-200'
              }`}
            >
              {/* Day header */}
              <button
                onClick={() => toggleDay(day.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                    status === 'complete' ? 'bg-green-100 text-green-700' :
                    status === 'partial' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {day.short}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{day.label}</p>
                    <p className="text-sm text-gray-500">
                      {status === 'complete' ? 'WOD añadido ✓' :
                       status === 'partial' ? 'Parcialmente completado' :
                       'Sin WOD añadido'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {status !== 'empty' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearDay(day.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                  {/* Strength */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Dumbbell className="w-4 h-4" />
                      Fuerza / Técnica
                    </label>
                    <textarea
                      value={dayWod.strength || ''}
                      onChange={(e) => updateWodField(day.id, 'strength', e.target.value)}
                      placeholder="Ej: Back Squat 5x5 @75%&#10;Strict Press 4x8"
                      className="input min-h-[80px] resize-none"
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
                      onChange={(e) => updateWodField(day.id, 'wod', e.target.value)}
                      placeholder="Ej: AMRAP 15min&#10;10 Thrusters (40kg)&#10;15 Pull-ups&#10;200m Run"
                      className="input min-h-[100px] resize-none"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4" />
                      Notas / Resultado
                    </label>
                    <input
                      type="text"
                      value={dayWod.notes || ''}
                      onChange={(e) => updateWodField(day.id, 'notes', e.target.value)}
                      placeholder="Ej: 6 rondas + 5 thrusters, PR en back squat"
                      className="input"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Info */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">La IA optimiza tu semana</h3>
            <p className="text-sm text-gray-600 mt-1">
              Al añadir tus WODs de CrossFit, la IA:
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• Evita trabajar los mismos grupos musculares en días consecutivos</li>
              <li>• Ajusta la intensidad del gimnasio según el volumen de CrossFit</li>
              <li>• Equilibra cardio, fuerza y técnica durante la semana</li>
              <li>• Recomienda días de descanso activo cuando detecta alta carga</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick templates */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          Plantillas rápidas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: 'Hero WOD', icon: '🦸', desc: 'Murph, Fran...' },
            { name: 'EMOM', icon: '⏱️', desc: 'Every minute' },
            { name: 'AMRAP', icon: '🔄', desc: 'As many reps' },
            { name: 'For Time', icon: '⚡', desc: 'Lo más rápido' },
          ].map((template) => (
            <button
              key={template.name}
              onClick={() => {
                if (expandedDay) {
                  updateWodField(expandedDay, 'wod', `${template.name}\n`);
                }
              }}
              disabled={!expandedDay}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                expandedDay
                  ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                  : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}
            >
              <span className="text-2xl">{template.icon}</span>
              <p className="font-medium text-sm mt-1">{template.name}</p>
              <p className="text-xs text-gray-500">{template.desc}</p>
            </button>
          ))}
        </div>
        {!expandedDay && (
          <p className="text-xs text-gray-500 mt-3 text-center">
            Selecciona un día para usar las plantillas
          </p>
        )}
      </div>
    </div>
  );
}
