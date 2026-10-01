import { guestService } from "./guestService";

export const printGuestTicket = async (guest_h_id: string) => {
  try {
    // 1. Tarik Data
    const data = await guestService.getTicketData(guest_h_id);

    // 2. Buat Template HTML sesuai format
    const ticketHTML = `
      <div class="ticket">
        <div style="width:50%">
            <div class="center">Kode : ${data?.ticket_code}</div>
            <hr/>
            <div class="center bold">${data?.name}</div>
            <hr/>
            <div>TABLE : ${data?.table_number}</div>
            <div>PAX : ${data?.pax}</div>
        </div>
        <div style="width:50%">
        </div>
      </div>
    `;

    // 3. Cetak 2 Rangkap (Render 2 kali berturut-turut)
    // Kita render 2 kali agar otomatis keluar 2 lembar dari printer
    const printContent = ticketHTML + ticketHTML;

    // 4. Buat Hidden Iframe untuk mencetak tanpa mengganggu UI
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;

    // 5. Tulis HTML & CSS ke dalam iframe
    // Ukuran 60x40 mm adalah standar kertas thermal/barcode
    iframeDoc?.write(`
      <html>
        <head>
          <style>
            @page { 
                size: 80mm 60mm; 
                margin: 0; 
            }
            body { 
                font-family: Arial, sans-serif; 
                font-size: 14px; /* Sesuaikan ukuran font nanti */
                margin: 0; 
                padding: 0; 
            }
            .ticket { 
                width: 80mm; /* Dikurangi sedikit untuk margin aman */
                height: 60mm;
                padding: 2mm; 
                box-sizing: border-box; 
                page-break-after: always; /* Pastikan rangkap ke-2 pindah kertas */
                align: left;
            }
            hr { 
                border: 0; 
                border-top: 1px dashed #000; 
                margin: 4px 0; 
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    iframeDoc?.close();

    // 6. Eksekusi Print setelah iframe selesai dimuat
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Hapus iframe setelah selesai print (clean up)
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  } catch (error) {
    console.error("Print Error:", error);
    alert("Terjadi kesalahan saat mencetak tiket.");
  }
};
