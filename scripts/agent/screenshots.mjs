#!/usr/bin/env node
// Regenerates the README screenshots (.github/assets/screenshot-{light,dark}.png): the full adder example
// with A = 0, B = 1, carry in = 1 and the adder chip selected. Needs `npm run dev` running.
// `npm run screenshots` runs this, then og-image.mjs.
import { openApp } from './browser.mjs';

for (const theme of ['light', 'dark']) {
  const app = await openApp({ theme, fresh: true });
  const info = await app.run(() => {
    const s = window.__logicStudio.store;
    s.getState().loadPreset('full-adder-demo');
    s.getState()
      .nodes.filter((n) => n.data.gateType === 'INPUT')
      .forEach((n) => {
        if ((n.data.value === 1) !== /Input B|Carry/.test(n.data.label)) s.getState().toggleInputValue(n.id);
      });
    const cur = s.getState();
    const chip = cur.nodes.find((n) => n.data.gateType === 'FULL_ADDER' || /full adder/i.test(n.data.label));
    if (chip) {
      s.setState({ nodes: cur.nodes.map((n) => ({ ...n, selected: n.id === chip.id })) });
      cur.setSelectedNodeId(chip.id);
    }
    return s.getState().nodes.map((n) => `${n.data.label}=${n.data.value}`).join(', ');
  });
  if (theme === 'light') console.log(info);
  await app.page.locator('button[aria-label="Fit circuit to screen"]').click();
  await app.page.waitForTimeout(700);
  await app.page.mouse.move(1430, 850);
  const path = `.github/assets/screenshot-${theme}.png`;
  await app.page.screenshot({ path });
  console.log(`Saved ${path}`);
  if (app.errors.length) console.error(`Console errors (${theme}):\n${app.errors.join('\n')}`);
  await app.close();
}
