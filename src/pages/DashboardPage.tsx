import { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, ShieldUser, Activity } from 'lucide-react';

// Import Services & Helpers
import { guestService } from '../services/guestService';
import { activityLogService } from '../services/activityLogService';
import { timeAgo, formatTime } from '../utils/helpers';
import type { ActivityLog } from '../types/database.types';

export default function DashboardPage() {
  // --- STATES ---
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, pending: 0 });
  const [recentGuests, setRecentGuests] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- EFFECTS ---
  useEffect(() => {
    // 1. Fetch semua data awal secara paralel agar loading lebih cepat
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [statsData, recentGuestsData, logsData] = await Promise.all([
          guestService.getGuestStats(),
          guestService.getRecentCheckIns(7), // Ambil 7 tamu terakhir
          activityLogService.getActivityLogs(10) // Ambil 10 log terakhir
        ]);

        setStats(statsData);
        setRecentGuests(recentGuestsData || []);
        setActivityLogs(logsData);
      } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // 2. Aktifkan koneksi Realtime (WebSocket) untuk Activity Logs
    const subscription = activityLogService.subscribeToActivities((newLog) => {
      // Saat ada log baru masuk dari database (via trigger), langsung taruh di urutan paling atas
      setActivityLogs((prevLogs) => {
        const updatedLogs = [newLog, ...prevLogs];
        return updatedLogs.slice(0, 20); // Batasi maksimal 20 log di layar agar memori tidak penuh
      });
      
      // Opsional: Karena ada yang check-in, update angka stats (Background update)
      guestService.getGuestStats().then(setStats);
      guestService.getRecentCheckIns(7).then(setRecentGuests);
    });

    // Cleanup function: Matikan langganan realtime saat pindah halaman
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-slate-500">
        <Activity className="animate-spin mr-2" size={24} /> Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto text-slate-800">
      <div className="mb-8">
        <span className="text-3xl font-bold mb-1 text-slate-900">Event Dashboard</span>
        <p className="text-sm text-slate-500">Real-time overview of your event attendance.</p>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-100 rounded-md text-slate-600"><Users size={24} /></div>
          <div>
            <p className="text-xs font-mono text-slate-500 font-semibold uppercase">Total Invited</p>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-md"><UserCheck size={24} /></div>
          <div>
            <p className="text-xs font-mono text-slate-500 font-semibold uppercase">Checked In</p>
            <div className="text-2xl font-bold text-slate-900">{stats.checkedIn}</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-md"><ShieldUser size={24} /></div>
          <div>
            <p className="text-xs font-mono text-slate-500 font-semibold uppercase">VIP Arrived</p>
            <div className="text-2xl font-bold text-slate-900">-</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-md"><Clock size={24} /></div>
          <div>
            <p className="text-xs font-mono text-slate-500 font-semibold uppercase">Pending</p>
            <div className="text-2xl font-bold text-slate-900">{stats.pending}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- KIRI: RECENT ARRIVALS (Lebar 2/3) --- */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-slate-900">Recent Arrivals</h3>
          </div>
          <div className="overflow-x-auto flex-1 p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-xs font-mono font-semibold text-slate-500 uppercase">Guest</th>
                  <th className="px-4 py-3 text-xs font-mono font-semibold text-slate-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-xs font-mono font-semibold text-slate-500 uppercase">Table/Seat</th>
                  <th className="px-4 py-3 text-xs font-mono font-semibold text-slate-500 uppercase text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentGuests.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">No guests have arrived yet.</td></tr>
                ) : (
                  recentGuests.map((guest) => (
                    <tr key={guest.guest_d_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{guest.title} {guest.name}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span className="bg-slate-100 px-2 py-1 rounded-md text-xs font-medium">
                          {guest.guest_h?.category || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-600">
                        {guest.table_number || '-'} / {guest.seat_number || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-emerald-600 text-right font-medium">
                        {formatTime(guest.checked_in_at)} {/* Helper fungsi jam */}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- KANAN: LIVE ACTIVITY LOGS (Lebar 1/3) --- */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-[500px]">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h3 className="font-semibold text-slate-900">Live Activity Feed</h3>
          </div>
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {activityLogs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center mt-4">Waiting for activities...</p>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="flex gap-3 text-left items-start animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-400 shrink-0"></div>
                  <div>
                    <p className="text-sm text-slate-700 leading-tight">
                      <span className="font-semibold">{log.created_by}</span> {log.message}
                    </p>
                    {/* Helper timeAgo untuk merubah waktu menjadi "5 minutes ago" */}
                    <p className="text-[11px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
                      {timeAgo(log.created_at)} 
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}