import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const PAGE = 'operator-layer/index.html';
const visibleText = html => html
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<title[^>]*>[\s\S]*?<\/title>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;/g, "'").replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ');

test('operator-layer page exists with one h1, six steps and "Where it stops"', () => {
  assert.ok(existsSync(new URL(PAGE, root)), 'page exists');
  const html = read(PAGE);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, 'exactly one h1');
  assert.match(html, /<h1>The operator layer<\/h1>/);
  assert.ok(html.includes("What happens when a small team's AI agent hits a failure."));
  const steps = html.match(/<ol class="ol-steps">([\s\S]*?)<\/ol>/);
  assert.ok(steps, 'ordered list of steps');
  assert.equal((steps[1].match(/<li>/g) || []).length, 6, 'six steps');
  assert.ok(html.includes('>Where it stops</h2>'), '"Where it stops" present');
  for (const heading of ['What stays with the founder', 'What the record holds', 'Why small teams']) {
    assert.ok(html.includes(`>${heading}</h2>`), heading);
  }
});

test('operator-layer copy says founder; the diagram keeps Owner (Q7)', () => {
  const html = read(PAGE);
  const prose = html.replace(/<svg[\s\S]*?<\/svg>/g, '');
  assert.ok(!/\bowner/i.test(prose), 'no "owner" outside the diagram');
  assert.ok(/stays with the founder\./.test(html), 'meta description says founder');
  for (const label of ['>Owner</text>', '>Owner&#x27;s agent</text>']) {
    assert.equal(html.split(label).length - 1, 2, `diagram label ${label} on wide and tall`);
  }
});

test('operator-layer page carries no currency amount, price, retired phrase or banned word', () => {
  const html = read(PAGE);
  const text = visibleText(html);
  assert.ok(!/[$€£¥]\s?\d|\b\d[\d,.]*\s?(?:USD|dollars?)\b|\/mo\b|per month/i.test(html), 'no currency amount');
  for (const banned of [/operational agents?/i, /operating lanes?/i, /\bdeployments?\b/i, /sell automation/i,
    /personal circle/i, /babysit/i, /investors ask/i, /\bcompliant\b/i, /\bt_[0-9a-f]{6,}/, /\bA30\d\b/, /#[A-Za-z]\w+/]) {
    assert.ok(!banned.test(text), `banned public phrase: ${banned}`);
  }
  assert.ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(html), 'no emoji');
  assert.ok(!/field-reports/.test(html), 'no link to /field-reports/');
  assert.ok(!/testimonial|case study/i.test(text), 'no testimonial or case study');
});

test('operator-layer page is CSP-safe, cites its sources and is wired into the build', () => {
  const html = read(PAGE);
  assert.ok(!/<style|\sstyle="|<script(?![^>]*\ssrc=)/i.test(html), 'no inline style or script');
  const scripts = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(scripts, ['/assets/operator-layer.js?v=1'], 'one local script, no third party');
  assert.ok(html.indexOf('/assets/firm.css') < html.indexOf('/assets/axioma/pages.css'), 'night shell after firm.css');
  assert.ok(html.includes('<link rel="canonical" href="https://deployaxiom.com/operator-layer/">'));
  assert.ok(html.includes('href="https://carta.com/data/startup-compensation-h2-2025/"'), 'Carta source link');
  assert.ok(html.includes('href="https://sre.google/sre-book/postmortem-culture/"'), 'SRE source link');
  assert.ok(html.includes('Where did you hear about us?'), 'source line in the brief template');
  assert.ok(html.includes('mailto:percy@deployaxiom.com?subject=Brief%3A%20operator%20layer'), 'brief mailto');
  assert.ok(/<svg class="ol-diagram ol-diagram--wide"[^>]*viewBox="[^"]+"[^>]*role="img"/.test(html), 'inline diagram');
  const toml = read('netlify.toml');
  assert.ok(toml.includes('cp -R operator-layer dist/operator-layer'), 'page copied into dist');
  assert.ok(toml.includes('cp assets/operator-layer.css assets/operator-layer.js dist/assets/'), 'assets copied into dist');
  assert.ok(read('sitemap.xml').includes('<loc>https://deployaxiom.com/operator-layer/</loc>'), 'sitemap entry');
});

test('operator-layer.js tags the brief subject locally, URL-encoded, with no network or storage', () => {
  const src = read('assets/operator-layer.js');
  assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|document\.cookie|localStorage|sessionStorage|indexedDB|https?:\/\//.test(src),
    'no network, cookies or storage');
  const ctx = { window: {}, URLSearchParams };
  vm.runInNewContext(src, ctx);
  const api = ctx.window.AXIOM_OPERATOR_LAYER;
  assert.equal(api.subjectFor(''), 'Brief: operator layer');
  assert.equal(api.subjectFor('?utm_source=linkedin&utm_medium=post&utm_content=L1'), 'Brief: operator layer (linkedin/L1)');
  assert.equal(api.subjectFor('?utm_source=x'), 'Brief: operator layer (x)');
  assert.equal(api.subjectFor('?utm_source=%3Cscript%3E&utm_content=a%26b%3Dc'), 'Brief: operator layer (script/abc)', 'tags are sanitised');
  const href = api.hrefFor(api.subjectFor('?utm_source=linkedin&utm_content=L1'), 'BRIEF\nWhere did you hear about us?');
  assert.equal(href, 'mailto:percy@deployaxiom.com?subject=Brief%3A%20operator%20layer%20(linkedin%2FL1)&body=BRIEF%0AWhere%20did%20you%20hear%20about%20us%3F');
  const links = [{ href: 'mailto:percy@deployaxiom.com?subject=Brief%3A%20operator%20layer&body=A%0AB', setAttribute(k, v) { this[k] = v; }, getAttribute(k) { return this[k]; } }];
  api.apply({ querySelectorAll: () => links }, '?utm_source=youtube&utm_content=S1');
  assert.equal(links[0].href, 'mailto:percy@deployaxiom.com?subject=Brief%3A%20operator%20layer%20(youtube%2FS1)&body=A%0AB');
});
