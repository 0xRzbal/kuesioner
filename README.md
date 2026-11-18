# Kuesioner QA/QC CBCT — v3

Aplikasi web untuk kuesioner 24 butir QA/QC CBCT di fasilitas RSDK dan RSGM.
Antarmuka menggunakan Svelte + TypeScript; server HTTP Node menyajikan halaman
dan aset hasil build. Jawaban dikirim ke Google Sheets melalui Apps Script.

Live: https://questioners.hasiana.web.id/

## Struktur

- `src/` — Svelte UI, data 24 butir, validasi, autosave, dan Sheets client.
- `server/server.ts` — server Node tanpa dependensi runtime.
- `Code.gs` — endpoint Google Apps Script untuk Google Sheets.
- `README-INTEGRASI-GOOGLE-SHEETS.md` — skema dan deployment Apps Script.
- `headers-hasil-kuesioner.csv` — daftar kolom hasil.

## Build dan tes

```bash
npm ci
npm test
npm run check
npm run build
npm start
```

`npm start` melayani `127.0.0.1:8080` secara default. Atur `PORT` dan `HOST`
melalui environment bila perlu. Build menghasilkan `dist/app.js`, `dist/app.css`,
dan `dist-server/server.js`; halaman HTML dirakit server dari string TypeScript.

## Deployment

Systemd menjalankan `dist-server/server.js` sebagai service lokal. Nginx
melakukan reverse proxy ke `http://127.0.0.1:8080` pada domain live. Detail
unit dan reverse proxy ada di konfigurasi server.

## Perilaku kuesioner

- 24 butir terbagi ke 12 bagian; jawaban tersimpan otomatis di perangkat.
- Seluruh butir wajib lengkap sebelum kirim; validasi mengarahkan ke butir pertama yang kosong.
- Nilai jawaban mempertahankan teks terbaca manusia serta kode normalisasi di Apps Script.
- Fitur cetak/PDF dan blok identitas peneliti tidak disediakan di UI.
