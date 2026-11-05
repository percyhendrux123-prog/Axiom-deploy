# deployaxiom.com becomes Axiōma: release note

**Status:** built and checked on a branch. Nothing is live. Production still shows the stone letterhead.
**Look at it:** https://6aebc7c038b7ecd8fb722edd--axiom-deploy.netlify.app (a private Netlify draft; search engines are told to ignore it).
**To ship:** say the word. AXIOM fast-forwards `main` to `design/axioma-terminal`, Netlify builds it, and AXIOM confirms the live site and checks it on the test phone. One revert undoes it.

## What a visitor sees now

- **Homepage.** The Phase 1 terminal look, unchanged in palette and type. Your locked headline stays first, with the same line under it and the same two buttons (Start an engagement, Call). Beside it, a small "in plain English" box says what Axiom handles, what waits for the owner, and that it runs on the owner's own computer and accounts. A non-technical owner gets the point before reading anything styled as code.
- **The medallion.** Below the axiom, "Where an agent stops and asks" tells a short story from our own work. Drag the Hermes medallion through it and the words move out of its way. Phrases light in their Axiōma color as it passes: pale gold for "about a dozen" agents, red for "completing a live payment", yellow for "could text the same person twice", green for "9 passing tests". Arrow keys move it too. With motion turned off, or no JavaScript, the story sits still with every phrase lit.
- **Everything else on the homepage** keeps its words: the ledger numbers, Limits of authority, Method, the Axiom Explained video, Founder, Findings, and the brief composer.
- **Inner pages** (notes, field report, Baton Rouge, privacy, terms) keep every word and now wear the same night look, so clicking through doesn't land you back in the old design. The closed 2026-09 archive keeps its old look on purpose.

## Checks (measured, not assumed)

| | Before (live design) | After (branch) |
|---|---|---|
| Lighthouse, homepage on a phone | 95 performance, 100 accessibility, 100 best practices | 100, 100, 100 |
| Largest paint, homepage on a phone | 3.0 s (the check-log image) | 1.1 s |
| Lighthouse, homepage on desktop | 100 / 100 / 100 | 100 / 100 / 100 |
| Lighthouse, inner pages on a phone | 100 / 100 / 100 | 100 / 100 / 100 (largest paint 0.9 s to 1.05 s, from loading the new fonts) |
| axe accessibility errors, 14 pages x desktop and phone | 0 | 0 locally and 0 on the Netlify preview |
| Security policy (CSP) | self-only | unchanged; 0 violations on the preview with Netlify's real headers |
| Every old URL | 200 | 200 on the preview (all pages, sitemap, robots, Google verification file) |
| Repo tests | 41 + 10 browser | 42 + 10 browser, all passing |
| Medallion drag | (new) | 59.3 frames a second on the mini's screen; the layout work takes 0.1 ms a frame |

Lighthouse and the drag timing were measured on the first preview build. The current preview differs only in where the video's play button sits (moved off a diagram label on phones); axe, the security policy and every URL were re-checked on it.

Lighthouse SEO reads 92 on both versions. The one failed item is its robots.txt check, which our security policy blocks inside the test browser. Google's crawler is not affected, and nothing changed there.

## Your calls before it goes live

1. **"Axiōma is given away: the spec is CC0 and the code is MIT."** That matches the spec draft (CC0 1.0 text, MIT code), but the spec is still private, so a visitor can't find it yet. Publish the spec before go-live, or I take the sentence out until it is.
2. **The ledger numbers (231 / 155 / 96)** are copied from the live site. The scorecard script that re-checks them fails right now ("Invalid numeric value: 'no'" in the ledger), so I couldn't re-pull them. They need a fresh count on ship day.
3. **Removed from the homepage under "no client stories":** the "Live since Oct 29" insurance proof, the "4 min" stuck-agent story, the service-business owner card, and the check-log picture in the hero. The field report itself is still live and linked from the work list, and the check-log is still the picture shown when the link is shared. Say the word if any of them should come back.
4. **The boot screen** from Phase 1 isn't on the business site. On a sales page it delays the five seconds that matter. It can come back as a once-a-visit option.
5. **New words you haven't seen:** the medallion story, the "in plain English" box, the section titles "Where an agent stops and asks" and "What our own records show", the line under the axiom ("the rule every Axiom agent works under"), the ledger footnote ("counts from our own company's records, not client data"), and "What we have built and run. Public code is linked." in Work. The four work entries are adapted from the approved Phase 1 page (client details taken out). Everything else is your existing copy.

Details: `PAGE-BY-PAGE.md` (what moved, page by page), `screens/` (desktop and phone, before and after, plus the drag shots), `data/` (raw Lighthouse, axe and timing results).
