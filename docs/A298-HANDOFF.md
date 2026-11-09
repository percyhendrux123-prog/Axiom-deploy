# A298 · terminal chain · review handoff

Historical first-round handoff for d83764e. For the current revision, see `docs/A298-R2-HANDOFF.md`; its final head/evidence/tests supersede this document. The whitespace clarification below includes A299's P3 correction.

## STATUS: unshipped

Branch: `design/a298-terminal-chain` in `/home/cua/repos/Axiom-deploy`.
Implementation head: `925cdb0950b3db71ebad7b4e9356fa6ee4f395ad`. A following evidence/instrumentation-only commit packages this handoff.
Base / safe rollback: `66ca63e301672acd400ce6c2846ab3345e96a583` (A296).

No push, deploy (including draft), merge, spend, accounts, credentials or live-data writes. This task ends at AXIOM review. The original A296 draft is not an A298 preview.

## CHANGED

1. **Caduceus:** 44×18 braille cells instead of 34×18; 88×72 individual dots. Only feather sampling widens, preserving helix/staff proportions and the original independent breathing clocks. The finest meaningful grain is one braille dot, with shallow ordered-density modulation across wings and snakes. Gate art and quote are centered. A 1.1-second, top-to-bottom terminal entrance has a cursor-like leading edge, once on first actual visibility. Active progress pauses hidden/offscreen; queued entrances cannot run unseen. Reduced motion/no-JS use the exact complete generated rest frame. Existing 24fps motion and 1.6s ease-in remain; offscreen draws stop. The engine/gate/conductor SHA locks were **deliberately updated**, explicitly stated in the first commit. New engine SHA-256: `235810aad7f9594a2e6f1146e17f2e08cd01a5149ad42857de36807985ca36fa`.
2. **rot.js chain:** unmodified built rot-js 2.2.1, BSD-3-Clause, vendored with license. One Display canvas survives breakpoint changes; both old SVG copies are removed. Native controls/focus, all 11 nodes, original panel copy and full walkthrough remain. Explicit HTML relationship alternative is readable without canvas/JS and by screen readers. A tiny pinned-version adapter disables rot's private scheduler before construction; the existing conductor flushes dirty cells. Footer credit and exact build inclusion checks added.
3. **Hermes herm:** live desktop diameter 224 → **336px** (1.5×); live 390px-phone diameter 112 → **172px**. Static fallback measures **175.5px** on the phone and **336px** desktop. Drag, arrow keys, text reflow and signal lighting remain. Reduced teardown removes live inline sizing before responsive resize.
4. **Background:** a pre-rendered braille-dot SVG tile, 6.5% opacity, slow 6px/4px drift at at most 4fps on the same conductor. No extra canvas/loop/timer. Static with no JS/reduced motion; hidden/offscreen clocks pause. Panel and text colors are unchanged.
5. **Percy add-on — liquid chrome:** minimal vanilla Paper Shaders LiquidMetal 0.0.82 shader exports, Apache-2.0 LICENSE + NOTICE, no React or ShaderMount. Chosen placement is the existing herm ring, not a new hero wordmark. One low-power WebGL2 canvas at 15% opacity is masked to its two fine ring lines; the face, ring lettering and original SVG remain untouched underneath. Back is #101310; tint near stone; slow time scale, <=12fps, <=384×384 render target. Off under reduced motion; pauses hidden/offscreen/drag. No WebGL/context loss leaves plain SVG. No pointer steering added, avoiding conflict with existing medallion drag.
6. **Percy add-on — terminal loaders:** only cli-spinners 3.4.0 `dots` JSON (10 braille frames, 80ms interval), MIT, plus a generated synchronous wrapper because CSP prohibits fetch. A faint indicator runs only during the example order and its resolving gate holds. Uses the walkthrough's existing active-time clock; idle, cancel, Escape and reduced-motion manual stepping stay still. The caduceus keeps its clearer cursor edge rather than adding a second spinner. Both add-ons are credited and explicitly included/checked by the copy-only build.

Business/panel copy is unchanged. Necessary additions are the diagram's text alternative and dependency credits. No hype, emojis, fake live activity or successful-send claims.

## COMMITS

- `7ac1948` — wide finely dithered caduceus and terminal entrance; intentional SHA fixture update.
- `40fbdb2` — one rot.js Display, controls, fallback, license and build checks.
- `853a998` — enlarged herm and responsive live/static text flow.
- `5eb1e6d` — faint 4fps braille background.
- `703a6b8` — supplementary-review fixes: first-view/queued entrance and reduced teardown sizing.
- `c87ab86` — faint Paper LiquidMetal on herm rings and SVG fallback; vendor licenses.
- `925cdb0` — active-only braille loaders and add-on browser regressions.
- Following evidence-only commit — this packet, review brief and medallion measurement logging; no shipped-file changes.

## VERIFIED EVIDENCE

