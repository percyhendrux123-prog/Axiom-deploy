// Deploy Axiom homepage: the medallion story (ported from the A227 Phase 2
// React component to plain DOM so the site stays static HTML under a
// self-only CSP).
//
// The story ships as ordinary HTML (index.html, #story). With no JavaScript,
// or when the visitor prefers reduced motion, that HTML is the experience:
// the medallion floats with a circular shape-outside and every marked phrase
// is lit. With motion allowed, this script switches the stage to "live": the
// plain paragraphs stay in the DOM as the screen-reader copy (visually
// hidden), an aria-hidden layer of positioned words is drawn on top, the
// medallion becomes a draggable, focusable button, and the text re-lays out
// around it line by line (Pretext does the measuring and line breaking).
// Marked Axiōma phrases light when the medallion comes near them.
//
// Motion is owned by the page's conductor (assets/axioma/home.js): this
// engine runs frames only while the medallion is moving or settling, on the
// conductor's one animation loop, and tells the conductor when the reader
// takes hold of the medallion and when it comes to rest. The conductor in
// turn may light a phrase once (cue) and let the ring breathe at rest.
//
// Rebuild the shipped bundle after editing (see src/axioma/README.md).

import { clearCache, layoutNextLineRange, prepareWithSegments } from '@chenglou/pretext'

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Reads one <p> into plain text plus the marked spans. The screen-reader cue
// inside each mark (.ax-sr, e.g. " (STOP)") is not part of the visual text.
function readParagraph(p) {
  let text = ''
  const spans = []
  for (const node of p.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.nodeValue
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.matches('.ax')) {
        let t = ''
        for (const c of node.childNodes) {
          if (c.nodeType === Node.TEXT_NODE) t += c.nodeValue
          else if (!c.matches || !c.matches('.ax-sr')) t += c.textContent
        }
        spans.push({ start: text.length, end: text.length + t.length, level: node.dataset.axiomaLevel })
        text += t
      } else {
        text += node.textContent
      }
    }
  }
  // index.html keeps each story paragraph on one line with single spaces, so
  // the text needs no normalising and the span offsets stay exact.
  return { text, spans }
}

