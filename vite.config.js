import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Publish only paths that exist, so empty image slots make no missing-file requests.
function eventImageManifest() {
  const id = '\0virtual:event-images';
  const directory = fileURLToPath(new URL('./public/images/events/', import.meta.url));
  return {
    name: 'event-image-manifest',
    resolveId(source) {
      if (source === 'virtual:event-images') return id;
    },
    load(source) {
      if (source !== id) return;
      const paths = readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.webp'))
        .map((entry) => `/images/events/${entry.name}`);
      return `export default ${JSON.stringify(paths)};`;
    },
    configureServer(server) {
      server.watcher.add(directory);
      const refresh = (file) => {
        if (!file.replaceAll('\\', '/').startsWith(directory.replaceAll('\\', '/'))) return;
        const module = server.moduleGraph.getModuleById(id);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', refresh);
      server.watcher.on('unlink', refresh);
    },
  };
}

export default defineConfig({
  plugins: [eventImageManifest()],
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
