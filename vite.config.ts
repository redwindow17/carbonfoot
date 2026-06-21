/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the static build works from any sub-path (e.g. GitHub Pages).
  base: './',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Measure the whole application, not just the logic layer.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/main.tsx', // app entry point; nothing meaningful to unit-test
        'src/**/*.d.ts',
      ],
      thresholds: {
        statements: 100,
        functions: 100,
        lines: 100,
        // Two provably-unreachable defensive guards (a divide-by-zero check whose
        // divisor is always ≥ a positive constant, and a type-narrowing fallback
        // gated out by the rule's own `applies`) keep branches just under 100.
        branches: 98,
      },
    },
  },
});