- `npm test`: **58 passed, 0 failed**.
- `SCREENSHOT_DIR=qa/a298 npm run test:browser -- --test-concurrency=1`: **49 passed, 0 failed**, final built dist. Subsequent measurement-only rerun: both medallion tests passed, recording all four live/static bounds.
- Exact `netlify.toml` `[build].command`: **PASS**, including vendor/license/NOTICE checks; QA/docs/tests do not ship.
- `npm run audit`: **0 vulnerabilities**. The implementation working-tree `git diff --check` passed; this is **not** a base-to-head whitespace guarantee. Vendored `LICENSE-rot-js.txt` intentionally retains upstream trailing whitespace unchanged.
- `npm run build`: **not verified** — `env: ‘netlify’: No such file or directory` (exit 127). No fabricated Netlify success: host bundling/build is still required.
- Real runs: **13533ms at 1440**, **13525ms at 390**; owner → operator → workers → all five gates → evidence returns to owner. Cancel/Escape/replay, hover/touch/keyboard, all 11 controls, stable panel dimensions and no horizontal overflow at 390. Existing 360–1440 page-family/tap-target sweep passed. Captured run/resource/console errors: none.
- Hidden/offscreen progress freezes in place. First partial visibility and queued-then-scroll-away regressions pass. Global RAF callback instrumentation proves no private renderer loop hidden/offscreen; reduced-motion initial visits start zero RAF callbacks.
- Shader genuinely compiled/rendered with WebGL error 0. Each viewport recorded **9 shader draws in 900ms**; hidden/offscreen draw counts freeze. Actual no-WebGL and reduced-motion SVG fallback browser cases passed. These are headless Chromium results, not physical GPU/device/battery certification.
- Chain sample: ambient **23.48 pulse draws/s**, max **25** in a sampled second; running **11.99/s**, max **18**. Hidden: **0 draws, 0 script time**. Renderer task/script samples are in runtime.json; do not describe them as whole-device CPU or battery measurements.
- Passing worker-session Standing proof: **`standing:57`**, HTTP `https://deployaxiom.com`, expected `Deploy Axiom`. This independently checks the public reference site, **not the unshipped A298 branch**. Local source/browser execution proves the branch. A vendor-CDN proof target was unavailable/owner-allowlist restricted; no pass claimed for it.

## SCREENSHOTS / ARTIFACTS

Raw Space paths are under `/home/cua/repos/Axiom-deploy/qa/a298/`; the same relative paths are preserved in `docs/A298-EVIDENCE.zip`, with SHA-256 manifest and logs.

At **both 1440 and 390**:
- `caduceus-{width}-entrance.png` / `caduceus-{width}-settled.png` — hidden-tab freeze used only to hold a genuine live mid-entrance frame for capture.
- `terminal-{width}.png` / `chain-{width}-mid-run.png` — one canvas, idle and gatekeeper resolution; mid-run includes the live dots loader.
- `medallion-{width}-no-preference.png` / `medallion-{width}-reduce.png` — enlarged live/static herm and wrapping.
- `background-{width}.png` — faint texture in the actual page.
- `chrome-{width}.png` — faint ring chrome, original face/text retained.

Also: `spinner-390-gate-check.png`, reduced/no-JS coverage, per-width run and shader JSON, source/browser/audit/static-build/CLI-failure logs. Scoped section screenshots at a 1440px viewport may be 1180px wide because the section's real max-width is preserved. Sticky navigation is hidden only during scrolled section capture so it cannot cover the crop. Required screenshots were visually inspected for centering, clipping, readable labels and wrapping.

## ADVERSARIAL REVIEW / RISKS

See `docs/A298-ADVERSARIAL-REVIEW.md` for exact findings and fixes. Required command was attempted, including after the add-ons: `hermes -p codereview chat --query-file docs/A298-REVIEW-BRIEF.md -Q` → **`hermes: command not found`**. **No codereview-profile verdict or SHIP approval is claimed.**

Two supplementary independent read-only review passes found three concrete P2s: delayed first-view reveal, retained inline medallion size after teardown, and a queued entrance running unseen. All were reproduced with failing browser regressions, fixed, and followed by the passing final suites. The add-ons arrived after those passes and received self-review plus real execution; a third independent pass was not run. AXIOM's host review must cover all six items.

No physical phone, Safari/WebKit, fresh axe/Lighthouse or host function-bundling run is claimed. At the extra, unrequested 320px probe, the medallion and widened art now fit; no whole-page 320px guarantee is made for unrelated long catalog install text. Requested 390px and the existing 360+ regression sweep pass.

## APPROVAL NEEDED / NEXT

AXIOM: export `design/a298-terminal-chain` using the approved Space repo handoff, verify final commit/tree, run the actual host codereview profile with the updated brief and run host `npm run build`. Resolve concrete findings before asking Percy to approve any publication. No deploy or merge is authorized by this task. Percy retains production approval through the default operator.

## SAFE ROLLBACK

`66ca63e301672acd400ce6c2846ab3345e96a583`. No live rollback is needed: A298 is unshipped.
