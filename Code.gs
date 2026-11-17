/**
 * Kuesioner QA/QC CBCT — Integrasi Google Sheets (Google Apps Script)
 * =====================================================================
 * CARA PAKAI (ringkas — langkah lengkap ada di README-INTEGRASI-GOOGLE-SHEETS.md):
 *   1. Buat spreadsheet baru di Google Sheets, salin Spreadsheet ID dari URL-nya
 *      (bagian di antara /d/ dan /edit).
 *   2. Di spreadsheet itu: Extensions > Apps Script, hapus isi Code.gs bawaan,
 *      paste file ini, lalu ganti PASTE_SPREADSHEET_ID_DI_SINI di bawah.
 *   3. Save, lalu jalankan setupSheets() SATU KALI (beri izin saat diminta).
 *   4. Deploy > New deployment > Web app. Execute as: Me.
 *      Who has access: Anyone. Deploy, lalu salin Web App URL-nya.
 *   5. Paste Web App URL itu ke sheets-config.js (PASTE_WEB_APP_URL_DI_SINI).
 *
 * TIDAK PERLU API KEY GOOGLE. Yang dipaste hanya Spreadsheet ID (di sini)
 * dan Web App URL (di sheets-config.js). Jangan membagikan Web App URL ke
 * publik sembarangan — siapa pun yang punya URL itu bisa mengirim jawaban.
 */

// ============================================================================
// ★ TEMPAT PASTE 1 — SPREADSHEET ID ★
// Salin dari URL spreadsheet: https://docs.google.com/spreadsheets/d/<ID INI>/edit
// ============================================================================
const SPREADSHEET_ID = "1akFtgZNnyB5CIjzonBAyNUSEUk9QmJSFCTI5IohZ_Bo";

const SHEET_RSDK = "Hasil_RSDK";
const SHEET_RSGM = "Hasil_RSGM";
const SHEET_REKAP = "Rekap";

const KODES = ["0-07", "A-01", "A-02", "A-03", "B-01", "B-04", "C-01", "C-02", "C-07", "C-08", "C-10", "C-12", "D-01", "D-04", "E-01", "F-05", "G-01", "H-06", "I-05", "J-01", "J-03", "K-01", "K-02", "K-04"];

// Header kolom: 6 meta + 24 teks butir + 24 kode normalisasi (*_kode) + Bukti.
const HEADERS = ["Timestamp", "Fasilitas", "Nama_Responden", "Jabatan_Peran", "No_HP_Email", "Status_Pengiriman"]
  .concat(KODES)
  .concat(KODES.map(function (k) { return k + "_kode"; }))
  .concat(["Bukti_Utama"]);

// Bagian kuesioner + rentang kolomnya (untuk rumus Rekap).
const SECTIONS = [{"bagian": "0", "nama": "^Bagian 0 — Identitas responden, fasilitas, dan verifikasi alat", "awal": "G", "akhir": "G", "jumlah": 1}, {"bagian": "A", "nama": "^Bagian A — Tata kelola program QA/QC CBCT", "awal": "H", "akhir": "J", "jumlah": 3}, {"bagian": "B", "nama": "^Bagian B — Jadwal, frekuensi pengujian, dan pemisahan sumber bukti", "awal": "K", "akhir": "L", "jumlah": 2}, {"bagian": "C", "nama": "^Bagian C — Phantom: ketersediaan, riwayat, dan alternatif yang sah tanpa phantom", "awal": "M", "akhir": "R", "jumlah": 6}, {"bagian": "D", "nama": "^Bagian D — Kualitas citra CBCT", "awal": "S", "akhir": "T", "jumlah": 2}, {"bagian": "E", "nama": "^Bagian E — Keluaran radiasi dan dosimetri khusus CBCT", "awal": "U", "akhir": "U", "jumlah": 1}, {"bagian": "F", "nama": "^Bagian F — Kalibrasi alat ukur", "awal": "V", "akhir": "V", "jumlah": 1}, {"bagian": "G", "nama": "^Bagian G — Keselamatan, mekanik, dan lingkungan", "awal": "W", "akhir": "W", "jumlah": 1}, {"bagian": "H", "nama": "^Bagian H — Protokol klinis dan optimasi (ALADAIP)", "awal": "X", "akhir": "X", "jumlah": 1}, {"bagian": "I", "nama": "^Bagian I — Dokumentasi, penilaian hasil, dan tindak lanjut", "awal": "Y", "akhir": "Y", "jumlah": 1}, {"bagian": "J", "nama": "^Bagian J — Kendala, sumber daya, dan kebutuhan perbaikan", "awal": "Z", "akhir": "AA", "jumlah": 2}, {"bagian": "K", "nama": "^Bagian K — Validasi responden dan kesediaan menerapkan hasil penelitian", "awal": "AB", "akhir": "AD", "jumlah": 3}];

