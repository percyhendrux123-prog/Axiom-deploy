# src/axioma

Source for the homepage medallion story (`story.js`). The page itself is plain
HTML (`/index.html`, section `#story`); this script only upgrades it to the
live, draggable version when the visitor allows motion.

The shipped file is the bundle at `assets/axioma/story.js`. It is committed,
so the Netlify build stays a copy-only step with no new dependencies. After
editing `src/axioma/story.js`, rebuild the bundle with esbuild and Pretext
(MIT, `@chenglou/pretext` 1.0.0) available:

```sh
npm i --no-save esbuild@0.28 @chenglou/pretext@1.0.0
npx esbuild src/axioma/story.js --bundle --minify --format=iife \
  --target=es2020 --legal-comments=eof --outfile=assets/axioma/story.js
```

Then bump `?v=` on the `story.js` URL in `assets/axioma/home.js`.

Rules the engine keeps:

- Each story paragraph in `index.html` stays on one line with single spaces;
  the engine reads text offsets straight from the DOM.
- A marked phrase is `<span class="ax ax-LEVEL" data-axioma-level="LEVEL">`
  plus a visually hidden `<span class="ax-sr"> (WORD)</span>`, so a screen
  reader hears the signal and color is never the only cue.
- `assets/axioma/home.js` loads the engine only near the story and never for
  reduced-motion visitors; with no JavaScript the static story is complete.
- `window.__storyState()` and `window.__storyFrames()` exist for verification.
- Frames run on the page's motion conductor (`assets/axioma/home.js`,
  `window.__axConductor`): the engine asks for frames only while the
  medallion moves or settles, calls `hold()` when the reader takes it and
  `release()` when it rests, and exposes `cue(i, on)` and `breathe(on)` for
  the conductor's two story accents. There is no idle spin or wobble.
