# Integrasi Google Sheets — Kuesioner QA/QC CBCT Online (140 butir)

Paket ini menghubungkan kuesioner online (versi deploy statis) ke Google Sheets
milik kamu sendiri, supaya jawaban responden RSDK dan RSGM langsung masuk
sebagai baris baru di spreadsheet — tidak perlu lagi mengumpulkan file CSV
satu per satu.

**Penting dulu:** paket ini belum terhubung ke akun Google mana pun. Kamu yang
akan menghubungkannya sendiri dengan dua tempelan (paste) di bawah. Tidak perlu
API key Google, tidak perlu OAuth, tidak perlu kartu kredit.

## Isi paket

| File | Fungsi |
|---|---|
| `Code.gs` | Google Apps Script: endpoint Web App + `setupSheets()` |
| `sheets-config.js` | Snippet untuk ditempel ke `index.html` versi deploy |
| `headers-hasil-kuesioner.csv` | Header 147 kolom + 1 baris contoh (RSDK) |
| `kuesioner-items.json` | Daftar 140 butir (kode, bagian, pertanyaan, tipe) |
| `README-INTEGRASI-GOOGLE-SHEETS.md` | File ini |

**Struktur kolom (147 kolom, urutan yang sama di semua file):**
6 kolom meta — `Timestamp, Fasilitas, Nama_Responden, Jabatan_Peran,
No_HP_Email, Status_Pengiriman` — lalu 140 kolom butir, lalu `Bukti_Utama`.

**Kode butir:** kode normalisasi untuk kolom spreadsheet, contoh `0-01`,
`A-01`, `D-07`. Kode persis di dokumen Word dicatat di `kuesioner-items.json`
sebagai `kode_blanko` (`0.1` = `0-01`, `A1` = `A-01`, `D7` = `D-07`).
Jumlah per bagian: 0: 12, A: 14, B: 12, C: 12, D: 29, E: 10, F: 9, G: 7,
H: 9, I: 9, J: 12, K: 5 — total 140 butir.

## Dua tempat paste yang harus diisi

1. **`Code.gs` — Spreadsheet ID.** Di baris paling atas:
   `const SPREADSHEET_ID = "PASTE_SPREADSHEET_ID_DI_SINI";`
2. **`sheets-config.js` — Web App URL.** Di dekat atas file:
   `const SHEETS_WEB_APP_URL = "PASTE_WEB_APP_URL_DI_SINI";`

Itu saja. Jangan paste apa pun yang lain, dan jangan menaruh URL/ID asli di
tempat lain.

---

## Langkah demi langkah

### (a) Buat spreadsheet baru dan salin Spreadsheet ID

