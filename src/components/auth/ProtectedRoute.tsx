import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { LoadingScreen } from '../ui/LoadingSpinner';
import { Sidebar } from '../ui/Sidebar';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, setUser } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('=== ProtectedRoute: Checking auth ===');
      
      // SIEMPRE verificar con Supabase para tener datos frescos
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Session found for:', session.user.email);
          
          // Hay sesión válida, obtener perfil FRESCO de Supabase
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
          }

          console.log('Profile from Supabase:', profile ? {
            training_types: profile.training_types,
            has_goals: !!profile.goals,
            has_plan: !!profile.generated_plan
          } : 'NO PROFILE FOUND');

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
            console.log('✅ Loading generated plan from Supabase');
            localStorage.setItem('fitapp-generated-plan', JSON.stringify(profile.generated_plan));
          }
          
          // Verificar si necesita onboarding (training_types es el indicador clave)
          const hasCompletedOnboarding = profile?.training_types && profile.training_types.length > 0;
          setNeedsOnboarding(!hasCompletedOnboarding);
          
          console.log('Auth result:', {
            email: userData.email,
            trainingTypes: userData.training_types,
            needsOnboarding: !hasCompletedOnboarding
          });
        } else {
          console.log('No session found');
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
  }, [setUser]); // Solo depende de setUser, no de isAuthenticated/user para evitar loops

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
