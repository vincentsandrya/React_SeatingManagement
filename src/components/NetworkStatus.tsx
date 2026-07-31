import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wifi, WifiOff } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Memantau status koneksi internet browser
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Memantau status koneksi Supabase Realtime Channel
    const channel = supabase.channel('system-status');
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsOnline(true);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setIsOnline(false);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
      isOnline 
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
        : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
    }`}>
      {isOnline ? (
        <>
          <Wifi size={12} className="text-emerald-500" />
          <span>Connected</span>
        </>
      ) : (
        <>
          <WifiOff size={12} className="text-red-500" />
          <span>Offline / Reconnecting</span>
        </>
      )}
    </div>
  );
}