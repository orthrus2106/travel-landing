import { resolve } from 'node:path';
import { defineConfig } from 'vite';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        ru: resolve(__dirname, 'index.html'),
        lv: resolve(__dirname, 'lv/index.html'),
      },
    },
  },
  plugins: [cloudflare()],
});