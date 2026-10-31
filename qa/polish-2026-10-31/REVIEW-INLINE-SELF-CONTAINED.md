# A164 bounded text-only adversarial review

Your first review attempt declined repository access because this worktree is outside your allowed read scope. Respect that restriction. DO NOT read files, access repositories, run shell commands, start browsers, edit anything, or update policy. Review ONLY the public code and evidence embedded in this query. Return concrete defects only in your final response, with filename and reproduction; if none, say no concrete defect found and state that this was a text-only review, not independent runtime verification. The parent will preserve your response in its authorized workspace.

Goal: fix native inline-link flow in mobile prose without changing copy. AXIOM requested that sentence links remain display:inline and wrap naturally; WCAG 2.5.8/2.5.5 inline exceptions apply. Standalone link lists/buttons must remain >=44x44px on mobile. No horizontal overflow at 360/390. Privacy 390px must keep Google policy-name fragments and surrounding text on evenly spaced lines. No copy, brand, dependency, navigation, transmission or motion changes.

This is a revision to a preview-only local branch. No merge/push/deploy or client data. Your job is to find concrete defects in the code/test coverage, not approve production.

Changed files: assets/firm.css; tests/browser/polish.test.mjs; new tests/browser/target-geometry.mjs; QA audit uses the shared measurement function, screenshots/logs/manifest and CHANGES.md are refreshed.

How parent verified: node --test tests/ (49 pass); CI=1 npm run build -- --offline (exact static build command + existing function bundles, no deploy); npm run test:browser (10 pass). Each browser test manages and closes its own loopback server and headless Chromium. Shared geometry audit also executed in Chromium (91 route-width combinations) and WebKit (39). Both yield no document/element overflow, no undersized standalone targets on mobile, no non-inline prose links, no resource/console/external-request errors; axe home/report at390/1440 has zero violations/incomplete. These are parent execution evidence, not your independent findings. Parent visually inspected actual 390px privacy crop and observed normal continuous sentence flow.

Acceptance: (1) native inline links inside prose including bold Related note titles; (2) >=44px standalone targets; (3) continuous even-leading policy paragraph at390; (4) no horizontal overflow at360/390; (5) copy and contract tokens untouched.

Try to break classification or spot a specific selector/regression defect. Do not speculate about markup that is not present. Full relevant source follows.

