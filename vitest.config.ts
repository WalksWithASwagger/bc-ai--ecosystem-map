import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global test settings
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'archive/**',
        'tools/_archive/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        '**/__tests__/**',
        'ui/**', // UI has its own Jest config
      ],
      include: [
        'tools/**/*.{js,ts}',
        'lib/**/*.{js,ts}',
        'scripts/**/*.{js,ts}',
      ],
      all: true,
      lines: 60,
      functions: 60,
      branches: 60,
      statements: 60,
    },

    // Test file patterns
    include: [
      '**/__tests__/**/*.{test,spec}.{js,ts}',
      '**/*.{test,spec}.{js,ts}',
    ],

    // Files to exclude
    exclude: [
      'node_modules/**',
      'archive/**',
      'tools/_archive/**', // Exclude archived tools with node_modules
      'ui/**', // UI uses Jest
      'dist/**',
      '.next/**',
    ],

    // Test timeout (10 seconds)
    testTimeout: 10000,

    // Hook timeouts
    hookTimeout: 10000,

    // Retry failed tests once
    retry: 1,

    // Setup files
    setupFiles: ['./vitest.setup.ts'],
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@tools': path.resolve(__dirname, './tools'),
      '@lib': path.resolve(__dirname, './lib'),
    },
  },
});
