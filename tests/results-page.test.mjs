import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const page = read('results/index.html');
const visible = page.replace(/<[^>]+>/g, ' ');

test('results page is built, linked from the homepage footer and in the sitemap', () => {
  assert.ok(read('netlify.toml').includes('cp -R results dist/results && cp assets/results.css dist/assets/'));
  assert.ok(read('index.html').includes('<li><a href="/results/">Results</a></li>'));
  assert.ok(read('sitemap.xml').includes('https://deployaxiom.com/results/'));
  assert.ok(page.includes('/assets/firm.css?v=7') && page.includes('/assets/results.css?v=1'));
});

test('results page names no client and keeps retired phrases out', () => {
  for (const r of [/operational agents?/i, /operating lanes?/i, /\bdeployments?\b/i, /sell automation/i, /\bOPERATE\b/, /guarantee/i, /\bDBE\b/, /Donaldsonville/i, /\bLSU\b/, /23 buildings/i, /soft-?wash/i, /universit/i, /lapsed/i, /bonding/i, /commercial auto/i, /December 10/i, /Nov(ember)? 20\b/i, /Louisiana contractor/i]) {
    assert.ok(!r.test(visible), `not allowed on the results page: ${r}`);
  }
  assert.ok(!/\b(she|her|hers|he|him|his)\b/i.test(visible), 'client gender stays out');
  assert.ok(!/tel:|\(\d{3}\)|\d{3}-\d{3}-\d{4}/.test(page), 'no phone numbers');
});

test('results page carries dated figures, the public repo and the in-progress case', () => {
  for (const v of ['P. K. Stewart, founder', 'November 18, 2026', '54 of 61', '9 of 9', '>345<', '>212<', '>123<', 'https://github.com/percyhendrux123-prog/escalation-desk', 'In progress', 'Result: pending', 'December 11, 2026']) {
    assert.ok(page.includes(v), v);
  }
  assert.equal((visible.match(/\$\s?\d/g) || []).length, 1, 'one stated revenue figure only');
});
