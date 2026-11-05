# A230 page by page: what moved

Branch `design/axioma-terminal` (worktree `~/axiom/worktrees/axioma-terminal`). Draft preview: https://6aebc6387b9ab52ea526c910--axiom-deploy.netlify.app (Netlify draft, `noindex`, production untouched).

## Homepage `/`

| Before (live) | After (branch) |
|---|---|
| Stone and brass letterhead, Cinzel capitals, centered | Axiōma night terminal: IBM Plex Mono body, Geist headlines, Cormorant italic for the axiom |
| Masthead: AXIOM wordmark, Work / Limits / Method / Notes, Start an engagement | Bar: `deploy@axiom`, `/work /limits /method /notes`, Start an engagement. Phones keep /work, /notes and the button |
| Hero: kicker, locked headline, lede, two buttons, check-log image on the right | Hero: `whoami` prompt, same locked headline with a block cursor, same lede, same two buttons. On the right, a new "in plain English" panel: what it handles, what waits for you, where it runs. No image |
| (none) | New: the gate band, braille caduceus and the axiom "Nothing sends, spends, or spins without the one who holds the gate." |
| (none) | New: "Where an agent stops and asks", the draggable Hermes medallion story. Text makes room, Axiōma phrases light red/yellow/green/pale gold on contact, key below. New copy from our own work, no client story |
| Proof strip: Oct 29 / 4 min / 96 | Ledger panel: 231 outcomes on record, 155 independently verified, 96 failures caught and recovered. "Oct 29" and "4 min" cells removed (both were client stories) |
| Work: three story cards (insurance agency, service-business owner, stuck client agent) | Work listing: escalation-desk (public code), client-care (system description, links to the field report), hermes-tripwire (public code), handydandy. No client story told, no client named |
| Limits of authority (I) | Same three limits, same words, as one permission table |
| Method (II), five steps in Roman numerals | Same thesis line, lead and five steps, numbered 01 to 05 |
| Axiom Explained video band | Kept: same poster, caption, click-to-load, nocookie |
| Founder (III) with photo | Kept: same photo, words, email, LinkedIn and GitHub |
| Findings (IV), three notes and All notes | Kept: same three notes and All notes |
| Contact (V): brief composer, call button | Kept: same composer, same fields, copy and email, same call button, no-JS template |
| Footer: wordmark, address line, links | Same links (email, phone, Instagram, GitHub, Notes, Baton Rouge, Archive, Privacy, Terms), "The gate stays with you.", credits for Pretext (MIT), the herm (CC0) and the typefaces (OFL) |
| Title, description, canonical, Open Graph, Twitter | Same. Added `og:site_name`, dark theme-color, and a ProfessionalService JSON-LD block (address, phone, email, founder, profiles) |

## Inner pages

No copy changed on any inner page. Each loads one extra stylesheet, `assets/axioma/pages.css`, after the old one, which turns the letterhead into the night palette and the same type. Diagrams and the check-log record keep a light plate so their linework stays readable.

| Page | What moved |
|---|---|
| `/notes/` and the six notes | Night palette, Geist headings, mono body. Words, figures, links unchanged |
| `/field-reports/insurance-client-care/` | Same; the record image keeps its light plate |
| `/baton-rouge/` | Same; the call recording player and the questions still work (browser test passes) |
| `/privacy/`, `/terms/` | Same; links inside sentences still wrap inline on phones |
| `/success.html` | Same |
| `/archive/two-business-evaluation-2026-09/` | Unchanged on purpose: closed, `noindex`, keeps its historical look |
| `googlea9420335e9b52691.html`, `robots.txt`, `sitemap.xml` | Unchanged, all 200 on the preview |
| `/api/meta/webhook`, legacy application function | Unchanged; the webhook answers the preview the same way it answers production (403 to an unsigned GET) |

## New files

- `assets/axioma/axioma.css` (homepage), `assets/axioma/pages.css` (inner pages), `assets/axioma/home.js` (loads the story engine only near the story, never for reduced motion), `assets/axioma/story.js` (engine bundle with Pretext), `assets/axioma/medallion.webp`, `assets/axioma/fonts/` (9 woff2 files plus three OFL licenses), `assets/axioma/LICENSE-Pretext.txt`
- `src/axioma/story.js` and `src/axioma/README.md` (engine source and rebuild steps; not published)
- `netlify.toml`: one addition to the copy chain, `cp -R assets/axioma dist/assets/axioma`. CSP and headers unchanged
- `DESIGN.md` rewritten as the Axiōma contract; `PRODUCT.md` and `README.md` updated
- Tests updated for the new homepage, plus two new ones (story markup and signals; inner pages wear the shell, archive does not)
