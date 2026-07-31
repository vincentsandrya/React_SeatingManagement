// src/services/activityLogService.ts

import { supabase } from '../lib/supabase';
import type { ActivityLog } from '../types/database.types';

export const activityLogService = {
  /**
   * Mengambil riwayat aktivitas (Activity Logs) saat halaman dimuat
   * @param limit Jumlah log yang ingin diambil (default 5)
   */
  getActivityLogs: async (limit: number = 5) => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false }) // Urutkan dari yang terbaru
        .limit(limit);

      if (error) throw error;
      return data as ActivityLog[];
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      throw error;
    }
  },

  /**
   * Membuka koneksi Realtime (WebSocket) untuk memantau data baru di activity_logs
   * @param callback Fungsi yang dijalankan ketika ada data (INSERT) baru
   * @returns Subscription Channel (wajib di-unsubscribe di useEffect cleanup)
   */
  subscribeToActivities: (callback: (payload: any) => void) => {
    const channel = supabase
      .channel('public:activity_logs') // Nama channel unik
      .on(
        'postgres_changes',
        {
          event: 'INSERT',             // Hanya pantau penambahan data baru
          schema: 'public',
          table: 'activity_logs',
        },
        (payload) => {
          // Ketika ada row baru masuk, jalankan callback
          callback(payload.new);
        }
      )
      .subscribe();

    return channel;
  }
};