## Implementation and regression-test diff
```diff
diff --git a/assets/firm.css b/assets/firm.css
index 52f8266..b50fa48 100644
--- a/assets/firm.css
+++ b/assets/firm.css
@@ -480,7 +480,7 @@ input::placeholder,textarea::placeholder{color:var(--muted);opacity:1}
 .article th{color:var(--ink);letter-spacing:.06em}
 .article .next{margin-top:48px;padding-top:24px;line-height:1.7}
 .article .next p{margin-bottom:24px}
-.article .next a{display:inline-flex;align-items:center;min-height:44px}
+.article .next>a:not(:has(strong)){display:inline-flex;align-items:center;min-height:44px}
 .remake .report{max-width:1120px}
 .remake .report h1{font-size:clamp(32px,3.2vw,46px);line-height:1.25;max-width:30ch;margin-left:0}
 .remake .report-copy{max-width:var(--reading)}
@@ -607,9 +607,9 @@ input::placeholder,textarea::placeholder{color:var(--muted);opacity:1}
   .article th{font-size:10px;letter-spacing:.02em}
   .remake .report .proof-grid{padding:24px 0;margin:8px 0 32px}
   .remake .report .document-plate{margin:32px 0 40px}
-  .article a:not(.button){display:inline-flex;align-items:center;min-height:44px;min-width:44px;max-width:100%;overflow-wrap:anywhere}
-  .article a:not(.button):has(strong){display:inline-block;padding-block:8px}
-  .founder-copy a,.closing-alt a,.recording .fine a,.fallback a{display:inline-flex;align-items:center;min-height:44px;min-width:44px;max-width:100%;overflow-wrap:anywhere}
+  /* Prose links keep native inline wrapping and leading (WCAG inline exception). */
+  .article a:not(.button),.founder-copy a,.closing-alt a,.recording .fine a,.fallback a{overflow-wrap:anywhere}
+  .founder-copy p:last-child a{display:inline-flex;align-items:center;min-height:44px;min-width:44px}
   .br-hero{padding:40px 0 48px}
   .br h1{font-size:34px;max-width:none}
   .br .lede{font-size:19px}
diff --git a/tests/browser/polish.test.mjs b/tests/browser/polish.test.mjs
index 409b7f7..749cecc 100644
--- a/tests/browser/polish.test.mjs
+++ b/tests/browser/polish.test.mjs
@@ -4,6 +4,7 @@ import { createServer } from 'node:http';
 import { readFile, stat } from 'node:fs/promises';
 import { resolve, sep, extname, join } from 'node:path';
 import { chromium } from 'playwright';
+import { measureTargets } from './target-geometry.mjs';
 
 const dist = resolve(new URL('../..', import.meta.url).pathname, 'dist');
 const routes = ['/', '/notes/', '/notes/one-front-door/', '/notes/one-tempo/', '/notes/the-gap-is-the-user/', '/notes/the-outcome/', '/notes/the-gathering/', '/notes/left-foot-right-foot/', '/field-reports/insurance-client-care/', '/privacy/', '/terms/', '/baton-rouge/', '/success.html'];
@@ -45,7 +46,7 @@ test('every polished route is stationary with ordinary motion preferences', asyn
   } finally { await context.close(); }
 });
 
-test('all page families fit mobile with at least 44px interactive targets', async () => {
+test('all page families fit mobile with 44px standalone targets and naturally inline prose links', async () => {
   const failures = [];
   for (const width of [360, 390, 430, 768, 1000, 1024, 1440]) {
     const context = await browser.newContext({ viewport: { width, height: 1000 } });
@@ -54,27 +55,38 @@ test('all page families fit mobile with at least 44px interactive targets', asyn
       for (const path of routes) {
         await page.goto(base + path);
         await page.evaluate(() => document.fonts.ready);
-        const result = await page.evaluate(() => {
-          const visible = e => e.checkVisibility();
-          const describe = e => `${e.tagName}.${e.className}: ${(e.textContent || '').trim().slice(0, 60)}`;
-          return {
-            scrollWidth: document.documentElement.scrollWidth,
-            outside: [...document.querySelectorAll('main *, header *, footer *')].filter(visible).filter(e => {
-              const r = e.getBoundingClientRect();
-              return r.width && (r.left < -1 || r.right > innerWidth + 1);
-            }).map(describe),
-            small: [...document.querySelectorAll('a, button, summary, input, textarea')].filter(visible).filter(e => !e.classList.contains('skip')).filter(e => {
-              const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44;
-            }).map(describe),
-          };
-        });
-        if (result.scrollWidth > width || result.outside.length || (width <= 430 && result.small.length)) failures.push({ path, width, ...result });
+        const result = await page.evaluate(measureTargets);
+        if (result.scrollWidth > width || result.outside.length || result.nonInlineTextLinks.length || (width <= 430 && result.smallTargets.length)) failures.push({ path, width, ...result });
       }
     } finally { await context.close(); }
   }
   assert.deepEqual(failures, []);
 });
 
+test('privacy policy links wrap within evenly led mobile prose', async () => {
+  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
+  try {
+    const page = await context.newPage();
+    await page.goto(base + '/privacy/');
+    await page.evaluate(() => document.fonts.ready);
+    const policy = page.locator('.article a[href="https://developers.google.com/terms/api-services-user-data-policy"]');
+    assert.equal(await policy.evaluate(element => getComputedStyle(element).display), 'inline');
+    const lines = await policy.evaluate(element => {
+      const paragraph = element.closest('p');
+      const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
+      const tops = new Set();
+      while (walker.nextNode()) {
+        const range = document.createRange();
+        range.selectNodeContents(walker.currentNode);
+        for (const rect of range.getClientRects()) if (rect.width) tops.add(rect.top);
+      }
+      return { tops: [...tops].sort((a, b) => a - b), leading: parseFloat(getComputedStyle(paragraph).lineHeight), fragments: element.getClientRects().length };
+    });
+    assert.ok(lines.fragments > 1, 'the policy name shares surrounding lines instead of moving as one box');
+    assert.ok(lines.tops.slice(1).every((top, index) => Math.abs(top - lines.tops[index] - lines.leading) < 1), JSON.stringify(lines));
+  } finally { await context.close(); }
+});
+
 test('keyboard focus stays visible on the dark engagement and the light composer', async () => {
   const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
   try {
@@ -96,9 +108,10 @@ test('keyboard focus stays visible on the dark engagement and the light composer
     for (const width of [360, 390]) {
       await page.setViewportSize({ width, height: 844 });
       await page.getByLabel('The recurring work', { exact: true }).fill('X'.repeat(800));
-      const metrics = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, targets: [...document.querySelectorAll('#brief-composer a, #brief-composer button, #brief-composer textarea')].filter(e => e.checkVisibility()).map(e => { const r = e.getBoundingClientRect(); return { width: r.width, height: r.height }; }) }));
-      assert.equal(metrics.width, width);
-      assert.ok(metrics.targets.every(r => r.width >= 44 && r.height >= 44));
+      const metrics = await page.evaluate(measureTargets);
+      assert.equal(metrics.scrollWidth, width);
+      assert.deepEqual(metrics.smallTargets, []);
+      assert.deepEqual(metrics.nonInlineTextLinks, []);
     }
   } finally { await context.close(); }
 });

```

## tests/browser/target-geometry.mjs
```js
// Shared browser-side measurements. Inline exceptions are classified from
// surrounding prose, never computed display (inline-flex is the regression).
export function measureTargets() {
  const visible = element => element.checkVisibility();
  const describe = element => ({ tag: element.tagName, class: element.className, text: (element.innerText || element.getAttribute('aria-label') || '').trim().slice(0, 100) });
  const rect = element => { const r = element.getBoundingClientRect(); return { width: r.width, height: r.height, left: r.left, right: r.right }; };
  const isRunningTextLink = element => {
    if (element.tagName !== 'A' || element.matches('.button, .brand, .notes-list a, .notes-all a, .footer-links a')) return false;
    const container = element.closest('p, li, figcaption, .next');
    if (!container) return false;
    const prose = container.cloneNode(true);
    // Sibling paragraphs in a closing section are not the link's line.
    prose.querySelectorAll('a, p, ul, ol').forEach(node => node.remove());
    return /[\p{L}\p{N}]/u.test(prose.textContent);
  };
  const targets = [...document.querySelectorAll('a, button, summary, input, textarea')].filter(visible).filter(element => !element.classList.contains('skip'));
  const inlineTextLinks = targets.filter(isRunningTextLink).map(element => ({ ...describe(element), display: getComputedStyle(element).display }));
  return {
    viewport: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    outside: [...document.querySelectorAll('main *, header *, footer *')].filter(visible).filter(element => { const r = rect(element); return r.width && (r.left < -1 || r.right > innerWidth + 1); }).map(element => ({ ...describe(element), ...rect(element) })),
    // WCAG 2.5.8/2.5.5 inline exception; standalone controls remain >=44x44.
    smallTargets: targets.filter(element => !isRunningTextLink(element)).filter(element => { const r = rect(element); return r.width < 44 || r.height < 44; }).map(element => ({ ...describe(element), ...rect(element) })),
    inlineTextLinks,
    nonInlineTextLinks: inlineTextLinks.filter(link => link.display !== 'inline'),
  };
}

```

