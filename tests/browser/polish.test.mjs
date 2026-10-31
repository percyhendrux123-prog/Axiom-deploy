import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';
import { chromium } from 'playwright';

const dist = resolve(new URL('../..', import.meta.url).pathname, 'dist');
const routes = ['/', '/notes/', '/notes/one-front-door/', '/notes/one-tempo/', '/notes/the-gap-is-the-user/', '/notes/the-outcome/', '/notes/the-gathering/', '/notes/left-foot-right-foot/', '/field-reports/insurance-client-care/', '/privacy/', '/terms/', '/baton-rouge/', '/success.html'];
let server, browser, base;
before(async () => {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.m4a': 'audio/mp4' };
  server = createServer(async (request, response) => {
    try {
      let file = resolve(dist, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
      if (file !== dist && !file.startsWith(dist + sep)) { response.writeHead(403).end(); return; }
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      const headers = { 'content-type': types[extname(file)] || 'application/octet-stream', 'content-length': body.length, 'accept-ranges': 'bytes' };
      const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range || '');
      if (range) {
        const start = Number(range[1]), end = range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
        if (start > end) { response.writeHead(416, { 'content-range': `bytes */${body.length}` }).end(); return; }
        response.writeHead(206, { ...headers, 'content-length': end - start + 1, 'content-range': `bytes ${start}-${end}/${body.length}` }).end(body.subarray(start, end + 1));
      } else response.writeHead(200, headers).end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(done => server.close(done));
});

test('every polished route is stationary with ordinary motion preferences', async () => {
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  try {
    const page = await context.newPage();
    for (const path of routes) {
      await page.goto(base + path);
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto', path);
    }
  } finally { await context.close(); }
});

test('all page families fit mobile with at least 44px interactive targets', async () => {
  const failures = [];
  for (const width of [360, 390, 430, 768, 1000, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    try {
      const page = await context.newPage();
      for (const path of routes) {
        await page.goto(base + path);
        await page.evaluate(() => document.fonts.ready);
        const result = await page.evaluate(() => {
          const visible = e => e.checkVisibility();
          const describe = e => `${e.tagName}.${e.className}: ${(e.textContent || '').trim().slice(0, 60)}`;
          return {
            scrollWidth: document.documentElement.scrollWidth,
            outside: [...document.querySelectorAll('main *, header *, footer *')].filter(visible).filter(e => {
              const r = e.getBoundingClientRect();
              return r.width && (r.left < -1 || r.right > innerWidth + 1);
            }).map(describe),
            small: [...document.querySelectorAll('a, button, summary, input, textarea')].filter(visible).filter(e => !e.classList.contains('skip')).filter(e => {
              const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44;
            }).map(describe),
          };
        });
        if (result.scrollWidth > width || result.outside.length || (width <= 430 && result.small.length)) failures.push({ path, width, ...result });
      }
    } finally { await context.close(); }
  }
  assert.deepEqual(failures, []);
});

test('keyboard focus stays visible on the dark engagement and the light composer', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(base + '/');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('class'), 'skip');
    await page.keyboard.press('Enter');
    assert.equal(new URL(page.url()).hash, '#work');
    await page.locator('#brief-composer summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#brief-composer').getAttribute('open'), '');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('name'), 'repeated-workflow');
    const focus = await page.locator(':focus').evaluate(e => {
      const s = getComputedStyle(e); return { color: s.outlineColor, style: s.outlineStyle, width: s.outlineWidth };
    });
    assert.deepEqual(focus, { color: 'rgb(18, 19, 22)', style: 'solid', width: '2px' });
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.getByLabel('The recurring work', { exact: true }).fill('X'.repeat(800));
      const metrics = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, targets: [...document.querySelectorAll('#brief-composer a, #brief-composer button, #brief-composer textarea')].filter(e => e.checkVisibility()).map(e => { const r = e.getBoundingClientRect(); return { width: r.width, height: r.height }; }) }));
      assert.equal(metrics.width, width);
      assert.ok(metrics.targets.every(r => r.width >= 44 && r.height >= 44));
    }
  } finally { await context.close(); }
});

test('report engagement label remains readable on hover and press', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  try {
    const page = await context.newPage();
    await page.goto(base + '/field-reports/insurance-client-care/');
    const button = page.locator('.next .button');
    await button.hover();
    const colors = () => button.evaluate(e => { const s = getComputedStyle(e); return { text: s.color, background: s.backgroundColor }; });
    assert.deepEqual(await colors(), { text: 'rgb(18, 19, 22)', background: 'rgb(242, 238, 230)' });
    await page.mouse.down();
    try { assert.deepEqual(await colors(), { text: 'rgb(242, 238, 230)', background: 'rgb(18, 19, 22)' }); }
    finally { await page.mouse.move(0, 0); await page.mouse.up(); }
  } finally { await context.close(); }
});

test('Baton Rouge recording and native questions still work without sending anything', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(base + '/baton-rouge/');
    await page.getByRole('button', { name: 'Play the test call' }).click();
    await page.waitForFunction(() => !document.querySelector('audio').paused && document.querySelector('audio').readyState >= 2);
    await page.getByRole('button', { name: 'Pause the test call' }).click();
    assert.ok(await page.locator('audio').evaluate(e => e.paused));
    await page.getByRole('slider', { name: 'Seek' }).focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('audio').currentTime >= 1 && !document.querySelector('audio').seeking, null, { timeout: 3000 });
    assert.ok(await page.locator('audio').evaluate(e => e.currentTime > 0));
    const question = page.locator('.faq details').nth(1);
    await question.locator('summary').click();
    assert.ok(await question.locator('p').isVisible());
  } finally { await context.close(); }
});
