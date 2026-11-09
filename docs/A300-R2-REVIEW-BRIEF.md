# A300 rework: adversarial review brief

Repo `/home/cua/repos/Axiom-deploy`, branch `design/a300-safari-jump`. Review the working diff against `4aac7d4` only (the prior A300 implementation already underwent two supplementary reviews). No edit, commit, push, deploy, merge, credentials, or live-data work.

Task: AXIOM's Mac Chromium test failed 4/4 with CLS 0.0016456686 on PRE.caduceus.is-live: the 44-cell grid's draw-in cursor has a larger advance than a braille cell. Width 1033.42→1022.67px moves the PRE horizontally. Prior Safari Page Down stop finding was retracted (Hermes had focus); do NOT implement a keyboard fix.

Acceptance:
- Zero Chromium layout shifts, including horizontal/recent-input, gate→#system at 1440x1000 and 390x1000.
- Stable PRE width/left/height through placeholder, live cursor and settled art using host-like font metrics. WebKit lacks CLS API; assert actual geometry and scroll deltas instead.
- Same full-size art: 34px desktop and 3cqw mobile; static/live art, conductor/entrance/breathing/reduced motion unchanged. No new clipping/overflow or scaling.
- All previous 16 cross-engine checks and npm test pass. Preserve terminal fallback fix and A298 R2 behavior.

Changes:
- assets/axioma/axioma.css: only inline-size:100% on .caduceus plus explanatory comment. Its PRE reserves the existing full column, inherited text-align:center positions unchanged-size glyph rows; block-size18em remains.
- index.html: CSS cache key v10→v11 only.
- tests/browser/scroll-stability.test.mjs: record x/width and CLS source rectangles; four additional test cases (2 engines×2 widths) use test-only WOFF2, hold lazy script for a before screenshot then exercise real entrance and 55 small scroll steps. Exact zero CLS retained; metric activation probe tolerates Linux advance quantization (<0.3px) but layout geometry remains <0.02px and CLS exactly 0.
- tests/browser/fixtures/{a300-host-metrics.woff2,generate-host-metrics.py,LICENSE-host-metrics.txt}: licensed DejaVu glyph subset with braille advance1400/2048em, cursor1em. NOT Apple Braille or a visual facsimile; no proprietary fonts copied. Regeneration needs optional fonttools[woff], not a test/runtime dependency. Test server intercepts only fixture runs; never public assets/build.
- tests/browser/terminal-chain.test.mjs: original 2x/aspect/fit art checks now measure the actual 44-cell first glyph row, not the now-full-column PRE; same old expected art dimensions. New separate slot bounds assertion.

Observed red before CSS fix: four metric cases fail. Chromium desktop CLS0.0016795927372685185, sourcePRE.caduceus.is-live; WebKit width1022.65625→1033.421875px (exact host metrics); mobile width drift in both engines. After: four stress cases pass; normal16 plus stress4 running/recorded in qa/a300-r2/cross-engine.log. Prior public draft is not this patch.

Commands (local only):
1. Exact static build: python3 -c "import tomllib,subprocess; subprocess.run(tomllib.load(open('netlify.toml','rb'))['build']['command'],shell=True,check=True)"
2. npm test
3. SCROLL_BROWSERS=chromium,webkit WEBKIT_EXECUTABLE="$PWD/qa/a300/webkit-local.sh" SCREENSHOT_DIR=qa/a300-r2/review node --test --test-concurrency=1 tests/browser/scroll-stability.test.mjs
4. SCREENSHOT_DIR=qa/a300-r2/review-full npm run test:browser -- --test-concurrency=1
WebKit wrapper/deps already present under ignored qa/a300. Native hermes/Netlify CLI not present in Space; actual commands will be retried and logged, not claimed as passes. Mac native Apple Braille remains AXIOM's exact final-head host check.

Try to break this revision against acceptance. Focus on inline sizing/art centering/unchanged ink size, browser geometry, and whether tests still catch horizontal shifts. Report concrete introduced defects only, with exact path and repro. No client data.
