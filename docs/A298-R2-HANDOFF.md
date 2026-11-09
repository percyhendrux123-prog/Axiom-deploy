# A298 · round-2 revision handoff

## STATUS: unshipped

Repository: `/home/cua/repos/Axiom-deploy`
Branch: `design/a298-terminal-chain`
Implementation head: `df3d0c2a5a1df3952cccf07a83512c299c376ce2` (a following documentation/evidence-only commit packages this handoff).
Review base / this-round rollback: `d83764e84a637e7b20a583aafa898f5b90681cea`.
Original A296 base / full A298 rollback: `66ca63e301672acd400ce6c2846ab3345e96a583`.

No push, deploy (including draft), merge, credentials, spend or live-data changes. The public website and old draft are not the revised branch. This handoff supersedes `docs/A298-HANDOFF.md` for the current revision.

## CHANGED

1. **DPR sharpness:** the same single rot.js Display retains CSS-pixel grid geometry while its 2D context rasterizes text and cells at native backing resolution. Context font/alignment/baseline are restored after resizing. No vendor modification or private loop; resize, selection and visibility behavior remain intact.
2. **Edge semantics:** all seven relationship arrows survive box filling, with each tip in the last outside cell. Connected direction masks produce actual corners, not four-way stubs. Handoff/refused use dashed glyphs. Mobile evidence labels sit entirely to the left of their risers. Panels and walkthrough copy/control behavior are unchanged.
3. **Visible background:** half-pixel-aligned braille dots at 9% opacity, plus whole-CSS-pixel drift on the existing <=4fps conductor, keep the texture faint but measurable throughout movement and after reduced-motion changes. Panel and text colors stay unchanged.
4. **Caduceus 2×:** desktop CSS font 17 → 34px, with the full 44×18 art scaling proportionally into the mobile column through container-relative sizing. The gate has room for the wings. The art generator, SHA locks, fine dither, staff/snakes, breathing clocks and one-time terminal entrance are untouched this revision.
5. **Straight-across desktop type:** the hero headline spans the section on one line with width-relative font sizing. Display section titles remain one line. Percy's literal “Nothing sends…” axiom also runs across on one desktop line. Mobile keeps natural wrapping. No copy changed.
6. **A299 P3:** the historical handoff now distinguishes a clean working-tree whitespace check from the original-base diff, whose vendored BSD license intentionally retains upstream trailing whitespace.

The approved herm size, Paper LiquidMetal ring and active-only braille loaders are unchanged; their browser tests/screenshots were rerun.

## COMMITS (since d83764e)

- `3d52e1f` — native-resolution single rot Display.
- `690144c` — seven external arrows, dashed routes and true terminal corners.
- `82be24a` — faint-but-visible texture with real pixel/contrast tests.
- `3a43100` — doubled desktop caduceus, proportional mobile fit.
- `fc9c59d` — desktop hero on one section-wide line.
- `8c8dc78` — literal “Nothing sends…” axiom straight across desktop.
- `df3d0c2` — supplemental-review fix: pixel-aligned drift after motion-preference changes.
- Following evidence-only commit — A299 P3 wording, review brief/findings, final logs/screenshots/manifest and this packet.

## VERIFIED EVIDENCE

Final built `dist`, headless Chromium in the appbuilder Linux Space:

- `npm test`: **58 passed, 0 failed**.
- `SCREENSHOT_DIR=qa/a298-r2 npm run test:browser -- --test-concurrency=1`: **63 passed, 0 failed**, 233219ms. Includes prior site regression suite and 14 new browser cases. An earlier 180s harness timeout was resolved by rerunning with a 600s limit; the final suite exited 0.
- Exact `netlify.toml` `[build].command`: **exit 0**, including the explicit vendor/license/NOTICE allowlist checks. `node --check` passed for both changed production scripts and the browser test file.
- `npm run audit`: **0 vulnerabilities**.
- `git diff d83764e --check`: passed. The original A296-base license-only check deliberately reports upstream whitespace; the file is unchanged by round 2. Both results are logged, not conflated.
- `npm run build`: **not verified on this revised head**, because the Space still returns `env: ‘netlify’: No such file or directory`, exit 127. AXIOM reported the host Netlify build and all vendor outputs passed on prior head d83764e. Host rebuild remains required for this head.

### Observed measurements

