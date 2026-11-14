// A405: the unseen triangle as the site's geometric spine (hero mark, Euclid
// I.1 section, construction-line dividers, mark breath and Construct control).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const home = read('index.html');
const js = read('assets/axioma/home.js');
const css = read('assets/axioma/axioma.css');
const hero = home.match(/<section class="hero[\s\S]*?<\/section>/)[0];
const elements = home.match(/<section class="section wrap elements"[\s\S]*?<\/section>/)?.[0] || '';

test('the hero carries the mark as outlined paths: three cut circles, no drawn triangle, two colors', () => {
  const svg = hero.match(/<svg class="kz"[\s\S]*?<\/svg>/)?.[0];
  assert.ok(svg, 'inline mark in the hero');
  assert.match(svg, /role="img" aria-labelledby="kz-title"/);
  assert.doesNotMatch(svg, /<text|<polygon|<line|<polyline|stroke=/, 'no live text and no drawn edges');
  assert.equal((svg.match(/<path /g) || []).length, 6, 'three discs and three cut overlays');
  assert.match(css, /\.kz__discs path\{fill:#f1ede4\}/);
  assert.match(css, /\.kz__cuts path\{fill:#f1ede4;opacity:0\}/, 'cuts are open (opacity 0) without JS');
  assert.match(css, /\.kz\{display:block;width:clamp\(120px,/, 'never below the ~90px the illusion needs');
});

test('Euclid I.1 sits before the unchanged gate with the agreed meaning, and the axiom stays word for word', () => {
  assert.ok(elements, '#elements section');
  assert.ok(home.indexOf('id="replay"') < home.indexOf('id="elements"') && home.indexOf('id="elements"') < home.indexOf('class="gate"'));
  for (const s of ['five postulates and five common notions', 'Book I, Proposition 1', 'builds an equilateral triangle from two circles', 'Gaetano Kanizsa described the effect in 1955', 'nobody drew']) assert.ok(elements.includes(s), s);
  for (let n = 0; n <= 4; n++) assert.ok(elements.includes(`data-step="${n}"`), `step ${n}`);
  assert.ok(home.includes('<blockquote><p>Nothing sends, spends, or spins without the one who holds the gate.</p></blockquote>'));
  assert.match(elements, /<button class="euclid__run" type="button" hidden>Construct<\/button>/, 'control reserved, hidden without JS');
  assert.match(css, /\.euclid__run\[hidden\]\{display:inline-flex;visibility:hidden\}/, 'space is reserved, so revealing it shifts nothing');
  assert.doesNotMatch(elements, /data-show|is-constructing|is-step/, 'no construct state is baked into the HTML');
});

test('construction lines: every section rule carries the I.1 glyph, from a local file in the build', () => {
  assert.match(css, /\.section\+\.section::before\{[^}]*position:absolute[^}]*mask-image:url\('\/assets\/axioma\/vesica\.svg'\)/);
  const glyph = read('assets/axioma/vesica.svg');
  assert.equal((glyph.match(/<circle /g) || []).length, 5, 'two circles and three marked points');
  assert.match(read('netlify.toml'), /cp -R assets\/axioma dist\/assets\/axioma/);
});

test('mark breath and Construct run on the conductor, opacity only, and end', () => {
  for (const id of ['mark-breath', 'construct-run']) assert.ok(js.includes(`id: '${id}'`), id);
  const breath = js.match(/function markBreath\(section\) \{[\s\S]*?\n  \}/)[0];
  assert.match(breath, /ambient: true/);
  assert.match(breath, /IN = 1600, OUT = 300, STEP = 1000 \/ 12/);
  assert.match(breath, /\.06 \* amt \* wave/, 'very slight: at most 6% opacity');
  assert.match(js, /var KZ = \[\[9100, 0\], \[11300, 2\.1\], \[13700, 4\.2\]\]/, 'three unrelated clocks');
  assert.match(js, /var BUILD = \{ c1: \[600, 1600\], c2: \[2500, 1600\], pt: \[4400, 600\], sides: \[5300, 1200\], end: 7400 \}/);
  assert.match(js, /if \(mq\.matches \|\| !C\.enabled\) \{\s*\/\/ Reduced motion: one explicit step per press/);
  assert.match(js, /if \(buildRun\) finishBuild\(\)\n    resetMark\(\)/, 'switching to reduced motion finishes the figure and rests the mark');
});
