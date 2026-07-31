import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { GuestD, GuestH } from "../types/database.types";
import {
  Download,
  Printer,
  MoreVertical,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

// Tipe data khusus untuk hasil Join antara GuestD dan GuestH
type ReportGuest = GuestD & {
  guest_h: Pick<GuestH, "category" | "title" | "name"> | null;
};

export const ReportPage: React.FC = () => {
  const [guests, setGuests] = useState<ReportGuest[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk Stat Cards
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    vipTotal: 0,
    vipCheckedIn: 0,
    pending: 0,
  });

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch relasi GuestD dan GuestH
      const { data, error } = await supabase
        .from("guest_d")
        .select(
          `
          *,
          guest_h (      
            category,
            title,
            name
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const guestList = data as unknown as ReportGuest[];
      setGuests(guestList);

      // Kalkulasi Statistik di sisi klien (Asumsi data < 10.000 row untuk free tier)
      const total = guestList.length;
      const checkedIn = guestList.filter(
        (g) => g.checked_in_at !== null,
      ).length;

      const vipGuests = guestList.filter(
        (g) => g.guest_h?.category?.toUpperCase() === "VIP",
      );
      const vipTotal = vipGuests.length;
      const vipCheckedIn = vipGuests.filter(
        (g) => g.checked_in_at !== null,
      ).length;

      setStats({
        total,
        checkedIn,
        vipTotal,
        vipCheckedIn,
        pending: total - checkedIn,
      });
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Helper Format Waktu Check-In (HH:MM:SS)
  const formatTime = (dateString: string | null) => {
    if (!dateString) return "--:--:--";
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  // Helper Warna Badge Kategori
  const getCategoryBadgeColor = (category: string | undefined) => {
    const cat = (category || "").toUpperCase();
    if (cat === "VIP") return "bg-emerald-100 text-emerald-700";
    if (cat === "PRESS") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700"; // General
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Attendance Overview
          </p>
          <p className="text-sm text-slate-500">
            Live guest tracking and status reporting.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-700 hover:bg-slate-50 transition">
            <Filter className="w-4 h-4 text-slate-400" />
            All Statuses
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-700 hover:bg-slate-50 transition">
            All Categories
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 rounded-lg text-xs font-mono font-semibold text-blue-600 hover:bg-blue-50 transition shrink-0">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-black border border-black rounded-lg text-xs font-mono font-semibold text-white hover:bg-slate-800 transition shrink-0">
            <Printer className="w-4 h-4" />
            Print List
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <p className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Total Invited
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {loading ? "-" : stats.total.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm border-l-4 border-l-blue-600 relative overflow-hidden">
          <p className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Checked In
          </p>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold text-slate-900">
              {loading ? "-" : stats.checkedIn.toLocaleString()}
            </p>
          </div>
          <p className="text-[10px] font-mono font-bold text-emerald-500 mt-2">
            +12 in last 5m
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm border-l-4 border-l-emerald-400">
          <p className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-3">
            VIP Checked In
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-slate-900">
              {loading ? "-" : stats.vipCheckedIn.toLocaleString()}
            </p>
            <span className="text-sm font-medium text-slate-400">
              / {loading ? "-" : stats.vipTotal}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <p className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Pending
          </p>
          <p className="text-3xl font-bold text-slate-500">
            {loading ? "-" : stats.pending.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Guest Name
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Company/Affiliation
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Category
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Seat Assignment
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Check-In Time
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                      Memuat data laporan...
                    </div>
                  </td>
                </tr>
              ) : guests.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    Tidak ada data tamu ditemukan.
                  </td>
                </tr>
              ) : (
                guests.map((guest) => {
                  const isCheckedIn = guest.checked_in_at !== null;
                  const category = guest.guest_h?.category || "General";
                  const company =
                    guest.guest_h?.name || guest.guest_h?.title || "-";

                  return (
                    <tr
                      key={guest.guest_d_id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">
                        {guest.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {company}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-[10px] font-mono font-bold rounded ${getCategoryBadgeColor(category)}`}
                        >
                          {category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600 whitespace-nowrap">
                        Table {guest.table_number}, {guest.seat_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isCheckedIn ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Checked In
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400">
                            <Clock className="w-4 h-4" />
                            Pending
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600 whitespace-nowrap">
                        {formatTime(guest.checked_in_at)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 font-medium">
            Showing 1 to {stats.total > 0 ? guests.length : 0} of {stats.total}{" "}
            entries
          </p>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition border border-transparent hover:border-slate-200">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-600 font-medium px-2">
              Page 1 of 1
            </span>
            <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition border border-transparent hover:border-slate-200">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