const LAST_DATA_ROW = 1000; // rumus Rekap membaca baris 2..1000

/**
 * kodeDariTeks — ekstrak kode normalisasi (Y/T/BDD/TB/M-x/PPR) dari teks
 * jawaban yang tersimpan. Hanya menerima token awalan yang presisi (word
 * boundary) supaya "Tidak termasuk..." tidak salah dianggap T.
 */
function kodeDariTeks(t) {
  t = String(t || "").trim();
  if (!t) return "";
  var m = t.match(/^(Y|T|BDD|TB|M-\d|PPR)\b/i);
  if (m) return m[1].toUpperCase();
  var u = t.toUpperCase();
  if (u === "YA") return "Y";
  if (u === "TIDAK") return "T";
  if (u === "BELUM DIKETAHUI") return "BDD";
  if (u === "TIDAK BERLAKU") return "TB";
  if (u === "PETUGAS PROTEKSI RADIASI" || u.indexOf("PPR") >= 0) return "PPR";
  var mm = u.match(/^KELAS (M-\d)$/);
  if (mm) return mm[1];
  return "";
}

// ---------------------------------------------------------------------------
// doGet — cek endpoint hidup atau tidak. Buka Web App URL di browser:
// harus menampilkan {"ok":true,"message":"Kuesioner QA/QC CBCT endpoint aktif"}
// ---------------------------------------------------------------------------
function doGet(e) {
  return jsonOut({ ok: true, version: "schema-c-2kolom-v2", kolom: HEADERS.length, message: "Kuesioner QA/QC CBCT endpoint aktif" });
}

// ---------------------------------------------------------------------------
// doPost — terima satu pengiriman kuesioner.
// Payload JSON yang diharapkan:
//   {
//     "facility": "RSDK" | "RSGM",
//     "timestamp": "2026-11-12T10:00:00+07:00",   // boleh dikosongkan
//     "respondent": { "nama": "...", "jabatan": "...", "kontak": "..." },
//     "answers":   { "0-01": "RSDK", "A-01": "Y", "D-07": "BDD", ... },
//     "evidence":  { "A-01": "SOP No. ...", "D-07": "LHU ...", ... },
//     "status": "Terkirim"                          // boleh dikosongkan
//   }
// Mengembalikan JSON {ok:true, sheet:"Hasil_RSDK", row: 2}.
// ---------------------------------------------------------------------------
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ ok: false, error: "Body JSON kosong." });
    }
    const payload = JSON.parse(e.postData.contents);
    const facility = String(payload.facility || "").toUpperCase().trim();
    if (facility !== "RSDK" && facility !== "RSGM") {
      return jsonOut({ ok: false, error: "facility harus RSDK atau RSGM." });
    }
    const sheetName = facility === "RSDK" ? SHEET_RSDK : SHEET_RSGM;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    ensureHeaders(sheet);

    const answers = payload.answers || {};
    const evidence = payload.evidence || {};
    const respondent = payload.respondent || {};
    const timestamp = payload.timestamp
      ? new Date(payload.timestamp)
      : new Date();

    const row = [];
    row.push(timestamp);                       // Timestamp
    row.push(facility);                        // Fasilitas
    row.push(respondent.nama || "");           // Nama_Responden
    row.push(respondent.jabatan || "");        // Jabatan_Peran
    row.push(respondent.kontak || "");         // No_HP_Email
    row.push(payload.status || "Terkirim");    // Status_Pengiriman
    // 24 kolom teks butir.
    KODES.forEach(function (k) {
      const v = answers[k];
      row.push(v === undefined || v === null ? "" : String(v));
    });
    // 24 kolom kode normalisasi (Y/T/BDD/TB/M-x/PPR).
    KODES.forEach(function (k) {
      row.push(kodeDariTeks(answers[k]));
    });
    // Kolom Bukti_Utama: gabungan bukti per butir sebagai teks "KODE: bukti; ..."
    const buktiParts = [];
    Object.keys(evidence).sort().forEach(function (k) {
      if (evidence[k] !== undefined && evidence[k] !== null && String(evidence[k]).trim() !== "") {
        buktiParts.push(k + ": " + String(evidence[k]));
      }
    });
    row.push(buktiParts.join("; "));

    sheet.appendRow(row);
    try { buildRekap(ss.getSheetByName(SHEET_REKAP)); } catch (e) { Logger.log("rekap refresh: " + e.message); }
    const savedRow = sheet.getLastRow();
    return jsonOut({ ok: true, sheet: sheetName, row: savedRow });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

