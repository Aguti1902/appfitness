import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { LoadingScreen } from '../ui/LoadingSpinner';
import { Sidebar } from '../ui/Sidebar';

export function ProtectedRoute() {
  const { isAuthenticated, user, setUser } = useAuthStore();
  const [status, setStatus] = useState<'checking' | 'ready' | 'no-session'>('checking');
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    
    const check = async () => {
      console.log('ProtectedRoute: Starting check...');
      console.log('ProtectedRoute: Store - isAuthenticated:', isAuthenticated, 'user:', user?.email);
      
      // SIEMPRE verificar con Supabase primero para tener datos actualizados
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('ProtectedRoute: Session error:', sessionError);
        }
        
        if (!mounted) return;
        
        console.log('ProtectedRoute: Supabase session:', session?.user?.email || 'none');
        
        if (session?.user) {
          // Hay sesión válida en Supabase
          console.log('ProtectedRoute: Valid session found, loading profile...');
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (!mounted) return;

          console.log('ProtectedRoute: Profile loaded, training_types:', profile?.training_types);

          // Extraer profile_data de goals
          const goalsData = profile?.goals || {};
          const profileData = goalsData.profile_data || null;
          const cleanGoals = { ...goalsData };
          delete cleanGoals.profile_data;

          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: profile?.name || session.user.email!.split('@')[0],
            avatar_url: profile?.avatar_url,
            goals: cleanGoals,
            training_types: profile?.training_types || [],
            profile_data: profileData,
            created_at: session.user.created_at
          });
          
          setStatus('ready');
        } else {
          // No hay sesión en Supabase
          console.log('ProtectedRoute: No session in Supabase');
          setStatus('no-session');
        }
      } catch (error) {
        console.error('ProtectedRoute error:', error);
        // En caso de error, si hay usuario en store, confiar en él
        if (isAuthenticated && user) {
          setStatus('ready');
        } else {
          setStatus('no-session');
        }
      }
      
    };

    check();
    
    // Timeout de seguridad más largo (8 segundos)
    const timeout = setTimeout(() => {
      if (mounted && status === 'checking') {
        console.log('ProtectedRoute: Timeout reached');
        // En timeout, si hay algo en el store, confiar en él
        if (isAuthenticated && user) {
          setStatus('ready');
        } else {
          setStatus('no-session');
        }
      }
    }, 8000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []); // Sin dependencias para que solo se ejecute una vez

  // Loading
  if (status === 'checking') {
    return <LoadingScreen />;
  }

  // Sin sesión -> login
  if (status === 'no-session') {
    console.log('ProtectedRoute: Redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Verificar onboarding - usar datos del store que ya fueron actualizados
  const currentUser = useAuthStore.getState().user;
  const trainingTypes = currentUser?.training_types || [];
  const needsOnboarding = !Array.isArray(trainingTypes) || trainingTypes.length === 0;
  
  console.log('ProtectedRoute: Ready - needsOnboarding:', needsOnboarding, 'path:', location.pathname);
  
  if (needsOnboarding && location.pathname !== '/onboarding') {
    console.log('ProtectedRoute: Redirecting to onboarding');
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
