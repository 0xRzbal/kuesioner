/**
 * Pengiriman ke Google Sheets via Apps Script Web App — kontrak sama dengan v1
 * (sheets-config.js + Code.gs), termasuk batasan jujurnya: mode no-cors membuat
 * respons tidak dapat dibaca, jadi "Terkirim" = request terkirim tanpa error
 * jaringan. Verifikasi akhir tetap: baris baru muncul di sheet hasil.
 * Pengiriman yang gagal disimpan sebagai antrean lokal dan dapat dikirim ulang.
 */
import { wibStamp } from './waktu';

export const SHEETS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbweOo_N1lcLnkqH7pWenvfm4iwVxtQn6U3HTgGNPvDlcF5ZMJvguDexNaDBFsl1SwBMeQ/exec';

const PENDING_KEY = 'kuesioner_cbct_pending_sheets';
export const SUBMITTED_KEY = 'kuesioner_cbct_submitted_v1';
export const DRAFT_KEY = 'kuesioner_cbct_draft_v3';

export interface Payload {
  facility: string; timestamp: string;
  respondent: { nama: string; jabatan: string; kontak: string };
  answers: Record<string, string>; evidence: Record<string, string>; status: string;
}
export interface SendResult { ok: boolean; status: string; pesan: string }

export function pendingCount(): number {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]').length; } catch { return 0; }
}
function queuePending(data: Payload) {
  try {
    const p = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    p.push({ disimpan_pada: wibStamp(), data });
    localStorage.setItem(PENDING_KEY, JSON.stringify(p));
  } catch { /* penyimpanan penuh — abaikan */ }
}

export async function sendToSheets(data: Payload): Promise<SendResult> {
  try {
    await fetch(SHEETS_WEB_APP_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    try { localStorage.setItem(SUBMITTED_KEY, JSON.stringify({ at: new Date().toISOString(), atWib: wibStamp(), fac: data.facility, nama: data.respondent.nama })); } catch { /* abaikan */ }
    return { ok: true, status: 'Terkirim ke Sheets', pesan: 'Jawaban sudah terkirim kepada peneliti. Terima kasih atas partisipasi Bapak/Ibu.' };
  } catch (e) {
    queuePending(data);
    return { ok: false, status: 'Belum terkirim', pesan: 'Koneksi bermasalah sehingga jawaban belum terkirim. Jawaban tersimpan aman di perangkat ini — gunakan tombol Kirim Ulang pada halaman Tinjau. (' + String(e) + ')' };
  }
}

export async function retryPending(): Promise<number> {
  let list: any[] = [];
  try { list = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch { return 0; }
  const sisa: any[] = [];
  for (const item of list) {
    try {
      await fetch(SHEETS_WEB_APP_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(item.data) });
    } catch { sisa.push(item); }
  }
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(sisa)); } catch { /* abaikan */ }
  return list.length - sisa.length;
}
