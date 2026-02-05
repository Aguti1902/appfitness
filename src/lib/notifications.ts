import type { Schedule } from '../types';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function sendNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options
    });
  }
}

export function scheduleReminder(schedule: Schedule, callback: () => void): NodeJS.Timeout | null {
  if (!schedule.reminder_enabled || !schedule.is_active) {
    return null;
  }

  const now = new Date();
  const [hours, minutes] = schedule.scheduled_time.split(':').map(Number);
  
  // Crear fecha objetivo para hoy
  const targetTime = new Date();
  targetTime.setHours(hours, minutes, 0, 0);
  
  // Restar minutos del recordatorio
  targetTime.setMinutes(targetTime.getMinutes() - schedule.reminder_minutes_before);
  
  // Si ya pasó la hora hoy, programar para mañana
  if (targetTime <= now) {
    targetTime.setDate(targetTime.getDate() + 1);
  }
  
  // Verificar si el día de la semana está incluido
  const dayOfWeek = targetTime.getDay();
  if (schedule.days_of_week.length > 0 && !schedule.days_of_week.includes(dayOfWeek)) {
    return null;
  }
  
  const timeUntilReminder = targetTime.getTime() - now.getTime();
  
  return setTimeout(() => {
    callback();
    sendNotification(`Recordatorio: ${schedule.title}`, {
      body: `En ${schedule.reminder_minutes_before} minutos`,
      tag: schedule.id
    });
  }, timeUntilReminder);
}

export function getMealReminderTimes(): { meal: string; time: string }[] {
  return [
    { meal: 'Desayuno', time: '08:00' },
    { meal: 'Media mañana', time: '11:00' },
    { meal: 'Almuerzo', time: '14:00' },
    { meal: 'Merienda', time: '17:00' },
    { meal: 'Cena', time: '21:00' }
  ];
}

export function formatTimeUntil(targetTime: Date): string {
  const now = new Date();
  const diff = targetTime.getTime() - now.getTime();
  
  if (diff < 0) return 'Ya pasó';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `En ${hours}h ${minutes}min`;
  }
  return `En ${minutes} minutos`;
}

// Service Worker para notificaciones push (PWA)
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Error registrando Service Worker:', error);
      return null;
    }
  }
  return null;
}