// ---------------------------------------------------------------------------
// setupSheets — jalankan SATU KALI dari editor Apps Script (tombol Run).
// Membuat 3 sheet bila belum ada, menulis header, membekukan baris header,
// dan mengisi sheet Rekap dengan rumus COUNTIF/COUNTA/COUNTBLANK.
// ---------------------------------------------------------------------------
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  [SHEET_RSDK, SHEET_RSGM].forEach(function (name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    ensureHeaders(sheet);
  });

  let rekap = ss.getSheetByName(SHEET_REKAP);
  if (!rekap) {
    rekap = ss.insertSheet(SHEET_REKAP);
  }
  buildRekap(rekap);
}

/**
 * resetSheets — bersihkan & bangun ulang 3 sheet (Hasil_RSDK, Hasil_RSGM,
 * Rekap) dari nol. Pakai sekali setelah deploy Code.gs baru buat menghapus
 * sisa schema lama (140 kolom) dan menyusun ulang format terkini.
 */
function resetSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  [SHEET_RSDK, SHEET_RSGM].forEach(function (name) {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    sh.clear();
    try { ensureHeaders(sh); } catch (e) { Logger.log("ensureHeaders " + name + ": " + e.message); }
  });
  let rekap = ss.getSheetByName(SHEET_REKAP);
  if (!rekap) rekap = ss.insertSheet(SHEET_REKAP);
  rekap.clear();
  try { buildRekap(rekap); } catch (e) { Logger.log("buildRekap: " + e.message); }
}

/**
 * normalizeColumns — paksa jumlah kolom sheet pas = HEADERS.length.
 * Buang kolom surplus (sisa schema lama) atau tambah bila kurang.
 * Dipanggil dari ensureHeaders setiap kali, jadi format selalu konsisten.
 */
function normalizeColumns(sheet) {
  const target = HEADERS.length;
  const cur = sheet.getLastColumn();
  if (cur < target) {
    const start = Math.max(cur, 1);
    sheet.insertColumnsAfter(start, target - cur);
  } else if (cur > target) {
    sheet.deleteColumns(target + 1, cur - target);
  }
}

function ensureHeaders(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } else {
    const existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    const same = existing.every(function (v, i) { return String(v) === HEADERS[i]; });
    if (!same) {
      // Header baris 1 beda dari HEADERS canonical (mis. sisa schema lama 140 kolom).
      // Sumber kebenaran ada di kode: timpa baris 1 dengan HEADERS.
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }
  }
  normalizeColumns(sheet);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#dcebf5");
}

