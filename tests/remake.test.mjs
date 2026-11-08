import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const home = read('index.html');

test('terminal homepage keeps the business order: hero, axiom, story, ledger, work, limits, method, video, founder, findings, contact', () => {
  const order = ['Nothing in your business waits on you to remember it.<span class="cursor"', 'class="hero__line lede"', 'in plain English', 'class="gate"', 'id="story"', 'id="proof"', 'id="work"', 'id="limits"', 'id="method"', 'id="explained"', 'id="founder"', 'id="notes"', 'id="contact"'];
  let previous = -1;
  for (const marker of order) {
    const position = home.indexOf(marker);
    assert.ok(position > previous, `missing or misplaced: ${marker}`);
    previous = position;
  }
  const ledger = home.match(/<section class="section wrap" id="proof"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.equal((ledger.match(/class="ledger__cell"/g) ?? []).length, 3);
  for (const value of ['>247<', '>165<', '>99<', 'not client data']) assert.ok(ledger.includes(value), value);
  assert.equal((home.match(/class="listing__item"/g) ?? []).length, 4);
  assert.ok(home.includes('href="/field-reports/insurance-client-care/"'));
  assert.ok(home.includes('href="https://github.com/percyhendrux123-prog/escalation-desk"'));
  assert.ok(home.includes('<a class="nav-cta" href="#contact">Start an engagement</a>'));
  assert.ok(home.includes('<summary class="button">Start an engagement</summary>'));
  assert.ok(home.includes('id="brief-composer"'));
  for (const line of ['When rules and regulations begin to move, it\'s no longer solely governance. It\'s operations.', 'A draft is never an approval.', 'Axiom Explained.', 'data-yt="tMeHJg1U108"']) assert.ok(home.includes(line), `missing: ${line}`);
  assert.ok(!home.includes('An AI assistant takes the call'));
  assert.ok(!/\[C\d|\[FLAG|\[HOLD/.test(home), 'editorial markers must not ship');
});

test('medallion story ships as readable HTML with every signal carrying a second cue and a spoken word', () => {
  const story = home.match(/<section class="section wrap story"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.ok(story.includes('story__stage--static'), 'no-JS and reduced-motion layout is the default markup');
  for (const [level, word] of [['stop', 'STOP'], ['caution', 'CAUTION'], ['go', 'GO'], ['whisper', 'second look']]) {
    assert.match(story, new RegExp(`data-axioma-level="${level}">[^<]+<span class="ax-sr"> \\(${word}\\)</span>`), level);
  }
  assert.ok(story.includes('role="img"') && story.includes('aria-label="The Hermes medallion'), 'static medallion is described');
  assert.ok(story.includes('Axiōma is given away: the spec is CC0 and the code is MIT.'), 'ownership language');
  for (const p of story.match(/<div class="story__flow">([\s\S]*?)<\/div>/)[1].match(/<p>[\s\S]*?<\/p>/g)) assert.ok(!/\n|  /.test(p), 'each story paragraph stays on one line with single spaces (engine offsets)');
  assert.ok(home.includes('<script src="/assets/axioma/home.js?v=4" defer></script>'));
  const loader = read('assets/axioma/home.js');
  assert.ok(loader.includes('prefers-reduced-motion: reduce'), 'engine never loads for reduced motion');
  assert.ok(existsSync(join(root, 'assets/axioma/story.js')) && existsSync(join(root, 'src/axioma/story.js')), 'bundle and its source are both tracked');
  for (const banned of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'document.cookie']) assert.ok(!read('src/axioma/story.js').includes(banned), banned);
});

test('insurance field report has the approved limits, artifact, metadata, sitemap and build payload', () => {
  const path = 'field-reports/insurance-client-care/index.html';
  assert.ok(existsSync(join(root, path)), 'field report page missing');
  const report = read(path);
  for (const marker of [
    'Field Report · 02', "An independent insurance agency's client care now runs without her remembering it. Referral asks still wait for her yes.",
    'The gap', 'What runs', 'What waits for her', "What isn't proven yet",
    'Only one enrolled client has received a check-in.', 'A few delivery paths still pass only in testing.',
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
