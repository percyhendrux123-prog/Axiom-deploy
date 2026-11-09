# A300 rework · Mac Braille width/CLS handoff

## STATUS: unshipped / branch only

Repo: `/home/cua/repos/Axiom-deploy`. Branch: `design/a300-safari-jump`.
Implementation commit: **83fa07ef6b19d0f3dc595541859532585001b407** on prior A300 `4aac7d46ec8eed4e1c6987669424b68a1bfa407f`. A following documentation/evidence-only commit packages this handoff. This packet supplements/supersedes the font/CLS conclusions of `A300-HANDOFF.md`; the prior vertical-jump evidence remains there.

No push, deploy (including preview), merge, credentials, spend or live-data changes. No keyboard change: AXIOM retracted the Page Down finding because Hermes, not Safari, had focus. Repo/parent AGENTS.md and CLAUDE.md remain absent. The host scratch workspace is not mounted; work stayed in the card-authorized Space repo.

## CHANGED

- `.caduceus` reserves its **full available column width** (`inline-size:100%`), in addition to the existing 18-row height. Its inherited centered text places the same full-size 44-cell art within that stable slot. No font-size, line-height, overflow clipping, art, conductor, cursor or motion change.
- CSS cache key v10→v11.
- Added a **test-only, licensed, self-contained font-metric fixture**: DejaVu glyph subset with 1400/2048em braille advance and a 1em cursor. It is not Apple Braille or a visual facsimile, and is never shipped in public assets. This models the host's measured cursor/cell mismatch without copying proprietary Apple fonts. Optional regeneration script and license are included; fonttools is not a test/runtime dependency.
- Four additional cross-engine regressions cover the font mismatch, per-frame PRE width/left/height, before/after screenshots, cursor activation, 55 small scroll steps and exactly-zero Chromium layout shifts (including horizontal/recent-input entries). All previous 16 cases remain.
- Existing art-scale tests now measure the actual 44-cell glyph row, separately from its empty surrounding slot; original 2x/aspect/fit expectations remain unchanged. A new assertion checks the slot fills the column.

## VERIFIED EVIDENCE

### Reproduced before changing production CSS

AXIOM's real Mac observation on 4aac7d4: Chromium CLS **0.001645668643904321**, PRE width **1033.42→1022.67px**, failed 4/4. Linux's normal fallback font had hidden that mismatch.

The new test fixture goes red on the unchanged 4aac7d4 CSS. Exact same test/fixture then goes green with the width reservation:

| Measurement | Before | After |
|---|---:|---:|
| Chromium 1440 font-stress CLS | **0.0016795927372685185** | **0** |
| Chromium 1440 PRE width drift | 11px | 0px |
| WebKit 1440 PRE width drift | **10.765625px** (1022.65625…1033.421875) | **0px** |
| Chromium 390 PRE width drift | 4px | 0px |
| WebKit 390 PRE width drift | 3.328125px | 0px |
| Chromium 390 font-stress CLS | 0 (movement is below reporting threshold) | 0 |
| Both engines/widths: natural + metric scroll error | recorded per step | **0px** |
| Both engines/widths: #system document-top drift | recorded per step | **0px** |

Chromium source attribution names `PRE.caduceus is-live`. The live draw-in cursor, not different row counts, causes the mismatch: static/live grids are both 44×18; the cursor replaces one braille cell with a wider glyph. WebKit preserves fractional fixture metrics; Linux Chromium snaps advances (23px instead of the target 23.2421875px). Both explicitly verify the >10px desktop mismatch. All layout-geometry tolerances remain <0.02px; **CLS is still exactly zero**, not relaxed to vertical-only.

WebKit has no Layout Instability API here: its CLS field is **unsupported**, not a claimed zero. WebKit evidence is actual per-frame geometry and scrollY. Summary JSON represents unsupported CLS as null.

### Unchanged full-size art

Default Linux font's actual glyph-grid bounds remain **1095.703125×612px desktop**, **338.390625×189px mobile**. The containing PRE is now **1180×612px / 350×189px**. Art stays centered, full wings/staff/snakes visible, with no added cropping/scaling.

`assets/axioma/caduceus.js`, static reference art, `home.js`, and vendors are unchanged from approved A298 R2. Art SHA/content locks pass. Screenshots at desktop/mobile were visually inspected: no clipping, distortion or reduction observed.

Supplementary reviewer independently compared old/new CSS at 320, 390, 900, 901, 1024, 1440 and 1920 in Chromium/WebKit with both font stacks: **28 comparisons**, exact unchanged full-row width. Its **8 cursor controls + 12 resize checks** pass; negative controls reproduce the old horizontal shift. Some WebKit individual-character Range bounds snap by <1px while full-row width stays identical, matching the existing centering tolerance.

