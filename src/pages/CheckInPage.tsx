import React, { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Search, UserCheck, CheckCircle2, AlertCircle, X, Users } from 'lucide-react';
import { guestService } from '../services/guestService';
import type { GuestDWithRelation } from '../types/database.types';

export default function CheckInPage() {
  // --- STATES UNTUK MANUAL LOOKUP (COMBOBOX) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [suggestions, setSuggestions] = useState<GuestDWithRelation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- STATES UNTUK CHECK-IN FLOW (PARTIAL CHECK-IN) ---
  const [scannedTicket, setScannedTicket] = useState<string | null>(null);
  const [previewGuests, setPreviewGuests] = useState<GuestDWithRelation[]>([]);
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // --- LOGICA MANUAL LOOKUP (SEARCH & AUTOCOMPLETE) ---
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
        const { data } = await guestService.getGuests(debouncedSearch, 1, 5);
        setSuggestions(data as unknown as GuestDWithRelation[]);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };
    fetchSuggestions();
  }, [debouncedSearch]);

  // --- LOGICA CHECK-IN ---
  const handleProcessTicket = async (ticketCode: string) => {
    setScannedTicket(ticketCode);
    setSearchTerm('');
    setShowSuggestions(false);
    
    try {
      const guests = await guestService.getGuestDByTicketCode(ticketCode);
      
      if (guests && guests.length > 0) {
        setPreviewGuests(guests as GuestDWithRelation[]);
        const pendingIds = guests
          .filter((g: any) => !g.checked_in_at)
          .map((g: any) => g.guest_d_id);
        setSelectedGuestIds(pendingIds);
      } else {
        setCheckInStatus({ type: 'error', message: 'Ticket Code tidak valid atau tidak ditemukan.' });
      }
    } catch (error) {
      setCheckInStatus({ type: 'error', message: 'Gagal memuat data tiket.' });
    }
  };

  const toggleGuestSelection = (guestId: string) => {
    setSelectedGuestIds(prev => 
      prev.includes(guestId) 
        ? prev.filter(id => id !== guestId) 
        : [...prev, guestId]
    );
  };

  const submitCheckIn = async () => {
    if (selectedGuestIds.length === 0 || previewGuests.length === 0) return;
    setIsProcessing(true);
    
    try {
      const guestHId = previewGuests[0].guest_h_id;
      await guestService.processCheckIn(selectedGuestIds, guestHId);
      
      setCheckInStatus({ 
        type: 'success', 
        message: `Berhasil check-in untuk ${selectedGuestIds.length} tamu.` 
      });
      
      setTimeout(() => {
        closePreview();
      }, 2000);
      
    } catch (error) {
      setCheckInStatus({ type: 'error', message: 'Gagal melakukan check-in.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const closePreview = () => {
    setPreviewGuests([]);
    setScannedTicket(null);
    setSelectedGuestIds([]);
    setCheckInStatus(null);
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto text-slate-800 min-h-screen flex flex-col">
      
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
                scanDelay={2000}
              />
            ) : (
              <div className="text-white flex flex-col items-center">
                <Users size={36} className="mb-2 text-slate-400" />
                <div className="text-xs">Scanner paused.</div>
                <div className="text-[11px] text-slate-400">Processing ticket...</div>
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
                        key={guest.guest_d_id}
                        onClick={() => handleProcessTicket(guest.guest_h?.ticket_code || '')}
                        className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-slate-900">{guest.title} {guest.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Ticket: {guest.guest_h?.ticket_code}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono text-slate-600">Table {guest.table_number}</div>
                          <div className="text-[10px] text-slate-500">Seat {guest.seat_number}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5"/>
              <div>Type a name to search. Click on the guest's name to pull up their entire party/family ticket for check-in.</div>
            </div>
          </div>
        </div>

      </div>

      {/* ===================================================== */}
      {/* MODAL: PARTIAL CHECK-IN PREVIEW                       */}
      {/* ===================================================== */}
      {previewGuests.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
              <div>
                <div className="text-xs font-bold">Ticket Verification</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{scannedTicket}</div>
              </div>
              {!checkInStatus && (
                <button onClick={closePreview} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Modal Body - Alert Status */}
            {checkInStatus && (
              <div className={`p-3 text-center font-semibold text-xs shrink-0 ${
                checkInStatus.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {checkInStatus.message}
              </div>
            )}

            {/* Modal Body - Guest List (Scrollable Area) */}
            <div className="p-5 overflow-y-auto flex-1">
              <div className="text-xs font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
                <Users size={15} /> Select Guests Present:
              </div>
              
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {previewGuests.map((guest) => {
                  const isAlreadyCheckedIn = guest.checked_in_at !== null;
                  const isChecked = selectedGuestIds.includes(guest.guest_d_id);
                  
                  return (
                    <label 
                      key={guest.guest_d_id}
                      className={`flex items-center gap-3 p-3.5 border-b border-slate-100 last:border-0 cursor-pointer transition-colors ${
                        isAlreadyCheckedIn ? 'bg-slate-50 opacity-70' : 'hover:bg-blue-50'
                      }`}
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          disabled={isAlreadyCheckedIn}
                          checked={isAlreadyCheckedIn || isChecked}
                          onChange={() => toggleGuestSelection(guest.guest_d_id)}
                          className="w-4 h-4 border border-slate-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="flex-1">
                        <div className={`text-xs font-bold ${isAlreadyCheckedIn ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                          {guest.title} {guest.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          Table {guest.table_number} • Seat {guest.seat_number}
                        </div>
                      </div>
                      <div className="text-right">
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

            {/* Modal Footer */}
            {!checkInStatus && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
                <button 
                  onClick={closePreview}
                  className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitCheckIn}
                  disabled={isProcessing || selectedGuestIds.length === 0}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isProcessing ? 'Processing...' : `Confirm Check-in (${selectedGuestIds.length})`}
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
}