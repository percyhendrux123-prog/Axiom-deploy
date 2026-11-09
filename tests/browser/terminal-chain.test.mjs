import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';
import { chromium } from 'playwright';
const dist = resolve(new URL('../..', import.meta.url).pathname, 'dist');
const evidence = process.env.SCREENSHOT_DIR || 'qa/a298';
let server, browser, base;
before(async () => {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
  server = createServer(async (req, res) => {
    try {
      let file = resolve(dist, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (file !== dist && !file.startsWith(dist + sep)) return res.writeHead(403).end();
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(await readFile(file));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  await mkdir(evidence, { recursive: true });
});
after(async () => { await browser?.close(); if (server) await new Promise(done => server.close(done)); });
async function open(width, reducedMotion = 'no-preference', deviceScaleFactor = 1) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion, deviceScaleFactor });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__qaRafCallbacks = 0;
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = callback => raf.call(window, t => { window.__qaRafCallbacks++; callback(t); });
  });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  return { context, page, errors };
}
const arrive = (page, selector) => page.locator(selector).evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - 90));
const hide = page => page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
const show = page => page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
const shot = (page, selector, name) => page.locator(selector).screenshot({ style: '.bar{visibility:hidden}', path: join(evidence, name + '.png') });
test('a queued first entrance is cancelled when art leaves before handoff', async () => {
  const { context, page } = await open(390);
  try {
    await page.evaluate(() => { window.__axConductor.holdUntil = performance.now() + 1200; });
    await page.locator('.gate').evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - 900));
    await page.waitForFunction(() => window.__axConductor.cad?.inView && window.__axConductor.queue.some(a => a.id === 'caduceus-life'));
    await page.locator('.gate').evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - 1100));
    await page.waitForFunction(() => window.__axConductor.cad?.inView === false);
    const entrance = await page.evaluate(() => window.__axConductor.cad.entrance);
    await page.waitForTimeout(2400);
    assert.equal(await page.evaluate(() => window.__axConductor.cad.entrance), entrance, 'no unseen entrance progress');
    assert.notEqual(await page.evaluate(() => window.__axConductor.current()), 'caduceus-life');
    await arrive(page, '.gate');
    await page.waitForFunction(previous => window.__axConductor.cad.entrance > previous, entrance);
  } finally { await context.close(); }
});
test('first-view entrance starts before the gate reaches the reading line', async () => {
  const { context, page } = await open(390);
  try {
    await page.locator('.gate').evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - 650));
    await page.waitForTimeout(2000);
    assert.ok(await page.evaluate(() => window.__axConductor.cad?.entrance > 0), 'art enters while visible in lower viewport');
  } finally { await context.close(); }
});
test('reduced-motion teardown drops live sizing before a mobile resize', async () => {
  const { context, page } = await open(1440);
  try {
    await arrive(page, '#story');
    await page.waitForSelector('.story__stage.is-ready');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForSelector('.story__stage--static');
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.waitForTimeout(100);
    assert.ok((await page.locator('.medallion').boundingBox()).width < 200);
    await page.setViewportSize({ width: 320, height: 1000 });
    for (const selector of ['.medallion', '.caduceus']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= 320, `${selector} fits after teardown/resize`);
    }
  } finally { await context.close(); }
});
for (const width of [1440, 390]) test(`seven external arrows, dashed semantics and clean corners survive box fills (${width})`, async () => {
  const { context, page, errors } = await open(width, 'reduce', 2);
  try {
    await arrive(page, '#system');
    await page.waitForSelector('.has-terminal');
    const grid = await page.evaluate(() => {
      const cells = {}, draw = ROT.Display.prototype.draw;
      ROT.Display.prototype.draw = function (x, y, ch, ...rest) { cells[x + ',' + y] = ch; return draw.call(this, x, y, ch, ...rest); };
      dispatchEvent(new Event('resize'));
      ROT.Display.prototype.draw = draw;
      return cells;
    });
    const chars = Object.values(grid);
    assert.equal(chars.filter(c => '↑↓←→'.includes(c)).length, 7, 'one surviving arrow per relationship');
    assert.ok(chars.includes('╌') || chars.includes('╎'), 'handoff/refused remain dashed');
    assert.ok(!chars.includes('┼'), 'elbows have no four-way stubs');
    if (width === 390) {
      const entries = Object.keys(grid).map(k => k.split(',').map(Number));
      const cols = Math.max(...entries.map(p => p[0])) + 1, rows = Math.max(...entries.map(p => p[1])) + 1;
      for (const y of [147, 251]) assert.equal(grid[`${Math.round(128 / 350 * (cols - 1))},${Math.round(y / 642 * (rows - 1))}`], '│', 'evidence labels leave the riser cell free');
    }
    await writeFile(join(evidence, `terminal-grid-${width}.json`), JSON.stringify(grid, null, 2));
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
for (const [width, dpr] of [[1440, 2], [390, 3]]) test(`terminal backing store matches CSS size at DPR ${dpr} (${width})`, async () => {
  const { context, page, errors } = await open(width, 'reduce', dpr);
  try {
    await arrive(page, '#system');
    await page.waitForSelector('.has-terminal');
    const bounds = await page.locator('#system canvas').evaluate(c => {
      const r = c.getBoundingClientRect();
      return { backing: [c.width, c.height], css: [r.width, r.height], dpr: devicePixelRatio };
    });
    for (let axis = 0; axis < 2; axis++) assert.ok(Math.abs(bounds.backing[axis] - bounds.css[axis] * dpr) <= 1, JSON.stringify(bounds));
    assert.equal(await page.locator('#system canvas').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await writeFile(join(evidence, `terminal-${width}@${dpr}x.json`), JSON.stringify(bounds, null, 2));
    await shot(page, '#system', `terminal-${width}@${dpr}x`);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
for (const width of [1440, 390]) test(`rot Display uses one canvas, including after breakpoint resize (${width})`, async () => {
  const { context, page, errors } = await open(width);
  try {
    await arrive(page, '#system');
    await page.waitForSelector('.has-terminal');
    assert.equal(await page.locator('#system canvas').count(), 1);
    assert.equal(await page.locator('#system svg').count(), 0);
    assert.equal(await page.locator('.system__alternative').getAttribute('aria-hidden'), null);
    await shot(page, '#system', `terminal-${width}`);
    const identity = await page.locator('#system canvas').evaluate(e => { e.dataset.identity = 'same'; return e.toDataURL(); });
    assert.ok(identity.length > 1000, 'non-empty rendering');
    await page.setViewportSize({ width: width === 390 ? 1440 : 390, height: 1000 });
    await page.waitForTimeout(200);
    assert.equal(await page.locator('#system canvas').count(), 1);
    assert.equal(await page.locator('#system canvas').getAttribute('data-identity'), 'same');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
for (const width of [1440, 390]) test(`caduceus draws once, centered and pauses hidden/offscreen (${width})`, async () => {
  const { context, page, errors } = await open(width);
  try {
    await arrive(page, '.gate');
    await page.waitForFunction(() => window.__axConductor.cad?.entrance > 350 && window.__axConductor.cad.entrance < 1000);
    await hide(page);
    const partial = await page.locator('.caduceus').innerHTML();
    assert.match(partial, /cad-cursor/);
    await shot(page, '.gate', `caduceus-${width}-entrance`);
    await page.waitForTimeout(400);
    assert.equal(await page.locator('.caduceus').innerHTML(), partial);
    assert.equal(await page.evaluate(() => window.__axConductor.raf || window.__axConductor.timer), 0);
    await show(page);
    await page.waitForFunction(() => document.querySelector('.caduceus').dataset.entrance === 'settled');
    await shot(page, '.gate', `caduceus-${width}-settled`);
    const bounds = await page.locator('.caduceus').boundingBox();
    assert.ok(Math.abs(bounds.x + bounds.width / 2 - width / 2) < 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await arrive(page, '#work');
    await page.waitForTimeout(1200);
    const frozen = await page.locator('.caduceus').innerHTML();
    await page.waitForTimeout(200);
    assert.equal(await page.locator('.caduceus').innerHTML(), frozen);
    await arrive(page, '.gate');
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.__axConductor.cad.entrance), 1100);
    assert.equal(await page.locator('.cad-cursor').count(), 0);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
test('reduced motion shows the complete wide art with no entrance or engine request', async () => {
  const { context, page, errors } = await open(390, 'reduce');
  try {
    const requests = [];
    page.on('request', r => requests.push(r.url()));
    await arrive(page, '.gate');
    const html = await page.locator('.caduceus').innerHTML();
    assert.equal((await page.locator('.caduceus').textContent()).split('\n').length, 18);
    await page.waitForTimeout(500);
    assert.equal(await page.locator('.caduceus').innerHTML(), html);
    assert.ok(!requests.some(u => u.includes('caduceus.js')));
    assert.equal(await page.evaluate(() => window.__axConductor.cad), null);
    assert.equal(await page.evaluate(() => window.__qaRafCallbacks), 0, 'rot.js does not start a private loop even under reduced motion');
    assert.deepEqual(errors, []);
    await shot(page, '.gate', 'caduceus-390-reduced');
  } finally { await context.close(); }
});
for (const width of [1440, 390]) test(`braille dots add 8–12 levels to night while text contrast stays AA (${width})`, async () => {
  const { context, page, errors } = await open(width, 'reduce');
  try {
    const png = await page.screenshot({ clip: { x: 0, y: 80, width: width === 390 ? 18 : 96, height: 600 } });
    const sample = await page.evaluate(async url => {
      const image = new Image(); image.src = url; await image.decode();
      const c = document.createElement('canvas'); c.width = image.width; c.height = image.height;
      const ctx = c.getContext('2d'); ctx.drawImage(image, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let brightest = [14,15,17];
      for (let i = 0; i < data.length; i += 4) if (data[i] > brightest[0]) brightest = [...data.slice(i, i + 3)];
      const luminance = rgb => rgb.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126,.7152,.0722][i], 0);
      const contrast = rgb => (luminance(rgb) + .05) / (luminance(brightest) + .05);
      const zoom = document.createElement('canvas'); zoom.width = c.width * 2; zoom.height = c.height * 2;
      const z = zoom.getContext('2d'); z.imageSmoothingEnabled = false; z.drawImage(c, 0, 0, zoom.width, zoom.height);
      return { brightest, delta: brightest[0] - 14, dimContrast: contrast([138,142,150]), bodyContrast: contrast([217,218,220]), zoom: zoom.toDataURL() };
    }, 'data:image/png;base64,' + png.toString('base64'));
    assert.ok(sample.delta >= 8 && sample.delta <= 12, JSON.stringify({ ...sample, zoom: undefined }));
    assert.ok(sample.dimContrast >= 4.5 && sample.bodyContrast >= 4.5);
    const { zoom, ...metrics } = sample;
    await writeFile(join(evidence, `background-${width}-2x.png`), Buffer.from(zoom.split(',')[1], 'base64'));
    await writeFile(join(evidence, `background-${width}-contrast.json`), JSON.stringify(metrics, null, 2));
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
for (const width of [1440, 390]) test(`braille background drifts cheaply and freezes hidden/offscreen (${width})`, async () => {
  const { context, page, errors } = await open(width);
  try {
    const tile = page.locator('.page-texture__tile');
    await tile.waitFor({ state: 'attached' });
    const first = await tile.getAttribute('style');
    await page.waitForTimeout(850);
    assert.notEqual(await tile.getAttribute('style'), first);
    await page.screenshot({ path: join(evidence, `background-${width}.png`) });
    await hide(page);
    const frozen = await tile.getAttribute('style');
    const hiddenFrames = await page.evaluate(() => window.__qaRafCallbacks);
    await page.waitForTimeout(500);
    assert.equal(await tile.getAttribute('style'), frozen);
    assert.equal(await page.evaluate(() => window.__qaRafCallbacks), hiddenFrames, 'zero hidden RAF callbacks from any engine');
    assert.equal(await page.evaluate(() => window.__axConductor.raf || window.__axConductor.timer), 0);
    await show(page);
    await page.setViewportSize({ width, height: 400 });
    await page.locator('footer').evaluate(e => e.scrollIntoView());
    await page.waitForFunction(() => window.__axConductor.active === null);
    await page.waitForTimeout(1200);
    const offscreen = await tile.getAttribute('style');
    const offscreenFrames = await page.evaluate(() => window.__qaRafCallbacks);
    await page.waitForTimeout(400);
    assert.equal(await tile.getAttribute('style'), offscreen);
    assert.equal(await page.evaluate(() => window.__qaRafCallbacks), offscreenFrames, 'zero offscreen RAF callbacks, including vendor');
    assert.equal(await page.evaluate(() => window.__axConductor.raf || window.__axConductor.timer), 0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
test('braille loader runs only during a real walkthrough and freezes with its progress', async () => {
  const { context, page, errors } = await open(390);
  try {
    await arrive(page, '#system');
    const spinner = page.locator('.system__spinner');
    await spinner.waitFor({ state: 'attached', timeout: 1500 });
    assert.equal(await spinner.textContent(), '');
    await page.getByRole('button', { name: 'Run one order', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.system__spinner').textContent.length === 1);
    const first = await spinner.textContent();
    await page.waitForTimeout(140);
    assert.notEqual(await spinner.textContent(), first);
    await hide(page);
    const frozen = await spinner.textContent();
    await page.waitForTimeout(350);
    assert.equal(await spinner.textContent(), frozen);
    await show(page);
    await page.waitForFunction(() => document.querySelector('#system').dataset.runStep === 'gatekeeper');
    await shot(page, '#system', 'spinner-390-gate-check');
    await page.keyboard.press('Escape');
    assert.equal(await spinner.textContent(), '');
    await page.waitForTimeout(200);
    assert.equal(await spinner.textContent(), '');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', { name: 'Run one order', exact: true }).click();
    assert.equal(await spinner.textContent(), '', 'manual waiting is not working');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
for (const width of [1440, 390]) test(`LiquidMetal stays on one herm ring and pauses with the conductor (${width})`, async () => {
  const { context, page, errors } = await open(width);
  try {
    await arrive(page, '#story');
    await page.waitForFunction(() => window.__axConductor.chrome?.status().draws > 2);
    assert.equal(await page.locator('.medallion__chrome').count(), 1);
    assert.equal(await page.locator('.medallion__ring').count(), 1, 'SVG fallback retained');
    assert.equal(await page.evaluate(() => window.__axConductor.chrome.status().error), 0);
    const startDraws = await page.evaluate(() => window.__axConductor.chrome.status().draws);
    await page.waitForTimeout(900);
    const visibleDraws = await page.evaluate(() => window.__axConductor.chrome.status().draws) - startDraws;
    assert.ok(visibleDraws > 2 && visibleDraws <= 12, `bounded shader draws: ${visibleDraws} / 900ms`);
    await writeFile(join(evidence, `chrome-${width}.json`), JSON.stringify({ width, visibleDraws, sampleMs: 900, glError: 0, canvasCount: 1 }, null, 2));
    await shot(page, '#story', `chrome-${width}`);
    await hide(page);
    const frozen = await page.evaluate(() => window.__axConductor.chrome.status().draws);
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => window.__axConductor.chrome.status().draws), frozen);
    await show(page);
    await arrive(page, '#work');
    await page.waitForTimeout(150);
    const offscreen = await page.evaluate(() => window.__axConductor.chrome.status().draws);
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => window.__axConductor.chrome.status().draws), offscreen);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !window.__axConductor.enabled);
    assert.equal(await page.locator('.medallion__chrome:visible').count(), 0);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
test('no WebGL uses the original SVG; reduced motion allocates no chrome canvas', async () => {
  for (const reduced of [false, true]) {
    const { context, page, errors } = await open(390, reduced ? 'reduce' : 'no-preference');
    try {
      if (!reduced) await page.evaluate(() => {
        const get = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (kind, ...args) { return kind === 'webgl2' ? null : get.call(this, kind, ...args); };
      });
      await arrive(page, '#story');
      await page.waitForTimeout(500);
      assert.equal(await page.locator('.medallion__chrome').count(), 0);
      assert.equal(await page.locator('.medallion__ring').count(), 1);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
});
for (const width of [1440, 390]) test(`Hermes herm is noticeably larger in live and static layouts (${width})`, async () => {
  for (const motion of ['no-preference', 'reduce']) {
    const { context, page, errors } = await open(width, motion);
    try {
      await arrive(page, '#story');
      if (motion === 'no-preference') await page.waitForSelector('.story__stage.is-ready');
      const box = await page.locator('.medallion').boundingBox();
      assert.ok(box.width >= (width === 390 ? 165 : 320), `medallion ${box.width}px`);
      assert.ok(box.x >= 0 && box.x + box.width <= width);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      await writeFile(join(evidence, `medallion-${width}-${motion}.json`), JSON.stringify({ viewportWidth: width, motion, box }, null, 2));
      await shot(page, '#story', `medallion-${width}-${motion}`);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
});
