import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { supabase, isSupabaseConfigured } from './lib/supabase';

// Auth components - carga directa (críticos)
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { OnboardingPage } from './components/auth/OnboardingPage';
import { AIProcessingPage } from './components/auth/AIProcessingPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy loading para componentes secundarios
const DashboardPage = lazy(() => import('./components/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const WorkoutsPage = lazy(() => import('./components/workouts/WorkoutsPage').then(m => ({ default: m.WorkoutsPage })));
const NewWorkoutPage = lazy(() => import('./components/workouts/NewWorkoutPage').then(m => ({ default: m.NewWorkoutPage })));
const WorkoutDetailPage = lazy(() => import('./components/workouts/WorkoutDetailPage').then(m => ({ default: m.WorkoutDetailPage })));
const NutritionPage = lazy(() => import('./components/nutrition/NutritionPage').then(m => ({ default: m.NutritionPage })));
const ProgressPage = lazy(() => import('./components/progress/ProgressPage').then(m => ({ default: m.ProgressPage })));
const SocialPage = lazy(() => import('./components/social/SocialPage').then(m => ({ default: m.SocialPage })));
const SchedulePage = lazy(() => import('./components/schedule/SchedulePage').then(m => ({ default: m.SchedulePage })));
const AICoachPage = lazy(() => import('./components/ai/AICoachPage').then(m => ({ default: m.AICoachPage })));
const SettingsPage = lazy(() => import('./components/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const GoalsPage = lazy(() => import('./components/goals/GoalsPage').then(m => ({ default: m.GoalsPage })));
const CrossfitWODsPage = lazy(() => import('./components/crossfit/CrossfitWODsPage').then(m => ({ default: m.CrossfitWODsPage })));
const HyroxPage = lazy(() => import('./components/sports/HyroxPage').then(m => ({ default: m.HyroxPage })));
const HybridPage = lazy(() => import('./components/sports/HybridPage').then(m => ({ default: m.HybridPage })));

// Loading fallback minimalista
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
  </div>
);

function AppContent() {
  const { isAuthenticated, setUser } = useAuthStore();
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Timeout reducido - 3 segundos máximo
    const timeout = setTimeout(() => {
      if (mounted && initialLoading) {
        setInitialLoading(false);
      }
    }, 3000);
    
    // Función auxiliar para cargar datos del usuario
    const loadUserData = async (sessionUser: any): Promise<any> => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, goals, training_types')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (!profile) {
          // Crear perfil en background, no bloquear
          supabase.from('profiles').upsert({
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0],
            avatar_url: sessionUser.user_metadata?.avatar_url
          }, { onConflict: 'id' }).then(() => {});
        }

        // Extraer profile_data de goals si existe
        const goalsData = profile?.goals || {};
        const profileData = goalsData.profile_data || null;
        const cleanGoals = { ...goalsData };
        delete cleanGoals.profile_data;

        return {
          id: sessionUser.id,
          email: sessionUser.email!,
          name: profile?.name || sessionUser.user_metadata?.name || sessionUser.email!.split('@')[0],
          avatar_url: profile?.avatar_url || sessionUser.user_metadata?.avatar_url,
          goals: Object.keys(cleanGoals).length > 0 ? cleanGoals : { primary: 'maintain', activity_level: 'moderate' },
          training_types: profile?.training_types || [],
          profile_data: profileData,
          created_at: sessionUser.created_at
        };
      } catch (error) {
        console.error('Error loading user data:', error);
        return null;
      }
    };

    // Listener de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        let userData = null;
        
        if (session?.user) {
          userData = await loadUserData(session.user);
          if (mounted && userData) {
            setUser(userData);
          }
        } else {
          if (mounted) setUser(null);
        }

        if (mounted) {
          setInitialLoading(false);
        }

        // Redirigir después de OAuth
        if (event === 'SIGNED_IN' && session?.user && userData) {
          if (window.location.hash.includes('access_token') || window.location.pathname === '/auth/callback') {
            const hasCompletedOnboarding = userData.training_types && 
              Array.isArray(userData.training_types) && 
              userData.training_types.length > 0;
            
            window.location.href = hasCompletedOnboarding ? '/' : '/onboarding';
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

  // Error de configuración
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-red-800 mb-2">Error de Configuración</h1>
          <p className="text-red-600">Variables de Supabase no configuradas.</p>
        </div>
      </div>
    );
  }

  // Loading inicial
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/onboarding" replace /> : <RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/ai-processing" element={<AIProcessingPage />} />
        <Route path="/auth/callback" element={<Navigate to="/" replace />} />

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
          <Route path="/crossfit" element={<CrossfitWODsPage />} />
          <Route path="/hyrox" element={<HyroxPage />} />
          <Route path="/hybrid" element={<HybridPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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
