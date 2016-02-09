/**
 * Creating buffer exercise
 *
 * Goal:
 * - repeat creating of buffers
 *
 * Results:
 * - We cannot clear color once, we should do it each redraw (IDK why)
 * - usage hint param in bufferData depends on driver only for performance hit: STATIC_DRAW - for buffers which never change, DYNAMIC_DRAW - for buffers which change often, STREAM_DRAW - for buffers created and used once.
 * - uniforms/vertices for a shader object should be set after it is bound, because .bind recompiles thing, apparently
 * - stackgl Shader, unfortunately, requires buffer to be init first before being bound.
 * - as for gl-buffer, the bad thing is that there are no obvious connection of it with shader.
 * - We cannot set a shader attribute a new buffer value without connecting it beforehead, via gl-buffer or gl.createBuffer or somehow alike.
 */

var shell = require('gl-now')();
var Shader = require('gl-shader');
var glslify = require('glslify');
var data = require('./hello.json');
var Buffer = require('gl-buffer');

shell.preventDefaults = false;


var shader, gl;

shell.on('gl-init', function () {
	gl = this.gl;

	shader = Shader(gl, glslify('\
		precision mediump float;\
		attribute vec2 uv;\
		attribute vec4 color;\
		varying vec4 fColor;\
		uniform vec2 uScreenSize;\
		void main (void) {\
			fColor = color;\
			vec2 position = vec2(uv.x, -uv.y) * 1.0;\
			position.x *= uScreenSize.y / uScreenSize.x;\
			gl_Position = vec4(position, 0, 1);\
		}\
	', {inline: true}), glslify('\
		precision mediump float;\
		varying vec4 fColor;\
		void main (void) {\
			gl_FragColor = fColor;\
		}\
	', {inline: true}));


	var stackgl = true;

	shader.bind();

	//no-stackgl way of creating buffer
	if (!stackgl) {
		var buffer = gl.createBuffer(gl.ARRAY_BUFFER);

		//Q: why ARRAY_BUFFER second time? why not just detect it from created buffer?
		//Q: can we initialuze ELEMENTS_BUFFER at the same time, as other target?
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);

		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		gl.lineWidth(2);
	}
	else {
		var buffer = Buffer(gl, data);
		shader.attributes.uv = data.map(function (value) {return 1 - value});
		// shader.attributes.uv.location = 0;
		shader.attributes.uv.pointer();
		shader.attributes.color = [1,1,0,1];
	}

	var w = gl.drawingBufferWidth;
	var h = gl.drawingBufferHeight;
	shader.uniforms.uScreenSize = [w, h];
});

var i = 0;
shell.on('gl-render', function () {
	gl.clearColor(0,0,0,1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	i++;
	gl.drawArrays(gl.LINES, 0, (data.length/2) - Math.floor((Math.sin(i * 0.1)/2 + 0.5) * data.length/2));
});
