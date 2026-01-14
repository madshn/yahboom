import { defineConfig } from 'vite';
import { cpSync } from 'fs';

export default defineConfig({
  root: 'public',
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  plugins: [
    {
      name: 'copy-js-files',
      closeBundle() {
        // Copy non-module JS files to dist
        const files = ['app.js', 'step-viewer.js', 'lesson-viewer.js'];
        files.forEach(file => {
          cpSync(`public/${file}`, `dist/${file}`);
        });
        // Copy data directory
        cpSync('public/data', 'dist/data', { recursive: true });
        // Copy images directory
        cpSync('public/images', 'dist/images', { recursive: true });
      }
    }
  ],
});
