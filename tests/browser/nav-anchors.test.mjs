// A413: every header link lands on its own section, in both engines, even when the
// lazy story engine loads during the jump (Chromium scroll anchoring once moved
// a click on "Limits" 638px past its target).
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';
import { chromium, webkit } from 'playwright';

const root = new URL('../..', import.meta.url);
const dist = resolve(root.pathname, 'dist');
let server, base;
before(async () => {
  const config = await readFile(new URL('netlify.toml', root), 'utf8');
  const csp = config.match(/Content-Security-Policy = "([^"]+)"/)[1];
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
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
});
after(async () => { if (server) await new Promise(done => server.close(done)); });

for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  for (const width of [1440, 1024]) {
    test(`header links land on their sections and stay there (${name} ${width})`, async () => {
      const browser = await engine.launch();
      try {
        for (const id of ['work', 'limits', 'method', 'notes']) {
          const page = await browser.newPage({ viewport: { width, height: 900 } });
          await page.goto(base + '/');
          await page.waitForTimeout(500);
          await page.click(`.bar__nav a[href="#${id}"]`);
          await page.waitForTimeout(1800); // long enough for the story engine to load and settle
          const top = await page.evaluate(i => document.getElementById(i).getBoundingClientRect().top, id);
          assert.ok(top >= 0 && top < 200, `${id} heading in view after the jump (top ${Math.round(top)})`);
          await page.close();
        }
      } finally { await browser.close(); }
    });
  }
}
