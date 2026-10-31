# Deploy Axiom — craft polish, October 31, 2026

**Status: UNSHIPPED / PREVIEW ONLY.** Local branch `design/polish-2026-10-31`, based on live commit `cbe8a830a9d2db0b664dfb6ce7d6c5abbdbe9977`. No merge, push, deploy, remote preview, account change, send, or live-data change was performed. Percy retains deploy approval after AXIOM's visual review.

## Design read and scope

Preservation polish of a serious firm's letterhead for business owner-operators. Existing hierarchy, supplied language, routes and imagery stay authoritative. Design variance 3 / motion 1 / density 3: restrained editorial composition, no animation, comfortable reading and clear decisions. Native CSS only; no new dependencies or assets.

`DESIGN.md` governs. The task explicitly supersedes its old founder-placeholder restriction: the existing supplied black-and-white photo and **P. K. Stewart** remain. Ink `#121316`, Stone `#F2EEE6`, Brass `#8C7350`, self-hosted Cinzel and the existing system-serif stack are unchanged. Existing secondary Stone and muted neutral tokens remain; Brass is now reserved for rules rather than low-contrast small text.

## Shared page family

| Before | After | Reason |
| --- | --- | --- |
| 1080px legacy frame versus 1280px remake frame | One 1280px outer letterhead frame; 40px desktop and 22px phone gutters | Wordmarks, navigation, section rules and footers now share the same alignment across pages. |
| Single hairline masthead, varying mark and CTA geometry | Consistent 80px desktop / 72px mobile masthead, an Ink thick rule paired with a Brass hairline, 116px / 92px wordmark, and minimum 46px masthead targets | A recognizable letterhead with exact optical alignment; the top-right CTA remains clear without crowding the mark. |
| Small navigation links and no current-page distinction | Aligned nav targets, one-line desktop CTA, understated underline on the existing Notes current-page link | Improve navigation clarity without changing any label or destination. |
| Uneven Cinzel weights, tracking and leading | More restrained display weights, clearer leading, balanced headings where supported, and safe long-word wrapping | Prevent dense capitals, awkward orphan words and narrow-screen overflow without editing copy. |
| Smooth scrolling on legacy pages | Immediate scrolling across the entire polished family, including ordinary motion preferences | Follow the contract's no-motion rule, not only reduced-motion preferences. |
| Small secondary links and an audio seek rail of 20px | Visible mobile links, controls and disclosure targets measured at least 44×44px; primary buttons 52px tall | Make real contact, reading and playback targets usable by touch. Hidden descendants of closed disclosures are excluded from measurements. |
| Inconsistent outline inheritance, including a light composer nested in an Ink band | Visible Ink focus on Stone; Stone focus on Ink; the nested composer explicitly restores Ink focus | Keep keyboard focus identifiable against the actual local surface. No animated focus or hover treatment. |
| Legacy Navy hover fills | Ink/Stone hover and active feedback for polished buttons; current form surfaces and placeholders use the shared neutral palette | Keep interactions inside the letterhead language and preserve readable states. |
| Footer columns could force long text beyond its available grid track | Flexible, zero-minimum grid tracks; deliberate tablet and phone reflow; readable multiline contact links with measured targets | Stop overflow at the source, never by hiding the document's right edge. Footer wording and destinations are unchanged. |
| Mixed stylesheet cache versions | Every in-scope route loads `firm.css?v=4` | Avoid returning to a stale version while moving between pages. |

## Home `/`

- **Hero:** recalibrated the Cinzel headline's weight, size, leading and wrapping; tuned the location line, paired-rule spacing, serif introduction, button spacing and desktop column gap. The artifact retains its original 4:3 proportions, colors, pixels, alt text and native-resolution link. The phone layout puts the complete image after the actions with a readable caption.
- **Proof strip:** lighter, lining/tabular Cinzel numerals, more consistent cell inset and vertical rhythm, and aligned evidence links. The strip is a named group rather than a second landmark called “Work”; all three observations and links are unchanged.
- **Work:** aligned editorial article headings and body starts, increased story-body readability, aligned the available metric/link endings, and made the tablet articles full-width editorial rows before collapsing to a single reading column on phones. No text is hidden or truncated; the second story still has no invented metric or link.
- **Limits:** cleaner heading leading, consistent cell padding, and a lighter closing rule. All three authority states remain in the supplied order.
- **Method:** a calmer, balanced thesis; tighter relationship between thesis, explanation and steps; consistent step spacing and clearer type. Small step/section numerals use a contrast-safe neutral instead of Brass. The steps reflow to two columns at intermediate widths and one column on phones.
- **Founder:** aligned the text column to the section heading, gave the supplied full photograph a quiet Ink bottom rule and breathing room, and tightened the portrait-to-biography transition on phones. No crop, new image or name change. The original email, LinkedIn and GitHub links remain.
- **Findings:** shared note-number/title/description columns, readable line spacing, contrast-safe small identifiers and an accessible All notes target.
- **Closing band and brief:** consistent heading/action spacing; explicit open, hover and keyboard-focus states for the native disclosure; a better-spaced light composer, taller textareas, legible placeholders and borders, full-width status feedback, and a more readable manual fallback. The brief still does not submit, store, transmit or send anything. Actual local clipboard success, denial/manual fallback, long input and no-JavaScript disclosure were exercised.

