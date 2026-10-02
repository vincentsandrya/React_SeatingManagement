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

    // Sesuaikan mapping variabel dengan return dari getTicketData Anda
    // (Berdasarkan kode sebelumnya, biasanya return-nya: ticket_code, name, table_number, pax)
    const ticketCode = data.ticket_code || '-';
    const guestName = data.name || '-';
    const tableNumber = data.table_number || '-';
    const paxCount = data.pax || 0;

    // 2. Kalkulasi Tinggi Kertas (Height Fit)
    let yPos = 5; 
    const lineHeight = 6;
    const calculatedHeight = yPos + (lineHeight * 5) + 5; 

    // 3. Inisialisasi jsPDF (Lebar 80mm, Tinggi dinamis)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, calculatedHeight]
    });

    // --- MULAI MENGGAMBAR KE PDF ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    // Baris 1: Kode
    doc.text(`Kode : ${ticketCode}`, 4, yPos += lineHeight);
    
    // Garis (hr)
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([1, 1], 0); // Efek dashed line
    doc.line(4, yPos += 2, 76, yPos); 
    doc.setLineDashPattern([], 0); // Reset dash
    
    // Baris 2: Nama
    doc.setFont("helvetica", "bold");
    doc.text(`${guestName}`, 4, yPos += lineHeight);
    
    // Garis (hr)
    doc.setFont("helvetica", "normal");
    doc.setLineDashPattern([1, 1], 0);
    doc.line(4, yPos += 2, 76, yPos);
    doc.setLineDashPattern([], 0);
    
    // Baris 3: Table & Pax
    doc.text(`TABLE : ${tableNumber}`, 4, yPos += lineHeight);
    doc.text(`PAX : ${paxCount}`, 4, yPos += lineHeight);
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