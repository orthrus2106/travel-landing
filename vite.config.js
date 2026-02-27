import { resolve } from 'node:path';
import { defineConfig } from 'vite';

let cloudflarePlugin = null;

try {
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  cloudflarePlugin = cloudflare();
} catch {
  // Optional in local/dev environments where npm registry access is unavailable.
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        lv: resolve(__dirname, 'index.html'),
        ru: resolve(__dirname, 'ru/index.html'),
      },
    },
  },
  plugins: cloudflarePlugin ? [cloudflarePlugin] : [],
});
