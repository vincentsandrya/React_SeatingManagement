import { guestService } from "./guestService";

export const printGuestTicket = async (guest_h_id: string) => {
  try {
    const data = await guestService.getTicketData(guest_h_id);

    // 1. Template HTML
    const ticketHTML = `
      <div class="ticket">
        <div class="ticket-half">
            <div class="center">Kode : ${data?.ticket_code}</div>
            <hr/>
            <div class="center bold text-large">${data?.name}</div>
            <hr/>
            <div class="info-row">
                <span>TABLE : <b>${data?.table_number || '-'}</b></span>
            </div>
            <div class="info-row">
                <span>PAX : <b>${data?.pax || 0}</b></span>
            </div>
        </div>
        <div class="ticket-half">
            <!-- Bagian kanan 50% kosong, mungkin untuk QR/Catatan -->
        </div>
      </div>
    `;

    const printContent = ticketHTML + ticketHTML;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;

    // 2. CSS disesuaikan untuk A7 Landscape dan Flexbox Layout
    iframeDoc?.write(`
      <html>
        <head>
          <style>
            @page { 
                /* ISO A7 Landscape: Lebar 105mm, Tinggi 74mm */
                size: 105mm 20mm; 
                margin: 0 !important; 
            }
            body { 
                font-family: Arial, sans-serif; 
                font-size: 16px; 
                margin: 0 !important; 
                padding: 0 !important;
                width: 100%;
            }
            .ticket { 
                width: 100%; 
                height: 100%; /* Penuhi seluruh tinggi kertas */
                padding: 2mm; 
                box-sizing: border-box; 
                page-break-after: always; 
                
                /* [PENTING] Gunakan flex agar div 50% sejajar kiri-kanan */
                display: flex;
                flex-direction: row;
            }
            .ticket-half {
                width: 50%;
                box-sizing: border-box;
                padding: 2mm; /* Beri jarak sedikit antar kolom */
            }
            hr { 
                border: 0; 
                border-top: 2px dashed #000; 
                margin: 6px 0; 
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .text-large { font-size: 20px; }
            .info-row { margin-top: 4px; font-size: 18px; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    iframeDoc?.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  } catch (error) {
    console.error("Print Error:", error);
    alert("Terjadi kesalahan saat mencetak tiket.");
  }
};