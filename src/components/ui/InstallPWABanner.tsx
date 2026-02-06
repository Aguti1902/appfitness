import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWABanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada como PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Verificar si es iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Verificar si es móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Verificar si ya se descartó el banner
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const daysSinceDismissed = dismissedDate 
      ? (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24) 
      : Infinity;

    // Mostrar banner si: es móvil, no está instalada, no se descartó hace menos de 7 días
    if (isMobile && !standalone && daysSinceDismissed > 7) {
      // Para Android/Chrome - escuchar evento beforeinstallprompt
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowBanner(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      // Para iOS - mostrar después de 3 segundos
      if (ios) {
        const timer = setTimeout(() => setShowBanner(true), 3000);
        return () => {
          clearTimeout(timer);
          window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
      }

      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', new Date().toISOString());
  };

  // No mostrar si ya está instalada o no debe mostrarse
  if (isStandalone || !showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:hidden animate-slide-up">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-2xl p-4 text-white">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">💪</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg">Instala FitApp</h3>
            <p className="text-sm text-white/90 line-clamp-2">
              {isIOS 
                ? 'Añade la app a tu pantalla de inicio para acceso rápido'
                : 'Instala la app para una mejor experiencia'}
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="mt-3 bg-white/10 rounded-xl p-3">
            <p className="text-sm flex items-center gap-2">
              <Share className="w-4 h-4" />
              Pulsa <span className="font-semibold">Compartir</span> y luego <span className="font-semibold">"Añadir a pantalla de inicio"</span>
            </p>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="mt-3 w-full bg-white text-primary-700 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <Download className="w-5 h-5" />
            Instalar ahora
          </button>
        )}
      </div>
    </div>
  );
}