function createEngine({ stage, layer, flow, med, hit, tilt, ring }) {
  const paras = [...flow.querySelectorAll('p')].map(readParagraph)
  const s = {
    W: 0, R: 90, pad: 14, lh: 24, gap: 16, minSlot: 80,
    x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0,
    mode: 'rest', // rest | drag | key | glide
    angle: 0, tiltX: 0, tiltY: 0,
    lastX: NaN, lastY: NaN, hBase: 0, height: 0,
    visible: true, raf: 0, t: 0, frames: [], breathAnim: null, touched: false,
  }
  const conductor = window.__axConductor || null

  // Build the visual layer once: one element per unmarked word. Marked
  // phrases are drawn as one element per line they land on (placeRuns), so
  // the underline runs unbroken across the spaces.
  const model = paras.map((p) => {
    const pieces = []
    const cuts = new Set([0, p.text.length])
    for (const sp of p.spans) {
      cuts.add(sp.start)
      cuts.add(sp.end)
    }
    const re = /\S+|\s+/g
    let m
    while ((m = re.exec(p.text))) {
      cuts.add(m.index)
      cuts.add(m.index + m[0].length)
    }
    const sorted = [...cuts].sort((a, b) => a - b)
    const phrases = p.spans.map((sp) => ({ pieces: [], lit: false, cue: false, level: sp.level, els: [] }))
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i]
      const b = sorted[i + 1]
      const str = p.text.slice(a, b)
      const si = p.spans.findIndex((sp) => a >= sp.start && b <= sp.end)
      const space = /^\s+$/.test(str)
      if (space && si < 0) continue
      let el = null
      if (si < 0) {
        el = document.createElement('span')
        el.className = 'w'
        el.textContent = str
        layer.appendChild(el)
      }
      const piece = { a, b, el, space, x: NaN, y: NaN, shown: true, phrase: si }
      pieces.push(piece)
      if (si >= 0) phrases[si].pieces.push(piece)
    }
    return { ...p, pieces, phrases, prep: null, prefix: null, segStart: null }
  })

  function prepare() {
    const cs = getComputedStyle(flow.querySelector('p') || flow)
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    s.lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.65
    s.gap = Math.round(s.lh * 0.7)
    layer.style.font = font
    layer.style.lineHeight = `${s.lh}px`
    const probe = document.createElement('canvas').getContext('2d')
    probe.font = font
    for (const p of model) {
      p.prep = prepareWithSegments(p.text, font)
      const segs = p.prep.segments
      const widths = p.prep.widths
      p.segStart = new Array(segs.length + 1)
      p.prefix = new Float64Array(p.text.length + 1)
      if (segs.join('') === p.text) {
        let pos = 0
        let c = 0
        for (let i = 0; i < segs.length; i++) {
          p.segStart[i] = c
          const len = segs[i].length
          for (let k = 0; k < len; k++) p.prefix[c + k] = pos + (widths[i] * k) / len
          pos += widths[i]
          c += len
        }
        p.segStart[segs.length] = c
        p.prefix[p.text.length] = pos
      } else {
        // Pretext normalised something; fall back to direct canvas widths.
        let c = 0
        for (let i = 0; i < segs.length; i++) {
          p.segStart[i] = c
          c += segs[i].length
        }
        p.segStart[segs.length] = c
        for (let i = 0; i <= p.text.length; i++) p.prefix[i] = probe.measureText(p.text.slice(0, i)).width
      }
    }
    s.minSlot = probe.measureText('0000000000').width
  }

  function measureStage() {
    const oldW = s.W
    s.W = stage.clientWidth
    s.R = Math.round(clamp(s.W * 0.225, 86, 168))
    s.pad = Math.round(s.lh * 0.55)
    stage.style.setProperty('--med', `${s.R * 2}px`)
    s.hBase = layoutText(-1e5, -1e5, false)
    if (!oldW) {
      s.x = s.tx = s.W - s.R - 2
      s.y = s.ty = s.R + 2
    } else {
      s.x = s.tx = clamp((s.x / oldW) * s.W, s.R, s.W - s.R)
      s.y = s.ty = clamp(s.y, s.R, Math.max(s.R, s.hBase + s.R * 0.6 - s.R))
    }
    s.lastX = NaN
  }

  const toOffset = (p, cur) => p.segStart[cur.segmentIndex] + cur.graphemeIndex

  function slotsAt(y, cx, cy) {
    const rr = s.R + s.pad
    const near = clamp(cy, y, y + s.lh)
    const dy = Math.abs(cy - near)
    if (dy >= rr) return [[0, s.W]]
    const hw = Math.sqrt(rr * rr - dy * dy)
    const out = []
    if (cx - hw >= s.minSlot) out.push([0, cx - hw])
    if (s.W - (cx + hw) >= s.minSlot) out.push([cx + hw, s.W])
    return out
  }

  // Lays out every paragraph around a circle at (cx, cy). Returns the text
  // height. When place is true, writes positions to the word elements.
  function layoutText(cx, cy, place) {
    let y = 0
    for (const p of model) {
      let cursor = { segmentIndex: 0, graphemeIndex: 0 }
      let done = false
      let k = 0
      let guard = 0
      while (!done && guard++ < 400) {
        const slots = slotsAt(y, cx, cy)
        let rowUsed = false
        for (const [x0, x1] of slots) {
          const w = x1 - x0
          const range = layoutNextLineRange(p.prep, w, cursor)
          if (!range) {
            done = true
            break
          }
          const a = toOffset(p, range.start)
          const b = toOffset(p, range.end)
          if (b <= a) {
            done = true
            break
          }
          // In a narrow slot, never split a word; leave it for the next slot.
          if (w < s.W - 1 && range.end.graphemeIndex > 0) continue
          rowUsed = true
          cursor = range.end
          if (place) {
            while (k < p.pieces.length && p.pieces[k].a < b) {
              const pc = p.pieces[k]
              const trailing = pc.space && pc.b >= b
              const leading = pc.space && pc.a <= a
              if (pc.a < a || trailing || leading) hide(pc)
              else put(pc, x0 + p.prefix[pc.a] - p.prefix[a], y)
              k++
            }
          }
          if (b >= p.text.length) {
            done = true
            break
          }
        }
        if (rowUsed || !done) y += s.lh
      }
      if (place) while (k < p.pieces.length) hide(p.pieces[k++])
      y += s.gap
    }
    return y - s.gap
  }

  function put(pc, x, y) {
    if (!pc.shown) {
      if (pc.el) pc.el.style.visibility = ''
      pc.shown = true
    }
    if (x !== pc.x || y !== pc.y) {
      pc.x = x
      pc.y = y
      if (pc.el) pc.el.style.transform = `translate3d(${x.toFixed(2)}px,${y}px,0)`
    }
  }
  function hide(pc) {
    if (pc.shown) {
      if (pc.el) pc.el.style.visibility = 'hidden'
      pc.shown = false
    }
  }

  function placeRuns() {
    for (const p of model) {
      for (const ph of p.phrases) {
        const runs = []
        for (const pc of ph.pieces) {
          if (!pc.shown) continue
          const last = runs[runs.length - 1]
          if (last && last.y === pc.y && last.b === pc.a) last.b = pc.b
          else runs.push({ a: pc.a, b: pc.b, x: pc.x, y: pc.y })
        }
        for (let i = 0; i < Math.max(runs.length, ph.els.length); i++) {
          let el = ph.els[i]
          const r = runs[i]
          if (!el) {
            el = document.createElement('span')
            el.className = `w ax ax-${ph.level}${ph.lit ? ' is-lit' : ''}`
            el.k = ''
            layer.appendChild(el)
            ph.els.push(el)
          }
          if (!r) {
            if (el.k !== 'off') {
              el.style.visibility = 'hidden'
              el.k = 'off'
            }
            continue
          }
          const txt = p.text.slice(r.a, r.b)
          const k = `${r.a}:${r.b}:${r.x.toFixed(2)}:${r.y}`
          if (el.k === k) continue
          if (el.textContent !== txt) el.textContent = txt
          el.style.transform = `translate3d(${r.x.toFixed(2)}px,${r.y}px,0)`
          el.style.visibility = ''
          el.k = k
        }
      }
    }
  }

  function updateLit() {
    const reach = s.R + s.pad + s.lh * 1.25
    for (const p of model) {
      for (const ph of p.phrases) {
        let lit = false
        for (const pc of ph.pieces) {
          if (!pc.shown) continue
          const w = p.prefix[pc.b] - p.prefix[pc.a]
          const nx = clamp(s.x, pc.x, pc.x + w)
          const ny = clamp(s.y, pc.y, pc.y + s.lh)
          if (Math.hypot(s.x - nx, s.y - ny) < reach) {
            lit = true
            break
          }
        }
        lit = lit || ph.cue
        if (lit !== ph.lit) {
          ph.lit = lit
          for (const el of ph.els) el.classList.toggle('is-lit', lit)
        }
      }
    }
  }

  function relayout() {
    const h = layoutText(s.x, s.y, true)
    placeRuns()
    const want = Math.ceil(Math.max(h, s.hBase + s.R * 0.6, s.y + s.R + 4))
    if (want !== s.height) {
      s.height = want
      stage.style.height = `${want}px`
    }
    med.style.transform = `translate3d(${(s.x - s.R).toFixed(2)}px,${(s.y - s.R).toFixed(2)}px,0)`
    updateLit()
    s.lastX = s.x
    s.lastY = s.y
  }

  function bounds() {
    return { x0: s.R, x1: s.W - s.R, y0: s.R, y1: Math.max(s.R, s.hBase + s.R * 0.6 - s.R) }
  }

  function frame(t) {
    if (disposed) return false
    const dt = Math.min(0.05, s.t ? (t - s.t) / 1000 : 1 / 60)
    s.t = t
    const t0 = performance.now()
    const b = bounds()
    const px = s.x
    const py = s.y
    if (s.mode === 'key') {
      const e = 1 - Math.exp(-dt * 14)
      s.x += (s.tx - s.x) * e
      s.y += (s.ty - s.y) * e
      if (Math.abs(s.tx - s.x) < 0.3 && Math.abs(s.ty - s.y) < 0.3) {
        s.x = s.tx
        s.y = s.ty
        s.mode = 'rest'
      }
    } else if (s.mode === 'glide') {
      s.x += s.vx * dt
      s.y += s.vy * dt
      const f = Math.exp(-dt * 5)
      s.vx *= f
      s.vy *= f
      if (s.x < b.x0 || s.x > b.x1) s.vx = 0
      if (s.y < b.y0 || s.y > b.y1) s.vy = 0
      if (Math.hypot(s.vx, s.vy) < 8) s.mode = 'rest'
    } else if (s.mode === 'drag') {
      s.x = s.tx
      s.y = s.ty
    }
    s.x = clamp(s.x, b.x0, b.x1)
    s.y = clamp(s.y, b.y0, b.y1)
    if (s.mode !== 'glide' && dt > 0) {
      s.vx += ((s.x - px) / dt - s.vx) * 0.35
      s.vy += ((s.y - py) / dt - s.vy) * 0.35
    }

    // The inscription ring turns only while the medallion travels, and the
    // face tilts toward the direction of travel; at rest both settle still
    // (the conductor may then let the ring breathe).
    const speed = Math.hypot(s.vx, s.vy)
    s.angle = (s.angle + dt * Math.min(speed, 1600) * 0.05) % 360
    const ty = clamp(s.vx * 0.03, -24, 24)
    const tx = clamp(-s.vy * 0.03, -24, 24)
    const te = 1 - Math.exp(-dt * 8)
    s.tiltX += (tx - s.tiltX) * te
    s.tiltY += (ty - s.tiltY) * te
    if (s.mode === 'rest' && speed < 2 && Math.abs(s.tiltX) < 0.15 && Math.abs(s.tiltY) < 0.15) {
      s.tiltX = 0
      s.tiltY = 0
      s.vx = 0
      s.vy = 0
    }
    writeRing()
    tilt.style.transform = `perspective(700px) rotateX(${s.tiltX.toFixed(2)}deg) rotateY(${s.tiltY.toFixed(2)}deg)`

    if (s.x !== s.lastX || s.y !== s.lastY) relayout()

    s.frames.push(t, performance.now() - t0)
    if (s.frames.length > 7200) s.frames.splice(0, 3600)
    const more = s.visible && (s.mode !== 'rest' || s.vx !== 0 || s.vy !== 0 || s.tiltX !== 0 || s.tiltY !== 0)
    if (!more) {
      s.t = 0
      if (s.touched && !drag) {
        s.touched = false
        conductor?.release()
      }
    }
    return more
  }

  function writeRing() {
    ring.style.transform = `rotate(${s.angle.toFixed(2)}deg)`
  }

  // One loop for the page: frames come from the conductor when it is there,
  // from requestAnimationFrame otherwise.
  function loop(t) {
    s.raf = frame(t) ? requestAnimationFrame(loop) : 0
  }
  function start() {
    if (!s.visible) return
    if (conductor) conductor.drive(frame)
    else if (!s.raf) {
      s.t = 0
      s.raf = requestAnimationFrame(loop)
    }
  }
  // The reader has taken hold of the medallion: every accent steps aside.
  function touch() {
    s.touched = true
    conductor?.hold()
  }

  let drag = null
  function onPointerDown(e) {
    if (e.button !== 0) return
    hit.setPointerCapture(e.pointerId)
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: s.x, oy: s.y }
    s.tx = s.x
    s.ty = s.y
    s.mode = 'drag'
    stage.classList.add('is-dragging')
    touch()
    start()
  }
  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.id) return
    const b = bounds()
    s.tx = clamp(drag.ox + e.clientX - drag.sx, b.x0, b.x1)
    s.ty = clamp(drag.oy + e.clientY - drag.sy, b.y0, b.y1)
  }
  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return
    drag = null
    stage.classList.remove('is-dragging')
    s.mode = Math.hypot(s.vx, s.vy) > 60 ? 'glide' : 'rest'
  }
  function onKeyDown(e) {
    const step = e.shiftKey ? s.lh * 4 : s.lh
    let dx = 0
    let dy = 0
    if (e.key === 'ArrowLeft') dx = -step
    else if (e.key === 'ArrowRight') dx = step
    else if (e.key === 'ArrowUp') dy = -step
    else if (e.key === 'ArrowDown') dy = step
    else if (e.key === 'Home') {
      s.tx = s.W - s.R - 2
      s.ty = s.R + 2
      s.mode = 'key'
      e.preventDefault()
      touch()
      start()
      return
    } else return
    e.preventDefault()
    const b = bounds()
    const fromX = s.mode === 'key' ? s.tx : s.x
    const fromY = s.mode === 'key' ? s.ty : s.y
    s.tx = clamp(fromX + dx, b.x0, b.x1)
    s.ty = clamp(fromY + dy, b.y0, b.y1)
    s.mode = 'key'
    touch()
    start()
  }
  hit.addEventListener('pointerdown', onPointerDown)
  hit.addEventListener('pointermove', onPointerMove)
  hit.addEventListener('pointerup', onPointerUp)
  hit.addEventListener('pointercancel', onPointerUp)
  hit.addEventListener('keydown', onKeyDown)

  let disposed = false
  function setup() {
    if (disposed) return
    prepare()
    measureStage()
    relayout()
    stage.classList.add('is-ready')
  }
  setup()
  const ro = new ResizeObserver(() => {
    if (stage.clientWidth !== s.W) {
      measureStage()
      relayout()
    }
  })
  ro.observe(stage)
  const io = new IntersectionObserver(([en]) => {
    s.visible = en.isIntersecting
    if (s.visible) start()
  })
  io.observe(stage)
  const onFonts = () => {
    if (disposed) return
    clearCache()
    setup()
  }
  document.fonts?.ready.then(onFonts)
  document.fonts?.addEventListener('loadingdone', onFonts)

  // Verification hooks: [timestamp, engine ms] pairs and the medallion state.
  window.__storyFrames = () => s.frames.slice()
  window.__storyState = () => ({ x: s.x, y: s.y, R: s.R, W: s.W, h: s.height, lit: model.flatMap((p) => p.phrases.filter((ph) => ph.lit).map((ph) => ph.level)) })

  // What the conductor may do: light a phrase once, and let the ring breathe.
  const allPhrases = model.flatMap((p) => p.phrases)
  conductor?.attachStory({
    count: allPhrases.length,
    cue(i, on) {
      const ph = allPhrases[i]
      if (!ph || ph.cue === on) return
      ph.cue = on
      updateLit()
    },
    // The breath is a compositor animation of the ring's own `scale`
    // (separate from the rotation the engine writes), so it costs the main
    // thread nothing while it runs. Returns how long the settle takes.
    breathe(on) {
      if (on) {
        if (!s.breathAnim && ring.animate) {
          s.breathAnim = ring.animate(
            [
              { scale: '1', easing: 'cubic-bezier(0.37,0,0.63,1)' },
              { scale: '1.014', easing: 'cubic-bezier(0.37,0,0.63,1)' },
              { scale: '1' },
            ],
            { duration: 6000, iterations: Infinity },
          )
        }
        return 0
      }
      if (!s.breathAnim) return 0
      const cur = parseFloat(getComputedStyle(ring).scale) || 1
      s.breathAnim.cancel()
      s.breathAnim = null
      if (Math.abs(cur - 1) < 0.0005) return 0
      ring.animate([{ scale: String(cur) }, { scale: '1' }], { duration: 300, easing: 'cubic-bezier(0.23,1,0.32,1)' })
      return 300
    },
  })

  return {
    dispose() {
      disposed = true
      s.visible = false
      s.breathAnim?.cancel()
      cancelAnimationFrame(s.raf)
      conductor?.detachStory()
      if (s.touched) conductor?.release()
      ro.disconnect()
      io.disconnect()
      document.fonts?.removeEventListener('loadingdone', onFonts)
      hit.removeEventListener('pointerdown', onPointerDown)
      hit.removeEventListener('pointermove', onPointerMove)
      hit.removeEventListener('pointerup', onPointerUp)
      hit.removeEventListener('pointercancel', onPointerUp)
      hit.removeEventListener('keydown', onKeyDown)
      layer.replaceChildren()
      stage.style.height = ''
      med.style.transform = ''
      ring.style.transform = ''
      tilt.style.transform = ''
      stage.classList.remove('is-ready', 'is-dragging')
      delete window.__storyFrames
      delete window.__storyState
    },
  }
}

