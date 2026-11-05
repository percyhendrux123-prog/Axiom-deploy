// The catalog section (A249): exactly the three plugins accepted into the
// Hermes Agent plugin catalog, with the versions, merge dates and PRs that are
// on NousResearch/hermes-agent main (plugin-catalog/*.yaml, re-checked with gh
// on 2026-11-05). handydandy 0.4.x is still in review and must not appear.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const section = home.match(/<section class="section wrap" id="catalog"[\s\S]*?<\/section>/)?.[0] ?? '';

const expected = [
  { name: 'tripwire', version: '0.1.1', date: '2026-10-29', label: 'Oct 29, 2026', pr: 145692, repo: 'hermes-tripwire' },
  { name: 'handydandy', version: '0.3.0', date: '2026-11-02', label: 'Nov 2, 2026', pr: 146647, repo: 'hermes-handydandy' },
  { name: 'hermes-axioma', version: '0.3.0', date: '2026-11-05', label: 'Nov 5, 2026', pr: 149364, repo: 'hermes-axioma' },
];

test('catalog section lists exactly the three accepted plugins with correct versions', () => {
  assert.ok(section, 'catalog section exists');
  const items = [...section.matchAll(/<li class="catalog__item" data-plugin="([^"]+)" data-version="([^"]+)">([\s\S]*?)<\/li>/g)];
  assert.equal((section.match(/class="catalog__item"/g) ?? []).length, 3);
  assert.deepEqual(items.map((m) => [m[1], m[2]]), expected.map((p) => [p.name, p.version]));
  items.forEach((m, i) => {
    const p = expected[i];
    const body = m[3];
    assert.ok(body.includes(`<h3 class="catalog__name">${p.name} <span class="catalog__ver">${p.version}</span></h3>`), `${p.name}: visible name and version`);
    assert.ok(body.includes(`<time datetime="${p.date}">${p.label}</time>`), `${p.name}: merge date`);
    assert.ok(body.includes(`href="https://github.com/NousResearch/hermes-agent/pull/${p.pr}">PR #${p.pr}</a>`), `${p.name}: merged PR link`);
    assert.ok(body.includes(`href="https://github.com/percyhendrux123-prog/${p.repo}"`), `${p.name}: repo link`);
    assert.match(body, /<p class="catalog__what">[^<]{20,}<\/p>/, `${p.name}: one plain line`);
  });
});

test('catalog section uses the accurate phrase and claims no partnership or endorsement', () => {
  assert.ok(section.includes('hermes plugins list --catalog --author percy'));
  assert.ok(section.includes('accepted into the Hermes Agent plugin catalog'));
  assert.doesNotMatch(section, /partner|endorse|official|certified|approved by/i);
  assert.doesNotMatch(section, /0\.4\.\d|148914/, 'handydandy 0.4.x is in review, never listed');
  assert.doesNotMatch(section, /<(video|iframe|script)\b/i, 'no media or scripts in the section');
});
