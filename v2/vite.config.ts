import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Output statis murni (folder dist/) — dapat disajikan nginx apa adanya,
// sama seperti v1, tanpa server Node di produksi.
export default defineConfig({
  plugins: [svelte()],
  build: { outDir: 'dist', assetsInlineLimit: 4096 }
});
