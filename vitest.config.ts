import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TREE_CORE_SRC = resolve(__dirname, 'packages/tree-core/src')

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    exclude: [
      'node_modules/**',
      'dist/**',
      'packages/tree-core/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/dev.tsx',
        'src/Test.tsx',
        'src/V5/test.ts',
        'src/V5/test2.ts',
        'src/V5/benkmark.ts',
        'src/exampleData/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@react-obj-view/tree-core': TREE_CORE_SRC,
    },
  },
})
