import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const BEACON = '<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=';

test('Cloudflare Web Analytics beacon is on every public page except 404, and the CSP allows only it', () => {
  const pages = execSync('git ls-files "*.html"', { cwd: new URL('.', root).pathname }).toString().split('\n')
    .filter(f => f && !/^(docs|release-packets|qa|tests|src)\//.test(f) && !f.startsWith('google') && f !== '404.html');
  assert.ok(pages.length >= 20, 'found public pages');
  for (const p of pages) assert.equal(read(p).split(BEACON).length - 1, 1, `${p}: exactly one beacon`);
  assert.ok(!read('404.html').includes('cloudflareinsights'), '404 stays script-free');
  const toml = read('netlify.toml');
  assert.ok(toml.includes("script-src 'self' https://static.cloudflareinsights.com;"));
  assert.ok(toml.includes('connect-src https://cloudflareinsights.com;'));
  assert.ok(read('privacy/index.html').includes('We count visits with Cloudflare Web Analytics, which sets no cookies'));
});
