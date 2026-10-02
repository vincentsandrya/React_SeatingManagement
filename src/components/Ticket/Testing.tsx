// src/components/PrintTicketButton.tsx

import { useState } from "react";
import {
  connectBluetoothPrinter,
  printStickerTSPL,
} from "../../utils/bluetoothPrinter";

export const PrintTicketManager = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Fungsi saat awal menyambungkan
  const handleConnect = async () => {
    const success = await connectBluetoothPrinter();
    if (success) {
      setIsConnected(true);
      alert("Printer berhasil terhubung!");
    } else {
      alert("Gagal terhubung ke printer.");
    }
  };

  // Fungsi simulasi saat tamu check-in
  const handlePrint = async () => {
    setIsPrinting(true);

    const dummyData = {
      ticketCode: "GUEST-001",
      guestName: "Bpk. John Doe",
      tableNumber: "VIP 12",
      paxCount: 4,
    };

    await printStickerTSPL(dummyData);
    setIsPrinting(false);
  };

  return (
    <div
      style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}
    >
      <h3>Panel Label Printer</h3>

      {/* Indikator Status */}
      <div style={{ marginBottom: "15px" }}>
        Status Printer:{" "}
        <span
          style={{ color: isConnected ? "green" : "red", fontWeight: "bold" }}
        >
          {isConnected ? "🟢 Terhubung" : "🔴 Terputus"}
        </span>
      </div>

      {/* Tombol Koneksi - Ditekan di awal acara */}
      {!isConnected && (
        <button
          onClick={handleConnect}
          style={{
            padding: "10px 20px",
            background: "#007bff",
            color: "white",
            marginRight: "10px",
          }}
        >
          🔍 Hubungkan Printer Bluetooth
        </button>
      )}

      {/* Tombol Cetak - Ditekan setiap ada tamu check-in */}
      {isConnected && (
        <button
          onClick={handlePrint}
          disabled={isPrinting}
          style={{
            padding: "10px 20px",
            background: "#28a745",
            color: "white",
          }}
        >
          {isPrinting ? "Mencetak..." : "🖨️ Cetak Stiker Tamu"}
        </button>
      )}
    </div>
  );
};
