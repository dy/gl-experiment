/**
 * Second intro lesson
 * https://github.com/stackgl/webgl-workshop/tree/master/exercises/intro-clear-color
 *
 * Results:
 * - we can just zap drawing buffer with default value.
 * - Drawing buffer - is like a framebuffer, visible in the canvas.
 */

var GL = require('gl-context');

var gl = GL(document.body.appendChild(document.createElement('canvas')), function () {
	gl.clearColor(1, 0, 1, 1)
	gl.clear(gl.COLOR_BUFFER_BIT)
});