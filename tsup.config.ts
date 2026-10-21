import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsup'

const { version } = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string }

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2020',
  external: ['react', '@ketapay/checkout'],
  // Next.js App Router: the hook and the button are client components.
  banner: { js: "'use client'" },
  define: { __SDK_VERSION__: JSON.stringify(version) },
})
