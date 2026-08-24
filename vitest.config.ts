import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['server/tests/**/*.test.ts', 'src/tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['server/**/*.ts', 'src/store/**/*.ts', 'src/lib/api.ts'],
      exclude: ['server/index.ts', 'server/config/**'],
      thresholds: { lines: 70, functions: 70 },
    },
    setupFiles: ['server/tests/setup.ts'],
  },
});
