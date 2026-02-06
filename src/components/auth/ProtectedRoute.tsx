import { useEffect, useState, memo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Sidebar } from '../ui/Sidebar';

// Loading inline - más rápido que componente separado
const QuickLoader = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
  </div>
));
QuickLoader.displayName = 'QuickLoader';

export function ProtectedRoute() {
  const { isAuthenticated, user, setUser } = useAuthStore();
  const [status, setStatus] = useState<'checking' | 'ready' | 'no-session'>('checking');
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      // Si ya hay usuario en store con datos válidos, confiar rápidamente
      if (isAuthenticated && user?.id && user.training_types?.length > 0) {
        setStatus('ready');
        return;
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          // Solo fetch de perfil si no tenemos datos completos
          if (!user?.training_types || user.training_types.length === 0) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, name, avatar_url, goals, training_types')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (!mounted) return;

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
          }
          
          setStatus('ready');
        } else {
          setStatus('no-session');
        }
      } catch {
        // En error, confiar en store si existe
        if (isAuthenticated && user) {
          setStatus('ready');
        } else {
          setStatus('no-session');
        }
      }
    };

    checkSession();
    
    // Timeout reducido a 4 segundos
    const timeout = setTimeout(() => {
      if (mounted && status === 'checking') {
        setStatus(isAuthenticated && user ? 'ready' : 'no-session');
      }
    }, 4000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  if (status === 'checking') {
    return <QuickLoader />;
  }

  if (status === 'no-session') {
    return <Navigate to="/login" replace />;
  }

  // Verificar onboarding
  const currentUser = useAuthStore.getState().user;
  const needsOnboarding = !currentUser?.training_types?.length;
  
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
