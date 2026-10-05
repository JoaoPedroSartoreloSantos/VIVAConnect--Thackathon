import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
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

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2.5 rounded-2xl mb-3 flex items-center justify-between gap-2 text-xs font-semibold shadow-md">
      <div className="flex items-center gap-2">
        <WifiOff className="w-5 h-5 shrink-0 animate-pulse" />
        <span>Modo sem internet: Seus registros de saúde e telefones de emergência continuam salvos e funcionando neste aparelho.</span>
      </div>
    </div>
  );
};
