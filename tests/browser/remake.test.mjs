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
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
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
        if (path !== '/') assert.equal(await page.locator('.document-plate img').evaluate((image) => image.naturalWidth), 2400);
        const dimensions = await overflow(page);
        assert.ok(dimensions.document <= width, JSON.stringify({ path, ...dimensions }));
        assert.deepEqual(dimensions.outside, [], JSON.stringify({ path, ...dimensions }));
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
        if (path === '/') assert.ok((await page.locator('.hero__title').evaluate((element) => getComputedStyle(element).fontFamily)).includes('Geist'));
        else assert.ok((await page.locator('.proof-number').first().evaluate((element) => getComputedStyle(element).fontFamily)).includes('Geist'), 'inner pages share the night shell type');
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

test('brief form validates six answers and posts once to /brief/received/ with no other transmission', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(base + '/');
    await page.locator('.nav-cta').click();
    assert.equal(new URL(page.url()).hash, '#contact');
    await page.locator('#brief-composer summary').click();
    const outbound = [];
    page.on('request', (request) => { if (request.method() !== 'GET') outbound.push({ method: request.method(), url: request.url(), body: request.postData() }); });
    await page.locator('#brief-form button[type="submit"]').click();
    assert.equal(await page.locator('#brief-form :is(input,textarea):invalid').evaluateAll(els => new Set(els.map(e => e.name)).size), 6);
    assert.deepEqual(outbound, []);
    await page.getByLabel('Your name', { exact: true }).fill('Synthetic Owner');
    await page.getByLabel('Business', { exact: true }).fill('Synthetic Business');
    await page.getByLabel('6 to 15', { exact: true }).check();
    await page.getByLabel('How should we reply?', { exact: true }).fill('owner@example.com');
    await page.getByLabel('What is eating the week', { exact: true }).fill('Synthetic follow-up nobody owns');
    await page.getByLabel('What you already pay for AI or help', { exact: true }).fill('Nothing yet');
    const dimensions = await overflow(page);
    assert.ok(dimensions.document <= 390, JSON.stringify(dimensions));
    assert.deepEqual(dimensions.outside, []);
    await page.screenshot({ path: join(screenshotDir, 'brief-open-390.png'), fullPage: true });
    await page.route('**/brief/received/', (route) => route.request().method() === 'POST' ? route.fulfill({ status: 200, contentType: 'text/html', body: '<p>ok</p>' }) : route.continue());
    await page.locator('#brief-form button[type="submit"]').click();
    await page.waitForURL('**/brief/received/');
    assert.equal(outbound.length, 1, JSON.stringify(outbound));
    assert.equal(outbound[0].method, 'POST');
    assert.equal(new URL(outbound[0].url).pathname, '/brief/received/');
    const sent = new URLSearchParams(outbound[0].body);
    assert.equal(sent.get('form-name'), 'axiom-brief');
    assert.equal(sent.get('team-size'), '6 to 15');
    assert.equal(sent.get('bot-field'), '');
  } finally { await context.close(); }
});

test('no JavaScript still opens the brief and the native form can be sent', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(base + '/#contact');
    await page.locator('#brief-composer summary').click();
    assert.ok(await page.locator('#brief-form').isVisible());
    assert.ok(await page.locator('#brief-form button[type="submit"]').isVisible());
    assert.equal(await page.locator('#brief-form').getAttribute('action'), '/brief/received/');
    assert.equal(await page.locator('.brief-trap').isVisible(), false);
  } finally { await context.close(); }
});
