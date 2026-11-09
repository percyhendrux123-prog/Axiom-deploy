import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';
import { chromium, webkit } from 'playwright';
const dist = resolve(new URL('../..', import.meta.url).pathname, 'dist');
const evidence = process.env.SCREENSHOT_DIR || 'qa/a300';
const engines = (process.env.SCROLL_BROWSERS || 'chromium').split(',');
const label = process.env.SCROLL_LABEL || 'after';
let server, base;
const browsers = {};
before(async () => {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp' };
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
  await mkdir(evidence, { recursive: true });
  for (const engine of engines) {
    assert.ok(['chromium', 'webkit'].includes(engine));
    browsers[engine] = await ({ chromium, webkit })[engine].launch({ headless: true,
      ...(engine === 'webkit' && process.env.WEBKIT_EXECUTABLE ? { executablePath: process.env.WEBKIT_EXECUTABLE } : {}) });
  }
});
after(async () => { for (const browser of Object.values(browsers)) await browser.close(); if (server) await new Promise(done => server.close(done)); });
async function open(engine, width, hostMetrics = false) {
  const context = await browsers[engine].newContext({ viewport: { width, height: 1000 } });
  const page = await context.newPage();
  if (hostMetrics) {
    const font = await readFile(new URL('./fixtures/a300-host-metrics.woff2', import.meta.url));
    await page.route('**/__a300-host-metrics.woff2', route => route.fulfill({ contentType: 'font/woff2', body: font }));
    await page.route('**/axioma.css*', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + `
        @font-face{font-family:'A300 Host Metrics';src:url('/__a300-host-metrics.woff2') format('woff2')}
        .caduceus{font-family:'A300 Host Metrics'}` });
    });
  }
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });
  await page.addInitScript(() => {
    window.__scrollShifts = [];
    if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
      new PerformanceObserver(list => window.__scrollShifts.push(...list.getEntries().map(e => ({ t: e.startTime, value: e.value, recentInput: e.hadRecentInput,
        sources: e.sources.map(s => ({ node: s.node?.tagName + '.' + s.node?.className, previous: s.previousRect.toJSON(), current: s.currentRect.toJSON() }))
      })))).observe({ type: 'layout-shift', buffered: true });
    }
  });
  return { context, page, errors };
}
function measure() {
  const row = { t: performance.now(), scrollY };
  for (const selector of ['.caduceus', '.gate', '#system', '.system__board', '.system__frame', '.system__details', '.system__source']) {
    const r = document.querySelector(selector).getBoundingClientRect();
    row[selector] = { height: r.height, width: r.width, left: r.left, top: r.top, documentTop: r.top + scrollY };
  }
  return row;
}
const arrive = (page, selector, offset) => page.locator(selector).evaluate((e, offset) => scrollTo(0, e.getBoundingClientRect().top + scrollY - offset), offset);
const save = (name, data) => writeFile(join(evidence, `${label}-${name}.json`), JSON.stringify(data, null, 2));
const same = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < .02, `${message}: ${expected} → ${actual}`);
for (const engine of engines) for (const width of [1440, 390]) {
  test(`missing terminal scripts retain the visible relationship fallback (${engine}, ${width})`, async () => {
    for (const script of ['rot.min.js', 'chain-terminal.js']) {
      const { context, page, errors } = await open(engine, width);
      try {
        await page.route(`**/${script}*`, route => route.abort());
        await page.goto(base); await page.evaluate(() => document.fonts.ready);
        await arrive(page, '#system', 90); await page.waitForTimeout(100);
        const fallback = await page.locator('.system__alternative').evaluate(e => {
          const r = e.getBoundingClientRect(), s = getComputedStyle(e);
          return { height: r.height, width: r.width, clip: s.clipPath, hidden: e.getAttribute('aria-hidden') };
        });
        await save(`${engine}-${width}-${script}-fallback`, fallback);
        assert.ok(fallback.width > 100 && fallback.height > 24 && fallback.clip === 'none', JSON.stringify(fallback));
        assert.equal(fallback.hidden, null);
        assert.equal(await page.locator('#system canvas').count(), 0);
        await page.locator('[data-system-node="owner"]').focus(); await page.keyboard.press('Enter');
        assert.equal(await page.locator('#system-owner-info').isVisible(), true);
        assert.deepEqual(errors, []);
      } finally { await context.close(); }
    }
  });
  test(`gate and caduceus keep their height through lazy load and entrance (${engine}, ${width})`, async () => {
    const { context, page, errors } = await open(engine, width);
    let release;
    const held = new Promise(done => { release = done; });
    await page.route('**/caduceus.js*', async route => { await held; await route.continue(); });
    try {
      await page.goto(base); await page.evaluate(() => document.fonts.ready);
      await arrive(page, '.gate', 90);
      const before = await page.evaluate(measure);
      await page.screenshot({ path: join(evidence, `${label}-${engine}-${width}-gate-before.png`) });
      // WebKit can anchor against an empty text frame while innerHTML is replaced.
      // Force layout at that seam: the art's 18-line slot must not collapse.
      const emptyFrame = await page.locator('.caduceus').evaluate(pre => {
        const html = pre.innerHTML;
        pre.replaceChildren();
        const height = pre.getBoundingClientRect().height;
        pre.innerHTML = html;
        return height;
      });
      // Sample every frame, including the first draw/cursor and the settled art.
      await page.evaluate(() => {
        window.__gateSamples = []; window.__sampleGate = true;
        function sample() {
          window.__gateSamples.push(['.caduceus', '.gate', '.system__board'].map(s => document.querySelector(s).getBoundingClientRect().height));
          if (window.__sampleGate) requestAnimationFrame(sample);
        }
        sample();
      });
      release();
      await page.waitForFunction(() => document.querySelector('.caduceus').dataset.entrance === 'settled');
      await page.evaluate(() => { window.__sampleGate = false; });
      const samples = await page.evaluate(() => window.__gateSamples);
      const after = await page.evaluate(measure);
      await save(`${engine}-${width}-gate-heights`, { before, after, emptyFrame, samples });
      await page.screenshot({ path: join(evidence, `${label}-${engine}-${width}-gate-after.png`) });
      same(emptyFrame, before['.caduceus'].height, 'reserved caduceus slot during text replacement');
      for (const row of samples) ['.caduceus', '.gate', '.system__board'].forEach((s, i) => same(row[i], before[s].height, s));
      for (const s of ['.caduceus', '.gate', '.system__board']) same(after[s].height, before[s].height, s);
      same(after['#system'].documentTop, before['#system'].documentTop, 'system position after caduceus load');
      assert.deepEqual(errors, []);
    } finally { release(); await context.close(); }
  });
  test(`first terminal render cannot collapse the frame beneath the gate (${engine}, ${width})`, async () => {
    const { context, page, errors } = await open(engine, width);
    // Keep the real engine loaded; delay only its viewport-triggered first draw.
    await page.addInitScript(() => {
      window.__holdTerminal = true;
      const Observer = window.IntersectionObserver;
      window.IntersectionObserver = class extends Observer {
        constructor(callback, options) {
          super((entries, observer) => {
            if (entries.some(e => e.target.matches('.system__board')) && window.__holdTerminal) {
              window.__releaseTerminal = () => callback(entries, observer);
            } else callback(entries, observer);
          }, options);
        }
      };
    });
    try {
      await page.goto(base); await page.evaluate(() => document.fonts.ready);
      await arrive(page, '.system__details', 600);
      await page.waitForTimeout(600);
      const before = await page.evaluate(measure);
      await page.screenshot({ path: join(evidence, `${label}-${engine}-${width}-terminal-before.png`) });
      const start = await page.evaluate(() => performance.now());
      await page.evaluate(() => { window.__holdTerminal = false; window.__releaseTerminal(); });
      await page.waitForSelector('.has-terminal'); await page.waitForTimeout(100);
      const after = await page.evaluate(measure);
      const shifts = await page.evaluate(start => window.__scrollShifts.filter(e => e.t >= start), start);
      await save(`${engine}-${width}-terminal-heights`, { before, after, shifts, layoutShiftSum: shifts.reduce((s, e) => s + e.value, 0) });
      await page.screenshot({ path: join(evidence, `${label}-${engine}-${width}-terminal-after.png`) });
      for (const s of ['.caduceus', '.gate', '.system__board', '.system__frame', '#system']) same(after[s].height, before[s].height, s);
      same(after['.system__details'].documentTop, before['.system__details'].documentTop, 'detail document position');
      same(after['.system__source'].documentTop, before['.system__source'].documentTop, 'source document position');
      assert.equal(shifts.reduce((s, e) => s + e.value, 0), 0, 'all layout shifts, including recent input');
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
  test(`host-metric caduceus keeps its inline slot and zero CLS through entrance and scroll (${engine}, ${width})`, async () => {
    const { context, page, errors } = await open(engine, width, true);
    let release;
    const held = new Promise(done => { release = done; });
    await page.route('**/caduceus.js*', async route => { await held; await route.continue(); });
    try {
      await page.goto(base); await page.evaluate(() => document.fonts.ready);
      const metrics = await page.locator('.caduceus').evaluate(pre => {
        const probe = document.createElement('span');
        probe.style.cssText = 'position:absolute;font:34px "A300 Host Metrics"';
        probe.textContent = '⣿'; pre.append(probe);
        const braille = probe.getBoundingClientRect().width;
        probe.textContent = '▌';
        const cursor = probe.getBoundingClientRect().width;
        probe.remove();
        return { loaded: document.fonts.check('34px "A300 Host Metrics"', '⣿▌'), braille, cursor };
      });
      assert.equal(metrics.loaded, true, 'the metric fixture must actually be active');
      // Linux Chromium snaps this fixture's advance to 23px; WebKit keeps
      // 23.2421875px. Both must retain the host's >10px cursor/cell mismatch.
      assert.ok(Math.abs(metrics.braille - 34 * 1400 / 2048) < .3, JSON.stringify(metrics));
      same(metrics.cursor, 34, 'host cursor advance at 34px');
      assert.ok(metrics.cursor - metrics.braille > 10, 'exercise the Mac cursor/braille mismatch');
      await arrive(page, '.gate', 90);
      await page.screenshot({ path: join(evidence, `${label}-${engine}-${width}-host-metrics-before.png`) });
      await arrive(page, '.gate', 1100); await page.waitForTimeout(100);
      const first = await page.evaluate(measure), steps = [];
      await page.evaluate(() => {
        window.__inlineSamples = []; window.__sampleInline = true;
        function sample() {
          const pre = document.querySelector('.caduceus'), r = pre.getBoundingClientRect();
          window.__inlineSamples.push({ width: r.width, left: r.left, height: r.height, cursor: !!pre.querySelector('.cad-cursor') });
          if (window.__sampleInline) requestAnimationFrame(sample);
        }
        sample();
      });
      const start = await page.evaluate(() => performance.now());
      release();
      for (let i = 0; i < 55; i++) {
        const previousY = await page.evaluate(() => scrollY);
        await page.evaluate(() => scrollBy(0, 50)); await page.waitForTimeout(80);
        steps.push({ ...await page.evaluate(measure), previousY });
      }
      await page.evaluate(() => { window.__sampleInline = false; });
      const samples = await page.evaluate(() => window.__inlineSamples);
      const shifts = await page.evaluate(start => window.__scrollShifts.filter(e => e.t >= start), start);
      await save(`${engine}-${width}-host-metrics`, { metrics, first, steps, samples, shifts, layoutShiftSum: shifts.reduce((s, e) => s + e.value, 0) });
      await arrive(page, '.gate', 90);
      await page.screenshot({ path: join(evidence, `${label}-${engine}-${width}-host-metrics-after.png`) });
      assert.ok(samples.some(s => s.cursor), 'exercise the live draw-in cursor, not only settled art');
      assert.equal(await page.locator('.caduceus').getAttribute('data-entrance'), 'settled');
      assert.equal(shifts.reduce((s, e) => s + e.value, 0), 0, 'all layout shifts, horizontal included, with host font advances');
      for (const row of samples) for (const key of ['width', 'left', 'height']) same(row[key], first['.caduceus'][key], `reserved caduceus ${key}`);
      for (const row of steps) {
        same(row.scrollY - row.previousY, 50, 'requested host-metric scroll increment');
        same(row['#system'].documentTop, first['#system'].documentTop, 'host-metric system document position');
        for (const s of ['.caduceus', '.gate', '.system__board', '.system__frame']) same(row[s].height, first[s].height, s);
      }
      assert.deepEqual(errors, []);
    } finally { release(); await context.close(); }
  });
  test(`small-step gate to system scroll has no layout or scroll discontinuity (${engine}, ${width})`, async () => {
    const { context, page, errors } = await open(engine, width);
    try {
      await page.goto(base); await page.evaluate(() => document.fonts.ready);
      await arrive(page, '.gate', 1100); await page.waitForTimeout(100);
      const first = await page.evaluate(measure), steps = [];
      const start = await page.evaluate(() => performance.now());
      for (let i = 0; i < 55; i++) {
        const previousY = await page.evaluate(() => scrollY);
        await page.evaluate(() => scrollBy(0, 50)); await page.waitForTimeout(80);
        steps.push({ ...await page.evaluate(measure), previousY });
      }
      const shifts = await page.evaluate(start => window.__scrollShifts.filter(e => e.t >= start), start);
      await save(`${engine}-${width}-scroll`, { first, steps, shifts, layoutShiftSum: shifts.reduce((s, e) => s + e.value, 0) });
      await page.screenshot({ path: join(evidence, `${label}-${engine}-${width}-scroll.png`) });
      for (const row of steps) {
        same(row.scrollY - row.previousY, 50, 'requested scroll increment');
        same(row['#system'].documentTop, first['#system'].documentTop, 'system document position');
        for (const s of ['.caduceus', '.gate', '.system__board', '.system__frame']) same(row[s].height, first[s].height, s);
      }
      assert.equal(shifts.reduce((s, e) => s + e.value, 0), 0, 'all layout shifts in gate-to-system range');
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}
