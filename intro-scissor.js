/**
 * 3rd intro experiment
 * https://github.com/stackgl/webgl-workshop/tree/master/exercises/intro-scissor
 *
 * Results.
 * - webglAPI, in raw, is very simple, there is no complication.
 * - stackgl and others are needed mostly as polyfills.
 * - webgl has a set of capabilities, turnable on by ctx.enable(smth)
 */

var canvas = document.body.appendChild(document.createElement('canvas'));
var raf = window.requestAnimationFrame;

var gl = canvas.getContext('webgl');

gl.enable(gl.SCISSOR_TEST);

raf(function render() {
	var w = gl.drawingBufferWidth;
	var h = gl.drawingBufferHeight;


	gl.scissor(0,0,w/2, h/2);
	gl.clearColor(1,0,0,1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.scissor(w/2,h/2,w/2, h/2);
	gl.clearColor(0,1,0,1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.scissor(w/2,0,w/2, h/2);
	gl.clearColor(0,0,0,1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.scissor(0,h/2,w/2, h/2);
	gl.clearColor(0,0,1,1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	raf(render);
});