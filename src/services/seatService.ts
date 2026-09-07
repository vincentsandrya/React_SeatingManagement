import { supabase } from '../lib/supabase';
import type { GuestDWithRelation, SeatWithGuestBinding } from '../types/database.types';

export const seatService = {
  /**
   * Mengambil semua kursi dan mengikatnya (bind) dengan data tamu 
   * berdasarkan kecocokan table_number dan seat_number.
   */
  getSeats: async (): Promise<SeatWithGuestBinding[]> => {
    try {
      // 1. Ambil semua data layout kursi
      const { data: seats, error: seatError } = await supabase
        .from('seats')
        .select('*');
      
      if (seatError) throw seatError;

      // 2. Ambil data tamu (hanya kolom yang diperlukan untuk mapping warna peta)
      const { data: guests, error: guestError } = await supabase
        .from('guest_d')
        .select('guest_d_id, table_number, seat_number, checked_in_at, is_absent');
        
      if (guestError) throw guestError;

      // 3. Lakukan proses Binding (Join) secara lokal
      const mapBindingData = seats.map((seat) => {
        // Cari tamu yang meja dan kursinya cocok dengan kursi ini
        const assignedGuest = guests.find(g => 
          g.table_number === seat.table_number && 
          g.seat_number === seat.seat_number
        );

        return {
          ...seat,
          guest_d_id: assignedGuest ? assignedGuest.guest_d_id : null,
          checked_in_at: assignedGuest ? assignedGuest.checked_in_at : null,
          is_absent : assignedGuest ? assignedGuest.is_absent : null
        };
      });

      return mapBindingData;
    } catch (error) {
      console.error("Error fetching map binding data:", error);
      throw error;
    }
  },

  /**
   * Mengambil detail tamu spesifik saat kursi di klik
   */
  getGuestByGuestDId: async (guest_d_id: string): Promise<GuestDWithRelation> => {
    try {
      const { data, error } = await supabase
        .from('guest_d')
        .select(`*, guest_h!inner(ticket_code, category)`)
        .eq('guest_d_id', guest_d_id)
        .single();

      if (error) throw error;
      return data as unknown as GuestDWithRelation;
    } catch (error) {
      console.error("Error fetching guest details for map:", error);
      throw error;
    }
  },

  subscribeToMapUpdates: (onUpdate: () => void) => {
    const channel = supabase
      .channel('map-realtime-service')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guest_d',
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    // Mengembalikan fungsi unbind/cleanup agar bisa dilepas saat unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }
};