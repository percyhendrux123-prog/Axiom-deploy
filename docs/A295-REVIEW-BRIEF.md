# A295 adversarial review brief

Goal: more restrained life on deployaxiom.com and an interactive Axiom chain diagram, branch/preview only.

Acceptance:
- Existing A291 living caduceus is the reference: engine, gate markup/styles, dimensions, timing and clocks are not to be simplified, shrunk, dimmed, slowed, re-timed or replaced.
- Five new finite accents share home.js's existing one scheduler/one animation loop; never overlap another accent. Reduced motion is static. Hidden/offscreen work sleeps; no layout shift, no new dependency or external call.
- New #system section after the gate: OWNER → OPERATOR → WORKERS, orders down / evidence up. Gatekeeper + advisory Axiōma on outbound; Standing on evidence; Tripwire on refused branch; Handydandy on handoff to next session.
- Hover/touch/focus/Enter/Space open short plain-English descriptions, Escape resets, 44px minimum targets, 390px usable, no-JS readable. Panel space does not shift between selections.
- Claims grounded in staged A294 explainer NOTES.md (especially lines 62–79); Axiōma never blocks or grants permission. No new catalog claim for hermes-axiom-agent, no prices or live-activity claim.
- Preserve every original route, locked copy, metadata, CSP and build allowlist. Homepage lock deliberately refreshed for addition/version only; new test strips the addition and version and asserts the old exact hash. All other copy-lock hashes unchanged.
- AXIOM handles host codereview and Netlify DRAFT only; no production, main push or merge.

Changed files:
- index.html: new diagram; CSS v7, home.js v5.
- assets/axioma/home.js: selection, five queue-owned effects, visibility/IO cleanup. caduceusLife() and caduceus.js untouched. The conductor retains the loaded engine API across reduced-motion toggles so it can resume; hidden tabs pause/resume compositor animations rather than creating a settle, and reduced-motion cancellation includes the ring settle.
- assets/axioma/axioma.css: diagram and absolute accents, reserve STOP weight to prevent ink shift; reduced-motion transitions:none.
- tests/life-diagram.test.mjs; tests/browser/life-diagram.test.mjs: new behavior regressions.
- tests/motion.test.mjs: opacity + transform allowlist (no layout writes); tests/browser/motion.test.mjs: layout-shift attribution on failure, same zero threshold.
- tests/remake.test.mjs: required script cache version; tests/fixtures/polish-content.json: homepage-only deliberate lock.
- DESIGN.md, PRODUCT.md, this brief: documentation.

Run on host: npm ci; npm test; npm run build; SCREENSHOT_DIR=/absolute/path npm run test:browser.
Sandbox lacks Netlify CLI. Sandbox build ran the exact [build].command from netlify.toml via Node child_process.execSync, then tests against dist. No credentials/deploy.
Current local evidence: npm test 50/50, full browser suite 23/23 (includes 360–1440 all-route target checks), no console/page/resource errors, zero post-scroll CLS. Tests also verify caduceus source SHA-256 c2c5449e5cb8669dd937855ae21a8fa18b6f678d94d133cbd4faf6969f670397.

Try to break the acceptance list. Report concrete defects only, with exact source location, repro and impact. Prioritize dynamic reduced-motion toggles, hidden/offscreen scheduling, accidental caduceus changes, edge placement at 390, native keyboard/touch semantics and copy truthfulness. Do not deploy, send, merge, or touch client/private data.
