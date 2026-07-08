import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    environmentMatchGlobs: [
      ['src/admin/auth/**', 'happy-dom'],
      ['src/admin/hooks/**', 'happy-dom'],
      ['src/admin/components/**', 'happy-dom'],
      ['src/admin/pages/**', 'happy-dom'],
    ],
  },
})