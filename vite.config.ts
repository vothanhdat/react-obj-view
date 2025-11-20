import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts'
import Macros from 'unplugin-macros/vite'

import { analyzer } from 'vite-bundle-analyzer'

const ENABLE_BUILD_ANALYZER = !!(process.env.ANALYZER)

export default defineConfig({
  plugins: [
    Macros(),
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"]
      }
    }),
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/test/**'],
    }),
    ...ENABLE_BUILD_ANALYZER ? [
      analyzer({
        analyzerMode: "server",
        openAnalyzer: true
      }),
    ] : []
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'react-obj-view',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      // Ensure to externalize deps that shouldn't be bundled
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true
  },
  server: {
    port: 3000,
  },
});