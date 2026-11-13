import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * Exibe um aviso discreto quando o aluno estiver sem conexão à internet,
 * indicando que a versão em cache do PWA está ativa.
 */
export function OfflineIndicator() {
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
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-18 left-4 z-40 inline-flex items-center gap-2 rounded-md border border-amber-400/40 bg-[#12161B]/95 px-3 py-2 text-xs font-medium text-amber-200 shadow-lg backdrop-blur-sm sm:bottom-6 sm:left-6"
    >
      <WifiOff className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
      <span>Modo offline · cache ativo</span>
    </div>
  );
}
