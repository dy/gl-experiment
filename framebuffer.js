/**
 * Framebuffer experiment
 *
 * Goal:
 * - test out rendering to a texture instead of canvas, via fbo or native
 *
 * Results:
 * - stackgl framebuffer is convenient in a way it provides an easy way to render to a texture of any size, easily read afterwards as FLOAT, which means we can render soundbuffer 4-channels in float!!!!
 * - stackgl’s readtexture does not work at all
 * - using fbo is better as it also shorter 5 times than webgl framebuffer - we dont have to create texture etc
 */


var glslify = require('glslify');
var Framebuffer = require('gl-fbo');
var Shader = require('gl-shader');
var Buffer = require('gl-buffer');
var read  = require('gl-texture2d-read-float');


var gl = require('webgl-context')();
document.body.appendChild(gl.canvas);

gl.disable(gl.DEPTH_TEST);

var generateShader = new Shader(gl, glslify('\
	precision mediump float;\
	attribute vec2 position;\
	varying vec2 uv;\
	void main (void) {\
		uv = position;\
		gl_Position = vec4(position, 0, 1);\
	}\
', {inline: true}), glslify('\
	precision mediump float;\
	varying vec2 uv;\
	void main (void) {\
		gl_FragColor = vec4(uv * 0.5 + 0.5, 0, 1);\
	}\
', {inline: true}));

generateShader.bind();

var stackgl = false;

if (stackgl) {
	var buffer = new Buffer(gl, [1,3, 1,-1, -3,-1]);
	generateShader.attributes.position.pointer();


	var w = 4, h = 4;

	var framebuffer = new Framebuffer(gl, [w, h], {
		preferFloat: true,
		// float: true,
		depth: false,
		color: 1
	});
	framebuffer.bind();

	gl.clearColor(0,0,0,1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
}

else {

}



var stackglRead = false;

//no-stack-gl-way, works
if (!stackglRead) {
	var result = new Float32Array(w * h * 4);
	gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, result);
	console.log(result);
}
else {
	var baboon = require('baboon-image');
	var Texture = require('gl-texture2d');
	var texture  = Texture(gl, baboon);

	read(texture, function (err, data) {
		console.log(data);
	});
}
