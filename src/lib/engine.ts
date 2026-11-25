/**
 * Engine kuesioner: parser butir, formatter jawaban, dan validasi kelengkapan.
 * Port TypeScript dari logika v1 — format keluaran `fmt()` SENGAJA tidak berubah
 * agar payload ke Google Sheets (Code.gs) tetap kompatibel byte-per-byte.
 */
import data from './items.json';

export interface Butir {
  kode: string; kode_blanko: string; bagian: string; subbagian: string | null;
  judul_bagian: string; pertanyaan: string; pertanyaan_singkat: string;
  tipe: string; pilihan_jawaban: string; bukti_diminta: string;
}
export interface Section { b: string; t: string; items: Butir[] }

export const D = data as unknown as { judul: string; fasilitas: string[]; butir: Butir[] };
export const IT: Butir[] = D.butir;
export const BY: Record<string, Butir> = {};
export const SEC: Section[] = [];
IT.forEach((it) => {
  BY[it.kode] = it;
  let s = SEC.find((x) => x.b === it.bagian);
  if (!s) { s = { b: it.bagian, t: it.judul_bagian.replace(/^Bagian \w+ — /, ''), items: [] }; SEC.push(s); }
  s.items.push(it);
});

const BL = /(?:20)?…+/;
const UNIT = /^\s*(mm|%|buah|kVp|detik|mmAl|mA\/mAs|mAs)(?![A-Za-z])/;
export const EXC = /^(T|TB|BDD|Tidak|Belum|Tanpa)\b/;
const MULTI = new Set(['A-05', 'A-07', 'A-08', 'C-03', 'D-24', 'D-10:1']);
export const MAX3 = new Set(['K-02']); // butir dengan batas "centang maksimal 3"

export type Group =
  | { k: 'date' }
  | { k: 'area'; h: string }
  | { k: 'fld'; lab: string; fl: Field[] }
  | { k: 'opt'; lab: string; sc?: number; multi?: boolean; opts: Opt[] };
export interface Field { l: string; u: string; p: string }
export interface Opt { l: string; f: Field[] }

function fields(s: string): Field[] {
  const out: Field[] = [], re = /(20)?…+/g; let last = 0, m: RegExpExecArray | null, prev: Field | null = null;
  while ((m = re.exec(s))) {
    let pre = s.slice(last, m.index);
    if (prev) { const u = pre.match(UNIT); if (u) { prev.u = u[1]; pre = pre.slice(u[0].length); } }
    prev = { l: pre.replace(/^[\s,;•]+|[\s:]+$/g, ''), u: '', p: m[1] ? '20__' : '' }; out.push(prev); last = re.lastIndex;
  }
  if (prev) { const u = s.slice(last).match(UNIT); if (u) prev.u = u[1]; }
  return out;
}
function popt(t: string): Opt {
  t = t.trim(); const i = t.search(BL); if (i < 0) return { l: t, f: [] };
  const h = t.slice(0, i), m = h.match(/^(.*?)(?: — |:\s)(.*)$/);
  return { l: (m ? m[1] : h.replace(/[:,\\s—]+$/, '')).trim(), f: fields((m ? m[2] : '') + t.slice(i)) };
}
const PC: Record<string, Group[]> = {};
export function P(it: Butir): Group[] {
  if (PC[it.kode]) return PC[it.kode];
  let raw = it.pilihan_jawaban; const gs: Group[] = [];
  if (it.kode === 'C-10') raw = raw.replace(/…… (?=[A-Z])/g, '☐ ');
  if (it.kode === '0-03') gs.push({ k: 'date' });
  else if (it.tipe === 'terbuka' || /^Isi terbuka/.test(raw)) gs.push({ k: 'area', h: (raw.match(/\(([^)]*)\)/) || [])[1] || '' });
  else raw.split(' • ').forEach((g) => {
    const i = g.indexOf('☐');
    if (it.tipe === 'skala' && /^Skala 1–5/.test(g)) gs.push({ k: 'opt', lab: 'Skala 1–5', sc: 1, opts: [1, 2, 3, 4, 5].map((n) => ({ l: String(n), f: [] })) });
    else if (i >= 0) gs.push({ k: 'opt', lab: g.slice(0, i).replace(/^Likert SS–STS:\s*/, '').replace(/[:\s]+$/, '').trim(), opts: g.slice(i + 1).split('☐').map(popt) });
    else if (BL.test(g)) { const bi = g.search(BL), ci = g.indexOf(':'); let lab = '', rest = g; if (ci >= 0 && ci < bi) { lab = g.slice(0, ci).trim(); rest = g.slice(ci + 1); } gs.push({ k: 'fld', lab, fl: fields(rest) }); }
  });
  gs.forEach((g, gi) => { if (g.k === 'opt') g.multi = it.tipe === 'pilihan_ganda' || MULTI.has(it.kode) || MULTI.has(it.kode + ':' + gi) || (g.opts.length === 1 && !g.lab); });
  return (PC[it.kode] = gs);
}

