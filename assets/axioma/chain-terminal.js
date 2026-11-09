// One rot.js 2.2.1 Display, reused at every width. No vendor-owned loop.
(function () {
  'use strict'
  var system = document.getElementById('system')
  var board = system && system.querySelector('.system__board')
  if (!board || !window.ROT) return
  class ConductorDisplay extends ROT.Display {
    setOptions(options) {
      super.setOptions(options)
      // Display's constructor calls this before scheduling its first tick.
      // Pinning 2.2.1 lets the page conductor own even the dirty-cell flush.
      this._backend.schedule = function () {}
      return this
    }
    // Keep ROT's character geometry in CSS pixels, but rasterize text at the
    // full device resolution. Resizing resets context state, so restore it.
    fit(rect) {
      var ctx = this._backend._ctx, c = ctx.canvas, options = this.getOptions()
      var font = ctx.font, align = ctx.textAlign, baseline = ctx.textBaseline
      var width = options.width * this._backend._spacingX, height = options.height * this._backend._spacingY
      var dpr = window.devicePixelRatio || 1
      c.width = Math.round(rect.width * dpr); c.height = Math.round(rect.height * dpr)
      ctx.setTransform(c.width / width, 0, 0, c.height / height, 0, 0)
      ctx.font = font; ctx.textAlign = align; ctx.textBaseline = baseline
    }
    flush() { super._tick() }
  }
  var display = new ConductorDisplay({ width: 1, height: 1, fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, spacing: 1, fg: '#8A8E96', bg: '#141518' })
  var canvas = display.getContainer()
  canvas.setAttribute('aria-hidden', 'true')
  system.querySelector('.system__terminal').appendChild(canvas)
  // Reserve the enhanced layout before the viewport-lazy first draw. Keep
  // the visible relationship fallback if ROT or this engine never loads.
  system.classList.add('has-terminal-engine')
  var visible = false, ready = false, dirty = true, selected = 'intro'
  var cols = 1, rows = 1, small = false, cells = {}, previous = null
  var edges = [
    ['M120 80V190', 'M120 250V360', 'M240 190V80', 'M240 360V250', 'M280 220H800', 'M280 190H360V50H800', 'M650 242V390H800'],
    ['M18 56V172', 'M18 228V344', 'M128 172V56', 'M128 344V228', 'M147 200H280V344', 'M147 172H190V104H280V56', 'M280 318H190V500H217 M280 522V586']
  ]
  var routes = [
    ['M120 80V190', 'M120 250V360', 'M240 360V250L280 220H460', 'M460 220H650', 'M650 220H280L120 250V360H240V316', 'M240 316V250L280 220H650V350', 'M650 350V390H800H650V242L650 220H280V190H360V50H545', 'M545 50H800H360V190H280H240V80'],
    ['M18 56V172', 'M18 228V344', 'M128 344V228L147 200H280V216', 'M280 216V290', 'M280 290V200H147L18 228V344H128V306', 'M128 306V228L147 200H280V318H190V500H280', 'M280 500V586V500H190V318H280V200H147V172H190V104H280', 'M280 104V56V104H190V172H147H128V56']
  ]
  var labels = [
    [[48,130,'orders'],[48,300,'orders'],[256,130,'evidence'],[256,280,'evidence'],[698,34,'handoff'],[676,304,'refused']],
    [[30,111,'orders'],[30,270,'orders'],[88,147,'evidence'],[88,251,'evidence'],[202,157,'handoff'],[222,449,'refused']]
  ]
  function segments(path) {
    var tokens = path.match(/[MLHV]|-?\d+(?:\.\d+)?/g), out = [], x = 0, y = 0
    for (var i = 0; i < tokens.length;) {
      var op = tokens[i++], nx = x, ny = y
      if (op === 'M' || op === 'L') { nx = Number(tokens[i++]); ny = Number(tokens[i++]) }
      if (op === 'H') nx = Number(tokens[i++])
      if (op === 'V') ny = Number(tokens[i++])
      if (op !== 'M') out.push([[x, y], [nx, ny]])
      x = nx; y = ny
    }
    return out
  }
  var edgeSegments = edges.map(function (layout) { return layout.map(segments) })
  var routeSegments = routes.map(function (layout) { return layout.map(segments) })
  function pointAt(path, p) {
    var lengths = path.map(function (s) { return Math.hypot(s[1][0] - s[0][0], s[1][1] - s[0][1]) })
    var left = lengths.reduce(function (a, b) { return a + b }, 0) * p
    for (var i = 0; i < path.length; i++) {
      if (left <= lengths[i] || i === path.length - 1) {
        var u = lengths[i] ? left / lengths[i] : 0
        return [path[i][0][0] + (path[i][1][0] - path[i][0][0]) * u, path[i][0][1] + (path[i][1][1] - path[i][0][1]) * u]
      }
      left -= lengths[i]
    }
  }
  function cell(p) { return [Math.round(p[0] / (small ? 350 : 1000) * (cols - 1)), Math.round(p[1] / (small ? 642 : 440) * (rows - 1))] }
  function put(x, y, ch, color) {
    if (x >= 0 && x < cols && y >= 0 && y < rows) cells[x + ',' + y] = [x, y, ch, color || '#8A8E96']
  }
  function text(x, y, value, color) { Array.from(value).forEach(function (ch, i) { put(x + i, y, ch, color) }) }
  function flush() {
    display.flush()
    canvas.dataset.draws = String(Number(canvas.dataset.draws || 0) + 1)
  }
  function render() {
    dirty = true
    if (!visible || !ready || document.hidden) return
    var rect = board.getBoundingClientRect()
    small = window.matchMedia('(max-width:700px)').matches
    var font = small ? 11 : 13
    display.setOptions({ fontSize: font })
    var size = display.computeSize(rect.width, rect.height)
    cols = Math.max(1, size[0]); rows = Math.max(1, size[1])
    display.setOptions({ width: cols, height: rows })
    display.fit(rect)
    cells = {}; previous = null
    var boxes = Array.from(board.querySelectorAll('[data-system-node]')).map(function (button) {
      var b = button.getBoundingClientRect()
      return { button: button,
        x0: Math.max(0, Math.round((b.left - rect.left) / rect.width * cols)), y0: Math.max(0, Math.round((b.top - rect.top) / rect.height * rows)),
        x1: Math.min(cols - 1, Math.round((b.right - rect.left) / rect.width * cols) - 1), y1: Math.min(rows - 1, Math.round((b.bottom - rect.top) / rect.height * rows) - 1) }
    })
    function inBox(p) { return boxes.some(function (b) { return p[0] >= b.x0 && p[0] <= b.x1 && p[1] >= b.y0 && p[1] <= b.y1 }) }
    var lines = {}, arrows = []
    function connect(x, y, bit, dashed) {
      var key = x + ',' + y, line = lines[key] || (lines[key] = { x: x, y: y, mask: 0, dashed: dashed })
      line.mask |= bit
    }
    edgeSegments[small ? 1 : 0].forEach(function (path, index) {
      path.forEach(function (s) {
        var a = cell(s[0]), b = cell(s[1]), dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1])
        var count = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))
        for (var k = 0; k < count; k++) {
          var x = a[0] + dx * k, y = a[1] + dy * k
          connect(x, y, dx > 0 ? 2 : dx < 0 ? 8 : dy > 0 ? 4 : 1, index >= 5)
          connect(x + dx, y + dy, dx > 0 ? 8 : dx < 0 ? 2 : dy > 0 ? 1 : 4, index >= 5)
        }
      })
      var last = path[path.length - 1], end = cell(last[1]), start = cell(last[0])
      var dx = Math.sign(end[0] - start[0]), dy = Math.sign(end[1] - start[1])
      // The destination border belongs to the box. Stop the arrow one cell
      // outside it, so filling any of the eleven nodes cannot erase it.
      while (inBox(end)) { end[0] -= dx; end[1] -= dy }
      arrows.push([end[0], end[1], dy > 0 ? '↓' : dy < 0 ? '↑' : dx > 0 ? '→' : '←'])
    })
    var glyphs = { 1:'│', 2:'─', 3:'└', 4:'│', 5:'│', 6:'┌', 7:'├', 8:'─', 9:'┘', 10:'─', 11:'┴', 12:'┐', 13:'┤', 14:'┬', 15:'┼' }
    Object.keys(lines).forEach(function (key) {
      var line = lines[key], ch = glyphs[line.mask]
      if (line.dashed && ch === '│') ch = '╎'
      if (line.dashed && ch === '─') ch = '╌'
      put(line.x, line.y, ch)
    })
    labels[small ? 1 : 0].forEach(function (label) {
      var p = cell(label)
      if (small && label[2] === 'evidence') p[0] = cell([128, label[1]])[0] - label[2].length - 2
      text(p[0], p[1], label[2], '#B4B6BC')
    })
    boxes.forEach(function (b) {
      var button = b.button, x0 = b.x0, x1 = b.x1, y0 = b.y0, y1 = b.y1
      var active = button.dataset.systemNode === selected, color = active ? '#F0F0EE' : button.classList.contains('system__chip') ? '#B4B6BC' : '#D9DADC'
      for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) put(x, y, ' ', color)
      for (var xx = x0 + 1; xx < x1; xx++) { put(xx, y0, active ? '═' : '─', color); put(xx, y1, active ? '═' : '─', color) }
      for (var yy = y0 + 1; yy < y1; yy++) { put(x0, yy, active ? '║' : '│', color); put(x1, yy, active ? '║' : '│', color) }
      put(x0, y0, active ? '╔' : '┌', color); put(x1, y0, active ? '╗' : '┐', color)
      put(x0, y1, active ? '╚' : '└', color); put(x1, y1, active ? '╝' : '┘', color)
      text(Math.round((x0 + x1 - button.textContent.length + 1) / 2), Math.round((y0 + y1) / 2), button.textContent, color)
    })
    arrows.forEach(function (a) { put(a[0], a[1], a[2]) })
    display.clear()
    Object.keys(cells).forEach(function (key) { display.draw.apply(display, cells[key]) })
    flush(); dirty = false
    system.classList.add('has-terminal')
  }
  function hidePulse(flushNow) {
    if (!previous) return
    if (!visible || document.hidden) { dirty = true; return }
    var old = cells[previous.join(',')] || [previous[0], previous[1], ' ', '#8A8E96']
    display.draw.apply(display, old); previous = null
    if (flushNow !== false) flush()
  }
  window.AxChain = {
    select: function (key) { if (selected !== key) { selected = key; render() } },
    pulse: function (kind, index, p, opacity) {
      if (!visible || document.hidden) return
      if (dirty) render()
      hidePulse(false)
      var path = (kind === 'route' ? routeSegments : edgeSegments)[small ? 1 : 0][index]
      var at = cell(pointAt(path, p))
      // Blend the brass dot with the panel; no alpha canvas or second surface.
      var blend = function (a, b) { return Math.round(a + (b - a) * opacity) }
      var color = 'rgb(' + blend(20,234) + ',' + blend(21,223) + ',' + blend(24,184) + ')'
      display.draw(at[0], at[1], '•', color); previous = at; flush()
      canvas.dataset.pulse = at.join(',')
      canvas.dataset.pulseOpacity = String(opacity)
    },
    hidePulse: hidePulse,
    geometry: function () { return { small: small, edges: edgeSegments[small ? 1 : 0], routes: routeSegments[small ? 1 : 0] } }
  }
  new ResizeObserver(render).observe(board)
  window.addEventListener('resize', render) // includes DPR changes between screens
  new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; if (visible && dirty) render() }).observe(board)
  document.addEventListener('visibilitychange', function () { if (!document.hidden && dirty) render() })
  document.fonts.ready.then(function () { ready = true; render() })
})()