## Notes index `/notes/`

- Replaced the broad secondary-Stone page fill with primary Stone so it reads as the same firm's publication index, not a detached legacy panel.
- Recalibrated the title and introduction, reduced the excessive heading-to-list gap, and brought the top rule into the shared rhythm.
- Set a deliberate number / title / description alignment on desktop; kept the identifier separate from the reading column on phones. All seven entries, their ordering, descriptions and destinations remain exact.
- Existing “Engagements”, “Notes” and “Contact” labels remain locked; only their geometry and current-page styling changed.

## Every note article

Applies to `/notes/one-front-door/`, `/notes/one-tempo/`, `/notes/the-gap-is-the-user/`, `/notes/the-outcome/`, `/notes/the-gathering/` and `/notes/left-foot-right-foot/`:

- One centered reading measure, consistent article top/bottom margins, calmer title type, clearer italic deck and byline rhythm, and consistent paired-rule spacing.
- More deliberate paragraph, list, section-heading and related-reading spacing. Titles wrap naturally rather than being clipped or rewritten.
- Existing diagrams and engravings retain their full proportions. Their frames now match Stone, have consistent padding, and step back inside the reading width on tablets and phones. Captions have a stable type size and leading.
- **The Outcome / The Gathering:** plain Wikimedia credit URLs now wrap within the captions. These were genuine baseline document-overflow defects at 360/390/430, not a screenshot clipping illusion. Credits remain verbatim.
- **One Tempo:** code blocks wrap long source lines without changing their contents; result tables fit the phone reading width with clear headers and cell padding. No column or evidence limit is omitted.
- Related-note links have usable targets while preserving their supplied wording and destination.

## Field report `/field-reports/insurance-client-care/`

- Matched the shared masthead and article typography; gave the long supplied title a deliberate measure and line height rather than a broad wall of capitals.
- Separated header, metric row, artifact and narrative with a clearer vertical rhythm. Metrics are a properly named group, resolving the existing generic `aria-label` ambiguity without changing its label.
- The complete 2400×1800 evidence PNG remains unaltered, uncropped and directly inspectable. It occupies the report's wider document measure; the narrative retains a narrower reading measure.
- Improved subhead, paragraph, evidence-limit list and closing-link spacing. In particular, **“No enrolled client has received a check-in yet.”** remains present and prominent.
- Zero automated accessibility violations or incomplete checks on this route at both 390px and 1440px, in Chromium and WebKit.

## Privacy `/privacy/` and Terms `/terms/`

- Applied the same letterhead frame, article measure, title, effective-date/byline, paired rules, section rhythm and footer geometry as the publications.
- Long policy links wrap within the available width and have measured phone targets.
- All legal wording, effective dates, provider descriptions and links are unchanged. No legal judgment or policy rewrite was made.

## Baton Rouge `/baton-rouge/`

- Matched the shared masthead, hero scale, type leading, paired rules and section spacing. The line plate and example record use the shared Stone surface.
- Reflowed the hero and split sections at the same intermediate breakpoint; prevented the outlined phone-number plate and closing number from exceeding narrow widths.
- Increased the audio seek target from 20px to 44px while leaving the visible rail fine; preserved play/pause feedback and the native no-JavaScript audio fallback.
- Made dark step labels and the closing location label contrast-safe. Improved closing-band and phone-number spacing without changing copy or placing any call.
- Real recording playback, pause, keyboard seek and FAQ disclosure were exercised locally. The test server now supports byte ranges so seeking is tested against an HTTP behavior equivalent to a static media host, rather than a misleading chunked 200-only fixture. No production audio JavaScript was changed.

## Historical success `/success.html`

- Replaced the legacy green/sans stylesheet with the existing firm stylesheet, retaining all original “CLOSED” language and `noindex,follow`.
- Styled the existing notice as a quiet Stone document with Cinzel title, contrast-safe closed label, Brass hairline, comfortable reading measure and a clear return link.
- No new campaign, submission flow, brand copy or status claim was added.

## Regression coverage and evidence

