import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { guestService } from "../../services/guestService";
import type { GuestDWithRelation, GuestView } from "../../types/database.types";

interface EditGuestModalProps {
  guest: GuestView;
  onClose: () => void;
  onSuccess: (updatedData: Partial<GuestDWithRelation>) => void;
}

export default function EditGuestModal({
  guest,
  onClose,
  onSuccess,
}: EditGuestModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // STATE BARU: Membaca status tidak hadir dari database (jika kolomnya sudah ada)
  // Abaikan error TS sejenak jika Anda belum update database.types.ts
  const [isAbsent, setIsAbsent] = useState((guest as any).is_absent || false);

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaving(true);

    try {
      const formData = new FormData(e.currentTarget);

      let tableVal = (formData.get("table_number") as string)
        .trim()
        .toUpperCase();
      let seatVal = (formData.get("seat_number") as string)
        .trim()
        .toUpperCase();

      const updates = {
        title: formData.get("title") as string,
        name: formData.get("name") as string,
        // Jika isAbsent dicentang, otomatis paksa kosongkan Table & Seat
        table_number: tableVal,
        seat_number: seatVal,
        is_vegetarian: formData.get("is_vegetarian") === "true",
        // Masukkan payload flag baru
        is_absent: isAbsent,
      };

      // --- 1. VALIDASI KETERSEDIAAN KURSI ---
      if (updates.table_number && updates.seat_number) {
        const isSeatAvailable = await guestService.checkSeatAvailability(
          updates.table_number,
          updates.seat_number,
          guest.guest_d_id,
        );

        if (!isSeatAvailable) {
          setErrorMsg(
            `Table ${updates.table_number} - Seat ${updates.seat_number} sudah ditempati oleh tamu lain.`,
          );
          setIsSaving(false);
          return;
        }
      }

      // --- 2. SIMPAN DATA ---
      await guestService.updateGuestDetails(guest.guest_d_id, updates);
      onSuccess(updates);
    } catch (error) {
      console.error("Gagal memperbarui data:", error);
      setErrorMsg("Terjadi kesalahan pada server saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 shrink-0">
          <div className="text-xs font-bold text-slate-900">
            Edit Guest Details
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 p-3 border-b border-red-100 flex items-start gap-2 text-red-700 shrink-0">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span className="text-xs font-semibold leading-relaxed">
              {errorMsg}
            </span>
          </div>
        )}

        <form
          onSubmit={handleSaveEdit}
          className="flex flex-col overflow-hidden"
        >
          <div className="p-5 space-y-5 overflow-y-auto">
            <div className="flex gap-3">
              <div className="w-1/3">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={guest.title || ""}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs outline-none focus:border-slate-900 disabled:opacity-50 disabled:bg-slate-50"
                />
              </div>
              <div className="w-2/3">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={guest.name}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs outline-none focus:border-slate-900 disabled:opacity-50 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="flex gap-3 relative">
              <div className="w-1/2">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Table
                </label>
                <input
                  type="text"
                  name="table_number"
                  defaultValue={guest.table_number || ""}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs outline-none focus:border-slate-900 font-mono disabled:text-transparent"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Seat
                </label>
                <input
                  type="text"
                  name="seat_number"
                  defaultValue={guest.seat_number || ""}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs outline-none focus:border-slate-900 font-mono disabled:text-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Dietary Preference
              </label>
              <select
                name="is_vegetarian"
                defaultValue={guest.is_vegetarian ? "true" : "false"}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs outline-none focus:border-slate-900 bg-white disabled:opacity-50 disabled:bg-slate-50"
              >
                <option value="false">Normal (Non-Vegetarian)</option>
                <option value="true">Vegetarian</option>
              </select>
            </div>

            {/* TOGGLE: KONFIRMASI TIDAK HADIR */}
            <label
              className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                isAbsent
                  ? "bg-red-50 border-red-200"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  checked={isAbsent}
                  onChange={(e) => setIsAbsent(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300 cursor-pointer"
                />
              </div>
              <span
                className={`align-middle ml-1 text-xs font-semibold ${isAbsent ? "text-red-700" : "text-slate-800"}`}
              >
                Konfirmasi Batal Hadir (Absence)
              </span>
            </label>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-5 py-2 text-white rounded text-xs font-semibold flex items-center justify-center disabled:opacity-50 transition-colors ${
                isAbsent
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-black hover:bg-slate-800"
              }`}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
