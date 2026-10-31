import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';
import { chromium } from 'playwright';

const root = new URL('../..', import.meta.url).pathname;
const dist = resolve(root, 'dist');
const screenshotDir = process.env.SCREENSHOT_DIR || resolve(root, 'qa/remake');
const reportPath = '/field-reports/insurance-client-care/';
let server, browser, base;

before(async () => {
  if (process.env.PREVIEW_URL) {
    base = process.env.PREVIEW_URL;
    assert.match(new URL(base).hostname, /^[0-9a-f]{24}--axiom-deploy\.netlify\.app$/, 'remote QA requires an immutable Axiom draft URL');
  } else {
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
    server = createServer(async (request, response) => {
      try {
        let file = resolve(dist, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
        if (file !== dist && !file.startsWith(dist + sep)) { response.writeHead(403).end(); return; }
        if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
        const body = await readFile(file);
        response.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(body);
      } catch { response.writeHead(404).end(); }
    });
    await new Promise((done) => server.listen(0, '127.0.0.1', done));
    base = `http://127.0.0.1:${server.address().port}`;
  }
  await mkdir(screenshotDir, { recursive: true });
  browser = await chromium.launch({ headless: true });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise((done) => server.close(done));
});

const overflow = (page) => page.evaluate(() => ({
  viewport: innerWidth, document: document.documentElement.scrollWidth,
  outside: [...document.querySelectorAll('main * , header * , footer *')].filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width && (rect.right > innerWidth + 1 || rect.left < -1);
  }).map((element) => element.tagName + '.' + element.className),
}));

test('home and field report render without overflow, bad resources, motion or console errors', async () => {
  for (const width of [390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
    try {
      const page = await context.newPage();
      const errors = [], badResources = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', (response) => { if (response.status() >= 400) badResources.push(response.url()); });
      for (const [path, name] of [['/', 'home'], [reportPath, 'field-report']]) {
        assert.equal((await page.goto(base + path)).status(), 200);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.locator('.document-plate img').evaluate((image) => image.naturalWidth), 2400);
        const dimensions = await overflow(page);
        assert.ok(dimensions.document <= width, JSON.stringify({ path, ...dimensions }));
        assert.deepEqual(dimensions.outside, [], JSON.stringify({ path, ...dimensions }));
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
        assert.ok((await page.locator('.proof-number').first().evaluate((element) => getComputedStyle(element).fontFamily)).includes('Cinzel'));
        const cta = await page.locator('.nav-cta').boundingBox();
        assert.ok(cta.height >= 46, 'CTA touch target');
        if (width !== 768) await page.screenshot({ path: join(screenshotDir, `${name}-${width}.png`), fullPage: true });
      }
      assert.deepEqual(errors, []);
      assert.deepEqual(badResources, []);
    } finally { await context.close(); }
  }
});

test('all new surface links resolve, including fragments, metadata image and sitemap routes', async () => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    for (const path of ['/', reportPath]) {
      await page.goto(base + path);
      const links = await page.locator('a[href]').evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute('href')))]);
      for (const href of links.filter((href) => href.startsWith('/') || href.startsWith('#'))) {
        const target = new URL(href, base + path);
        const response = await context.request.get(target.origin + target.pathname);
        assert.equal(response.status(), 200, href);
        if (target.hash) {
          const targetPage = await context.newPage();
          try { await targetPage.goto(target.href); assert.equal(await targetPage.locator(target.hash).count(), 1, href); }
          finally { await targetPage.close(); }
        }
      }
      for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
        const image = new URL(await page.locator(selector).getAttribute('content'));
        const response = await context.request.get(base + image.pathname);
        assert.equal(response.status(), 200);
        assert.match(response.headers()['content-type'], /image\/png/);
      }
      assert.ok((await page.locator('link[rel="canonical"]').getAttribute('href')).endsWith(path));
    }
    const sitemap = await context.request.get(base + '/sitemap.xml');
    assert.ok((await sitemap.text()).includes('https://deployaxiom.com' + reportPath));
  } finally { await context.close(); }
});

test('engagement brief validates, copies locally, falls back safely and never submits', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(base + '/');
    await page.locator('.nav-cta').click();
    assert.equal(new URL(page.url()).hash, '#contact');
    await page.locator('#brief-composer summary').click();
    await page.locator('#copy-brief').click();
    assert.equal(await page.locator('textarea:invalid').count(), 3);
    await page.getByLabel('The recurring work', { exact: true }).fill('Synthetic recurring task');
    await page.getByLabel('Where continuity breaks', { exact: true }).fill('Synthetic handoff');
    await page.getByLabel('What resolution looks like', { exact: true }).fill('Synthetic checked outcome');
    const outbound = [];
    page.on('request', (request) => outbound.push(request.url()));
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('#copy-brief').click();
    await page.waitForFunction(() => document.querySelector('#copy-status').textContent.includes('Brief copied.'));
    assert.ok((await page.evaluate(() => navigator.clipboard.readText())).includes('Synthetic checked outcome'));
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Synthetic clipboard denial'); } } }); });
    await page.locator('#copy-brief').click();
    await page.waitForFunction(() => document.querySelector('#copy-status').textContent.includes('Copy failed.'));
    assert.equal(await page.evaluate(() => document.activeElement.id), 'manual-brief');
    assert.ok((await page.locator('#manual-brief-output').textContent()).includes('Synthetic recurring task'));
    assert.deepEqual(outbound, []);
    assert.equal(await page.locator('form').count(), 0);
    assert.equal(await page.locator('.mapper a.button').getAttribute('href'), 'mailto:percy@deployaxiom.com?subject=Brief');
    const dimensions = await overflow(page);
    assert.ok(dimensions.document <= 390, JSON.stringify(dimensions));
    assert.deepEqual(dimensions.outside, []);
    await page.screenshot({ path: join(screenshotDir, 'brief-open-390.png'), fullPage: true });
  } finally { await context.close(); }
});

test('no JavaScript still opens the brief and exposes the complete manual template', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(base + '/#contact');
    await page.locator('#brief-composer summary').click();
    assert.ok(await page.locator('#manual-brief-output').isVisible());
    assert.ok(await page.locator('noscript').isVisible());
    assert.ok((await page.locator('#manual-brief-output').textContent()).includes('What resolution looks like:'));
  } finally { await context.close(); }
});
