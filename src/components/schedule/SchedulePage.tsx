import { useEffect, useState } from 'react';
import { 
  Plus, 
  Calendar, 
  Bell,
  Clock,
  Dumbbell,
  Utensils,
  Trash2,
  Edit,
  Check,
  X
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useScheduleStore, DAYS_OF_WEEK } from '../../stores/scheduleStore';
import { requestNotificationPermission } from '../../lib/notifications';
import { Modal } from '../ui/Modal';
import type { Schedule, TrainingType } from '../../types';

export function SchedulePage() {
  const { user } = useAuthStore();
  const { 
    schedules, 
    fetchSchedules, 
    deleteSchedule,
    toggleScheduleActive,
    getTodaySchedules,
    getUpcomingReminders
  } = useScheduleStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchSchedules(user.id);
    }
    // Check notification permission
    setNotificationsEnabled(Notification.permission === 'granted');
  }, [user?.id]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
  };

  const todaySchedules = getTodaySchedules();
  const upcomingReminders = getUpcomingReminders();
  const today = new Date().getDay();

  // Group schedules by type
  const workoutSchedules = schedules.filter(s => s.activity_type !== 'meal');
  const mealSchedules = schedules.filter(s => s.activity_type === 'meal');

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Horarios</h1>
          <p className="text-gray-500">Planifica tus entrenamientos y comidas</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Nuevo horario
        </button>
      </div>

      {/* Notification Banner */}
      {!notificationsEnabled && (
        <div className="card mb-6 bg-yellow-50 border-2 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900">Activa las notificaciones</p>
                <p className="text-sm text-gray-600">Recibe recordatorios de tus entrenamientos y comidas</p>
              </div>
            </div>
            <button
              onClick={handleEnableNotifications}
              className="btn btn-primary"
            >
              Activar
            </button>
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-gray-900">
            Hoy - {DAYS_OF_WEEK[today]}
          </h2>
        </div>

        {todaySchedules.length > 0 ? (
          <div className="space-y-3">
            {todaySchedules.map((schedule) => (
              <div 
                key={schedule.id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  schedule.activity_type === 'meal'
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-primary-100 text-primary-600'
                }`}>
                  {schedule.activity_type === 'meal' 
                    ? <Utensils className="w-5 h-5" />
                    : <Dumbbell className="w-5 h-5" />
                  }
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{schedule.title}</p>
                  <p className="text-sm text-gray-500">{schedule.scheduled_time}</p>
                </div>
                {schedule.reminder_enabled && (
                  <Bell className="w-4 h-4 text-primary-500" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No hay actividades programadas para hoy
          </p>
        )}

        {/* Upcoming reminders */}
        {upcomingReminders.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">Próximos recordatorios:</p>
            <div className="flex gap-2 flex-wrap">
              {upcomingReminders.slice(0, 3).map(({ schedule }) => (
                <span 
                  key={schedule.id}
                  className="badge badge-info"
                >
                  {schedule.title} a las {schedule.scheduled_time}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Weekly Overview */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Vista semanal</h2>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[600px]">
            {DAYS_OF_WEEK.map((day, i) => {
              const daySchedules = schedules.filter(s => 
                s.is_active && s.days_of_week.includes(i)
              );
              const isToday = i === today;
              
              return (
                <div 
                  key={day}
                  className={`p-3 rounded-xl ${
                    isToday ? 'bg-primary-50 border-2 border-primary-200' : 'bg-gray-50'
                  }`}
                >
                  <p className={`text-sm font-medium mb-2 ${
                    isToday ? 'text-primary-700' : 'text-gray-700'
                  }`}>
                    {day.slice(0, 3)}
                  </p>
                  <div className="space-y-1">
                    {daySchedules.slice(0, 4).map((s) => (
                      <div 
                        key={s.id}
                        className={`text-xs p-1.5 rounded ${
                          s.activity_type === 'meal'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-primary-100 text-primary-700'
                        }`}
                      >
                        {s.scheduled_time.slice(0, 5)}
                      </div>
                    ))}
                    {daySchedules.length > 4 && (
                      <p className="text-xs text-gray-500">+{daySchedules.length - 4} más</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Schedules List */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Workout Schedules */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Entrenamientos</h3>
          </div>

          {workoutSchedules.length > 0 ? (
            <div className="space-y-3">
              {workoutSchedules.map((schedule) => (
                <ScheduleItem 
                  key={schedule.id} 
                  schedule={schedule}
                  onEdit={() => setEditingSchedule(schedule)}
                  onToggle={() => toggleScheduleActive(schedule.id)}
                  onDelete={() => deleteSchedule(schedule.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No hay entrenamientos programados
            </p>
          )}
        </div>

        {/* Meal Schedules */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Utensils className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Comidas</h3>
          </div>

          {mealSchedules.length > 0 ? (
            <div className="space-y-3">
              {mealSchedules.map((schedule) => (
                <ScheduleItem 
                  key={schedule.id} 
                  schedule={schedule}
                  onEdit={() => setEditingSchedule(schedule)}
                  onToggle={() => toggleScheduleActive(schedule.id)}
                  onDelete={() => deleteSchedule(schedule.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No hay comidas programadas
            </p>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <ScheduleModal
        isOpen={showAddModal || !!editingSchedule}
        onClose={() => {
          setShowAddModal(false);
          setEditingSchedule(null);
        }}
        schedule={editingSchedule}
      />
    </div>
  );
}

function ScheduleItem({ 
  schedule, 
  onEdit, 
  onToggle, 
  onDelete 
}: { 
  schedule: Schedule; 
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`p-3 rounded-xl border ${
      schedule.is_active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{schedule.title}</h4>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg ${
              schedule.is_active 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {schedule.is_active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {schedule.scheduled_time}
        </span>
        {schedule.reminder_enabled && (
          <span className="flex items-center gap-1">
            <Bell className="w-4 h-4" />
            {schedule.reminder_minutes_before} min antes
          </span>
        )}
      </div>

      <div className="flex gap-1 mt-2">
        {schedule.days_of_week.map((day) => (
          <span 
            key={day}
            className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center font-medium"
          >
            {DAYS_OF_WEEK[day].charAt(0)}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScheduleModal({ 
  isOpen, 
  onClose, 
  schedule 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  schedule: Schedule | null;
}) {
  const { user } = useAuthStore();
  const { addSchedule, updateSchedule } = useScheduleStore();

  const [formData, setFormData] = useState({
    activity_type: 'gym' as TrainingType | 'meal',
    title: '',
    scheduled_time: '09:00',
    days_of_week: [] as number[],
    reminder_enabled: true,
    reminder_minutes_before: 30
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (schedule) {
      setFormData({
        activity_type: schedule.activity_type,
        title: schedule.title,
        scheduled_time: schedule.scheduled_time,
        days_of_week: schedule.days_of_week,
        reminder_enabled: schedule.reminder_enabled,
        reminder_minutes_before: schedule.reminder_minutes_before
      });
    } else {
      setFormData({
        activity_type: 'gym',
        title: '',
        scheduled_time: '09:00',
        days_of_week: [],
        reminder_enabled: true,
        reminder_minutes_before: 30
      });
    }
  }, [schedule]);

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort()
    }));
  };

  const handleSave = async () => {
    if (!user || !formData.title || formData.days_of_week.length === 0) return;
    
    setIsSaving(true);

    if (schedule) {
      await updateSchedule(schedule.id, formData);
    } else {
      await addSchedule({
        user_id: user.id,
        ...formData,
        is_active: true
      });
    }

    setIsSaving(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={schedule ? 'Editar horario' : 'Nuevo horario'}
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de actividad
          </label>
          <select
            value={formData.activity_type}
            onChange={(e) => setFormData({ ...formData, activity_type: e.target.value as any })}
            className="input"
          >
            <option value="gym">Gimnasio</option>
            <option value="crossfit">CrossFit</option>
            <option value="running">Running</option>
            <option value="swimming">Natación</option>
            <option value="yoga">Yoga</option>
            <option value="meal">Comida</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input"
            placeholder="Ej: Entrenamiento de fuerza"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hora
          </label>
          <input
            type="time"
            value={formData.scheduled_time}
            onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Días de la semana
          </label>
          <div className="flex gap-2">
            {DAYS_OF_WEEK.map((day, i) => (
              <button
                key={day}
                onClick={() => toggleDay(i)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  formData.days_of_week.includes(i)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {day.charAt(0)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-900">Recordatorio</p>
              <p className="text-sm text-gray-500">Recibe una notificación antes</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.reminder_enabled}
              onChange={(e) => setFormData({ ...formData, reminder_enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {formData.reminder_enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minutos antes del recordatorio
            </label>
            <select
              value={formData.reminder_minutes_before}
              onChange={(e) => setFormData({ ...formData, reminder_minutes_before: parseInt(e.target.value) })}
              className="input"
            >
              <option value={5}>5 minutos</option>
              <option value={10}>10 minutos</option>
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button onClick={onClose} className="btn btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.title || formData.days_of_week.length === 0 || isSaving}
            className="btn btn-primary flex-1"
          >
            {isSaving ? 'Guardando...' : schedule ? 'Guardar cambios' : 'Crear horario'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
