# Axiom Site Design Contract

## Mode and screen job

A firm's letterhead, stone and brass door plate. Explain the work through observed records, show where authority stops, and let the owner prepare a brief without submitting anything to the site. Static HTML/CSS, no motion, no dashboard chrome.

## Primary action

`Start an engagement` in the masthead and hero links to `#contact` (the existing Contact destination). The closing band repeats the action as a native disclosure that opens the local brief composer. Copying is local; email is an explicit visitor choice. No hosted form, transmission, storage, analytics, or automatic send.

## Content hierarchy — remake 2026-10-30

1. Locked headline: “Nothing in your business waits on you to remember it.”
2. Approved subhead, engagement/call actions, and the approved anonymized artifact plate.
3. Ink proof strip: three Cinzel numerals, each with a label and evidence link.
4. Work: three editorial story cards with the supplied roles, results and links.
5. I · Limits of authority, ahead of Method.
6. II · Method, including the former governance headline and five steps.
7. III · Founder, no photo or silhouette until supplied.
8. IV · Findings: Notes framed around what was found, plus All notes.
9. V · Closing engagement band, local brief disclosure, and contact footer.

Copy is supplied, not authored by the builder. No paraphrasing, shortening, invented claims, or publication of HOLD strings. Claim IDs, editorial flags, internal ledgers and paths never enter the public payload. The preview retains `{FOUNDER}` until Percy supplies the name; this is a production-review gate, not a name choice.

## Brand standard

- Roman inscription capitals and restrained editorial proportion: a firm, not an AI startup.
- Wordmark: existing outlined Cinzel AXIOM SVG; monogram: the existing single A.
- Ink `#121316`, Stone `#F2EEE6`, Brass `#8C7350`. Brass is for rules and small marks, never body copy or broad fills. Navy is legacy only, not a new surface color.
- Cinzel display and numerals, self-hosted with the SIL OFL license beside it. Quiet system serif body text. No network fonts.
- Square edges, paired thick/thin rules, generous margins, no shadows or decorative widgets.
- Never: robots, brains, circuits, glow, neon, gradients, green accents, rounded SaaS grids, autoplay, animation, smooth scrolling, fake metrics, prices, generic “Book a call” language, or hidden collection.

## Patterns

### Proof strip

`.proof-strip.dark` is a single Ink band, not separate KPI tiles. `.proof-grid` has three equal columns with fine dividing rules. Each `.proof-cell` contains a large `.proof-number` set in Cinzel, a complete supplied label, and a plainly underlined link. The numbers are date-bound observations, not performance promises. Re-verify counts on publish day through AXIOM; the builder does not read the internal ledger.

On mobile all three cells stack, labels wrap naturally and links retain a 46px minimum target. No fixed heights, clipped text or horizontal carousel. The report metric row reuses the typography on Stone without inventing links.

### Story card

`.story-card` is an editorial article, not a dashboard or clickable tile. Three columns on wide screens, stacked below 1000px. Each has an Ink top rule, Cinzel role, full supplied result, and only the approved metric/link when available. Do not truncate copy, equalize by hiding text, or fabricate a field report. Card 2 has no link and its HOLD-marked metric line is omitted.

### Document plate

`.document-plate` displays the approved 2400×1800 PNG intact, without crop, distortion, recoloring, recreation or invented rows. It is the sole evidence/dashboard-like surface, not a UI to interact with. Exact caption: “Example record. Client details removed.” Use the supplied descriptive alt text and explicit dimensions. The image links directly to the full-resolution local PNG for inspection.

The homepage places the plate to the right of the hero and below the buttons on mobile. The field report gives it the full article width, with reading copy in a narrower column. It also serves as the local OG/Twitter image; social alt uses the supplied caption.

## Field report

Canonical route: `/field-reports/insurance-client-care/` (the task's route overrides the deck's suggested Notes URL). Static article, Field Report 02, supplied headline/byline, three metrics, artifact, The gap, What runs, What waits for her, What isn't proven yet, and engagement/back links. Preserve all evidence limits visibly, especially that no enrolled client has received a check-in yet. Include canonical, description, OG/Twitter, favicon and sitemap. Draft preview is not approval to publish the report.

## Responsive and accessible behavior

- Verify 1440px desktop and 390px mobile, including the expanded brief; content must fit without hiding overflow.
- Hero and story columns stack. The plate remains uncropped and opens at native resolution.
- Mobile masthead retains the top-right engagement CTA without overlapping the wordmark.
- Semantic headings, skip links, native disclosure, labeled fields, visible keyboard focus, and live clipboard status.
- No JavaScript: native disclosure and the complete manual brief template still work.
- Clipboard denial: the filled manual template is focused and remains copyable. No persistence or network requests are added.

## Preserved surfaces and acceptance

- Existing Notes, Baton Rouge, Privacy, Terms, archive, success route and signed Meta webhook remain intact.
- Archive remains CLOSED and `noindex,follow`; the legacy application function remains server-closed (410).
- CSP stays self-only, with no inline code, remote fonts or unsafe-inline allowances.
- Tests cover section order, three linked proof cells, three stories, supplied copy, HOLD omission, report metadata, sitemap/build payload, real-browser links, 390px overflow, clipboard success/denial, and no-JS use.
- Only `dist/` is deployed. No copy deck, claims ledger, tests, source rules, review briefs or internal artifacts enter that payload.
- A160 ends at draft preview plus AXIOM review. Percy approval is required before any main push or production publication.