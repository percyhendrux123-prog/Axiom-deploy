import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const page = read('baton-rouge/index.html');
const visible = page.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('Baton Rouge page leads with the locked line, then the proof', () => {
  const line = visible.indexOf('Nothing in your business waits on you to remember it.');
  const proof = visible.indexOf('We start with your leads and missed calls');
  assert.ok(line > -1 && proof > line, 'line must come first, proof second');
  assert.ok(page.includes('<link rel="canonical" href="https://deployaxiom.com/baton-rouge/">'));
  assert.ok(page.includes('tel:+12256358671'));
  assert.ok(page.includes('https://ig.me/m/deployaxiom'));
});

test('Baton Rouge page makes no retired, price, or result claims', () => {
  for (const r of [/operational agents?/i, /operating lanes?/i, /\bone lane\b/i, /\bdeployments?\b/i, /sell automation/i, /\bOPERATE\b/, /contact lane/i, /\$\s?\d/, /under a second/i, /within a minute\b/i, /guarantee/i]) {
    assert.ok(!r.test(visible), `forbidden public phrase: ${r}`);
  }
});

test('call recording is labeled as a test and ships with the build', () => {
  assert.ok(visible.includes('Test call, not a customer.'));
  assert.ok(existsSync(join(root, 'assets/sales-line-test-call.m4a')));
  const toml = read('netlify.toml');
  assert.ok(toml.includes('cp -R baton-rouge dist/baton-rouge'));
  assert.ok(toml.includes('cp assets/sales-line-test-call.m4a dist/assets/'));
  assert.ok(read('sitemap.xml').includes('https://deployaxiom.com/baton-rouge/'));
  assert.ok(read('index.html').includes('href="/baton-rouge/"'));
});