## tests/browser/polish.test.mjs
```js
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';
import { chromium } from 'playwright';
import { measureTargets } from './target-geometry.mjs';

const dist = resolve(new URL('../..', import.meta.url).pathname, 'dist');
const routes = ['/', '/notes/', '/notes/one-front-door/', '/notes/one-tempo/', '/notes/the-gap-is-the-user/', '/notes/the-outcome/', '/notes/the-gathering/', '/notes/left-foot-right-foot/', '/field-reports/insurance-client-care/', '/privacy/', '/terms/', '/baton-rouge/', '/success.html'];
let server, browser, base;
before(async () => {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.m4a': 'audio/mp4' };
  server = createServer(async (request, response) => {
    try {
      let file = resolve(dist, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
      if (file !== dist && !file.startsWith(dist + sep)) { response.writeHead(403).end(); return; }
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      const headers = { 'content-type': types[extname(file)] || 'application/octet-stream', 'content-length': body.length, 'accept-ranges': 'bytes' };
      const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range || '');
      if (range) {
        const start = Number(range[1]), end = range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
        if (start > end) { response.writeHead(416, { 'content-range': `bytes */${body.length}` }).end(); return; }
        response.writeHead(206, { ...headers, 'content-length': end - start + 1, 'content-range': `bytes ${start}-${end}/${body.length}` }).end(body.subarray(start, end + 1));
      } else response.writeHead(200, headers).end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(done => server.close(done));
});

test('every polished route is stationary with ordinary motion preferences', async () => {
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  try {
    const page = await context.newPage();
    for (const path of routes) {
      await page.goto(base + path);
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto', path);
    }
  } finally { await context.close(); }
});

test('all page families fit mobile with 44px standalone targets and naturally inline prose links', async () => {
  const failures = [];
  for (const width of [360, 390, 430, 768, 1000, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    try {
      const page = await context.newPage();
      for (const path of routes) {
        await page.goto(base + path);
        await page.evaluate(() => document.fonts.ready);
        const result = await page.evaluate(measureTargets);
        if (result.scrollWidth > width || result.outside.length || result.nonInlineTextLinks.length || (width <= 430 && result.smallTargets.length)) failures.push({ path, width, ...result });
      }
    } finally { await context.close(); }
  }
  assert.deepEqual(failures, []);
});

test('privacy policy links wrap within evenly led mobile prose', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(base + '/privacy/');
    await page.evaluate(() => document.fonts.ready);
    const policy = page.locator('.article a[href="https://developers.google.com/terms/api-services-user-data-policy"]');
    assert.equal(await policy.evaluate(element => getComputedStyle(element).display), 'inline');
    const lines = await policy.evaluate(element => {
      const paragraph = element.closest('p');
      const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
      const tops = new Set();
      while (walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        for (const rect of range.getClientRects()) if (rect.width) tops.add(rect.top);
      }
      return { tops: [...tops].sort((a, b) => a - b), leading: parseFloat(getComputedStyle(paragraph).lineHeight), fragments: element.getClientRects().length };
    });
    assert.ok(lines.fragments > 1, 'the policy name shares surrounding lines instead of moving as one box');
    assert.ok(lines.tops.slice(1).every((top, index) => Math.abs(top - lines.tops[index] - lines.leading) < 1), JSON.stringify(lines));
  } finally { await context.close(); }
});

test('keyboard focus stays visible on the dark engagement and the light composer', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(base + '/');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('class'), 'skip');
    await page.keyboard.press('Enter');
    assert.equal(new URL(page.url()).hash, '#work');
    await page.locator('#brief-composer summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#brief-composer').getAttribute('open'), '');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('name'), 'repeated-workflow');
    const focus = await page.locator(':focus').evaluate(e => {
      const s = getComputedStyle(e); return { color: s.outlineColor, style: s.outlineStyle, width: s.outlineWidth };
    });
    assert.deepEqual(focus, { color: 'rgb(18, 19, 22)', style: 'solid', width: '2px' });
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.getByLabel('The recurring work', { exact: true }).fill('X'.repeat(800));
      const metrics = await page.evaluate(measureTargets);
      assert.equal(metrics.scrollWidth, width);
      assert.deepEqual(metrics.smallTargets, []);
      assert.deepEqual(metrics.nonInlineTextLinks, []);
    }
  } finally { await context.close(); }
});

test('report engagement label remains readable on hover and press', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  try {
    const page = await context.newPage();
    await page.goto(base + '/field-reports/insurance-client-care/');
    const button = page.locator('.next .button');
    await button.hover();
    const colors = () => button.evaluate(e => { const s = getComputedStyle(e); return { text: s.color, background: s.backgroundColor }; });
    assert.deepEqual(await colors(), { text: 'rgb(18, 19, 22)', background: 'rgb(242, 238, 230)' });
    await page.mouse.down();
    try { assert.deepEqual(await colors(), { text: 'rgb(242, 238, 230)', background: 'rgb(18, 19, 22)' }); }
    finally { await page.mouse.move(0, 0); await page.mouse.up(); }
  } finally { await context.close(); }
});

test('Baton Rouge recording and native questions still work without sending anything', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(base + '/baton-rouge/');
    await page.getByRole('button', { name: 'Play the test call' }).click();
    await page.waitForFunction(() => !document.querySelector('audio').paused && document.querySelector('audio').readyState >= 2);
    await page.getByRole('button', { name: 'Pause the test call' }).click();
    assert.ok(await page.locator('audio').evaluate(e => e.paused));
    await page.getByRole('slider', { name: 'Seek' }).focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('audio').currentTime >= 1 && !document.querySelector('audio').seeking, null, { timeout: 3000 });
    assert.ok(await page.locator('audio').evaluate(e => e.currentTime > 0));
    const question = page.locator('.faq details').nth(1);
    await question.locator('summary').click();
    assert.ok(await question.locator('p').isVisible());
  } finally { await context.close(); }
});

```

