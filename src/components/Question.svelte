<script lang="ts">
  import { P, expand, hint, type Butir } from '../lib/engine';
  import { state, toggleOpt, setField, setEvidence } from '../lib/store';
  export let it: Butir;
  export let error = '';
  $: groups = P(it);
  $: ans = $state.s[it.kode] || {};
  $: ev = $state.ev[it.kode] || '';
  $: buktiLabel = (it.bukti_diminta || '').replace(/^★\s*/, '');
  $: buktiUtama = /^★/.test(it.bukti_diminta || '');
  const sel = (gi: number) => ans['g' + gi] || [];
</script>

<div class="card">
  <span class="chip">Butir {it.kode_blanko || it.kode}</span>
  <span class="chip s">Bagian {it.bagian}</span>
  {#if it.subbagian}<span class="chip s">{it.subbagian}</span>{/if}
  <h2 class="q">{it.pertanyaan}</h2>
  {#if hint(it)}<p class="hint">{hint(it)}</p>{/if}

  {#each groups as g, gi}
    {#if g.k === 'date'}
      <input class="in" type="date" value={ans.a || ''} on:input={(e) => setField(it.kode, 'a', e.currentTarget.value)}>
    {:else if g.k === 'area'}
      <textarea class="in" placeholder={g.h || 'Tulis jawaban di sini…'} value={ans.a || ''} on:input={(e) => setField(it.kode, 'a', e.currentTarget.value)}></textarea>
    {:else if g.k === 'fld'}
      {#if g.lab}<div class="gl">{g.lab}</div>{/if}
      <div class="frow" style="margin-top:0">
        {#each g.fl as f, j}
          <label class="fl">
            <span>{f.l || g.lab || 'Isi'}</span>
            <span class="iw">
              <input class="in" value={ans[`f${gi}.${j}`] || ''} placeholder={f.p || ''} on:input={(e) => setField(it.kode, `f${gi}.${j}`, e.currentTarget.value)}>
              {#if f.u}<i>{f.u}</i>{/if}
            </span>
          </label>
        {/each}
      </div>
    {:else}
      {#if g.lab}<div class="gl">{g.lab}</div>{/if}
      <div class="opts" class:sc={!!g.sc}>
        {#each g.opts as o, i}
          <button type="button" data-opt class="opt" class:ck={!!g.multi} class:on={sel(gi).includes(i)}
            aria-pressed={sel(gi).includes(i)} on:click={() => { toggleOpt(it.kode, gi, i); error = ''; }}>
            {expand(o.l)}<em class="kc">{i + 1}</em>
          </button>
        {/each}
      </div>
      {#each sel(gi) as i}
        {#if g.opts[i] && g.opts[i].f.length}
          <div class="frow">
            {#each g.opts[i].f as f, j}
              <label class="fl">
                <span>{f.l || g.opts[i].l}</span>
                <span class="iw">
                  <input class="in" value={ans[`o${gi}.${i}.${j}`] || ''} placeholder={f.p || ''} on:input={(e) => setField(it.kode, `o${gi}.${i}.${j}`, e.currentTarget.value)}>
                  {#if f.u}<i>{f.u}</i>{/if}
                </span>
              </label>
            {/each}
          </div>
        {/if}
      {/each}
    {/if}
  {/each}

  {#if it.bukti_diminta && it.bukti_diminta !== '—'}
    <details open>
      <summary>Bukti yang diminta: {buktiLabel}{buktiUtama ? ' (bukti utama)' : ''}</summary>
      <p class="hint" style="margin:8px 0">Bukti ditunjukkan kepada peneliti saat pengisian. Tuliskan nomor/judul dokumen atau keterangan buktinya di sini; boleh dikosongkan bila bukti tidak tersedia.</p>
      <input class="in" value={ev} placeholder="Nomor dokumen / keterangan bukti (opsional)" on:input={(e) => setEvidence(it.kode, e.currentTarget.value)}>
    </details>
  {/if}

  {#if it.kode === 'K-04'}
    <label class="consent">
      <input type="checkbox" bind:checked={$state.k4agree}>
      <span>Saya menyatakan bahwa jawaban pada kuesioner ini diisi sesuai kondisi sebenarnya dan bukti yang ditunjukkan kepada peneliti.</span>
    </label>
  {/if}

  {#if error}<div class="er">{error}</div>{/if}
</div>
