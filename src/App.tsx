import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { supabase, isSupabaseConfigured } from './lib/supabase';

// Auth components
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { OnboardingPage } from './components/auth/OnboardingPage';
import { AIProcessingPage } from './components/auth/AIProcessingPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Main components
import { DashboardPage } from './components/dashboard/DashboardPage';
import { WorkoutsPage } from './components/workouts/WorkoutsPage';
import { NewWorkoutPage } from './components/workouts/NewWorkoutPage';
import { WorkoutDetailPage } from './components/workouts/WorkoutDetailPage';
import { NutritionPage } from './components/nutrition/NutritionPage';
import { ProgressPage } from './components/progress/ProgressPage';
import { SocialPage } from './components/social/SocialPage';
import { SchedulePage } from './components/schedule/SchedulePage';
import { AICoachPage } from './components/ai/AICoachPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { GoalsPage } from './components/goals/GoalsPage';

function AppContent() {
  const { isAuthenticated, setUser } = useAuthStore();
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    console.log('=== APP INIT ===');

    // Timeout de seguridad - máximo 5 segundos de loading
    const timeout = setTimeout(() => {
      if (mounted && initialLoading) {
        console.log('Loading timeout - forcing completion');
        setInitialLoading(false);
      }
    }, 5000);
    
    // Función auxiliar para cargar datos del usuario
    const loadUserData = async (sessionUser: any): Promise<any> => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (!profile) {
          await supabase.from('profiles').upsert({
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.user_metadata?.name || sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0],
            avatar_url: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture
          }, { onConflict: 'id' });
        }

        return {
          id: sessionUser.id,
          email: sessionUser.email!,
          name: profile?.name || sessionUser.user_metadata?.name || sessionUser.email!.split('@')[0],
          avatar_url: profile?.avatar_url || sessionUser.user_metadata?.avatar_url,
          goals: profile?.goals || { primary: 'maintain', activity_level: 'moderate' },
          training_types: profile?.training_types || [],
          profile_data: profile?.profile_data,
          created_at: sessionUser.created_at
        };
      } catch (error) {
        console.error('Error loading user data:', error);
        return null;
      }
    };

    // Escuchar cambios de auth (esto se dispara inmediatamente con INITIAL_SESSION)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, 'User:', session?.user?.email);
        
        if (!mounted) return;

        if (session?.user) {
          const userData = await loadUserData(session.user);
          if (mounted && userData) {
            setUser(userData);
          }
        } else {
          if (mounted) setUser(null);
        }

        // Terminar loading después del primer evento
        if (mounted) {
          setInitialLoading(false);
        }

        // Redirigir al onboarding si viene de OAuth
        if (event === 'SIGNED_IN' && session?.user) {
          if (window.location.hash.includes('access_token') || window.location.pathname === '/auth/callback') {
            window.location.href = '/onboarding';
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [setUser]);

  console.log('Render - InitialLoading:', initialLoading, 'Auth:', isAuthenticated, 'Supabase:', isSupabaseConfigured);

  // Mostrar error si Supabase no está configurado
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-red-800 mb-2">Error de Configuración</h1>
          <p className="text-red-600 mb-4">
            Las variables de entorno de Supabase no están configuradas correctamente.
          </p>
          <div className="bg-white rounded-lg p-4 text-left text-sm">
            <p className="font-medium mb-2">Verifica en Vercel:</p>
            <code className="block bg-gray-100 p-2 rounded mb-1">VITE_SUPABASE_URL</code>
            <code className="block bg-gray-100 p-2 rounded">VITE_SUPABASE_ANON_KEY</code>
          </div>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando FitApp...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to="/onboarding" replace /> : <RegisterPage />
      } />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/ai-processing" element={<AIProcessingPage />} />
      <Route path="/auth/callback" element={<OnboardingPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/workouts" element={<WorkoutsPage />} />
        <Route path="/workouts/new" element={<NewWorkoutPage />} />
        <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
        <Route path="/nutrition" element={<NutritionPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/social" element={<SocialPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/ai-coach" element={<AICoachPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
