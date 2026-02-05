import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Measurement, ProgressPhoto } from '../types';

interface ProgressState {
  measurements: Measurement[];
  photos: ProgressPhoto[];
  isLoading: boolean;
  
  // Actions
  fetchMeasurements: (userId: string) => Promise<void>;
  addMeasurement: (measurement: Omit<Measurement, 'id'>) => Promise<{ error?: string }>;
  deleteMeasurement: (id: string) => Promise<{ error?: string }>;
  
  fetchPhotos: (userId: string) => Promise<void>;
  addPhoto: (photo: Omit<ProgressPhoto, 'id'>) => Promise<{ error?: string }>;
  deletePhoto: (id: string) => Promise<{ error?: string }>;
  
  uploadPhoto: (userId: string, file: File, category: ProgressPhoto['category']) => Promise<{ url?: string; error?: string }>;
  
  // Stats
  getWeightHistory: () => { date: string; weight: number }[];
  getWeightChange: () => { total: number; lastMonth: number };
}

// Demo data
const DEMO_MEASUREMENTS: Measurement[] = [
  {
    id: '1',
    user_id: 'demo-user-id',
    weight: 75.5,
    body_measurements: { chest: 102, waist: 82, hips: 98, biceps: 36, thighs: 58 },
    measured_at: new Date().toISOString().split('T')[0]
  },
  {
    id: '2',
    user_id: 'demo-user-id',
    weight: 76.2,
    body_measurements: { chest: 101, waist: 83, hips: 98, biceps: 35.5, thighs: 57.5 },
    measured_at: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  },
  {
    id: '3',
    user_id: 'demo-user-id',
    weight: 77.0,
    body_measurements: { chest: 100, waist: 84, hips: 99, biceps: 35, thighs: 57 },
    measured_at: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]
  },
  {
    id: '4',
    user_id: 'demo-user-id',
    weight: 77.8,
    body_measurements: { chest: 99, waist: 85, hips: 99, biceps: 34.5, thighs: 56.5 },
    measured_at: new Date(Date.now() - 21 * 86400000).toISOString().split('T')[0]
  },
  {
    id: '5',
    user_id: 'demo-user-id',
    weight: 78.5,
    body_measurements: { chest: 98, waist: 86, hips: 100, biceps: 34, thighs: 56 },
    measured_at: new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0]
  }
];

const DEMO_PHOTOS: ProgressPhoto[] = [
  {
    id: '1',
    user_id: 'demo-user-id',
    url: 'https://via.placeholder.com/400x600/22c55e/ffffff?text=Frontal+Hoy',
    category: 'front',
    taken_at: new Date().toISOString().split('T')[0],
    notes: 'Después de 4 semanas'
  },
  {
    id: '2',
    user_id: 'demo-user-id',
    url: 'https://via.placeholder.com/400x600/16a34a/ffffff?text=Lateral+Hoy',
    category: 'side',
    taken_at: new Date().toISOString().split('T')[0]
  },
  {
    id: '3',
    user_id: 'demo-user-id',
    url: 'https://via.placeholder.com/400x600/15803d/ffffff?text=Frontal+Inicio',
    category: 'front',
    taken_at: new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0],
    notes: 'Inicio del programa'
  }
];

export const useProgressStore = create<ProgressState>((set, get) => ({
  measurements: [],
  photos: [],
  isLoading: false,

  fetchMeasurements: async (userId) => {
    set({ isLoading: true });

    // Demo mode
    if (userId === 'demo-user-id') {
      set({ measurements: DEMO_MEASUREMENTS, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('user_id', userId)
        .order('measured_at', { ascending: false });

      if (error) throw error;
      set({ measurements: data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching measurements:', error);
      set({ measurements: DEMO_MEASUREMENTS, isLoading: false });
    }
  },

  addMeasurement: async (measurement) => {
    // Demo mode
    if (measurement.user_id === 'demo-user-id') {
      const newMeasurement: Measurement = {
        ...measurement,
        id: crypto.randomUUID()
      };
      set(state => ({ measurements: [newMeasurement, ...state.measurements] }));
      return {};
    }

    try {
      const { data, error } = await supabase
        .from('measurements')
        .insert(measurement)
        .select()
        .single();

      if (error) return { error: error.message };
      set(state => ({ measurements: [data, ...state.measurements] }));
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  deleteMeasurement: async (id) => {
    // Demo mode
    const { measurements } = get();
    const measurement = measurements.find(m => m.id === id);
    if (measurement?.user_id === 'demo-user-id') {
      set(state => ({
        measurements: state.measurements.filter(m => m.id !== id)
      }));
      return {};
    }

    try {
      const { error } = await supabase
        .from('measurements')
        .delete()
        .eq('id', id);

      if (error) return { error: error.message };

      set(state => ({
        measurements: state.measurements.filter(m => m.id !== id)
      }));
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  fetchPhotos: async (userId) => {
    set({ isLoading: true });

    // Demo mode
    if (userId === 'demo-user-id') {
      set({ photos: DEMO_PHOTOS, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', userId)
        .order('taken_at', { ascending: false });

      if (error) throw error;
      set({ photos: data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching photos:', error);
      set({ photos: DEMO_PHOTOS, isLoading: false });
    }
  },

  addPhoto: async (photo) => {
    // Demo mode
    if (photo.user_id === 'demo-user-id') {
      const newPhoto: ProgressPhoto = {
        ...photo,
        id: crypto.randomUUID()
      };
      set(state => ({ photos: [newPhoto, ...state.photos] }));
      return {};
    }

    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .insert(photo)
        .select()
        .single();

      if (error) return { error: error.message };
      set(state => ({ photos: [data, ...state.photos] }));
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  deletePhoto: async (id) => {
    // Demo mode
    const { photos } = get();
    const photo = photos.find(p => p.id === id);
    if (photo?.user_id === 'demo-user-id') {
      set(state => ({
        photos: state.photos.filter(p => p.id !== id)
      }));
      return {};
    }

    try {
      // Delete from storage first
      await supabase
        .storage
        .from('progress-photos')
        .remove([photo?.url.split('/').pop() || '']);

      // Delete record
      const { error } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', id);

      if (error) return { error: error.message };

      set(state => ({
        photos: state.photos.filter(p => p.id !== id)
      }));
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  uploadPhoto: async (userId, file, _category) => {
    // Demo mode
    if (userId === 'demo-user-id') {
      // Create local URL for demo
      const url = URL.createObjectURL(file);
      return { url };
    }

    try {
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase
        .storage
        .from('progress-photos')
        .upload(fileName, file);

      if (uploadError) return { error: uploadError.message };

      const { data } = supabase
        .storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      return { url: data.publicUrl };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  getWeightHistory: () => {
    const { measurements } = get();
    return measurements
      .slice(0, 30) // Last 30 measurements
      .reverse()
      .map(m => ({
        date: new Date(m.measured_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        weight: m.weight
      }));
  },

  getWeightChange: () => {
    const { measurements } = get();
    if (measurements.length < 2) return { total: 0, lastMonth: 0 };

    const latest = measurements[0].weight;
    const oldest = measurements[measurements.length - 1].weight;
    const total = latest - oldest;

    // Find measurement from ~30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthAgoMeasurement = measurements.find(m => 
      new Date(m.measured_at) <= thirtyDaysAgo
    );
    
    const lastMonth = monthAgoMeasurement 
      ? latest - monthAgoMeasurement.weight 
      : total;

    return {
      total: Math.round(total * 10) / 10,
      lastMonth: Math.round(lastMonth * 10) / 10
    };
  }
}));
