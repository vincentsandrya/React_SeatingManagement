import React, { useState, useEffect } from 'react';
import { X, Plus, Users, Save, Loader2, CheckCircle2, UserPlus } from 'lucide-react';
import { guestService } from '../services/guestService';

interface ExtraGuest {
  title: string;
  name: string;
  table_number: string;
  seat_number: string;
}

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
  onSuccess
}: CheckInConfirmationModalProps) {
  
  // State untuk tamu bawaan yang dipilih (checkbox)
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  
  // State untuk tamu tambahan (dynamic rows)
  const [extraGuests, setExtraGuests] = useState<ExtraGuest[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set default checkbox: centang semua tamu yang BELUM check-in
  useEffect(() => {
    if (initialGuests && initialGuests.length > 0) {
      const pendingIds = initialGuests
        .filter(g => !g.checked_in_at)
        .map(g => g.guest_d_id);
      setSelectedGuestIds(pendingIds);
    }
  }, [initialGuests]);

  // --- LOGIKA CHECKBOX TAMU BAWAAN ---
  const toggleGuestSelection = (guestId: string) => {
    setSelectedGuestIds(prev => 
      prev.includes(guestId) 
        ? prev.filter(id => id !== guestId) 
        : [...prev, guestId]
    );
  };

  // --- LOGIKA TAMU TAMBAHAN DINAMIS ---
  const handleAddExtraRow = () => {
    setExtraGuests(prev => [...prev, { title: '', name: '', table_number: '', seat_number: '' }]);
  };

  const handleExtraGuestChange = (index: number, field: keyof ExtraGuest, value: string) => {
    const newGuests = [...extraGuests];
    newGuests[index][field] = value;
    setExtraGuests(newGuests);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === extraGuests.length - 1) {
        handleAddExtraRow();
      }
    }
  };

  // --- LOGIKA SUBMIT ---
  const handleConfirm = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    
    try {
      // 1. Ambil data tamu bawaan yang dipilih
      const guestsToUpdate = initialGuests.filter(g => selectedGuestIds.includes(g.guest_d_id));
      
      // 2. Ambil tamu tambahan yang namanya tidak kosong
      const guestsToInsert = extraGuests.filter(g => g.name.trim() !== '');
      
      // Gabungkan payload (Service akan mendeteksi mana yang di-update & di-insert berdasarkan ada tidaknya guest_d_id)
      const finalPayload = [...guestsToUpdate, ...guestsToInsert];

      if (finalPayload.length === 0) {
        setErrorMsg("Pilih minimal 1 tamu atau tambahkan tamu baru.");
        setIsProcessing(false);
        return;
      }

      await guestService.processDynamicCheckIn(scannedTicket.guest_h_id, finalPayload);
      
      onSuccess(`Berhasil memproses check-in untuk ${finalPayload.length} tamu.`);
    } catch (error) {
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
              Ticket: {scannedTicket.ticket_code} | Cat: {scannedTicket.category}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-100 text-red-800 text-xs font-semibold p-3 text-center shrink-0">
            {errorMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
          
          {/* SECTION 1: REGISTERED GUESTS (CHECKBOX) */}
          <div className="p-5 border-b border-slate-200">
            <div className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Users size={14} className="text-blue-600"/> Registered Guests
            </div>
            
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              {initialGuests.map((guest) => {
                const isAlreadyCheckedIn = !!guest.checked_in_at;
                const isChecked = selectedGuestIds.includes(guest.guest_d_id);
                
                return (
                  <label 
                    key={guest.guest_d_id}
                    className={`flex items-center gap-3 p-3 border-b border-slate-100 last:border-0 transition-colors ${
                      isAlreadyCheckedIn ? 'bg-slate-50 cursor-default' : 'hover:bg-blue-50 cursor-pointer'
                    }`}
                  >
                    <div className="relative flex items-center pl-1">
                      <input
                        type="checkbox"
                        disabled={isAlreadyCheckedIn}
                        checked={isAlreadyCheckedIn || isChecked}
                        onChange={() => !isAlreadyCheckedIn && toggleGuestSelection(guest.guest_d_id)}
                        className="w-4 h-4 border border-slate-300 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <div className={`text-xs font-bold ${isAlreadyCheckedIn ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        {guest.title} {guest.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        Table {guest.table_number || '-'} • Seat {guest.seat_number || '-'}
                      </div>
                    </div>
                    <div className="text-right pr-1">
                      {isAlreadyCheckedIn ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                          <CheckCircle2 size={12} /> Checked In
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                          Pending
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: EXTRA GUESTS (DYNAMIC ROWS) */}
          <div className="p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <UserPlus size={14} className="text-emerald-600"/> Additional Guests
              </div>
              <button 
                onClick={handleAddExtraRow}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-2 py-1 rounded"
              >
                <Plus size={12} /> Add Row
              </button>
            </div>
            
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase w-20">Title</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase">Full Name</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase w-20">Table</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase w-20">Seat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {extraGuests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-xs text-slate-400 italic">
                        No additional guests. Click "Add Row" or check-in registered guests.
                      </td>
                    </tr>
                  ) : (
                    extraGuests.map((guest, index) => (
                      <tr key={index} className="bg-emerald-50/20">
                        <td className="px-2 py-2">
                          <input 
                            type="text" 
                            placeholder="Mr/Ms"
                            value={guest.title}
                            onChange={(e) => handleExtraGuestChange(index, 'title', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 bg-white"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input 
                            type="text" 
                            placeholder="Extra Guest Name"
                            value={guest.name}
                            onChange={(e) => handleExtraGuestChange(index, 'name', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            autoFocus
                            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 bg-white"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input 
                            type="text" 
                            value={guest.table_number}
                            onChange={(e) => handleExtraGuestChange(index, 'table_number', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 bg-white font-mono"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input 
                            type="text" 
                            value={guest.seat_number}
                            onChange={(e) => handleExtraGuestChange(index, 'seat_number', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 bg-white font-mono"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-3 text-[10px] text-slate-500">
              *Tekan <b>Enter</b> di kolom input untuk menambah baris secara otomatis.
            </div>
          </div>
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
            disabled={isProcessing || (selectedGuestIds.length === 0 && extraGuests.filter(g => g.name.trim()).length === 0)}
            className="px-6 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isProcessing ? (
              <><Loader2 size={16} className="animate-spin" /> Processing...</>
            ) : (
              <><Save size={16} /> Confirm Check-In ({selectedGuestIds.length + extraGuests.filter(g => g.name.trim()).length})</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}