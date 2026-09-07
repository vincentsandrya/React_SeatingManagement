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
        .not("checked_in_at", "is", null)
        .eq("is_absent", false);

      const { count: absent } = await supabase
        .from("guest_d")
        .select("*", { count: "exact", head: true })
        .eq("is_absent", true);

      const pending = (total || 0) - (checkedIn || 0) - (absent || 0);

      return {
        total: total || 0,
        checkedIn: checkedIn || 0,
        pending,
        absent: absent || 0,
      };
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

    // Ganti target ke View yang baru kita buat
    let query = supabase.from("vw_guest").select("*", { count: "exact" });

    if (search) {
      query = query.or(`h_name.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .range(from, to)
      .order("h_name", { ascending: true });

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

  // --- Tambahkan ini di dalam guestService.ts ---

  /**
   * Mengambil seluruh data header tamu (guest_h) untuk keperluan Bulk QR.
   * Ini memastikan QR di-generate per-tiket/undangan, bukan per-individu.
   */
  getGuestH: async (search: string = "") => {
    try {
      // Menggunakan inner join untuk mendapatkan ticket_code & category dari guest_h
      let query = supabase.from("guest_h").select("*");

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data, error } = await query.order("name", { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Gagal mengambil data tiket guest_h:", error);
      throw error;
    }
  },
  processDynamicCheckIn: async (guestHId: string, guestsData: any[]) => {
    try {
      const now = new Date().toISOString();

      // Pisahkan mana tamu lama (punya guest_d_id) dan tamu baru
      const existingGuests = guestsData.filter((g) => g.guest_d_id);
      const newGuests = guestsData.filter((g) => !g.guest_d_id);

      // 1. UPDATE tamu lama
      if (existingGuests.length > 0) {
        const existingIds = existingGuests.map((g) => g.guest_d_id);
        const { error: updateError } = await supabase
          .from("guest_d")
          .update({ checked_in_at: now })
          .in("guest_d_id", existingIds);

        if (updateError) throw updateError;
      }

      // 2. INSERT tamu baru (jika ada)
      if (newGuests.length > 0) {
        const insertPayload = newGuests.map((g) => ({
          guest_h_id: guestHId,
          title: g.title || "",
          name: g.name || "Unnamed Guest",
          table_number: g.table_number || null,
          seat_number: g.seat_number || null,
          is_vegetarian: g.is_vegetarian || false,
          checked_in_at: now, // Langsung di-set checked_in karena diinput saat check-in
        }));

        const { error: insertError } = await supabase
          .from("guest_d")
          .insert(insertPayload);

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error("Gagal memproses check-in dinamis:", error);
      throw error;
    }
  },
  // Tambahkan fungsi ini di dalam guestService
  async checkSeatAvailability(
    tableNumber: string,
    seatNumber: string,
    excludeGuestId: string,
  ): Promise<boolean> {
    // Jika tidak ada input table/seat, anggap valid (bebas duduk/standing)
    if (!tableNumber || !seatNumber) return true;

    const { data, error } = await supabase
      .from("guest_d")
      .select("guest_d_id")
      .eq("table_number", tableNumber)
      .eq("seat_number", seatNumber)
      .neq("guest_d_id", excludeGuestId) // Abaikan tamu ini sendiri agar tidak false-positive
      .limit(1);

    if (error) {
      console.error("Error checking seat:", error);
      throw error;
    }

    // Jika data.length === 0, berarti kursi KOSONG (Available = true)
    return data.length === 0;
  },

  getGuestHByNameAndDName: async (search: string) => {
    // Cari ke View berdasarkan Nama Tamu ATAU Nama Undangan
    const { data, error } = await supabase
      .from("vw_guest")
      .select("guest_h_id, h_name, ticket_code, category")
      .or(`h_name.ilike.%${search}%,name.ilike.%${search}%`)
      .limit(30);

    if (error) {
      console.error("Error getGuestHByNameAndDName() :", error);
      return [];
    }

    const uniqueGroups = Array.from(
      new Map(data.map((item) => [item.guest_h_id, item])).values(),
    );

    return uniqueGroups;
  },

  // Ambil Header saja (Untuk persiapan jika Guest_D nya ternyata kosong)
  getGuestHByTicketCode: async (ticketCode: string) => {
    const { data, error } = await supabase
      .from("guest_h")
      .select("guest_h_id, ticket_code, category")
      .eq("ticket_code", ticketCode)
      .single();

    if (error) {
      console.error("Header not found or error:", error);
      return null;
    }
    return data;
  },
};
