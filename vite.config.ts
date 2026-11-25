import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { weddingConfig } from './src/config/weddingConfig';
import { mockApi } from './dev/mockApi';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Injects SEO + Open Graph tags from weddingConfig so WhatsApp, Facebook and
 * search engines see the couple's names and photo without running JavaScript.
 */
function seoFromConfig(): Plugin {
  return {
    name: 'wedding-seo',
    transformIndexHtml(html) {
      const { seo, siteUrl } = weddingConfig;
      const base = siteUrl.replace(/\/$/, '');
      const image = seo.ogImage.startsWith('http') ? seo.ogImage : `${base}${seo.ogImage}`;
      const tags = [
        `<title>${esc(seo.title)}</title>`,
        `<meta name="description" content="${esc(seo.description)}" />`,
        `<link rel="canonical" href="${esc(base)}/" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:url" content="${esc(base)}/" />`,
        `<meta property="og:title" content="${esc(seo.title)}" />`,
        `<meta property="og:description" content="${esc(seo.description)}" />`,
        `<meta property="og:image" content="${esc(image)}" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${esc(seo.title)}" />`,
        `<meta name="twitter:description" content="${esc(seo.description)}" />`,
        `<meta name="twitter:image" content="${esc(image)}" />`,
      ];
      return html.replace('<!--seo-->', tags.join('\n    '));
    },
  };
}

export default defineConfig(({ mode }) => {
  // Reads .env.development.local etc. (including non-VITE_ keys, which stay on the dev server).
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // Sub-folder the site is served from: '/' locally and on Netlify,
    // '/wedding/' on GitHub Pages (set by .github/workflows/deploy.yml).
    base: env.BASE_PATH || '/',
    plugins: [
      react(),
      seoFromConfig(),
      // Local test backend for wishes + /admin; only active with `npm run dev`.
      mockApi({ username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD }, env.WISHES_AUTO_APPROVE === 'true'),
    ],
    build: {
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: { motion: ['framer-motion'], react: ['react', 'react-dom'] },
        },
      },
    },
  };
});
