# A164 rework review — native inline links, preview only

Repository/worktree: /Users/percykeith/axiom/worktrees/polish-2026-10-31
Branch: design/polish-2026-10-31
Review only the current uncommitted revision against e524e6361a6ed9dabc283a7a525b4844dad097ba. Read DESIGN.md. No external services, client/private data, browser profiles, real GUI, deploy, push or other side effects. Do not edit source. Save findings to qa/polish-2026-10-31/REVIEW-Inline-links-findings.md; report concrete defects only, no speculative recommendations. Close all test browsers and servers you start.

Goal: fix AXIOM's mobile reading-flow defect, not redesign further. The old max-width:640px rules turned links in paragraphs into 44px inline-flex boxes. At /privacy/ 390px, Google API Services User Data Policy and the permissions link were forced onto separate tall lines. Copy is absolutely locked.

Changed implementation files:
- assets/firm.css: remove broad inline-flex/min-size article, founder-email, closing-alt, recording-fine and fallback rules. Keep prose native inline with safe URL wrapping. Social link list remains >=44px. Restrict .next standalone flex to direct links without strong; note related links inside sentences remain inline at every width; report's standalone All notes stays sized.
- tests/browser/target-geometry.mjs: shared real-DOM measurements for tests and QA; identify inline exceptions from surrounding text rather than computed display, excluding explicit standalone navigation/list/button links. Strip sibling paragraphs from .next before classifying. Standalone targets must still be >=44x44px on mobile; prose must be inline, not silently excluded.
- tests/browser/polish.test.mjs: 13 routes x 7 widths; assert native inline prose; add privacy 390px test for display, real multiple line fragments and evenly spaced glyph lines. Expanded brief also checks inline exception separately.
- qa/polish-2026-10-31/audit.mjs: reuse measurements and capture privacy-google-data-390.png; evidence/docs will be refreshed before handoff.

Acceptance:
1. All sentence links remain native inline, including privacy/legal links, founder email, fallback email, Baton Rouge call/closing email and related-note sentences. Do not enforce 44px boxes on inline links (WCAG 2.5.8/2.5.5 inline exception, explicitly accepted by AXIOM).
2. Standalone links/buttons/controls retain >=44x44 mobile targets. No overflow at 360/390. Real document and element bounds, not screenshot edge appearance alone.
3. Privacy Google user data paragraph at 390px has normal continuous reading and even leading, with actual link text wrapping onto the surrounding lines. See qa/polish-2026-10-31/after/privacy-google-data-390.png and full privacy-390.png. Check native-size image if your tools support it.
4. Copy, claims, images, brand tokens, focus behavior, links, no-motion and no-transmission behavior unchanged. This revision has no HTML changes or dependencies.
5. node --test tests/ and npm run test:browser pass against locally built dist; exact Netlify offline build passes. Current observed totals: 49 tests, 10 browser tests; zero failures.

Tight repro: node --test --test-name-pattern='privacy policy links' tests/browser/polish.test.mjs
Full suite: node --test tests/ (dist exists now)
Browser suite: npm run test:browser (self-managed loopback server/browser)
Optional audit: AXE_SOURCE=/Users/percykeith/.npm/_npx/8003d8991b0d346b/node_modules/axe-core/axe.min.js PHASE=review-inline NO_SCREENSHOTS=1 node qa/polish-2026-10-31/audit.mjs

Try to break the target-classification coverage, sentence flow, caption links, related-note wrapping, mobile target overlap and overflow. Only flag reproducible defects caused by this revision. Current dist is deliberate local verification, and will be deleted before handoff. Evidence manifest/contact sheet/docs are being refreshed, so do not flag their temporary old counts during this review.