## Relevant actual public HTML (matching source lines only)

### index.html
```html
25: <a class="skip" href="#work">Skip to the work</a>
27: <a class="brand" href="/" aria-label="Deploy Axiom, home"><img src="/assets/wordmark-ink.svg" alt="AXIOM" width="140" height="41"></a>
28: <nav aria-label="Main"><a href="#work">Work</a><a href="#limits">Limits</a><a href="#method">Method</a><a href="#notes">Notes</a><a class="nav-cta" href="#contact">Start an engagement</a></nav>
36: <div class="actions"><a class="button" href="#contact">Start an engagement</a><a class="button ghost" href="tel:+12256358671">Call (225) 635-8671</a></div>
38: <figure class="document-plate"><a href="/assets/field-reports/check-log.png"><img src="/assets/field-reports/check-log.png" alt="A page from a client-care check log, recorded during the test run the evening before go-live. Each row shows one message step and what the checks decided: waiting, held, awaiting the owner's yes, approved, sent, not resent, or skipped, with the reason recorded. Contact details and IDs are blacked out." width="2400" height="1800" fetchpriority="high"></a><figcaption>Example record. Client details removed.</figcaption></figure>
41: <div class="proof-cell"><span class="proof-number">Oct 29</span><p>Live since. Client care for an independent insurance agency, three clients enrolled.</p><a href="/field-reports/insurance-client-care/">Read the field report</a></div>
42: <div class="proof-cell"><span class="proof-number">4 min</span><p>A client's stuck agent, from ticket to fixed, with a rule added so it handles it alone next time.</p><a href="#work">See the work</a></div>
43: <div class="proof-cell"><span class="proof-number">96</span><p>Failures caught and recovered in our own operation, not hidden. 231 outcomes on record, 155 independently verified.</p><a href="#work">See the work</a></div>
48: <article class="story-card"><h3>AN INDEPENDENT INSURANCE AGENCY</h3><p>After a policy issues, her client is scheduled to hear from her at set points through the first year. A script checks every message before it sends, and referral asks wait for her yes.</p><p class="story-metric">Live since Oct 29 · 3 clients enrolled</p><a href="/field-reports/insurance-client-care/">Read the field report</a></article>
50: <article class="story-card"><h3>WHEN A CLIENT'S AGENT GETS STUCK</h3><p>A client's agent held a launch post while she was on a video call. The escalation desk opened one ticket at 6:35 PM and closed it at 6:39 PM: one reply telling her what to click after the call, and a rule added so her agent handles it alone next time. It did not reopen the window, because it might have appeared on her screen share.</p><p class="story-metric">4 minutes · 1 reply · 1 rule added</p><a href="https://github.com/percyhendrux123-prog/escalation-desk">See the public code</a></article>
69: <div class="founder-copy"><p class="founder-name">P. K. Stewart, founder, Deploy Axiom · Baton Rouge, Louisiana</p><p>He designs each system, writes its limits, and approves every new permission it gets.</p><p>He runs two companies of his own the same way: about a dozen specialist AI agents behind one front door, and no job closed without evidence.</p><p>Write to him directly at <a href="mailto:percy@deployaxiom.com">percy@deployaxiom.com</a>.</p><p><a href="https://www.linkedin.com/in/percy-keith-2380b1403">LinkedIn</a> · <a href="https://github.com/percyhendrux123-prog">GitHub</a></p></div>
74: <li><a href="/notes/one-tempo/"><span class="note-n">FR 01</span><span class="note-t">One Tempo.</span><span class="note-d">An independent reviewer found four safety defects that our own tests had passed.</span></a></li>
75: <li><a href="/notes/the-gap-is-the-user/"><span class="note-n">E 04</span><span class="note-t">The Gap Is the User.</span><span class="note-d">Before any helper went live, we wrote down what a pass meant. All seven tests passed, two with notes, and one limit is still a written rule, so it stays on watch.</span></a></li>
76: <li><a href="/notes/one-front-door/"><span class="note-n">01</span><span class="note-t">One Front Door.</span><span class="note-d">When an agent says "done", nothing closes. A job closes only after it is checked against the file, the page or the message record.</span></a></li>
77: </ol><p class="notes-all"><a href="/notes/">All notes</a></p>
88: <div class="actions"><button type="button" class="button" id="copy-brief">Copy brief</button><a class="button ghost" href="mailto:percy@deployaxiom.com?subject=Brief">Email the brief</a><span class="status" id="copy-status" aria-live="polite"></span></div></div>
96: <p>Copy this template, then email it to <a href="mailto:percy@deployaxiom.com?subject=Brief">percy@deployaxiom.com</a>.</p></div>
98: </div></details><a class="button ghost contact-call" href="tel:+12256358671">Call (225) 635-8671</a></div>
101: <footer class="footer"><div class="frame footer-row"><img src="/assets/wordmark-stone.svg" alt="AXIOM" width="120" height="35"><p>Deploy Axiom · Baton Rouge, Louisiana</p><p class="footer-links"><a href="mailto:percy@deployaxiom.com">percy@deployaxiom.com</a> · <a href="tel:+12256358671">(225) 635-8671</a> · <a href="https://www.instagram.com/deployaxiom/">Instagram</a> · <a href="https://github.com/percyhendrux123-prog">GitHub</a> · <a href="/notes/">Notes</a> · <a href="/baton-rouge/">Baton Rouge</a> · <a href="/archive/two-business-evaluation-2026-09/">Archive</a> · <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p></div></footer>
```

