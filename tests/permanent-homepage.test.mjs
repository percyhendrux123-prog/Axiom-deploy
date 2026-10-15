import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), 'utf8');
const homepage = read('index.html');
const stylesheet = () => read('assets/firm.css');
const script = () => read('assets/site.js');
const archivePath = 'archive/two-business-evaluation-2026-09/index.html';
const prohibitedRootMarkers = [
  'TWO EVALUATIONS OPEN',
  'Submit one-lane application',
  'data-netlify',
  'netlify-honeypot',
  'two-business-evaluation/apply',
  'Applications close',
  'two-lanes-motion.mp4',
  'fonts.googleapis.com',
  'command@deployaxiom.com',
];

test('firm typography uses the self-hosted Cinzel brand face and keeps the live sales line', () => {
  const css = stylesheet();
  assert.match(css, /@font-face\{font-family:'Cinzel';src:url\('\/assets\/fonts\/Cinzel\.ttf'\)/);
  assert.ok(existsSync(join(root, 'assets/fonts/Cinzel.ttf')));
  assert.ok(existsSync(join(root, 'assets/fonts/OFL.txt')), 'OFL license must ship beside the font');
  assert.ok(!css.includes('fonts.googleapis.com'));
  assert.ok(!/gradient|#2f6b4f|ui-rounded/i.test(css), 'no gradients, retired green, or rounded fonts');
  assert.ok(read('netlify.toml').includes('cp -R assets/fonts assets/notes dist/assets/'));
  assert.match(homepage, /href="tel:\+12256358671"/, 'live sales-line link must remain valid');
  assert.ok(homepage.includes('(225) 635-8671'), 'live sales-line text must remain unchanged');
  assert.ok(!/style="/.test(homepage), 'CSP forbids inline styles');
});

test('homepage states the headline, engagements, method, limits, notes and contact', () => {
  for (const marker of [
    '<h1>The work runs. The authority stays yours.</h1>',
    'Commitments of money, price or promise remain with the owner.',
    'https://ig.me/m/deployaxiom', 'Begin in Instagram DM',
    'Engagements', 'Clients are described rather than named',
    'Intake', 'Context', 'Preparation', 'Decision', 'Record',
    'waits for the owner', 'Limits of authority', 'A draft is never an approval.',
    '/notes/one-front-door/',
  ]) assert.ok(homepage.includes(marker), `missing homepage marker: ${marker}`);
  for (const retiredLead of [/missed calls/i, /web leads/i, /answer your phones?/i]) {
    assert.ok(!retiredLead.test(homepage.replace(/<[^>]+>/g, ' ')), `retired lead language: ${retiredLead}`);
  }
  assert.ok(!/<video\b/i.test(homepage), 'homepage must not load autoplay video');
  for (const marker of prohibitedRootMarkers) assert.ok(!homepage.includes(marker), `stale root marker: ${marker}`);
});

test('note 01 is published as a static page with its diagram', () => {
  const note = read('notes/one-front-door/index.html');
  for (const marker of ['One Front Door', '/assets/notes/one-front-door.svg', 'rel="canonical"']) assert.ok(note.includes(marker), `missing note marker: ${marker}`);
  assert.ok(existsSync(join(root, 'assets/notes/one-front-door.svg')));
  assert.ok(!/style="/.test(note), 'CSP forbids inline styles');
});

test('homepage copy avoids retired internal language', () => {
  const visible = homepage.replace(/<[^>]+>/g, ' ');
  for (const retired of [/operational agents?/i, /operating lanes?/i, /\bone lane\b/i, /\bdeployments?\b/i, /sell automation/i, /One agent\. One lane\./i, /\bOPERATE\b/, /contact lane/i]) {
    assert.ok(!retired.test(visible), `retired public phrase found: ${retired}`);
  }
});

test('homepage lane mapper is local-only, creates a LEADS brief, and has visible no-JS fallback', () => {
  for (const marker of [
    'id="lane-mapper"', 'name="repeated-workflow"', 'name="continuity-break"', 'name="observable-outcome"',
    'Copy LEADS brief', 'Nothing is submitted or stored',
    'Local only.', 'Do not include passwords, API keys, private records, or other secrets.',
    '<noscript>', 'LEADS brief template',
  ]) assert.ok(homepage.includes(marker), `missing mapper marker: ${marker}`);
  assert.ok(!/<form\b/i.test(homepage), 'local mapper must use a non-submitting container, not a form');
  for (const marker of ['FormData', "addEventListener('submit'", 'fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'sessionStorage', 'document.cookie']) {
    assert.ok(!script().includes(marker), `lane mapper must not use submission or persistence behavior: ${marker}`);
  }
});

test('archive is closed, indexed away, and preserves historical route context without an enabled application', () => {
  assert.ok(existsSync(join(root, archivePath)), 'archive page missing');
  const archive = read(archivePath);
  for (const marker of ['CLOSED', 'noindex,follow', 'Back to Deploy Axiom', 'Historical campaign archive']) {
    assert.ok(archive.includes(marker), `missing archive marker: ${marker}`);
  }
  for (const marker of ['data-netlify', 'netlify-honeypot', '<form', 'Submit one-lane application', 'TWO EVALUATIONS OPEN']) {
    assert.ok(!archive.includes(marker), `archive presents an enabled campaign marker: ${marker}`);
  }
});

test('metadata and static assets are local, canonical, and shareable', () => {
  for (const marker of [
    '<link rel="canonical" href="https://deployaxiom.com/">',
    'property="og:title"', 'property="og:description"', 'property="og:image" content="https://deployaxiom.com/assets/axiom-og.png"',
    'name="twitter:card"', 'name="twitter:image" content="https://deployaxiom.com/assets/axiom-og.png"', 'property="og:image:alt" content="Deploy Axiom: The work runs. The authority stays yours."', 'name="twitter:image:alt" content="Deploy Axiom: The work runs. The authority stays yours."', 'name="theme-color" content="#F2EEE6"', 'rel="icon" href="/assets/avatar.svg"',
  ]) assert.ok(homepage.includes(marker), `missing metadata marker: ${marker}`);
  for (const asset of ['assets/avatar.svg', 'assets/axiom-og.png', 'assets/wordmark-ink.svg', 'assets/wordmark-stone.svg']) {
    const fullPath = join(root, asset);
    assert.ok(existsSync(fullPath), `missing asset: ${asset}`);
    assert.ok(statSync(fullPath).size > 0, `empty asset: ${asset}`);
  }
});

test('homepage loads local assets, preserves manual copy fallback, and has a compact mobile header', () => {
  assert.match(homepage, /<link rel="stylesheet" href="\/assets\/firm\.css\?v=\d+">/);
  assert.match(homepage, /<script src="\/assets\/site\.js" defer><\/script>/);
  assert.ok(!/<style[ >]/i.test(homepage), 'homepage must not contain inline style');
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(homepage), 'homepage must not contain inline script');
  assert.match(homepage, /<nav aria-label="Main">/);
  assert.ok(homepage.includes('id="manual-brief"'), 'manual fallback is missing');
  assert.ok(homepage.includes('LEADS brief template'), 'manual template is missing');
  assert.match(script(), /navigator\.clipboard\.writeText/);
  assert.match(script(), /manualBrief\.focus\(\)/);
  const mobileStyles = stylesheet().split('@media (max-width:640px){').at(-1);
  assert.ok(mobileStyles.includes('nav a:not(.nav-cta){display:none}'), 'mobile hides all nav links but Contact');
});

test('homepage uses the wordmark and keeps the hero direct', () => {
  assert.ok(homepage.includes('src="/assets/wordmark-ink.svg" alt="AXIOM"'));
  const hero = homepage.match(/<section class="hero"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.ok(hero.includes('<h1>The work runs. The authority stays yours.</h1>'));
  assert.ok(!/<img|<video|<svg/i.test(hero), 'hero carries no imagery');
  assert.match(stylesheet(), /@media \(prefers-reduced-motion:reduce\)/);
});

test('all public pages avoid inline code and use local stylesheets', () => {
  for (const [path, css] of [['index.html', 'firm'], ['notes/one-front-door/index.html', 'firm'], ['success.html', 'site'], [archivePath, 'site']]) {
    const page = read(path);
    assert.match(page, new RegExp(`<link rel="stylesheet" href="/?assets/${css}\\.css(?:\\?v=[a-z0-9]+)?">`));
    assert.ok(!/<style[ >]/i.test(page), `${path} must not contain inline style`);
    assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(page), `${path} must not contain inline script`);
  }
});

test('historical success route is closed and does not imply an active submission', () => {
  const success = read('success.html');
  assert.ok(success.includes('name="robots" content="noindex,follow"'));
  assert.ok(success.includes('sponsored evaluation campaign is closed'));
  assert.ok(success.includes('href="/"'));
  assert.ok(!success.includes('Your lane is in review.'));
});

test('build copies permanent routes and assets while preserving discoverable functions and webhook source', () => {
  const config = read('netlify.toml');
  for (const marker of ['cp -R archive dist/archive', 'cp assets/favicon.svg assets/axiom-og.png assets/site.css assets/site.js dist/assets/', 'directory = "netlify/functions"', 'Content-Security-Policy', 'Strict-Transport-Security']) {
    assert.ok(config.includes(marker), `missing build/security marker: ${marker}`);
  }
  assert.ok(!config.includes("script-src 'self' 'unsafe-inline'"), 'CSP permits inline scripts');
  assert.ok(!config.includes("style-src 'self' 'unsafe-inline'"), 'CSP permits inline styles');
  assert.ok(config.includes('max-age=31536000; includeSubDomains'), 'HSTS policy missing');
  assert.ok(!config.includes('cp -R assets/.'), 'legacy motion must not be copied into permanent homepage payload');
  const webhook = read('netlify/functions/meta-webhook.mjs');
  assert.ok(webhook.includes('verifyMetaSignature'), 'signed Meta webhook source missing');
  assert.ok(existsSync(join(root, 'netlify/functions/application-submit.mjs')), 'historical application route source missing');
});

test('robots and sitemap represent the permanent public surface, not the closed campaign', () => {
  const robots = read('robots.txt');
  const sitemap = read('sitemap.xml');
  assert.ok(robots.includes('Sitemap: https://deployaxiom.com/sitemap.xml'));
  assert.ok(sitemap.includes('<loc>https://deployaxiom.com/</loc>'));
  assert.ok(!sitemap.includes('two-business-evaluation'));
});


test('product context declares web platform and preserves static conversion constraints', () => {
  const product = read('PRODUCT.md');
  assert.match(product, /## Platform\n\nweb\n/);
  assert.match(product, /## Capabilities and Constraints[\s\S]*No hosted form, database, analytics requirement, metered service, or external font dependency is required for the public conversion path\./);
});
