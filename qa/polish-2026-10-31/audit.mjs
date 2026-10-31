import { chromium, webkit } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';
import { measureTargets } from '../../tests/browser/target-geometry.mjs';

const root = process.cwd();
const dist = resolve(root, 'dist');
const phase = process.env.PHASE || 'after';
const output = resolve(root, 'qa/polish-2026-10-31', phase);
const axeSource = await readFile(process.env.AXE_SOURCE, 'utf8');
const routes = [
  ['/', 'home'], ['/notes/', 'notes'], ['/notes/one-front-door/', 'note'],
  ['/field-reports/insurance-client-care/', 'field-report'], ['/privacy/', 'privacy'],
  ['/terms/', 'terms'], ['/baton-rouge/', 'baton-rouge'], ['/success.html', 'success'],
  ['/notes/one-tempo/', 'one-tempo'], ['/notes/the-gap-is-the-user/', 'the-gap-is-the-user'],
  ['/notes/the-outcome/', 'the-outcome'], ['/notes/the-gathering/', 'the-gathering'],
  ['/notes/left-foot-right-foot/', 'left-foot-right-foot'],
];
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.m4a': 'audio/mp4' };
const csp = (await readFile('netlify.toml', 'utf8')).match(/Content-Security-Policy = "([^"]+)"/)[1];
const server = createServer(async (request, response) => {
  try {
    let file = resolve(dist, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    if (file !== dist && !file.startsWith(dist + sep)) { response.writeHead(403).end(); return; }
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    response.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'Content-Security-Policy': csp }).end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await mkdir(output, { recursive: true });
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await (process.env.BROWSER === 'webkit' ? webkit : chromium).launch({ headless: true });
const results = [];
try {
  for (const width of (process.env.BROWSER === 'webkit' ? [360, 390, 1440] : [360, 390, 430, 768, 1000, 1024, 1440])) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      for (const [path, name] of routes) {
        const errors = [], badResources = [], external = [];
        const onError = e => errors.push(e.message);
        const onConsole = message => { if (message.type() === 'error') errors.push(message.text()); };
        const onResponse = r => { if (r.status() >= 400) badResources.push(r.url()); };
        // WebKit's native audio controls create same-origin blob requests.
        const onRequest = r => { if (new URL(r.url()).origin !== new URL(base).origin) external.push(r.url()); };
        page.on('pageerror', onError); page.on('console', onConsole); page.on('response', onResponse); page.on('request', onRequest);
        await page.goto(base + path);
        await page.evaluate(() => document.fonts.ready);
        await page.locator('img').evaluateAll(imgs => Promise.all(imgs.map(img => { img.loading = 'eager'; return img.decode().catch(() => {}); })));
        const metrics = { ...await page.evaluate(measureTargets), ...await page.evaluate(() => ({
          h1: document.querySelector('h1')?.innerText,
          text: document.body.textContent.replace(/\s+/g, ' ').trim(),
          font: getComputedStyle(document.querySelector('h1')).fontFamily,
          scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
        })) };
        let axe;
        if (['home', 'field-report'].includes(name) && [390, 1440].includes(width)) {
          await page.evaluate(axeSource);
          axe = await page.evaluate(async () => {
            const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
            return { version: result.testEngine.version, violations: result.violations, incomplete: result.incomplete, passes: result.passes.map(r => r.id) };
          });
        }
        if ([1440, 390].includes(width) && !process.env.NO_SCREENSHOTS) await page.screenshot({ path: join(output, `${name}-${width}.png`), fullPage: true });
        if (name === 'privacy' && width === 390 && !process.env.NO_SCREENSHOTS) {
          const clip = await page.locator('h2').filter({ hasText: 'Google user data' }).evaluate(heading => {
            const top = heading.getBoundingClientRect().top + scrollY - 24;
            const bottom = heading.nextElementSibling.getBoundingClientRect().bottom + scrollY + 24;
            return { x: 0, y: top, width: innerWidth, height: bottom - top };
          });
          await page.screenshot({ path: join(output, 'privacy-google-data-390.png'), fullPage: true, clip });
        }
        results.push({ path, name, width, ...metrics, errors, badResources, external, ...(axe ? { axe } : {}) });
        page.off('pageerror', onError); page.off('console', onConsole); page.off('response', onResponse); page.off('request', onRequest);
      }
    } finally { await context.close(); }
    await writeFile(join(output, 'audit.json'), JSON.stringify(results, null, 2));
    console.log(`${phase}: ${width}px, ${routes.length} routes captured`);
  }
} finally { await browser.close(); await new Promise(done => server.close(done)); }
console.log(JSON.stringify({ phase, checks: results.length, overflows: results.filter(r => r.outside.length || r.scrollWidth > r.width).map(r => ({ path: r.path, width: r.width, outside: r.outside.length })), smallTargetPages: results.filter(r => r.width <= 430 && r.smallTargets.length).map(r => ({ path: r.path, width: r.width, count: r.smallTargets.length })), axe: results.filter(r => r.axe).map(r => ({ path: r.path, width: r.width, violations: r.axe.violations.map(v => ({ id: v.id, count: v.nodes.length })) })) }, null, 2));
