// Loads the medallion story engine only when the story is about to scroll
// into view, and never for visitors who prefer reduced motion (for them the
// static story in the HTML is the whole experience).
(function () {
  var story = document.getElementById('story')
  if (!story || !('IntersectionObserver' in window)) return
  var loaded = false
  function load() {
    if (loaded) return
    loaded = true
    var s = document.createElement('script')
    s.src = '/assets/axioma/story.js?v=1'
    s.defer = true
    document.body.appendChild(s)
  }
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  function watch() {
    if (mq.matches || loaded) return
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting })) {
        io.disconnect()
        load()
      }
    }, { rootMargin: '600px 0px' })
    io.observe(story)
  }
  watch()
  if (mq.addEventListener) mq.addEventListener('change', watch)
})()
