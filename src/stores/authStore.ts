import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User, UserGoals, TrainingType, UserProfileData } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ error?: string }>;
  updateGoals: (goals: UserGoals) => Promise<{ error?: string }>;
  updateTrainingTypes: (types: TrainingType[]) => Promise<{ error?: string }>;
  updateProfileData: (data: UserProfileData) => Promise<{ error?: string }>;
  checkSession: () => Promise<void>;
}

// Demo user para modo sin Supabase
const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'demo@fitapp.com',
  name: 'Usuario Demo',
  avatar_url: '',
  goals: {
    primary: 'gain_muscle',
    current_weight: 75,
    target_weight: 80,
    height: 175,
    age: 28,
    activity_level: 'active',
    daily_calories: 2800
  },
  training_types: ['gym'],
  created_at: new Date().toISOString()
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false, // Empezar como false, se pondrá true cuando se verifique
      isAuthenticated: false,

      setUser: (user) => {
        console.log('setUser called with:', user?.email);
        set({ 
          user, 
          isAuthenticated: !!user,
          isLoading: false 
        });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        
        // Demo mode
        if (email === 'demo@fitapp.com' && password === 'demo123') {
          set({ user: DEMO_USER, isAuthenticated: true, isLoading: false });
          return {};
        }

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) {
            set({ isLoading: false });
            return { error: error.message };
          }

          if (data.user) {
            // Get profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id, email, name, avatar_url, goals, training_types')
              .eq('id', data.user.id)
              .maybeSingle();

            if (profileError) {
              console.error('Error fetching profile on login:', profileError);
            }

            console.log('=== LOGIN - PROFILE LOADED ===');
            console.log('Profile exists:', !!profile);
            console.log('Training types:', profile?.training_types);

            // Extraer profile_data de dentro de goals
            const goalsData = profile?.goals || {};
            const profileData = goalsData.profile_data || null;
            const cleanGoals = { ...goalsData };
            delete cleanGoals.profile_data;

            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              name: profile?.name || data.user.email!.split('@')[0],
              avatar_url: profile?.avatar_url,
              goals: Object.keys(cleanGoals).length > 0 ? cleanGoals : { primary: 'maintain', activity_level: 'moderate' },
              training_types: profile?.training_types || [],
              profile_data: profileData,
              created_at: data.user.created_at
            };

            set({ user, isAuthenticated: true, isLoading: false });
          }

          return {};
        } catch (error: any) {
          set({ isLoading: false });
          return { error: error.message };
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true });

        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name },
              emailRedirectTo: undefined // No email confirmation
            }
          });

          console.log('SignUp response:', { data, error });

          if (error) {
            console.error('SignUp error:', error);
            set({ isLoading: false });
            return { error: error.message };
          }

          if (data.user) {
            // Create profile
            const { error: profileError } = await supabase.from('profiles').upsert({
              id: data.user.id,
              email: data.user.email,
              name
            }, { onConflict: 'id' });

            if (profileError) {
              console.error('Profile creation error:', profileError);
            }

            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              name,
              goals: {
                primary: 'maintain',
                activity_level: 'moderate'
              },
              training_types: [],
              created_at: data.user.created_at
            };

            set({ user, isAuthenticated: true, isLoading: false });
          }

          return {};
        } catch (error: any) {
          console.error('Register catch error:', error);
          set({ isLoading: false });
          return { error: error.message };
        }
      },

      logout: async () => {
        console.log('Logging out...');
        try {
          // Timeout de 3 segundos para signOut
          const signOutPromise = supabase.auth.signOut();
          const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3000));
          await Promise.race([signOutPromise, timeoutPromise]);
        } catch (e) {
          console.error('SignOut error:', e);
        }
        // Limpiar SOLO datos de sesión local, NO los datos del plan generado
        // (los datos del plan se deben mantener vinculados al usuario en Supabase)
        localStorage.removeItem('supabase-auth');
        localStorage.removeItem('fitapp-auth');
        // NO borrar fitapp-generated-plan ni fitapp-personal-records
        // ya que estos se cargarán de nuevo cuando el usuario inicie sesión
        // Limpiar estado
        set({ user: null, isAuthenticated: false, isLoading: false });
        console.log('Logged out - session cleared');
      },

      updateProfile: async (data) => {
        const { user } = get();
        if (!user) return { error: 'No hay usuario autenticado' };

        try {
          const { error } = await supabase
            .from('profiles')
            .update(data)
            .eq('id', user.id);

          if (error) return { error: error.message };

          set({ user: { ...user, ...data } });
          return {};
        } catch (error: any) {
          return { error: error.message };
        }
      },

      updateGoals: async (goals) => {
        const { user } = get();
        if (!user) return { error: 'No hay usuario autenticado' };

        // Demo mode
        if (user.id === 'demo-user-id') {
          set({ user: { ...user, goals } });
          return {};
        }

        try {
          const { error } = await supabase
            .from('profiles')
            .update({ goals })
            .eq('id', user.id);

          if (error) return { error: error.message };

          set({ user: { ...user, goals } });
          return {};
        } catch (error: any) {
          return { error: error.message };
        }
      },

      updateTrainingTypes: async (training_types) => {
        const { user } = get();
        if (!user) return { error: 'No hay usuario autenticado' };

        // Demo mode
        if (user.id === 'demo-user-id') {
          set({ user: { ...user, training_types } });
          return {};
        }

        try {
          const { error } = await supabase
            .from('profiles')
            .update({ training_types })
            .eq('id', user.id);

          if (error) return { error: error.message };

          set({ user: { ...user, training_types } });
          return {};
        } catch (error: any) {
          return { error: error.message };
        }
      },

      updateProfileData: async (profile_data) => {
        const { user } = get();
        if (!user) return { error: 'No hay usuario autenticado' };

        // Demo mode
        if (user.id === 'demo-user-id') {
          set({ user: { ...user, profile_data } });
          return {};
        }

        try {
          const { error } = await supabase
            .from('profiles')
            .update({ profile_data })
            .eq('id', user.id);

          if (error) return { error: error.message };

          set({ user: { ...user, profile_data } });
          return {};
        } catch (error: any) {
          return { error: error.message };
        }
      },

      checkSession: async () => {
        set({ isLoading: true });
        
        try {
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          // Si hay error de sesión, limpiar todo
          if (sessionError) {
            console.error('Session error:', sessionError);
            // Limpiar sesión corrupta
            await supabase.auth.signOut();
            localStorage.removeItem('fitapp-auth');
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }
          
          const session = data?.session;
          
          if (!session?.user) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }
          
          const sessionUser = session.user;
          
          // Intentar obtener el perfil
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sessionUser.id)
            .maybeSingle();

          // Si hay error de perfil (posible 401), limpiar sesión
          if (profileError && profileError.code === 'PGRST301') {
            console.error('Profile auth error, signing out');
            await supabase.auth.signOut();
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          // Si no existe el perfil (OAuth login), crearlo
          if (!profile) {
            const userName = sessionUser.user_metadata?.name || 
                             sessionUser.user_metadata?.full_name ||
                             sessionUser.email?.split('@')[0] || 'Usuario';
            
            await supabase.from('profiles').upsert({
              id: sessionUser.id,
              email: sessionUser.email,
              name: userName,
              avatar_url: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture
            }, { onConflict: 'id' });
          }

          const user: User = {
            id: sessionUser.id,
            email: sessionUser.email!,
            name: profile?.name || sessionUser.user_metadata?.name || sessionUser.email!.split('@')[0],
            avatar_url: profile?.avatar_url || sessionUser.user_metadata?.avatar_url,
            goals: profile?.goals || { primary: 'maintain', activity_level: 'moderate' },
            training_types: profile?.training_types || [],
            profile_data: profile?.profile_data,
            created_at: sessionUser.created_at
          };

          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          console.error('Error checking session:', error);
          // Limpiar en caso de error
          await supabase.auth.signOut().catch(() => {});
          localStorage.removeItem('fitapp-auth');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    }),
    {
      name: 'fitapp-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
);