### privacy/index.html
```html
15:       <a class="brand" href="/" aria-label="Deploy Axiom, home"><img src="/assets/wordmark-ink.svg" alt="AXIOM" width="140" height="41"></a>
17:         <a href="/#work">Engagements</a>
18:         <a href="/#notes">Notes</a>
19:         <a class="nav-cta" href="/#contact">Contact</a>
40:       <p>Axiom operates its own internal agent that connects to Google accounts we control, with the account owner’s permission, to read and organize email, calendar events and files. This data is used only to operate our business and serve our clients. It is not sold, not used for advertising and not used to train AI models. Axiom’s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements. You can revoke access at any time at <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>.</p>
46:       <p>You can ask us to access, correct or delete your personal information, or to stop contacting you, by emailing <a href="mailto:percy@deployaxiom.com">percy@deployaxiom.com</a>. We will respond within 30 days.</p>
52:       <p>Deploy Axiom, Baton Rouge, Louisiana. <a href="mailto:percy@deployaxiom.com">percy@deployaxiom.com</a>.</p>
59:       <p class="footer-links"><a href="mailto:percy@deployaxiom.com">percy@deployaxiom.com</a> · <a href="tel:+12256358671">(225) 635-8671</a> · <a href="https://www.instagram.com/deployaxiom/">Instagram</a> · <a href="/">Home</a> · <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p>
```

### terms/index.html
```html
15:       <a class="brand" href="/" aria-label="Deploy Axiom, home"><img src="/assets/wordmark-ink.svg" alt="AXIOM" width="140" height="41"></a>
17:         <a href="/#work">Engagements</a>
18:         <a href="/#notes">Notes</a>
19:         <a class="nav-cta" href="/#contact">Contact</a>
53:       <p>Deploy Axiom, Baton Rouge, Louisiana. <a href="mailto:percy@deployaxiom.com">percy@deployaxiom.com</a>.</p>
60:       <p class="footer-links"><a href="mailto:percy@deployaxiom.com">percy@deployaxiom.com</a> · <a href="tel:+12256358671">(225) 635-8671</a> · <a href="https://www.instagram.com/deployaxiom/">Instagram</a> · <a href="/">Home</a> · <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p>
```

### baton-rouge/index.html
```html
34:   <a class="skip" href="#how">Skip to how it works</a>
38:       <a class="brand" href="/" aria-label="Deploy Axiom, home"><img src="/assets/wordmark-ink.svg" alt="AXIOM" width="140" height="41"></a>
40:         <a href="#how">How it works</a>
41:         <a href="#listen">Hear a call</a>
42:         <a href="#questions">Questions</a>
43:         <a class="nav-cta" href="tel:+12256358671">Call the line</a>
57:             <a class="button" href="tel:+12256358671">Call (225) 635-8671</a>
58:             <a class="button ghost" href="mailto:percy@deployaxiom.com?subject=Baton%20Rouge%20receptionist">Email Percy</a>
63:           <a class="plate-number" href="tel:+12256358671">(225)<br>635&#8209;8671</a>
127:           <audio controls preload="none" src="/assets/sales-line-test-call.m4a">Your browser can't play this audio. <a href="/assets/sales-line-test-call.m4a">Download the call</a>.</audio>
128:           <p class="fine">Test call, not a customer. Or skip the recording and call <a href="tel:+12256358671">(225) 635-8671</a> yourself.</p>
153:         <a class="closing-number" href="tel:+12256358671">(225) 635-8671</a>
154:         <p class="closing-alt">Or write to <a href="mailto:percy@deployaxiom.com?subject=Baton%20Rouge%20receptionist">percy@deployaxiom.com</a></p>
163:       <p class="footer-links"><a href="mailto:percy@deployaxiom.com">percy@deployaxiom.com</a> · <a href="tel:+12256358671">(225) 635-8671</a> · <a href="https://www.instagram.com/deployaxiom/">Instagram</a> · <a href="/">Home</a></p>
```

### field-reports/insurance-client-care/index.html
```html
25:   <a class="skip" href="#report">Skip to the work</a>
28:       <a class="brand" href="/" aria-label="Deploy Axiom, home"><img src="/assets/wordmark-ink.svg" alt="AXIOM" width="140" height="41"></a>
29:       <nav aria-label="Main"><a href="/#work">Work</a><a href="/#limits">Limits</a><a href="/#method">Method</a><a href="/notes/">Notes</a><a class="nav-cta" href="/#contact">Start an engagement</a></nav>
42:       <figure class="document-plate"><a href="/assets/field-reports/check-log.png"><img src="/assets/field-reports/check-log.png" alt="A page from a client-care check log, recorded during the test run the evening before go-live. Each row shows one message step and what the checks decided: waiting, held, awaiting the owner's yes, approved, sent, not resent, or skipped, with the reason recorded. Contact details and IDs are blacked out." width="2400" height="1800"></a><figcaption>Example record. Client details removed.</figcaption></figure>
68:         <div class="next"><p>If there is work in your business that depends on you remembering it, that is where we start.</p><a class="button" href="/#contact">Start an engagement</a><br><a href="/notes/">All notes</a></div>
72:   <footer class="footer"><div class="frame footer-row"><img src="/assets/wordmark-stone.svg" alt="AXIOM" width="120" height="35"><p>Deploy Axiom · Baton Rouge, Louisiana</p><p class="footer-links"><a href="mailto:percy@deployaxiom.com">percy@deployaxiom.com</a> · <a href="tel:+12256358671">(225) 635-8671</a> · <a href="https://www.instagram.com/deployaxiom/">Instagram</a> · <a href="https://github.com/percyhendrux123-prog">GitHub</a> · <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p></div></footer>
```

