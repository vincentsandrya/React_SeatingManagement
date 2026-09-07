import React, { useState, useEffect } from "react";
import { X, Users, Save, Loader2, AlertCircle } from "lucide-react";
import { guestService } from "../../services/guestService";

// Import Child Components
import RegisteredGuestsList from "../CheckIn/RegisteredGuestList";
import ExtraGuestsTable from "../CheckIn/ExtraGuestsTable";
import type { ExtraGuest } from "../../types/CheckIn";

interface CheckInConfirmationModalProps {
  scannedTicket: {
    guest_h_id: string;
    ticket_code: string;
    category: string;
  };
  initialGuests: any[]; // Data tamu dari tabel guest_d
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function CheckInConfirmationModal({
  scannedTicket,
  initialGuests,
  onClose,
  onSuccess,
}: CheckInConfirmationModalProps) {
  // States
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [extraGuests, setExtraGuests] = useState<ExtraGuest[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set default checkbox: centang semua tamu yang BELUM check-in
  useEffect(() => {
    if (initialGuests && initialGuests.length > 0) {
      const pendingIds = initialGuests
        .filter((g) => !g.checked_in_at)
        .filter((g) => !g.is_absent)
        .map((g) => g.guest_d_id);
      setSelectedGuestIds(pendingIds);
    }
  }, [initialGuests]);

  // --- HANDLERS UNTUK CHILD COMPONENTS ---
  const handleToggleSelection = (guestId: string) => {
    setSelectedGuestIds((prev) =>
      prev.includes(guestId)
        ? prev.filter((id) => id !== guestId)
        : [...prev, guestId],
    );
  };

  const handleAddExtraRow = () => {
    setExtraGuests((prev) => [
      ...prev,
      { title: "", name: "", table_number: "", seat_number: "" },
    ]);
  };

  const handleExtraGuestChange = (
    index: number,
    field: keyof ExtraGuest,
    value: string,
  ) => {
    const newGuests = [...extraGuests];
    // AUTO-UPPERCASE: Langsung jadikan huruf kapital saat diketik jika itu kolom table atau seat
    if (field === "table_number" || field === "seat_number") {
      newGuests[index][field] = value.toUpperCase();
    } else {
      newGuests[index][field] = value;
    }
    setExtraGuests(newGuests);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === extraGuests.length - 1) handleAddExtraRow();
    }
  };

  // --- LOGIKA SUBMIT & VALIDASI SEAT ---
  const handleConfirm = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Ambil data tamu bawaan
      const guestsToUpdate = initialGuests.filter((g) =>
        selectedGuestIds.includes(g.guest_d_id),
      );

      // 2. Ambil baris extra guest yang "aktif" (sedikitnya 1 kolom sudah diketik oleh staf)
      const activeExtraGuests = extraGuests.filter(
        (g) =>
          g.title.trim() !== "" ||
          g.name.trim() !== "" ||
          g.table_number.trim() !== "" ||
          g.seat_number.trim() !== "",
      );

      // 3. VALIDASI WAJIB ISI: Pastikan Name, Table, dan Seat terisi di semua baris yang aktif
      const isIncomplete = activeExtraGuests.some(
        (g) =>
          g.name.trim() === "" ||
          g.table_number.trim() === "" ||
          g.seat_number.trim() === "",
      );

      if (isIncomplete) {
        setErrorMsg(
          "Nama, Table, dan Seat wajib diisi untuk semua tambahan tamu.",
        );
        setIsProcessing(false);
        return; // Hentikan proses
      }

      // 2. Format tamu tambahan (pastikan table & seat rapi tanpa spasi berlebih)
      const guestsToInsert = extraGuests
        .filter((g) => g.name.trim() !== "")
        .map((g) => ({
          ...g,
          table_number: g.table_number.trim().toUpperCase(),
          seat_number: g.seat_number.trim().toUpperCase(),
        }));

      if (guestsToUpdate.length === 0 && guestsToInsert.length === 0) {
        setErrorMsg("Pilih minimal 1 tamu atau tambahkan tamu baru.");
        setIsProcessing(false);
        return;
      }

      // --- VALIDASI KURSI UNTUK TAMU TAMBAHAN ---
      const checkedSeats = new Set<string>();

      for (const guest of guestsToInsert) {
        if (guest.table_number && guest.seat_number) {
          const seatKey = `${guest.table_number}-${guest.seat_number}`;

          // Validasi A: Cek apakah staf mengetik kursi yang sama lebih dari 1 kali di dalam form
          if (checkedSeats.has(seatKey)) {
            setErrorMsg(
              `Duplikasi Input: Table ${guest.table_number} - Seat ${guest.seat_number} diketik lebih dari satu kali.`,
            );
            setIsProcessing(false);
            return;
          }
          checkedSeats.add(seatKey);

          // Validasi B: Cek ke database apakah kursi sudah diduduki orang lain
          // Kita kirim "000000" sebagai ID palsu agar service tidak mencoba mengecualikan ID null
          const isAvailable = await guestService.checkSeatAvailability(
            guest.table_number,
            guest.seat_number,
            "000000",
          );
          if (!isAvailable) {
            setErrorMsg(
              `Table ${guest.table_number} - Seat ${guest.seat_number} sudah ditempati oleh tamu lain.`,
            );
            setIsProcessing(false);
            return;
          }
        }
      }

      // --- SIMPAN DATA JIKA VALIDASI LOLOS ---
      const finalPayload = [...guestsToUpdate, ...guestsToInsert];
      await guestService.processDynamicCheckIn(
        scannedTicket.guest_h_id,
        finalPayload,
      );

      onSuccess(
        `Berhasil memproses check-in untuk ${finalPayload.length} tamu.`,
      );
    } catch (error) {
      console.error(error);
      setErrorMsg("Gagal memproses check-in. Silakan coba lagi.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              <Users size={16} /> Confirm Check-In
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Ticket: {scannedTicket.ticket_code} | Cat:{" "}
              {scannedTicket.category}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ERROR MESSAGE ALERT */}
        {errorMsg && (
          <div className="bg-red-50 p-3 border-b border-red-100 flex items-start justify-center gap-2 text-red-700 shrink-0">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span className="text-xs font-semibold leading-relaxed">
              {errorMsg}
            </span>
          </div>
        )}

        {/* BODY COMPRISING THE TWO SUBCOMPONENTS */}
        <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
          <RegisteredGuestsList
            initialGuests={initialGuests}
            selectedGuestIds={selectedGuestIds}
            onToggleSelection={handleToggleSelection}
          />

          <ExtraGuestsTable
            extraGuests={extraGuests}
            onAddRow={handleAddExtraRow}
            onChange={handleExtraGuestChange}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              isProcessing ||
              (selectedGuestIds.length === 0 &&
                extraGuests.filter((g) => g.name.trim()).length === 0)
            }
            className="px-6 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Save size={16} /> Confirm Check-In (
                {selectedGuestIds.length +
                  extraGuests.filter((g) => g.name.trim()).length}
                )
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
