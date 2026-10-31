#!/usr/bin/env node
// Drive the running dev server with the preinstalled Playwright Chromium (never run `playwright install`).
//
// As a CLI:
//   node scripts/agent/browser.mjs [--url /#datasheet=74HC08] [--theme light|dark] [--fresh]
//                                  [--size 1440x860] [--eval "<js>"] [--shot out.png]
//   --eval runs in the page with `ls` = window.__logicStudio ({ store, propagateSignals }) and
//   `s` = ls.store.getState(); its return value is printed as JSON. Console errors are printed and
//   make the exit code 1.
//   Example: --eval "s.loadPreset('full-adder-demo'); return ls.store.getState().nodes.length"
//
// As a module:  import { openApp } from './browser.mjs';
//   const { page, errors, run, close } = await openApp({ theme: 'dark' });
//   await run(() => window.__logicStudio.store.getState().clearCanvas());
//
// Start the server first with `npm run dev` (port 3000); stop it with `fuser -k 3000/tcp`, not pkill.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

export const BASE_URL = process.env.LOGIC_STUDIO_URL || 'http://localhost:3000';

export async function openApp({ url = '/', theme, fresh = false, width = 1440, height = 860 } = {}) {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    throw new Error('Playwright is not available. In the cloud sandbox it is preinstalled; elsewhere run `npm i -D playwright`.');
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  const target = new URL(url, BASE_URL).toString();
  try {
    await page.goto(target);
  } catch {
    await browser.close();
    throw new Error(`Cannot reach ${BASE_URL}. Start the dev server with \`npm run dev\` first.`);
  }
  if (fresh) {
    await page.evaluate(() => localStorage.clear());
    await page.goto(target);
  }
  await page.waitForFunction(() => !!window.__logicStudio, null, { timeout: 15000 });
  // Theme goes through the store: setting data-theme by hand is undone by the app
  if (theme) await page.evaluate((t) => window.__logicStudio.store.getState().setTheme(t), theme);
  await page.waitForTimeout(400);

  return {
    browser,
    page,
    errors,
    /** Evaluate a function in the page (after the app is ready). */
    run: (fn, arg) => page.evaluate(fn, arg),
    close: () => browser.close(),
  };
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--url') opts.url = next();
    else if (a === '--theme') opts.theme = next();
    else if (a === '--fresh') opts.fresh = true;
    else if (a === '--size') [opts.width, opts.height] = next().split('x').map(Number);
    else if (a === '--eval') opts.eval = next();
    else if (a === '--shot') opts.shot = next();
    else throw new Error(`Unknown option ${a}`);
  }
  return opts;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const opts = parseArgs(process.argv.slice(2));
  const app = await openApp(opts);
  try {
    if (opts.eval) {
      const result = await app.page.evaluate((code) => {
        const ls = window.__logicStudio;
        const s = ls.store.getState();
        return new Function('ls', 's', code)(ls, s);
      }, opts.eval);
      await app.page.waitForTimeout(300);
      console.log(JSON.stringify(result ?? null, null, 2));
    }
    if (opts.shot) {
      await app.page.screenshot({ path: opts.shot });
      console.log(`Saved ${opts.shot}`);
    }
    if (app.errors.length) {
      console.error(`Console errors:\n${app.errors.join('\n')}`);
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}
