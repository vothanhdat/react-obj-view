import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Macros from 'unplugin-macros/vite'

export default defineConfig({
  plugins: [Macros(), react()],
  base: '/react-obj-view/', // GitHub Pages repository name
  build: {
    target: 'esnext',
    outDir: 'demo-dist',
    emptyOutDir: true,
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});