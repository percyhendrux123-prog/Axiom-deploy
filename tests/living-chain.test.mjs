import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const hash = s => createHash('sha256').update(s).digest('hex');
const home = read('index.html');
const js = read('assets/axioma/home.js');

test('A296 locks reference caduceus engine, conductor function and gate markup independently', () => {
  assert.equal(hash(read('assets/axioma/caduceus.js')), 'c2c5449e5cb8669dd937855ae21a8fa18b6f678d94d133cbd4faf6969f670397');
  assert.equal(hash(js.match(/  function caduceusLife\(section\) \{[\s\S]*?\n  }/)[0]), 'a37f7f3ca6ce90e7462b94d2cd485dcbfc7848d7b1ab9e7772693e4ba23bcd2a');
  assert.equal(hash(home.match(/<section class="gate"[\s\S]*?<\/section>/)[0]), 'a3a37a53b94a045f606cb251e2769767a938ede3347d003a32bf97883a1e8f49');
  assert.equal(hash(home.match(/<div class="system__details"[\s\S]*?<\/div>\n<\/div>/)[0]), 'a04c80cfd729fb0c774ac8879e3f4da3bbe7ac6702d2f69b899bbdc3339eea6b');
});

test('order has five 1.5s stops, ordered gates and a 10–14s active-time budget', () => {
  const values = name => JSON.parse(js.match(new RegExp('var ' + name + ' = (\\[[^\\n]+\\])'))[1].replaceAll("'", '"'));
  assert.deepEqual(values('orderKeys'), ['owner', 'operator', 'workers', 'axioma', 'gatekeeper', 'standing', 'tripwire', 'handydandy', 'owner']);
  const holds = values('orderHold');
  assert.deepEqual(holds.slice(3, 8), Array(5).fill(1500));
  const duration = [...values('orderTravel'), ...holds].reduce((sum, n) => sum + n, 0);
  assert.ok(duration >= 10000 && duration <= 14000, duration);
});

test('living accents stay on the existing scheduler, without extra timers or CSS loops', () => {
  assert.equal((js.match(/requestAnimationFrame\(/g) || []).length, 3);
  assert.equal((js.match(/setTimeout\(/g) || []).length, 1);
  assert.doesNotMatch(js, /setInterval/);
  assert.doesNotMatch(read('assets/axioma/axioma.css'), /@keyframes|animation:[^;]*infinite/);
  for (const id of ['chain-life', 'divider-breath']) assert.ok(js.includes(`id: '${id}'`));
});
