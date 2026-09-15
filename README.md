# Deploy Axiom website

Permanent zero-cost static homepage for Deploy Axiom.

## Product

The public thesis is: **“We don't sell automation. We deploy operational agents.”**

The site describes a done-for-you operating model: one agent, one operating lane, one measurable outcome. The visitor can prepare an `OPERATE` brief locally and choose to open the current Instagram DM contact lane. The site has no hosted lead form, data store, paid service, external font, autoplay video, or email address.

The expired September 2026 two-business evaluation is preserved at `/archive/two-business-evaluation-2026-09/` as a closed, `noindex` historical page. Its release packets remain in `release-packets/`; the legacy application function stays server-closed with HTTP 410. The signed Meta webhook remains at `/api/meta/webhook`.

## Local verification

Requirements: Node.js and Netlify CLI (for the Netlify build verification).

```sh
node --test tests/*.test.mjs
env -u NETLIFY_AUTH_TOKEN netlify build
python3 -m http.server 8080 -d dist
```

The build command is declared in `netlify.toml` and copies the homepage, success page, archive, robots, sitemap, favicon, and PNG social image into `dist/`. Legacy campaign media remains in source/release history but is not copied to the permanent homepage payload. Netlify discovers functions in `netlify/functions` from the same config.

Do not deploy or push from this repository without separate approval.
