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

// Satu-satunya "HTML" di proyek ini: string yang dirakit kode TypeScript
// saat request datang — bukan file, tidak ada di disk sebagai .html.
function renderDocument(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>QA/QC CBCT Ekstraoral</title>
<meta name="description" content="Formulir klarifikasi pelaksanaan QA/QC CBCT ekstraoral. 25 butir dalam 13 bagian untuk fasilitas RSDK dan RSGM.">
<meta property="og:title" content="QA/QC CBCT Ekstraoral">
<meta property="og:description" content="Formulir klarifikasi: 25 butir, 13 bagian, estimasi 10–15 menit. Baca pengantar dan seluruh pertanyaan sebelum mengisi.">
<meta property="og:type" content="website">
<meta name="theme-color" content="#001f54">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/favicon-64.png" sizes="64x64" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
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

const ASSETS: Record<string, { file: string; type: string; cache?: boolean }> = {
  '/app.js': { file: 'app.js', type: 'text/javascript; charset=utf-8' },
  '/app.css': { file: 'app.css', type: 'text/css; charset=utf-8' },
  '/app-peneliti.jpg': { file: 'app-peneliti.jpg', type: 'image/jpeg', cache: true },
  '/favicon.ico': { file: 'favicon.ico', type: 'image/x-icon', cache: true },
  '/favicon-32.png': { file: 'favicon-32.png', type: 'image/png', cache: true },
  '/favicon-64.png': { file: 'favicon-64.png', type: 'image/png', cache: true },
  '/apple-touch-icon.png': { file: 'apple-touch-icon.png', type: 'image/png', cache: true }
};

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const path = (req.url || '/').split('?')[0];
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');

  const asset = ASSETS[path];
  if (asset) {
    try {
      const body = await readFile(join(DIST, asset.file));
      res.writeHead(200, { 'Content-Type': asset.type, 'Cache-Control': asset.cache ? 'public, max-age=86400' : 'no-cache' });
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
