import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';
import { chromium } from 'playwright';

const dist = resolve(new URL('../..', import.meta.url).pathname, 'dist');
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

async function open(width = 1440, reducedMotion = 'no-preference') {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  await arrive(page, 'system');
  return { context, page, errors };
}
async function arrive(page, id) {
  await page.locator('#' + id).evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - 90));
  await page.waitForTimeout(100);
}
test('manual walkthrough never turns into an animated order when motion is re-enabled', async () => {
  const { context, page, errors } = await open(390, 'reduce');
  try {
    await page.getByRole('button', { name: 'Run one order', exact: true }).click();
    await page.getByRole('button', { name: 'Next step', exact: true }).click();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#system').getAttribute('data-run-state'), 'idle');
    assert.ok(await page.locator('#system-intro-info').isVisible());
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

for (const width of [1440, 390]) test(`walkthrough routes stay on visible edges or inside nodes (${width}px)`, async () => {
  const { context, page, errors } = await open(width);
  try {
    await page.getByRole('button', { name: 'Run one order', exact: true }).click();
    await page.waitForSelector('.system__journey', { state: 'attached' });
    const misses = await page.evaluate(() => {
      const svg = [...document.querySelectorAll('.system__lines')].find(e => getComputedStyle(e).display !== 'none');
      const boxes = [...document.querySelectorAll('[data-system-node]')].map(e => e.getBoundingClientRect());
      const matrix = svg.getScreenCTM();
      const screen = p => new DOMPoint(p.x, p.y).matrixTransform(matrix);
      const points = [...svg.querySelectorAll('.system__edge > path')].flatMap(path => {
        const length = path.getTotalLength();
        return Array.from({ length: Math.ceil(length) + 1 }, (_, i) => screen(path.getPointAtLength(i)));
      });
      return [...svg.querySelectorAll('.system__journey')].flatMap((path, route) => {
        const length = path.getTotalLength();
        return Array.from({ length: 101 }, (_, i) => screen(path.getPointAtLength(length * i / 100)))
          .filter(p => !boxes.some(b => p.x >= b.left - 2 && p.x <= b.right + 2 && p.y >= b.top - 2 && p.y <= b.bottom + 2)
            && !points.some(q => Math.hypot(p.x - q.x, p.y - q.y) < 2))
          .map(p => ({ route, x: p.x, y: p.y }));
      });
    });
    assert.deepEqual(misses, [], 'no decorative shortcuts across empty space');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('runtime sample: at most 30 pulse draws/s, bounded CPU, zero hidden work', async () => {
  const { context, page, errors } = await open();
  try {
    await page.waitForFunction(() => window.__axConductor.current() === 'chain-life');
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    await page.evaluate(() => {
      window.__pulseFrames = [];
      window.__pulseObserver = new MutationObserver(() => window.__pulseFrames.push(performance.now()));
      window.__pulseObserver.observe(document.querySelector('.system__lines--wide .system__pulse'), { attributes: true, attributeFilter: ['transform'] });
    });
    const sample = async (label, ms) => {
      const before = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
      await page.waitForTimeout(ms);
      const after = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
      const frames = await page.evaluate(() => window.__pulseFrames.splice(0));
      const duration = after.Timestamp - before.Timestamp;
      return { label, seconds: duration, draws: frames.length, drawsPerSecond: frames.length / duration,
        maxDrawsInOneSecond: Math.max(0, ...frames.map(t => frames.filter(s => s >= t && s < t + 999).length)),
        rendererTaskPercent: (after.TaskDuration - before.TaskDuration) / duration * 100,
        scriptPercent: (after.ScriptDuration - before.ScriptDuration) / duration * 100 };
    };
    const samples = [await sample('ambient', 4000)];
    await page.getByRole('button', { name: 'Run one order', exact: true }).click();
    samples.push(await sample('order', 3500));
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    samples.push(await sample('hidden', 1500));
    assert.ok(samples.every(s => s.maxDrawsInOneSecond <= 30), JSON.stringify(samples));
    assert.equal(samples[2].draws, 0);
    assert.ok(samples[0].draws > 40, 'continuing frames, not a one-shot');
    assert.deepEqual(errors, []);
    console.log('runtime samples', JSON.stringify(samples));
    if (evidence) await writeFile(join(evidence, 'runtime.json'), JSON.stringify({ environment: 'headless Chromium in appbuilder Linux Space; renderer task/script percentages, not device CPU or battery', samples, errors }, null, 2));
  } finally { await context.close(); }
});

const pulse = page => page.locator('.system__lines--wide .system__pulse');
for (const width of [1440, 390]) test(`one order visits every gate, returns evidence, replays and cancels (${width}px)`, async () => {
  const { context, page, errors } = await open(width);
  try {
    const section = page.locator('#system');
    const run = page.getByRole('button', { name: 'Run one order', exact: true });
    await run.waitFor({ timeout: 2000 });
    const size = await section.boundingBox();
    for (const control of await section.locator('.system__controls button').all()) {
      const box = await control.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44, '44px run/cancel targets');
    }
    if (evidence) {
      await page.waitForFunction(() => window.__axConductor.current() === 'chain-life');
      await page.waitForTimeout(900);
      await section.screenshot({ style: '.bar{visibility:hidden}', path: join(evidence, `chain-${width}-idle.png`) });
    }
    await run.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('#system').dataset.runState === 'running');
    const start = Date.now();
    const gates = [];
    for (const key of ['owner', 'operator', 'workers', 'axioma', 'gatekeeper', 'standing', 'tripwire', 'handydandy']) {
      await page.waitForFunction(key => document.querySelector('#system').dataset.runStep === key, key, { timeout: 4000 });
      assert.ok(await page.locator(`#system-${key}-info`).isVisible(), key);
      assert.equal(await page.locator(`[data-system-node="${key}"]`).getAttribute('aria-pressed'), 'true');
      gates.push(key);
      if (key === 'gatekeeper' && evidence) await section.screenshot({ style: '.bar{visibility:hidden}', path: join(evidence, `chain-${width}-mid-run.png`) });
    }
    await page.waitForFunction(() => document.querySelector('#system').dataset.runState === 'idle', null, { timeout: 4000 });
    const duration = Date.now() - start;
    assert.ok(duration >= 10000 && duration <= 14000, `active run ${duration}ms`);
    assert.ok(await page.locator('#system-owner-info').isVisible());
    assert.equal((await section.boundingBox()).height, size.height);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await run.click();
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: 'Cancel order', exact: true }).click();
    assert.equal(await section.getAttribute('data-run-state'), 'idle');
    assert.ok(await page.locator('#system-intro-info').isVisible());
    assert.ok(await run.evaluate(e => document.activeElement === e), 'cancel restores keyboard focus');
    await run.press('Space');
    await page.waitForTimeout(250);
    await page.keyboard.press('Escape');
    assert.equal(await section.getAttribute('data-run-state'), 'idle');
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.__axConductor.current()), 'chain-life');
    assert.deepEqual(errors, []);
    if (evidence) await writeFile(join(evidence, `run-${width}.json`), JSON.stringify({ gates, duration, errors, panelLayoutShift: 0 }, null, 2));
  } finally { await context.close(); }
});

