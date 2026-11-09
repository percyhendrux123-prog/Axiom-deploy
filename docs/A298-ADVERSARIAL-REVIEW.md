# A298 · adversarial review record

## Required profile review: unavailable, not approved

Attempted `hermes -p codereview chat --query-file docs/A298-REVIEW-BRIEF.md -Q` in the Linux Space, including again after Percy's add-ons. Both attempts returned `hermes: command not found` (exit 127). Raw command output is preserved in qa/a298/adversarial-review*.log. AXIOM must run the actual codereview profile on the host; this document does not assert SHIP or profile approval.

## Supplementary independent fallback review: two passes, maximum reached

These were read-only delegated reviewers, not the codereview profile. No client data was supplied.

### Pass 1: two concrete P2 findings

1. `assets/axioma/caduceus.js` initially blanks the preloaded art, but `home.js` started the reveal only at the 40% reading line. At 390×1000, art could be visible near the viewport bottom yet remain blank for seconds.
   - Reproduced in a failing browser regression with gate top at 650px.
   - Fixed: actual-art IntersectionObserver takes the existing conductor for the first entrance, rather than waiting for the reading line. Normal ambient motion remains section-local. The original SVG-free braille engine and breathing clocks remain.
2. `src/axioma/story.js` teardown retained live inline `--med:336px`, overriding responsive static sizing after reduced-motion toggles and phone resize.
   - Reproduced in a failing browser regression after waiting for static teardown.
   - Fixed: dispose removes `--med`; rebuilt the shipped bundle. Desktop → reduced motion → 390/320 resize regressions now pass for the medallion. The widened caduceus also gets a sub-360 font fit without clipping or overflow hiding.

### Pass 2: one remaining concrete P2 finding

3. A briefly visible first entrance could stay queued after the art left view; once the handoff gap expired, the unseen entrance advanced to completion and kept its ambient loop.
   - Reproduced with a controlled conductor handoff gap, real brief partial visibility, then real scroll-away: entrance incorrectly advanced 0 → 1100.
   - Fixed: drop queued caduceus accents on exit; revalidate actual-art visibility inside every caduceus tick; track the true reading section separately from temporary entrance ownership and restore it on exit.
   - The same regression now proves no unseen progress and a visible resume on return.
   - Reviewer found no further medallion teardown defect on repeated toggles/resizes.

## Final verification after fixes and add-ons

- `npm test`: 58 passed, 0 failed.
- `SCREENSHOT_DIR=qa/a298 npm run test:browser -- --test-concurrency=1`: 49 passed, 0 failed, against final static dist.
- Required six-item browser QA includes first/queued entrance, reduced motion, resize, one displayed rot canvas, controls/cancel/Escape/replay, hidden/offscreen active-time freeze, actual shader compilation/rendering, no-WebGL SVG fallback, shader pause and bounded draws, spinner pause and idle cancellation.
- Percy's shader and spinner add-ons arrived after the supplementary review passes. They received source self-review and real browser execution, not a third independent pass. The updated brief explicitly includes them for AXIOM's required host review.

The obsolete 2.5-second finite-accent test was corrected to distinguish persistent caduceus/chain/divider/ring ambient accents from finite arrivals. Non-overlap, offscreen/hidden termination and actual callback/draw freeze checks remain in place. No duration cap was weakened for a finite accent.
