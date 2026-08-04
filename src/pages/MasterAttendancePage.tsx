import React, { useState, useEffect } from "react";
import {
  QrCode,
  Download,
  Printer,
  Edit3,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Loader2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// Import Services & Helpers
import { guestService } from "../services/guestService";
import { formatTime } from "../utils/helpers";
import type { GuestDWithRelation } from "../types/database.types";

export default function MasterAttendancePage() {
  // --- STATES ---
  const [guests, setGuests] = useState<GuestDWithRelation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalGuests, setTotalGuests] = useState(0);
  const pageSize = 10;

  // Modals - Individual
  const [selectedGuestQR, setSelectedGuestQR] =
    useState<GuestDWithRelation | null>(null);
  const [editingGuest, setEditingGuest] = useState<GuestDWithRelation | null>(
    null,
  );

  // Modals - Bulk QR (Menggunakan Guest_H)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkTickets, setBulkTickets] = useState<any[]>([]);
  const [isLoadingBulk, setIsLoadingBulk] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
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
        setGuests(data as unknown as GuestDWithRelation[]);
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
  const handlePrint = () => window.print();
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  // Handler Buka Bulk QR
  const handleOpenBulkQR = async () => {
    setIsBulkModalOpen(true);
    setIsLoadingBulk(true);
    try {
      // Mengambil seluruh data dari tabel guest_h
      const data = await guestService.getGuestH();
      setBulkTickets(data);
    } catch (error) {
      console.error("Gagal memuat tiket:", error);
      alert("Terjadi kesalahan saat memuat data tiket.");
    } finally {
      setIsLoadingBulk(false);
    }
  };

  // Handler Export CSV
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const { data } = await guestService.getGuests(debouncedSearch, 1, 5000);

      if (!data || data.length === 0) {
        alert("Tidak ada data untuk diexport.");
        return;
      }

      const headers = [
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
        `"${guest.title || ""}"`,
        `"${guest.name || ""}"`,
        `"${guest.guest_h?.category || ""}"`,
        `"${guest.table_number || ""}"`,
        `"${guest.seat_number || ""}"`,
        `"${guest.is_vegetarian ? "Vegetarian" : "Normal"}"`,
        `"${guest.checked_in_at ? "Checked In" : "Pending"}"`,
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
      console.error("Gagal mengexport CSV:", error);
      alert("Terjadi kesalahan saat mengexport data.");
    } finally {
      setIsExporting(false);
    }
  };

  // Handler Edit
  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingGuest) return;

    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const updates = {
        title: formData.get("title") as string,
        name: formData.get("name") as string,
        table_number: formData.get("table_number") as string,
        seat_number: formData.get("seat_number") as string,
        is_vegetarian: formData.get("is_vegetarian") === "true",
      };

      await guestService.updateGuestDetails(editingGuest.guest_d_id, updates);

      setGuests((prevGuests) =>
        prevGuests.map((g) =>
          g.guest_d_id === editingGuest.guest_d_id ? { ...g, ...updates } : g,
        ),
      );
      setEditingGuest(null);
    } catch (error) {
      console.error("Gagal memperbarui data:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
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
            onClick={handleOpenBulkQR}
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
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                  Seat
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
                      {guest.title} {guest.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium">
                        {guest.guest_h?.category || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-700">
                      {guest.table_number || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-700">
                      {guest.seat_number || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {guest.checked_in_at ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2
                            size={14}
                            className="text-emerald-500"
                          />
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
          <div className="flex items-center gap-3">
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
      </div>

      {/* --- MODAL: EDIT GUEST (Dipersingkat untuk referensi, isinya sama) --- */}
      {editingGuest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 shrink-0">
              <div className="text-xs font-bold text-slate-900">
                Edit Guest Details
              </div>
              <button
                onClick={() => setEditingGuest(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSaveEdit}
              className="flex flex-col overflow-hidden"
            >
              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="flex gap-3">
                  <div className="w-1/3">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editingGuest.title || ""}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs outline-none focus:border-slate-900"
                    />
                  </div>
                  <div className="w-2/3">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingGuest.name}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-1/2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Table
                    </label>
                    <input
                      type="text"
                      name="table_number"
                      defaultValue={editingGuest.table_number || ""}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs outline-none focus:border-slate-900"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Seat
                    </label>
                    <input
                      type="text"
                      name="seat_number"
                      defaultValue={editingGuest.seat_number || ""}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Dietary Preference
                  </label>
                  <select
                    name="is_vegetarian"
                    defaultValue={editingGuest.is_vegetarian ? "true" : "false"}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs outline-none focus:border-slate-900 bg-white"
                  >
                    <option value="false">Normal (Non-Vegetarian)</option>
                    <option value="true">Vegetarian</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingGuest(null)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-black text-white rounded text-xs font-semibold flex items-center justify-center hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: INDIVIDUAL QR GENERATE --- */}
      {selectedGuestQR && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-900">
                Guest QR Code
              </div>
              <button
                onClick={() => setSelectedGuestQR(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center justify-center bg-slate-50">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 mb-3">
                <QRCodeSVG
                  value={selectedGuestQR.guest_h?.ticket_code || "NO-TICKET"}
                  size={160}
                  level="H"
                />
              </div>
              <div className="text-sm font-bold text-slate-900">
                {selectedGuestQR.title} {selectedGuestQR.name}
              </div>
              <div className="text-xs font-mono text-slate-500 mt-1">
                {selectedGuestQR.guest_h?.ticket_code || "NO-TICKET"}
              </div>
            </div>
            <div className="p-4 bg-white border-t border-slate-100">
              <button
                onClick={handlePrint}
                className="w-full bg-black text-white py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-800"
              >
                <Printer size={14} /> Print Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: BULK GENERATE QR (DARI GUEST_H) --- */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 shrink-0">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Bulk Generate QR Tickets
                </div>
                <div className="text-[10px] text-slate-500">
                  Generating {bulkTickets.length} unique tickets from Guest
                  Master Data.
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 bg-slate-50 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 overflow-y-auto print-grid">
              {isLoadingBulk ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                  <span className="text-xs font-semibold">
                    Fetching all tickets...
                  </span>
                </div>
              ) : bulkTickets.length === 0 ? (
                <div className="col-span-full text-center py-8 text-xs text-slate-500">
                  No tickets found in the database.
                </div>
              ) : (
                bulkTickets.map((ticket) => (
                  <div
                    key={ticket.guest_h_id}
                    className="bg-white p-3 rounded border border-slate-200 flex flex-col items-center text-center shadow-sm"
                  >
                    {/* Menggunakan ticket_code atau fallback ke ticket_no jika penamaan kolom Anda berbeda */}
                    <QRCodeSVG
                      value={
                        ticket.ticket_code || ticket.ticket_no || "NO-TICKET"
                      }
                      size={80}
                      className="mb-2"
                    />
                    <div className="text-[11px] font-bold text-slate-900 line-clamp-1">
                      {ticket.category || "Guest"}
                    </div>
                    <div className="text-[9px] font-mono text-slate-500">
                      {ticket.ticket_code || ticket.ticket_no}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                disabled={isLoadingBulk || bulkTickets.length === 0}
                className="px-5 py-2 bg-black text-white rounded text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 disabled:opacity-50"
              >
                <Printer size={14} /> Print All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
