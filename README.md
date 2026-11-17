# Kuesioner QA/QC CBCT

Aplikasi kuesioner satu halaman untuk menilai kesiapan program jaminan mutu (QA/QC) pesawat CBCT 3D di fasilitas radiologi kedokteran gigi. Live di <https://questioners.hasiana.web.id/>.

## Isi

- `index.html` — aplikasi utama. Satu file, CSS + JS inline, data butir tertanam sebagai JSON (`const D={...}`). Tidak ada build step.
- `sheets-config.js` — jembatan ke Google Apps Script Web App (URL deployment + helper `kirimHasilKeSheets`).
- `Code.gs` — backend Google Apps Script: tulis jawaban ke Google Sheets, derivasi kolom kode, bangun tab Rekap.
- `README-INTEGRASI-GOOGLE-SHEETS.md` — panduan langkah demi langkah integrasi Sheets.
- `headers-hasil-kuesioner.csv` — daftar kolom hasil (55 kolom).
- `kuesioner-items.json` — data butir mentah (24 butir) untuk rujukan.

## Struktur kuesioner

24 butir dibagi 11 bagian (0, A–K):

| Bagian | Cakupan |
|---|---|
| 0 | Penggunaan mode 3D (CBCT) |
| A | Tata kelola program QA/QC, SOP, dasar penyusunan |
| B | Pemeriksaan harian & data commissioning |
| C | Ketersediaan phantom & jalur pengadaannya |
| D | Penilaian mutu citra & keluhan klinis |
| E | Pengukuran akurasi kVp per mode |
| F | Label kalibrasi pada alat |
| G | Warm-up / kalibrasi otomatis |
| H | Penyesuaian parameter eksposi (termasuk protokol anak) |
| I | Pelaporan hasil tidak sesuai & tindakan korektif |
| J | Kendala pelaksanaan QA/QC & ketersediaan sarana |
| K | Kesediaan adopsi rancangan SOP/protokol hasil penelitian |

## Alur pengisian

1. Pilih fasilitas — RSDK (Rumah sakit dr Kariadi) atau RSGM (Rumah sakit gigi & mulut).
2. Isi identitas responden (nama wajib, jabatan & kontak opsional).
3. Jawab 24 butir satu per satu. Setiap butir punya slot bukti opsional.
4. Semua butir wajib terisi. Tombol kirim akan mengarahkan ke butir pertama yang masih kosong.
5. Kirim → jawaban masuk ke Google Sheets dan tab Rekap ikut diperbarui.

Jawaban disimpan otomatis di `localStorage`, jadi kuesioner boleh ditutup lalu dilanjutkan di perangkat yang sama.

## Penyimpanan jawaban

Frontend mengirim teks yang terbaca manusia (mis. `Y, rutin`). Backend menyimpan dua lapis:

- kolom teks per butir (apa yang dipilih responden), dan
- kolom `<kode>_kode` hasil normalisasi lewat parser token awalan (`Y`, `T`, `BDD`, `TB`, `M-1..3`, `PPR`).

Tab Rekap menghitung langsung dari kolom `*_kode` (bukan formula spreadsheet), sehingga tidak pecah pada locale yang memakai pemisah `;`.

## Deploy

```bash
# webroot statis, tanpa build
rsync -a index.html sheets-config.js /var/www/questioners/
```

nginx menyajikan webroot dengan `Cache-Control: no-cache, must-revalidate`; `sheets-config.js` dimuat dengan query versi (`?v=YYYYMMDD`) agar perubahan URL deployment tidak tertahan cache responden.

Backend:

1. Buka Google Sheets → Extensions → Apps Script.
2. Tempel isi `Code.gs`, isi `SPREADSHEET_ID`.
3. Deploy → New deployment → Web app (Execute as: Me, Access: Anyone).
4. Salin URL `/exec` ke `SHEETS_WEB_APP_URL` di `sheets-config.js`.
5. Verifikasi: `GET` URL tersebut harus membalas stempel `version` dan `kolom`.

## Catatan operasional

- Setiap perubahan `Code.gs` butuh **New deployment** (bukan hanya New version) agar URL baru terbit dan tidak tertahan deployment lama.
- Tab hasil lama dengan jumlah kolom berbeda dinormalkan otomatis (`normalizeColumns`), tetapi baris uji dari skema lama perlu dihapus manual.
- `resetSheets()` mengosongkan data dan membangun ulang Rekap; tiap tab diproses dalam `try/catch` terpisah supaya satu kegagalan tidak membatalkan yang lain.
