import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Redirect Phaser imports to a lightweight mock so tests can run
      // in Node without canvas/DOM/WebGL dependencies.
      phaser: new URL('./src/__mocks__/phaser.ts', import.meta.url).pathname,
    },
  },
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: [
        'src/systems/*.ts',
      ],
      reporter: ['text', 'text-summary'],
    },
  },
});
