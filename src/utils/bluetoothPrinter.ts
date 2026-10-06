// src/utils/bluetoothPrinter.ts

/// <reference types="web-bluetooth" />

import { guestService } from "../services/guestService";

// Variabel untuk menyimpan jalur komunikasi ke printer
let printCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

export const connectBluetoothPrinter = async (
  onDisconnect?: () => void,
): Promise<boolean> => {
  try {
    // 1. Request device Bluetooth
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        "000018f0-0000-1000-8000-00805f9b34fb", // Standard BLE Print
        "0000ffe0-0000-1000-8000-00805f9b34fb", // Custom BLE (Eppos)
        "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Base printer
        "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ISSC BLE
      ],
    });

    device.addEventListener("gattserverdisconnected", () => {
      console.warn("Koneksi Printer Terputus!");
      printCharacteristic = null;
      if (onDisconnect) onDisconnect(); // Memanggil callback UI agar tombol reset
    });

    console.log("Device terpilih:", device.name);

    // 2. Konek ke server GATT
    const server = await device.gatt?.connect();
    if (!server) throw new Error("Gagal terhubung ke GATT Server");

    // 3. Cari jalur Service dan Characteristic
    const services = await server.getPrimaryServices();
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          printCharacteristic = char;

          // Listener jika printer tiba-tiba mati / terputus
          device.addEventListener("gattserverdisconnected", () => {
            console.warn("Koneksi Printer Terputus!");
            printCharacteristic = null;
          });

          return true; // Berhasil connect
        }
      }
    }

    throw new Error("Jalur Print (Characteristic) tidak ditemukan.");
  } catch (error) {
    console.error("Koneksi Error:", error);
    return false;
  }
};

// Fungsi pengiriman data menggunakan "Chunking"
const sendTextToPrinter = async (text: string) => {
  if (!printCharacteristic) throw new Error("Printer belum terhubung!");

  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const CHUNK_SIZE = 100; // Kirim per 100 byte

  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    await printCharacteristic.writeValue(chunk);
    await new Promise((resolve) => setTimeout(resolve, 50)); // Jeda 50ms
  }
};

export const printStickerESCPOS = async (
  guest_h_id: string,
  copies: number = 2,
) => {
  if (!printCharacteristic) {
    alert("Koneksikan printer terlebih dahulu!");
    return;
  }

  const data = await guestService.getTicketData(guest_h_id);

  if (!data) {
    alert("Data tiket tidak ditemukan");
    return;
  }

  const ticketCode = data.ticket_code || "-";

  // LOGIC PENAMBAHAN UNTUK GUEST NAME
  let guestName = data.name || "-";

  // 1. Cut/Trim jika lebih dari 60 karakter
  if (guestName.length > 60) {
    guestName = guestName.substring(0, 60);
  }

  // 2. Tambahkan spasi di belakang jika kurang dari 34 karakter
  if (guestName.length < 34) {
    guestName = guestName.padEnd(34, " ");
  }

  // Alternatif kode satu baris (opsional, jika suka yang lebih ringkas):
  // const guestName = (data.name || "-").substring(0, 60).padEnd(34, " ");

  const tableNumber = data.table_number || "-";
  const paxCount = data.pax || 0;
  const customFeed = `\x1B\x4A` + String.fromCharCode(85);

  // Perintah ESC/POS
  const escposCommand =
    `\x1B\x40` + // Initialize printer
    `\x1B\x61\x01` + // Center Align
    `\n` +
    `Kode: ${ticketCode}\n` +
    `--------------------------\n` +
    `\x1B\x61\x00` + // Left Align
    `${guestName}\n` +
    `CAT : ${tableNumber}\n` +
    `PAX : ${paxCount}` +
    customFeed;

  try {
    for (let i = 1; i <= copies; i++) {
      await sendTextToPrinter(escposCommand);

      // Jeda 300ms antar rangkap untuk memberi nafas pada memori printer (opsional tapi sangat disarankan)
      if (copies > 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  } catch (error) {
    console.error("Gagal mengirim perintah print:", error);
    alert("Gagal mencetak. Coba refresh atau reconnect printer.");
  }
};
