import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// PLACEHOLDER: change to the real production domain.
export default defineConfig({
  site: 'https://swift-ai.in',
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: { format: 'directory' },
});
