/**
 * Goal: is it possible to render to a texture, which is connected as input?
 *
 * Result: seems that it is impossible. So we have to rebind textures each time.
 *
 * Also:
 * - Scissor test does not enhance perf not for a fucking millisecond. It is still as slow as calculating the whole thing.
 * - Rebinding textures is FUCK (18ms → 180ms) slow :\
 * - Sending new data to texture is FUUUCK (18ms → 1800ms) slow :'(
 * - Reading pixels is FUUUUUUUUUUCK (18ms → 18000ms) slow D’,:
 * 	dafuck? research shown ok result!
 * 	- nope. gl-shader-output here in some reason is also as slow as fuck.
 * - Avoiding clearing color enhances speed SIGNIFICANTLY. Especially setting clearColor.
 * - bindTexture sets active texture to modify.
 * 	- Also it sets a texture to be used for the rendering as input.
 * - bindFramebuffer sets current framebuffer to render to and saves its binding to a texture (after framebufferTexture mthd)
 * - we can pingpong buffers via bindTexture and bindFramebuffer(weeha)
 *
 * In principle we could restrict output buffer by scissors so render once a big thing.
 * Q: how can we avoid reading pixels?
 * A: pingponging textures, passing uniforms.
 * Q: is it fast - pingponging them, at all?
 * A: well it is 343ms for 1s audio - it is faster than anything else possible.
 * 	Q: maybe we better rebind shaders? can we pingpong shaders?
 *  A: rebinding shaders is faster - ~130ms.
 *  	Q: so is it possible to pingpong them then?
 *  	A: yes, moreover it is super-easy to pingpong framebuffers/textures between them.
 *  	Q: so is it faster to use shader switch instead of fb switch?
 *  	A: yes, but note that framebuffers, as textures, are not bound to shaders. So you can switch shaders easily, but still you have to switch framebuffers.
 *  	Q: can we render to other context’s texture?
 *  	A: no. Contexts are not interchangible.
 *  	Q: so different shaders can render to the same framebuffer right?
 *  	A: precisely right.
 * Q: can we create 2 shaders, where first’s output is connected to second’s input?
 * A: yes, we can. It is just input texture is unbound from framebuffer, actually, so render safely to other framebuffer;
 * Q: why cyan instead of white?
 * A: a bug. fixed.
 *
 * Q: resetting scissors - is it slow?
 * A: 90ms. A bit faster than switching shader.
 *
 * Q: copyTexture method - is it slow?
 * A: it does not work with floats seemingly. need resolving but im not really interested.
 *
 */
var createGlContext = require('webgl-context');
var createShader = require('gl-shader');
var ndarray = require('ndarray');
var savePixels = require('save-pixels');
var now = require('performance-now');
var createShaderOutput = require('gl-shader-output');

var w = 2, h = 2;


var gl = createGlContext({
	width: w,
	height: h
});

//enable float processing
var float = gl.getExtension('OES_texture_float');
if (!float) throw Error('WebGL does not support floats.');
var float = gl.getExtension('OES_texture_float_linear');
if (!float) throw Error('WebGL does not support floats.');

// micro optimizations
gl.disable(gl.DEPTH_TEST);
gl.disable(gl.BLEND);
gl.disable(gl.CULL_FACE);
gl.disable(gl.DITHER);
gl.disable(gl.POLYGON_OFFSET_FILL);
gl.disable(gl.SAMPLE_COVERAGE);
gl.disable(gl.SCISSOR_TEST);
gl.disable(gl.STENCIL_TEST);

//create shader
var shaders = [];

