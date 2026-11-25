/**
 * Waktu Indonesia Barat (UTC+7) untuk semua cap waktu yang dikirim ke peneliti.
 * Server/Sheet menerima string siap-baca, bukan ISO UTC, supaya tidak perlu
 * dikonversi manual saat direkap.
 */
const P = (n: number) => String(n).padStart(2, '0');

export function wibStamp(d: Date = new Date()): string {
  const t = new Date(d.getTime() + 7 * 3600 * 1000);
  return `${t.getUTCFullYear()}-${P(t.getUTCMonth() + 1)}-${P(t.getUTCDate())} ${P(t.getUTCHours())}:${P(t.getUTCMinutes())}:${P(t.getUTCSeconds())} WIB`;
}

export function wibPretty(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const t = new Date(d.getTime() + 7 * 3600 * 1000);
  return `${P(t.getUTCDate())}/${P(t.getUTCMonth() + 1)}/${t.getUTCFullYear()} ${P(t.getUTCHours())}:${P(t.getUTCMinutes())} WIB`;
}
