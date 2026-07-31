import React, { useState, useEffect } from 'react';
import { Map as MapIcon, Users, CheckCircle2, Clock, X, Info, Loader2 } from 'lucide-react';
import { formatTime } from '../utils/helpers';
import { seatService } from '../services/seatService';
import type { GuestDWithRelation, SeatWithGuestBinding } from '../types/database.types';

export default function MapPage() {
  // States untuk Peta
  const [seats, setSeats] = useState<SeatWithGuestBinding[]>([]);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  
  // States untuk Modal Detail
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<SeatWithGuestBinding | null>(null);
  const [guestDetail, setGuestDetail] = useState<GuestDWithRelation | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Load awal Peta
  useEffect(() => {
    const fetchMapData = async () => {
      setIsLoadingMap(true);
      try {
        const data = await seatService.getSeats();
        setSeats(data);
      } catch (error) {
        console.error("Gagal memuat peta:", error);
      } finally {
        setIsLoadingMap(false);
      }
    };
    fetchMapData();
  }, []);

  // Handler saat kursi di-klik
  const handleSeatClick = async (seat: SeatWithGuestBinding) => {
    setSelectedSeatInfo(seat);
    
    // Jika kursi ada yang menempati (guest_d_id tidak null), tarik detailnya
    if (seat.guest_d_id) {
      setIsDetailLoading(true);
      try {
        const detail = await seatService.getGuestByGuestDId(seat.guest_d_id);
        setGuestDetail(detail);
      } catch (error) {
        console.error("Gagal mengambil detail tamu:", error);
      } finally {
        setIsDetailLoading(false);
      }
    } else {
      // Jika kursi kosong
      setGuestDetail(null);
    }
  };

  const closeModal = () => {
    setSelectedSeatInfo(null);
    setGuestDetail(null);
  };

  // Penentuan warna berdasarkan hasil binding
  const getSeatColor = (guest_d_id: string | null, checked_in_at: string | null) => {
    if (!guest_d_id) return 'bg-slate-300 text-slate-600 border-slate-400 hover:bg-slate-400'; 
    if (!checked_in_at) return 'bg-amber-400 text-amber-900 border-amber-500 hover:bg-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]'; 
    return 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]'; 
  };

  return (
    <div className="max-w-[1400px] mx-auto text-slate-800 min-h-screen flex flex-col">
      
      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="text-xl font-bold mb-0.5 text-slate-900 flex items-center gap-2">
            <MapIcon size={20} className="text-blue-600" /> Venue Map
          </div>
          <div className="text-xs text-slate-500">Visual representation of seating arrangement and guest status.</div>
        </div>

        {/* LEGENDA STATUS */}
        <div className="flex gap-4 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
            <div className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400"></div> Empty
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
            <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500"></div> Pending
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
            <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600"></div> Checked In
          </div>
        </div>
      </div>

      {/* MAP CONTAINER */}
      <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative flex items-center justify-center p-4">
        {isLoadingMap ? (
          <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-blue-600" />
            Loading Map Data...
          </div>
        ) : (
          <div className="relative w-full max-w-5xl bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden">
            
            <img 
              src="../assets/Image/Map.png" 
              alt="Venue Blueprint" 
              className="w-full h-full object-cover opacity-80"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-300 -z-10">
              [ /venue-map.png placeholder ]
            </div>

            {/* RENDER KURSI / SEATS */}
            {seats.map((seat) => (
              <button
                key={seat.seat_id}
                onClick={() => handleSeatClick(seat)}
                className={`absolute flex flex-col items-center justify-center w-6 h-6 -ml-4 -mt-4 rounded-3xl border-2 transition-all cursor-pointer transform hover:scale-110 active:scale-95 ${getSeatColor(seat.guest_d_id, seat.checked_in_at)}`}
                style={{ left: `${seat.x_position}%`, top: `${seat.y_position}%` }}
                title={`Table ${seat.table_number} - Seat ${seat.seat_number}`}
              >
                <span className="text-xs font-semibold leading-none">{seat.table_number}{seat.seat_number}</span>
              </button>
            ))}
            
          </div>
        )}
      </div>

      {/* --- MODAL DETAIL KURSI/TAMU --- */}
      {selectedSeatInfo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
              <div>
                <div className="text-xs font-bold">Seat Information</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Table {selectedSeatInfo.table_number} • Seat {selectedSeatInfo.seat_number}
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-slate-50 min-h-[200px]">
              
              {/* Jika Kursi Kosong */}
              {!selectedSeatInfo.guest_d_id && (
                <div className="flex flex-col items-center justify-center py-6 text-slate-400 h-full">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-3">
                    <Info size={20} className="text-slate-400" />
                  </div>
                  <div className="text-xs font-bold text-slate-600">Seat is Empty</div>
                  <div className="text-[11px] text-slate-500 mt-1">No guest assigned to this seat.</div>
                </div>
              )}

              {/* Sedang Loading Detail */}
              {selectedSeatInfo.guest_d_id && isDetailLoading && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span className="text-xs">Fetching guest details...</span>
                </div>
              )}

              {/* Menampilkan Detail Tamu */}
              {selectedSeatInfo.guest_d_id && !isDetailLoading && guestDetail && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center font-bold text-xs shrink-0">
                        <Users size={14} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">
                          {guestDetail.title} {guestDetail.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Ticket: {guestDetail.guest_h?.ticket_code || '-'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <div className="text-slate-500 font-semibold mb-0.5">Category</div>
                        <div className="font-bold text-slate-800">{guestDetail.guest_h?.category || '-'}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 font-semibold mb-0.5">Dietary</div>
                        <div className={`font-bold ${guestDetail.is_vegetarian ? 'text-amber-600' : 'text-slate-800'}`}>
                          {guestDetail.is_vegetarian ? 'Vegetarian' : 'Normal'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${
                    guestDetail.checked_in_at 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="text-[11px] font-semibold text-slate-600 mb-2">Arrival Status</div>
                    
                    {guestDetail.checked_in_at ? (
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 size={16} className="shrink-0" />
                        <div>
                          <div className="text-xs font-bold">Checked In</div>
                          <div className="text-[10px] opacity-80 mt-0.5">
                            at {formatTime(guestDetail.checked_in_at)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-700">
                        <Clock size={16} className="shrink-0" />
                        <div>
                          <div className="text-xs font-bold">Pending Arrival</div>
                          <div className="text-[10px] opacity-80 mt-0.5">Guest has not arrived yet.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex justify-end shrink-0">
              <button 
                onClick={closeModal}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
              >
                Close Details
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}