- Original content/markup fingerprints are frozen from `cbe8a83` for all 13 in-scope routes. The check excludes only stylesheet references and the added `role="group"` semantics; everything else (copy, labels, metadata, assets, links and scripts) is locked. **No typo corrections were made.**
- New browser coverage checks every route at **360, 390, 430, 768, 1000, 1024 and 1440px** with fonts loaded. It checks document width and actual rendered element bounds, mobile target geometry, ordinary-preference no-motion behavior, keyboard skip/disclosure/focus, long expanded brief input, local audio and questions.
- `node --test tests/`: **48 passed, 0 failed**. The Node version recursively includes browser tests; an already-built `dist/` is therefore needed for that exact command.
- Exact `netlify.toml` build command: passed. Also ran **`CI=1 npm run build -- --offline`** successfully: Netlify 37.4.0 executed that same command and packaged the two existing functions. Its log's default “production” context is a configuration label, **not a deploy**. No remote service was contacted or deploy created.
- `npm run test:browser`: **9 passed, 0 failed**, against isolated loopback-served `dist/`. Recording play/pause/seek additionally passed **10 of 10** repeated runs.
- Final Chromium visual/geometry audit: **91 route-width checks**; zero document/element overflow, zero visible mobile targets below 44px, zero console/page errors, zero failed resources, zero external requests.
- Additional WebKit audit: **39 route-width checks** at 360/390/1440 with the same clean geometry, targets, resources and console results. WebKit's native audio produces same-origin blob URLs; these are local, not external services.
- **axe-core 4.14.0**, WCAG A/AA + WCAG 2.1 A/AA + best practices: home and field report at 390/1440, in Chromium and WebKit. Final result: **zero violations and zero incomplete checks**. Baseline home had nine failing contrast nodes plus a duplicate landmark; those are resolved. This is an automated check, not a screen-reader certification.
- Before and after full-page PNGs: `before/` and `after/`. Required five-page comparisons at both 1440 and 390 are included; additional page-family screenshots are retained for review. `CONTACT-SHEET.png` contains all **20** required before/after images, uncropped. Open individual PNGs for native-size reading.
- Local axe injection was QA-only from an already-installed cached tool, not a site dependency or shipped script. No package or lockfile changed.
- `qa/` is the task-required review evidence folder, intentionally excluded from the public build. No new public asset or route folder was added, so the build copy chain remains unchanged. Shipping QA would contradict DESIGN.md's explicit internal-artifact exclusion.

Logs: `node-tests.log`, `netlify-offline-build.log`, `browser-tests.log`, `audit-chromium.log`, `audit-webkit.log`; structured results: `before/audit.json`, `after/audit.json`, `webkit/audit.json`.

## Held for Percy — copy or contract decisions

1. **Navigation vocabulary differs:** home/report say “Work” and “Start an engagement”; older pages say “Engagements” and “Contact”; Baton Rouge has its call-oriented navigation. The labels could be unified in a separate approved copy pass; this polish does not rename them.
2. **Privacy wording mentions submitting a form on this site**, although the current brief is explicitly local-only. That is legal copy and remains untouched.
3. **One Front Door still says “Notes · 01 of 3”** while six notes are now published. It is a supplied label; no editorial change was assumed.
4. **Proof observations are date-bound:** Oct 29, enrolled-client counts, four minutes, 96 failures, 231 outcomes and 155 verifications remain supplied historical observations. No internal ledger was read and no figure was refreshed. AXIOM must re-verify any current claim before publication, as DESIGN.md requires.
5. **Report title length:** a shorter title would simplify phone composition, but shortening it would rewrite approved copy. All words remain.
6. **Repeated captions/legacy social assets:** no text embedded inside existing images was recreated or restyled; no new images, font files or share cards were generated.
7. **Motion, decorative effects and alternative colors:** no entrance animations, sticky-scroll effects, gradients, shadows, rounded cards, network fonts or new broad Brass/Navy surfaces were added.
8. **Closed campaign archive:** its legacy presentation remains untouched, as DESIGN.md requires preserving the archive. The success route was in the explicit polish scope; reopening or redesigning the archived campaign was not.

## Limits and handoff

- Local preview evidence only. No hosted preview exists; none was requested or deployed.
- No physical phone, VoiceOver session or live contact handoff was exercised. Chromium and WebKit were isolated headless instances; no shared GUI or device was used.
- The 430px case was also verified by exact document and element geometry; the final run showed no real overflow or false-clip discrepancy.
- All in-scope pages received shared improvements; copy differences were deliberately not disguised as design changes.
- Safe rollback is the original baseline `cbe8a830a9d2db0b664dfb6ce7d6c5abbdbe9977`. Production was never changed.
- Adversarial codereview found **one P2 defect**: a more-specific legacy report rule kept the CTA text Stone while the new hover background became Stone. The reviewer reproduced it with computed colors and confirmed it was new. Added a real hover-and-press regression test, observed it fail, then added explicit report CTA hover/active colors and re-ran the tests successfully. Rest/hover/pressed labels now retain Ink/Stone contrast. Evidence: `report-hover-red.log`, `report-hover-green.log`, `adversarial-review-1.log` and `REVIEW-Axiom-deploy-design-polish-2026-10-31.md`. No other concrete defect was substantiated. This was a two-selector fix; a second codereview pass was not needed under the two-pass rule. The reviewer also independently found no text overflow or overlapping targets in 104 route/width checks.
- Cleanup verified: `dist/`, this run's `.netlify/` build cache and default test screenshots under `qa/remake/` were removed. No matching local test, audit or reviewer process remained. Audit/test browsers and loopback servers closed in their teardown paths. Evidence: `CLEANUP.json`.
- AXIOM visual review comes next; Percy alone approves a later deploy.
