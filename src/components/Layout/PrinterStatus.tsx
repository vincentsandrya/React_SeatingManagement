// src/components/PrinterStatus.tsx

import { useState } from "react";
import { Loader2, Printer, PrinterX } from "lucide-react";
import { connectBluetoothPrinter } from "../../utils/bluetoothPrinter";

export const PrinterStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    // Jika sudah konek, tidak perlu melakukan apa-apa saat diklik
    if (isConnected) return;

    setIsConnecting(true);

    // Kita passing callback agar saat printer mati/terputus, state tombol kembali menjadi false
    const success = await connectBluetoothPrinter(() => setIsConnected(false));

    setIsConnected(success);
    setIsConnecting(false);
  };

  return (
    <button
      onClick={handleConnect}
      disabled={isConnected || isConnecting}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all duration-300 ${
        isConnected
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default"
          : "bg-red-50 text-red-700 border-red-200 hover:bg-slate-100 hover:border-slate-300 cursor-pointer shadow-sm"
      }`}
      title={
        isConnected
          ? "Printer Terhubung"
          : "Klik untuk hubungkan printer Bluetooth"
      }
    >
      {isConnecting ? (
        <>
          <Loader2 size={12} className="text-slate-500 animate-spin" />
          <span className="hidden md:block">Connecting...</span>
        </>
      ) : isConnected ? (
        <>
          <Printer size={12} className="text-emerald-500" />
          <span className="hidden md:block">Printer Ready</span>
        </>
      ) : (
        <>
          <PrinterX size={12} className="text-red-500" />
          <span className="hidden md:block">Connect Printer</span>
        </>
      )}
    </button>
  );
};
