# Deploy Axiom website

Permanent zero-cost static homepage for Deploy Axiom.

## Product

The 2026-10-30 remake follows the approved copy decks: a locked outcome headline, three linked proof observations, three stories, limits before method, founder, findings, and a local brief composer with an email handoff. Field Report 02 lives at `/field-reports/insurance-client-care/` and is listed in Notes. The site has no hosted lead form, data store, paid service, external font or autoplay video. `DESIGN.md` is the current visual and interaction contract; production publication remains separately gated.

The expired September 2026 two-business evaluation is preserved at `/archive/two-business-evaluation-2026-09/` as a closed, `noindex` historical page. Its release packets remain in `release-packets/`; the legacy application function stays server-closed with HTTP 410. The signed Meta webhook remains at `/api/meta/webhook`.

## Local verification

Requirements: Node.js and Netlify CLI (for the Netlify build verification). Browser tests use the pinned Playwright dev dependency; on a new machine run `npx playwright install chromium` after `npm ci`. They start and close their own loopback server and isolated headless browser. Netlify must be linked locally (`env -u NETLIFY_AUTH_TOKEN netlify link --id 09b62ef8-0282-4024-9302-050c078af0e3`) before `npm run build`; linking is not a deploy.

```sh
npm ci
npm test
npm run build
npm run test:browser
# Optional: write full-page 1440px/390px screenshots to an explicit directory.
SCREENSHOT_DIR=/absolute/path/to/preview npm run test:browser
# Exercise an already-created draft (never production) with the same tests.
PREVIEW_URL=https://DRAFT--axiom-deploy.netlify.app npm run test:browser
```

The build command is declared in `netlify.toml` and copies the homepage, success page, archive, robots, sitemap, favicon, and PNG social image into `dist/`. Legacy campaign media remains in source/release history but is not copied to the permanent homepage payload. Netlify discovers functions in `netlify/functions` from the same config.

Do not deploy or push from this repository without separate approval.
