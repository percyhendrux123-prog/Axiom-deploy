# A300 adversarial review

## Required native profile command: unavailable

Attempted from the authorized Linux repo with the task-specific brief:

`hermes -p codereview chat --query-file docs/A300-REVIEW-BRIEF.md -Q`

Result: exit **127**, `hermes: command not found`. See `qa/a300/native-codereview.log` in the evidence packet. No native codereview-profile verdict is claimed. AXIOM should run that profile on the host before accepting the branch.

## Supplementary pass 1: one real P2, fixed

A fresh-context read-only reviewer exercised Chromium and Linux WebKit at both requested widths. The initial candidate hid `.system__alternative` on `.is-interactive` alone. Aborting either `rot.min.js` or `chain-terminal.js` left no canvas but clipped the visible relationship fallback to 1×1px. Native buttons and AT text survived, but the visual failure path regressed relative to baseline.

Parent reproduction: `fallback-red.log` records all four width/engine cases failing for that exact 1×1 clipped paragraph. The final fix adds `has-terminal-engine` only after ROT display/canvas initialization and requires **both** `.is-interactive` and `.has-terminal-engine` to hide the fallback. Missing ROT/engine keeps the paragraph visible. The final suite tests both missing scripts and keyboard panel selection at both widths in both engines.

After pass 1, repeated WebKit runs also exposed the user's larger symptom: a 50px request occasionally advanced 662px (+612, the entire desktop caduceus height). The initial terminal-only fix was not sufficient. The parent added a deterministic empty-frame regression (baseline slot height collapses from 612/189 to 0) and fixed the art slot with `block-size:18em`. Settled art and art generator remain unchanged.

## Supplementary pass 2 / final: no concrete A300 defect

A second fresh-context reviewer read the full final diff against `57dfe87`, verified built output matches source, and exercised:

- `npm test`: 58/58.
- All existing/new Chromium browser tests across focused batches: 71/71.
- Cross-engine scroll tests: 16/16, both 1440×1000 and 390×1000.
- Missing ROT, missing engine and missing `home.js`: visible fallback preserved.
- Enhanced AT snapshot retains the relationship paragraph; all 11 native buttons pass keyboard Space/Escape, selection and focus checks.
- No-JS retains all 12 explanations. No-JS art screenshots compare byte-identically with baseline CSS at both widths in both engines.
- Live art resizing across 12 widths, 320–1440, preserves 18 rows and art bounds.
- Entrance, motion preference toggles, hidden/offscreen sleeping, DPR, walkthrough/cancel and existing copy/vendor locks.

Result: **no concrete A300 regression found**. Raw custom probe output is copied into the packet as `qa/a300/reviewer2-custom-probes.json`; the parent read the returned artifact and independently ran the final full suites/repeated scroll tests.

The reviewer observed existing catalog overflow at 320px (document width 323px), identical under baseline CSS and already outside the acceptance widths. It is not changed by A300; do not conflate it with the art slot fix.

## Boundaries

Two supplementary passes only. These are not the unavailable native codereview profile. Linux WebKit is not a physical macOS Safari or VoiceOver session. Host visual Safari check and native profile review remain review gates, not claimed observations. No client data was involved.
