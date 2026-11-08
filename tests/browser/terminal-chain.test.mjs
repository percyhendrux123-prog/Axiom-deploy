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
async function open(width, reducedMotion = 'no-preference') {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion });
  const page = await context.newPage();
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
    assert.deepEqual(errors, []);
    await shot(page, '.gate', 'caduceus-390-reduced');
  } finally { await context.close(); }
});
