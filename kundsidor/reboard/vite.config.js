// Bygger ReBoards kundsida till statiska filer i public/kund/reboard/.
// Cloudflare har inget byggsteg, så byggresultatet checkas in.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/kund/reboard/',
  publicDir: 'static',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../../public/kund/reboard',
    emptyOutDir: true,
    assetsDir: 'filer',
    // Ingen preload-polyfill: den skulle bli ett inbäddat skript, som CSP:n stoppar.
    modulePreload: { polyfill: false },
  },
});
