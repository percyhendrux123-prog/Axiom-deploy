# A300 final adversarial review brief (pass 2 / final)

Task: fix Percy's Safari jump from the caduceus gate to #system. Repo /home/cua/repos/Axiom-deploy, branch design/a300-safari-jump from 57dfe87bf337e1b67212830acef9724541fa453e. Branch only: no push/deploy/merge/spend/live data.

Implementation commits: 0d7d886 (terminal layout/fallback); ea07b25 (fixed caduceus slot + browser regressions). Review the full diff against 57dfe87. This is the second/final supplementary pass; native hermes CLI is absent (127), not a native codereview-profile verdict.

Acceptance:
- Linux WebKit and Chromium at 1440x1000 / 390x1000: 55 small 50px steps from gate through #system preserve actual scroll increments, #system document top and caduceus/gate/board/frame heights. Chromium Layout Instability observer reports zero after fix (include recent input too).
- The caduceus retains 18 line-height rows even while the old text frame is empty/replaced. Same size before script load, during entrance, settled, and on resize; no clipping/reduction/reference-art change.
- Late first terminal draw must not collapse frame or move details/source. No-JS, missing ROT and missing chain engine retain visible relationship fallback; enhanced mode retains it for AT and all keyboard/native node controls.
- Preserve A298 R2 entrance, breathing, reduced motion, hidden/offscreen sleep, DPR sharpness, copy and vendor locks. npm test/full browser tests pass. Branch only.

Changed files:
- assets/axioma/axioma.css: .caduceus gets block-size:18em; current 34px desktop and proportional 3cqw mobile font sizes unchanged. Summary hiding moves from first viewport-lazy .has-terminal render to .system.is-interactive.has-terminal-engine (initial enhancement).
- assets/axioma/chain-terminal.js: add has-terminal-engine only after ROT display and canvas initialize successfully, before lazy rendering. This fixes pass-1 P2: unguarded .is-interactive alone hid the visual fallback when ROT/engine scripts failed. No new loop/draw.
- index.html: CSS query v9->v10 and chain query v1->v2.
- tests/life-diagram.test.mjs, tests/polish.test.mjs: normalize only the exact chain cache query back to v1 for existing content hashes (hash values/art locks unchanged).
- tests/browser/scroll-stability.test.mjs: height/replacement/scroll/CLS and script-failure regressions; engine selection env. Browser default is Chromium; explicitly run WebKit too.

Critical new evidence after pass 1:
- Original A298 CSS/engine (from git show 57dfe87) in built output: WebKit 1440 intermittently scrolls 662px for a 50px request (+612px = full caduceus height), despite unchanged sampled document bounds. Exact original-code repeats reproduce this in 2/8 runs; qa/a300/base-repro-1-webkit-1440-scroll.json and base-repro-3 show it at step index29. Other baseline runs still fail because of late terminal frame shrink. Source mechanism: transient text-frame sizing/scroll anchoring is an inference, not an instrumented WebKit internals claim.
- Reserving block-size:18em stops it: 8/8 repeated natural scroll passes at EACH width (16 scenarios); zero delta error/#system drift. Initial isolated reservation experiment also passed 8/8 desktop runs. No overflow-anchor dependency.
- Deterministic replacement regression: baseline pre with old frame removed becomes 0px; fixed slot remains 612px desktop /189px mobile. Settled art size unchanged.
- Separate baseline first-render collapse: 66.875px desktop /174.0625px mobile, both engines. Chromium delayed-draw CLS sums ~0.013504 /0.091456; after 0. WebKit lacks Layout Instability API, so measure document positions and scrollY, NOT WebKit CLS.
- Final new suite:16/16; npm test:58/58; full Chromium browser suite:71/71. Caduceus JS/art and home.js untouched. Existing SHA/copy locks pass.

Run:
1. Exact static build (no deploy): python3 -c "import tomllib,subprocess; subprocess.run(tomllib.load(open('netlify.toml','rb'))['build']['command'],shell=True,check=True)"
2. npm test
3. SCREENSHOT_DIR=qa/a300/review2 npm run test:browser -- --test-concurrency=1
4. SCROLL_BROWSERS=chromium,webkit WEBKIT_EXECUTABLE="$PWD/qa/a300/webkit-local.sh" SCROLL_LABEL=review2 SCREENSHOT_DIR=qa/a300/review2 node --test --test-concurrency=1 tests/browser/scroll-stability.test.mjs
WebKit dependencies are locally extracted (no sudo/system changes). Wrapper sets library search paths because upstream wrapper overwrites LD_LIBRARY_PATH. npm run build cannot find Netlify CLI (127); exact [build].command passes. No publication allowed.

Try to break the final patch against acceptance, especially fixed-size clipping or mobile rounding, failure fallback, delayed canvas, keyboard/AT, and preserved final geometry. Read exact source and run real narrow probes. Report concrete defects only with evidence/path/repro; distinguish unknown native Safari. Do not edit files, commit, push/deploy/merge or access client data. Native macOS Safari remains a host visual/device check even though Linux WebKit now reproduces and no longer exhibits the jump.
