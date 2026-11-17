<script lang="ts">
  import { state } from '../lib/store';
  export let error = '';
</script>

<div class="card">
  <span class="chip">Langkah 2 dari 2</span>
  <h1>Identitas Responden</h1>
  <p class="lead">Nama wajib diisi. Jabatan dan kontak bersifat opsional dan hanya digunakan peneliti untuk klarifikasi jawaban bila diperlukan.</p>
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
  </div>
  {#if error}<div class="er">{error}</div>{/if}
</div>
