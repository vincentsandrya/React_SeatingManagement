import { forwardRef } from "react";

// Tipe data (sesuaikan dengan punya Anda)
interface TicketData {
  ticket_code: string;
  name: string;
  table_number: string;
  pax: number;
}

interface Props {
  data: TicketData | null;
}

export const TicketTemplate = forwardRef<HTMLDivElement, Props>(
  ({ data }, ref) => {
    if (!data) return null;

    return (
      <div ref={ref} className="print-container">
        {/* CSS Khusus Print thermal 80mm */}
        <style type="text/css" media="print">
          {`
          @page { 
            /* Lebar 80mm, tinggi auto (fit/menyesuaikan panjang konten) */
            size: 80mm auto; 
            margin: 0 !important; 
          }
          body { 
            margin: 0; 
            padding: 0; 
            font-family: Arial, sans-serif;
          }
          .ticket-copy {
            width: 80mm;
            padding: 4mm 6mm;
            box-sizing: border-box;
            page-break-after: always; /* Pemisah untuk copy ke-2 */
          }
          hr {
            border: 0;
            border-top: 2px dashed #000;
            margin: 8px 0;
          }
        `}
        </style>

        {/* --- COPY 1 --- */}
        <div className="ticket-copy">
          <div style={{ textAlign: "center", fontSize: "14px" }}>
            KKKode : {data.ticket_code}
          </div>
          <hr />
          <div
            style={{
              textAlign: "center",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            {data.name}
          </div>
          <hr />
          <div style={{ fontSize: "16px", marginTop: "4px" }}>
            TABLE : <b>{data.table_number || "-"}</b>
          </div>
          <div style={{ fontSize: "16px", marginTop: "4px" }}>
            PAX : <b>{data.pax || 0}</b>
          </div>
        </div>

        {/* --- COPY 2 (RANGKAP) --- */}
        <div className="ticket-copy">
          <div style={{ textAlign: "center", fontSize: "14px" }}>
            Kode : {data.ticket_code}
          </div>
          <hr />
          <div
            style={{
              textAlign: "center",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            {data.name}
          </div>
          <hr />
          <div style={{ fontSize: "16px", marginTop: "4px" }}>
            TABLE : <b>{data.table_number || "-"}</b>
          </div>
          <div style={{ fontSize: "16px", marginTop: "4px" }}>
            PAX : <b>{data.pax || 0}</b>
          </div>
        </div>
      </div>
    );
  },
);

// Agar tidak error di React DevTools
TicketTemplate.displayName = "TicketTemplate";
