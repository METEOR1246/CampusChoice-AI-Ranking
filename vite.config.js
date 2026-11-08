import { defineConfig } from 'vite';

export default defineConfig({
  // Vanilla JS single-page app; Vite serves index.html from the project root.
  server: {
    port: 5173,
    open: false,
  },
  test: {
    // Ranking logic is pure, so tests run in a plain Node environment.
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
