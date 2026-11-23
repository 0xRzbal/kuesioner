<script lang="ts">
  import { CONFIG } from '../lib/config';
  import { D, SEC } from '../lib/engine';
</script>

<div class="card">
  <span class="chip">Penelaahan Instrumen</span>
  <h1 style="font-size:clamp(22px,5vw,30px)">{D.judul}</h1>
  <p class="lead">{CONFIG.tujuan}</p>
  <p class="note">Halaman ini menampilkan seluruh pertanyaan apa adanya untuk dibaca dan ditelaah sebelum mengisi.</p>
  <p class="note">Nomor butir tampak tidak berurutan (mis. Bagian B hanya memiliki B1 dan B4; Bagian C memiliki C1, C7, C8, dan C12) karena kodenya mengikuti bank instrumen/dokumen induk yang sama di semua fasilitas — bukan ada pertanyaan yang hilang.</p>
</div>

{#each SEC as x}
  <div class="card" style="margin-top:14px">
    <span class="chip">Bagian {x.b}</span>
    <h2 style="font-size:20px;margin:0 0 6px">{x.t}</h2>
    {#each x.items as it}
      <div class="all-it">
        <span class="chip">{it.kode_blanko || it.kode}</span>
        <div class="qq">{it.pertanyaan}</div>
        {#if it.bukti_diminta && it.bukti_diminta !== '—'}
          <div class="ev">Bukti yang diminta: {it.bukti_diminta}</div>
        {/if}
      </div>
    {/each}
  </div>
{/each}