shaders.push(createShader(gl, `
	precision mediump float;
	attribute vec2 position;
	varying vec2 uv;
	void main (void) {
		gl_Position = vec4(position, 0, 1);
		uv = vec2(position.x * 0.5 + 0.5, position.y * 0.5 + 0.5);
	}
`, `
	precision mediump float;
	uniform sampler2D image;
	varying vec2 uv;
	void main (void) {
		gl_FragColor = texture2D(image, uv);
	}
`));
shaders.push(createShader(gl, `
	precision mediump float;
	attribute vec2 position;
	varying vec2 uv;
	void main (void) {
		gl_Position = vec4(position, 0, 1);
		uv = vec2(position.x * 0.5 + 0.5, position.y * 0.5 + 0.5);
	}
`, `
	precision mediump float;
	uniform sampler2D image;
	varying vec2 uv;
	void main (void) {
		gl_FragColor = vec4(1.0 - texture2D(image, uv).xyz, 1);
	}
`));
shaders[0].bind();

//square buffer
var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 3, 3, -1]), gl.STATIC_DRAW);
shaders[0].attributes.position.pointer();
shaders[1].attributes.position.pointer();



var textures = [createTexture(gl), createTexture(gl), createTexture(gl), createTexture(gl)];

function createTexture (gl) {
	//texture creation
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	return texture;
}


//preset textures
// gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, textures[0]);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.FLOAT, new Float32Array([1,1,1,1, 0,0,0,1, 0,0,0,1, 0,0,0,1]));

// gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, textures[1]);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.FLOAT, new Float32Array([0,0,0,1, 1,1,1,1, 0,0,0,1, 0,0,0,1]));

// gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, textures[2]);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.FLOAT, new Float32Array([0,0,0,1, 0,0,0,1, 1,1,1,1, 0,0,0,1]));

// gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, textures[3]);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.FLOAT, new Float32Array([0,0,0,1, 0,0,0,1, 0,0,0,1, 1,1,1,1]));



//create 2 framebuffers
var fbo = [
	createFramebuffer(gl, textures[1]),
	createFramebuffer(gl, textures[0])
];


function createFramebuffer (gl, texture) {
	//create target framebuffer
	var fbo = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	return fbo;
}



//draw square
// gl.enable(gl.SCISSOR_TEST);
// gl.scissor(10, 0, 1, h);

var max = 44100;
// gl.viewport(0, 0, w, h);

// gl.clearColor(0, 0, 0, 1);
// gl.clear(gl.COLOR_BUFFER_BIT);


gl.bindTexture(gl.TEXTURE_2D, textures[0]);
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[0]);
shaders[1].bind();
gl.drawArrays(gl.TRIANGLES, 0, 3);
show();

gl.bindTexture(gl.TEXTURE_2D, textures[3]);
gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, w, h, 0);

gl.bindTexture(gl.TEXTURE_2D, textures[3]);
gl.drawArrays(gl.TRIANGLES, 0, 3);
show();

var t = now();
// for (var i = 0; i < max; i++) {
// 	gl.scissor(0,0,1,1);
	// gl.bindTexture(gl.TEXTURE_2D, textures[i%4]);
	// gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[i%2]);
// 	gl.drawArrays(gl.TRIANGLES, 0, 3);
// }
console.log(now() - t);

// show();


//show result
function show () {
	var pixels = new Float32Array(w * h * 4);
	gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, pixels);
	document.body.appendChild(savePixels(ndarray(pixels.map(function (x,i) {
		return x*255;
	}), [w, h, 4]), 'canvas'));
}
function showInt () {
	var pixels = new Uint8Array(w * h * 4);
	gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	pixels = Array.prototype.map.call(pixels, function (p) {
		return p / 255;
	});
	document.body.appendChild(savePixels(ndarray(pixels, [w, h, 4]), 'canvas'));
}





//gl-shader-output comparison
// var drawGl = createShaderOutput(`
// 	precision mediump float;
// 	// uniform sampler2D image;
// 	// varying vec2 uv;
// 	void main (void) {
// 		// gl_FragColor = texture2D(image, uv);
// 	}
// `, {
// 	width: w,
// 	height: h
// });

// var t = now();
// for (var i = 0; i < max; i++) {
// 	drawGl();
// }
// console.log(now() - t);