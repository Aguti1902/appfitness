import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Schedule } from '../types';

interface ScheduleState {
  schedules: Schedule[];
  isLoading: boolean;
  
  // Actions
  fetchSchedules: (userId: string) => Promise<void>;
  addSchedule: (schedule: Omit<Schedule, 'id'>) => Promise<{ error?: string }>;
  updateSchedule: (id: string, data: Partial<Schedule>) => Promise<{ error?: string }>;
  deleteSchedule: (id: string) => Promise<{ error?: string }>;
  toggleScheduleActive: (id: string) => Promise<void>;
  
  // Helpers
  getTodaySchedules: () => Schedule[];
  getUpcomingReminders: () => { schedule: Schedule; nextTime: Date }[];
}

// Demo schedules
const DEMO_SCHEDULES: Schedule[] = [
  {
    id: '1',
    user_id: 'demo-user-id',
    activity_type: 'gym',
    title: 'Entrenamiento de fuerza',
    scheduled_time: '07:00',
    days_of_week: [1, 3, 5], // Lunes, Miércoles, Viernes
    reminder_enabled: true,
    reminder_minutes_before: 30,
    is_active: true
  },
  {
    id: '2',
    user_id: 'demo-user-id',
    activity_type: 'crossfit',
    title: 'CrossFit Box',
    scheduled_time: '18:30',
    days_of_week: [2, 4], // Martes, Jueves
    reminder_enabled: true,
    reminder_minutes_before: 45,
    is_active: true
  },
  {
    id: '3',
    user_id: 'demo-user-id',
    activity_type: 'meal',
    title: 'Desayuno',
    scheduled_time: '08:00',
    days_of_week: [0, 1, 2, 3, 4, 5, 6], // Todos los días
    reminder_enabled: true,
    reminder_minutes_before: 15,
    is_active: true
  },
  {
    id: '4',
    user_id: 'demo-user-id',
    activity_type: 'meal',
    title: 'Comida',
    scheduled_time: '14:00',
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    reminder_enabled: true,
    reminder_minutes_before: 15,
    is_active: true
  },
  {
    id: '5',
    user_id: 'demo-user-id',
    activity_type: 'meal',
    title: 'Cena',
    scheduled_time: '21:00',
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    reminder_enabled: true,
    reminder_minutes_before: 15,
    is_active: true
  }
];

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      schedules: [],
      isLoading: false,

      fetchSchedules: async (userId) => {
        set({ isLoading: true });

        // Demo mode
        if (userId === 'demo-user-id') {
          set({ schedules: DEMO_SCHEDULES, isLoading: false });
          return;
        }

        try {
          const { data, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('user_id', userId)
            .order('scheduled_time');

          if (error) throw error;
          set({ schedules: data || [], isLoading: false });
        } catch (error) {
          console.error('Error fetching schedules:', error);
          set({ schedules: DEMO_SCHEDULES, isLoading: false });
        }
      },

      addSchedule: async (schedule) => {
        // Demo mode
        if (schedule.user_id === 'demo-user-id') {
          const newSchedule: Schedule = {
            ...schedule,
            id: crypto.randomUUID()
          };
          set(state => ({ schedules: [...state.schedules, newSchedule] }));
          return {};
        }

        try {
          const { data, error } = await supabase
            .from('schedules')
            .insert(schedule)
            .select()
            .single();

          if (error) return { error: error.message };
          set(state => ({ schedules: [...state.schedules, data] }));
          return {};
        } catch (error: any) {
          return { error: error.message };
        }
      },

      updateSchedule: async (id, data) => {
        // Demo mode
        const { schedules } = get();
        const schedule = schedules.find(s => s.id === id);
        if (schedule?.user_id === 'demo-user-id') {
          set(state => ({
            schedules: state.schedules.map(s => s.id === id ? { ...s, ...data } : s)
          }));
          return {};
        }

        try {
          const { error } = await supabase
            .from('schedules')
            .update(data)
            .eq('id', id);

          if (error) return { error: error.message };

          set(state => ({
            schedules: state.schedules.map(s => s.id === id ? { ...s, ...data } : s)
          }));
          return {};
        } catch (error: any) {
          return { error: error.message };
        }
      },

      deleteSchedule: async (id) => {
        // Demo mode
        const { schedules } = get();
        const schedule = schedules.find(s => s.id === id);
        if (schedule?.user_id === 'demo-user-id') {
          set(state => ({
            schedules: state.schedules.filter(s => s.id !== id)
          }));
          return {};
        }

        try {
          const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', id);

          if (error) return { error: error.message };

          set(state => ({
            schedules: state.schedules.filter(s => s.id !== id)
          }));
          return {};
        } catch (error: any) {
          return { error: error.message };
        }
      },

      toggleScheduleActive: async (id) => {
        const { schedules, updateSchedule } = get();
        const schedule = schedules.find(s => s.id === id);
        if (schedule) {
          await updateSchedule(id, { is_active: !schedule.is_active });
        }
      },

      getTodaySchedules: () => {
        const { schedules } = get();
        const today = new Date().getDay();
        
        return schedules
          .filter(s => s.is_active && s.days_of_week.includes(today))
          .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
      },

      getUpcomingReminders: () => {
        const { schedules } = get();
        const now = new Date();
        const today = now.getDay();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const upcoming: { schedule: Schedule; nextTime: Date }[] = [];
        
        schedules
          .filter(s => s.is_active && s.reminder_enabled)
          .forEach(schedule => {
            const [hours, minutes] = schedule.scheduled_time.split(':').map(Number);
            const scheduleMinutes = hours * 60 + minutes;
            const reminderMinutes = scheduleMinutes - schedule.reminder_minutes_before;
            
            // Check if schedule is today and upcoming
            if (schedule.days_of_week.includes(today) && reminderMinutes > currentTime) {
              const nextTime = new Date();
              nextTime.setHours(hours, minutes, 0, 0);
              upcoming.push({ schedule, nextTime });
            }
          });
        
        return upcoming.sort((a, b) => a.nextTime.getTime() - b.nextTime.getTime());
      }
    }),
    {
      name: 'fitapp-schedules',
      partialize: (state) => ({ schedules: state.schedules })
    }
  )
);

export { DAYS_OF_WEEK };
