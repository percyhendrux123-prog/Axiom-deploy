# A300 · Safari scroll jump handoff

## STATUS: unshipped / branch only

Repo: `/home/cua/repos/Axiom-deploy`. Branch: `design/a300-safari-jump`, created from approved A298 R2 `57dfe87bf337e1b67212830acef9724541fa453e` with a clean tree. Implementation head: `ea07b25f95bcda0f04bfd02c35c82334c320f27c`; a following documentation/evidence-only commit packages this handoff.

No push, deploy (including preview), merge, credentials, spend or live-data change. Public draft remains the original A298 R2 reference, not this patch. Repo/parent AGENTS.md and CLAUDE.md were absent; A298-R2-HANDOFF.md was read before editing. Production audit: no authorized release; npm audit remains clean. The scratch host workspace is not mounted in the Space; all work stayed in the card-authorized repo.

## CHANGED

1. **Reserve the caduceus's final 18-line slot from first paint:** `block-size:18em` with the existing `line-height:1`, unchanged 34px desktop / proportional mobile font sizing. This prevents the slot from transiently collapsing while text frames are replaced. No new overflow clipping, art reduction, scaling change, drawing algorithm, animation clock or loop.
2. **Settle terminal layout during initial successful enhancement, not lazy first draw:** the existing text alternative is visually hidden only when both native interactivity and a successfully initialized ROT engine are present. A `has-terminal-engine` class is added after display/canvas initialization. Missing scripts and no-JS retain the visible fallback; enhanced mode retains AT text. `has-terminal` still controls visual button replacement only after the canvas is actually drawn.
3. **Regressions and cache keys:** real browser tests for lazy initialization/entrance heights, the empty-text-frame seam, first-render frame stability, script failures/keyboard fallback and small-step scrolls. CSS v10 and engine v2 bust old cache entries. Existing content tests normalize only that exact engine query; expected content/art hashes were not replaced.

Commits:
- `0d7d886` — terminal fallback/layout fix, including the engine-readiness guard found in review.
- `ea07b25` — fixed caduceus slot and real-browser regressions.
- Following docs/evidence-only commit — this packet and review findings.

## VERIFIED EVIDENCE

### Original-code reproduction and final result

The before tests serve original CSS and chain engine taken directly from `git show 57dfe87:<path>` in the static build. The same test harness runs before and after. All steps record actual `scrollY`, #system viewport/document top and component heights.

| Measurement | Before | After |
|---|---:|---:|
| Natural WebKit 1440 scroll, requested step | 50px | 50px |
| Largest actual step in reproduced jump | **662px** (+612px unintended) | **50px** |
| Original-code repeat repro frequency, desktop | 2/8 runs show +612px | 0/8 runs |
| Mobile repeat scroll discontinuities | Not observed; terminal height collapse still reproduced | 0/8 runs |
| Total final repeat coverage | — | 16 scenarios / 880 steps, zero increment error or #system drift |
| Empty caduceus text-frame slot, 1440 | 0px | 612px |
| Empty caduceus text-frame slot, 390 | 0px | 189px |
| Terminal first-draw frame collapse, 1440 | 66.875px | 0px |
| Terminal first-draw frame collapse, 390 | 174.0625px | 0px |
| Chromium delayed-draw layout-shift sum, 1440 | 0.013504002700617286 | 0 |
| Chromium delayed-draw layout-shift sum, 390 | 0.09145600801282051 | 0 |

Exact original-code jump traces: `base-repro-1-webkit-1440-scroll.json` and `base-repro-3-webkit-1440-scroll.json`, step index 29. Example: previousY 1945, requested +50, actual scrollY 2607. Sampled document bounds remain unchanged. Transient text-frame sizing/scroll anchoring is the inferred mechanism; the engine's internal anchor algorithm was not instrumented. The deterministic empty-frame test and isolated height-reservation experiment support the fix without depending on Safari `overflow-anchor` support.

WebKit does **not** expose the Layout Instability API in this environment. Its evidence is actual scroll/geometry, not a claim of zero WebKit CLS. Chromium uses a feature-detected PerformanceObserver and sums every entry, including recent-input entries. All four final normal gate→system runs report zero Chromium shifts where supported, no component-height drift and no #system document-top drift.

### Preserved geometry / behavior

At both engines' acceptance widths:
- Caduceus: **1095.703125×612** desktop; **338.390625×189** mobile, unchanged settled dimensions. Full wings, staff/snakes and centering remain visible.
- Board: **1026×451.4375** desktop; **324×594.296875** mobile, unchanged before/after renderer.
- Final enhanced frame: **796.875px / 1058.96875px**, equal to the previous settled design.
- Caduceus JS, reference HTML art, home.js/conductor and vendored code are unchanged. SHA/content locks still pass.
- Full R2 tests cover entrance/settling, reduced motion, offscreen/hidden sleeping, one canvas, DPR sharpness, seven external arrows, keyboard/panel selection, walkthrough/cancel/replay and visible background.

