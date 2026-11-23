import { defineConfig } from 'tsup'
import { copyFile } from 'node:fs/promises'
export default defineConfig({
  entry: [
    'src/index.ts',
    'src/forms.tsx',
    'src/scheduler.tsx',
    'src/dashboard.tsx',
    'src/workflow.tsx',
    'src/gantt.tsx',
    'src/document.tsx',
    'src/charts.tsx',
    'src/application.tsx',
    'src/core.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  banner: { js: '"use client";' },
  async onSuccess() {
    await copyFile('src/styles.css', 'dist/styles.css')
  },
})
