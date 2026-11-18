// Server produksi kuesioner CBCT v3 — TypeScript murni, tanpa dependensi,
// dan TANPA satu pun file HTML di repo ini. Dokumen halaman dirakit sebagai
// string oleh fungsi renderDocument() di bawah; aset aplikasi (app.js/app.css)
// adalah hasil build Vite dari source TypeScript/Svelte di src/.
//
// Jalankan:  npm run build && npm start
// Env:       PORT (default 8080), HOST (default 127.0.0.1 — di belakang nginx)
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '127.0.0.1';

const FAVICON_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='#001f54'/><rect y='58' width='64' height='6' fill='#ffd600'/><text x='32' y='42' font-family='Arial,sans-serif' font-size='26' font-weight='700' fill='white' text-anchor='middle'>CB</text></svg>`;

// Satu-satunya "HTML" di proyek ini: string yang dirakit kode TypeScript
// saat request datang — bukan file, tidak ada di disk sebagai .html.
function renderDocument(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Kuesioner QA/QC CBCT — Alternatif tanpa Uji Phantom</title>
<meta name="description" content="Kuesioner penelitian QA/QC CBCT — Alternatif tanpa Uji Phantom. 24 butir terpilih dalam 12 bagian untuk fasilitas RSDK dan RSGM.">
<meta property="og:title" content="Kuesioner QA/QC CBCT — Alternatif tanpa Uji Phantom">
<meta property="og:description" content="Kuesioner penelitian: 24 butir, 12 bagian, estimasi 10–20 menit. Baca pengantar dan seluruh pertanyaan sebelum mengisi.">
<meta property="og:type" content="website">
<meta name="theme-color" content="#001f54">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/app.css">
</head>
<body>
<div id="app"></div>
<script type="module" src="/app.js"></script>
</body>
</html>`;
}

const ASSETS: Record<string, { file: string; type: string }> = {
  '/app.js': { file: 'app.js', type: 'text/javascript; charset=utf-8' },
  '/app.css': { file: 'app.css', type: 'text/css; charset=utf-8' }
};

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const path = (req.url || '/').split('?')[0];
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');

  if (path === '/favicon.svg') {
    res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
    res.end(FAVICON_SVG);
    return;
  }
  const asset = ASSETS[path];
  if (asset) {
    try {
      const body = await readFile(join(DIST, asset.file));
      res.writeHead(200, { 'Content-Type': asset.type, 'Cache-Control': 'no-cache' });
      res.end(body);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Aset belum dibangun. Jalankan: npm run build');
    }
    return;
  }
  // Semua rute lain = dokumen aplikasi (satu halaman).
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end(renderDocument());
}

createServer((req, res) => {
  handle(req, res).catch(() => {
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Kesalahan server');
  });
}).listen(PORT, HOST, () => {
  console.log(`Kuesioner CBCT v3 berjalan di http://${HOST}:${PORT}`);
});
