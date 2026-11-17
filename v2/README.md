# Kuesioner QA/QC CBCT — v2 (Svelte + TypeScript)

Rombakan penuh dari v1 (satu file `index.html`). v1 tetap dipertahankan di root repo
sebagai cadangan; v2 hidup di folder ini dan **tidak mengubah format data** —
payload ke Google Sheets/`Code.gs` identik, sehingga backend tidak perlu diubah.

## Kenapa stack ini

| Aspek | v1 | v2 |
|---|---|---|
| Bentuk source | 1 file HTML, CSS+JS+data campur (±58 KB) | Komponen **Svelte** + **TypeScript**, data terpisah sebagai JSON |
| Data butir | Tertanam sebagai string di tengah script | `src/lib/items.json` (24 butir) — edit butir tanpa menyentuh kode |
| Logika | Fungsi global di satu script | `src/lib/engine.ts` (parser/formatter/validasi, bertipe) + `src/lib/store.ts` + `src/lib/sheets.ts` |
| Kontrak Sheets | Implisit | Interface `Payload` di `sheets.ts` — salah bentuk = error saat kompilasi |
| Pengujian | Manual | `npm test` (uji engine) + `npm run check` (svelte-check, 0 error) |
| Hasil build | — | Statis murni ±36 KB gzip (JS+CSS), disajikan nginx apa adanya |

TypeScript dipilih karena kontrak datanya ketat (kode butir ↔ kolom Sheets ↔ parser
`Code.gs`) dan instrumen ini akan direvisi berkali-kali mengikuti masukan dosen:
kesalahan bentuk data tertangkap saat kompilasi, bukan setelah responden mengisi.

## Struktur

```
src/
  main.ts                  titik masuk (cangkang index.html hanya ±10 baris)
  App.svelte               alur langkah, navigasi, kirim, drawer, pintasan keyboard
  app.css                  seluruh gaya (port dari v1 rombakan, tanpa emoji/confetti)
  components/
    Landing.svelte         pengantar formal: tujuan, identitas (CONFIG), consent, legenda
    Who.svelte             identitas responden
    SectionIntro.svelte    pengantar bagian + daftar pertanyaan
    Question.svelte        satu butir: grup pilihan/field/skala, bukti, K4 consent
    Review.svelte          tinjau & ringkasan jawaban per bagian
    AllView.svelte         mode Baca Semua + blanko cetak/PDF
  lib/
    config.ts              ★ IDENTITAS PENELITI — WAJIB DIISI sebelum dibagikan
    items.json             data 24 butir (ekstrak persis dari v1)
    engine.ts              parser butir, fmt(), complete(), expand() — format keluaran sama dengan v1
    store.ts               state + autosave localStorage + aturan toggle (maks. 3 untuk K-02)
    sheets.ts              kirim ke Apps Script (no-cors, antrean lokal bila gagal, kunci kirim ganda)
test-engine.mjs            uji engine: 24 butir × (fmt/complete) + kasus audit C-10/B-01/K-02
```

## Menjalankan

```bash
npm install
npm run dev        # pengembangan (hot reload)
npm test           # uji engine
npm run check      # type-check (harus 0 error)
npm run build      # hasil produksi di dist/
```

## Deploy

Sama seperti v1, hanya sumbernya kini folder `dist/` hasil build:

```bash
npm run build
rsync -a dist/ /var/www/questioners/   # index.html + assets/
```

Tidak ada server Node di produksi; nginx menyajikan file statis seperti biasa.

## Fitur yang dipertahankan dari v1 rombakan

Landing formal + consent + legenda Y/T/BDD/TB/★, penjelasan penomoran (24 dari bank
140 butir), mode Baca Semua & cetak PDF, ringkasan tinjau yang sesungguhnya, kunci
anti kirim-ganda setelah terkirim, validasi multi-bagian (`complete()`), skala B1
berlabel, C-10 sebagai 3 kolom urutan, K-02 maksimal 3, kolom bukti terbuka sejak
awal, tanpa auto-advance, tombol Back peramban per langkah, autosave draf
(`kuesioner_cbct_draft_v3`, kompatibel dengan draf v1 di perangkat responden).
