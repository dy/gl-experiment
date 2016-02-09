/**
 * Huge rectangle texture create experiment
 *
 * Goal:
 * - Test out ways of creating texture stackgl/native
 *
 * Results:
 * - The texture data should be in a format of passed array
 * - In some magical way texture binds to shader’s uniform automatically, if it is single
 * - Stackgl way is, as usual, the simplest method to bind texture
 */

var shell = require('gl-now')();

shell.preventDefaults = false;

var Shader = require('gl-shader');
var glslify = require('glslify');
var Texture = require('gl-texture2d');
var Buffer = require('gl-buffer');
var baboon = require('baboon-image');


var shader, gl;


shell.on('gl-init', function () {
	gl = this.gl;

	shader = Shader(gl, glslify('\
		precision mediump float;\
		attribute vec2 position;\
		varying vec2 uv;\
		void main (void) {\
			gl_Position = vec4(position, 0, 1);\
			uv = vec2(position.x * 0.5 + 0.5, - position.y * 0.5 + 0.5);\
		}\
	', {inline: true}), glslify('\
		precision mediump float;\
		uniform sampler2D image;\
		varying vec2 uv;\
		void main (void) {\
			gl_FragColor = texture2D(image, uv);\
		}\
	', {inline: true}));

	shader.bind();

	//setup simple vertex
	var buffer = Buffer(gl, [1,3, 1,-1, -3,-1]);
	shader.attributes.position.pointer();

	//load texture
	var stackgl = true;

	//native way
	if (!stackgl) {
		// var uImage = gl.getUniformLocation(shader.program, 'image');
		// gl.uniform1i(uImage, 0);

		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		var pixels = new Float32Array([1,1,1,1, 0,1,0,1, 0,1,0,1, 1,1,1,1]);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0, //miplevel
			gl.RGBA, //texture format (TODO: find out others)
			2, 2, //w/h,
			0, //a bit of magic
			gl.RGBA, //type of input array
			gl.FLOAT, //storage format of pixel data
			pixels //data
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		// gl.activeTexture(gl.TEXTURE0)

		// shader.bind();
	}
	//stackgl-way
	else {
		var texture = new Texture(gl, baboon);
		// shader.uniforms.image = texture.bind();
	}
});

shell.on('gl-render', function () {
	gl.clearColor(0,0,0,1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.drawArrays(gl.TRIANGLES, 0, 3);
});