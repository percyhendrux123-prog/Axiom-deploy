import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
function engine() {
  const context = vm.createContext({});
  vm.runInContext(read('assets/axioma/caduceus.js'), context);
  return context.AxCaduceus.create();
}
const text = html => html.replace(/<[^>]*>/g, '');
test('wide caduceus keeps its height and central staff, with single-dot dither', () => {
  const art = engine();
  assert.equal(art.width, 44);
  assert.equal(art.height, 18);
  const rows = text(art.frame(0, 0)).split('\n');
  assert.ok(rows.every(r => r.length === 44));
  assert.ok(rows.slice(0, 6).some(r => r.slice(0, 4).replaceAll('⠀', '').length));
  assert.ok(rows[16].slice(21, 23).replaceAll('⠀', '').length, 'staff remains centered');
  assert.notEqual(art.frame(1, 1), art.frame(2, 1), 'independent breathing remains');
});
test('terminal reveal is top-to-bottom, preserves dimensions and has a leading cursor', () => {
  const art = engine();
  const partial = art.frame(0, 0, .4);
  const rows = text(partial).split('\n');
  assert.equal(rows.length, 18);
  assert.ok(rows.slice(9).every(r => !r.replaceAll('⠀', '').trim()));
  assert.match(partial, /cad-cursor/);
  assert.equal(art.frame(0, 0, 1), art.frame(0, 0));
});
