# Kuesioner QA/QC CBCT

Instrumen penelitian 24 butir untuk menilai program QA/QC CBCT di dua fasilitas
radiologi (RSDK dan RSGM). Aplikasi web statis, tanpa backend sendiri: jawaban
dikirim ke Google Sheets lewat Apps Script Web App.

Live: https://questioners.hasiana.web.id/

## Struktur repo

| Path | Isi |
|---|---|
| `v2/` | Versi aktif - Svelte 5 + Vite (source + build) |
| `v2/src/lib/items.json` | 24 butir instrumen (pertanyaan, opsi, kode jawaban) |
| `v2/src/lib/config.ts` | Konfigurasi tampilan (tujuan penelitian) |
| `v2/src/lib/sheets.ts` | Pengiriman payload ke Apps Script Web App |
| `v2/dist/` | Hasil build, dipakai untuk deploy ke nginx |
| `v1/` | Versi lama single-file HTML (arsip) |

## Versi aktif (v2)

Alur: pilih fasilitas -> identitas -> isi per butir (satu butir per halaman,
auto-save localStorage) -> tinjau -> kirim.

Karakteristik:

- Setiap butir wajib terisi. Tombol kirim memeriksa kelengkapan dan
  mengarahkan ke butir kosong pertama.
- Butir multi-grup (mis. skala 1-5 plus status pemeriksaan) dianggap lengkap
  hanya jika semua grup terisi.
- Jawaban disimpan dua lapis: teks yang dibaca manusia dan kode ternormalisasi
  (untuk rekap).
- Tidak ada fitur cetak/PDF dan tidak ada blok "Tentang penelitian" di UI.

## Build

```bash
cd v2
npm install
npm test
npm run build      # hasil di v2/dist
```

Deploy: salin isi `v2/dist/` ke webroot nginx (`/var/www/questioners/`),
pertahankan `sheets-config.js` bila memakai build lama.

## Backend Google Sheets

Apps Script Web App (`Code.gs`) menerima POST JSON:

```json
{
  "facility": "RSDK",
  "answers": { "0-07": "Ya, rutin", "A-01": "Ya, tertulis" },
  "evidence": {},
  "respondent": { "nama": "...", "jabatan": "...", "kontak": "..." },
  "status": "Terkirim"
}
```

- Baris ditulis ke tab `Hasil_RSDK` atau `Hasil_RSGM`, 55 kolom
  (teks + `<kode>_kode`).
- `buildRekap()` menghitung ulang tab `Rekap` setelah setiap submit.
- `doGet` mengembalikan status endpoint dan skema versi.

## Catatan operasional

- Jangan mengandalkan format nomor lokal untuk rumus spreadsheet; rekap
  dihitung sebagai nilai di Apps Script.
- Cache dikendalikan lewat header nginx `no-cache` dan query `?v=` pada aset.
