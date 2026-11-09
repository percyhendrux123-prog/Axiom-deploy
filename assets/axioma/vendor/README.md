# rot.js

Unmodified `dist/rot.min.js` from npm `rot-js@2.2.1` (BSD-3-Clause).
Source: https://github.com/ondras/rot.js/tree/v2.2.1
Archive: https://registry.npmjs.org/rot-js/-/rot-js-2.2.1.tgz
SHA-256 of vendored JS: `08bb45765ea9a8d07ee741254ddcff898178e0836d0ceb63f3a85be7bb396cf9`.
Full upstream license is in LICENSE-rot-js.txt.

chain-terminal.js subclasses Display's setOptions to suppress its backend scheduler before construction can schedule a tick. The page conductor explicitly flushes dirty cells via the pinned 2.2.1 _tick method. This small adapter keeps the vendor unmodified, owns one displayed canvas across breakpoints, and leaves no private rot.js animation loop running offscreen or hidden. Recheck these internals when updating the pinned vendor.

## Paper Shaders LiquidMetal

`paper-liquid-metal.js` is a minimal vanilla IIFE built from the unmodified `liquidMetalFragmentShader` and `vertexShaderSource` exports of `@paper-design/shaders@0.0.82`, Apache-2.0. No React, ShaderMount, private scheduler, image processing, network or runtime dependency. LICENSE-Paper-Shaders.txt and NOTICE-Paper-Shaders.txt accompany it. Source: https://github.com/paper-design/shaders . Archive: https://registry.npmjs.org/@paper-design/shaders/-/shaders-0.0.82.tgz . Built with esbuild 0.28.0, `--bundle --minify --format=iife --global-name=AxPaperMetal --target=es2020 --legal-comments=eof`. Entry re-exports `./dist/shaders/liquid-metal.js`'s fragment and `./dist/vertex-shader.js`'s vertex source. SHA-256: `4e2993d7bbf03b6308f165d24242da4922c096de1f84e141b3ea77db751453bf`.

The page's chrome.js compiles those actual shaders into one low-power WebGL2 canvas, masked to the herm rings at 15% opacity. The static SVG is always retained. Its existing conductor flushes at most 12fps, only in view and while the story is read. No WebGL, reduced motion or context loss leaves the original SVG, with no retry loop.

## cli-spinners

Only `dots` (interval 80ms, ten braille frames) is copied verbatim from `cli-spinners@3.4.0`'s spinners.json, MIT. Source: https://github.com/sindresorhus/cli-spinners . `cli-spinners-dots.json` is the source of truth; the adjacent JS is only a generated synchronous wrapper (`var AxCliSpinners = <JSON>;`) because this static site's CSP forbids fetch/connect. LICENSE-cli-spinners.txt preserves upstream attribution. No package runtime, random spinner, or additional animation clock is shipped.
