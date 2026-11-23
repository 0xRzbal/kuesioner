<script lang="ts">
  import { state } from '../lib/store';
  export let error = '';
</script>

<div class="card">
  <span class="chip">Langkah 2 dari 2</span>
  <h1>Identitas Responden</h1>
  <p class="lead">Nama wajib diisi. Jabatan dan kontak bersifat opsional dan hanya digunakan peneliti untuk klarifikasi jawaban bila diperlukan. Merk/model dan tahun pemasangan unit CBCT juga opsional — diisi agar jawaban dapat dikaitkan ke unit alat yang dinilai bila fasilitas memiliki lebih dari satu unit.</p>
  <div class="frow" style="margin-top:0">
    <label class="fl" style="flex-basis:100%">
      <span>Nama responden * (wajib)</span>
      <input class="in" bind:value={$state.who.nama} autocomplete="name" on:input={() => (error = '')}>
    </label>
    <label class="fl">
      <span>Jabatan / peran</span>
      <input class="in" bind:value={$state.who.jabatan}>
    </label>
    <label class="fl">
      <span>No. HP / email</span>
      <input class="in" bind:value={$state.who.kontak}>
    </label>
    <label class="fl">
      <span>Merk &amp; model unit CBCT (opsional)</span>
      <input class="in" bind:value={$state.who.alat} placeholder="mis. Merk X tipe Y">
    </label>
    <label class="fl">
      <span>Tahun pemasangan unit CBCT (opsional)</span>
      <input class="in" bind:value={$state.who.tahunAlat} inputmode="numeric" placeholder="mis. 2019">
    </label>
  </div>
  {#if error}<div class="er">{error}</div>{/if}
</div>
