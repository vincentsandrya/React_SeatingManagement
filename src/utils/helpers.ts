// src/utils/helpers.ts

/**
 * Menghitung selisih waktu dari sekarang
 * Output: "Just now", "5 minutes ago", "2 hours ago", dll.
 */
export const timeAgo = (dateInput: string | Date | null): string => {
  if (!dateInput) return '-';
  
  const date = new Date(dateInput);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  // Jika waktu kurang dari 60 detik
  if (seconds < 60) return 'Just now';

  let interval = seconds / 31536000; // Hitung Tahun
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000; // Hitung Bulan
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400; // Hitung Hari
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600; // Hitung Jam
  if (interval >= 1) {
    const hrs = Math.floor(interval);
    return hrs === 1 ? '1 hour ago' : `${hrs} hours ago`;
  }
  
  interval = seconds / 60; // Hitung Menit
  if (interval >= 1) {
    const mins = Math.floor(interval);
    return mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
  }
  
  return 'Just now';
};

/**
 * Memformat string tanggal menjadi waktu AM/PM
 * Output: "09:42 AM" (Sesuai desain mock-up Anda)
 */
export const formatTime = (dateInput: string | Date | null): string => {
  if (!dateInput) return '-';
  
  const date = new Date(dateInput);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * (Opsional) Memformat string menjadi tanggal yang mudah dibaca
 * Output: "July 29, 2026"
 */
export const formatDate = (dateInput: string | Date | null): string => {
  if (!dateInput) return '-';
  
  const date = new Date(dateInput);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};