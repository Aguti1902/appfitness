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
            .select('id, email, name, avatar_url, goals, training_types, created_at, updated_at')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
          }

          console.log('=== PROFILE FROM SUPABASE ===');
          console.log('Profile exists:', !!profile);
          console.log('Training types:', profile?.training_types);
          console.log('Training types length:', profile?.training_types?.length);

          // Extraer profile_data de dentro de goals (donde lo guardamos)
          const goalsData = profile?.goals || {};
          const profileData = goalsData.profile_data || null;
          
          // Limpiar goals para que no tenga profile_data anidado
          const cleanGoals = { ...goalsData };
          delete cleanGoals.profile_data;

          const userData = {
            id: session.user.id,
            email: session.user.email!,
            name: profile?.name || session.user.user_metadata?.name || session.user.email!.split('@')[0],
            avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
            goals: Object.keys(cleanGoals).length > 0 ? cleanGoals : { primary: 'maintain', activity_level: 'moderate' },
            training_types: profile?.training_types || [],
            profile_data: profileData,
            created_at: session.user.created_at
          };

          setUser(userData);
          setHasSession(true);
          
          // Verificar si necesita onboarding (training_types es el indicador clave)
          const trainingTypes = profile?.training_types || [];
          const hasCompletedOnboarding = Array.isArray(trainingTypes) && trainingTypes.length > 0;
          
          console.log('=== ONBOARDING CHECK ===');
          console.log('Training types array:', trainingTypes);
          console.log('Is array:', Array.isArray(trainingTypes));
          console.log('Length:', trainingTypes.length);
          console.log('Has completed onboarding:', hasCompletedOnboarding);
          console.log('Needs onboarding:', !hasCompletedOnboarding);
          
          setNeedsOnboarding(!hasCompletedOnboarding);
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
