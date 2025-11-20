import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Macros from 'unplugin-macros/vite'

export default defineConfig({
  plugins: [
    Macros(),
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"]
      }
    }),
  ],
  build: {
    target: 'esnext',
  }
});