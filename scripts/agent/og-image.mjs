#!/usr/bin/env node
// Builds the link-preview image public/og-image.png (1200 × 630) from the logo and the light screenshot.
// Run screenshots.mjs first (`npm run screenshots` runs both). Does not need the dev server.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const { chromium } = createRequire(import.meta.url)('playwright');

const shot = readFileSync('.github/assets/screenshot-light.png').toString('base64');
const logo = readFileSync('public/favicon.svg').toString('base64');
const html = `<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:630px;background:#111214;position:relative;overflow:hidden;font-family:Inter,ui-sans-serif,system-ui,sans-serif">
  <img src="data:image/svg+xml;base64,${logo}" style="position:absolute;left:64px;top:72px;width:72px;height:72px;border-radius:16px">
  <div style="position:absolute;left:64px;top:168px;color:#fff;font-size:64px;font-weight:700;letter-spacing:-1.5px">Logic Studio</div>
  <div style="position:absolute;left:64px;top:258px;width:500px;color:#c3c7ce;font-size:28px;line-height:1.3">Build and simulate digital logic circuits in your browser.</div>
  <div style="position:absolute;left:64px;top:358px;width:500px;color:#8b9099;font-size:21px;line-height:1.4">Live signals · truth tables · clocks and timing · an Uno-compatible board · datasheets</div>
  <div style="position:absolute;left:580px;top:80px;width:700px;height:620px;border-radius:12px;overflow:hidden;box-shadow:0 0 0 1px #2c2f35,0 20px 60px rgb(0 0 0/.5)">
    <img src="data:image/png;base64,${shot}" style="width:950px;display:block">
  </div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.waitForTimeout(300);
await page.screenshot({ path: 'public/og-image.png' });
await browser.close();
console.log('Saved public/og-image.png');
