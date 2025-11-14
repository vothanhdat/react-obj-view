import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TREE_CORE_SRC = resolve(__dirname, 'packages/tree-core/src');

export default defineConfig({
  plugins: [react()],
  base: '/react-obj-view/', // GitHub Pages repository name
  build: {
    target: 'esnext',
    outDir: 'demo-dist',
    emptyOutDir: true,
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  resolve: {
    alias: {
      '@react-obj-view/tree-core': TREE_CORE_SRC,
    },
  },
});
