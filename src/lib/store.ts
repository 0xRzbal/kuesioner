import { writable, get } from 'svelte/store';
import { BY, EXC, MAX3, P } from './engine';
import { DRAFT_KEY } from './sheets';

export interface AppState {
  i: number; fac: string;
  who: { nama: string; jabatan: string; kontak: string; alat: string; tahunAlat: string };
  s: Record<string, Record<string, any>>;
  ev: Record<string, string>;
  k4agree: boolean;
  consent: boolean;
}
export const emptyState = (): AppState => ({ i: 0, fac: '', who: { nama: '', jabatan: '', kontak: '', alat: '', tahunAlat: '' }, s: {}, ev: {}, k4agree: false, consent: false });

function load(): AppState {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (d && d.s) { const m = Object.assign(emptyState(), d); m.who = Object.assign(emptyState().who, d.who || {}); return m; }
  } catch { /* abaikan */ }
  return emptyState();
}
export const state = writable<AppState>(load());
export const toastMsg = writable('');
let toastTimer: any;
export function toast(m: string) {
  toastMsg.set(m); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastMsg.set(''), 2600);
}
let saveTimer: any;
state.subscribe((st) => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(st)); } catch { /* abaikan */ } }, 250);
});
export const answerOf = (kode: string) => {
  const st = get(state);
  return (st.s[kode] ??= {});
};
/** Toggle pilihan jawaban. Mengembalikan false bila ditolak (batas maksimal 3 pada K-02). */
export function toggleOpt(kode: string, gi: number, i: number): boolean {
  const it = BY[kode]; const g: any = P(it)[gi]; if (!g || g.k !== 'opt') return false;
  const st = get(state); const a = (st.s[kode] ??= {}); const k = 'g' + gi;
  let sel: number[] = a[k] || []; const was = sel.includes(i);
  if (was) sel = sel.filter((x) => x !== i);
  else if (!g.multi) sel = [i];
  else sel = EXC.test(g.opts[i].l) ? [i] : sel.filter((x) => !EXC.test(g.opts[x].l)).concat(i);
  if (!was && MAX3.has(kode) && sel.length > 3) { toast('Maksimal 3 pilihan untuk pertanyaan ini.'); return false; }
  a[k] = sel; state.set(st); return true;
}
export function setField(kode: string, key: string, value: string) {
  const st = get(state); (st.s[kode] ??= {})[key] = value; state.set(st);
}
export function setEvidence(kode: string, value: string) {
  const st = get(state); st.ev[kode] = value; state.set(st);
}
