import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv, countLedger } from '../scripts/ledger-count.mjs';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

// A339 (11-09 site audit): sitemap, 404, favicon, share tags, title lengths, ledger rule.
const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const attr = (html, sel) => html.match(new RegExp(`<meta ${sel} content="([^"]*)"`))?.[1];

test('sitemap: every URL has a lastmod and a page on disk; operator-layer listed, sudoku unlisted', () => {
  const sitemap = read('sitemap.xml');
  const urls = [...sitemap.matchAll(/<url><loc>https:\/\/deployaxiom\.com(\/[^<]*)<\/loc><lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod><\/url>/g)];
  assert.equal(urls.length, (sitemap.match(/<url>/g) || []).length, 'every <url> carries a lastmod');
  for (const [, path] of urls) assert.ok(existsSync(join(root, path === '/' ? 'index.html' : `${path}index.html`)), `page for ${path}`);
  assert.ok(sitemap.includes('<loc>https://deployaxiom.com/operator-layer/</loc>'));
  assert.ok(!sitemap.includes('/sudoku/'), 'sudoku is unlisted');
  assert.ok(read('sudoku/index.html').includes('<meta name="robots" content="noindex,follow">'), 'sudoku is noindex');
});

test('branded 404 and favicon ship with the build', () => {
  const page = read('404.html');
  assert.ok(page.includes('<a href="/">Back to Deploy Axiom</a>'), 'links home');
  assert.ok(page.includes('noindex'));
  assert.ok(page.includes('/assets/firm.css') && !/<style[ >]|style="/i.test(page), 'local stylesheet, no inline style (CSP)');
  assert.ok(!/<script/i.test(page));
  assert.ok(existsSync(join(root, 'favicon.ico')) && statSync(join(root, 'favicon.ico')).size > 0);
  assert.ok(read('netlify.toml').includes('cp 404.html favicon.ico dist/'));
});

test('share tags are complete on pages the audit flagged', () => {
  for (const path of ['baton-rouge/index.html', 'operator-layer/index.html', 'sudoku/index.html', 'privacy/index.html', 'terms/index.html', 'index.html']) {
    const html = read(path);
    for (const sel of ['property="og:title"', 'property="og:description"', 'property="og:image"', 'property="og:image:alt"', 'property="og:url"',
      'name="twitter:card"', 'name="twitter:title"', 'name="twitter:description"', 'name="twitter:image"', 'name="twitter:image:alt"']) {
      assert.ok(attr(html, sel), `${path} missing ${sel}`);
    }
  }
  assert.equal(attr(read('index.html'), 'property="og:image"'), 'https://deployaxiom.com/assets/axiom-og.png');
});

test('homepage and Baton Rouge titles and descriptions fit search results', () => {
  for (const path of ['index.html', 'baton-rouge/index.html']) {
    const html = read(path);
    assert.ok(html.match(/<title>([^<]*)<\/title>/)[1].length <= 60, `${path} title`);
    assert.ok(attr(html, 'name="description"').length <= 160, `${path} description`);
  }
});

test('byline is P. K. Stewart: no first-name byline in visible page text', () => {
  for (const path of ['index.html', 'baton-rouge/index.html', 'notes/one-front-door/index.html', 'field-reports/insurance-client-care/index.html']) {
    const visible = read(path).replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ');
    assert.ok(!/\bPercy\b/.test(visible), `${path} names Percy in visible text`);
  }
});

test('heavy note images are recompressed', () => {
  for (const f of ['assets/notes/the-gathering.jpg', 'assets/notes/left-foot-right-foot.jpg']) {
    assert.ok(statSync(join(root, f)).size <= 210 * 1024, `${f} ${statSync(join(root, f)).size}`);
  }
});

test('ledger shows an as-of date, and the counting rule matches its labels', () => {
  const home = read('index.html');
  const ledger = home.match(/<section[^>]*id="proof"[\s\S]*?<\/section>/)[0];
  assert.match(ledger, /as of [A-Z][a-z]{2} \d{1,2}, \d{4}/);
  for (const label of ['outcomes on record', 'verified against recorded evidence', 'with a failure caught and recovered']) assert.ok(ledger.includes(label), label);
  assert.ok(!ledger.includes('independently verified'));
  const csv = 'date,task_id,status,evidence,failure_recovered\r\n2026-11-01,a,verified,file.md,yes\n2026-11-02,b,verified,,no\n2026-11-03,"c, quoted",done,x,"yes: note"\n2026-11-10,d,verified,y,yes\nnot-a-date,e,verified,z,yes\n';
  assert.deepEqual(countLedger(parseCsv(csv), '2026-11-09'), { through: '2026-11-09', outcomes: 3, verified: 1, recovered: 1, skippedUndated: 1 });
  assert.ok(existsSync(join(root, 'docs/ledger-count.md')));
});

test('ledger counter refuses a CSV missing a rule column, never counts it (A340 P2)', () => {
  assert.throws(() => parseCsv('date,status,failure_recovered\n2026-11-01,verified,yes\n'), /missing column\(s\): evidence/);
  assert.throws(() => parseCsv('date,status,evidence\n2026-11-01,verified,x\n'), /failure_recovered/);
});

test('ledger counter: trimmed exact match, case-sensitive, as documented (A340 P2)', () => {
  const csv = 'date,status,evidence,failure_recovered\n2026-11-01, verified , f ,yes \n2026-11-02,Verified,f,Yes\n2026-11-03,verified,   ,yes\n';
  assert.deepEqual(countLedger(parseCsv(csv), '2026-11-09'), { through: '2026-11-09', outcomes: 3, verified: 1, recovered: 2, skippedUndated: 0 });
  const doc = read('docs/ledger-count.md');
  assert.match(doc, /trimming surrounding spaces/);
  assert.match(doc, /missing the script stops/);
});

test('ledger CLI: --through without a date exits 2 (A340 non-blocking)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ledger-'));
  const f = join(dir, 'l.csv');
  writeFileSync(f, 'date,status,evidence,failure_recovered\n2026-11-01,verified,x,yes\n');
  const script = join(root, 'scripts/ledger-count.mjs');
  assert.equal(spawnSync(process.execPath, [script, f, '--through']).status, 2);
  assert.equal(spawnSync(process.execPath, [script, f, '--through', '2026-11-09']).status, 0);
  writeFileSync(f, 'date,status\n2026-11-01,verified\n');
  assert.equal(spawnSync(process.execPath, [script, f]).status, 2);
});
