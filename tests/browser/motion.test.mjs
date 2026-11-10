// The motion conductor (assets/axioma/home.js): one accent at a time, each
// with an end; reduced motion turns every accent off and leaves the page
// complete; the medallion drag still reflows and lights the signals, and
// every accent steps aside while the reader holds it. Runs against dist/.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';
import { chromium } from 'playwright';

const dist = resolve(new URL('../..', import.meta.url).pathname, 'dist');
let server, browser, base;

before(async () => {
  if (process.env.PREVIEW_URL) base = process.env.PREVIEW_URL;
  else {
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp' };
    server = createServer(async (request, response) => {
      try {
        let file = resolve(dist, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
        if (file !== dist && !file.startsWith(dist + sep)) { response.writeHead(403).end(); return; }
        if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
        response.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(await readFile(file));
      } catch { response.writeHead(404).end(); }
    });
    await new Promise((done) => server.listen(0, '127.0.0.1', done));
    base = `http://127.0.0.1:${server.address().port}`;
  }
  browser = await chromium.launch({ headless: true });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise((done) => server.close(done));
});

const watchShifts = () => {
  // Total layout shift, and the part after the first scroll (when accents run).
  // Main already has one 0.0002 font-swap shift at load on wide screens; the
  // page total must still round to 0, and nothing may shift once motion runs.
  window.__shifts = 0;
  window.__shiftsAfter = 0;
  window.__shiftDetails = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) if (!e.hadRecentInput) {
      window.__shifts += e.value;
      if (window.__scrollStart && e.startTime > window.__scrollStart) {
        window.__shiftsAfter += e.value;
        window.__shiftDetails.push({ value: e.value, t: e.startTime, sources: e.sources.map(s => ({ node: (s.node?.outerHTML || s.node?.parentElement?.outerHTML)?.slice(0, 400), scroll: scrollY, active: window.__axConductor?.active?.id, text: s.node?.textContent?.slice(0, 80), before: s.previousRect, after: s.currentRect })) });
      }
    }
  })
    .observe({ type: 'layout-shift', buffered: true });
};

// Visible cursors right now: the hero block and any prompt cursor that is on.
const cursorsShown = () => {
  const shown = [];
  const hero = document.querySelector('.hero__title .cursor');
  if (hero && getComputedStyle(hero).opacity !== '0') shown.push('hero');
  for (const p of document.querySelectorAll('.section .prompt')) {
    if (getComputedStyle(p.querySelector('.prompt__cmd'), '::after').opacity !== '0') shown.push(p.closest('section').id);
  }
  return shown;
};

async function scrollThrough(page, sample) {
  // Settle every font first, so a late font swap is not counted as motion.
  await page.evaluate(() => Promise.all([...document.fonts].map((f) => f.load().catch(() => null))));
  await page.waitForTimeout(300);
  const height = await page.evaluate(() => { window.__scrollStart = performance.now(); return document.documentElement.scrollHeight - innerHeight; });
  for (let y = 0; y <= height + 300; y += 260) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    for (let i = 0; i < 4; i++) { await page.waitForTimeout(110); await sample(); }
  }
  for (let i = 0; i < 20; i++) { await page.waitForTimeout(110); await sample(); }
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`conductor runs one accent at a time, each with a start and an end (${viewport.width}px)`, async () => {
    const context = await browser.newContext({ viewport, reducedMotion: 'no-preference' });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.addInitScript(watchShifts);
      await page.goto(base + '/');
      await page.evaluate(() => document.fonts.ready);
      assert.ok(await page.evaluate(() => window.__axConductor?.enabled), 'conductor is on');
      // The ledger waits at zero below the fold, but a screen reader hears the real number.
      assert.deepEqual(await page.locator('#proof .ledger__cell .ax-sr').allTextContents(), ['286', '187', '106']);

      let maxCursors = 0;
      const running = new Set();
      await scrollThrough(page, async () => {
        const state = await page.evaluate(cursorsShown);
        maxCursors = Math.max(maxCursors, state.length);
        const current = await page.evaluate(() => window.__axConductor.current());
        if (current) running.add(current);
      });

      const timeline = await page.evaluate(() => window.__axConductor.timeline());
      assert.ok(timeline.length > 10, 'accents were played');
      for (let i = 1; i < timeline.length; i++) {
        const [prev, next] = [timeline[i - 1], timeline[i]];
        assert.ok(prev.t1 !== null, `${prev.id} in ${prev.section} ended`);
        assert.ok(next.t0 >= prev.t1, `${next.id} (${next.section}) started before ${prev.id} (${prev.section}) ended`);
      }
      const ids = new Set(timeline.map((e) => e.id));
      for (const id of ['cursor-handoff', 'cursor-blink', 'ledger-count', 'signal-sweep']) assert.ok(ids.has(id), `played: ${id}`);
      // Accents are short and every one ends: the cursor blinks at most three
      // 1.1 s cycles, everything else but the breathing ring is done in 2.5 s.
      for (const e of timeline) {
        // Persistent, section-local ambient accents have no finite duration;
        // their offscreen/hidden termination is checked separately.
        if (['ring-breath', 'caduceus-life', 'chain-life', 'divider-breath'].includes(e.id) || e.t1 === null) continue;
        const limit = e.id === 'cursor-blink' ? 3 * 1100 + 200 : 2500;
        assert.ok(e.t1 - e.t0 <= limit, `${e.id} lasted ${Math.round(e.t1 - e.t0)} ms`);
      }
      assert.ok(maxCursors <= 1, `at most one cursor on screen, saw ${maxCursors}`);
      assert.deepEqual(await page.locator('#proof .ledger__num').allTextContents(), ['286', '187', '106']);
      assert.equal(await page.locator('.is-pending, #proof .ax-sr').count(), 0, 'ledger settled to its real numbers');
      assert.equal(await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.getTiming().iterations === Infinity).length), 0, 'no endless CSS animation');
      assert.equal(await page.evaluate(() => window.__shiftsAfter), 0, 'no layout shift once motion runs: ' + JSON.stringify(await page.evaluate(() => window.__shiftDetails)));
      assert.ok(await page.evaluate(() => window.__shifts) < 0.001, 'CLS rounds to 0');
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}

