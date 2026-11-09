// Paper Shaders LiquidMetal 0.0.82, on the herm's two fine rings only.
// The SVG is never replaced. One small WebGL2 canvas, no private clock.
(function () {
  'use strict'
  var C = window.__axConductor, source = window.AxPaperMetal
  var med = document.querySelector('.medallion'), mq = matchMedia('(prefers-reduced-motion: reduce)')
  if (!C || !source || !med) return
  var visible = false, failed = false, gl = null, canvas = null, program = null
  var last = 0, elapsed = 0, draws = 0, uniforms = {}
  function init() {
    if (gl || failed || mq.matches) return
    var node = document.createElement('canvas')
    var context = node.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' })
    if (!context) { failed = true; return }
    gl = context; canvas = node
    canvas.className = 'medallion__chrome'
    canvas.setAttribute('aria-hidden', 'true')
    var shaders = []
    function compile(type, code) {
      var shader = gl.createShader(type)
      gl.shaderSource(shader, code); gl.compileShader(shader); shaders.push(shader)
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
    }
    program = gl.createProgram()
    var vertex = compile(gl.VERTEX_SHADER, source.vertexShaderSource)
    var fragment = compile(gl.FRAGMENT_SHADER, source.liquidMetalFragmentShader)
    if (vertex && fragment) { gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program) }
    shaders.forEach(function (shader) { gl.deleteShader(shader) })
    if (!vertex || !fragment || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program); gl = null; failed = true; return
    }
    gl.useProgram(program)
    var buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    var texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    function scalar(name, value) { uniforms[name] = gl.getUniformLocation(program, name); gl.uniform1f(uniforms[name], value) }
    Object.entries({ u_pixelRatio:1, u_imageAspectRatio:1, u_originX:.5, u_originY:.5, u_worldWidth:0, u_worldHeight:0, u_fit:1, u_scale:1, u_rotation:0, u_offsetX:0, u_offsetY:0, u_repetition:2, u_softness:.8, u_shiftRed:0, u_shiftBlue:0, u_distortion:.15, u_contour:.2, u_angle:35, u_shape:0, u_time:0 }).forEach(function (pair) { scalar(pair[0], pair[1]) })
    gl.uniform1i(gl.getUniformLocation(program, 'u_isImage'), 0)
    gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0)
    gl.uniform4fv(gl.getUniformLocation(program, 'u_colorBack'), [.063,.075,.063,1]) // #101310
    gl.uniform4fv(gl.getUniformLocation(program, 'u_colorTint'), [.76,.74,.70,1]) // stone, no rainbow dispersion
    uniforms.u_resolution = gl.getUniformLocation(program, 'u_resolution')
    canvas.addEventListener('webglcontextlost', function (event) { event.preventDefault(); failed = true; canvas.remove(); gl = null; last = 0 })
    med.querySelector('.medallion__tilt').appendChild(canvas)
  }
  var api = {
    tick: function (t) {
      if (!visible || mq.matches || document.hidden || C.held || C.active?.id !== 'story') { last = 0; return Infinity }
      init()
      if (!gl || failed) return Infinity
      canvas.hidden = false
      if (!last) last = t - 1000 / 12
      var delta = t - last
      if (delta < 1000 / 12) return 1000 / 12 - delta
      last = t; elapsed += delta
      var size = Math.min(384, Math.ceil(med.clientWidth))
      if (canvas.width !== size || canvas.height !== size) { canvas.width = size; canvas.height = size; gl.viewport(0, 0, size, size) }
      gl.uniform2f(uniforms.u_resolution, size, size)
      gl.uniform1f(uniforms.u_time, elapsed / 1000 * .055)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      draws++; canvas.dataset.chromeFrame = String(draws)
      return 1000 / 12
    },
    pause: function () { last = 0 },
    disable: function () { last = 0; if (canvas) canvas.hidden = true },
    status: function () { return { failed: failed, draws: draws, visible: visible, error: gl ? gl.getError() : null } }
  }
  C.chrome = api
  new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; last = 0; C.refresh() }).observe(med)
  mq.addEventListener('change', function () { if (mq.matches) api.disable(); else C.refresh() })
})()
