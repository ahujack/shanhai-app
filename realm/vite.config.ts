import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// 本地开发时把 /api 转发到线上后端（与 shanhai-app 的 Vercel rewrite 一致），避免跨域。
const API_TARGET = process.env.REALM_API_TARGET || 'https://shanhai-production.up.railway.app';
const rootDir = import.meta.dirname;

export default defineConfig({
  // Vercel 挂在 /realm/；本地开发可用默认相对路径
  base: process.env.REALM_BASE || './',
  server: {
    host: true,
    port: 5273,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        comic: resolve(rootDir, 'comic.html'),
      },
    },
  },
});
