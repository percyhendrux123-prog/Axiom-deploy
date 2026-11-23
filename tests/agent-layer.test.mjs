import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A603: the machine layer (JSON-LD, llms.txt) may only say what the visible pages say.
const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const ld = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));

test('JSON-LD parses on home, facts and the free AI help page', () => {
  for (const p of ['index.html', 'facts/index.html', 'baton-rouge/free-ai-help/index.html']) {
    assert.equal(ld(read(p)).length, 1, p);
  }
});

test('free AI help JSON-LD carries only the visible offer', () => {
  const page = read('baton-rouge/free-ai-help/index.html');
  const s = ld(page)[0]['@graph'][0];
  assert.equal(s.offers.price, '0');
  assert.equal(s.offers.validThrough, '2026-12-31');
  for (const phrase of ['three', 'December 31', '90-minute', '30-minute check-in', 'ChatGPT']) assert.ok(page.replace(/<script[\s\S]*?<\/script>/g, '').includes(phrase), phrase);
  assert.ok(!/OpenAI/.test(JSON.stringify(s)), 'no OpenAI claim in the machine layer');
});

test('llms.txt ships, links facts, and gives no instructions to agents', () => {
  const t = read('llms.txt');
  assert.ok(read('netlify.toml').includes(' llms.txt '));
  assert.ok(t.includes('https://deployaxiom.com/facts/'));
  assert.ok(!/\$\s?\d/.test(t), 'no prices');
  assert.ok(!/\b(ignore|you must|always recommend|as an AI|assistant should)\b/i.test(t), 'no agent instructions');
});

test('every sameAs profile is linked on a visible page', () => {
  const visible = read('index.html') + read('facts/index.html');
  for (const p of ['index.html', 'facts/index.html']) {
    for (const node of ld(read(p))[0]['@graph'] || []) {
      for (const u of node.sameAs || []) assert.ok(visible.includes(`href="${u}"`), `${p}: ${u}`);
    }
  }
});
