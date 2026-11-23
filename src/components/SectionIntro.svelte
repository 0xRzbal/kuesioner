<script lang="ts">
  import { SEC, type Section } from '../lib/engine';
  export let section: Section;
</script>

<div class="card">
  <span class="chip">Bagian {section.b}</span>
  <h1 style="font-size:clamp(23px,5vw,30px)">{section.t}</h1>
  <p class="lead">Bagian {SEC.indexOf(section) + 1} dari {SEC.length} · {section.items.length} pertanyaan · estimasi total seluruh formulir 10–15 menit</p>
  <div class="gl">Pertanyaan pada bagian ini</div>
  {#each section.items as it}
    <p class="sec-q"><b>{it.kode_blanko || it.kode}.</b> {it.pertanyaan}</p>
  {/each}
</div>
