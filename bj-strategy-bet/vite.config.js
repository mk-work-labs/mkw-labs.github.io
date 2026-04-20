import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  // リポジトリ名（mkw-labs.github.io）がオーナー名（mk-work-labs）と
  // 一致しないため GitHub Pages は user/org site ではなく project site 扱い。
  // 公開 URL に /<repo>/ プレフィックスが付くので base もそれに合わせる
  base: '/mkw-labs.github.io/bj-strategy-bet/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        settings: resolve(__dirname, 'settings.html'),
        history: resolve(__dirname, 'history.html'),
      },
    },
  },
});
