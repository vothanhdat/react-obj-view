import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TREE_CORE_SRC = resolve(__dirname, 'packages/tree-core/src');

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"]
      }
    }),
  ],
  build: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@react-obj-view/tree-core': TREE_CORE_SRC,
    },
  },
});
