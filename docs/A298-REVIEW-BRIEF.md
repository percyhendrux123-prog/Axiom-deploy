# A298 adversarial review brief

Repo: /home/cua/repos/Axiom-deploy
Branch: design/a298-terminal-chain; base 66ca63e301672acd400ce6c2846ab3345e96a583.
Local only: do not push, deploy, merge, contact anyone, or read secrets.

Goal: try to break Percy's round-three terminal art changes against the acceptance below; report concrete defects only, with exact paths/lines and reproduction. Do not implement fixes.

Acceptance:
- Caduceus reference is improved, never reduced: wider wings (44 instead of 34 braille cells), fine single-dot ordered dither across wings/snakes, unchanged helix proportions, original breathing clocks; centered at desktop/mobile. One top-to-bottom terminal entrance on first view, with leading cursor; complete static art in reduced motion or no-JS. Active-time entrance freezes hidden/offscreen and does not replay.
- Interactive chain uses vendored unmodified rot-js 2.2.1 Display, one canvas across breakpoints; all 11 native controls, original panel copy, gates and Run one order preserved; cancel, Escape, replay, preference toggles, hidden/offscreen freeze work. No hidden SVG copy or rot-owned endless scheduler. Vendor license, footer credit, Netlify copy inclusion verified. Screen readers retain HTML relationship description and panels.
- Hermes herm medallion enlarged ~1.5x desktop (336 instead of 224px), mobile 172 instead of 112px; both static/live; text reflows and drag/keys still work; no 390px overflow.
- Very faint braille background tile drifts at <=4fps on existing conductor, static in reduced motion, frozen hidden/offscreen; no extra timer or animation loop. Copy unchanged except necessary diagram text alternative and rot credit.
- npm test, static build and full browser regression suite pass. Required screenshots at 1440/390: art mid-entrance/settled, terminal map, medallion, texture.

Changed files: assets/axioma/{caduceus.js,chain-terminal.js,chrome.js,ring-mask.svg,home.js,story.js,axioma.css,braille-tile.svg,vendor/*}, src/axioma/story.js, index.html, netlify.toml; tests/{terminal-art,living-chain,life-diagram,motion,polish,remake}.test.mjs, tests/browser/{terminal-chain,living-chain}.test.mjs, tests/fixtures/polish-content.json.

- Percy add-on: vanilla Paper Shaders LiquidMetal 0.0.82 (Apache-2.0) is confined to the existing herm's two rings, 15% opacity, #101310 back and stone tint, <=12fps on the conductor. Retain original SVG. Reduced motion creates no chrome canvas; unavailable WebGL or context loss stays plain SVG. Hidden/offscreen/drag pauses work. No React or ShaderMount/private scheduler.
- Percy add-on: cli-spinners 3.4.0 dots-only JSON frames (MIT), plus a generated synchronous wrapper for this no-connect CSP. Only an active Run one order spins, including gate resolution holds. Hidden/offscreen active time freezes it; idle/cancel/reduced manual stepping has no spinning. Optional caduceus spinner was not used: its existing leading cursor remains the clearer terminal edge. Both add-ons are credited and explicitly checked in the copy-only build.

Tests:
- npm test
- python3 -c "import tomllib,subprocess;subprocess.run(tomllib.load(open('netlify.toml','rb'))['build']['command'],shell=True,check=True)"
- SCREENSHOT_DIR=qa/a298 npm run test:browser -- --test-concurrency=1
- npm run audit

npm run build currently returns `env: ‘netlify’: No such file or directory` in this Linux Space. Exact configured static build is exercised instead; host Netlify function-bundling check still needed. `hermes` CLI was absent at initial discovery; this brief is also the host review handoff if it remains unavailable. Screenshots and logs: qa/a298; do not inspect unrelated private material.
