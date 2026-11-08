import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(new URL('../..', import.meta.url).pathname);
const dist = resolve(root, 'dist');
const evidence = process.env.SCREENSHOT_DIR;
let server, browser, base;
before(async () => {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
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
  if (evidence) await mkdir(evidence, { recursive: true });
});
after(async () => { await browser?.close(); if (server) await new Promise(done => server.close(done)); });

for (const width of [1440, 390]) test(`diagram: hover, touch, keyboard and stable panels (${width}px)`, async () => {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, hasTouch: width === 390 });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator('#system');
    await section.scrollIntoViewIfNeeded();
    assert.equal(await section.count(), 1, 'diagram exists');
    await page.waitForTimeout(1200);
    if (evidence) await section.screenshot({ style: '.bar{visibility:hidden}', path: join(evidence, `diagram-${width}-idle.png`) });
    const size = await section.boundingBox();
    for (const button of await section.locator('[data-system-node]').all()) {
      const box = await button.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44);
      if (width === 390) await button.tap(); else await button.hover();
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      const key = await button.getAttribute('data-system-node');
      assert.ok(await page.locator(`#system-${key}-info`).isVisible());
      assert.equal((await section.boundingBox()).height, size.height, 'panels do not shift layout');
    }
    const owner = page.locator('[data-system-node="owner"]');
    await owner.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    assert.equal(await owner.getAttribute('aria-pressed'), 'true');
    assert.equal(await owner.evaluate(e => getComputedStyle(e).outlineStyle), 'solid');
    if (evidence) await section.screenshot({ style: '.bar{visibility:hidden}', path: join(evidence, `diagram-${width}-owner.png`) });
    await page.keyboard.press('Escape');
    assert.equal(await section.locator('[aria-pressed="true"]').count(), 0);
    assert.ok(await page.locator('#system-intro-info').isVisible());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    assert.deepEqual(errors, []);
    if (evidence) await writeFile(join(evidence, `browser-${width}.json`), JSON.stringify({ width, errors, targets: 11, panelLayoutShift: 0 }, null, 2));
  } finally { await context.close(); }
});

test('five finite accents play on the shared scheduler; offscreen and hidden draws stop', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    const arrive = async (section, id) => {
      await page.locator('#' + section).evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - 90));
      await page.waitForFunction(({ section, id }) => window.__axConductor.timeline().some(e => e.section === section && e.id === id), { section, id });
      await page.waitForFunction(() => ['cursor-blink', null].includes(window.__axConductor.current()));
    };
    await arrive('system', 'diagram-arrival');
    await arrive('work', 'head-arrival');
    await arrive('catalog', 'braille-shimmer');
    await arrive('method', 'rule-breath');
    await page.locator('#notes').evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - 90));
    await page.waitForFunction(() => window.__axConductor.active?.id === 'notes');
    await page.locator('#notes .notes-list a').first().focus();
    await page.waitForFunction(() => window.__axConductor.current() === 'link-response');
    await page.waitForFunction(() => window.__axConductor.current() === null);

    // Exercise the actual visibility listener with a controlled browser event.
    await page.locator('.gate').evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - 90));
    await page.waitForFunction(() => window.__axConductor.current() === 'caduceus-life');
    const before = await page.locator('.caduceus').innerHTML();
    await page.waitForTimeout(180);
    assert.notEqual(await page.locator('.caduceus').innerHTML(), before, 'reference caduceus remains alive');
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    const frozen = await page.locator('.caduceus').innerHTML();
    await page.waitForTimeout(250);
    assert.equal(await page.locator('.caduceus').innerHTML(), frozen);
    assert.equal(await page.evaluate(() => window.__axConductor.raf || window.__axConductor.timer), 0, 'no hidden wakeups');
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(180);
    assert.notEqual(await page.locator('.caduceus').innerHTML(), frozen, 'same engine resumes');
    await page.setViewportSize({ width: 390, height: 400 });
    await page.locator('footer').evaluate(el => el.scrollIntoView());
    await page.waitForFunction(() => window.__axConductor.active === null);
    await page.waitForTimeout(1100);
    assert.equal(await page.evaluate(() => window.__axConductor.current()), null, 'offscreen accent ended');
    assert.equal(await page.evaluate(() => window.__axConductor.raf || window.__axConductor.timer), 0);
    const timeline = await page.evaluate(() => window.__axConductor.timeline());
    for (let i = 1; i < timeline.length; i++) assert.ok(timeline[i - 1].t1 <= timeline[i].t0 && timeline[i - 1].t1 !== null, 'no overlapping accents');
    assert.deepEqual(errors, []);
    if (evidence) await writeFile(join(evidence, 'life-runtime.json'), JSON.stringify({ timeline, errors, hiddenWakeups: 0, offscreenWakeups: 0, visibilityTest: 'controlled document.hidden + visibilitychange event' }, null, 2));
  } finally { await context.close(); }
});

test('STOP signal changes color without changing text metrics', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  try {
    const page = await context.newPage();
    await page.goto(base);
    await page.locator('#story').evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - 90));
    await page.waitForSelector('.story__layer .ax-stop');
    const weights = await page.locator('.story__layer .ax-stop').first().evaluate(el => {
      el.classList.remove('is-lit');
      const before = getComputedStyle(el).fontWeight;
      el.classList.add('is-lit');
      const after = getComputedStyle(el).fontWeight;
      return [before, after];
    });
    assert.deepEqual(weights, ['600', '600'], 'reserve the bold STOP cue so lighting never shifts its ink');
  } finally { await context.close(); }
});

test('the reference caduceus resumes after reduced motion is toggled back off', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
  try {
    const page = await context.newPage();
    await page.goto(base);
    await page.locator('.gate').evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - 90));
    await page.waitForFunction(() => window.__axConductor.current() === 'caduceus-life');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !window.__axConductor.enabled);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => window.__axConductor.current() === 'caduceus-life', null, { timeout: 3000 });
  } finally { await context.close(); }
});

test('tab visibility pauses the compositor ring as well as scheduler draws', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  try {
    const page = await context.newPage();
    await page.goto(base);
    await page.locator('#story').evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - 90));
    await page.waitForFunction(() => window.__axConductor.current() === 'ring-breath');
    await page.waitForTimeout(1500);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0, 'no hidden compositor work, not even a settle');
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    assert.ok(await page.evaluate(() => document.getAnimations().some(a => a.playState === 'running' && a.effect.getTiming().iterations === Infinity)));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !window.__axConductor.enabled);
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0, 'reduced motion cancels the ring settle too');
  } finally { await context.close(); }
});

test('reduced motion keeps the interactive map but all accents stay static', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    const engines = [];
    page.on('request', r => { if (/caduceus\.js|story\.js/.test(r.url())) engines.push(r.url()); });
    await page.goto(base + '/#system');
    await page.locator('[data-system-node="standing"]').click();
    assert.ok(await page.locator('#system-standing-info').isVisible());
    assert.equal(await page.evaluate(() => window.__axConductor.enabled), false);
    assert.deepEqual(await page.evaluate(() => window.__axConductor.timeline()), []);
    assert.equal(await page.locator('.life-rule, .life-texture').count(), 0);
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    assert.deepEqual(engines, []);
    if (evidence) await page.locator('#system').screenshot({ style: '.bar{visibility:hidden}', path: join(evidence, 'diagram-390-reduced.png') });
  } finally { await context.close(); }
});

test('diagram remains readable without JavaScript', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(base + '/#system');
    assert.ok(await page.locator('#system-standing-info').isVisible());
    assert.ok(await page.locator('#system-axioma-info').isVisible());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  } finally { await context.close(); }
});
