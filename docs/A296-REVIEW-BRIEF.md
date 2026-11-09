# A296 adversarial review brief

Goal: make the existing Axiom chain feel continuously alive without touching the living caduceus. Local-only branch `design/a296-living-chain`, base `450906a`. Do not deploy, push, merge or use live data.

Try to break this against the acceptance list. Report concrete defects only, with path/line, reproduction and consequence; do not propose unrelated refactors.

## Acceptance
- One faint ambient pulse follows orders, evidence, handoff and refused SVG edges continuously, only in the reading section; at most 30 draws/s.
- Run one order: OWNER → OPERATOR → WORKERS → axioma → gatekeeper → standing → tripwire on a refusal path → handydandy → evidence back to OWNER. Existing gate panels/selection open for 1500ms each. About 10–14 active seconds total (data budget 13350ms). Ambient pulse clock pauses throughout the run.
- Run/cancel/replay keyboard and touch accessible; Escape cancels; manual selection can interrupt; cancel restores focus. Controls ≥44px. No layout shift or horizontal overflow at 1440/390.
- Hidden/offscreen activity freezes, not fast-forwards. Reduced motion is completely static, advancing the same panels only by explicit button presses. Changing motion preference cancels a timed/manual run safely.
- Section divider opacity gently breathes on staggered 6–10s clocks (12fps), finite arrival reveals kept. No new accent runs beside caduceus.
- caduceus.js engine, caduceusLife() source, gate HTML/placement and all caduceus timings unchanged. SHA-lock tests cover engine/function/gate/panel copy.
- No copy rewriting. Only new explanatory line: 'An example order, not a live action.' No catalog claims, hype or prices.
- Single existing conductor, no new timer/RAF/CSS-animation loop, static no-JS fallback intact.

## Changed files
`assets/axioma/home.js`, `assets/axioma/axioma.css`, `index.html` (cache versions only); new `tests/living-chain.test.mjs`, `tests/browser/living-chain.test.mjs`; cache expectations only in `tests/life-diagram.test.mjs`, `tests/polish.test.mjs`, `tests/remake.test.mjs`. DESIGN.md/handoff describe the new contract.

## Run
1. `npm test`
2. `npm run build` (requires Netlify CLI; unavailable in Linux Space). Safe local equivalent for static dist: read `[build].command` from netlify.toml and execute it, no deploy.
3. `SCREENSHOT_DIR=qa/a296 npm run test:browser`
4. `npm run audit`

Browser tests launch isolated headless Chromium and ephemeral loopback servers, then close them. No production access, no real client input. New runtime test samples CDP renderer task/script duration and actual SVG transform mutations. Route geometry tests prove invisible walkthrough routes stay on original edges or beneath existing nodes.

## Known environment limits
No `hermes` runner or Netlify CLI in Space. AXIOM's card explicitly assigns host codereview and draft creation after export. A failed CLI attempt is not an independent review verdict. All reported runtime CPU values describe this headless Linux renderer, not Percy’s phone or battery.