### notes/one-tempo/index.html
```html
26:       <a class="brand" href="/" aria-label="Deploy Axiom, home"><img src="/assets/wordmark-ink.svg" alt="AXIOM" width="140" height="41"></a>
28:         <a href="/#work">Engagements</a>
29:         <a href="/notes/">Notes</a>
30:         <a class="nav-cta" href="/#contact">Contact</a>
234:       <div class="next">Related: <a href="/notes/one-front-door/"><strong>One Front Door.</strong></a> Why every request goes through one agent.</div>
241:       <p class="footer-links"><a href="mailto:percy@deployaxiom.com">percy@deployaxiom.com</a> · <a href="tel:+12256358671">(225) 635-8671</a> · <a href="https://www.instagram.com/deployaxiom/">Instagram</a> · <a href="/">Home</a> · <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p>
```

### notes/the-outcome/index.html
```html
26:       <a class="brand" href="/" aria-label="Deploy Axiom, home"><img src="/assets/wordmark-ink.svg" alt="AXIOM" width="140" height="41"></a>
28:         <a href="/#work">Engagements</a>
29:         <a href="/notes/">Notes</a>
30:         <a class="nav-cta" href="/#contact">Contact</a>
49:       <div class="next">Related: <a href="/notes/the-gathering/"><strong>A2A: The Gathering.</strong></a> The question this essay answers.</div>
56:       <p class="footer-links"><a href="mailto:percy@deployaxiom.com">percy@deployaxiom.com</a> · <a href="tel:+12256358671">(225) 635-8671</a> · <a href="https://www.instagram.com/deployaxiom/">Instagram</a> · <a href="/">Home</a> · <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p>
```

### notes/the-gathering/index.html
```html
26:       <a class="brand" href="/" aria-label="Deploy Axiom, home"><img src="/assets/wordmark-ink.svg" alt="AXIOM" width="140" height="41"></a>
28:         <a href="/#work">Engagements</a>
29:         <a href="/notes/">Notes</a>
30:         <a class="nav-cta" href="/#contact">Contact</a>
48:       <div class="next">Related: <a href="/notes/the-outcome/"><strong>The Outcome.</strong></a> The first essay asks the question. This one answers it.</div>
55:       <p class="footer-links"><a href="mailto:percy@deployaxiom.com">percy@deployaxiom.com</a> · <a href="tel:+12256358671">(225) 635-8671</a> · <a href="https://www.instagram.com/deployaxiom/">Instagram</a> · <a href="/">Home</a> · <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p>
```

### notes/the-gap-is-the-user/index.html
```html
26:       <a class="brand" href="/" aria-label="Deploy Axiom, home"><img src="/assets/wordmark-ink.svg" alt="AXIOM" width="140" height="41"></a>
28:         <a href="/#work">Engagements</a>
29:         <a href="/notes/">Notes</a>
30:         <a class="nav-cta" href="/#contact">Contact</a>
58:       <div class="next">Related: <a href="/notes/the-outcome/"><strong>The Outcome.</strong></a> The rule you run on yourself, the discipline this essay ends on.</div>
65:       <p class="footer-links"><a href="mailto:percy@deployaxiom.com">percy@deployaxiom.com</a> · <a href="tel:+12256358671">(225) 635-8671</a> · <a href="https://www.instagram.com/deployaxiom/">Instagram</a> · <a href="/">Home</a> · <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p>
```

### notes/left-foot-right-foot/index.html
```html
26:       <a class="brand" href="/" aria-label="Deploy Axiom, home"><img src="/assets/wordmark-ink.svg" alt="AXIOM" width="140" height="41"></a>
28:         <a href="/#work">Engagements</a>
29:         <a href="/notes/">Notes</a>
30:         <a class="nav-cta" href="/#contact">Contact</a>
66:       <div class="next">Related: <a href="/notes/one-front-door/"><strong>One Front Door.</strong></a> Why every request goes through one agent.</div>
73:       <p class="footer-links"><a href="mailto:percy@deployaxiom.com">percy@deployaxiom.com</a> · <a href="tel:+12256358671">(225) 635-8671</a> · <a href="https://www.instagram.com/deployaxiom/">Instagram</a> · <a href="/">Home</a> · <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p>
```

### success.html
```html
15:     <p><a href="/">Back to Deploy Axiom</a></p>
```

