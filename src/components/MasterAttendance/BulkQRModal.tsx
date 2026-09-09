import { useState, useEffect, useRef } from "react";
import { X, Printer, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { guestService } from "../../services/guestService";
import { useReactToPrint } from "react-to-print";

interface BulkQRModalProps {
  onClose: () => void;
}

export default function BulkQRModal({ onClose }: BulkQRModalProps) {
  const [bulkTickets, setBulkTickets] = useState<any[]>([]);
  const [isLoadingBulk, setIsLoadingBulk] = useState(true);

  // 1. Buat Referensi untuk area yang HANYA ingin kita print
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBulkData = async () => {
      try {
        const data = await guestService.getGuestH();
        setBulkTickets(data);
      } catch (error) {
        console.error("Gagal memuat tiket:", error);
        alert("Terjadi kesalahan saat memuat data tiket.");
      } finally {
        setIsLoadingBulk(false);
      }
    };
    fetchBulkData();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "QR_Tickets",
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
    `,
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* HEADER MODAL (Tidak akan ikut terprint karena berada di luar printRef) */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="text-xs font-bold text-slate-900">
              Bulk Generate QR Tickets
            </div>
            <div className="text-[10px] text-slate-500">
              Generating {bulkTickets.length} unique tickets from Master Data.
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* 
          AREA KONTEN (Preview & Target Print) 
          Catatan: Class print:max-h-none dan print:overflow-visible 
          membuka gembok scroll saat dicetak agar halaman 2+ bisa muncul!
        */}
        <div
          ref={printRef}
          className="p-5 bg-slate-50 overflow-y-auto max-h-[60vh] print:max-h-none print:overflow-visible print:bg-white print:p-0"
        >
          {isLoadingBulk ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="text-xs font-semibold">
                Fetching all tickets...
              </span>
            </div>
          ) : bulkTickets.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No tickets found.
            </div>
          ) : (
            // GRID CONTAINER
            // Di layar: auto responsive grid. Di kertas: paksa 4 kolom (print:grid-cols-4)
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 print:grid-cols-4 gap-4">
              {bulkTickets.map((ticket) => (
                // KARTU QR
                // print:break-inside-avoid adalah mantra ajaib agar QR tidak terpotong setengah di halaman
                <div
                  key={ticket.guest_h_id}
                  className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col items-center text-center shadow-sm print:shadow-none print:border-slate-300 print:break-inside-avoid"
                >
                  <QRCodeSVG
                    value={
                      ticket.ticket_code || ticket.ticket_no || "NO-TICKET"
                    }
                    size={100}
                    level="M"
                    className="mb-3"
                  />
                  <div className="text-[12px] font-bold text-slate-900 line-clamp-2 leading-tight min-h-[30px] flex items-center justify-center">
                    {ticket.title ? ticket.title + " " + ticket.name : "Guest"}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1">
                    {ticket.ticket_code || ticket.ticket_no}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER MODAL (Tidak akan ikut terprint) */}
        <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            disabled={isLoadingBulk || bulkTickets.length === 0}
            className="px-5 py-2 bg-black text-white rounded text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 disabled:opacity-50"
          >
            <Printer size={14} /> Print All
          </button>
        </div>
      </div>
    </div>
  );
}
