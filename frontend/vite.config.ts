import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  cacheDir: '../node_modules/.vite',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      input: {
        'place-order': resolve(__dirname, 'src/pages/place-order.ts'),
        'order-history': resolve(__dirname, 'src/pages/order-history.ts'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      },
      cache: false
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.BACKEND_API_URL,
        changeOrigin: true
      }
    }
  }
});

