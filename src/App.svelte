<script lang="ts">
  import { onMount } from 'svelte';
  import Landing from './components/Landing.svelte';
  import Who from './components/Who.svelte';
  import Question from './components/Question.svelte';
  import Review from './components/Review.svelte';
  import AllView from './components/AllView.svelte';
  import { IT, SEC, complete, fmt, type Butir, type Section } from './lib/engine';
  import { state, toastMsg, toast, emptyState } from './lib/store';
  import { sendToSheets, retryPending, SUBMITTED_KEY, DRAFT_KEY, type Payload, type SendResult } from './lib/sheets';
  import { wibStamp, wibPretty } from './lib/waktu';

  type Step =
    | { t: 'fac' } | { t: 'who' }
    | { t: 'q'; it: Butir; s: Section }
    | { t: 'review' };
  const STEPS: Step[] = [{ t: 'fac' }, { t: 'who' }];
  SEC.forEach((s) => { s.items.forEach((it) => STEPS.push({ t: 'q', it, s })); });
  STEPS.push({ t: 'review' });
  // Indeks langkah pertama dari sebuah bagian — dipakai lompatan dari drawer/pita bagian.
  const firstStep = (s: Section) => STEPS.findIndex((z) => z.t === 'q' && z.s.b === s.b);

  let showAll = false;
  let drawerOpen = false;
  let error = '';
  let result: SendResult | null = null;
  let sending = false;

  $: step = STEPS[Math.min($state.i, STEPS.length - 1)];
  $: totalDone = IT.filter((it) => complete(it, $state.s[it.kode] || {})).length;
  $: subtitle =
    step.t === 'q'
      ? `Butir ${step.s.items.indexOf(step.it) + 1} dari ${step.s.items.length}${step.s.b !== '0' ? ' · Bagian ' + step.s.b : ''} · ${totalDone}/${IT.length} terisi`
      : step.t === 'review' ? (result && result.ok ? 'Selesai' : 'Tinjau & kirim') : `Langkah ${$state.i + 1} dari 2`;
  const cnt = (s: Section) => s.items.filter((it) => complete(it, $state.s[it.kode] || {})).length;

  function go(i: number, fromPop = false) {
    let target = Math.max(0, Math.min(STEPS.length - 1, i));
    // Gate identitas: navigasi maju melewati langkah Who (indeks 1) terkunci sampai nama terisi.
    if (target > 1 && target > $state.i && !$state.who.nama.trim()) {
      toast('Isi identitas responden terlebih dahulu — nama wajib diisi sebelum mulai menjawab.');
      target = 1;
    }
    $state.i = target;
    error = ''; drawerOpen = false; showAll = false;
    window.scrollTo({ top: 0 });
    if (!fromPop) { try { history.pushState({ i: $state.i }, ''); } catch { /* abaikan */ } }
  }
  function next() {
    if (step.t === 'fac' && !$state.fac) { toast('Pilih fasilitas terlebih dahulu: RSDK atau RSGM.'); return; }
    if (step.t === 'fac' && !$state.consent) { toast('Mohon centang pernyataan persetujuan pada halaman ini terlebih dahulu.'); return; }
    if (step.t === 'who' && !$state.who.nama.trim()) { error = 'Nama responden wajib diisi.'; return; }
    if (step.t === 'q') {
      if (!complete(step.it, $state.s[step.it.kode] || {})) {
        error = 'Pertanyaan ini belum dijawab lengkap. Mohon isi terlebih dahulu, atau tekan “Lewati” bila memang belum dapat dijawab saat ini.'; return;
      }
    }
    // Di butir terakhir: kalau masih ada butir kosong, jangan langsung ke Tinjau —
    // arahkan ke butir kosong pertama supaya tidak ada yang terlewat.
    if (step.t === 'q' && STEPS[$state.i + 1] && STEPS[$state.i + 1].t === 'review') {
      const miss = IT.filter((it) => !complete(it, $state.s[it.kode] || {}));
      if (miss.length) {
        const nomor = miss.slice(0, 4).map((it) => it.kode_blanko || it.kode).join(', ');
        toast(`Masih ada ${miss.length} butir kosong (${nomor}${miss.length > 4 ? ', …' : ''}) — diarahkan ke butir ${miss[0].kode_blanko || miss[0].kode}.`);
        jumpTo(miss[0].kode);
        return;
      }
    }
    go($state.i + 1);
  }
  function jumpTo(kode: string) {
    const idx = STEPS.findIndex((x) => x.t === 'q' && x.it.kode === kode);
    if (idx >= 0) go(idx);
  }
  function resetAll() {
    if (!confirm('Hapus semua jawaban di perangkat ini dan mulai pengisian baru?')) return;
    try { localStorage.removeItem(DRAFT_KEY); localStorage.removeItem(SUBMITTED_KEY); } catch { /* abaikan */ }
    $state = emptyState(); result = null; showAll = false; go(0);
  }
  function collect(): Payload {
    const answers: Record<string, string> = {}, evidence: Record<string, string> = {};
    IT.forEach((it) => {
      answers[it.kode] = fmt(it, $state.s[it.kode] || {});
      const e = ($state.ev[it.kode] || '').trim(); if (e) evidence[it.kode] = e;
    });
    // Identitas alat (opsional) TIDAK menambah kolom Sheets: nilainya digabung ke
    // kolom kontak yang sudah ada (No_HP_Email) agar tetap tersimpan & terbaca peneliti.
    const alatInfo = [$state.who.alat.trim(), $state.who.tahunAlat.trim() ? 'pemasangan ' + $state.who.tahunAlat.trim() : '' ].filter(Boolean).join(', ');
    const kontak = [$state.who.kontak.trim(), alatInfo ? 'Unit CBCT: ' + alatInfo : ''].filter(Boolean).join(' | ');
    return {
      facility: $state.fac, timestamp: wibStamp(),
      respondent: { nama: $state.who.nama.trim(), jabatan: $state.who.jabatan.trim(), kontak },
      answers, evidence, status: 'Terkirim'
    };
  }
  // Tombol "Lengkapi N butir": arahkan langsung ke butir pertama yang belum lengkap.
  function lengkapi() {
    const miss = IT.filter((it) => !complete(it, $state.s[it.kode] || {}));
    if (!miss.length) { kirim(); return; }
    const idx = STEPS.findIndex((x) => x.t === 'q' && x.it.kode === miss[0].kode);
    toast(`Masih ada ${miss.length} butir belum lengkap — diarahkan ke butir ${miss[0].kode_blanko || ''}: ${miss[0].pertanyaan_singkat.slice(0, 60)}…`);
    if (idx >= 0) go(idx);
  }

  async function kirim() {
    if (result && result.ok) { toast('Jawaban sudah terkirim dari perangkat ini.'); return; }
    if (!$state.fac || !$state.who.nama.trim()) { go($state.fac ? 1 : 0); return; }
    const miss = IT.filter((it) => !complete(it, $state.s[it.kode] || {}));
    if (miss.length) {
      toast(`Masih ada ${miss.length} pertanyaan yang belum lengkap — Anda diarahkan ke pertanyaan pertama yang belum lengkap.`);
      jumpTo(miss[0].kode); return;
    }
    sending = true;
    try { result = await sendToSheets(collect()); } catch (e) { result = { ok: false, status: 'Gagal', pesan: String(e) }; }
    sending = false; window.scrollTo({ top: 0 });
  }
  async function retry() { await retryPending(); result = result; toast('Pengiriman ulang diproses. Periksa status antrean pada halaman ini.'); }

  onMount(() => {
    // Proteksi konten: blokir menu klik-kanan & drag gaman di seluruh halaman
    const noCtx = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', noCtx);

    try {
      const sb = JSON.parse(localStorage.getItem(SUBMITTED_KEY) || 'null');
      if (sb && sb.at) {
        result = { ok: true, status: 'Terkirim ke Sheets', pesan: `Jawaban dari perangkat ini sudah pernah dikirim pada ${sb.atWib || wibPretty(sb.at)}. Pengiriman ulang dikunci untuk mencegah data ganda. Gunakan tombol “Isi kuesioner baru” bila memang perlu mengisi ulang dari awal.` };
        $state.i = STEPS.length - 1;
      } else if ($state.i > 1) toast('Draf sebelumnya dilanjutkan.');
      history.replaceState({ i: $state.i }, '');
    } catch { /* abaikan */ }
    const onPop = () => { if (showAll) { showAll = false; return; } if ($state.i > 0) go($state.i - 1, true); };
    window.addEventListener('popstate', onPop);
    const onKey = (e: KeyboardEvent) => {
      const tg = (e.target as HTMLElement).tagName; const typing = tg === 'INPUT' || tg === 'TEXTAREA';
      if (e.key === 'Escape') drawerOpen = false;
      if (typing || showAll) return;
      if (e.key === 'Enter' && tg !== 'BUTTON' && step.t !== 'review' && step.t !== 'fac') { e.preventDefault(); next(); }
      if (step.t === 'q' && /^[1-9]$/.test(e.key)) {
        const opts = document.querySelectorAll('#stage [data-opt]'); const el = opts[+e.key - 1] as HTMLElement | undefined; el && el.click();
      } else if (e.key === 'ArrowRight' && step.t === 'q') next();
      else if (e.key === 'ArrowLeft') go($state.i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('keydown', onKey); };
  });
</script>

<header class="top">
  <div class="th">
    <img class="logo" src="/app-peneliti.jpg" alt="Peneliti" role="button" tabindex="0" title="Kembali ke halaman awal" on:click={() => go(0)} />
    <div class="tl" role="button" tabindex="0" title="Kembali ke halaman awal" style="cursor:pointer" on:click={() => go(0)}>QA/QC CBCT Ekstraoral<small>{showAll ? 'Penelaahan seluruh pertanyaan' : subtitle}</small></div>
    <button class="ib" aria-label="Daftar bagian" on:click={() => (drawerOpen = true)}>&#9776;</button>
  </div>
  {#if !showAll && step.t === 'q'}
    <div class="sgs" role="navigation" aria-label="Kemajuan per bagian">
      {#each SEC as x}
        {@const n = cnt(x)}
        <button class="sg" class:cur={step.s.b === x.b} class:full={n === x.items.length}
          title={x.t} aria-label="Bagian {x.b}" on:click={() => go(firstStep(x))}>
          <i style="width:{(n / x.items.length) * 100}%"></i>
        </button>
      {/each}
    </div>
    <div class="prog"><span>Kemajuan pengisian</span><span><b>{totalDone}</b> dari {IT.length} butir · {Math.round((totalDone / IT.length) * 100)}%</span></div>
  {/if}
</header>

<main id="stage">
  {#if showAll}
    <AllView />
  {:else if step.t === 'fac'}
    <Landing onShowAll={() => { showAll = true; window.scrollTo({ top: 0 }); }} />
  {:else if step.t === 'who'}
    <Who bind:error />
  {:else if step.t === 'q'}
    <Question it={step.it} bind:error />
  {:else}
    <Review {result} onJump={jumpTo} onRetry={retry} />
  {/if}
</main>

<div class="bar">
  <div class="bi">
    {#if showAll}
      <button class="btn bk" aria-label="Kembali" on:click={() => (showAll = false)}>&#8249;</button>
    {:else}
      <button class="btn bk" aria-label="Kembali" disabled={$state.i === 0} on:click={() => go($state.i - 1)}>&#8249;</button>
      {#if step.t === 'q' && !complete(step.it, $state.s[step.it.kode] || {})}
        <button class="btn g" on:click={() => go($state.i + 1)}>Lewati</button>
      {/if}
      {#if step.t === 'fac'}
        <button class="btn p" disabled={!$state.fac || !$state.consent} on:click={next}>Lanjut →</button>
      {:else if step.t === 'review'}
        {#if result && result.ok}
          <button class="btn p" on:click={resetAll}>Isi kuesioner baru</button>
        {:else}
          <button class="btn p" id="send" disabled={sending} on:click={totalDone < IT.length ? lengkapi : kirim}>{sending ? 'Mengirim…' : (totalDone < IT.length ? `Lengkapi ${IT.length - totalDone} butir` : 'Kirim Jawaban')}</button>
        {/if}
      {:else}
        <button class="btn p" on:click={next}>Lanjut →</button>
      {/if}
    {/if}
  </div>
</div>

<button class="ov" class:on={drawerOpen} aria-label="Tutup daftar bagian" on:click={() => (drawerOpen = false)}></button>
<aside class="dr" class:on={drawerOpen} aria-label="Daftar bagian">
  <h2 style="margin:4px 8px 12px">Bagian kuesioner</h2>
  {#each SEC as x}
    {@const n = cnt(x)}
    <button class="di" class:d={n === x.items.length} on:click={() => go(firstStep(x))}>
      <b>{n === x.items.length ? '✓' : x.b}</b><span>{x.t}</span><small>{n}/{x.items.length}</small>
    </button>
  {/each}
  <button class="di" on:click={() => go(STEPS.length - 1)}><b>&#9654;</b><span>Tinjau &amp; kirim</span></button>
</aside>

<div class="toast" class:on={!!$toastMsg}>{$toastMsg}</div>
