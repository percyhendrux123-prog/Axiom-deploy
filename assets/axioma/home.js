// Deploy Axiom homepage: the loader for the medallion story, and the motion
// conductor that owns every accent on the page.
//
// The conductor is one scheduler on one requestAnimationFrame loop. Only one
// accent runs at a time; each has a cue (the reader reached a section, or
// let go of the medallion), a start and an end. When the reader moves to
// another section, whatever is running settles first, then the cursor hands
// over, then that section's accent plays. Nothing loops for decoration: the
// cursor blinks a few times on arrival and then holds still, and the only
// ambient motion (the medallion ring breathing) runs while the story is the
// section being read and yields the moment anything else needs the stage.
// The loop sleeps when nothing is moving.
//
// Visitors who prefer reduced motion get none of it: the conductor never
// starts, the HTML is the finished page (cursor solid, numbers final, story
// static), and the story engine is never loaded.
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

  // ---------------------------------------------------------------- conductor
  var C = {
    enabled: false,
    accent: null,
    queue: [],
    drivers: [],
    raf: 0,
    lastT: 0,
    nextAt: 0,
    held: false,
    holdUntil: 0,
    active: null,
    story: null,
    played: {},
    log: [],
  }

  // The loop runs a frame only when something changes on that frame. An
  // accent's tick returns true when it has ended, false when it needs the
  // next frame, or a number of ms it can sleep (a blinking cursor changes
  // twice a second, not sixty times). Sleeping hands the frame back to the
  // browser, so scrolling stays on the compositor; one wake timer at most.
  function wake() {
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
      if (!C.raf) C.raf = win.requestAnimationFrame(frame)
    }, Math.max(0, ms - 8))
  }

  function endAccent(t) {
    C.accent.entry.t1 = t
    C.accent = null
    C.nextAt = t + GAP
  }

  function frame(t) {
    C.raf = 0
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

  // ---------------------------------------------------------------- sections
  function planFor(section) {
    var t = now()
    play(cursorHandoff(section))
    var isStory = section.id === 'story'
    var main = null
    if (section.id === 'proof' && ledger.length && !C.played.ledger) main = ledgerCount(section)
    else if (isStory && C.story && !C.played.sweep) main = signalSweep(section)
    if (main) { main.notBefore = t + DWELL; play(main) }
    if (hostFor(section)) {
      var blink = cursorBlink(section, main ? 2 : 3)
      blink.notBefore = t + DWELL
      play(blink)
    }
    if (isStory && C.story) play(ringBreath(section))
  }

  function setActive(section) {
    if (section === C.active) return
    C.active = section
    settleAll()
    if (C.enabled) planFor(section)
  }

  var io = null
  function watchSections() {
    var sections = [].slice.call(doc.querySelectorAll('main .hero, main .gate, main section.section'))
    // The reading line sits 40% down the viewport; the section under it is
    // the one being read.
    io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) if (entries[i].isIntersecting) setActive(entries[i].target)
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
  C.drive = function (fn) {
    if (C.drivers.indexOf(fn) < 0) C.drivers.push(fn)
    wake()
  }

  // ---------------------------------------------------------------- on / off
  function enable() {
    if (C.enabled || mq.matches || !('IntersectionObserver' in win)) return
    C.enabled = true
    armLedger()
    if (!io) watchSections()
    else if (C.active) planFor(C.active)
  }
  function disable() {
    if (!C.enabled) return
    C.enabled = false
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
    if (C.story) C.story.breathe(false)
    clearCursors()
  }

  // Verification hooks.
  C.timeline = function () {
    return C.log.map(function (e) { return { id: e.id, section: e.section, t0: e.t0, t1: e.t1 } })
  }
  C.current = function () { return C.accent ? C.accent.id : null }
  win.__axConductor = C

  enable()
  if (mq.addEventListener) mq.addEventListener('change', function () { if (mq.matches) disable(); else enable() })

  // ---------------------------------------------------------------- loader
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
    s.src = '/assets/axioma/story.js?v=2'
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
