import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
const files = ['index.html', 'notes/index.html', 'notes/one-front-door/index.html', 'notes/one-tempo/index.html', 'notes/the-gap-is-the-user/index.html', 'notes/the-outcome/index.html', 'notes/the-gathering/index.html', 'notes/left-foot-right-foot/index.html', 'field-reports/insurance-client-care/index.html', 'privacy/index.html', 'terms/index.html', 'baton-rouge/index.html', 'success.html'];
// Exclude only stylesheet references and the proof strip's semantic role.
// All supplied text, labels, links, metadata, images and executable code stay locked.
export function fingerprint(html) {
  return createHash('sha256').update(html.replace(/<link rel="stylesheet"[^>]*>/g, '').replace(/ role="group"/g, '').replace(/\s+/g, ' ').trim()).digest('hex');
}
const fixture = Object.fromEntries(files.map(path => [path, fingerprint(execFileSync('git', ['show', `cbe8a83:${path}`], { encoding: 'utf8' }))]));
mkdirSync('tests/fixtures', { recursive: true });
writeFileSync('tests/fixtures/polish-content.json', JSON.stringify(fixture, null, 2) + '\n');
console.log(`Frozen original content and markup for ${files.length} routes from cbe8a83`);
