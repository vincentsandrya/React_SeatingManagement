// src/utils/bluetoothPrinter.ts

let printCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
let bluetoothDevice: BluetoothDevice | null = null;

export const connectBluetoothPrinter = async (): Promise<boolean> => {
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard BLE Print
        '0000ffe0-0000-1000-8000-00805f9b34fb', // Custom BLE (Eppos sering di sini)
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Base printer
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'  // ISSC BLE
      ]
    });

    bluetoothDevice = device;
    const server = await device.gatt?.connect();
    if (!server) throw new Error("Gagal terhubung ke GATT Server");

    const services = await server.getPrimaryServices();
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          printCharacteristic = char;
          
          device.addEventListener('gattserverdisconnected', () => {
            alert("Koneksi Printer Terputus!");
            printCharacteristic = null;
          });

          return true;
        }
      }
    }
    throw new Error("Jalur Print (Characteristic) tidak ditemukan.");
  } catch (error) {
    console.error("Koneksi Error:", error);
    return false;
  }
};

// Pengiriman data menggunakan "Chunking" (Wajib untuk Bluetooth Android)
const sendTextToPrinter = async (text: string) => {
  if (!printCharacteristic) throw new Error("Printer belum terhubung!");

  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const CHUNK_SIZE = 100; // Kirim per 100 byte agar buffer printer tidak crash
  
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    await printCharacteristic.writeValue(chunk);
    await new Promise(resolve => setTimeout(resolve, 50)); // Jeda 50ms
  }
};

export const printStickerTSPL = async (data: any) => {
  if (!printCharacteristic) {
    alert("Koneksikan printer terlebih dahulu!");
    return;
  }

  // Perintah TSPL (Cocok untuk Blueprint & Eppos mode Dual/Label)
  const tsplCommand = 
    `SIZE 50 mm, 30 mm\r\n` +
    `GAP 2 mm, 0 mm\r\n` +
    `CLS\r\n` +
    `TEXT 190,20,"2",0,1,1,1,"Kode: ${data.ticketCode}"\r\n` +
    `BAR 20,45,360,2\r\n` +
    `TEXT 200,60,"3",0,1,1,2,"${data.guestName}"\r\n` +
    `BAR 20,110,360,2\r\n` +
    `TEXT 30,130,"2",0,1,1,1,"TABLE : ${data.tableNumber}"\r\n` +
    `TEXT 30,160,"2",0,1,1,1,"PAX   : ${data.paxCount}"\r\n` +
    `PRINT 1,1\r\n`;

  await sendTextToPrinter(tsplCommand);
};