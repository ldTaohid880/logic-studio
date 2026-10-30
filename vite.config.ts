import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {readFileSync} from 'fs';
import {defineConfig, Plugin} from 'vite';

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')) as {version: string};

// Link previews need absolute URLs: SITE_URL, else Vercel's production domain, else the public deployment
const siteUrl = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
  'https://logic-studio-gamma.vercel.app'
).replace(/\/$/, '');

function absoluteSiteUrls(): Plugin {
  return {
    name: 'absolute-site-urls',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), absoluteSiteUrls()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      // .claude/ holds local backups and tooling, not project tests
      exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
      setupFiles: ['src/test/setup.ts'],
    },
  };
});