## Existing CSS relevant to the cascade (final source)
```css
.article .abstract{font-style:italic;color:var(--muted)}
.article hr.rule{border:0;border-top:1px solid var(--rule);margin:48px 0}
.article h3{font:700 17px/1.4 var(--display);letter-spacing:.03em;margin:36px 0 10px}
.article code{font:15px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;background:#FBF9F5;padding:1px 4px;border:1px solid var(--rule)}
.article pre{background:#FBF9F5;border:1px solid var(--rule);padding:18px 20px;overflow-x:auto;margin:24px 0}
.article pre code{border:0;padding:0;background:none;font-size:13.5px;line-height:1.55}
.article table{width:100%;border-collapse:collapse;font-size:15px;margin:24px 0;border-top:3px solid var(--ink)}
.article th,.article td{text-align:left;vertical-align:top;padding:10px 12px 10px 0;border-bottom:1px solid var(--rule)}
.article th{font:600 12px/1.5 var(--display);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.article .next a{color:var(--ink)}
@media (max-width:640px){.article table{display:block;overflow-x:auto}}
a{color:inherit}
nav a{text-decoration:none;color:var(--muted);padding:8px 0}
nav a:hover{color:var(--ink)}
nav .nav-cta{color:var(--ink);border:1px solid var(--ink);padding:11px 16px}
nav .nav-cta:hover{background:var(--ink);color:var(--stone)}
.button{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 26px;background:var(--ink);color:var(--stone);border:1px solid var(--ink);font:700 12px/1 var(--display);letter-spacing:.18em;text-transform:uppercase;text-decoration:none;cursor:pointer;border-radius:0}
.button:hover{background:var(--navy);border-color:var(--navy)}
.button.ghost{background:transparent;color:var(--ink)}
.button.ghost:hover{background:var(--ink);color:var(--stone)}
.button:focus-visible,nav a:focus-visible,input:focus-visible,textarea:focus-visible,.notes-list a:focus-visible{outline:2px solid var(--brass);outline-offset:3px}
.ledger .who a{color:inherit;text-decoration:underline;text-underline-offset:4px}
.notes-list a:hover .note-t{text-decoration:underline;text-underline-offset:5px;text-decoration-thickness:1px}
input,textarea{font:17px/1.5 var(--serif);color:var(--ink);background:#FBF9F5;border:1px solid #B9B09F;border-radius:0;padding:14px 16px;min-height:52px;width:100%}
textarea{min-height:96px;resize:vertical}
.fallback{margin-top:40px;padding:24px;border:1px solid var(--rule);background:var(--stone-2)}
.fallback strong{font:700 12px/1 var(--display);letter-spacing:.18em;text-transform:uppercase}
.fallback pre{font:15px/1.6 ui-monospace,Menlo,monospace;margin:14px 0;white-space:pre-wrap}
.fallback p{margin:0;font-size:15px}
.footer-links a{color:var(--stone)}
.article .kicker{text-align:left}
.article h1{max-width:none;font-size:clamp(34px,5vw,52px);text-align:left}
.article .dek{font-style:italic;color:var(--muted);font-size:20px;margin:18px 0 0}
.article .byline{font-size:14px;color:var(--muted);margin:22px 0 0;padding-bottom:28px}
.article .entablature{margin:0 0 40px;width:120px}
.article h2{font-size:22px;margin:52px 0 12px}
.article p,.article li{color:#25282D}
.article ol,.article ul{padding-left:22px}
.article li{margin-bottom:8px}
.article figure{margin:44px -40px;padding:30px 24px 20px;background:#FBF9F5;border:1px solid var(--rule)}
.article figure img{width:100%;height:auto}
.article figcaption{font-size:14px;color:var(--muted);margin-top:16px}
.article .next{border-top:3px solid var(--ink);margin-top:56px;padding-top:20px;font-size:16px}
.recording{border-top:3px solid var(--ink);border-bottom:1px solid var(--ink);padding:28px 0 24px}
.recording audio{width:100%}
.recording .fine{margin-top:20px}
.closing-alt{margin:34px 0 0;font-size:15px;color:#B9B3A7}
.closing-alt a{color:var(--stone)}
  .article figure{margin:36px 0}
  nav a:not(.nav-cta){display:none}
  .button{width:100%;min-height:52px}
.notes-all{margin:22px 0 0;font:600 14px/1 var(--display);letter-spacing:.12em;text-transform:uppercase}
.notes-all a{color:var(--ink)}
.remake nav .nav-cta{display:inline-flex;align-items:center;min-height:46px}
.remake .button{font-size:11px;letter-spacing:.12em;padding:14px 20px;line-height:1.45;text-align:center}
.remake .document-plate a{display:block}
.remake .proof-cell a{margin-top:auto;font-size:15px;text-underline-offset:5px;min-height:46px;display:flex;align-items:center}
.remake .story-card a{display:inline-flex;align-items:center;min-height:46px;font-size:16px;text-underline-offset:5px}
.remake .founder-grid{display:grid;grid-template-columns:1fr 2fr;gap:56px}
.remake .founder-copy{max-width:40em}
.remake .founder-copy p:first-child{margin-top:0}
.remake .founder-name{font:600 20px/1.5 var(--display)}
.remake .founder-photo{display:block;width:100%;max-width:360px;height:auto;margin-top:32px;filter:grayscale(1)}
.remake .fallback pre,.remake .footer-links{overflow-wrap:anywhere}
.remake .report .next .button{color:var(--stone);margin-bottom:16px}
  .remake nav .nav-cta{font-size:10px;letter-spacing:.07em;padding:15px 10px;line-height:1.3}
  .remake .founder-grid{grid-template-columns:1fr;gap:0}
  .remake .founder-photo{max-width:280px;margin:20px 0 28px}
  .remake .fallback{padding:18px}
  .remake .fallback pre{font-size:13px}
  .remake .notes-list a{grid-template-columns:52px minmax(0,1fr);gap:10px 16px}
a{text-underline-offset:.22em;text-decoration-thickness:1px}
nav a{display:inline-flex;align-items:center;min-height:46px;padding:10px 0}
nav .nav-cta,.remake nav .nav-cta{min-height:46px;line-height:1.4;padding:12px 16px;white-space:nowrap}
nav a:focus-visible{outline-color:var(--ink)}
.button,.remake .button{min-height:52px;line-height:1.5;letter-spacing:.11em;padding:14px 22px}
.button:hover{background:var(--stone);color:var(--ink);border-color:var(--ink)}
.button:active{background:var(--ink);color:var(--stone)}
.button.ghost:hover,.button.ghost:active{background:var(--ink);color:var(--stone)}
.remake .proof-cell a{min-height:46px;align-self:flex-start}
.remake .story-card a{align-self:flex-start}
.remake .founder-grid{grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:64px;align-items:start}
.remake .founder-grid .heading{margin-bottom:0}
.remake .founder-photo{max-width:320px;margin-top:28px;border-bottom:3px solid var(--ink);padding-bottom:12px}
.remake .founder-copy{max-width:36em;padding-top:53px}
.remake .founder-name{font-size:21px;font-weight:600;line-height:1.5;max-width:26em;text-wrap:balance}
.remake .founder-copy p{margin-bottom:22px}
.notes-all{margin-top:24px;line-height:1.5}
.notes-all a{display:inline-flex;align-items:center;min-height:46px}
input,textarea{background:var(--stone);border-color:var(--muted);line-height:1.6}
input::placeholder,textarea::placeholder{color:var(--muted);opacity:1}
.mapper textarea{min-height:112px}
.fallback{padding:24px;background:var(--stone);border-color:var(--muted)}
.fallback pre{overflow-wrap:anywhere}
.footer-links{overflow-wrap:anywhere;line-height:2.7}
.footer-links a{display:inline-flex;align-items:center;min-height:44px;min-width:44px;max-width:100%;vertical-align:middle;overflow-wrap:anywhere}
.article .kicker{font-size:11px;margin-bottom:24px}
.article h1{font-size:clamp(32px,3.6vw,48px);font-weight:600;line-height:1.22;letter-spacing:0}
.article .dek{font-size:21px;line-height:1.65;margin-top:24px}
.article .byline{line-height:1.65;margin:24px 0 0;padding-bottom:28px}
.article .entablature{margin-bottom:36px}
.article p,.article li{color:var(--ink)}
.article p{margin:0 0 22px}
.article h2{font-size:25px;font-weight:600;line-height:1.35;letter-spacing:.01em;margin:44px 0 16px}
.article h3{font-weight:600;line-height:1.5;margin:32px 0 14px}
.article :is(h2,h3){break-after:avoid}
.article li{margin-bottom:10px;padding-left:4px}
.article figure{margin:40px -40px;padding:24px 24px 20px;background:var(--stone);border-color:var(--rule)}
.article figcaption{line-height:1.6;margin-top:18px;overflow-wrap:anywhere}
.article pre{padding:20px;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--stone)}
.article pre code{font-size:13px;line-height:1.65;white-space:inherit;overflow-wrap:inherit}
.article code{background:var(--stone);overflow-wrap:anywhere}
.article table{font-size:16px;line-height:1.65}
.article th{color:var(--ink);letter-spacing:.06em}
.article .next{margin-top:48px;padding-top:24px;line-height:1.7}
.article .next p{margin-bottom:24px}
.article .next>a:not(:has(strong)){display:inline-flex;align-items:center;min-height:44px}
.remake .report .next .button:hover{color:var(--ink)}
.remake .report .next .button:active{background:var(--ink);color:var(--stone)}
.notice .closed{color:var(--muted);font:600 12px/1.6 var(--display);letter-spacing:.16em;border-bottom:1px solid var(--brass);padding-bottom:16px;margin-bottom:28px}
.notice h1{font-size:clamp(32px,4vw,48px);font-weight:600;text-align:left;margin:0 0 28px;max-width:none}
.notice a{display:inline-flex;align-items:center;min-height:46px;border-top:3px solid var(--ink);padding-top:16px;margin-top:24px}
  .footer-links{grid-column:2}
  .remake .story-card p,.remake .story-card a{grid-column:2}
  .article figure{margin-inline:0}
  nav a:not(.nav-cta){display:none}
  nav .nav-cta,.remake nav .nav-cta{font-size:10px;letter-spacing:.06em;padding:13px 12px}
  .remake .founder-grid{grid-template-columns:1fr;gap:28px}
  .remake .founder-photo{max-width:280px;margin:24px 0 0}
  .remake .founder-copy{padding-top:0}
  .remake .founder-name{font-size:20px}
  .notes-list a,.notes-list li.pending,.remake .notes-list a{grid-template-columns:48px minmax(0,1fr);gap:10px 16px;padding:24px 0}
  .remake .fallback{padding:18px}
  .button,.remake .button{width:100%}
  .footer-links{grid-column:auto;line-height:2.9}
  .article .kicker{font-size:10px;margin-bottom:20px}
  .article h1,.remake .report h1{font-size:32px;line-height:1.24;text-wrap:pretty}
  .article .dek{font-size:20px;margin-top:20px}
  .article .byline{font-size:14px;margin-top:20px;padding-bottom:24px}
  .article h2{font-size:23px;margin-top:36px}
  .article figure{padding:16px;margin:32px 0}
  .article figcaption{font-size:14px;line-height:1.6}
  .article pre{padding:16px}
  .article table{display:table;font-size:14px;table-layout:fixed;overflow-wrap:anywhere}
  .article th,.article td{padding:12px 8px 12px 0}
  .article th{font-size:10px;letter-spacing:.02em}
  .article a:not(.button),.founder-copy a,.closing-alt a,.recording .fine a,.fallback a{overflow-wrap:anywhere}
  .founder-copy p:last-child a{display:inline-flex;align-items:center;min-height:44px;min-width:44px}
```

## Tight regression red / green
✖ privacy policy links wrap within evenly led mobile prose (396.946208ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 579.814791

✖ failing tests:

test at tests/browser/polish.test.mjs:66:1
✖ privacy policy links wrap within evenly led mobile prose (396.946208ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  
  + 'inline-flex'
  - 'inline'
           ^
  
      at TestContext.<anonymous> (file:///Users/percykeith/axiom/worktrees/polish-2026-10-31/tests/browser/polish.test.mjs:73:12)
      at runNextTicks (node:internal/process/task_queues:65:5)
      at process.processImmediate (node:internal/timers:541:9)
      at async Test.run (node:internal/test_runner/test:1409:7)
      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:387:3) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 'inline-flex',
    expected: 'inline',
    operator: 'strictEqual',
    diff: 'simple'
  }

✔ privacy policy links wrap within evenly led mobile prose (123.14725ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 289.17475