/** Perluas singkatan kode menjadi teks terbaca: Y→Ya, T→Tidak, BDD→Belum dapat ditentukan, TB→Tidak berlaku. */
export function expand(s: string): string {
  if (!s) return s; const t = s.trim();
  const ex: Record<string, string> = { Y: 'Ya', T: 'Tidak', BDD: 'Belum dapat ditentukan', TB: 'Tidak berlaku', PPR: 'Petugas Proteksi Radiasi (PPR)', 'M-1': 'Kelas M-1', 'M-2': 'Kelas M-2', 'M-3': 'Kelas M-3' };
  if (ex[t] !== undefined) return s.replace(t, ex[t]);
  return s.replace(/^Y(?=[,\-—–:])/, 'Ya').replace(/^T(?=[,\-—–:])/, 'Tidak')
    .replace(/^BDD(?=[\s\-—–:])/, 'Belum dapat ditentukan').replace(/^TB(?=[\s\-—–:])/, 'Tidak berlaku');
}

export type AnswerState = Record<string, any>;
const fv = (f: Field, k: string, st: AnswerState) => {
  const v = (st[k] || '').trim();
  return v ? (f.l ? f.l + (/\)$/.test(f.l) ? ' ' : ': ') : '') + v + (f.u ? ' ' + f.u : '') : '';
};
/** Format jawaban satu butir menjadi teks terbaca — format ini yang dikirim ke Sheets. */
export function fmt(it: Butir, st: AnswerState): string {
  const p = P(it);
  const parts = p.map((g, gi) => {
    if (g.k === 'date' || g.k === 'area') return (st.a || '').trim();
    if (g.k === 'fld') return g.fl.map((f, j) => fv(f, `f${gi}.${j}`, st)).filter(Boolean).join(', ');
    return (st['g' + gi] || []).map((i: number) => {
      const o = g.opts[i]; if (!o) return '';
      const x = o.f.map((f, j) => fv(f, `o${gi}.${i}.${j}`, st)).filter(Boolean).join(', ');
      return o.l + (x ? ' — ' + x : '');
    }).join('; ');
  });
  return parts.map((x, gi) => (x && p.length > 1 && (p[gi] as any).lab ? (p[gi] as any).lab + ': ' + x : x)).filter(Boolean).join(' • ');
}
/** Lengkap = terformat DAN setiap sub-bagian pertanyaan terjawab (aturan rombakan v1). */
export function complete(it: Butir, st: AnswerState): boolean {
  if (!fmt(it, st)) return false;
  return P(it).every((g, gi) => {
    if (g.k === 'opt') return (st['g' + gi] || []).length > 0;
    if (g.k === 'fld') {
      if (/opsional/i.test(g.lab)) return true;
      return g.fl.some((f, j) => (st[`f${gi}.${j}`] || '').trim());
    }
    return (st.a || '').trim().length > 0;
  });
}
export function hint(it: Butir): string {
  if (it.kode === 'B-01') return 'Pertanyaan ini terdiri dari dua bagian — mohon jawab keduanya. Skala 1–5: 1 = tidak pernah, 2 = jarang, 3 = kadang-kadang, 4 = sering, 5 = selalu (setiap hari). Di bawah skala, pilih pula status pencatatannya. Bila belum dapat dijawab saat ini, tekan “Lewati” dan butir ini akan ditandai belum terjawab.';
  if (it.kode === 'J-01') return 'Pilih atau ketik kendala dari daftar baku berikut: ketersediaan phantom CBCT; ketersediaan alat ukur/dosimeter; anggaran pengujian; SDM (fisika medik/radiografer terlatih); waktu/jadwal pelayanan yang padat; dukungan manajemen; belum ada SOP/panduan nasional. Bila kendalanya lain, ketik langsung pada kolomnya.';
  const p = P(it);
  const multi = p.some((x: any) => x.k === 'opt' && x.multi);
  const flds = p.filter((x) => x.k === 'fld');
  const opsional = flds.length > 0 && flds.every((x: any) => /opsional/i.test(x.lab || ''));
  if (p.filter((x) => x.k === 'opt' || x.k === 'fld').length > 1) {
    const cara = multi ? 'Boleh pilih lebih dari satu.' : 'Pilih satu jawaban pada tiap bagian.';
    if (opsional) return cara + ' Kolom bertanda opsional boleh dikosongkan.';
    if (!flds.length) return cara;
    return 'Pertanyaan ini terdiri dari beberapa bagian — mohon jawab semuanya. Bila belum dapat dijawab saat ini, tekan “Lewati” dan butir ini akan ditandai belum terjawab.';
  }
  const g = p.find((x) => x.k === 'opt');
  return g && p.length === 1 ? (multi ? 'Boleh pilih lebih dari satu.' : 'Pilih satu jawaban.') : '';
}
