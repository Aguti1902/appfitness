import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { LoadingScreen } from '../ui/LoadingSpinner';
import { Sidebar } from '../ui/Sidebar';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, setUser } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Si el store ya dice que está autenticado, confiar en él
      if (isAuthenticated && !isLoading) {
        setHasSession(true);
        setChecking(false);
        return;
      }

      // Si no, verificar directamente con Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Hay sesión válida, actualizar el store
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: profile?.name || session.user.user_metadata?.name || session.user.email!.split('@')[0],
            avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
            goals: profile?.goals || { primary: 'maintain', activity_level: 'moderate' },
            training_types: profile?.training_types || [],
            profile_data: profile?.profile_data,
            created_at: session.user.created_at
          });
          setHasSession(true);
        } else {
          setHasSession(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setHasSession(false);
      }
      
      setChecking(false);
    };

    checkAuth();
  }, [isAuthenticated, isLoading, setUser]);

  if (isLoading || checking) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated && !hasSession) {
    return <Navigate to="/login" replace />;
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
