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
      console.log('ProtectedRoute: isAuthenticated =', isAuthenticated, 'user =', user?.email);
      
      // Si ya hay usuario autenticado en el store, confiar en él
      if (isAuthenticated && user) {
        console.log('ProtectedRoute: User already in store');
        setStatus('ready');
        return;
      }
      
      // Si no hay usuario en store, verificar con Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          console.log('ProtectedRoute: Found session, loading profile');
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (!mounted) return;

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
          console.log('ProtectedRoute: No session');
          setStatus('no-session');
        }
      } catch (error) {
        console.error('ProtectedRoute error:', error);
        if (mounted) setStatus('no-session');
      }
    };

    check();
    
    // Timeout de seguridad
    const timeout = setTimeout(() => {
      if (mounted && status === 'checking') {
        console.log('ProtectedRoute: Timeout');
        setStatus(isAuthenticated ? 'ready' : 'no-session');
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [isAuthenticated, user, setUser]);

  // Loading
  if (status === 'checking') {
    return <LoadingScreen />;
  }

  // Sin sesión -> login
  if (status === 'no-session') {
    return <Navigate to="/login" replace />;
  }

  // Verificar onboarding
  const trainingTypes = user?.training_types || [];
  const needsOnboarding = !Array.isArray(trainingTypes) || trainingTypes.length === 0;
  
  if (needsOnboarding && location.pathname !== '/onboarding') {
    console.log('ProtectedRoute: Needs onboarding, redirecting');
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
