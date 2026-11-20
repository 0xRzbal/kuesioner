<script lang="ts">
  import { CONFIG } from '../lib/config';
  import { D } from '../lib/engine';
  import { state } from '../lib/store';
  export let onShowAll: () => void;
  function pick(f: string) { $state.fac = f; }
</script>

<div class="hero">
  <span class="chip">Kuesioner Penelitian</span>
  <h1>{D.judul}</h1>
  <p class="lead">{CONFIG.tujuan}</p>
  <div class="hero-meta">
    <div><b>24</b><span>Butir pertanyaan</span></div>
    <div><b>12</b><span>Bagian (0, A–K)</span></div>
    <div><b>10–20</b><span>Menit pengisian</span></div>
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
  </div>
</div>

<div class="card" style="margin-top:14px">

  <div class="note">
    <b>Petunjuk pengisian.</b> Kuesioner terdiri dari 24 butir terpilih dalam 12 bagian, dijawab satu
    per satu; estimasi waktu 10–20 menit. Butir diambil dari bank instrumen penelitian dan
    kodenya mengikuti dokumen induk, sehingga penomoran tampak tidak berurutan — bukan ada
    pertanyaan yang hilang. Jawaban tersimpan otomatis di perangkat ini dan dapat dilanjutkan
    kemudian. Pada sejumlah butir diminta bukti pendukung: bukti ditunjukkan kepada peneliti saat
    pengisian dan nomor/keterangannya dicatat pada kolom yang disediakan.
  </div>

  <div class="legend">
    <b>Y</b>Ya &nbsp;<b>T</b>Tidak &nbsp;<b>BDD</b>Belum Dapat Ditentukan &nbsp;<b>TB</b>Tidak Berlaku &nbsp;<b>★</b>Bukti utama
  </div>

  <p class="note">
    <b>Persetujuan.</b> Dengan melanjutkan, Bapak/Ibu menyatakan bersedia mengisi kuesioner ini
    secara sukarela. Jawaban hanya digunakan untuk keperluan penelitian ini dan identitas
    responden dirahasiakan dalam pelaporan hasil.
  </p>

  <div class="gl">Pilih fasilitas tempat pengisian</div>
  <div class="fac">
    {#each D.fasilitas as f}
      <button class="fc" class:on={$state.fac === f} on:click={() => pick(f)}>
        <b>{f}</b><span>{f === 'RSDK' ? 'Rumah Sakit dr. Kariadi' : 'Rumah Sakit Gigi dan Mulut'}</span>
      </button>
    {/each}
  </div>

  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
    <button class="btn" on:click={onShowAll}>Baca semua pertanyaan</button>
  </div>
</div>
