import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts'
import { analyzer } from 'vite-bundle-analyzer'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ENABLE_BUILD_ANALYZER = !!(process.env.ANALYZER)
const __dirname = dirname(fileURLToPath(import.meta.url))
const TREE_CORE_SRC = resolve(__dirname, 'packages/tree-core/src')

export default defineConfig({
  plugins: [
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
  resolve: {
    alias: {
      '@react-obj-view/tree-core': TREE_CORE_SRC,
    },
  },
  server: {
    port: 3000,
  },
});
