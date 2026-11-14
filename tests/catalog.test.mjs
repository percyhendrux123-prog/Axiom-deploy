// A322: catalog facts supplied by AXIOM and checked against upstream entries
// on 2026-11-09. Dates for current-entry updates use UTC; initial admission stays visible.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
// A413 deliberately moves the full catalog from the homepage to its own page, /plugins/; the facts are unchanged.
const plugins = readFileSync(new URL('../plugins/index.html', import.meta.url), 'utf8');
const section = plugins.match(/<section class="section wrap" id="catalog"[\s\S]*?<\/section>/)?.[0] ?? '';

const expected = [
  { name: 'tripwire', version: '0.1.3', date: '2026-10-29', label: 'Oct 29, 2026', pr: 145692, update: [151041, '2026-11-09', 'Nov 9, 2026'], repo: 'hermes-tripwire' },
  { name: 'handydandy', version: '0.4.1', date: '2026-11-02', label: 'Nov 2, 2026', pr: 146647, update: [148914, '2026-11-08', 'Nov 8, 2026'], repo: 'hermes-handydandy' },
  { name: 'hermes-axioma', version: '0.3.1', date: '2026-11-05', label: 'Nov 5, 2026', pr: 149364, update: [151033, '2026-11-09', 'Nov 9, 2026'], repo: 'hermes-axioma' },
  { name: 'hermes-standing', version: '0.1.2', date: '2026-11-09', label: 'Nov 9, 2026', pr: 150366, repo: 'hermes-standing' },
  { name: 'hermes-gatekeeper', version: '0.1.0', date: '2026-11-09', label: 'Nov 9, 2026', pr: 151074, repo: 'hermes-gatekeeper' },
  { name: 'hermes-axiom-agent', version: '0.1.0', date: '2026-11-09', label: 'Nov 9, 2026', pr: 151218, repo: 'hermes-axiom-agent' },
];

const items = [...section.matchAll(/<li class="catalog__item" data-plugin="([^"]+)" data-version="([^"]+)"(?: id="[^"]+")?>([\s\S]*?)<\/li>/g)];
const bodyOf = name => items.find(m => m[1] === name)?.[3] ?? '';

test('catalog lists all six accepted plugins with current versions, dates, installs and sources', () => {
  assert.ok(section, 'catalog section exists');
  assert.equal((section.match(/class="catalog__item"/g) ?? []).length, expected.length);
  assert.deepEqual(items.map(m => [m[1], m[2]]), expected.map(p => [p.name, p.version]));
  items.forEach((m, i) => {
    const p = expected[i];
    const body = m[3];
    // A413: on /plugins/ each plugin name is an h2 under the page h1 (no skipped heading level).
    assert.ok(body.includes(`<h2 class="catalog__name">${p.name} <span class="catalog__ver">${p.version}</span></h2>`), `${p.name}: visible name and version`);
    assert.ok(body.includes(`<time datetime="${p.date}">${p.label}</time>`), `${p.name}: initial merge date`);
    assert.ok(body.includes(`href="https://github.com/NousResearch/hermes-agent/pull/${p.pr}">PR #${p.pr}</a>`), `${p.name}: admission PR`);
    if (p.update) {
      const [pr, date, label] = p.update;
      assert.ok(body.includes(`<time datetime="${date}">${label}</time>`), `${p.name}: update date`);
      assert.ok(body.includes(`href="https://github.com/NousResearch/hermes-agent/pull/${pr}">PR #${pr}</a>`), `${p.name}: current-entry PR`);
    }
    assert.ok(body.includes(`href="https://github.com/percyhendrux123-prog/${p.repo}"`), `${p.name}: repo link`);
    assert.ok(body.includes(`<code>hermes plugins install ${p.name}</code>`), `${p.name}: catalog install command`);
    assert.match(body, /<p class="catalog__what">[^<]{20,}<\/p>/, `${p.name}: one plain line`);
  });
});

test('the homepage points to the plugin page instead of listing the catalog (A413)', () => {
  assert.ok(!home.includes('id="catalog"'), 'no catalog section on the homepage');
  assert.ok(home.includes('<a href="/plugins/">see the six plugins</a>'), 'Work links the plugin page');
  assert.match(plugins, /<link rel="canonical" href="https:\/\/deployaxiom\.com\/plugins\/">/);
  assert.equal((plugins.match(/<h1\b/g) || []).length, 1, 'one h1 on the plugin page');
  assert.ok(readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8').includes('<loc>https://deployaxiom.com/plugins/</loc>'));
  assert.ok(readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8').includes('cp -R plugins dist/plugins'));
});

test('catalog count and lookup reflect the November 9 snapshot without unaccepted plugins', () => {
  assert.ok(section.includes('6 accepted, Oct 29 to Nov 9, 2026'));
  // A413: section labels are plain words; the shell prompt retired with the homepage's.
  assert.ok(section.includes('<h1 id="catalog-title">In the Hermes Agent plugin catalog</h1>'));
  assert.ok(section.includes('accepted into the Hermes Agent plugin catalog'));
  assert.ok(section.includes('<span class="lookup__v">0.3.1</span>'));
  assert.ok(section.includes('442374c11b3f03598ea6ff9fb6263e13af505795'));
  for (const p of expected) assert.ok(section.includes(`hermes plugins info ${p.name}`), `${p.name}: lookup command`);
  assert.doesNotMatch(section, /partner|endorse|official|certified|approved by/i);
  assert.doesNotMatch(section, /chiron|0\.3\.0|0\.1\.1|fdd1fee06a2e63ffa3eb74f8e894c626c9b0651e/i);
  assert.doesNotMatch(section, /<(video|iframe|script)\b/i, 'no media or scripts in the section');
});

test('new plugin descriptions state their actual scope and limits', () => {
  assert.match(bodyOf('hermes-standing'), /proven record.*owner's approval/);
  assert.match(bodyOf('hermes-standing'), /not done until a check Standing ran itself passes/);
  assert.match(bodyOf('hermes-gatekeeper'), /owner-configured policy checks on recognized outbound messaging calls/i);
  assert.match(bodyOf('hermes-gatekeeper'), /does not inspect connector, MCP, browser or script sends/);
  assert.match(bodyOf('hermes-axiom-agent'), /nine-article Axiom Doctrine/);
  assert.match(bodyOf('hermes-axiom-agent'), /loaded and enabled/);
  assert.match(bodyOf('hermes-axiom-agent'), /enforces nothing itself/);
});
