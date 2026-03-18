import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'figma-asset-placeholder',
      resolveId(id) {
        if (id.startsWith('figma:asset/')) {
          return id;
        }
      },
      load(id) {
        if (id.startsWith('figma:asset/')) {
          return `export default "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='%23f3eeff'%3E%3Crect width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' fill='%23b5a4cd' font-family='sans-serif' font-size='14' text-anchor='middle' dy='.3em'%3EImage Placeholder%3C/text%3E%3C/svg%3E"`;
        }
      },
    },
  ],
});