test('reduced motion: every accent off, page complete without them', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await page.addInitScript(watchShifts);
    await page.goto(base + '/');
    await page.evaluate(() => document.fonts.ready);
    let maxCursors = 0;
    await scrollThrough(page, async () => { maxCursors = Math.max(maxCursors, (await page.evaluate(cursorsShown)).length); });
    assert.equal(await page.evaluate(() => window.__axConductor.enabled), false);
    assert.deepEqual(await page.evaluate(() => window.__axConductor.timeline()), []);
    assert.deepEqual(await page.locator('#proof .ledger__num').allTextContents(), ['286', '187', '106']);
    assert.equal(await page.locator('.is-pending, .is-cursor').count(), 0);
    assert.equal(await page.locator('.story__stage--static').count(), 1, 'story stays static');
    assert.equal(await page.evaluate(() => typeof window.__storyState), 'undefined', 'engine never loads');
    assert.ok(maxCursors <= 1);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.hero__title .cursor')).opacity), '1', 'hero cursor holds solid');
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0, 'nothing animates');
    assert.equal(await page.evaluate(() => window.__shiftsAfter), 0);
    assert.ok(await page.evaluate(() => window.__shifts) < 0.001);
  } finally { await context.close(); }
});

test('switching to reduced motion mid-visit ends every accent at its final state', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  try {
    const page = await context.newPage();
    await page.goto(base + '/');
    await page.waitForFunction(() => document.querySelector('.hero__title .cursor.is-blink-off') || window.__axConductor.current() === 'cursor-blink');
    assert.equal(await page.locator('.ledger__num.is-pending').count(), 3, 'ledger was waiting to count');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !window.__axConductor.enabled);
    assert.equal(await page.evaluate(() => window.__axConductor.current()), null);
    assert.deepEqual(await page.locator('#proof .ledger__num').allTextContents(), ['286', '187', '106']);
    assert.equal(await page.locator('.is-pending, .is-cursor, .is-blink-off, .is-away').count(), 0);
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length), 0);
  } finally { await context.close(); }
});

test('dragging the medallion reflows the words and lights signals; accents step aside until it rests', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
  try {
    const page = await context.newPage();
    await page.goto(base + '/');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#story').evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 120));
    await page.waitForSelector('.story__stage--live.is-ready');
    const hit = page.locator('.medallion__hit');
    const box = await hit.boundingBox();
    const start = await page.evaluate(() => window.__storyState());
    const words = () => page.locator('.story__layer .w').evaluateAll((els) => els.map((el) => el.style.transform).join('|'));
    const before = await words();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const seen = new Set();
    const during = new Set();
    for (let i = 1; i <= 30; i++) {
      await page.mouse.move(box.x + box.width / 2 - i * 18, box.y + box.height / 2 + i * 9);
      await page.waitForTimeout(30);
      for (const level of (await page.evaluate(() => window.__storyState())).lit) seen.add(level);
      if (i > 12) during.add(await page.evaluate(() => window.__axConductor.current()));
    }
    const moved = await page.evaluate(() => window.__storyState());
    assert.ok(Math.hypot(moved.x - start.x, moved.y - start.y) > 200, 'medallion follows the drag');
    assert.notEqual(await words(), before, 'words make room');
    assert.ok(seen.size > 0, 'signals light on contact');
    assert.deepEqual([...during], [null], 'no accent runs while the reader holds the medallion');
    await page.mouse.up();
    await page.waitForFunction(() => window.__axConductor.current() === 'ring-breath', null, { timeout: 9000 });
    assert.equal(await page.evaluate(() => window.__axConductor.timeline().filter((e) => e.id === 'signal-sweep').length) <= 1, true, 'the sweep plays at most once');
  } finally { await context.close(); }
});
