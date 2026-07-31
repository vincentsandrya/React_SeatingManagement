import { supabase } from "../lib/supabase";
import type { GuestD } from "../types/database.types";

export const guestService = {
  /**
   * 1. Mengambil statistik tamu (Total, Check-in, Pending)
   */
  getGuestStats: async () => {
    try {
      // Kita menggunakan { count: 'exact', head: true } agar Supabase HANYA mengembalikan angka
      // tanpa men-download datanya, sehingga sangat ringan dan cepat.

      const { count: total } = await supabase
        .from("guest_d")
        .select("*", { count: "exact", head: true });

      const { count: checkedIn } = await supabase
        .from("guest_d")
        .select("*", { count: "exact", head: true })
        .not("checked_in_at", "is", null);

      const pending = (total || 0) - (checkedIn || 0);

      return { total: total || 0, checkedIn: checkedIn || 0, pending };
    } catch (error) {
      console.error("Error fetching guest stats:", error);
      throw error;
    }
  },

  /**
   * 2. Menarik daftar data tamu untuk Master Attendance (dengan Search & Pagination)
   */
  getGuests: async (
    search: string = "",
    page: number = 1,
    pageSize: number = 10,
  ) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Menggunakan inner join untuk mendapatkan ticket_code & category dari guest_h
    let query = supabase.from("guest_d").select(
      `
        guest_d_id, 
        guest_h_id, 
        title, 
        name, 
        table_number, 
        seat_number, 
        is_vegetarian, 
        checked_in_at,
        guest_h!inner (ticket_code, category)
      `,
      { count: "exact" },
    );

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, count, error } = await query
      .range(from, to)
      .order("name", { ascending: true });

    if (error) throw error;
    return { data, count };
  },

  /**
   * 3. Mencari list detail tamu (keluarga/rombongan) berdasarkan Ticket Code
   * Berguna untuk preview sebelum check-in
   */
  getGuestDByTicketCode: async (ticketCode: string) => {
    const { data, error } = await supabase
      .from("guest_d")
      .select(
        `
        *,
        guest_h!inner (ticket_code, category, name)
      `,
      )
      .eq("guest_h.ticket_code", ticketCode);

    if (error) throw error;
    return data;
  },

  /**
   * 4. Update detail tamu (Manual Edit)
   */
  updateGuestDetails: async (guest_d_id: string, updates: Partial<GuestD>) => {
    const { data, error } = await supabase
      .from("guest_d")
      .update(updates)
      .eq("guest_d_id", guest_d_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 5. Proses Check-in Partial (Berdasarkan list ID yang dipilih)
   */
  processCheckIn: async (listGuestDId: string[], guest_h_id: string) => {
    const timestamp = new Date().toISOString();

    try {
      // 1. Update list guest_d yang diceklis (hadir)
      const { error: errorD } = await supabase
        .from("guest_d")
        .update({ checked_in_at: timestamp })
        .in("guest_d_id", listGuestDId);

      if (errorD) throw errorD;

      // 2. Update guest_h_id (Tandai rombongan sudah tiba)
      // Meskipun yang datang hanya 2 dari 3, secara rombongan tiket ini sudah tercatat dipakai.
      const { error: errorH } = await supabase
        .from("guest_h")
        .update({ checked_in_at: timestamp })
        .eq("guest_h_id", guest_h_id);

      if (errorH) throw errorH;

      return true;
    } catch (error) {
      console.error("Error during check-in process:", error);
      throw error;
    }
  },

  /**
   * 6. Download Laporan Seluruh Tamu (Tanpa Pagination)
   */
  getReportGuest: async () => {
    const { data, error } = await supabase
      .from("guest_d")
      .select(
        `
        guest_d_id,
        name,
        title,
        table_number,
        seat_number,
        is_vegetarian,
        checked_in_at,
        guest_h (ticket_code, category)
      `,
      )
      .order("table_number", { ascending: true });

    if (error) throw error;
    return data;
  },

  getRecentCheckIns: async (limit: number = 5) => {
    try {
      const { data, error } = await supabase
        .from("guest_d")
        .select(
          `
          guest_d_id,
          name,
          title,
          table_number,
          seat_number,
          checked_in_at,
          guest_h!inner (category)
        `,
        )
        .not("checked_in_at", "is", null) // Hanya yang sudah check-in
        .order("checked_in_at", { ascending: false }) // Urutkan dari waktu terbaru
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching recent check-ins:", error);
      throw error;
    }
  },
};
