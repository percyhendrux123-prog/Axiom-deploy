# A298 round-2 adversarial review brief

Repo: /home/cua/repos/Axiom-deploy
Branch: design/a298-terminal-chain
Review base: d83764e
Implementation head: df3d0c2 (follow-on evidence-only commit expected)
No push, deploy, merge, external messaging, client data or credentials.

Goal: fix AXIOM round-1 defects and implement Percy's larger-art/straight-across-type add-ons. Try to break the implementation against this list; report concrete reproducible defects only, with file/line and repro. Do not edit.

Acceptance:
1. One rot.js Display canvas whose backing width/height match CSS dimensions times devicePixelRatio (390@3x, 1440@2x), maintaining actual high-resolution glyph rasterization, focus hit regions and pauses offscreen/hidden. No private vendor loop.
2. Seven surviving relationship arrows per layout, last cell OUTSIDE target boxes. Handoff/refused dashed, actual corner glyphs without four-way stubs. Evidence risers do not cross their mobile labels. All controls/panels, walkthrough cancel/Escape/replay retained.
3. Braille texture faint but visible: actual empty-night pixel sample +8–12 red levels in static 1x capture, with 2x crop. Panel/text colors unchanged; dim/body text stay >=4.5 contrast even on brightest dots. Same 4fps shared-conductor drift and hidden/offscreen/reduced pause behavior.
4. Caduceus rendered desktop size twice reviewed 547.859375×306 bounds; mobile whole art fits column, unchanged aspect, centered, no crop. Existing art generator/dither/breathing/entrance unchanged. No horizontal overflow at 390.
5. Hero headline, display section headings and literal 'Nothing sends...' gate axiom each one line on desktop (>900px), sized to fit. Normal mobile wrapping. Copy unchanged.

Changed production files:
- assets/axioma/chain-terminal.js (DPR context transform adapter and connected edge raster)
- assets/axioma/axioma.css (texture opacity, caduceus sizing, desktop typography)
- assets/axioma/braille-tile.svg (half-pixel aligned dots)
- assets/axioma/home.js (integer-pixel drift to preserve visibility after preference changes)
Tests: tests/browser/terminal-chain.test.mjs

Commands:
- npm test
- python3 -c "import tomllib,subprocess; subprocess.run(tomllib.load(open('netlify.toml','rb'))['build']['command'],shell=True,check=True)"
- SCREENSHOT_DIR=qa/a298-r2 node --test tests/browser/terminal-chain.test.mjs
- SCREENSHOT_DIR=qa/a298-r2 npm run test:browser -- --test-concurrency=1 (allow 600s)
- npm run build (requires host Netlify CLI, missing in Space)

Existing local QA server: http://127.0.0.1:8795 (dist). Exact static build already rerun. Art/h1 regressions were observed red before fixes, as were DPR (1024×442 vs 2052×903; 322×594 vs 972×1783), arrows (4 desktop, 6 mobile), texture (only +3).

Evidence: qa/a298-r2/; screenshots terminal-1440@2x.png and terminal-390@3x.png, caduceus-1440-settled.png / -390-settled.png, hero-{1440,390}.png, background-{1440,390}-2x.png. Final full-suite screenshots may be refreshing concurrently; avoid modifying them.
