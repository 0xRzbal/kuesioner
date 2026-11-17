/**
 * sheets-config.js — Snippet integrasi Google Sheets untuk Kuesioner QA/QC CBCT
 * ============================================================================
 * CARA PAKAI:
 *   1. Tempel SELURUH file ini (atau <script src="sheets-config.js"></script>)
 *      ke index.html versi deploy, sebelum tag penutup </body>.
 *   2. Ganti PASTE_WEB_APP_URL_DI_SINI di bawah dengan Web App URL dari
 *      Apps Script (Deploy > New deployment > Web app). JANGAN hardcode
 *      URL lain — file ini sengaja tidak berisi URL asli apa pun.
 *   3. Panggil kirimHasilKeSheets(data) saat responden menekan "Kirim".
 *      Bentuk `data` sama dengan payload Code.gs:
 *        {
 *          facility: "RSDK" | "RSGM",
 *          timestamp: new Date().toISOString(),
 *          respondent: { nama, jabatan, kontak },
 *          answers:  { "0-01": "...", "A-01": "Y", "D-07": "BDD", ... },
 *          evidence: { "A-01": "SOP No. ...", ... },
 *          status: "Terkirim"
 *        }
 *
 * CATATAN JUJUR SOAL CORS:
 * Apps Script Web App tidak mengembalikan header CORS yang bisa dibaca
 * penuh oleh browser. Karena itu pengiriman memakai mode "no-cors" dengan
 * Content-Type "text/plain" (simple request, tanpa preflight). Responsnya
 * tidak bisa dibaca (opaque) — "Terkirim" di sini berarti request sudah
 * terkirim tanpa error jaringan. Verifikasi akhir: cek baris baru di
 * sheet Hasil_RSDK / Hasil_RSGM. Bila gagal, jawaban tetap tersimpan
 * lokal (localStorage) dan bisa diekspor manual sebagai CSV/JSON.
 */

// ============================================================================
// ★ TEMPAT PASTE 2 — WEB APP URL ★
// Dari Apps Script: Deploy > New deployment > Web app > copy Web App URL.
// Bentuknya: https://script.google.com/macros/s/<ID-DEPLOYMENT>/exec
// ============================================================================
const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbweOo_N1lcLnkqH7pWenvfm4iwVxtQn6U3HTgGNPvDlcF5ZMJvguDexNaDBFsl1SwBMeQ/exec";

const SHEETS_PENDING_KEY = "kuesioner_cbct_pending_sheets";
const SHEETS_STATUS_KEY = "kuesioner_cbct_status_terakhir";

/** Simpan cadangan lokal (dipakai bila pengiriman ke Sheets gagal). */
function simpanCadanganLokal(data) {
  try {
    const pending = JSON.parse(localStorage.getItem(SHEETS_PENDING_KEY) || "[]");
    pending.push({ disimpan_pada: new Date().toISOString(), data });
    localStorage.setItem(SHEETS_PENDING_KEY, JSON.stringify(pending));
    return pending.length;
  } catch (e) {
    return 0;
  }
}

/** Ambil daftar pengiriman yang masih menunggu (gagal terkirim). */
function ambilAntrianTertunda() {
  try {
    return JSON.parse(localStorage.getItem(SHEETS_PENDING_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

/**
 * Kirim satu hasil kuesioner ke Google Sheets.
 * Mengembalikan Promise<{ ok, status, pesan }> dengan status:
 *   "Terkirim ke Sheets" — request terkirim tanpa error jaringan
 *                          (verifikasi di sheet; lihat catatan CORS di atas).
 *   "Gagal — tersimpan lokal" — fetch gagal; data sudah dicadangkan di
 *                          localStorage dan tetap bisa diekspor CSV/JSON.
 *   "Belum dikonfigurasi" — SHEETS_WEB_APP_URL masih placeholder.
 */
async function kirimHasilKeSheets(data) {
  const belumDikonfigurasi =
    !SHEETS_WEB_APP_URL ||
    SHEETS_WEB_APP_URL.indexOf("PASTE_WEB_APP_URL_DI_SINI") !== -1;

  if (belumDikonfigurasi) {
    simpanCadanganLokal(data);
    const hasil = {
      ok: false,
      status: "Belum dikonfigurasi",
      pesan: "Pengiriman belum aktif. Jawaban tersimpan di perangkat ini, silakan coba lagi nanti.",
    };
    try { localStorage.setItem(SHEETS_STATUS_KEY, JSON.stringify(hasil)); } catch (e) {}
    return hasil;
  }

  const payload = {
    facility: data.facility,
    timestamp: data.timestamp || new Date().toISOString(),
    respondent: data.respondent || {},
    answers: data.answers || {},
    evidence: data.evidence || {},
    status: data.status || "Terkirim",
  };

  try {
    await fetch(SHEETS_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const hasil = {
      ok: true,
      status: "Terkirim ke Sheets",
      pesan: "Jawaban kamu sudah terkirim. Terima kasih sudah mengisi!",
    };
    try { localStorage.setItem(SHEETS_STATUS_KEY, JSON.stringify(hasil)); } catch (e) {}
    return hasil;
  } catch (err) {
    simpanCadanganLokal(data);
    const hasil = {
      ok: false,
      status: "Gagal — tersimpan lokal",
      pesan: "Gagal terkirim ke Sheets (" + (err && err.message ? err.message : "error jaringan") + "). Jawaban tersimpan di perangkat ini, silakan coba kirim ulang.",
    };
    try { localStorage.setItem(SHEETS_STATUS_KEY, JSON.stringify(hasil)); } catch (e) {}
    return hasil;
  }
}

/**
 * Coba kirim ulang semua yang tertunda di localStorage.
 * Mengembalikan jumlah yang dicoba dikirim ulang.
 */
async function kirimUlangAntrianTertunda() {
  const pending = ambilAntrianTertunda();
  let terkirim = 0;
  for (const item of pending) {
    const r = await kirimHasilKeSheets(item.data);
    if (r.ok) terkirim++;
  }
  if (terkirim === pending.length) {
    try { localStorage.removeItem(SHEETS_PENDING_KEY); } catch (e) {}
  }
  return terkirim;
}

// Ekspos ke window supaya bisa dipakai dari index.html.
if (typeof window !== "undefined") {
  window.KuesionerSheets = {
    kirimHasilKeSheets,
    kirimUlangAntrianTertunda,
    ambilAntrianTertunda,
    simpanCadanganLokal,
    SHEETS_WEB_APP_URL,
  };
}

// Contoh pemakaian di index.html (hapus komentar bila dipakai):
// document.getElementById("btn-kirim").addEventListener("click", async () => {
//   const data = kumpulkanJawabanKuesioner(); // fungsi di index.html: {facility, respondent, answers, evidence}
//   const hasil = await kirimHasilKeSheets(data);
//   tampilkanStatus(hasil.status + " — " + hasil.pesan);
// });
