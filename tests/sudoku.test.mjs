import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const ctx = { window: {} }; vm.runInNewContext(read('assets/sudoku/puzzles.js'), ctx);
const BANK = ctx.window.AXIOM_SUDOKU;
const peers = (i) => { const r = i / 9 | 0, c = i % 9, o = []; for (let k = 0; k < 81; k++) { const a = k / 9 | 0, b = k % 9; if (k !== i && (a === r || b === c || ((a / 3 | 0) === (r / 3 | 0) && (b / 3 | 0) === (c / 3 | 0)))) o.push(k); } return o; };
const P = [...Array(81)].map((_, i) => peers(i));
function count(g, limit = 2) { let n = 0; const rec = () => { if (n >= limit) return; let best = -1, bc = null; for (let i = 0; i < 81; i++) if (!g[i]) { const cs = []; for (let d = 1; d <= 9; d++) if (P[i].every((k) => g[k] !== d)) cs.push(d); if (!cs.length) return; if (!bc || cs.length < bc.length) { best = i; bc = cs; } } if (best < 0) { n++; return; } for (const d of bc) { g[best] = d; rec(); g[best] = 0; } }; rec(); return n; }
test('sudoku bank has four levels, each puzzle unique and matching its solution', () => {
  assert.deepEqual(Object.keys(BANK), ['easy', 'medium', 'hard', 'advanced']);
  for (const [level, list] of Object.entries(BANK)) {
    assert.ok(list.length >= 20, level);
    for (const [p, s] of list) {
      assert.match(p, /^[0-9]{81}$/); assert.match(s, /^[1-9]{81}$/);
      for (let i = 0; i < 81; i++) { if (p[i] !== '0') assert.equal(p[i], s[i]); assert.ok(P[i].every((k) => s[k] !== s[i])); }
      assert.equal(count(p.split('').map(Number)), 1, level + ' puzzle not unique');
    }
  }
});
test('sudoku page is CSP-safe and wired into the build', () => {
  const html = read('sudoku/index.html');
  assert.ok(!/<script>(?!<)/.test(html) && !/\sstyle="/.test(html) && !/<style/.test(html), 'inline script/style');
  assert.ok(html.includes('/assets/sudoku/sudoku.js') && html.includes('/assets/sudoku/puzzles.js'));
  const toml = read('netlify.toml');
  assert.ok(toml.includes('cp -R sudoku dist/sudoku') && toml.includes('cp -R assets/sudoku dist/assets/sudoku'));
  assert.ok(!/fetch\(|XMLHttpRequest/.test(read('assets/sudoku/sudoku.js')), 'connect-src is none');
});
