import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Astryx sandbox — isolated Vite dev server for the warm/minimal demo.
// Runs separately from the Electron app. `npm run v3` starts it.
export default defineConfig({
  plugins: [react()],
  root: 'src/v3',
  server: { port: 4518, open: true },
  build: { outDir: 'dist-v3', emptyOutDir: true },
});
