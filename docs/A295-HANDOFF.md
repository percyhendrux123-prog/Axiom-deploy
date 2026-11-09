# A295 · local build handoff · 2026-11-08

## STATUS: unshipped

Implementation: `design/a295-life-diagram` at `e63d4c95396cdc1db4d544a443cdbdf619d3cb5f` (the following evidence-only commit packages this report). Base / safe rollback: `81f2747`.

No deploy, main push, merge, paid service, credential access or live-data write. AXIOM explicitly owns host export, codereview and Netlify draft creation. No draft URL exists from this worker.

## CHANGED

- Added #system after the existing gate: native HTML buttons over responsive SVG line art; owner/operator/workers, orders down/evidence up, five plugin chips on the relevant edges; world, refusal log and next session retained.
- Short panels open on mouse hover, touch, focus, Enter and Space; Escape clears. Selection uses a border plus underline, not color alone. Panels reserve space. No-JS exposes all descriptions; reduced motion keeps selection.
- Five new finite accents, all on the existing conductor, at most 30 fps:
  1. Diagram edges resolve gently from 42% to full opacity, once, 900 ms.
  2. Work and Limits headings resolve from 64% opacity, once, 620 ms.
  3. Method's short rule takes one shallow 6% breath, 2200 ms.
  4. Faint braille near Catalog and Findings shimmers once, 2200 ms, 16–36% opacity.
  5. Work / Findings links respond to hover or keyboard focus with a restrained 2px out-and-back drift, 700 ms.
- Hidden tabs cancel scheduler wakeups and pause compositor animations; offscreen reading-line exits retire accents. Reduced motion cancels all animations/transitions, including ring settle.
- Existing loader lifecycle improvement: caduceus API stays available when reduced motion is toggled on then off. **caduceus.js, caduceusLife(), gate placement, markup, dimensions, palette, clocks and cadence are unchanged.** Engine SHA-256 `c2c5449e5cb8669dd937855ae21a8fa18b6f678d94d133cbd4faf6969f670397` is now regression-locked.
- Homepage copy lock deliberately refreshed from `05e4d569…` to `7f45f0f8…` only for the diagram addition/cache version. An extra regression removes that addition/version and verifies the entire original homepage against its old hash. All other route hashes unchanged. No old copy rewritten.

## VERIFIED EVIDENCE

- `npm test`: **50 passed, 0 failed**.
- Exact static `[build].command` from `netlify.toml`: **passed**, produced dist; tested the built output, not source-only markup.
- `npm run test:browser`: **23 passed, 0 failed**. Includes all-route 360–1440 overflow/target sweep, 44px diagram targets, hover/touch/keyboard, stable panel dimensions, no-JS, reduced motion at load and dynamically, caduceus resume, hidden compositor pause, offscreen sleep, no overlapping accents, original medallion drag, zero post-scroll layout shift at 1440 and 390, zero console/page/resource errors.
- `npm run audit`: **0 vulnerabilities**.
- axe-core 4.14.0 WCAG 2/2.1/2.2 A/AA baseline vs A295 at 1440 and 390: **0 detected violations** in all four runs. SVG text contrast is marked incomplete by axe (new labels + existing textPath). New label palette `#c9cacd` on `#141518`: **11.14:1** at rest; dim panel text **5.56:1**; strong **16.00:1**. This is not a blanket claim that every accessibility criterion was manually certified.
- Screenshots captured in 1440px and 390px Chromium viewports, section crops: idle + Owner selected. Additional 390px reduced-motion screenshot. Sticky navigation is hidden only while taking section crops so it does not paint over offscreen content in the capture; production CSS is unchanged by capture.
- `standing:37` passed in this worker session: HTTP reference engine `https://deployaxiom.com/assets/axioma/caduceus.js`, expected `AxCaduceus`. This checks the public reference artifact, **not the unshipped branch**. A sandbox-server attempt returned unavailable (`standing:36`), with no demotion.

## Adversarial review / remaining host work

Attempted the prescribed command with `docs/A295-REVIEW-BRIEF.md`: exit 127, `hermes: command not found`. The Space has no codereview profile runner. Per AXIOM's card update, AXIOM runs that host pass after export; no independent codereview verdict is claimed here.

Runtime QA defects found and fixed (not an independent review): STOP's 400↔600 weight change shifted its text ink by 3px; reserve its bold weight. Universal 0.01ms reduced-motion transitions still created animations on new buttons; use none. Existing caduceus API was lost across reduced-motion toggles; retain it in the conductor. Hidden ring settle still animated; pause the existing compositor animation instead, and cancel it for reduced motion. All have regressions and final tests passed after fixes.

`npm run build` itself could not execute (`env: ‘netlify’: No such file or directory`), so host Netlify build/functions verification remains required. No CLI install/login was attempted. No Lighthouse score or real-phone CPU/battery measurement is claimed. Visibility tests use a controlled document.hidden + visibilitychange event; offscreen behavior uses real scrolling/IntersectionObserver.

Next: export branch; run `hermes -p codereview chat --query-file <host-repo>/docs/A295-REVIEW-BRIEF.md -Q`; address real findings; host `npm run build`; `unset NETLIFY_AUTH_TOKEN`, `netlify deploy` **without --prod**; inspect draft and wording with AXIOM; Percy alone approves live ship.

## Evidence files

`docs/A295-EVIDENCE.zip` contains the four required PNGs, reduced-motion PNG, source/browser logs, runtime timeline, console/error reports, axe before/after, the audit harness, and SHA-256 manifest. QA remains outside the public build allowlist.