### Execution on implementation head

- `npm test`: **58 passed, 0 failed**.
- Full Chromium browser suite: **73 passed, 0 failed**, 257119.1069ms. Preserves all A298 R2 motion, walkthrough, fallback/AT, DPR, reduced-motion, hidden/offscreen and layout checks.
- Cross-engine scroll stability: **20 passed, 0 failed** = original **16/16** plus new **4/4** font-stress cases, Chromium + Linux WebKit, 1440/390. The eight final natural/font-stress traces total **440 steps** with zero actual scroll increment error and zero #system document-position drift.
- Exact `netlify.toml` static build command: **exit 0**, including vendor/license checks. Fixture copies in dist: **none**.
- `npm run audit`: **0 vulnerabilities**.
- `node --check` changed test files and `git diff --check`: passed.
- `npm run build`: **unavailable**, exit **127**, `env: ‘netlify’: No such file or directory`. Do not call the exact static build a full Netlify build.

## ADVERSARIAL REVIEW / STANDING

Required command was actually retried:
`hermes -p codereview chat --query-file docs/A300-R2-REVIEW-BRIEF.md -Q`
Result: **127, hermes: command not found**. Native codereview remains a host gate.

One supplementary read-only adversarial pass found **no concrete introduced defects**; no fixes or second pass needed. Report/probe artifacts are in this evidence archive and findings in `A300-R2-ADVERSARIAL-REVIEW.md`. This is not a native-profile verdict.

This worker/session obtained passing Standing **standing:67**: HTTP `https://deployaxiom.com`, expected `Deploy Axiom`. It verifies the public reference, **not this unshipped patch**. Local real execution and attached traces back the branch claims. The supplementary reviewer's non-allowlisted command proof was unavailable (standing:68), not a pass or demotion; it does not replace standing:67.

## ARTIFACTS

- `docs/A300-R2-EVIDENCE.zip`: before/after screenshots, font-stress + natural scroll traces, per-frame geometry, CLS source rectangles, red/green/full-suite/cross-engine logs, reviewer probes/report, missing-CLI logs and SHA-256 manifest. No native dependencies/install caches included.
- `docs/A300-R2-EVIDENCE-SUMMARY.json`: code-aggregated counts and before/after metrics; unsupported WebKit CLS = null.
- Original `docs/A300-EVIDENCE.zip` still holds original Safari/WebKit +612px reproduction and the separate terminal first-render height-collapse evidence.

## RISKS / ASSUMPTIONS

- Actual **Apple Braille on macOS and native Safari have not been tested on this new commit**. AXIOM's earlier real-Safari no-jump/normal Page Down result applies to 4aac7d4 only. The fixture deliberately models metrics, not Apple glyph appearance.
- Native codereview-profile and full Netlify build remain unavailable in the Space and required on host.
- Pre-existing 320px catalog overflow (323px document width) is unchanged and not this acceptance range. No scope expansion.

## APPROVAL NEEDED / NEXT

**AXIOM review only. No publication is authorized.** Export the updated branch through the approved Space helper, confirm implementation commit 83fa07e and the following evidence-only commit, then on host:

1. Run the native codereview command above with the rework brief.
2. Run `npm test` and `npm run build` (no deploy).
3. Run `SCROLL_BROWSERS=chromium,webkit SCREENSHOT_DIR=qa/a300-r2-host node --test --test-concurrency=1 tests/browser/scroll-stability.test.mjs`. Do not set the Linux-only WEBKIT_EXECUTABLE wrapper on Mac. All **20** must pass; original native-font desktop Chromium case stays strict.
4. In a fresh Safari private window, serve `dist` locally (`python3 -m http.server 8765 --bind 127.0.0.1 --directory dist`), cold-load at 1440×1000 and 390×1000. Scroll with trackpad from caduceus through #system; repeat normal/reduced motion. Full-size wings and draw-in/breathing remain intact; no snap. Page Down works with body/plain-text focus. Exact 55-step native console trace remains in `A300-HANDOFF.md`.
5. On Chromium with native Apple Braille, repeat the native-font desktop test 4 times as before: zero layout-shift sum, not merely vertical stability. Inspect source rectangles if any entry remains. Preserve host logs for this exact head.

Percy retains merge/deploy authority.

## SAFE ROLLBACK

Nothing shipped, so no live rollback is needed. Rework-only base: **4aac7d46ec8eed4e1c6987669424b68a1bfa407f**; revert 83fa07e to isolate this width fix. Full A300 base: **57dfe87bf337e1b67212830acef9724541fa453e**. Do not rewrite shared branches or change the approved draft.