Final execution:
- `npm test`: **58/58 pass**.
- `SCREENSHOT_DIR=qa/a300/regression npm run test:browser -- --test-concurrency=1`: **71/71 pass**, 247158.741001ms.
- `SCROLL_BROWSERS=chromium,webkit WEBKIT_EXECUTABLE="$PWD/qa/a300/webkit-local.sh" SCROLL_LABEL=after SCREENSHOT_DIR=qa/a300 node --test --test-concurrency=1 tests/browser/scroll-stability.test.mjs`: **16/16 pass**.
- Eight additional WebKit runs at each width: **16/16 pass**.
- Exact `netlify.toml` `[build].command`: exit **0**, with vendor/license allowlist checks.
- `node --check` on changed production JS and browser test: pass. `git diff 57dfe87 --check`: pass.
- `npm run audit`: **0 vulnerabilities**.
- `npm run build`: **unavailable**, missing Netlify CLI, exit **127** (`env: ‘netlify’: No such file or directory`). Do not call the static command proof a full Netlify build.

### Browser setup

WebKit download succeeded; initial launch failed on missing GTK/GStreamer/etc libraries. Dependencies were downloaded/extracted into `qa/a300/webkit-deps` with workspace-local apt state/cache/log and **no sudo/system installation**. The task-local launcher supplies native library paths because upstream MiniBrowser's wrapper overwrites LD_LIBRARY_PATH. Chromium and WebKit launch/version/API evidence and the wrapper are included; native libraries/caches are deliberately not packaged.

## ARTIFACTS / ADVERSARIAL REVIEW

Downloadable packet: `docs/A300-EVIDENCE.zip`, with SHA-256 manifest and machine-readable summary. It contains before/after screenshots and raw traces, original-code repeat repros, final repeat traces, red/green/full-suite logs, static-build/audit/missing-CLI logs, wrapper and reviewer custom probe evidence. Tests/QA/dependency files are not in the public build allowlist.

Screenshots are real viewport captures with sticky navigation intact, not mockups. Terminal screenshots around the late-render probe intentionally show the lower board/details at the same document scroll position. Gate screenshots and final scroll screenshots at both widths were visually checked; no art clipping/reduction was observed.

Adversarial details: `docs/A300-ADVERSARIAL-REVIEW.md`. Native required profile command was attempted with the task brief and returned **127, hermes: command not found**. Two supplementary fresh-context read-only reviews were run: pass 1 found the missing-terminal fallback P2, reproduced and fixed with the engine guard; final pass found no concrete A300 defect and exercised all 71 browser tests plus cross-engine/custom checks. This is not a native codereview-profile verdict.

Worker-session Standing proof **standing:63 passed**, HTTP `https://deployaxiom.com`, expected `Deploy Axiom`. Scope: independent verification of the public reference page only, not of unshipped code. The draft URL was not owner-allowlisted and returned unavailable (standing:62), with no pass/demotion. Local execution/artifacts prove this branch.

## RISKS / ASSUMPTIONS

- Linux WebKit reproduced the scroll discontinuity and no longer exhibits it in the measured repeats. Physical macOS Safari, Apple Braille font rendering and VoiceOver are **not** certified by these tests.
- Native codereview-profile review and the full Netlify build remain host checks.
- Existing 320px catalog overflow (document width 323px) is unchanged, outside the acceptance widths and already a known baseline limitation. No scope expansion.
- No guarantee is inferred for arbitrary other browsers/network failures beyond the tested failure seams.

## APPROVAL NEEDED / NEXT

AXIOM: export the branch through the approved Space helper, verify the exact final commit, run native codereview and host `npm run build`, then inspect in real Safari. This is a review handoff, not a request to publish. Percy retains merge/deploy authority.

### Exact real-Safari check (host, local only)

1. After AXIOM exports the branch, select it in the host Axiom-deploy checkout; confirm the two implementation commits and final docs commit. Do not merge or deploy. Run `npm test` and `npm run build` on host.
2. Serve built output locally: `python3 -m http.server 8765 --bind 127.0.0.1 --directory dist`.
3. In a fresh Safari private window open `http://127.0.0.1:8765/`. Set Responsive Design Mode to **1440×1000**, normal motion. Reload at top. Scroll slowly from the caduceus down to “One front door. A visible chain.” with a trackpad, then repeat fresh reloads. Wings/entrance/breathing must remain intact; no snap forward at the section boundary.
4. Repeat at **390×1000** and with reduced motion. Test Run one order, Cancel, Escape, replay and node selection. Repeat with cache disabled to cover a cold gate load.
5. For machine-readable native scroll output, paste this into Safari Web Inspector after a fresh top reload at either viewport. It returns the same 55-step trace as the automated check. Every actualDelta should be 50; documentTop should remain constant. Save the returned rows for AXIOM, then perform the human trackpad check too.

```js
(async () => {
  await document.fonts.ready;
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const gate = document.querySelector('.gate');
  const system = document.querySelector('#system');
  scrollTo(0, gate.getBoundingClientRect().top + scrollY - 1100);
  await pause(100);
  const rows = [];
  for (let i = 0; i < 55; i++) {
    const previousY = scrollY;
    scrollBy(0, 50);
    await pause(80);
    const top = system.getBoundingClientRect().top;
    rows.push({i, previousY, scrollY, actualDelta:scrollY-previousY,
      systemTop:top, documentTop:top+scrollY,
      artHeight:document.querySelector('.caduceus').getBoundingClientRect().height,
      boardHeight:document.querySelector('.system__board').getBoundingClientRect().height});
  }
  console.table(rows);
  return rows;
})();
```

## SAFE ROLLBACK

No live rollback is necessary: nothing shipped. Local branch rollback / review base: **57dfe87bf337e1b67212830acef9724541fa453e**. Reverse `ea07b25` to isolate the caduceus reservation; reverse `0d7d886` for the separate terminal-layout change. Do not rewrite shared branches or touch the approved draft.
