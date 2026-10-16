import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';
import { useSomiti } from '../context/SomitiContext';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { language } = useSomiti();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 text-white px-3.5 py-2 text-xs font-semibold shadow-lg backdrop-blur-xs border border-amber-500/80 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse text-amber-200" />
      <span>
        {language === 'bn'
          ? 'অফলাইন মোড — ক্যাশকৃত ডাটা লোড হয়েছে'
          : 'Offline Mode — Cached data is in use'}
      </span>
    </div>
  );
};
