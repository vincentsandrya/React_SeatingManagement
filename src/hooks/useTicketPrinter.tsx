// src/hooks/useTicketPrinter.tsx
import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { guestService } from "../services/guestService"; // Sesuaikan path
import { TicketTemplate } from "../components/Ticket/TicketTemplate";

export const useTicketPrinter = () => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [ticketData, setTicketData] = useState<any>(null);

  // Inisialisasi react-to-print
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Print_Tiket_Tamu", // Nama file jika disimpan sebagai PDF
  });

  // Fungsi utama yang dipanggil oleh tombol di halaman
  const printGuestTicket = async (guest_h_id: string) => {
    try {
      // 1. Tarik Data menggunakan service Anda
      const data = await guestService.getTicketData(guest_h_id);

      // 2. Simpan ke state agar komponen TicketTemplate ter-update
      setTicketData(data);

      // 3. Beri sedikit jeda agar React selesai merender state baru ke DOM, lalu cetak
      setTimeout(() => {
        handlePrint();
      }, 150);
    } catch (error) {
      console.error("Gagal menarik data tiket:", error);
      alert("Terjadi kesalahan saat memproses tiket.");
    }
  };

  return {
    printGuestTicket,
    // Komponen ini harus dirender di halaman (tapi dalam keadaan display: none)
    PrinterComponent: () => (
      <div style={{ display: "none" }}>
        <TicketTemplate ref={componentRef} data={ticketData} />
      </div>
    ),
  };
};
