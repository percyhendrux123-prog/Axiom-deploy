import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const page = readFileSync(join(root, 'index.html'), 'utf8');
const visibleText = page.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const visibleTextLower = visibleText.toLowerCase();

const required = [
  'Two businesses. One operating lane each.',
  'evaluation fee is sponsored in full',
  'Monday, September 14, 2026 at 8:00 p.m. CDT',
  'ten business days',
  'one measurable outcome',
  'No automatic charge, continuation, or deployment',
  'Production deployment, live writes, outbound messages',
  'data-netlify="true"',
  'netlify-honeypot="bot-field"',
  'name="form-name" value="axiom-two-business-evaluation"',
  'action="/api/two-business-evaluation/apply"',
];

test('pilot page presents the bounded offer and exact schedule', () => {
  for (const text of required) {
    const source = text.includes('="') ? page : visibleTextLower;
    const needle = text.includes('="') ? text : text.toLowerCase();
    assert.ok(source.includes(needle), `missing: ${text}`);
  }
});

test('application collects business-fit evidence but no credentials', () => {
  for (const field of [
    'owner-name', 'business-name', 'email', 'business-location', 'decision-authority',
    'lane-name', 'lane-trigger', 'lane-frequency', 'current-process', 'repeated-leak',
    'current-owner', 'measurable-outcome', 'evidence-available', 'systems-involved',
    'ten-day-availability', 'terms-agreement'
  ]) assert.ok(page.includes(`name="${field}"`), `missing field: ${field}`);
  for (const forbidden of ['password', 'api-key', 'access-token', 'payment-card']) {
    assert.ok(!page.includes(`name="${forbidden}"`), `forbidden field: ${forbidden}`);
  }
});

test('claims and commercial boundaries are explicit', () => {
  for (const text of [
    'does not promise automation, revenue lift, time savings, or autonomous action',
    'Any live access, deployment, ongoing operation, case study, or commercial proposal is separate',
    'optional and is not scored',
    'not be added to a general marketing list'
  ]) assert.ok(visibleText.includes(text), `missing boundary: ${text}`);
});

test('legacy prices and generic automation language are absent', () => {
  assert.ok(!/\$\d/.test(page), 'public dollar price found');
  assert.ok(!page.includes('September 18'));
  assert.ok(!page.includes('Most Requested'));
  assert.ok(!page.includes('Strategic Intelligence'));
  assert.ok(!/\[[A-Z][A-Z0-9 _-]+\]/.test(page), 'placeholder found');
});
