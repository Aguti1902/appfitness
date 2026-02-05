import { useState } from 'react';
import { 
  User, 
  Target, 
  Bell, 
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Save,
  Check
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { requestNotificationPermission } from '../../lib/notifications';
import type { UserGoals, TrainingType } from '../../types';

export function SettingsPage() {
  const { user, updateProfile, updateGoals, updateTrainingTypes, logout } = useAuthStore();
  
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [goals, setGoals] = useState<UserGoals>(user?.goals || {
    primary: 'maintain',
    activity_level: 'moderate'
  });
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>(user?.training_types || []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await updateProfile({ name });
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveGoals = async () => {
    setIsSaving(true);
    await updateGoals(goals);
    await updateTrainingTypes(trainingTypes);
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    console.log('Logout button clicked');
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    console.log('Navigating to login...');
    // Forzar recarga completa para limpiar todo el estado
    window.location.href = '/login';
  };

  const sections = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'goals', label: 'Objetivos', icon: Target },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'privacy', label: 'Privacidad', icon: Shield },
    { id: 'help', label: 'Ayuda', icon: HelpCircle },
  ];

  const toggleTrainingType = (type: TrainingType) => {
    setTrainingTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="page-content">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ajustes</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                activeSection === section.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <section.icon className="w-5 h-5" />
                <span className="font-medium">{section.label}</span>
              </div>
              <ChevronRight className={`w-5 h-5 transition-transform ${
                activeSection === section.id ? 'rotate-90' : ''
              }`} />
            </button>
          ))}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-2">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Perfil</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {name.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user?.email}</p>
                    <p className="text-sm text-gray-500">Miembro desde {
                      user?.created_at 
                        ? new Date(user.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                        : 'hace poco'
                    }</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input bg-gray-50"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {isSaving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}

          {/* Goals Section */}
          {activeSection === 'goals' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Objetivos y entrenamiento</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objetivo principal
                  </label>
                  <select
                    value={goals.primary}
                    onChange={(e) => setGoals({ ...goals, primary: e.target.value as UserGoals['primary'] })}
                    className="input"
                  >
                    <option value="lose_weight">Perder peso</option>
                    <option value="gain_muscle">Ganar músculo</option>
                    <option value="maintain">Mantenerme</option>
                    <option value="improve_endurance">Mejorar resistencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de actividad
                  </label>
                  <select
                    value={goals.activity_level}
                    onChange={(e) => setGoals({ ...goals, activity_level: e.target.value as UserGoals['activity_level'] })}
                    className="input"
                  >
                    <option value="sedentary">Sedentario</option>
                    <option value="light">Ligero (1-2 días/semana)</option>
                    <option value="moderate">Moderado (3-4 días/semana)</option>
                    <option value="active">Activo (5-6 días/semana)</option>
                    <option value="very_active">Muy activo (diario)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Peso actual (kg)
                    </label>
                    <input
                      type="number"
                      value={goals.current_weight || ''}
                      onChange={(e) => setGoals({ ...goals, current_weight: parseFloat(e.target.value) || undefined })}
                      className="input"
                      placeholder="75"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Peso objetivo (kg)
                    </label>
                    <input
                      type="number"
                      value={goals.target_weight || ''}
                      onChange={(e) => setGoals({ ...goals, target_weight: parseFloat(e.target.value) || undefined })}
                      className="input"
                      placeholder="70"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Altura (cm)
                    </label>
                    <input
                      type="number"
                      value={goals.height || ''}
                      onChange={(e) => setGoals({ ...goals, height: parseFloat(e.target.value) || undefined })}
                      className="input"
                      placeholder="175"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Edad
                    </label>
                    <input
                      type="number"
                      value={goals.age || ''}
                      onChange={(e) => setGoals({ ...goals, age: parseInt(e.target.value) || undefined })}
                      className="input"
                      placeholder="28"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipos de entrenamiento
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(['gym', 'crossfit', 'running', 'swimming', 'yoga', 'other'] as TrainingType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleTrainingType(type)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                          trainingTypes.includes(type)
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {type === 'gym' && 'Gimnasio'}
                        {type === 'crossfit' && 'CrossFit'}
                        {type === 'running' && 'Running'}
                        {type === 'swimming' && 'Natación'}
                        {type === 'yoga' && 'Yoga'}
                        {type === 'other' && 'Otro'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveGoals}
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {isSaving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Notificaciones</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Notificaciones push</p>
                    <p className="text-sm text-gray-500">Recibe recordatorios de entreno y comidas</p>
                  </div>
                  <button
                    onClick={requestNotificationPermission}
                    className="btn btn-primary text-sm"
                  >
                    {Notification.permission === 'granted' ? 'Activadas' : 'Activar'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Recordatorios de entreno</p>
                    <p className="text-sm text-gray-500">Antes de tus entrenamientos programados</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Recordatorios de comidas</p>
                    <p className="text-sm text-gray-500">Para no saltarte ninguna comida</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Actividad de amigos</p>
                    <p className="text-sm text-gray-500">Cuando tus amigos entrenan</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Section */}
          {activeSection === 'privacy' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Privacidad</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Perfil público</p>
                    <p className="text-sm text-gray-500">Otros usuarios pueden ver tu perfil</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Mostrar en rankings</p>
                    <p className="text-sm text-gray-500">Aparecer en los rankings de amigos</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Compartir progreso</p>
                    <p className="text-sm text-gray-500">Los amigos pueden ver tu progreso</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          {activeSection === 'help' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Ayuda</h2>
              
              <div className="space-y-4">
                <a href="#" className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <p className="font-medium text-gray-900">Centro de ayuda</p>
                  <p className="text-sm text-gray-500">Respuestas a preguntas frecuentes</p>
                </a>
                
                <a href="#" className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <p className="font-medium text-gray-900">Contactar soporte</p>
                  <p className="text-sm text-gray-500">Escríbenos si tienes problemas</p>
                </a>
                
                <a href="#" className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <p className="font-medium text-gray-900">Términos de servicio</p>
                  <p className="text-sm text-gray-500">Lee nuestros términos y condiciones</p>
                </a>
                
                <a href="#" className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <p className="font-medium text-gray-900">Política de privacidad</p>
                  <p className="text-sm text-gray-500">Cómo protegemos tus datos</p>
                </a>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 text-center">
                    FitApp v1.0.0 · Hecho con ❤️
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Default state */}
          {!activeSection && (
            <div className="card text-center py-12">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Selecciona una sección para ver los ajustes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
