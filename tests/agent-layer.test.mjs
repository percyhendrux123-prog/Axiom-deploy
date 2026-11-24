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

test('A615: llms.txt and the visible facts page carry the same agent front door line', () => {
  const line = 'For AI agents: a read-only MCP server at https://axiom-front-door.percyhendrux123.workers.dev/mcp answers from https://deployaxiom.com/facts/, word for word.';
  const visible = read('facts/index.html').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
  assert.ok(read('llms.txt').includes(line), 'llms.txt line');
  assert.ok(visible.includes(line), 'visible on /facts');
  // A616: the JSON-LD door node says exactly the visible line, nothing more.
  const graph = ld(read('facts/index.html'))[0]['@graph'];
  const doors = graph.filter(n => JSON.stringify(n).includes('workers.dev'));
  assert.equal(doors.length, 1, 'one door node');
  const door = doors[0];
  assert.equal(door['@type'], 'WebAPI');
  assert.equal(door.description, line, 'description = visible line');
  assert.equal(door.url, 'https://axiom-front-door.percyhendrux123.workers.dev/mcp');
  assert.equal(door.documentation, 'https://deployaxiom.com/facts/');
  assert.deepEqual(door.provider, { '@id': 'https://deployaxiom.com/#org' });
  assert.deepEqual(Object.keys(door).sort(), ['@id', '@type', 'description', 'documentation', 'provider', 'url'], 'no extra claims');
  for (const u of [door.url, door.documentation]) assert.ok(visible.includes(u), `visible: ${u}`);
  for (const p of ['index.html', 'baton-rouge/free-ai-help/index.html']) {
    assert.ok(!JSON.stringify(ld(read(p))).includes('workers.dev'), `${p}: no door claim where the line is not visible`);
  }
});
