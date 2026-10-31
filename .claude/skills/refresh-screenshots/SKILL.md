---
name: refresh-screenshots
description: Regenerate Logic Studio's README screenshots (.github/assets) and the link-preview image (public/og-image.png). Use after UI changes that make the existing images look out of date.
---

# Refresh screenshots

1. Start the dev server: `npm run dev > /tmp/dev.log 2>&1 &` and wait for `curl -s localhost:3000`.
2. `npm run screenshots` — runs `scripts/agent/screenshots.mjs` (full adder example, A = 0, B = 1, Cin = 1, adder selected, light and dark, 1440 × 860, fresh `localStorage`) and then `scripts/agent/og-image.mjs` (1200 × 630 card from the logo and the light screenshot).
3. **Look at** `.github/assets/screenshot-light.png`, `screenshot-dark.png` and `public/og-image.png` (Read the PNGs). Check the canvas is fitted, nothing is cut off and the console printed no errors.
4. `.github/assets/screenshot-truth-table.png` is not scripted: if the truth table dialog changed, take it by hand with `scripts/agent/browser.mjs` (load the full adder, click "Truth table", screenshot at 1440 × 860).
5. Stop the server with `fuser -k 3000/tcp` and commit the images with the change that made them stale.

If the shot needs a different circuit or state, edit `scripts/agent/screenshots.mjs` rather than taking one-off screenshots, so the next refresh matches.
