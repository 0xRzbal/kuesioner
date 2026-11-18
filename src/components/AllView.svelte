<script lang="ts">
  import { CONFIG } from '../lib/config';
  import { D, SEC, P, expand } from '../lib/engine';
</script>

<div class="card">
  <span class="chip">Penelaahan Instrumen</span>
  <h1 style="font-size:clamp(22px,5vw,30px)">{D.judul}</h1>
  <p class="lead">{CONFIG.tujuan}</p>
  <div class="legend">
    <b>Y</b>Ya &nbsp;<b>T</b>Tidak &nbsp;<b>BDD</b>Belum Dapat Ditentukan &nbsp;<b>TB</b>Tidak Berlaku &nbsp;<b>★</b>Bukti utama yang diminta ditunjukkan kepada peneliti
  </div>
  <p class="note">Halaman ini menampilkan seluruh pertanyaan apa adanya untuk dibaca dan ditelaah sebelum mengisi.</p>
</div>

{#each SEC as x}
  <div class="card" style="margin-top:14px">
    <span class="chip">Bagian {x.b}</span>
    <h2 style="font-size:20px;margin:0 0 6px">{x.t}</h2>
    {#each x.items as it}
      <div class="all-it">
        <span class="chip">{it.kode_blanko || it.kode}</span>
        <div class="qq">{it.pertanyaan}</div>
        <ul>
          {#each P(it) as g}
            {#if g.k === 'opt'}
              {#each g.opts as o}<li>{expand(o.l)}</li>{/each}
            {:else if g.k === 'fld'}
              {#each g.fl as f}<li>{f.l || g.lab || 'Isian'}</li>{/each}
            {:else}<li>Jawaban terbuka</li>{/if}
          {/each}
        </ul>
        {#if it.bukti_diminta && it.bukti_diminta !== '—'}
          <div class="ev">Bukti yang diminta: {it.bukti_diminta}</div>
        {/if}
        <div class="ans"></div>
      </div>
    {/each}
  </div>
{/each}
