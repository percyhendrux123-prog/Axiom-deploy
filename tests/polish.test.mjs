import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const fixture = JSON.parse(read('tests/fixtures/polish-content.json'));

test('polish preserves original copy, metadata, images, links and scripts on every route', () => {
  for (const [path, expected] of Object.entries(fixture)) {
    const content = read(path).replace(/<link rel="stylesheet"[^>]*>/g, '').replace(/ role="group"/g, '').replace(/\s+/g, ' ').trim();
    assert.equal(createHash('sha256').update(content).digest('hex'), expected, path);
    assert.ok(read(path).includes('/assets/firm.css?v=6'), `${path}: shared letterhead stylesheet`);
  }
});

test('QA and internal material never enter the public build allowlist', () => {
  const config = read('netlify.toml');
  assert.ok(!/cp[^\n]*\b(?:qa|tests|DESIGN|PRODUCT|CHANGES|CONTACT-SHEET)\b/.test(config));
  assert.ok(!/unsafe-inline|https:\/\/fonts|analytics/i.test(config));
});