function buildRekap(rekap) {
  const title = "Rekap Hasil Kuesioner QA/QC CBCT — hitung otomatis (hanya sel yang persis berisi Y / T / BDD / TB)";
  const header = ["Fasilitas", "Bagian", "Jumlah Butir", "Y", "T", "BDD", "TB", "Terisi", "Kosong"];
  const rows = [];
  rows.push([title, "", "", "", "", "", "", "", ""]);
  rows.push(header);

  function groupSections() {
    const map = {};
    KODES.forEach(function (k) {
      const b = k.split("-")[0];
      if (!map[b]) map[b] = [];
      map[b].push(k);
    });
    const nameMap = {};
    SECTIONS.forEach(function (s) { nameMap[s.bagian] = String(s.nama).replace(/^\^?Bagian \w+ — /, ""); });
    return Object.keys(map).sort().map(function (b) {
      return { bagian: b, kodes: map[b], nama: nameMap[b] || ("Bagian " + b) };
    });
  }

  function countCols(sheet, colIdx) {
    let y = 0, t = 0, b = 0, tb = 0, filled = 0, blank = 0;
    if (!sheet) return [y, t, b, tb, filled, blank];
    const last = sheet.getLastRow();
    if (last < 2) return [y, t, b, tb, filled, blank];
    const vals = sheet.getRange(2, colIdx, last - 1, 1).getValues();
    vals.forEach(function (r) {
      const s = String(r[0]).trim().toUpperCase();
      if (s === "Y") y++;
      else if (s === "T") t++;
      else if (s === "BDD") b++;
      else if (s === "TB") tb++;
      if (s !== "") filled++; else blank++;
    });
    return [y, t, b, tb, filled, blank];
  }

  const sections = groupSections();

  const totals = { RSDK: [0, 0, 0, 0, 0, 0], RSGM: [0, 0, 0, 0, 0, 0] };

  ["RSDK", "RSGM"].forEach(function (facility) {
    const sheetName = facility === "RSDK" ? SHEET_RSDK : SHEET_RSGM;
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
    sections.forEach(function (sec) {
      let acc = [0, 0, 0, 0, 0, 0];
      sec.kodes.forEach(function (k) {
        const colIdx = HEADERS.indexOf(k + "_kode") + 1;
        const h = countCols(sheet, colIdx);
        for (let c = 0; c < 6; c++) acc[c] += h[c];
      });
      rows.push([facility, sec.nama, sec.kodes.length, acc[0], acc[1], acc[2], acc[3], acc[4], acc[5]]);
      const tt = totals[facility];
      for (let c = 0; c < 6; c++) tt[c] += acc[c];
    });
  });

  ["RSDK", "RSGM"].forEach(function (facility) {
    const tt = totals[facility];
    rows.push([
      facility, "TOTAL (semua bagian)",
      tt[0] + tt[1] + tt[2] + tt[3],
      tt[0], tt[1], tt[2], tt[3], tt[4], tt[5]
    ]);
  });

  rows.push(["Catatan: kolom *_kode menyimpan kode normalisasi (Y/T/BDD/TB/M-x/PPR) hasil ekstraksi otomatis dari teks jawaban. Teks asli responden tersimpan di kolom butir.", "", "", "", "", "", "", "", ""]);
  rows.push(["Catatan: jawaban terbuka/angka/skala 1-5 tanpa kode tidak masuk hitungan Y/T/BDD/TB — lihat sheet Hasil_RSDK / Hasil_RSGM.", "", "", "", "", "", "", "", ""]);

  rekap.clear();
  rekap.getRange(1, 1, rows.length, header.length).setValues(rows);
  rekap.getRange(1, 1, 1, header.length).setFontWeight("bold").setBackground("#fff2cc");
  rekap.getRange(2, 1, 1, header.length).setFontWeight("bold").setBackground("#dcebf5");
  rekap.setFrozenRows(2);
  rekap.setColumnWidth(2, 320);
}

// ---------------------------------------------------------------------------
// Util: kembalikan JSON lewat ContentService.
// Catatan jujur soal CORS: Apps Script Web App tidak menyediakan header
// CORS yang bisa dibaca penuh oleh browser. Karena itu klien (sheets-config.js)
// mengirim dengan mode "no-cors" + Content-Type text/plain agar request
// tidak kena preflight, dan menganggap terkirim bila tidak ada error jaringan.
// Verifikasi akhir SELALU dengan melihat baris baru di sheet Hasil_*.
// ---------------------------------------------------------------------------
function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
