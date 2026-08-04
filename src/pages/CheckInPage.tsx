import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Search, UserCheck, AlertCircle, X, Users, CheckCircle2 } from 'lucide-react';
import { guestService } from '../services/guestService';
import type { GuestDWithRelation } from '../types/database.types';

// Import komponen modal yang baru kita buat
import CheckInConfirmationModal from '../components/CheckInConfirmationModal';

export default function CheckInPage() {
  // --- STATES UNTUK MANUAL LOOKUP ---
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- STATES UNTUK CHECK-IN FLOW ---
  const [scannedTicket, setScannedTicket] = useState<string | null>(null);
  const [previewGuests, setPreviewGuests] = useState<GuestDWithRelation[]>([]);
  
  // Status Notifikasi Global di Halaman
  const [globalStatus, setGlobalStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // --- LOGIKA MANUAL LOOKUP (PENCARIAN) ---
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearch.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const data = await guestService.getGuestH(debouncedSearch);
        setSuggestions(data);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };
    fetchSuggestions();
  }, [debouncedSearch]);

  // --- TRIGGER SCAN / PENCARIAN TIKET ---
  const handleProcessTicket = async (ticketCode: string) => {
    setScannedTicket(ticketCode);
    setSearchTerm('');
    setShowSuggestions(false);
    
    try {
      const guests = await guestService.getGuestDByTicketCode(ticketCode);
      
      if (guests && guests.length > 0) {
        setPreviewGuests(guests as GuestDWithRelation[]);
      } else {
        showGlobalAlert('error', 'Ticket Code tidak valid atau tidak ditemukan.');
      }
    } catch (error) {
      showGlobalAlert('error', 'Gagal memuat data tiket dari server.');
    }
  };

  // --- HANDLER NOTIFIKASI & PENUTUP MODAL ---
  const showGlobalAlert = (type: 'success' | 'error', message: string) => {
    setGlobalStatus({ type, message });
    setTimeout(() => setGlobalStatus(null), 3500); // Hilang otomatis setelah 3.5 detik
  };

  const handleCloseModal = () => {
    setPreviewGuests([]);
    setScannedTicket(null);
  };

  const handleCheckInSuccess = (message: string) => {
    showGlobalAlert('success', message);
    handleCloseModal(); // Tutup modal otomatis jika sukses
  };

  return (
    <div className="max-w-[1200px] mx-auto text-slate-800 min-h-screen flex flex-col relative">
      
      {/* GLOBAL NOTIFICATION (MUNCUL DI ATAS SAAT BERHASIL) */}
      {globalStatus && (
        <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-40 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 font-bold text-sm animate-in slide-in-from-top-4 fade-in ${
          globalStatus.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {globalStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {globalStatus.message}
        </div>
      )}

      <div className="mb-6">
        <div className="text-xl font-bold mb-0.5 text-slate-900">Live Check-In</div>
        <div className="text-xs text-slate-500">Scan QR Codes or lookup guests to grant access.</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        
        {/* --- KIRI: QR SCANNER --- */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden h-[460px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <UserCheck size={16} className="text-blue-600"/> QR Code Scanner
            </div>
          </div>
          <div className="flex-1 bg-black relative flex items-center justify-center">
            {previewGuests.length === 0 ? (
              <Scanner
                onScan={(detectedCodes) => {
                  if (detectedCodes && detectedCodes.length > 0) {
                    handleProcessTicket(detectedCodes[0].rawValue);
                  }
                }}
                onError={(error) => console.log(error?.message)}
                scanDelay={2000} // Jeda antar scan
              />
            ) : (
              <div className="text-white flex flex-col items-center">
                <Users size={36} className="mb-2 text-slate-400" />
                <div className="text-xs">Scanner paused.</div>
                <div className="text-[11px] text-slate-400">Please complete the check-in on the modal.</div>
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none border-[30px] border-black/40">
              <div className="w-full h-full border-2 border-dashed border-white/50 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* --- KANAN: MANUAL LOOKUP --- */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm h-[460px] flex flex-col">
           <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Search size={16} className="text-blue-600"/> Manual Lookup
            </div>
          </div>
          
          <div className="p-6 relative flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Search by Guest Name
            </label>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={15} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Type name here (e.g. Eleanor)..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all text-xs"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Dropdown Suggestions */}
            {showSuggestions && debouncedSearch.length >= 2 && (
              <div className="absolute z-10 w-[calc(100%-3rem)] mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                {suggestions.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">
                    No guests found matching "{debouncedSearch}"
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                    {suggestions.map((guest) => (
                      <li 
                        key={guest.guest_h_id}
                        onClick={() => handleProcessTicket(guest.ticket_code || '')}
                        className="p-3 text-left hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-slate-900">{guest.title} {guest.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Ticket: {guest.ticket_code}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5"/>
              <div>
                Type a name to search. Click on the guest's name to pull up their entire party/family ticket for check-in.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* PEMANGGILAN COMPONENT MODAL CHECK-IN                  */}
      {/* ===================================================== */}
      {previewGuests.length > 0 && (
        <CheckInConfirmationModal
          scannedTicket={{
            guest_h_id: previewGuests[0]?.guest_h_id || '',
            ticket_code: previewGuests[0]?.guest_h?.ticket_code || scannedTicket || 'NO-TICKET',
            category: previewGuests[0]?.guest_h?.category || 'Guest'
          }}
          initialGuests={previewGuests}
          onClose={handleCloseModal}
          onSuccess={handleCheckInSuccess}
        />
      )}

    </div>
  );
}