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
test('Paper LiquidMetal and only used cli-spinners frames ship locally with licenses', () => {
  assert.match(read('assets/axioma/vendor/paper-liquid-metal.js'), /liquidMetalFragmentShader/);
  assert.match(read('assets/axioma/vendor/LICENSE-Paper-Shaders.txt'), /Apache License/);
  assert.match(read('assets/axioma/vendor/NOTICE-Paper-Shaders.txt'), /Paper/);
  const spinner = JSON.parse(read('assets/axioma/vendor/cli-spinners-dots.json'));
  assert.equal(spinner.dots.interval, 80);
  assert.equal(spinner.dots.frames.length, 10);
  assert.equal(Object.keys(spinner).length, 1, 'only used dots family');
  assert.match(read('assets/axioma/vendor/LICENSE-cli-spinners.txt'), /MIT License/);
  for (const token of ['Paper Shaders', 'cli-spinners']) assert.ok(read('index.html').includes(token));
  for (const token of ['paper-liquid-metal.js', 'cli-spinners-dots.json']) assert.ok(read('netlify.toml').includes(token));
});
test('only one diagram rendering host is shipped and ROT schedules no private loop', () => {
  const home = read('index.html'), js = read('assets/axioma/chain-terminal.js');
  assert.equal((home.match(/class="system__terminal /g) || []).length, 1);
  assert.doesNotMatch(home, /system__lines--wide|system__lines--small/);
  assert.match(js, /extends ROT\.Display/);
  assert.match(js, /this\._backend\.schedule = function \(\) \{\}/);
  assert.doesNotMatch(js, /requestAnimationFrame|setTimeout|setInterval/);
  assert.match(home, /class="system__alternative"/);
});
test('rot.js is vendored locally with its BSD license and explicit build inclusion', () => {
  const vendor = read('assets/axioma/vendor/rot.min.js');
  assert.ok(vendor.includes('Display'));
  assert.match(read('assets/axioma/vendor/LICENSE-rot-js.txt'), /Redistribution and use in source and binary forms/);
  assert.match(read('assets/axioma/vendor/README.md'), /2\.2\.1/);
  assert.match(read('netlify.toml'), /assets\/axioma\/vendor/);
  assert.match(read('index.html'), /rot\.js \(BSD-3-Clause\)/);
});
test('wide caduceus keeps its height and central staff, with single-dot dither', () => {
  const art = engine();
  assert.equal(art.width, 44);
  assert.equal(art.height, 18);
  const rows = text(art.frame(0, 0)).split('\n');
  assert.equal(read('index.html').match(/<pre class="caduceus"[^>]*>([\s\S]*?)<\/pre>/)[1], art.frame(0, 0), 'reduced/no-JS art is the exact final frame');
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