1. Buka [Google Sheets](https://sheets.google.com) dan buat spreadsheet kosong.
   Beri nama misalnya `Hasil Kuesioner QA-QC CBCT`.
2. Lihat URL di address bar, bentuknya:
   `https://docs.google.com/spreadsheets/d/`**`1AbCdeFgHiJkLmNoPqRsTuVwXyZ`**`/edit`
3. Salin bagian yang ditebalkan itu — itulah Spreadsheet ID. Bagian
   `/d/` sampai `/edit` jangan ikut disalin.

### (b) Pasang Code.gs dan jalankan setupSheets() sekali

1. Di spreadsheet yang baru dibuat: menu **Extensions > Apps Script**.
   (Tampilan berbahasa Indonesia: **Ekstensi > Apps Script**.)
2. Hapus seluruh isi `Code.gs` bawaan, lalu paste seluruh isi `Code.gs`
   dari paket ini.
3. Ganti `PASTE_SPREADSHEET_ID_DI_SINI` dengan Spreadsheet ID dari langkah (a).
4. Klik **Save** (ikon disket).
5. Di bilah atas editor, pilih fungsi **`setupSheets`**, lalu klik **Run**.
6. Saat pertama kali, Google akan meminta izin: klik **Review permissions**,
   pilih akun Google kamu, lalu **Allow** (izinkan). Ini normal — script
   perlu izin menulis ke spreadsheet kamu sendiri.
7. Kembali ke spreadsheet: sekarang ada 3 sheet — **`Hasil_RSDK`**,
   **`Hasil_RSGM`**, dan **`Rekap`** — masing-masing dengan header lengkap.
   Sheet `Hasil_*` berisi 147 kolom header di baris 1. Sheet `Rekap`
   berisi hitungan otomatis per bagian (lihat bagian "Cara baca Rekap").

### (c) Deploy sebagai Web App dan salin Web App URL

1. Di editor Apps Script: **Deploy > New deployment**.
2. Klik ikon roda gigi di samping "Select type", pilih **Web app**.
3. Isi:
   - **Description:** `Kuesioner QA-QC CBCT` (bebas).
   - **Execute as:** **Me** (akun kamu).
   - **Who has access:** **Anyone** (siapa saja).
     > Ini wajib, karena kuesioner di-host di luar Google (Vercel/dll) dan
     > responden mengisinya tanpa login Google. Konsekuensinya ada di
     > bagian keamanan di bawah — baca dulu.
4. Klik **Deploy**, lalu **Authorize access** bila diminta lagi.
5. Salin **Web App URL** yang muncul, bentuknya:
   `https://script.google.com/macros/s/<ID-DEPLOYMENT>/exec`
6. **Setiap kali kamu mengedit `Code.gs` setelah ini**, ulangi Deploy >
   **Manage deployments** > pensil (edit) > pilih **New version** >
   Deploy, supaya URL yang sama memakai kode terbaru. URL-nya sendiri
   tidak berubah.

### (d) Tempel sheets-config.js ke index.html versi deploy

1. Salin file `sheets-config.js` ke folder yang sama dengan `index.html`
   hasil deploy (satu folder dengan `vercel.json`).
2. Di `index.html`, tambahkan sebelum tag penutup `</body>`:
   ```html
   <script src="sheets-config.js"></script>
   ```
3. Ganti `PASTE_WEB_APP_URL_DI_SINI` di `sheets-config.js` dengan Web App
   URL dari langkah (c).
4. Sambungkan tombol Kirim di kuesioner ke fungsi kirim. Contoh:
   ```js
   document.getElementById("btn-kirim").addEventListener("click", async () => {
     const data = kumpulkanJawabanKuesioner(); // fungsi di index.html kamu:
     // { facility: "RSDK"|"RSGM",
     //   respondent: { nama, jabatan, kontak },
     //   answers:  { "0-01": "...", "A-01": "Y", "D-07": "BDD", ... },
     //   evidence: { "A-01": "SOP No. ...", ... } }
     const hasil = await kirimHasilKeSheets(data);
     tampilkanStatus(hasil.status + " — " + hasil.pesan);
   });
   ```
   Nama fungsi `kumpulkanJawabanKuesioner()` dan `tampilkanStatus()` harus
   disesuaikan dengan kode `index.html` kamu — paket ini tidak menebak
   nama fungsi di halamanmu.
5. Deploy ulang ke hosting (mis. `vercel deploy` atau push ke repo yang
   terhubung ke Vercel/Netlify).

### (e) Tes kirim satu jawaban

1. Buka Web App URL langsung di browser. Harus muncul:
   `{"ok":true,"message":"Kuesioner QA/QC CBCT endpoint aktif"}`
   Kalau muncul itu, endpoint hidup.
2. Buka kuesioner hasil deploy, isi beberapa butir untuk **RSDK**, lalu
   tekan Kirim. Status yang muncul: **"Terkirim ke Sheets"**.
3. Buka spreadsheet, sheet **`Hasil_RSDK`**: harus ada 1 baris baru dengan
   Timestamp, Fasilitas `RSDK`, dan jawabanmu di kolom yang sesuai.
4. Ulangi sekali untuk **RSGM** dan cek sheet **`Hasil_RSGM`**.
5. Cek sheet **`Rekap`**: angka Y/T/BDD per bagian harus ikut berubah.

### (f) Bila tes gagal — troubleshooting

| Gejala | Kemungkinan penyebab & perbaikan |
|---|---|
| Buka Web App URL: error 404 / `Script function not found` | Deployment belum dibuat, atau `doGet` tidak ada. Pastikan `Code.gs` terpaste lengkap dan Deploy > Web app sudah dilakukan. |
| Buka Web App URL: `Authorization needed` / 401 | "Who has access" bukan **Anyone**. Edit deployment, ubah ke **Anyone**, Deploy ulang sebagai versi baru. |
| Kirim dari kuesioner: status "Belum dikonfigurasi" | `SHEETS_WEB_APP_URL` di `sheets-config.js` masih berisi placeholder. Ganti hanya nilai di dalam tanda kutip pada baris `const SHEETS_WEB_APP_URL = ...`. |
| Kirim: "Gagal — tersimpan lokal" | Tidak ada internet, URL salah ketik, atau deployment dihapus. Jawaban TIDAK hilang: tersimpan di localStorage browser dan bisa diekspor manual CSV/JSON, lalu kirim ulang dengan `kirimUlangAntrianTertunda()` atau kirim ulang dari halaman. Perbaiki URL, lalu tes lagi. |
| Baris tidak masuk tapi status "Terkirim ke Sheets" | Cek dulu: apakah `SPREADSHEET_ID` di `Code.gs` benar dan `setupSheets()` sudah dijalankan? Apakah ada versi deployment baru yang belum di-deploy setelah edit `Code.gs`? (URL lama menjalankan kode lama.) Cek juga sheet yang benar: jawaban RSDK hanya masuk `Hasil_RSDK`. |
| Header tidak muncul / header berbeda | `setupSheets()` tidak menimpa header yang sudah ada dan berbeda — itu sengaja, supaya data tidak rusak. Hapus baris 1 yang salah secara manual, lalu jalankan `setupSheets()` lagi. |
| Error `Header baris 1 ... sudah ada dan berbeda` saat Run | Sama seperti di atas: periksa sheet itu, hapus header yang salah, jalankan ulang. Jangan menimpa sheet yang sudah berisi jawaban responden. |
| `facility harus RSDK atau RSGM` | `data.facility` yang dikirim dari `index.html` bukan persis `RSDK`/`RSGM` (mis. huruf kecil atau ada spasi). Perbaiki di fungsi pengumpul jawaban. |
| Rekap menampilkan 0 padahal ada jawaban | Rekap hanya menghitung sel yang **persis** berisi `Y`, `T`, `BDD`, atau `TB`. Jawaban terbuka, angka, skala 1–5, dan Likert tidak masuk hitungan itu — itu disengaja. Lihat sheet `Hasil_*` untuk jawaban lengkapnya. |

---

## Cara baca sheet Rekap

- Satu baris per fasilitas per bagian (RSDK 12 baris + RSGM 12 baris),
  lalu 1 baris TOTAL per fasilitas.
- Kolom **Y / T / BDD / TB**: jumlah sel yang persis berisi kode itu,
  dihitung dengan rumus `COUNTIF` atas rentang kolom bagian tersebut
  (baris data 2 s.d. 1000). Kolom **Terisi** = `COUNTA`,
  **Kosong** = `COUNTBLANK`.
- Bila pengiriman melewati baris 1000, ubah `LAST_DATA_ROW` di `Code.gs`
  (mis. jadi 5000) dan jalankan `setupSheets()` lagi.

## Catatan jujur — batasan yang perlu kamu tahu

1. **Tidak ada API key.** Integrasi ini memakai Spreadsheet ID + Web App
   URL saja. Siapa pun yang memegang Web App URL bisa mengirim jawaban
   ke spreadsheet kamu. Karena itu: **jangan posting Web App URL di
   media sosial / grup publik**. Bagikan hanya lewat kuesioner yang
   sudah di-deploy, dan periksa sheet secara berkala. Bila URL bocor,
   buat deployment baru dan ganti URL di `sheets-config.js`.
2. **Status "Terkirim" bukan bukti mutlak.** Apps Script Web App tidak
   mengembalikan header CORS yang bisa dibaca penuh oleh browser, jadi
   `sheets-config.js` mengirim dengan mode `no-cors` + `Content-Type:
   text/plain` (tanpa preflight) dan menganggap terkirim bila tidak ada
   error jaringan. Verifikasi akhir selalu: lihat baris baru di sheet.
3. **Satu baris per pengiriman.** Setiap kali responden menekan Kirim,
   satu baris baru ditambahkan (append). Tidak ada update baris lama
   otomatis — bila responden mengirim dua kali, akan ada dua baris.
   Bersihkan duplikat secara manual bila perlu.
4. **Bukti per butir** disimpan sebagai teks gabungan di kolom
   `Bukti_Utama` (`KODE: bukti; KODE: bukti; …`), bukan satu kolom
   bukti per butir — supaya jumlah kolom tetap 147 dan mudah dibaca.
   Jawaban per butir tetap di kolom butirnya masing-masing.
5. **Data draf terisi (Word) tidak otomatis masuk ke sini.** Spreadsheet
   ini hanya menerima kiriman dari kuesioner online. Draf Word RSDK/RSGM
   yang diisi dari sumber sekunder tetap berupa dokumen terpisah.

## Checklist sebelum dibagikan ke responden

- [ ] Spreadsheet dibuat, `setupSheets()` sudah dijalankan, 3 sheet ada
- [ ] Web App ter-deploy: Execute as **Me**, Who has access **Anyone**
- [ ] `sheets-config.js` berisi Web App URL yang benar, sudah di-deploy ulang
- [ ] Tes kirim RSDK dan RSGM, baris masuk ke sheet yang benar
- [ ] Rekap berubah angkanya setelah tes
- [ ] Baris tes dihapus dari `Hasil_RSDK` / `Hasil_RSGM` sebelum dibagikan
