import { guestService } from "./guestService";

export const printGuestTicket = async (guest_h_id: string) => {
  try {
    const data = await guestService.getTicketData(guest_h_id);

    // 1. Template HTML
    const ticketHTML = `
      <div class="ticket">
        <div style="width:60%">
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
        <div style="width:40%">
            <!-- Bagian kanan 50% kosong, mungkin untuk QR/Catatan -->
        </div>
      </div>
    `;

    const printContent = ticketHTML;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;

    // 2. CSS disesuaikan untuk A7 Landscape dan Flexbox Layout
    iframeDoc?.write(`
      <html>
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