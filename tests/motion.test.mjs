// Static checks on the motion conductor (assets/axioma/home.js). The browser
// suite (tests/browser/motion.test.mjs) proves the timing; these keep the
// rules from drifting in the source.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const code = (p) => read(p).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

test('one conductor owns the page motion: one animation loop, story frames run through it', () => {
  const home = code('assets/axioma/home.js');
  assert.equal((home.match(/requestAnimationFrame\(/g) ?? []).length, 3, 'one frame loop: wake, timer wake and the reschedule inside frame');
  for (const id of ['cursor-handoff', 'cursor-blink', 'ledger-count', 'signal-sweep', 'ring-breath']) assert.ok(home.includes(`'${id}'`), id);
  assert.ok(!/setInterval/.test(home), 'no interval timers');
  assert.equal((home.match(/setTimeout\(/g) ?? []).length, 1, 'one wake timer, used only to sleep between discrete changes');
  const story = code('src/axioma/story.js');
  assert.ok(story.includes('conductor.drive(frame)'), 'the story engine draws on the conductor loop');
  assert.ok(story.includes('conductor?.hold()') && story.includes('conductor?.release()'), 'drag holds every accent and releases at rest');
  assert.ok(!/Math\.sin\(idle|7 \+ Math\.min\(speed/.test(story), 'no idle spin or wobble at rest');
  assert.ok(read('assets/axioma/story.js').includes('attachStory'), 'shipped bundle is rebuilt from the source');
  assert.ok(read('assets/axioma/home.js').includes("'/assets/axioma/story.js?v=3'"), 'bundle version bumped');
});

test('reduced motion turns every accent off and leaves the HTML complete', () => {
  const home = code('assets/axioma/home.js');
  assert.ok(home.includes("matchMedia('(prefers-reduced-motion: reduce)')"));
  assert.match(home, /function enable\(\) \{\s*if \(C\.enabled \|\| mq\.matches/, 'conductor never starts under reduced motion');
  assert.match(home, /if \(mq\.matches\) disable\(\)/, 'switching to reduced motion stops it');
  const css = code('assets/axioma/axioma.css');
  assert.ok(!/infinite/.test(css), 'no endless CSS animation');
  assert.ok(!/@keyframes/.test(css), 'no CSS keyframes outside the conductor');
  const page = read('index.html');
  for (const value of ['>247<', '>165<', '>99<']) assert.ok(page.includes(value), 'ledger numbers are final in the HTML');
  assert.ok(!/is-pending|is-cursor|is-blink-off/.test(page), 'no accent state is baked into the HTML');
});

test('accents animate opacity and transform only, inside the craft limits', () => {
  const home = code('assets/axioma/home.js');
  const styleWrites = [...home.matchAll(/\.style\.(\w+)/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(styleWrites)].sort(), ['opacity', 'transform'], 'A295 extends the conductor with compositor-only transforms, never layout properties');
  const story = code('src/axioma/story.js');
  assert.ok(/ring\.animate\(/.test(story) && story.includes("scale: '1.014'"), 'breathing is a compositor scale on the ring, 1.4% deep');
  const blink = Number(home.match(/var BLINK = (\d+)/)[1]);
  assert.ok(1000 / blink < 3, 'cursor flashes fewer than 3 times a second');
  for (const [name, lo, hi] of [['DUR', 200, 700], ['LIT', 200, 600], ['SLOT', 200, 700]]) {
    const v = Number(home.match(new RegExp(`var ${name} = (\\d+)`))[1]);
    assert.ok(v >= lo && v <= hi, `${name} ${v}ms`);
  }
});
