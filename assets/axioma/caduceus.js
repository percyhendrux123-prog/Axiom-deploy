// Deploy Axiom: the living caduceus (A291).
//
// The braille caduceus in the gate section, drawn live on its own dot grid
// (34 x 18 braille cells = 68 x 72 dots). The wings are the hand-made art from
// the HTML; they lift and settle on a slow breath, each wing a little behind
// the other, and a soft dither drifts outward across the feathers. The two
// snakes are drawn from a helix around the staff. Each one undulates on its
// own clock, breathes on its own clock, flicks its tongue now and then, and
// carries a faint warm glint from tail to head. The staff never moves.
//
// This file only draws. It owns no animation loop: the motion conductor in
// home.js decides when the caduceus may move (only while the gate is the
// section being read) and calls frame(seconds, amount). amount 0 is the
// caduceus at rest. With no JavaScript or with reduced motion this file is
// never loaded and the static art in the HTML is the whole experience.
(function (root) {
  var W = 68, H = 72, CX = 33.5
  var BLANK = '\u2800'
  // Braille dot bit for (column, row) inside a 2 x 4 cell.
  var BIT = [[0x01, 0x08], [0x02, 0x10], [0x04, 0x20], [0x40, 0x80]]
  // 4 x 4 ordered dither, thresholds in (0, 1).
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(function (v) { return (v + 0.5) / 16 })
  var TAU = Math.PI * 2
  var WING_BOTTOM = 23 // dot rows 0..23 are wings and the top of the staff

  // Helix knots: dot row, half-turns from the head, radius in dots.
  var KY = [27, 40, 53, 64, 69.5]
  var KP = [0, 1, 2, 3, 3.5]
  var KR = [10, 9, 7.5, 5.5, 0.6]

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x }
  function smooth(a, b, x) { var u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u) }
  function knot(arr, y) {
    if (y <= KY[0]) return arr[0]
    for (var i = 1; i < KY.length; i++) {
      if (y <= KY[i]) {
        var u = (y - KY[i - 1]) / (KY[i] - KY[i - 1])
        u = u * u * (3 - 2 * u)
        return arr[i - 1] + (arr[i] - arr[i - 1]) * u
      }
    }
    return arr[arr.length - 1]
  }
  // Cheap repeatable hash, for the tongue timing.
  function hash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }

  // Each snake lives on its own clock. Periods are deliberately unrelated so
  // the two never fall into step.
  var SNAKES = [
    { side: -1, wave: 4.3, lambda: 17, phase: 0.0, breath: 6.1, bphase: 0.0, glint: 8.3, gphase: 0.0, tongue: 7.1, tseed: 3 },
    { side: 1, wave: 5.2, lambda: 19, phase: 2.1, breath: 7.3, bphase: 1.7, glint: 9.7, gphase: 0.46, tongue: 9.3, tseed: 11 },
  ]

  function parseArt(text) {
    var rows = text.split('\n').filter(function (r) { return r.length })
    var g = new Float32Array(W * H)
    for (var r = 0; r < rows.length && r < H / 4; r++) {
      var chars = Array.from(rows[r])
      for (var c = 0; c < chars.length && c < W / 2; c++) {
        var v = chars[c].codePointAt(0) - 0x2800
        if (v <= 0 || v > 255) continue
        for (var dy = 0; dy < 4; dy++) for (var dx = 0; dx < 2; dx++) if (v & BIT[dy][dx]) g[(r * 4 + dy) * W + c * 2 + dx] = 1
      }
    }
    return g
  }

  function create(artText) {
    var art = parseArt(artText)
    var field = new Float32Array(W * H)
    var glint = new Uint8Array(W * H)

    function artAt(x, y) {
      // Bilinear sample of the hand-made art, so a wing can move by less than a dot.
      var x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0
      function px(xx, yy) { return xx < 0 || yy < 0 || xx >= W || yy > WING_BOTTOM ? 0 : art[yy * W + xx] }
      return (px(x0, y0) * (1 - fx) + px(x0 + 1, y0) * fx) * (1 - fy) + (px(x0, y0 + 1) * (1 - fx) + px(x0 + 1, y0 + 1) * fx) * fy
    }

    function wings(t, amt) {
      for (var y = 0; y <= WING_BOTTOM; y++) {
        for (var x = 0; x < W; x++) {
          var side = x < CX ? -1 : 1
          var u = Math.min(1, Math.abs(x - CX) / 34)
          // One slow breath for both wings; the right wing trails the left by
          // a breath of a second, and each feathers out at its own pace.
          var lag = side < 0 ? 0 : 0.55
          var k = side < 0 ? 1.25 : 1.4
          var lift = amt * 2.1 * Math.pow(u, 1.5) * Math.sin(TAU * t / 7.4 - lag - k * u)
          var riffle = amt * 0.35 * u * Math.sin(TAU * t / 2.9 + y * 0.45 + side * 0.9)
          var c = artAt(x, y + lift + riffle)
          if (c > 0) {
            var drift = 0.5 + 0.5 * Math.sin(TAU * t / 5.3 - 7.5 * u + y * 0.32 + side * 0.7)
            c *= 1 - amt * 0.16 * drift
          }
          field[y * W + x] = c
        }
      }
    }

    function strandX(s, y, t, amt) {
      var r = knot(KR, y) * (1 + amt * 0.04 * Math.sin(TAU * t / s.breath + s.bphase))
      var p = knot(KP, y)
      var env = 0.25 + 0.75 * smooth(27, 69, y)
      var wig = amt * 1.15 * env * Math.sin(TAU * y / s.lambda - TAU * t / s.wave + s.phase)
      return CX + s.side * r * Math.cos(Math.PI * p) + wig
    }

    function snakes(t, amt) {
      for (var i = (WING_BOTTOM + 1) * W; i < W * H; i++) field[i] = 0
      glint.fill(0)
      var info = SNAKES.map(function (s) {
        // Glint travels tail to head over the first 45% of its cycle, then rests.
        var g = ((t / s.glint + s.gphase) % 1 + 1) % 1
        var gy = g < 0.45 ? 69 - (g / 0.45) * 44 : -99
        // Tongue: out for ~0.7 s once in each cycle, at a hashed moment.
        var cyc = Math.floor(t / s.tongue)
        var at = (t / s.tongue - cyc) * s.tongue
        var start = 1 + hash(cyc + s.tseed) * (s.tongue - 2.5)
        var tongue = amt > 0.5 && at > start && at < start + 0.7 ? Math.sin(Math.PI * (at - start) / 0.7) : 0
        return { gy: amt > 0.3 ? gy : -99, tongue: tongue }
      })

      for (var y = 24; y < H; y++) {
        var layers = []
        for (var k = 0; k < 2; k++) {
          var s = SNAKES[k]
          if (y < 27 || y > 69.5) { layers.push(null); continue }
          var xs = strandX(s, y, t, amt)
          var slope = strandX(s, y + 0.5, t, amt) - strandX(s, y - 0.5, t, amt)
          var z = Math.sin(Math.PI * knot(KP, y)) * -s.side
          var hw = 2.45 - 1.25 * smooth(27, 69, y)
          layers.push({ xs: xs, norm: Math.sqrt(1 + slope * slope), z: z, hw: hw, k: k })
        }
        var order = layers.filter(Boolean).sort(function (a, b) { return a.z - b.z })
        for (var x = 0; x < W; x++) {
          var v = 0, gl = 0, staffDone = false
          var staff = (x === 33 || x === 34) && y <= 70
          // Paint back to front: the snake behind, the staff, the snake in front.
          for (var o = 0; o <= order.length; o++) {
            var L = order[o]
            if (staff && !staffDone && (!L || L.z > 0)) { v = 1; gl = 0; staffDone = true }
            if (!L) break
            var d = Math.abs(x - L.xs) / L.norm
            if (d < L.hw) {
              var cov = clamp01(L.hw - d + 0.35)
              var shade = 0.8 + 0.2 * smooth(-0.35, 0.35, L.z)
              v = cov * shade * (1 - 0.12 * (d / L.hw) * (d / L.hw))
              gl = Math.abs(y - info[L.k].gy) < 2.6 && L.z > -0.2 ? 1 : 0
            } else if (L.z > 0 && d < L.hw + 0.75) {
              v = 0; gl = 0 // the engraver's gap where one body passes over another
            }
          }
          field[y * W + x] = v
          glint[y * W + x] = gl
        }
      }

      // Heads: just under the wings, facing each other across the staff.
      for (var h = 0; h < 2; h++) {
        var S = SNAKES[h]
        var hx = strandX(S, 27, t, amt) - S.side * 0.6
        var hy = 26 + amt * 0.35 * Math.sin(TAU * t / S.breath + S.bphase + 1.2)
        for (var yy = 23; yy <= 29; yy++) {
          for (var xx = Math.floor(hx - 6); xx <= Math.ceil(hx + 6); xx++) {
            if (xx < 0 || xx >= W) continue
            // Egg-shaped head, broad at the back, narrowing to the snout.
            var ax = (xx - hx) * -S.side // positive toward the snout
            var rx = ax > 0 ? 4.1 : 3.4
            var ry = ax > 0 ? 1.9 - 0.25 * (ax / 4.1) : 2.2
            var e = (ax / rx) * (ax / rx) + ((yy - hy) / ry) * ((yy - hy) / ry)
            var i2 = yy * W + xx
            if (e < 1) { field[i2] = 1; glint[i2] = 0 }
            else if (e < 1.5 && field[i2] > 0 && !(xx === 33 || xx === 34)) field[i2] = 0
          }
          // Eye.
          var ex = Math.round(hx - S.side * 0.9), ey = Math.round(hy)
          if (ex >= 0 && ex < W) field[ey * W + ex] = 0
        }
        var tg = info[h].tongue
        if (tg > 0) {
          var reach = Math.round(1 + tg * 2.2)
          var sx = Math.round(hx - S.side * 4.6), ty = Math.round(hy - 0.4)
          for (var q = 0; q < reach; q++) {
            var tx = sx - S.side * q
            if (tx === 33 || tx === 34) break
            field[ty * W + tx] = 1
          }
          if (reach >= 3) {
            var fx = sx - S.side * reach
            if (fx !== 33 && fx !== 34) { field[(ty - 1) * W + fx] = 1; field[(ty + 1) * W + fx] = 1 }
          }
        }
      }
    }

    var ROW_TONE = ['strong', 'strong', 'strong', 'strong', 'strong', 'strong', 'strong', 'strong', 'mid', 'mid', 'mid', 'mid', 'mid', 'dim', 'dim', 'dim', 'dim', 'dim']

    function frame(t, amt) {
      amt = clamp01(amt || 0)
      wings(t, amt)
      snakes(t, amt)
      var out = []
      for (var r = 0; r < H / 4; r++) {
        var line = '', tone = null, run = ''
        for (var c = 0; c < W / 2; c++) {
          var bits = 0, glow = 0
          for (var dy = 0; dy < 4; dy++) {
            for (var dx = 0; dx < 2; dx++) {
              var x = c * 2 + dx, y = r * 4 + dy, i = y * W + x
              if (field[i] > BAYER[(y & 3) * 4 + (x & 3)]) { bits |= BIT[dy][dx]; glow += glint[i] }
            }
          }
          var ch = String.fromCharCode(0x2800 + bits)
          var cls = glow >= 2 ? 'glint' : ROW_TONE[r]
          if (cls !== tone) {
            if (run) line += '<span class="cad-' + tone + '">' + run + '</span>'
            tone = cls; run = ''
          }
          run += ch
        }
        if (run) line += '<span class="cad-' + tone + '">' + run + '</span>'
        out.push(line)
      }
      return out.join('\n')
    }

    return { frame: frame, width: W / 2, height: H / 4, blank: BLANK }
  }

  var api = { create: create }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  root.AxCaduceus = api

  // Browser: hand the caduceus to the conductor.
  if (typeof document === 'undefined') return
  var pre = document.querySelector('.gate .caduceus')
  if (!pre) return
  var still = pre.innerHTML
  var engine = create(pre.textContent)
  var last = ''
  function draw(t, amt) {
    var html = engine.frame(t, amt)
    if (html !== last) { pre.innerHTML = html; last = html }
  }
  pre.classList.add('is-live')
  draw(0, 0)
  var C = root.__axConductor
  if (C && C.attachCaduceus) C.attachCaduceus({ draw: draw, restore: function () { pre.innerHTML = still; last = ''; pre.classList.remove('is-live') } })
})(typeof window !== 'undefined' ? window : globalThis)
