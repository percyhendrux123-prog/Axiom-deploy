# A296 · living chain · local handoff

## STATUS: unshipped

Branch: `design/a296-living-chain`. Implementation commit: `b586d603fe2b78a8a0e8a31085852e590ca46669`. A following evidence-only commit packages this report. Base / safe rollback: `450906a830beaa3f9461e6779a9e3b50b9d8ef41` (A295).

No deploy, push, merge, account change, credentials, spend or live-data write. AXIOM owns host export, codereview and Netlify draft creation; Percy approves live ship.

## CHANGED

- One faint brass pulse continuously follows the existing orders, evidence, handoff, outbound and refusal paths, 3.6 seconds per edge, up to 28% opacity. Only one pulse is visible at a time. Uses the existing conductor and a hard 30-draw/s cap; the reading-section observer stops it outside the section.
- Native Run one order / Cancel order controls. One example visits OWNER → OPERATOR → WORKERS → axioma → gatekeeper → standing → tripwire on the refusal path (including refusal log) → handydandy / next session → evidence back to OWNER. Each gate opens its **unchanged** existing panel for 1500ms. Budget: 13350 active ms. Ambient flow's clock pauses throughout. Escape, Cancel order or explicit node selection cancels; cancel restores control focus. Replay works after hover/focus selection too.
- Reduced motion: no new decorative elements, draws, animations or timers; Run / Next step manually advances the panels. Motion preference changes cancel the existing timed/manual walkthrough rather than silently converting it. No-JS descriptions remain visible; the JS-only controls are absent.
- Ongoing section-divider breathing on staggered 6–10s clocks at 12fps, 16–24% opacity. Method's short rule breathes 48–56% on an independent 8.731s clock. Finite A295 arrivals remain. No divider is added to the medallion story or reference gate; diagram breathing shares its chain accent.
- Hidden tabs freeze progress and cancel scheduler wakeups. Offscreen order progress freezes and resumes in place, not fast-forwards. New accents never run beside caduceus.
- Only new explanatory line: “An example order, not a live action.” No panel rewrites, catalog claims, hype or prices. Homepage HTML changes only cache versions (CSS v8, home.js v6); copy fixture normalizes that version rather than accepting a new copy hash.

**caduceus.js, caduceusLife(), gate markup/placement and all reference timings untouched.** Independent regression SHA locks cover the engine, function, gate HTML and original panel copy. Engine SHA-256: `c2c5449e5cb8669dd937855ae21a8fa18b6f678d94d133cbd4faf6969f670397`.

## VERIFIED EVIDENCE

- `npm test`: **53 passed, 0 failed**.
- `SCREENSHOT_DIR=qa/a296 npm run test:browser`: **33 passed, 0 failed** on the final built dist. Includes 10 new living-chain browser cases plus existing all-route overflow/44px-target sweep, medallion drag/reflow, no-JS, reduced motion, layout-shift and reference caduceus checks.
- `npm run audit`: **0 vulnerabilities**. `git diff --check`: clean.
- Exact static `[build].command` in netlify.toml executed successfully and produced the tested dist. `npm run build` itself fails because Netlify CLI is absent (`env: ‘netlify’: No such file or directory`). Host Netlify build/function bundling remains required.
- Timed runs measured **13522ms at 1440** and **13516ms at 390**, all gates in order, returned OWNER panel visible; panel height unchanged; no horizontal overflow; Run/Cancel targets at least 44px. Zero captured console/page/resource errors.
- New geometry tests sample all walkthrough routes at both responsive layouts: every point stays on an original edge or under an existing node (no shortcuts across empty space).
- Four required final PNGs in the evidence ZIP: 1440 and 390 viewports, idle with visible ambient pulse and mid-run with gatekeeper selected. Section screenshots include the entire diagram and panel; sticky nav is hidden only for capture so it cannot paint over the scrolled crop. Final idle and mid-run images visually inspected: no clipping or overlapping controls.
- CDP / actual transform-mutation sample, headless Chromium Linux Space: ambient **22.48 pulse draws/s**, max **24** in any sampled second; running sample **11.98 moving-pulse draws/s**, max **19** (the pulse rests at gates). Renderer task time **11.01% ambient / 10.04% running**; script **1.31% / 1.16%**. Hidden: **0 draws, 0 script time**, ~0.047% renderer task bookkeeping. This is a short renderer sample, **not whole-device CPU, FPS rendering certification, phone battery or thermal evidence**. Source hard-caps all new motion at 30 (divider at 12) even on faster refresh displays.
- `standing:38` passed in this worker session: HTTP reference `https://deployaxiom.com/assets/axioma/caduceus.js`, expected `AxCaduceus`. This independently checks the preserved public reference, **not the unshipped branch**; source/browser tests prove the local change.

## Adversarial review / risks

Prescribed attempt: `hermes -p codereview chat --query-file docs/A296-REVIEW-BRIEF.md -Q` → **exit 127, `hermes: command not found`**. No independent codereview verdict is claimed. Per the card, AXIOM runs that host pass after export and addresses any concrete findings before draft approval. No second pass was possible or claimed.

Concrete self-QA defects fixed with regressions: strict-mode block-scoped panel selector was inaccessible to the walkthrough; manual → animated preference toggle could silently complete a manual run; replay after hovering a different panel could retain stale selection; initial return/refusal routes took shortcuts / omitted log continuation. Selector scope, toggle cancellation, selection state and routes fixed. Final source + browser suites rerun after fixes.

No new axe or Lighthouse run, physical-phone test, production audit or host Netlify function-bundling check claimed. Existing browser regression coverage passed; production remains unchanged by this worker.

## APPROVAL NEEDED / NEXT

AXIOM: `space_repo.sh out` this branch, inspect the final hash, run host codereview with `docs/A296-REVIEW-BRIEF.md`, resolve real findings, run host `npm run build`, create a Netlify draft only, then give Percy the motion preview. Percy alone approves merge / live deploy. No new worker-owned follow-up task needed; this is the branch-only phase requested by the card.

## SAFE ROLLBACK

`450906a830beaa3f9461e6779a9e3b50b9d8ef41` (A295). No live rollback is needed because nothing shipped.

## Files

`docs/A296-EVIDENCE.zip`: requested four screenshots, source/browser/dependency logs, per-width run/error reports, runtime sample, existing-life timeline, verification environment record, SHA-256 manifest. QA and docs stay outside the public build allowlist.
