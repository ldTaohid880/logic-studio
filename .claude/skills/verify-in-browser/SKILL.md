---
name: verify-in-browser
description: Run Logic Studio and check a change in a real browser (Playwright Chromium) — drive the store, take screenshots, catch console errors, check both themes and phone width. Use after UI or behaviour changes, before saying a feature works.
---

# Verify in the browser

Chromium and Playwright are preinstalled in the cloud sandbox: `require('playwright')` works, **never run `npx playwright install`** (another version won't find the browser).

## Start and stop

```bash
npm run dev > /tmp/dev.log 2>&1 &          # http://localhost:3000; wait until `curl -s localhost:3000` answers
fuser -k 3000/tcp                          # stop it — never pkill (it can kill your own shell)
```

## One-shot checks: `scripts/agent/browser.mjs`

```bash
# state + screenshot; `ls` = window.__logicStudio, `s` = ls.store.getState()
node scripts/agent/browser.mjs --fresh --theme dark \
  --eval "s.loadPreset('full-adder-demo'); return ls.store.getState().nodes.map(n => [n.data.label, n.data.value])" \
  --shot /path/in/scratchpad/adder-dark.png

node scripts/agent/browser.mjs --url "/#datasheet=74HC08" --theme light --shot ds.png   # open by link
node scripts/agent/browser.mjs --size 390x844 --shot phone.png                          # phone width
```

Console errors are printed and make the exit code 1. Then **look at the screenshot** (Read the PNG) — a passing script is not a correct UI.

## Longer flows: import the helper

```js
import { openApp } from './scripts/agent/browser.mjs';
const { page, errors, run, close } = await openApp({ theme: 'light', fresh: true });
await run(() => window.__logicStudio.store.getState().addNode('AND', { x: 300, y: 200 }));
await page.getByRole('button', { name: 'Truth table' }).click();
await page.screenshot({ path: 'tt.png' });
await close();
```

## Tips

- `window.__logicStudio` (`store`, `propagateSignals`) exists in dev builds only. Don't `import('/src/store/useCircuitStore.ts')`: after hot reloads it can be a second store.
- Theme: `setTheme` through the store (`--theme`); setting `data-theme` by hand is undone by the app.
- `--fresh` clears `localStorage` (autosave, projects, prefs) so you start from the default circuit; your experiments otherwise persist.
- Running time (clock/board): the timing panel's run loop is driven by requestAnimationFrame, so wait (`page.waitForTimeout`) or call `advanceTimeline(ms)` on the store.
- Multi-select: React Flow reads Ctrl/Cmd from key state — send `keyboard.down('Control')` before the clicks.
- Print layout: `page.emulateMedia({ media: 'print' })`.
- Check both themes and 390px width for anything visual, and that the console stays clean.
