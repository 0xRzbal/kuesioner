import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// v3: TANPA file HTML sama sekali. Entry build adalah TypeScript murni
// (src/main.ts); Vite hanya menghasilkan app.js + app.css. Dokumen halaman
// dirakit oleh server TypeScript (server/server.ts), bukan file .html.
export default defineConfig({
  appType: 'custom',
  plugins: [svelte()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: './src/main.ts',
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: 'app-[name].js',
        assetFileNames: 'app[extname]'
      }
    }
  }
});
