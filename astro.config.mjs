import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.SITE_URL?.trim() || 'https://preview.felya.com';

export default defineConfig({
  site,
  output: 'static',
  vite: {
    plugins: [tailwindcss()]
  },
  build: {
    format: 'directory',
    inlineStylesheets: 'never'
  }
});
