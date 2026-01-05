import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { unlinkSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'remove-old-html-files',
      apply: 'build',
      closeBundle() {
        // Remove old HTML files after build completes
        const distDir = resolve(__dirname, 'dist');
        const filesToRemove = ['shop.html', 'order-history.html', 'order-details.html', 'admin-coupons.html'];
        
        for (const file of filesToRemove) {
          try {
            unlinkSync(join(distDir, file));
            console.log(`Removed old HTML file: ${file}`);
          } catch (err) {
            // File might not exist, ignore error
          }
        }
      }
    }
  ],
  root: 'src',
  publicDir: '../public',
  cacheDir: '../node_modules/.vite',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
      cache: false
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.BACKEND_API_URL || 'http://localhost:8081',
        changeOrigin: true
      }
    }
  }
});

