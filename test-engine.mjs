// Uji engine v2: parser, formatter, dan validasi — dibandingkan dengan perilaku v1.
// Jalankan: npm test  (menggunakan esbuild untuk mengompilasi engine.ts)
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';

await build({ entryPoints: ['src/lib/engine.ts'], bundle: true, format: 'esm', outfile: '/tmp/engine-v2.mjs', logLevel: 'silent' });
const E = await import('/tmp/engine-v2.mjs');
let fails = 0;
const assert = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };

assert(E.IT.length === 24, '24 butir termuat');
assert(E.SEC.length === 13, '13 bagian terbentuk');

// Bangun jawaban penuh sintetis untuk setiap butir: pilih opsi pertama tiap grup, isi semua field.
function fullAnswer(it) {
  const st = {}; const p = E.P(it);
  p.forEach((g, gi) => {
    if (g.k === 'opt') st['g' + gi] = [0];
    else if (g.k === 'fld') g.fl.forEach((f, j) => (st[`f${gi}.${j}`] = 'Isi uji'));
    else st.a = g.k === 'date' ? '2026-11-18' : 'Jawaban uji';
    if (g.k === 'opt') g.opts[0].f.forEach((f, j) => (st[`o${gi}.0.${j}`] = 'Keterangan uji'));
  });
  return st;
}
for (const it of E.IT) {
  const st = fullAnswer(it);
  assert(E.fmt(it, st).length > 0, `${it.kode} fmt tidak kosong`);
  assert(E.complete(it, st), `${it.kode} complete() true untuk jawaban penuh`);
  assert(!E.complete(it, {}), `${it.kode} complete() false untuk jawaban kosong`);
}
// Kasus spesifik hasil audit v1
const c8 = E.BY['C-08'];
assert(E.P(c8)[0].multi === true && E.P(c8)[0].opts.length === 5, 'C-08 lima tahap, multi-pilih');
assert(E.complete(c8, { g0: [1, 2] }), 'C-08 lengkap walau kolom tahun opsional kosong');
const b1 = E.BY['B-01'];
assert(E.P(b1).length === 2 && !E.complete(b1, { g0: [0] }), 'B-01 wajib dua bagian (skala saja tidak cukup)');
assert(E.expand('Y, rutin') === 'Ya, rutin' && E.expand('BDD') === 'Belum dapat ditentukan' && E.expand('TB') === 'Tidak berlaku', 'expand() singkatan benar (sentence case)');
const k2 = E.BY['K-02'];
assert(E.P(k2)[0].multi === true, 'K-02 pilihan ganda');

console.log(fails ? `TOTAL FAIL=${fails}` : 'ALL ENGINE TESTS PASS');
process.exitCode = fails ? 1 : 0;
