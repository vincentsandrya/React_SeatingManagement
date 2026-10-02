// src/utils/ticketPrinter.ts
import { jsPDF } from 'jspdf';
import { guestService } from '../services/guestService'; // Sesuaikan path ini

export const generateAndPrintTicket = async (guest_h_id: string): Promise<void> => {
  try {
    // 1. Ambil data menggunakan service
    const data = await guestService.getTicketData(guest_h_id);
    
    if (!data) {
        alert("Data tiket tidak ditemukan");
        return;
    }

    const ticketCode = data.ticket_code || '-';
    const guestName = data.name || '-';
    const tableNumber = data.table_number || '-';
    const paxCount = data.pax || 0;

    // 2. Kalkulasi Tinggi Kertas (Height Fit)
    let yPos = 2; // Mulai dari atas dengan sedikit margin
    const lineHeight = 6;
    const calculatedHeight = yPos + (lineHeight * 4) + 12; // Hasilnya sekitar 38mm

    // Variabel untuk membatasi 60% area (dari total lebar 80mm)
    const startX = 4; // Margin kiri
    const width60 = 80 * 0.6; // 48mm
    const endX = width60 - 2; // Batas kanan untuk garis putus-putus = 46mm
    const centerX = startX + (endX - startX) / 2; // Titik tengah area 60% = 25mm

    // 3. Inisialisasi jsPDF 
    // Format [lebar, tinggi]. Lebar fix 80mm, tinggi dinamis
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [80, calculatedHeight]
    });

    // --- MULAI MENGGAMBAR KE PDF ---
    
    // Baris 1: Kode (Tengah di area 60%)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    yPos += lineHeight;
    // Gunakan { align: "center" } dengan sumbu X di titik tengah area 60%
    doc.text(`Kode : ${ticketCode}`, centerX, yPos, { align: "center" });
    
    // Garis (hr) hanya sampai batas 60% (endX)
    yPos += 3;
    doc.setLineWidth(0.4);
    doc.setLineDashPattern([1, 1], 0); 
    doc.line(startX, yPos, endX, yPos); 
    doc.setLineDashPattern([], 0); 
    
    // Baris 2: Nama (Tengah di area 60%, bold, teks lebih besar)
    yPos += lineHeight;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`${guestName}`, centerX, yPos, { align: "center" });
    
    // Garis (hr) hanya sampai batas 60%
    yPos += 3;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(startX, yPos, endX, yPos);
    doc.setLineDashPattern([], 0);
    
    // Baris 3 & 4: Table & Pax (Rata kiri di dalam area 60%)
    yPos += lineHeight;
    doc.text(`TABLE : ${tableNumber}`, startX, yPos);
    yPos += lineHeight;
    doc.text(`PAX : ${paxCount}`, startX, yPos);
    
    // Area X = 48 sampai X = 80 dibiarkan kosong (40% bagian kanan)
    // ----------------------------------------------

    // 4. Trigger Print
    doc.autoPrint();

    // 5. Buka PDF di Tab Baru untuk memunculkan dialog Print
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    
    window.open(blobUrl, '_blank');
    
    // Clean up memory
    setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
    }, 5000);

  } catch (error) {
    console.error("Gagal mencetak tiket:", error);
    alert("Terjadi kesalahan saat memproses tiket.");
  }
};