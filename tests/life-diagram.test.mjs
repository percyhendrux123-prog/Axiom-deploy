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

test('A298 updates reference art deliberately while preserving the remaining homepage', () => {
  const original = home.replace(diagram + '\n\n', '').replace('home.js?v=7', 'home.js?v=4').replace('chain-terminal.js?v=2', 'chain-terminal.js?v=1').replace('<div class="page-texture" aria-hidden="true"><span class="page-texture__tile"></span></div>\n', '');
  const normalized = original.replace(/<link rel="stylesheet"[^>]*>/g, '').replace(/ role="group"/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(createHash('sha256').update(read('assets/axioma/caduceus.js')).digest('hex'), '235810aad7f9594a2e6f1146e17f2e08cd01a5149ad42857de36807985ca36fa');
  // A322 deliberately updates only catalog copy and founder links; art stays locked.
  assert.equal(createHash('sha256').update(normalized).digest('hex'), '0aef89db0054379e7cd250cb4931bd2d49dc433554e9d68cf6db7ce0bfa455f0');
});
