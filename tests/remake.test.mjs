import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const home = read('index.html');

test('remake follows the approved section order with three linked proof cells and three stories', () => {
  const order = ['<h1>Nothing in your business waits on you to remember it.</h1>', 'class="lede"', 'id="proof"', 'id="work"', 'id="limits"', 'id="method"', 'id="founder"', 'id="notes"', 'id="contact"'];
  let previous = -1;
  for (const marker of order) {
    const position = home.indexOf(marker);
    assert.ok(position > previous, `missing or misplaced: ${marker}`);
    previous = position;
  }
  const proof = home.match(/<section id="proof"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.equal((proof.match(/class="proof-cell"/g) ?? []).length, 3);
  for (const value of ['Oct 29', '4 min', '96', '231 outcomes on record, 155 independently verified.']) assert.ok(proof.includes(value), value);
  assert.equal((proof.match(/<a href=/g) ?? []).length, 3);
  assert.equal((home.match(/class="story-card"/g) ?? []).length, 3);
  assert.ok(home.includes('href="/field-reports/insurance-client-care/"'));
  assert.ok(home.includes('href="https://github.com/percyhendrux123-prog/escalation-desk"'));
  assert.ok(home.includes('<a class="nav-cta" href="#contact">Start an engagement</a>'));
  assert.ok(home.includes('<summary class="button">Start an engagement</summary>'));
  assert.ok(home.includes('id="brief-composer"'));
  assert.ok(!home.includes('An AI assistant takes the call'));
  assert.ok(!/\[C\d|\[FLAG|\[HOLD/.test(home), 'editorial markers must not ship');
});

test('insurance field report has the approved limits, artifact, metadata, sitemap and build payload', () => {
  const path = 'field-reports/insurance-client-care/index.html';
  assert.ok(existsSync(join(root, path)), 'field report page missing');
  const report = read(path);
  for (const marker of [
    'Field Report · 02', "An independent insurance agency's client care now runs without her remembering it. Referral asks still wait for her yes.",
    'The gap', 'What runs', 'What waits for her', "What isn't proven yet",
    'No enrolled client has received a check-in yet.', 'A few delivery paths still pass only in testing.',
    'href="/#contact"', 'href="/notes/"', 'Example record. Client details removed.',
    'width="2400" height="1800"', 'rel="canonical" href="https://deployaxiom.com/field-reports/insurance-client-care/"',
    'property="og:type" content="article"', 'property="og:url"', 'property="og:title"', 'property="og:description"',
    'property="og:image"', 'property="og:image:alt"', 'name="twitter:card"', 'name="twitter:title"', 'name="twitter:description"',
    'name="twitter:image"', 'name="twitter:image:alt"', 'name="description"',
  ]) assert.ok(report.includes(marker), `missing field report marker: ${marker}`);
  assert.ok(!/\[C\d|\[FLAG|\[HOLD/.test(report));
  assert.ok(!report.includes('keeping in touch with that client through the first year depended on her remembering'));
  assert.ok(existsSync(join(root, 'assets/field-reports/check-log.png')));
  assert.ok(read('sitemap.xml').includes('<loc>https://deployaxiom.com/field-reports/insurance-client-care/</loc>'));
  assert.ok(read('netlify.toml').includes('cp -R field-reports dist/field-reports'));
  assert.ok(read('netlify.toml').includes('assets/field-reports'));
  assert.ok(read('notes/index.html').includes('href="/field-reports/insurance-client-care/"'), 'FR 02 must be discoverable in Notes');
});
