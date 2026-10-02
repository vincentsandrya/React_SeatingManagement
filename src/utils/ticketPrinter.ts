// src/utils/ticketPrinter.ts
import { jsPDF } from "jspdf";
import { guestService } from "../services/guestService"; // Sesuaikan path ini

/**
 * @param guest_h_id ID Tamu
 * @param copies Jumlah rangkap/copy (Default: 2)
 */
export const generateAndPrintTicket = async (
  guest_h_id: string,
  copies: number = 2,
): Promise<void> => {
  try {
    // 1. Ambil data menggunakan service
    const data = await guestService.getTicketData(guest_h_id);

    if (!data) {
      alert("Data tiket tidak ditemukan");
      return;
    }

    const ticketCode = data.ticket_code || "-";
    const guestName = data.name || "-";
    const tableNumber = data.table_number || "-";
    const paxCount = data.pax || 0;

    // =========================================================================
    // ⚙️ SETTINGAN JUMLAH RANGKAP / COPIES
    // =========================================================================
    // Anda bisa mengubah angka default 'copies' di parameter fungsi di atas,
    // atau mengubah variabel di bawah ini langsung jika ingin di-hardcode:
    const totalCopies = copies;
    // =========================================================================

    // 2. Kalkulasi Ukuran & Ratio (70% Isi, 30% Kosong)
    const totalWidth = 80; // 80mm
    const startX = 3; // Margin kiri
    const width70 = totalWidth * 0.7; // 56mm (70% dari 80mm)
    const endX = width70 - 2; // Batas kanan garis = 54mm
    const centerX = startX + (endX - startX) / 2; // Titik tengah area 70% = 28.5mm

    // Pengaturan Ukuran Font (Dikecilkan) & Jarak Baris
    const fontSizeCode = 9;
    const fontSizeName = 10;
    const fontSizeDetails = 8.5;
    const lineHeight = 4.5; // Jarak antar baris diperrapat

    // Kalkulasi tinggi kertas (fit pas dengan isi)
    const calculatedHeight = 2 + lineHeight * 4 + 6; // Sekitar 26mm

    // 3. Inisialisasi jsPDF (Landscape, 80mm x Tinggi Dinamis)
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [totalWidth, calculatedHeight],
    });

    // --- LOOP MENCETAK RANGKAP ---
    for (let i = 1; i <= totalCopies; i++) {
      // Jika rangkap ke-2 dan seterusnya, tambahkan Halaman/Sheet Baru
      if (i > 1) {
        doc.addPage([totalWidth, calculatedHeight], "landscape");
      }

      let yPos = 2; // Reset posisi Y untuk tiap lembar baru

      // Baris 1: Kode (Font 9pt)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSizeCode);
      yPos += lineHeight;
      doc.text(`Kode : ${ticketCode}`, centerX, yPos, { align: "center" });

      // Garis putus-putus (hr) - Batas 70% (endX = 54mm)
      yPos += 2;
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(startX, yPos, endX, yPos);
      doc.setLineDashPattern([], 0);

      // Baris 2: Nama (Font 10pt, Bold)
      yPos += lineHeight;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(fontSizeName);
      doc.text(`${guestName}`, centerX, yPos, { align: "center" });

      // Garis putus-putus (hr) - Batas 70%
      yPos += 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSizeDetails);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(startX, yPos, endX, yPos);
      doc.setLineDashPattern([], 0);

      // Baris 3 & 4: Table & Pax (Font 8.5pt)
      yPos += lineHeight;
      doc.text(`TABLE : ${tableNumber}`, startX, yPos);
      yPos += lineHeight;
      doc.text(`PAX : ${paxCount}`, startX, yPos);

      // Area X = 56mm - 80mm (30% bagian kanan) dibiarkan kosong
    }

    // 4. Trigger Print
    doc.autoPrint();

    // 5. Buka PDF di Tab Baru
    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);

    window.open(blobUrl, "_blank");

    // Clean up memory
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 5000);
  } catch (error) {
    console.error("Gagal mencetak tiket:", error);
    alert("Terjadi kesalahan saat memproses tiket.");
  }
};