function init() {
  const section = document.getElementById('story')
  if (!section) return
  const stage = section.querySelector('.story__stage')
  const flow = section.querySelector('.story__flow')
  const med = section.querySelector('.medallion')
  const tilt = section.querySelector('.medallion__tilt')
  const ring = section.querySelector('.medallion__ring')
  if (!stage || !flow || !med || !tilt || !ring || typeof ResizeObserver === 'undefined') return

  const layer = document.createElement('div')
  layer.className = 'story__layer'
  layer.setAttribute('aria-hidden', 'true')
  const hit = document.createElement('button')
  hit.type = 'button'
  hit.className = 'medallion__hit'
  hit.setAttribute('aria-label', 'Hermes medallion. Use the arrow keys to move it through the story, Shift to move faster, Home to put it back.')
  hit.setAttribute('aria-describedby', 'story-key-h')
  const staticLabel = med.getAttribute('aria-label')
  const hints = section.querySelectorAll('[data-story-hint]')

  let engine = null
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  function apply() {
    const live = !mq.matches
    if (live && !engine) {
      stage.classList.replace('story__stage--static', 'story__stage--live')
      flow.classList.add('story__flow--sr')
      med.removeAttribute('role')
      med.removeAttribute('aria-label')
      med.appendChild(hit)
      stage.appendChild(layer)
      for (const h of hints) h.hidden = h.dataset.storyHint !== 'live'
      engine = createEngine({ stage, layer, flow, med, hit, tilt, ring })
    } else if (!live && engine) {
      engine.dispose()
      engine = null
      hit.remove()
      layer.remove()
      med.setAttribute('role', 'img')
      if (staticLabel) med.setAttribute('aria-label', staticLabel)
      flow.classList.remove('story__flow--sr')
      stage.classList.replace('story__stage--live', 'story__stage--static')
      for (const h of hints) h.hidden = h.dataset.storyHint !== 'static'
    }
  }
  apply()
  mq.addEventListener('change', apply)
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
else init()
