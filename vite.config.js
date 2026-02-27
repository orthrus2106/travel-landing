import { resolve } from 'node:path';
import { defineConfig } from 'vite';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        lv: resolve(__dirname, 'index.html'),
        ru: resolve(__dirname, 'ru/index.html'),
      },
    },
  },
  plugins: [cloudflare()],
});