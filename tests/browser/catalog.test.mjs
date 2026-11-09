import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';
import { chromium } from 'playwright';

const root = new URL('../..', import.meta.url);
const dist = resolve(root.pathname, 'dist');
const plugins = ['tripwire', 'handydandy', 'hermes-axioma', 'hermes-standing', 'hermes-gatekeeper', 'hermes-axiom-agent'];
let browser, server, base;
before(async () => {
  const config = await readFile(new URL('netlify.toml', root), 'utf8');
  const csp = config.match(/Content-Security-Policy = "([^"]+)"/)[1];
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg' };
  server = createServer(async (request, response) => {
    try {
      let file = resolve(dist, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
      if (file !== dist && !file.startsWith(dist + sep)) { response.writeHead(403).end(); return; }
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      response.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'content-security-policy': csp }).end(await readFile(file));
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

for (const width of [360, 390, 901, 1280]) {
  for (const javaScriptEnabled of [true, false]) {
    test(`current catalog fits ${width}px and both founder links work (JS ${javaScriptEnabled})`, async () => {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', javaScriptEnabled });
      try {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        const response = await page.goto(base + '/');
        assert.ok(response.headers()['content-security-policy'], 'real production CSP is applied');
        await page.evaluate(() => document.fonts.ready);
        assert.deepEqual(await page.locator('.catalog__item').evaluateAll(items => items.map(e => e.dataset.plugin)), plugins);
        const geometry = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          nav: [...document.querySelectorAll('.bar__nav a')].filter(e => e.getBoundingClientRect().width).map(e => {
            const r = e.getBoundingClientRect(); return { text: e.textContent, top: r.top, bottom: r.bottom, right: r.right, height: r.height };
          }),
          overflow: [...document.querySelectorAll('.catalog__item, .catalog__item code, .catalog__links a, .lookup__note code')].filter(e => { const r = e.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth || e.scrollWidth > e.clientWidth + 1; }).map(e => e.textContent),
        }));
        assert.equal(geometry.width, width, JSON.stringify(geometry));
        assert.deepEqual(geometry.overflow, [], 'catalog content stays inside its boxes');
        assert.ok(Math.max(...geometry.nav.map(e => e.top)) < Math.min(...geometry.nav.map(e => e.bottom)), 'visible nav remains on one row');
        assert.ok(geometry.nav.every(e => e.right <= width), 'nav stays in viewport');
        assert.ok(geometry.nav.some(e => e.text === 'Start an engagement' && e.height >= 44), 'engagement action remains visible and tappable');
        if (width >= 901) {
          const row = await page.locator('.catalog__item').nth(3).evaluate(e => {
            const s = getComputedStyle(e); return { top: s.borderTopWidth, left: s.borderLeftWidth };
          });
          assert.deepEqual(row, { top: '1px', left: '0px' }, 'second catalog row has a top divider, not an inset left border');
        }
        if (process.env.SCREENSHOT_DIR && javaScriptEnabled && [390, 1280].includes(width)) {
          await mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
          for (const [label, selector] of [['catalog', '#catalog'], ['footer', '.foot'], ['nav', '.bar']]) {
            await page.evaluate(() => scrollTo(0, 0));
            const box = await page.locator(selector).boundingBox();
            await page.screenshot({ path: join(process.env.SCREENSHOT_DIR, `${label}-${width}.png`), fullPage: true, clip: { x: 0, y: box.y, width, height: box.height } });
          }
          await writeFile(join(process.env.SCREENSHOT_DIR, `geometry-${width}.json`), JSON.stringify(geometry, null, 2) + '\n');
        }
        for (const selector of ['#catalog a[href="/operator-layer/"]', '.footer-links a[href="/operator-layer/"]']) {
          await page.goto(base + '/');
          await page.locator(selector).focus();
          await page.keyboard.press('Enter');
          await page.waitForURL(base + '/operator-layer/');
          assert.equal(await page.locator('h1').count(), 1, 'founder destination renders');
        }
        assert.deepEqual(errors, [], 'no runtime or CSP console errors');
      } finally { await context.close(); }
    });
  }
}
