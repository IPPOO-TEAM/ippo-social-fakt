import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  resolve: {
    conditions: ['development', 'browser'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
