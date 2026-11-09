// Deploy Axiom homepage: the loader for the medallion story, and the motion
// conductor that owns every accent on the page.
//
// One conductor owns finite arrivals, interactions and quiet section-local
// ambient life. The reading section alone may move; ambient accents yield to
// interactions and never run beside the gate's reference caduceus. New chain
// and divider draws are capped at 30 and 12 fps. The loop sleeps offscreen
// and while hidden. Reduced motion keeps the finished page and a manual,
// non-animated order walkthrough; neither story engine is loaded.
(function () {
  'use strict'
  var win = window
  var doc = document
  var mq = win.matchMedia('(prefers-reduced-motion: reduce)')
  var easeOut = function (x) { return 1 - Math.pow(1 - x, 3) }
  var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x }
  var now = function () { return win.performance.now() }

  var GAP = 120 // ms of stillness between one accent ending and the next
  var DWELL = 280 // ms a section must hold the reading line before its accent
  var BLINK = 1100 // one blink cycle: on 550 ms, off 550 ms (under 1 flash/s)
  var texture = doc.querySelector('.page-texture__tile')
  var textureLast = 0, textureTime = 0
  function textureTick(t) {
    if (!textureLast) textureLast = t
    var delta = t - textureLast
    if (delta < 250) return 250 - delta
    textureTime += delta; textureLast = t
    // Whole CSS pixels keep these subpixel dots visible throughout the drift
    // and when reduced motion freezes the current position.
    texture.style.transform = 'translate(' + Math.round(6 * Math.sin(textureTime / 11000)) + 'px,' + Math.round(4 * Math.sin(textureTime / 17000)) + 'px)'
    return 250
  }

  // Diagram selection is independent of motion: native buttons still work
  // under reduced motion. Without JS, every short explanation stays visible.
  var system = doc.getElementById('system')
  if (system) {
    var nodes = [].slice.call(system.querySelectorAll('[data-system-node]'))
    var panels = [].slice.call(system.querySelectorAll('.system__details > div'))
    var selectNode = function (key) {
      system.dataset.runStep = key
      nodes.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.systemNode === key)) })
      panels.forEach(function (panel) { panel.hidden = panel.id !== 'system-' + key + '-info' })
      if (win.AxChain) win.AxChain.select(key)
    }
    system.classList.add('is-interactive')
    selectNode('intro')
    nodes.forEach(function (button) {
      button.disabled = false
      button.addEventListener('click', function () { stopOrder(button.dataset.systemNode) })
      button.addEventListener('focus', function () { if (!chainRun) selectNode(button.dataset.systemNode) })
      button.addEventListener('pointerenter', function (event) { if (!chainRun && event.pointerType === 'mouse') selectNode(button.dataset.systemNode) })
    })
    var controls = doc.createElement('div')
    controls.className = 'system__controls'
    var runButton = doc.createElement('button')
    runButton.type = 'button'
    runButton.textContent = 'Run one order'
    runButton.setAttribute('aria-controls', 'system-panels')
    var cancelButton = doc.createElement('button')
    cancelButton.type = 'button'
    cancelButton.textContent = 'Cancel order'
    cancelButton.disabled = true
    var example = doc.createElement('span')
    example.textContent = 'An example order, not a live action.'
    var orderSpinner = doc.createElement('span')
    orderSpinner.className = 'system__spinner'
    orderSpinner.setAttribute('aria-hidden', 'true')
    var spinnerSpec = win.AxCliSpinners && win.AxCliSpinners.dots
    controls.append(runButton, cancelButton, orderSpinner, example)
    system.querySelector('.system__caption').after(controls)
    system.querySelector('.system__details').id = 'system-panels'
    system.dataset.runState = 'idle'
    runButton.addEventListener('click', runOrder)
    cancelButton.addEventListener('click', function () { stopOrder('intro') })
    system.addEventListener('keydown', function (event) { if (event.key === 'Escape') { stopOrder('intro'); event.preventDefault() } })
  }

  // ---------------------------------------------------------------- conductor
  var C = {
    enabled: false,
    accent: null,
    queue: [],
    drivers: [],
    raf: 0,
    timer: 0,
    lastT: 0,
    nextAt: 0,
    held: false,
    holdUntil: 0,
    active: null,
    reading: null,
    story: null,
    cad: null,
    played: {},
    log: [],
  }

  // The loop runs a frame only when something changes on that frame. An
  // accent's tick returns true when it has ended, false when it needs the
  // next frame, or a number of ms it can sleep (a blinking cursor changes
  // twice a second, not sixty times). Sleeping hands the frame back to the
  // browser, so scrolling stays on the compositor; one wake timer at most.
  function wake() {
    if (doc.hidden) return
    if (C.timer) {
      win.clearTimeout(C.timer)
      C.timer = 0
    }
    if (!C.raf && (C.enabled || C.drivers.length)) C.raf = win.requestAnimationFrame(frame)
  }
  function sleep(ms) {
    if (C.timer) win.clearTimeout(C.timer)
    C.timer = win.setTimeout(function () {
      C.timer = 0
      if (!C.raf && !doc.hidden) C.raf = win.requestAnimationFrame(frame)
    }, Math.max(0, ms - 8))
  }

  function endAccent(t) {
    C.accent.entry.t1 = t
    C.accent = null
    C.nextAt = t + GAP
  }

  function frame(t) {
    C.raf = 0
    if (doc.hidden) return
    var dt = C.lastT ? Math.min(0.05, (t - C.lastT) / 1000) : 1 / 60
    C.lastT = t
    var nextFrame = false
    var wait = Infinity

    // Drivers: per-frame work owned by an interaction (the medallion drag).
    if (C.drivers.length) {
      var live = []
      for (var i = 0; i < C.drivers.length; i++) if (C.drivers[i](t, dt)) live.push(C.drivers[i])
      C.drivers = live
      if (live.length) nextFrame = true
    }

    if (C.enabled) {
      if (texture && C.active) wait = Math.min(wait, textureTick(t))
      if (C.chrome) wait = Math.min(wait, C.chrome.tick(t))
      var tn = now()
      var r = C.accent ? C.accent.tick(tn) : null
      if (r === true) endAccent(tn)
      if (!C.accent && C.queue.length && !C.held && tn >= C.holdUntil && tn >= C.nextAt) {
        var next = C.queue[0]
        if (tn >= (next.notBefore || 0)) {
          C.queue.shift()
          if (!next.section || next.section === C.active) {
            next.entry = { id: next.id, section: sectionName(next.section), t0: tn, t1: null }
            C.log.push(next.entry)
            if (C.log.length > 400) C.log.splice(0, 200)
            C.accent = next
            next.begin(tn)
            r = next.tick(tn)
            if (r === true) endAccent(tn)
          }
        }
      }
      if (C.accent) {
        if (r === false) nextFrame = true
        else if (typeof r === 'number') wait = Math.min(wait, r)
        else nextFrame = true
      } else if (C.queue.length && !C.held) {
        var due = Math.max(C.holdUntil, C.nextAt, C.queue[0].notBefore || 0) - tn
        if (due <= 16) nextFrame = true
        else wait = Math.min(wait, due)
      }
    }

    if (nextFrame) C.raf = win.requestAnimationFrame(frame)
    else {
      C.lastT = 0
      if (wait < Infinity) sleep(wait)
    }
  }

  function sectionName(el) {
    if (!el) return ''
    return el.id || (el.classList.contains('gate') ? 'gate' : 'hero')
  }

  // Ask the running accent to finish (it settles within ~300 ms) and drop
  // anything queued; the hand-off waits for the settle.
  function settleAll() {
    C.queue.length = 0
    if (C.accent) C.accent.settle(now())
    wake()
  }

  // Queue an accent. An ambient accent never blocks: anything new asks it
  // to settle first.
  function play(accent) {
    if (C.accent && C.accent.ambient) C.accent.settle(now())
    C.queue.push(accent)
    wake()
  }

  // ---------------------------------------------------------------- cursor
  // One terminal cursor on the page. It lives at the prompt of the section
  // being read (in the hero it is the block after the headline).
  var heroCursor = doc.querySelector('.hero__title .cursor')
  var cursorHost = null

  function hostFor(section) {
    if (!section) return null
    if (section.classList.contains('hero')) return heroCursor
    return section.querySelector('.head .prompt')
  }

  function placeCursor(section) {
    var host = hostFor(section)
    if (host === cursorHost) return
    if (cursorHost) cursorHost.classList.remove('is-cursor', 'is-blink-off')
    if (heroCursor) heroCursor.classList.toggle('is-away', host !== heroCursor)
    cursorHost = host
    if (host) host.classList.add('is-cursor')
  }

  function clearCursors() {
    if (cursorHost) cursorHost.classList.remove('is-cursor', 'is-blink-off')
    cursorHost = null
    if (heroCursor) heroCursor.classList.remove('is-away', 'is-blink-off', 'is-cursor')
  }

  function cursorHandoff(section) {
    return {
      id: 'cursor-handoff', section: section,
      begin: function () { placeCursor(section) },
      tick: function () { return true },
      settle: function () {},
    }
  }

  function cursorBlink(section, cycles) {
    var t0 = 0
    var stop = false
    var host = null
    return {
      id: 'cursor-blink', section: section,
      begin: function (t) { t0 = t; host = hostFor(section) },
      tick: function (t) {
        if (!host) return true
        var e = t - t0
        var done = stop || e >= cycles * BLINK
        host.classList.toggle('is-blink-off', !done && e % BLINK >= BLINK / 2)
        return done || BLINK / 2 - (e % (BLINK / 2))
      },
      settle: function () { stop = true },
    }
  }

  // ---------------------------------------------------------------- ledger
  // The three numbers count up once, the first time the reader reaches the
  // ledger. Until then they wait dimmed at zero; a screen reader hears the
  // real number the whole time.
  var ledger = []
  function armLedger() {
    var proof = doc.getElementById('proof')
    if (!proof || C.played.ledger) return
    var nums = proof.querySelectorAll('.ledger__num')
    // Only when the ledger is out of sight at load: a number the reader has
    // already seen is never taken back to zero.
    if (!nums.length || nums[0].getBoundingClientRect().top < win.innerHeight) {
      C.played.ledger = true
      return
    }
    for (var i = 0; i < nums.length; i++) {
      var el = nums[i]
      var value = parseInt(el.textContent, 10)
      if (!isFinite(value)) continue
      var sr = doc.createElement('span')
      sr.className = 'ax-sr'
      sr.textContent = el.textContent
      el.setAttribute('aria-hidden', 'true')
      el.after(sr)
      el.textContent = '0'
      el.classList.add('is-pending')
      ledger.push({ el: el, sr: sr, value: value })
    }
  }

  function finishLedger() {
    for (var i = 0; i < ledger.length; i++) {
      var n = ledger[i]
      n.el.textContent = String(n.value)
      n.el.classList.remove('is-pending')
      n.el.style.opacity = ''
      n.el.removeAttribute('aria-hidden')
      n.sr.remove()
    }
    ledger = []
    C.played.ledger = true
  }

  function ledgerCount(section) {
    var DUR = 640
    var STAGGER = 70
    var t0 = 0
    var stop = false
    return {
      id: 'ledger-count', section: section,
      begin: function (t) { t0 = t; C.played.ledger = true },
      tick: function (t) {
        if (stop) { finishLedger(); return true }
        var all = true
        for (var i = 0; i < ledger.length; i++) {
          var n = ledger[i]
          var p = clamp01((t - t0 - i * STAGGER) / DUR)
          var e = easeOut(p)
          var txt = String(Math.round(n.value * e))
          if (n.el.textContent !== txt) n.el.textContent = txt
          n.el.style.opacity = String(0.35 + 0.65 * e)
          if (p < 1) all = false
        }
        if (all) finishLedger()
        return all
      },
      settle: function () { stop = true },
    }
  }

  // ---------------------------------------------------------------- replay
  // The example job's rows appear once, in order, the first time the reader
  // reaches the replay, with a beat at the held row before the yes. Until
  // then they wait dimmed in place (nothing moves, nothing is hidden from a
  // screen reader). With no JavaScript or reduced motion the log is complete.
  var replay = []
  function armReplay() {
    var sec = doc.getElementById('replay')
    if (!sec || C.played.replay) return
    var rows = sec.querySelectorAll('.replay__row')
    if (!rows.length || rows[0].getBoundingClientRect().top < win.innerHeight) {
      C.played.replay = true
      return
    }
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.add('is-pending')
      replay.push(rows[i])
    }
  }

  function finishReplay() {
    for (var i = 0; i < replay.length; i++) {
      replay[i].classList.remove('is-pending')
      replay[i].style.opacity = ''
    }
    replay = []
    C.played.replay = true
  }

  function replayRun(section) {
    var STEP = 300
    var FADE = 260
    var BEAT = 900 // the pause at the held row, before the yes
    var t0 = 0
    var stop = false
    var starts = []
    return {
      id: 'replay-run', section: section,
      begin: function (t) {
        t0 = t
        C.played.replay = true
        var at = 0
        for (var i = 0; i < replay.length; i++) {
          starts.push(at)
          at += STEP
          if (replay[i].classList.contains('replay__row--hold')) at += BEAT
        }
      },
      tick: function (t) {
        if (stop) { finishReplay(); return true }
        var all = true
        for (var i = 0; i < replay.length; i++) {
          var p = clamp01((t - t0 - starts[i]) / FADE)
          var e = easeOut(p)
          replay[i].style.opacity = String(0.18 + 0.82 * e)
          if (p < 1) all = false
        }
        if (all) finishReplay()
        return all
      },
      settle: function () { stop = true },
    }
  }

  // ---------------------------------------------------------------- story
  // The story engine (story.js) attaches itself here when it is live. Two
  // accents belong to it: the signals light once in reading order the first
  // time the reader arrives, and the ring breathes while the medallion rests.
  function signalSweep(section) {
    var SLOT = 520
    var LIT = 420
    var FADE = 240 // the .ax color transition
    var t0 = 0
    var stop = false
    var stopAt = 0
    var count = 0
    return {
      id: 'signal-sweep', section: section,
      begin: function (t) { t0 = t; C.played.sweep = true; count = C.story ? C.story.count : 0 },
      tick: function (t) {
        var st = C.story
        if (!st) return true
        var e = t - t0
        for (var i = 0; i < count; i++) st.cue(i, !stop && e >= i * SLOT && e < i * SLOT + LIT)
        if (stop) return t - stopAt >= FADE || FADE - (t - stopAt)
        var end = (count - 1) * SLOT + LIT + FADE
        if (e >= end) return true
        // Sleep to the next light switching on or off (the fade is CSS).
        var k = Math.floor(e / SLOT)
        var next = e < k * SLOT + LIT ? k * SLOT + LIT : (k + 1) * SLOT
        return Math.min(next, end) - e
      },
      settle: function (t) { if (!stop) { stop = true; stopAt = t } },
    }
  }

  // The breath itself runs on the compositor (story.js starts and stops it);
  // the conductor only decides when it may breathe, so it sleeps meanwhile.
  function ringBreath(section) {
    var stop = false
    var stopAt = 0
    var settleMs = 0
    return {
      id: 'ring-breath', section: section, ambient: true,
      begin: function () { if (C.story) C.story.breathe(true) },
      tick: function (t) {
        if (!C.story) return true
        if (stop) return t - stopAt >= settleMs || settleMs - (t - stopAt)
        return 60000
      },
      settle: function (t) {
        if (stop) return
        stop = true
        stopAt = t
        settleMs = C.story ? C.story.breathe(false) : 0
      },
    }
  }

  // ---------------------------------------------------------------- caduceus
  // The gate's caduceus lives while the gate is the section being read
  // (caduceus.js draws; this decides when). Its wings and snakes ease in over
  // 1.6 s, move on their own clocks at 24 frames a second, and ease back to
  // rest over 0.9 s when the reader moves on. Ambient: anything else that
  // needs the stage asks it to settle first.
  function caduceusLife(section) {
    var last = 0, activeTime = 0, stop = false, stopAt = 0, from = 0, amt = 0
    var IN = 1600, OUT = 900, STEP = 1000 / 24
    return {
      id: 'caduceus-life', section: section, ambient: true,
      begin: function (t) { last = t },
      tick: function (t) {
        if (!C.cad || !C.cad.inView) return true
        var delta = last ? t - last : 0
        last = t
        if (!stop) {
          activeTime += delta
          C.cad.elapsed += delta
          C.cad.entrance = Math.min(1100, C.cad.entrance + delta)
        }
        if (stop) amt = from * (1 - easeOut(clamp01((t - stopAt) / OUT)))
        else amt = easeOut(clamp01(activeTime / IN))
        C.cad.draw(C.cad.elapsed / 1000, amt, C.cad.entrance / 1100)
        if (stop && t - stopAt >= OUT) return true
        return STEP
      },
      pause: function () { last = 0 },
      settle: function (t) { if (!stop) { stop = true; stopAt = t; from = amt } },
    }
  }

  // ---------------------------------------------------------------- A295 life
  // Finite, local accents. These use the same queue as the cursor and gate;
  // none can run beside the caduceus or keep an offscreen loop alive.
  function surfaceAccent(id, section, elements, duration, draw) {
    var t0 = 0, stop = false
    return {
      id: id, section: section,
      begin: function (t) { t0 = t; if (id !== 'link-response') C.played['life-' + section.id] = true },
      tick: function (t) {
        var p = stop ? 1 : clamp01((t - t0) / duration)
        elements.forEach(function (el) { draw(el, p) })
        if (p === 1) elements.forEach(function (el) { el.style.opacity = ''; el.style.transform = '' })
        return p === 1 || 1000 / 30
      },
      settle: function () { stop = true },
    }
  }
  function lifeFor(section) {
    if (C.played['life-' + section.id]) return null
    var id, elements, duration, draw
    if (section.id === 'system') {
      id = 'diagram-arrival'; duration = 900
      elements = [].slice.call(section.querySelectorAll('.system__lines'))
      draw = function (el, p) { el.style.opacity = String(0.42 + 0.58 * easeOut(p)) }
    } else if (section.id === 'work' || section.id === 'limits') {
      id = 'head-arrival'; duration = 620
      elements = [].slice.call(section.querySelectorAll('.head h2'))
      draw = function (el, p) { el.style.opacity = String(0.64 + 0.36 * easeOut(p)) }
    } else if (section.id === 'method') {
      id = 'rule-breath'; duration = 2200
      elements = [].slice.call(section.querySelectorAll('.life-rule'))
      draw = function (el, p) {
        var breath = Math.sin(Math.PI * p)
        el.style.opacity = String(0.48 + 0.3 * breath)
        el.style.transform = 'scaleX(' + (1 + 0.06 * breath) + ')'
      }
    } else if (section.id === 'catalog' || section.id === 'notes') {
      id = 'braille-shimmer'; duration = 2200
      elements = [].slice.call(section.querySelectorAll('.life-texture'))
      draw = function (el, p) { el.style.opacity = String(0.16 + 0.2 * Math.sin(Math.PI * p)) }
    } else return null
    return surfaceAccent(id, section, elements, duration, draw)
  }
  // Decoration is inserted only for motion-enabled visits. All source copy
  // remains untouched, in its final state, with no JS or reduced motion.
  function armLife() {
    ;['method', 'catalog', 'notes'].forEach(function (id) {
      var head = doc.querySelector('#' + id + ' .head')
      if (!head || head.querySelector('.life-rule, .life-texture')) return
      var accent = doc.createElement('span')
      accent.className = id === 'method' ? 'life-rule' : 'life-texture'
      accent.setAttribute('aria-hidden', 'true')
      if (id !== 'method') accent.textContent = '⠂⠐⠠⠄⠂⠐⠠⠄'
      head.appendChild(accent)
    })
    doc.querySelectorAll('main section.section:not(#story)').forEach(function (section, index) {
      if (section.querySelector('.life-divider')) return
      var divider = doc.createElement('span')
      divider.className = 'life-divider'
      divider.setAttribute('aria-hidden', 'true')
      divider.dataset.period = String(6300 + index * 283)
      divider.dataset.phase = String(index * 1.71)
      section.appendChild(divider)
    })
  }
  function breatheRules(section, elapsed) {
    var divider = section.querySelector('.life-divider')
    if (!divider) return
    var wave = Math.sin(elapsed * 2 * Math.PI / Number(divider.dataset.period) + Number(divider.dataset.phase))
    divider.style.opacity = String(.20 + .04 * wave)
    var rule = section.querySelector('.life-rule')
    if (rule) rule.style.opacity = String(.52 + .04 * Math.sin(elapsed * 2 * Math.PI / 8731 + 2.3))
  }
  function resetRules(section) {
    section.querySelectorAll('.life-divider,.life-rule').forEach(function (el) { el.style.opacity = '' })
  }
  function dividerBreath(section) {
    var last = 0, elapsed = 0, stop = false
    return {
      id: 'divider-breath', section: section, ambient: true,
      begin: function (t) { last = t },
      tick: function (t) {
        if (stop) { resetRules(section); return true }
        if (!last) last = t
        var delta = t - last
        if (delta < 1000 / 12) return 1000 / 12 - delta
        elapsed += delta; last = t
        breatheRules(section, elapsed)
        return 1000 / 12
      },
      pause: function () { last = 0 },
      settle: function () { stop = true; resetRules(section) },
    }
  }
  var responses = doc.querySelectorAll('#work .listing__link a, #notes .notes-list a')
  function respond(event) {
    if (event.type === 'pointerenter' && event.pointerType !== 'mouse') return
    var el = event.currentTarget, section = el.closest('section')
    if (!C.enabled || doc.hidden || C.held || section !== C.active) return
    if ((C.accent && C.accent.id === 'link-response') || C.queue.some(function (a) { return a.id === 'link-response' })) return
    settleAll()
    play(surfaceAccent('link-response', section, [el], 700, function (link, p) {
      // A two-pixel acknowledgement, not a moving target or a spring.
      link.style.transform = 'translateX(' + (2 * Math.sin(Math.PI * p)) + 'px)'
    }))
    play(dividerBreath(section))
  }
  for (var ri = 0; ri < responses.length; ri++) {
    responses[ri].addEventListener('pointerenter', respond)
    responses[ri].addEventListener('focus', respond)
  }

  // ---------------------------------------------------------------- living chain
  var chainTime = 0
  var chainBreathTime = 0
  var chainRun = null
  var orderKeys = ['owner', 'operator', 'workers', 'axioma', 'gatekeeper', 'standing', 'tripwire', 'handydandy', 'owner']
  var orderTravel = [0, 550, 550, 700, 450, 700, 700, 700, 900]
  var orderHold = [200, 200, 200, 1500, 1500, 1500, 1500, 1500, 0]

  function stopOrder(key) {
    if (!system) return
    chainRun = null
    orderSpinner.textContent = ''
    system.dataset.runState = 'idle'
    system.dataset.runStep = key
    runButton.textContent = 'Run one order'
    runButton.setAttribute('aria-disabled', 'false')
    if (doc.activeElement === cancelButton) runButton.focus()
    cancelButton.disabled = true
    hidePulse()
    selectNode(key)
  }
  function showOrderStep(key) {
    if (system.dataset.runStep === key) return
    system.dataset.runStep = key
    selectNode(key)
  }
  function runOrder() {
    if (mq.matches) {
      if (!chainRun) chainRun = { manual: 0 }
      else chainRun.manual++
      if (chainRun.manual === orderKeys.length - 1) { stopOrder('owner'); return }
      runButton.textContent = 'Next step'
      system.dataset.runState = 'stepping'
      cancelButton.disabled = false
      showOrderStep(orderKeys[chainRun.manual])
      return
    }
    if (chainRun) return
    chainRun = { elapsed: 0 }
    system.dataset.runState = 'running'
    system.dataset.runElapsed = '0'
    cancelButton.disabled = false
    runButton.setAttribute('aria-disabled', 'true')
    showOrderStep('owner')
    settleAll()
    play(chainLife(system))
  }
  function drawOrder(delta) {
    chainRun.elapsed += delta
    // Only this example is working: the same active-time clock freezes the
    // loader during hidden/offscreen pauses, and each gate's resolution hold.
    if (spinnerSpec) {
      var glyph = spinnerSpec.frames[Math.floor(chainRun.elapsed / spinnerSpec.interval) % spinnerSpec.frames.length]
      if (orderSpinner.textContent !== glyph) orderSpinner.textContent = glyph
    }
    system.dataset.runElapsed = String(Math.round(chainRun.elapsed))
    var remaining = chainRun.elapsed
    for (var i = 0; i < orderKeys.length; i++) {
      if (remaining < orderTravel[i]) {
        system.dataset.runStep = 'travel'
        if (win.AxChain) win.AxChain.pulse('route', i - 1, remaining / orderTravel[i], .56)
        return
      }
      remaining -= orderTravel[i]
      if (remaining < orderHold[i]) {
        hidePulse()
        showOrderStep(orderKeys[i])
        return
      }
      remaining -= orderHold[i]
    }
    stopOrder('owner')
  }
  function hidePulse() {
    if (win.AxChain) win.AxChain.hidePulse()
  }
  function chainLife(section) {
    var last = 0, stop = false
    var edgeOrder = [0, 1, 3, 2, 5, 6, 4]
    return {
      id: 'chain-life', section: section, ambient: true,
      begin: function (t) { last = t },
      tick: function (t) {
        if (stop) { hidePulse(); return true }
        if (!last) last = t
        var delta = t - last
        if (delta < 1000 / 30) return 1000 / 30 - delta
        last = t
        chainBreathTime += delta
        breatheRules(section, chainBreathTime)
        if (chainRun) drawOrder(delta)
        else {
          chainTime += delta
          var edge = edgeOrder[Math.floor(chainTime / 3600) % edgeOrder.length]
          var p = (chainTime % 3600) / 3600
          if (win.AxChain) win.AxChain.pulse('edge', edge, p, .28 * Math.sin(Math.PI * p))
        }
        return 1000 / 30
      },
      pause: function () { last = 0 },
      settle: function () { stop = true; hidePulse(); resetRules(section) },
    }
  }

  // ---------------------------------------------------------------- sections
  function planFor(section) {
    if (section.id === 'system' && chainRun) { placeCursor(section); play(chainLife(section)); return }
    if (section.classList.contains('gate') && C.cad) { placeCursor(section); if (C.cad.inView) play(caduceusLife(section)); return }
    var t = now()
    play(cursorHandoff(section))
    var isStory = section.id === 'story'
    var main = null
    if (section.id === 'proof' && ledger.length && !C.played.ledger) main = ledgerCount(section)
    else if (section.id === 'replay' && replay.length && !C.played.replay) main = replayRun(section)
    else if (isStory && C.story && !C.played.sweep) main = signalSweep(section)
    else main = lifeFor(section)
    if (main) { main.notBefore = t + DWELL; play(main) }
    if (hostFor(section)) {
      var blink = cursorBlink(section, main ? 2 : 3)
      blink.notBefore = t + DWELL
      play(blink)
    }
    if (section.id === 'system') play(chainLife(section))
    else if (section.querySelector('.life-divider')) play(dividerBreath(section))
    if (isStory && C.story) play(ringBreath(section))

  }

  function setActive(section) {
    if (section === C.active) return
    C.active = section
    textureLast = 0
    settleAll()
    if (C.enabled && section) planFor(section)
  }

  var io = null
  function watchSections() {
    var sections = [].slice.call(doc.querySelectorAll('main .hero, main .gate, main section.section'))
    // The reading line sits 40% down the viewport; the section under it is
    // the one being read.
    io = new IntersectionObserver(function (entries) {
      var next = C.reading
      for (var i = 0; i < entries.length; i++) if (entries[i].target === next && !entries[i].isIntersecting) next = null
      for (var j = 0; j < entries.length; j++) if (entries[j].isIntersecting) next = entries[j].target
      C.reading = next
      setActive(next)
    }, { rootMargin: '-40% 0px -59% 0px' })
    for (var j = 0; j < sections.length; j++) io.observe(sections[j])
  }

  // ---------------------------------------------------------------- story API
  // Called by story.js. While the reader drags or keys the medallion, no
  // accent runs; the ring breathes again 1.2 s after it comes to rest.
  C.attachStory = function (api) {
    C.story = api
    if (C.enabled && C.active && C.active.id === 'story' && !C.held) {
      if (!C.played.sweep) {
        var s = signalSweep(C.active)
        s.notBefore = now() + DWELL
        play(s)
      }
      play(ringBreath(C.active))
    }
  }
  C.detachStory = function () {
    if (C.accent && C.accent.section && C.accent.section.id === 'story') C.accent.settle(now())
    C.story = null
  }
  C.hold = function () {
    if (C.held) return
    C.held = true
    C.played.sweep = true // the reader found the signals by hand
    settleAll()
  }
  C.release = function () {
    if (!C.held) return
    C.held = false
    C.holdUntil = now() + 1200
    if (C.enabled && C.story && C.active && C.active.id === 'story') play(ringBreath(C.active))
  }
  C.attachCaduceus = function (api) {
    C.cad = { draw: api.draw, restore: api.restore, elapsed: 0, entrance: 0, inView: false }
    if (!C.enabled) { C.cad.entrance = 1100; api.restore() }
    var art = doc.querySelector('.gate .caduceus'), section = art.closest('.gate')
    // The reference enters on actual visibility, not several scroll beats
    // later at the reading line. It takes the conductor, never a second loop.
    new IntersectionObserver(function (entries) {
      C.cad.inView = entries[0].isIntersecting
      if (!C.enabled) return
      if (!C.cad.inView) {
        C.queue = C.queue.filter(function (accent) { return accent.id !== 'caduceus-life' })
        if (C.accent && C.accent.id === 'caduceus-life') settleAll()
        if (C.active === section && C.reading !== section) setActive(C.reading)
        return
      }
      if (C.cad.entrance < 1100 && C.active !== section) setActive(section)
      else if (C.active === section && !C.held) { settleAll(); play(caduceusLife(section)) }
    }, { threshold: .1 }).observe(art)
  }
  C.drive = function (fn) {
    if (C.drivers.indexOf(fn) < 0) C.drivers.push(fn)
    wake()
  }

  // ---------------------------------------------------------------- on / off
  function enable() {
    if (C.enabled || mq.matches || !('IntersectionObserver' in win)) return
    if (chainRun) stopOrder('intro')
    C.enabled = true
    armLedger()
    armReplay()
    armLife()
    if (!io) watchSections()
    else if (C.active) planFor(C.active)
  }
  function disable() {
    if (!C.enabled) return
    C.enabled = false
    if (C.chrome) C.chrome.disable()
    textureLast = 0
    if (chainRun) stopOrder('intro')
    hidePulse()
    C.queue.length = 0
    if (C.accent) {
      // Jump the running accent to its end state at once.
      var t = now()
      C.accent.settle(t)
      for (var k = 1; C.accent && k < 20; k++) if (C.accent.tick(t + k * 1000) === true) endAccent(now())
      C.accent = null
    }
    if (C.timer) {
      win.clearTimeout(C.timer)
      C.timer = 0
    }
    if (ledger.length) finishLedger()
    if (replay.length) finishReplay()
    if (C.story) C.story.breathe(false)
    doc.getAnimations().forEach(function (animation) { animation.cancel() })
    // Keep the already-loaded engine available if motion is enabled again.
    if (C.cad) { C.cad.entrance = 1100; C.cad.restore() }
    doc.querySelectorAll('.life-rule, .life-texture, .life-divider').forEach(function (el) { el.remove() })
    clearCursors()
  }

  // No draws, timers or compositor breath while the tab is hidden. Resume
  // through the same scheduler; the caduceus engine and clocks are unchanged.
  var pausedAnimations = []
  doc.addEventListener('visibilitychange', function () {
    if (doc.hidden) {
      if (C.chrome) C.chrome.pause()
      if (C.accent && C.accent.pause) C.accent.pause()
      if (C.raf) win.cancelAnimationFrame(C.raf)
      if (C.timer) win.clearTimeout(C.timer)
      C.raf = 0; C.timer = 0; C.lastT = 0
      textureLast = 0
      pausedAnimations = doc.getAnimations().filter(function (animation) { return animation.playState === 'running' })
      pausedAnimations.forEach(function (animation) { animation.pause() })
    } else {
      pausedAnimations.forEach(function (animation) { if (C.enabled && animation.playState === 'paused') animation.play() })
      pausedAnimations = []
      wake()
    }
  })

  // Verification hooks.
  C.timeline = function () {
    return C.log.map(function (e) { return { id: e.id, section: e.section, t0: e.t0, t1: e.t1 } })
  }
  C.current = function () { return C.accent ? C.accent.id : null }
  win.__axConductor = C
  C.refresh = wake

  enable()
  if (mq.addEventListener) mq.addEventListener('change', function () { if (mq.matches) disable(); else enable() })

  // ---------------------------------------------------------------- loader
  // The caduceus drawing loads when the gate is about to scroll into view,
  // never for visitors who prefer reduced motion.
  var gate = doc.querySelector('main .gate .caduceus')
  var cadLoaded = false
  function watchGate() {
    if (!gate || mq.matches || cadLoaded || !('IntersectionObserver' in win)) return
    var gio = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting })) {
        gio.disconnect()
        if (cadLoaded || mq.matches) return
        cadLoaded = true
        var s = doc.createElement('script')
        s.src = '/assets/axioma/caduceus.js?v=2'
        s.defer = true
        doc.body.appendChild(s)
      }
    }, { rootMargin: '600px 0px' })
    gio.observe(gate)
  }
  watchGate()
  if (mq.addEventListener) mq.addEventListener('change', watchGate)

  // Loads the medallion story engine only when the story is about to scroll
  // into view, and never for visitors who prefer reduced motion (for them the
  // static story in the HTML is the whole experience).
  var story = doc.getElementById('story')
  if (!story || !('IntersectionObserver' in win)) return
  var loaded = false
  function load() {
    if (loaded) return
    loaded = true
    var s = doc.createElement('script')
    s.src = '/assets/axioma/story.js?v=3'
    s.defer = true
    doc.body.appendChild(s)
  }
  function watch() {
    if (mq.matches || loaded) return
    var lio = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting })) {
        lio.disconnect()
        load()
      }
    }, { rootMargin: '600px 0px' })
    lio.observe(story)
  }
  watch()
  if (mq.addEventListener) mq.addEventListener('change', watch)
})()
