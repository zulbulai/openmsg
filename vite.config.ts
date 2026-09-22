import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest-and-assets',
      closeBundle() {
        if (!fs.existsSync('dist')) fs.mkdirSync('dist', { recursive: true });
        fs.copyFileSync('manifest.json', 'dist/manifest.json');
        if (fs.existsSync('public/icons')) {
          if (!fs.existsSync('dist/icons')) fs.mkdirSync('dist/icons', { recursive: true });
          for (const icon of fs.readdirSync('public/icons')) {
            fs.copyFileSync(`public/icons/${icon}`, `dist/icons/${icon}`);
          }
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      input: {
        options: resolve(__dirname, 'options.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.tsx'),
        injected: resolve(__dirname, 'src/injected/whatsapp-bridge.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          if (chunkInfo.name === 'content') return 'content.js';
          if (chunkInfo.name === 'injected') return 'injected.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.css' || assetInfo.name === 'content.css') {
            return 'content.css'; // Output predictable CSS name for manifest
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
  },
});
