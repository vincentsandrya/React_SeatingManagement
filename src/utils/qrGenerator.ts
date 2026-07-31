import QRCode from 'qrcode';
import JSZip from 'jszip';
import type { GuestH } from '../types/database.types';

export const generateBulkQrZip = async (
  guests: GuestH[],
  onProgress?: (current: number, total: number) => void
): Promise<Blob> => {
  const zip = new JSZip();
  const folder = zip.folder('QR_Codes_Guests');

  let completed = 0;
  const total = guests.length;

  for (const guest of guests) {
    // Generate QR Code Data URL (High Resolution)
    const qrDataUrl = await QRCode.toDataURL(guest.ticket_code, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
    });

    // Extract Base64
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    
    // Format File Name: NamaTamu_Meja_Bangku.png
    const sanitizedName = guest.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${sanitizedName}.png`;

    folder?.file(fileName, base64Data, { base64: true });

    completed++;
    if (onProgress) {
      onProgress(completed, total);
    }
  }

  // Generate Compressed ZIP Blob
  return await zip.generateAsync({ type: 'blob' });
};