import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://www.gamevault.es',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['www.gamevault.es', 'gamevault.es'],
      proxy: {
        '/api': 'http://localhost:4000',
      },
    },
  },
});