test('reduced motion is a manual static walkthrough; cancel and replay do not start a scheduler', async () => {
  const { context, page, errors } = await open(390, 'reduce');
  try {
    const section = page.locator('#system');
    await page.getByRole('button', { name: 'Run one order', exact: true }).click({ timeout: 2000 });
    for (const key of ['owner', 'operator', 'workers', 'axioma', 'gatekeeper', 'standing', 'tripwire', 'handydandy']) {
      assert.ok(await page.locator(`#system-${key}-info`).isVisible());
      await page.waitForTimeout(60);
      assert.equal(await section.getAttribute('data-run-step'), key, 'no automatic advancement');
      await page.getByRole('button', { name: 'Next step', exact: true }).press('Enter');
    }
    assert.equal(await section.getAttribute('data-run-state'), 'idle');
    assert.ok(await page.locator('#system-owner-info').isVisible());
    await page.locator('[data-system-node="standing"]').hover();
    await page.getByRole('button', { name: 'Run one order', exact: true }).click();
    assert.ok(await page.locator('#system-owner-info').isVisible(), 'replay resets a hovered selection');
    await page.keyboard.press('Escape');
    assert.equal(await section.getAttribute('data-run-state'), 'idle');
    assert.equal(await page.locator('.system__pulse, .life-divider').count(), 0);
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    assert.equal(await page.evaluate(() => window.__axConductor.raf || window.__axConductor.timer), 0);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('run progress freezes while hidden or offscreen, resumes in place, and motion preference changes stay static', async () => {
  const { context, page, errors } = await open();
  try {
    await page.getByRole('button', { name: 'Run one order', exact: true }).click({ timeout: 2000 });
    await page.waitForFunction(() => document.querySelector('#system').dataset.runStep === 'axioma');
    const before = await page.locator('#system').getAttribute('data-run-elapsed');
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(1800);
    assert.equal(await page.locator('#system').getAttribute('data-run-elapsed'), before);
    assert.equal(await page.evaluate(() => window.__axConductor.raf || window.__axConductor.timer), 0);
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await arrive(page, 'work');
    await page.waitForTimeout(250);
    const offscreen = await page.locator('#system').getAttribute('data-run-elapsed');
    await page.waitForTimeout(1800);
    assert.equal(await page.locator('#system').getAttribute('data-run-elapsed'), offscreen);
    await arrive(page, 'system');
    await page.waitForFunction(previous => Number(document.querySelector('#system').dataset.runElapsed) > Number(previous), offscreen, { timeout: 1500 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(150);
    assert.equal(await page.locator('#system').getAttribute('data-run-state'), 'idle', 'preference switch cancels timed run');
    const html = await page.locator('#system').innerHTML();
    await page.waitForTimeout(400);
    assert.equal(await page.locator('#system').innerHTML(), html);
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    await page.getByRole('button', { name: 'Run one order', exact: true }).click();
    assert.ok(await page.locator('#system-owner-info').isVisible());
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});


test('section rules breathe softly on staggered clocks, keep their reveals, and pause outside the reading section', async () => {
  const { context, page, errors } = await open();
  try {
    await arrive(page, 'method');
    await page.waitForFunction(() => window.__axConductor.current() === 'divider-breath', null, { timeout: 8000 });
    assert.ok(await page.evaluate(() => window.__axConductor.timeline().some(e => e.id === 'rule-breath')), 'arrival reveal retained');
    const divider = page.locator('#method .life-divider');
    const before = await divider.evaluate(e => e.style.opacity);
    await page.waitForTimeout(1200);
    assert.notEqual(await divider.evaluate(e => e.style.opacity), before);
    const clocks = await page.locator('.life-divider').evaluateAll(es => es.map(e => Number(e.dataset.period)));
    assert.ok(clocks.length > 3);
    assert.equal(new Set(clocks).size, clocks.length);
    assert.ok(clocks.every(c => c >= 6000 && c <= 10000));
    const opacity = Number(await divider.evaluate(e => e.style.opacity));
    assert.ok(opacity >= .16 && opacity <= .24);
    await arrive(page, 'work');
    await page.waitForTimeout(200);
    const frozen = await divider.evaluate(e => e.style.opacity);
    await page.waitForTimeout(250);
    assert.equal(await divider.evaluate(e => e.style.opacity), frozen);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('ambient flow travels continuously, one pulse, and yields completely offscreen', async () => {
  const { context, page, errors } = await open();
  try {
    await page.waitForFunction(() => window.__axConductor.current() === 'chain-life', null, { timeout: 10000 });
    const at = await pulse(page).getAttribute('transform');
    await page.waitForTimeout(300);
    assert.notEqual(await pulse(page).getAttribute('transform'), at);
    assert.equal(await page.locator('.system__lines--wide .system__pulse').count(), 1);
    assert.ok(Number(await pulse(page).evaluate(e => e.style.opacity)) <= .36);
    await page.setViewportSize({ width: 1440, height: 400 });
    await page.locator('footer').evaluate(el => el.scrollIntoView());
    await page.waitForFunction(() => window.__axConductor.active === null);
    await page.waitForTimeout(1100);
    const frozen = await pulse(page).getAttribute('transform');
    await page.waitForTimeout(200);
    assert.equal(await pulse(page).getAttribute('transform'), frozen);
    assert.equal(await page.evaluate(() => window.__axConductor.raf || window.__axConductor.timer), 0);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
