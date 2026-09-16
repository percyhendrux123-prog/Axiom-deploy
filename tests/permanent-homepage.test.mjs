import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), 'utf8');
const homepage = read('index.html');
const stylesheet = () => read('assets/site.css');
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

test('homepage states the permanent operating-agent model and contact lane', () => {
  for (const marker of [
    "We don't sell automation. We deploy operational agents.",
    'one agent, one operating lane, one measurable outcome',
    'Start with OPERATE',
    'https://ig.me/m/deployaxiom',
    'Instagram DM is the current contact lane',
    'SIMULATED LANE · REAL OPERATING MODEL',
    'Observe', 'Assemble', 'Draft', 'Hold', 'Record',
    'human approval', 'read', 'classify', 'draft', 'queue', 'execute', 'stop',
  ]) assert.ok(homepage.includes(marker), `missing homepage marker: ${marker}`);
  assert.ok(!/<video\b/i.test(homepage), 'homepage must not load autoplay video');
  for (const marker of prohibitedRootMarkers) assert.ok(!homepage.includes(marker), `stale root marker: ${marker}`);
});

test('homepage lane mapper is local-only, creates an OPERATE brief, and has visible no-JS fallback', () => {
  for (const marker of [
    'id="lane-mapper"', 'name="repeated-workflow"', 'name="continuity-break"', 'name="observable-outcome"',
    'Copy OPERATE brief', 'Nothing is submitted or stored',
    'Local only.', 'Do not include passwords, API keys, private records, or other secrets.',
    '<noscript>', 'OPERATE brief template',
  ]) assert.ok(homepage.includes(marker), `missing mapper marker: ${marker}`);
  assert.ok(!homepage.includes('<form name='), 'homepage must not contain a hosted form');
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
    'name="twitter:card"', 'name="twitter:image" content="https://deployaxiom.com/assets/axiom-og.png"', 'property="og:image:alt" content="Deploy Axiom operational agents"', 'name="twitter:image:alt" content="Deploy Axiom operational agents"', 'name="theme-color" content="#ebe7dc"', 'rel="icon" href="/assets/favicon.svg"',
  ]) assert.ok(homepage.includes(marker), `missing metadata marker: ${marker}`);
  for (const asset of ['assets/favicon.svg', 'assets/axiom-og.png']) {
    const fullPath = join(root, asset);
    assert.ok(existsSync(fullPath), `missing asset: ${asset}`);
    assert.ok(statSync(fullPath).size > 0, `empty asset: ${asset}`);
  }
});

test('homepage loads local assets, preserves manual copy fallback, and has a compact mobile header', () => {
  assert.match(homepage, /<link rel="stylesheet" href="\/assets\/site\.css">/);
  assert.match(homepage, /<script src="\/assets\/site\.js" defer><\/script>/);
  assert.ok(!/<style[ >]/i.test(homepage), 'homepage must not contain inline style');
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(homepage), 'homepage must not contain inline script');
  assert.match(homepage, /<nav class="nav" aria-label="Primary">/);
  assert.ok(homepage.includes('id="manual-brief"'), 'manual fallback is missing');
  assert.ok(homepage.includes('OPERATE brief template'), 'manual template is missing');
  assert.match(script(), /navigator\.clipboard\.writeText/);
  assert.match(script(), /manualBrief\.focus\(\)/);
  const mobileStyles = stylesheet().split('@media(max-width:390px){').at(-1);
  assert.ok(mobileStyles.includes('.nav{display:none}'), 'mobile styles must hide the center nav');
  assert.ok(mobileStyles.includes('header{gap:'), 'mobile header must reserve compact spacing');
});

test('all public pages avoid inline code and use local stylesheets', () => {
  for (const path of ['index.html', 'success.html', archivePath]) {
    const page = read(path);
    assert.match(page, /<link rel="stylesheet" href="(?:\/)?assets\/site\.css">|<link rel="stylesheet" href="\/assets\/site\.css">/);
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
