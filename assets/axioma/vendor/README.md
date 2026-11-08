# rot.js

Unmodified `dist/rot.min.js` from npm `rot-js@2.2.1` (BSD-3-Clause).
Source: https://github.com/ondras/rot.js/tree/v2.2.1
Archive: https://registry.npmjs.org/rot-js/-/rot-js-2.2.1.tgz
SHA-256 of vendored JS: `08bb45765ea9a8d07ee741254ddcff898178e0836d0ceb63f3a85be7bb396cf9`.
Full upstream license is in LICENSE-rot-js.txt.

chain-terminal.js subclasses Display's setOptions to suppress its backend scheduler before construction can schedule a tick. The page conductor explicitly flushes dirty cells via the pinned 2.2.1 _tick method. This small adapter keeps the vendor unmodified, owns one displayed canvas across breakpoints, and leaves no private rot.js animation loop running offscreen or hidden. Recheck these internals when updating the pinned vendor.
