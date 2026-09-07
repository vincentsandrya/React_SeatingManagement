import { X, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { GuestView } from "../../types/database.types";

interface IndividualQRModalProps {
  guest: GuestView;
  onClose: () => void;
}

export default function IndividualQRModal({
  guest,
  onClose,
}: IndividualQRModalProps) {
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <div className="text-xs font-bold text-slate-900">Guest QR Code</div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-6 flex flex-col items-center justify-center bg-slate-50">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 mb-3">
            <QRCodeSVG
              value={guest.ticket_code || "NO-TICKET"}
              size={160}
              level="H"
            />
          </div>
          <div className="text-sm font-bold text-slate-900">
            {guest.title} {guest.name}
          </div>
          <div className="text-xs font-mono text-slate-500 mt-1">
            {guest.ticket_code || "NO-TICKET"}
          </div>
        </div>
        <div className="p-4 bg-white border-t border-slate-100">
          <button
            onClick={handlePrint}
            className="w-full bg-black text-white py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-800"
          >
            <Printer size={14} /> Print Badge
          </button>
        </div>
      </div>
    </div>
  );
}
