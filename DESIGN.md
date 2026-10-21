# Axiom Site Design Contract

## Mode

Permanent product homepage. Explain the operating model and make a bounded first contact easy without pretending a public form is an operating system.

## Screen job

Let an operator understand how a Deploy Axiom lane works: the trigger enters, context is assembled, a draft is held for human judgment, and the resulting disposition is recorded for the next pass.

## Primary action

Start with `OPERATE` in Instagram DM. The local lane mapper prepares, but never sends or stores, that brief.

## Content hierarchy

1. Exact thesis: “We don't sell automation. We deploy operational agents.”
2. One agent / one lane / one measurable outcome.
3. Continuity problem and simulated operating model.
4. Deployment contract and example jobs.
5. Permission boundaries and local-only lane mapper.
6. Current Instagram contact lane and closed-campaign archive.

## Brand standard (Percy, 2026-10-11; replaces the earlier green canon)

First line: Axiom should feel like hiring a firm. An agency. Hired authority.

- Source: Rome. Inscription capitals (Trajan's Column), stone, proportion, columns and arches. The Aurelius temper: self-command, duty, restraint. Authority does not shout.
- Logo: a wordmark first. "AXIOM" in capitals, widely tracked, drawn as outlined SVG paths (no live font). A single Roman "A" is the avatar/monogram and must read at 40px inside a circular crop.
- Logo source files and the current options: `~/Desk/Axiom/Brand/2026-10-11-wordmark/` (build.py regenerates them). Chosen mark (Percy, 2026-10-11): option C's form set in option A's typeface. "AXIOM" in Cinzel at weight 800, tracking 0.28em, Ink on Stone or Stone on Ink, no rules. Avatar: the single Cinzel A, no frame. Files: `svg/FINAL-*.svg`.
- Never: robots, brains, circuit lines, glow, neon, gradients, or anything that reads as an AI startup or a toy.

## Visual language

- World: a firm's letterhead and its brass door plate. Not a product dashboard, not a startup.
- Color: two colors per surface, at most three in the system.
  - Ink `#121316` (near-black) and Navy `#15203A` (deep navy) carry text and fields.
  - Stone `#F2EEE6` (off-white travertine) is the paper.
  - Brass `#8C7350` is the single muted accent, used only for hairline rules and small marks, never for body text or large fills.
  - The mineral green and signal green are retired. Remove them when the site is next reskinned.
- Typography: Cinzel (Roman inscription capitals) is the display face, matching the logo. Body text stays a quiet sans or serif at reading size. Fonts must be self-hosted SIL OFL files with the license committed beside them; no network font requests. Nothing rounded or playful.
- Structure: editorial rules (paired thick/thin lines, like an entablature), generous margins, centered or strictly left-aligned columns. Proportion over decoration.
- Motion: none on the permanent homepage. The model has accessible static meaning and respects reduced-motion preferences.

## States

- Contact: Instagram DM opens only when the visitor elects to follow the link.
- Mapper: browser validates all three fields; clipboard copy either confirms locally or supplies a visible fallback message.
- No JavaScript: an `OPERATE` template is present in the page's `noscript` content.
- Archive: campaign is explicitly CLOSED, has `noindex,follow`, and offers no enabled application.
- Webhook: signed Meta webhook and its isolated function behavior are unchanged.

## Responsive behavior

- Desktop: hierarchy uses wide editorial spacing; state and permission sequences run across the page.
- Mobile: sections stack; touch targets remain at least 46px; the state sequence becomes vertical rather than overflowing.

## Forbidden defaults

Autoplay video, external font dependencies, rounded SaaS card grids, pricing, fake metrics, client proof without evidence, cyberpunk, robot imagery, brain or circuit motifs, glow effects, neon, gradients, green accents, generic “Book a call” conversion, open-campaign language, hosted application forms, and hidden data collection.

## Acceptance criteria

- Homepage contains the exact thesis and current Instagram contact lane.
- Simulation label, human Hold, and no-JS meaning are present.
- Example lanes are clearly examples, not deployment claims.
- Mapper is local-only, secret-safe, clipboard-based, and has a visible fallback template.
- Metadata, canonical URL, favicon, OG asset, sitemap, robots, CSP, and build output are present.
- Archive is closed and excluded from search indexing; release history and a server-closed legacy route remain preserved.
