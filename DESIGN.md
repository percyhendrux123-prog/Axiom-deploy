# Axiom Site Design Contract

## Mode and screen job

The Axiōma terminal (A230, Percy's choice after seeing the A227 Phase 2 build: "that's Axiom ... this isn't anything to hide"). A night terminal that a non-technical owner still understands in five seconds: the headline and a plain-English panel say what Axiom does, what waits for the owner, and where it runs. The terminal styling is the frame, never the explanation. Static HTML and CSS; one deferred script upgrades the story to its interactive form.

The previous contract (stone and brass letterhead, Cinzel, no motion) is in git history at `5327f8f`. Inner pages keep that structure and copy and wear the night shell (`assets/axioma/pages.css`, loaded after `firm.css`).

## Primary action

`Start an engagement` in the bar, the hero and the contact section, all to `#contact`; the hero pairs it with `Call (225) 635-8671`. The contact section opens the local brief composer (native disclosure). Copying is local; email is an explicit visitor choice. No hosted form, transmission, storage, analytics or automatic send. One label per intent.

## Homepage hierarchy

1. Bar: `deploy@axiom`, `/work /limits /method /notes`, `Start an engagement`. Phones keep `/work`, `/notes` and the action.
2. Hero: `whoami` prompt, the locked headline with a block cursor, the lede, two actions; beside it the `# in plain English` panel (what it handles, what waits for you, where it runs).
3. The gate: braille caduceus and the axiom, "Nothing sends, spends, or spins without the one who holds the gate."
4. Story (`#story`): "Where an agent stops and asks", the draggable Hermes medallion, text that makes room, Axiōma signals that light on contact, and the signal key.
5. Ledger (`#proof`): 231 / 155 / 96 from our own operation, never client data. Re-pull on publish day.
6. Work: a listing (escalation-desk, client-care, hermes-tripwire, handydandy). Systems are described; clients are never named and no client story is told.
7. Limits of authority, Method, the Axiom Explained video band (click-to-load), Founder, Findings, Contact, footer with credits.

## Brand standard

- Palette (Axiōma night): night `#0E0F11`, panel `#141518`, rule `#2A2C31`, dim `#8A8E96`, text `#D9DADC`, strong `#F0F0EE`. White carries the page.
- Signals only: red `#FF453A` stop, yellow `#FFCC00` caution, green `#30D158` go, pale gold `#EADFB8` whisper. Color means state, never decoration, and every signal carries a second cue (bold solid / wavy / dashed / dotted underline) plus a spoken word for screen readers.
- Type, all self-hosted with their SIL OFL licenses: IBM Plex Mono (body, prompts, UI), Geist (display), Cormorant Garamond italic (the axiom and the method line only). Latin and Latin Extended subsets (Axiōma needs ō).
- Square edges, 1px rules, one bordered panel per idea, no shadows, no gradients, no glow, no rounded SaaS cards, no fake dashboards. Prompts are decoration (`aria-hidden`); every section has a plain-English heading.
- Axiōma is given away: say "the spec is CC0 and the code is MIT" wherever it is named.
- Never: prices, client names, client stories, invented metrics, emoji, hype, autoplay, smooth scrolling, boot screens on the business site.

## The medallion story

- Markup is the source of truth: each paragraph on one line; marked phrases are `<span class="ax ax-LEVEL" data-axioma-level="LEVEL">…<span class="ax-sr"> (WORD)</span></span>`.
- No JS or reduced motion: static float with a circular `shape-outside`, every phrase lit, nothing focusable or moving.
- Motion allowed: `assets/axioma/home.js` loads `assets/axioma/story.js` when the story nears the viewport. The flow stays in the DOM as screen-reader copy; an `aria-hidden` word layer is drawn; the medallion becomes a round button (drag, arrow keys, Shift, Home) with a 2px focus ring. Pretext (MIT) does the line breaking. Source and rebuild steps: `src/axioma/`.
- Credits stay in the footer: Pretext (MIT), herm of Hermes (Wikimedia Commons, CC0), the three typefaces (OFL).

## Motion: one conductor (A238)

- `assets/axioma/home.js` holds the motion conductor: one scheduler on one animation loop that owns every accent on the homepage. The story engine runs its drag frames on that same loop. The loop sleeps when nothing changes.
- One accent at a time. The section under a reading line 40% down the screen is the one being read; when it changes, the running accent settles first (300 ms at most), then the cursor hands over, then that section's accent plays after a 280 ms dwell, with 120 ms of stillness between accents.
- The accents, each with a cue and an end: the terminal cursor moves to the prompt of the section being read and blinks two or three times (1.1 s cycle), then holds; the story's four signals light once in reading order on first arrival (420 ms each); the ledger counts up once on first arrival (640 ms, ease-out, from a dimmed zero; screen readers hear the real number throughout); the medallion ring breathes (1.4% scale, 6 s, on the compositor) only while the story is being read and the medallion is at rest. The ring turns and the face tilts only while the medallion travels; no idle spin.
- Dragging or keying the medallion holds every accent; the ring breathes again 1.2 s after it rests. Pretext reflow and lighting on contact are unchanged.
- Opacity and transform only (the signal lights reuse the story's existing color state). Nothing flashes faster than once a second. Nothing is baked into the HTML: with no JavaScript or with reduced motion, the page is complete and still (cursor solid, numbers final, story static).
- Proof: `tests/motion.test.mjs` and `tests/browser/motion.test.mjs` (accents never overlap, every accent ends, one cursor on screen, layout shift 0 once motion runs, reduced motion off, drag holds accents).

## Responsive and accessible behavior

- Verify 1440 and 390 (and the browser suite's 360 to 1440 sweep): no horizontal overflow; standalone targets at least 44px; links inside sentences stay inline.
- Skip link to `#main`, one `h1`, labelled sections, visible focus, live clipboard status, no-JS brief template.
- Overscroll past the footer shows night (`html{background:var(--night);overscroll-behavior-y:none}`).

## Preserved surfaces and acceptance

- Every route stays: Notes and each note, the field report, Baton Rouge, Privacy, Terms, the closed archive (keeps its own look, `noindex`), success route, Google verification file, robots, sitemap, the signed Meta webhook and the closed (410) legacy function.
- CSP stays self-only (plus the YouTube nocookie frame); no inline script except the JSON-LD data block, no inline style, no remote fonts.
- Any new file under `assets/` must be in the netlify `cp` chain (`assets/axioma` is copied whole).
- Tests: `npm test`, then build, then `npm run test:browser`; Lighthouse and axe before/after for each release.
- A230 ends at a branch and a draft preview. Percy's go is required before any main push.
