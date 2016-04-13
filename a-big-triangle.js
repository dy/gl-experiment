/**
 * Setup: test how a-big-triangle provides full vertex coverage
 *
 * Result: it does not. It requires user to set vertex shader with `position` attribute.
 * Moreover, it requires user to show how position is mapped.
 * So basically it just connects a buffer with huge triangle in it, but that’s it.
 * If user defines some custom mapping, it can be not big triangle anymore.
 * Literally this module is just a big triangle, it is not a big triangle painter in any way.
 * That said, if you need custom uniforms, just provide them along in the vertex shader and calc them based on position input.
 * Note that varyings are interpolated relative to the output range.
 * Feels like gl_Position just sets clipping area of already rendered triangle, interpolation is always bound to the vertex coords.
 */

var triangle = require('a-big-triangle')
var Shader = require('gl-shader')

var canvas = document.createElement('canvas');
document.body.appendChild(canvas);
var gl = canvas.getContext('webgl');


gl.clearColor(0, 0, 0, 0)
gl.clear(gl.COLOR_BUFFER_BIT)

var shader = Shader(gl, `
	attribute vec2 position;
	varying vec4 color;
	void main() {
		//hey dude change from -1 to 3 by y
		color = vec4(position, 0, 1.0);

		gl_Position = vec4(position / 4.0, 1.0, 1.0);
	}`, `
	precision mediump float;
	varying vec4 color;
	void main() {
		gl_FragColor = color;
	}`
);

shader.bind()

triangle(gl)