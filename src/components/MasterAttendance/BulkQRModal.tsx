import { useState, useEffect } from "react";
import { X, Printer, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { guestService } from "../../services/guestService";

interface BulkQRModalProps {
  onClose: () => void;
}

export default function BulkQRModal({ onClose }: BulkQRModalProps) {
  const [bulkTickets, setBulkTickets] = useState<any[]>([]);
  const [isLoadingBulk, setIsLoadingBulk] = useState(true);

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

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
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

        <div className="p-5 bg-slate-50 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 overflow-y-auto print-grid">
          {isLoadingBulk ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="text-xs font-semibold">
                Fetching all tickets...
              </span>
            </div>
          ) : bulkTickets.length === 0 ? (
            <div className="col-span-full text-center py-8 text-xs text-slate-500">
              No tickets found.
            </div>
          ) : (
            bulkTickets.map((ticket) => (
              <div
                key={ticket.guest_h_id}
                className="bg-white p-3 rounded border border-slate-200 flex flex-col items-center text-center shadow-sm"
              >
                <QRCodeSVG
                  value={ticket.ticket_code || ticket.ticket_no || "NO-TICKET"}
                  size={80}
                  className="mb-2"
                />
                <div className="text-[11px] font-bold text-slate-900 line-clamp-1">
                  {ticket.title ? ticket.title + " " + ticket.name : "Guest"}
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  {ticket.ticket_code || ticket.ticket_no}
                </div>
              </div>
            ))
          )}
        </div>

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
