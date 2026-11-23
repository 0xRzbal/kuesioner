<script lang="ts">
  import { IT, SEC, fmt, complete } from '../lib/engine';
  import { state } from '../lib/store';
  import { pendingCount, type SendResult } from '../lib/sheets';
  export let result: SendResult | null = null;
  export let onJump: (kode: string) => void;
  export let onRetry: () => void;
  export let onReset: () => void = () => {};
  $: total = IT.filter((it) => complete(it, $state.s[it.kode] || {}) && (it.kode !== 'K-04' || $state.k4agree)).length;
  $: ok = !!(result && result.ok);
  $: pend = pendingCount();
</script>

<div class="card">
  {#if ok}
    <svg class="ck-svg" viewBox="0 0 84 84"><circle cx="42" cy="42" r="40"/><path d="M24 43l12 12 24-26"/></svg>
    <h1 style="text-align:center">Terima kasih.</h1>
    <p class="lead" style="text-align:center">Jawaban Bapak/Ibu telah kami terima dan sangat membantu penelitian ini.</p>
  {:else}
    <h1>Tinjau &amp; Kirim</h1>
    <p class="lead">Periksa ringkasan jawaban di bawah. Ketuk butir mana pun untuk mengubah jawabannya. Butir yang dilewati atau belum dijawab ditandai “Belum diisi” dan tetap harus dilengkapi sebelum jawaban dapat dikirim — termasuk pernyataan kebenaran pada butir K4.</p>
    <p class="note">Jawaban akan dikirim kepada peneliti dan tersimpan pada lembar data penelitian. Pastikan ringkasan sudah benar sebelum menekan tombol Kirim. Nomor butir tampak tidak berurutan karena kodenya mengikuti bank instrumen/dokumen induk — bukan ada pertanyaan yang hilang.</p>
    <button class="btn g" on:click={onReset}>Mulai ulang / Hapus draf</button>
  {/if}

  {#if !ok}
    <div class="stats">
      <div class="card"><div class="num">{total}</div>terisi</div>
      <div class="card"><div class="num">{IT.length - total}</div>belum</div>
      <div class="card"><div class="num">{SEC.length}</div>bagian</div>
    </div>
  {/if}

  {#if result}
    <div class="al" class:w={!ok}><b>{result.status}</b><br>{result.pesan}</div>
  {/if}
  {#if pend}
    <div class="al w">{pend} pengiriman tertunda dan tersimpan di perangkat ini. <button class="lk" on:click={onRetry}>Kirim ulang</button></div>
  {/if}
</div>

{#if !ok}
<div class="card" style="margin-top:14px">
  <b>Ringkasan jawaban</b>
  <p class="hint" style="margin:4px 0 6px">Fasilitas: {$state.fac || '—'} · Responden: {$state.who.nama || '—'}{$state.who.jabatan ? ', ' + $state.who.jabatan : ''}</p>
  {#each SEC as x}
    <div class="rv-sec">
      <h3>Bagian {x.b} — {x.t}</h3>
      {#each x.items as it}
        {@const a = fmt(it, $state.s[it.kode] || {})}
        {@const e = ($state.ev[it.kode] || '').trim()}
        <button class="rv-it" on:click={() => onJump(it.kode)}>
          <code>{it.kode_blanko || it.kode}</code>
          <span style="flex:1">{it.pertanyaan}
            <span class="a">{#if a}{a}{:else}<span class="none">Belum diisi</span>{/if}</span>
            {#if e}<span class="e">Bukti: {e}</span>{/if}
          </span>
        </button>
      {/each}
    </div>
  {/each}
</div>
{/if}
