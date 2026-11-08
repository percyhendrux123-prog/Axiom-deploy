import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const home = read('index.html');
const diagram = home.match(/<section class="section wrap system"[\s\S]*?<\/section>/)?.[0] || '';

test('A295 adds an explainer map after the untouched gate, with five gates on their edges', () => {
  assert.ok(diagram, 'the interactive diagram section exists');
  assert.ok(home.indexOf('class="gate"') < home.indexOf('id="system"'));
  assert.ok(home.indexOf('id="system"') < home.indexOf('id="story"'));
  for (const key of ['owner', 'operator', 'workers', 'axioma', 'gatekeeper', 'standing', 'tripwire', 'handydandy']) {
    assert.ok(diagram.includes(`data-system-node="${key}"`), key);
    assert.ok(diagram.includes(`id="system-${key}-info"`), `${key}: static fallback`);
  }
  for (const label of ['orders', 'evidence', 'refused', 'handoff']) assert.ok(diagram.includes(`>${label}<`));
  assert.match(diagram, /advises; it never blocks/);
  assert.doesNotMatch(diagram, /in the catalog|accepted into|9 of 9|prices|\$\d/i);
});

test('new life accents use the same conductor and stop on visibility changes', () => {
  const home = read('assets/axioma/home.js');
  for (const id of ['diagram-arrival', 'head-arrival', 'rule-breath', 'braille-shimmer', 'link-response']) assert.ok(home.includes(`'${id}'`), id);
  assert.ok(home.includes("addEventListener('visibilitychange'"));
  assert.ok(home.includes('cancelAnimationFrame'));
});

test('A295 preserves all pre-existing homepage content and the caduceus engine byte for byte', () => {
  const original = home.replace(diagram + '\n\n', '').replace('home.js?v=6', 'home.js?v=4');
  const normalized = original.replace(/<link rel="stylesheet"[^>]*>/g, '').replace(/ role="group"/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(createHash('sha256').update(read('assets/axioma/caduceus.js')).digest('hex'), 'c2c5449e5cb8669dd937855ae21a8fa18b6f678d94d133cbd4faf6969f670397');
  assert.equal(createHash('sha256').update(normalized).digest('hex'), '05e4d569f3d93efd9815af975b52a0b51ce75a094046bcf08d22f245df5cd40a');
});
