Verdict: SHIP AFTER FIXES

A164 adversarial review for AXIOM
Repository: /Users/percykeith/axiom/worktrees/polish-2026-10-31
Branch: design/polish-2026-10-31
Baseline: cbe8a83
Scope: current working-tree implementation, including untracked polish tests and fixture. No product source was edited.

Blocking issue

1. [P2] Field-report closing CTA loses its label on hover.

Location: assets/firm.css:383, interacting with assets/firm.css:324. Affected markup: field-reports/insurance-client-care/index.html:68.

Reproduction: serve the built dist locally, open /field-reports/insurance-client-care/ at 1440px, scroll to the closing “Start an engagement” button, and hover it. The new general .button:hover rule changes its background to Stone, but the more-specific .remake .report .next .button rule keeps its text Stone. Playwright measured computed color and background-color both rgb(242, 238, 230) with :hover true; the 11px label disappears. The live-baseline CSS, substituted in memory on the same page, retained Stone text over rgb(21, 32, 58) on hover, confirming this is introduced by the polish.

Smallest fix: explicitly set the report CTA's hover text to Ink with a selector that matches or exceeds the existing report-specific color rule, for example .remake .report .next .button:hover. An in-memory browser-only override of that selector produced Ink text rgb(18, 19, 22) on Stone. No source fix was applied. Add a browser assertion for this hovered CTA; the current tests and local axe runs did not detect it.

Non-blocking issues

None substantiated.

What I verified

- Read DESIGN.md and the complete stylesheet, changed markup, new tests, build command, and called local composer/player surfaces as relevant.
- node --test tests/: 46 passed, 0 failed.
- Parsed and executed the exact [build].command from netlify.toml locally: exit 0. Did not invoke npm run build or deploy tooling. The initial parser attempt failed because the available Python lacked tomllib; a Node parser executed the exact command successfully.
- npm run test:browser against the freshly built dist: 7 passed, 0 failed. Test-managed loopback servers were used.
- Additional isolated Chromium checks covered all 13 routes at 360, 390, 430, 641, 768, 1000, 1024 and 1440px: 104 route/width combinations. Range.getClientRects text geometry showed no out-of-viewport text or document-width overflow, excluding intentionally offscreen unfocused skip links. The home composer was expanded during these checks.
- A separate target-rectangle intersection scan over those same route/width combinations found no overlapping visible interactive targets. The acceptance browser suite independently passed its >=44px mobile-target checks.
- Fresh local axe runs at 390 and 1440px found zero reported violations on the expanded home composer and the report at rest. Axe also reported no violations with the report CTA hovered, despite the equal computed foreground/background colors reproduced above; that automated result does not clear the hover defect.
- Existing browser tests exercised keyboard skip/disclosure/field focus, clipboard success/denial, long composer input, no-JavaScript native disclosure/manual template, and local-only transmission behavior.
- Independently checked all 13 preservation-fixture hashes against git show cbe8a83:<path>: no mismatches. Only stylesheet references and role="group" were excluded, as declared. Images, founder identity, copy, metadata, scripts and destinations remain unchanged in the reviewed HTML.
- Inspected the built payload: 43 files, with no qa/tests/DESIGN/PRODUCT/CHANGES/CONTACT-SHEET material included. Build allowlisting is unchanged.
- Both proof containers now use named group semantics rather than adding a duplicate Work landmark or labeling a generic div. No corresponding axe violation reproduced.
- Inspected supplied full-page screenshots and native-size mobile crops, including home, notes index, a note, report, privacy and the expanded composer. No additional concrete visual defect was substantiated.
- git diff --check cbe8a83: exit 0. Final read-only git inspection showed the same implementation change set.

Limits

- Browser execution was headless Chromium, not Safari/iPad or a physical device. No real accounts, client data, external services, installs, deploys, commits, pushes or contact actions were used.
- No linter script is configured in package.json; npm audit was not run because it requires network access.
- CONTACT-SHEET.png and CHANGES.md finalization were explicitly excluded from defect reporting. Current test dist was not treated as a defect and was left for the builder's stated cleanup.
- All reviewer-created browser/server instances were closed in finally blocks. The sole review artifact is this report; no product source changes were made.