| Check | 1440 viewport | 390 viewport |
|---|---|---|
| Canvas backing vs CSS | DPR 2: 2052×903 / 1026×451.4375 CSS | DPR 3: 972×1783 / 324×594.296875 CSS |
| Final-grid relationship arrows | 7 | 7 |
| Settled art bounds | 1095.703125×612; previous 547.859375×306 | 338.390625×189, inside x=20…370 column |
| Caduceus centering | centered | centered; no cropping/overflow |
| Texture brightest RGB, initial static and drift→static | (25,26,29), night=(14,15,17), +11 red | same |
| Text contrast on brightest sampled dot | dim 5.295:1; body 12.439:1 | same |
| Walkthrough duration | 13514ms | 13506ms |

Desktop type tests cover 901, 1024 and 1440; all requested headlines/axiom measure one text line. Mobile 390 keeps multiline hero text and no horizontal page overflow. Existing whole-page 360+ and inner-page/tap-target sweeps pass. All 11 node controls/panels, cancel, Escape, replay and reduced-motion manual walkthrough pass. One canvas survives breakpoint changes, and its text alternative remains available.

Hidden/offscreen tests freeze entrance, pulses, texture, shader and loaders; no private vendor RAF wakes. Runtime sample: ambient maximum 24 pulse draws in a sampled second, running maximum 19; hidden 0 draws and 0 script time. These are renderer samples, not battery or whole-device CPU certification. Console/resource/page-error collections are empty in tested paths.

## SCREENSHOTS / DOWNLOADABLE EVIDENCE

Packet: `docs/A298-R2-EVIDENCE.zip`, preserving these relative paths and SHA-256 manifest. Raw Space root: `/home/cua/repos/Axiom-deploy/qa/a298-r2/`.

At both 1440 and 390:
- `caduceus-{width}-entrance.png` / `caduceus-{width}-settled.png` — actual draw-in frozen with the hidden-tab test hook, then normal settled art.
- `hero-{width}.png` — single-line desktop / natural mobile wrapping.
- `terminal-{width}.png` — one displayed surface.
- `terminal-1440@2x.png` / `terminal-390@3x.png` — native-resolution proof.
- `chain-{width}-mid-run.png` — resolving walkthrough with active loader.
- `background-{width}.png`, `background-{width}-2x.png` and `background-{width}-after-drift-2x.png` — real page, nearest-neighbor zoom crops, initial static and after preference change.
- `medallion-{width}-no-preference.png` / `medallion-{width}-reduce.png`, `chrome-{width}.png` — unchanged herm and ring regression evidence.

The packet also includes final cell grids, bounds/contrast/runtime JSON, complete source/browser/audit logs, exact-static-build log and explicit missing-CLI logs. 1440 section crops retain the real 1180px section width. Sticky navigation is hidden only in scrolled section screenshots to prevent it covering the crop. Required art, hero, high-DPR diagram and background crops were visually inspected.

## ADVERSARIAL REVIEW

See `docs/A298-R2-ADVERSARIAL-REVIEW.md`.

The native codereview command was attempted and returned `hermes: command not found` (127), not a profile verdict. AXIOM reports A299 cross-family host review of **d83764e** as SHIP with one P3 wording correction, now included; that prior verdict is not claimed for this revised head.

One supplementary read-only fresh-context reviewer independently exercised the revision and found a real texture P2: fractional drift blurred dots to +4 when reduced motion froze the offset. New parent regressions reproduced +4/+5 before the fix; whole-pixel drift fixed it to +11 in both widths, followed by the passing full suites. No other concrete defects were found. The two rounding calls are a trivial fix; no second independent pass was needed.

Passing worker-session Standing proof: **standing:58**, HTTP `https://deployaxiom.com`, expected `Deploy Axiom`. Scope is the public reference site only, not independent verification of the unshipped branch; local execution and artifacts prove this revision.

## RISKS / ASSUMPTIONS

- AXIOM should review the revised artifacts and run host `npm run build` before any publication decision.
- Pinned rot 2.2.1 adapter uses private backend context/spacing fields, just as the existing scheduler adapter does; re-test on any vendor upgrade.
- Chromium only; no physical phone, Safari/WebKit, fresh axe/Lighthouse, GPU thermal or battery certification.
- Percy makes the final aesthetic call on the widened wings under his “only improved” rule. Their art is unchanged in round 2, only its rendered scale.
- No new guarantee for unrelated whole-page 320px catalog text; the requested 390px and existing 360+ sweeps pass.

## APPROVAL NEEDED / NEXT / SAFE ROLLBACK

AXIOM: export the branch through the approved Space handoff, verify exact final commit, inspect the evidence and rebuild on host. Requesting review only, not release approval. Percy retains all merge/deploy authority. No live rollback is needed; local rollback is d83764e for this revision, or 66ca63e for all of A298.
