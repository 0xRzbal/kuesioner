<script lang="ts">
  import { CONFIG } from '../lib/config';
  import { D, IT, SEC } from '../lib/engine';
  import { state } from '../lib/store';
  export let onShowAll: () => void;
  function pick(f: string) { $state.fac = f; }
</script>

<div class="hero">
  <span class="chip">Kuesioner Penelitian</span>
  <h1>{D.judul}</h1>
  <p class="lead">{CONFIG.tujuan}</p>
  <div class="hero-meta">
    <div><b>{IT.length}</b><span>Butir pertanyaan</span></div>
    <div><b>{SEC.length}</b><span>Bagian</span></div>
    <div><b>10–15</b><span>Menit pengisian</span></div>
    <div><b>2</b><span>Fasilitas (RSDK & RSGM)</span></div>
  </div>
</div>

<div class="card" style="margin-top:14px">
  <h2>Tentang penelitian ini</h2>
  <div class="research-info">
    <div class="ri-row"><b>Peneliti</b><span>{CONFIG.peneliti}</span></div>
    <div class="ri-row"><b>Institusi</b><span>{CONFIG.institusi}</span></div>
    <div class="ri-row"><b>Pembimbing</b><span>{CONFIG.pembimbing}</span></div>
    <div class="ri-row"><b>Kontak</b><span>{CONFIG.kontak}</span></div>
    <div class="ri-row"><b>Versi</b><span>{CONFIG.versiFormulir}</span></div>
  </div>
</div>

<div class="card" style="margin-top:14px">

  <div class="note">
    <b>Petunjuk pengisian.</b> Formulir terdiri dari {IT.length} butir klarifikasi dalam {SEC.length} bagian, dijawab satu
    per satu; estimasi waktu 10–15 menit. Butir diambil dari bank instrumen penelitian dan
    kodenya mengikuti dokumen induk, sehingga penomoran tampak tidak berurutan — bukan ada
    pertanyaan yang hilang. Jawaban tersimpan otomatis di perangkat ini dan dapat dilanjutkan
    kemudian. Pada sejumlah butir diminta bukti pendukung: bukti ditunjukkan kepada peneliti saat
    pengisian dan nomor/keterangannya dicatat pada kolom yang disediakan. Formulir ini tidak
    meminta angka hasil uji — angka tetap diambil dari laporan hasil uji (LHU) di fasilitas.
  </div>

  <details>
    <summary>Panduan pengisian</summary>
    <p class="hint" style="margin:8px 0">
      1) Pilih fasilitas tempat pengisian, lalu centang persetujuan di bawah.<br>
      2) Isi identitas responden — nama wajib diisi; merk/model dan tahun pemasangan unit CBCT bersifat opsional.<br>
      3) Jawab butir satu per satu per bagian. Jawaban tersimpan otomatis di perangkat ini dan dapat dilanjutkan kemudian.<br>
      4) Bila sebuah butir belum dapat dijawab saat ini, tekan “Lewati” — butir itu ditandai belum terjawab dan tetap harus dilengkapi sebelum jawaban dapat dikirim.<br>
      5) Pada kolom bukti, tuliskan nomor/judul dokumen atau keterangannya; isi “-” bila bukti memang tidak tersedia.<br>
      6) Di akhir, periksa ringkasan pada halaman Tinjau &amp; Kirim, lalu tekan Kirim Jawaban.
    </p>
  </details>

  <p class="note">
    <b>Persetujuan.</b> Dengan melanjutkan, Bapak/Ibu menyatakan bersedia mengisi kuesioner ini
    secara sukarela. Jawaban hanya digunakan untuk keperluan penelitian ini dan tersimpan pada
    lembar data penelitian (Google Sheets) milik peneliti. Identitas responden dirahasiakan
    dalam pelaporan hasil. Bapak/Ibu boleh berhenti dan menarik diri kapan pun sebelum jawaban
    dikirim, tanpa konsekuensi apa pun; draf yang belum dikirim hanya tersimpan di perangkat ini.
  </p>

  <label class="consent">
    <input type="checkbox" bind:checked={$state.consent}>
    <span>Saya telah membaca penjelasan di atas dan bersedia mengisi kuesioner ini secara sukarela. <b>Persetujuan ini wajib dicentang untuk memulai.</b></span>
  </label>

  <div class="gl">Pilih fasilitas tempat pengisian</div>
  <div class="fac">
    {#each D.fasilitas as f}
      <button class="fc" class:on={$state.fac === f} on:click={() => pick(f)}>
        <b>{f}</b><span>{f === 'RSDK' ? 'RSUP Dr. Kariadi' : 'Rumah Sakit Gigi dan Mulut'}</span>
      </button>
    {/each}
  </div>

  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
    <button class="btn" on:click={onShowAll}>Baca semua pertanyaan</button>
  </div>
</div>
