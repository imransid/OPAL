import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

const siteUrl = process.env.PUBLIC_SITE_URL || 'https://opal.example.com';

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/api') &&
        page !== `${siteUrl}/api/`,
    }),
  ],
  site: siteUrl,
  base: '/',
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: [
            'global-builtin',
            'import',
            'color-functions',
            'if-function',
            'abs-percent',
          ],
        },
      },
    },
  },
});