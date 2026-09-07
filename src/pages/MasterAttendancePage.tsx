import { useState, useEffect } from "react";
import {
  QrCode,
  Download,
  Edit3,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  XCircle,
} from "lucide-react";

// Import Services, Helpers & Types
import { guestService } from "../services/guestService";
import { formatTime } from "../utils/helpers";
import type { GuestView } from "../types/database.types";

// Import Components
import EditGuestModal from "../components/MasterAttendance/EditGuestModel";
import IndividualQRModal from "../components/MasterAttendance/IndividualQRModal";
import BulkQRModal from "../components/MasterAttendance/BulkQRModal";

export default function MasterAttendancePage() {
  // --- STATES ---
  const [guests, setGuests] = useState<GuestView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalGuests, setTotalGuests] = useState(0);
  const pageSize = 10;

  // Modals Visibility & Data
  const [selectedGuestQR, setSelectedGuestQR] = useState<GuestView | null>(
    null,
  );
  const [editingGuest, setEditingGuest] = useState<GuestView | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // --- EFFECTS ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const loadGuests = async () => {
      setIsLoading(true);
      try {
        const { data, count } = await guestService.getGuests(
          debouncedSearch,
          currentPage,
          pageSize,
        );
        setGuests(data as unknown as GuestView[]);
        setTotalGuests(count || 0);
      } catch (error) {
        console.error("Gagal mengambil data tamu:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadGuests();
  }, [currentPage, debouncedSearch]);

  // --- HANDLERS ---
  const totalPages = Math.ceil(totalGuests / pageSize);
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const { data } = await guestService.getGuests(debouncedSearch, 1, 5000);
      if (!data || data.length === 0)
        return alert("Tidak ada data untuk diexport.");

      const headers = [
        "Invitation",
        "Title",
        "Name",
        "Category",
        "Table",
        "Seat",
        "Dietary",
        "Status",
        "Check-in Time",
      ];
      const rows = data.map((guest: any) => [
        `"${guest.h_name || ""}"`,
        `"${guest.title || ""}"`,
        `"${guest.name || ""}"`,
        `"${guest.category || ""}"`,
        `"${guest.table_number || ""}"`,
        `"${guest.seat_number || ""}"`,
        `"${guest.is_vegetarian ? "Vegetarian" : "Normal"}"`,
        `"${guest.is_absent ? "Absent" : guest.checked_in_at ? "Checked In" : "Pending"}"`,
        `"${guest.checked_in_at ? formatTime(guest.checked_in_at) : "-"}"`,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: string[]) => row.join(",")),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `Attendance_Report_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Terjadi kesalahan saat mengexport data.");
      console.log(error);
    } finally {
      setIsExporting(false);
    }
  };

  // Callback dari Edit Modal saat disave
  const onEditSuccess = (updatedData: Partial<GuestView>) => {
    setGuests((prevGuests) =>
      prevGuests.map((g) =>
        g.guest_d_id === editingGuest?.guest_d_id
          ? { ...g, ...updatedData }
          : g,
      ),
    );
    setEditingGuest(null); // Tutup modal
  };

  return (
    <div className="max-w-[1400px] mx-auto text-slate-800">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <div className="text-xl font-bold mb-0.5 text-slate-900">
            Attendance Overview
          </div>
          <div className="text-xs text-slate-500">
            Live guest tracking and management.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name..."
              className="pl-8 pr-3 py-2 border border-slate-300 rounded-md text-xs outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-shadow w-56"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 bg-black text-white px-3 py-2 rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <QrCode size={14} /> Bulk QR
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-md text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download size={14} /> {isExporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[460px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-center">
                <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                  Invitation
                </th>
                <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                  Family/Partner
                </th>
                <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-[10px] w-[100px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                  Table/Seat
                </th>
                <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500 text-xs"
                  >
                    Loading data...
                  </td>
                </tr>
              ) : guests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500 text-xs"
                  >
                    No guests found.
                  </td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr
                    key={guest.guest_d_id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-semibold text-slate-900">
                      {guest.h_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-900">
                      {guest.title} {guest.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium">
                        {guest.category || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-700">
                      {guest.table_number || "-"}
                      {"/"}
                      {guest.seat_number || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {guest.is_absent ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-700">
                          <XCircle size={14} className="text-red-500" />
                          Tidak Hadir
                        </div>
                      ) : guest.checked_in_at ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2
                            size={14}
                            className="text-emerald-500"
                          />{" "}
                          {formatTime(guest.checked_in_at)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                          <Clock size={14} /> Pending
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setEditingGuest(guest)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => setSelectedGuestQR(guest)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <QrCode size={12} /> QR
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 mt-auto">
          <div>
            Showing {totalGuests === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, totalGuests)} of {totalGuests}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || isLoading}
              className="p-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-600">
              Pg {totalPages === 0 ? 0 : currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* RENDER MODALS MENGGUNAKAN KOMPONEN YANG TELAH DIPISAH */}
      {editingGuest && (
        <EditGuestModal
          guest={editingGuest}
          onClose={() => setEditingGuest(null)}
          onSuccess={onEditSuccess}
        />
      )}

      {selectedGuestQR && (
        <IndividualQRModal
          guest={selectedGuestQR}
          onClose={() => setSelectedGuestQR(null)}
        />
      )}

      {isBulkModalOpen && (
        <BulkQRModal onClose={() => setIsBulkModalOpen(false)} />
      )}
    </div>
  );
}
