import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Aviso de conectividad"
      className="fixed bottom-20 lg:bottom-5 left-4 right-4 sm:right-auto z-50 flex items-center gap-2.5 rounded-2xl bg-[#FF6B00] px-4 py-3 text-sm sm:text-base font-bold text-white shadow-xl"
    >
      <WifiOff className="w-5 h-5 shrink-0" />
      <span>Modo sin conexión — Mostrando datos en caché</span>
    </aside>
  );
};
