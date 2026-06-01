import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Provide a fixed admin ID so AdminRoute tests can reference a known value
    'import.meta.env.VITE_ADMIN_USER_ID': JSON.stringify('test-admin-id'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        'src/components/ui/**',
        'src/lib/**',
        '**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 65,
      },
    },
  },
});
