import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const page = readFileSync(join(root, 'index.html'), 'utf8');
const stylesheet = readFileSync(join(root, 'assets/firm.css'), 'utf8');
const script = readFileSync(join(root, 'assets/site.js'), 'utf8');
const visibleText = page.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

test('permanent homepage replaces the expired campaign with the locked line and real work', () => {
  for (const text of [
    'The work runs. The authority stays yours.',
    'Engagements',
    'Clients are described rather than named until they consent to be.',
  ]) assert.ok(visibleText.includes(text), `missing: ${text}`);
  for (const stale of ['TWO EVALUATIONS OPEN', 'Applications close', 'Submit one-lane application', 'two-lanes-motion.mp4', 'Examples, not client work.']) {
    assert.ok(!page.includes(stale), `stale marker: ${stale}`);
  }
});

test('method is accessible without motion and names the human hold', () => {
  assert.ok(page.includes('class="skip" href="#work"'));
  for (const state of ['Intake', 'Context', 'Preparation', 'Decision', 'Record']) assert.ok(visibleText.includes(state));
  assert.ok(visibleText.includes('Anything that commits the business waits for the owner.'));
  assert.ok(!/<video\b/i.test(page), 'permanent homepage must not contain video');
  assert.ok(stylesheet.includes('@media (prefers-reduced-motion:reduce)'));
});

test('local mapper keeps inputs on device and provides a LEADS fallback', () => {
  for (const field of ['repeated-workflow', 'continuity-break', 'observable-outcome']) {
    assert.ok(page.includes(`name="${field}"`), `missing mapper field: ${field}`);
  }
  for (const text of ['Nothing is submitted or stored.', 'Local only.', 'LEADS brief template']) {
    assert.ok(page.includes(text), `missing mapper safeguard: ${text}`);
  }
  assert.ok(script.includes('navigator.clipboard.writeText'), 'clipboard behavior must live in local script');
  assert.ok(!page.includes('data-netlify'), 'must not contain hosted form collection');
  assert.ok(!page.includes('name="email"'), 'must not expose or collect email');
});

test('homepage makes permissions and execution separation explicit', () => {
  for (const text of ['Delegated', 'Held for approval', 'Reserved to the owner', 'Reading, sorting, drafting', 'A draft is never an approval', 'Moving money, setting prices, and making commitments']) {
    assert.ok(visibleText.includes(text), `missing boundary: ${text}`);
  }
});

test('public site does not state prices, invented results, or stale package copy', () => {
  assert.ok(!/\$\d/.test(page), 'public dollar price found');
  assert.ok(!/client results|clients saved|revenue lift/i.test(page), 'unsupported result claim found');
  assert.ok(!page.includes('Most Requested'));
  assert.ok(!page.includes('Strategic Intelligence'));
});
