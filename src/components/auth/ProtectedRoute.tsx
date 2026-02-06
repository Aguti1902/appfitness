import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { LoadingScreen } from '../ui/LoadingSpinner';
import { Sidebar } from '../ui/Sidebar';

export function ProtectedRoute() {
  const { user, isAuthenticated, isLoading, setUser } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // Si el store ya dice que está autenticado, confiar en él
      if (isAuthenticated && !isLoading && user) {
        setHasSession(true);
        // Verificar si necesita onboarding (no tiene training_types configurados)
        const hasCompletedOnboarding = user.training_types && user.training_types.length > 0;
        setNeedsOnboarding(!hasCompletedOnboarding);
        setChecking(false);
        return;
      }

      // Si no, verificar directamente con Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Hay sesión válida, obtener perfil de Supabase
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
          }

          const userData = {
            id: session.user.id,
            email: session.user.email!,
            name: profile?.name || session.user.user_metadata?.name || session.user.email!.split('@')[0],
            avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
            goals: profile?.goals || { primary: 'maintain', activity_level: 'moderate' },
            training_types: profile?.training_types || [],
            profile_data: profile?.profile_data,
            created_at: session.user.created_at
          };

          setUser(userData);
          setHasSession(true);
          
          // Si hay un plan generado en Supabase, sincronizarlo con localStorage
          if (profile?.generated_plan) {
            console.log('Loading generated plan from Supabase');
            localStorage.setItem('fitapp-generated-plan', JSON.stringify(profile.generated_plan));
          }
          
          // Verificar si necesita onboarding
          const hasCompletedOnboarding = userData.training_types && userData.training_types.length > 0;
          setNeedsOnboarding(!hasCompletedOnboarding);
          
          console.log('User loaded:', userData.email, 'Training types:', userData.training_types, 'Needs onboarding:', !hasCompletedOnboarding);
        } else {
          setHasSession(false);
          setNeedsOnboarding(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setHasSession(false);
        setNeedsOnboarding(false);
      }
      
      setChecking(false);
    };

    checkAuth();
  }, [isAuthenticated, isLoading, setUser, user]);

  if (isLoading || checking) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated && !hasSession) {
    return <Navigate to="/login" replace />;
  }

  // Si necesita onboarding y no está ya en la página de onboarding
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
