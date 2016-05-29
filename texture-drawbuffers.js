/**
 * Q: how many drawbuffers we can use? We need 512..4096
 * A: only 8. Moreover, we cannot read them, we can only send them to other shader.
 * 	- We could rebind shader and render them through it... but still it is not enough of them.
 * 	- They are perfect for channels rendering, actually. And reserve main output for tech date.
 *
 * Q: can we use drawbuffers instead of multiple varyings, see texture-vertex.js? Is it faster?
 * A: nope. Drawbuffers are only for fragment shaders, vertex shader does not have gl_FragData.
 */


var createGlContext = require('webgl-context');
var createShader = require('gl-shader');
var ndarray = require('ndarray');
var savePixels = require('save-pixels');
var now = require('performance-now');


var w = 512, h = 1;


var gl = createGlContext({
	width: w,
	height: h
});

//enable float processing
var float = gl.getExtension('OES_texture_float');
if (!float) throw Error('WebGL does not support floats.');
var floatLinear = gl.getExtension('OES_texture_float_linear');
if (!floatLinear) throw Error('WebGL does not support floats.');
var ext = gl.getExtension('WEBGL_draw_buffers');
if (!ext) throw Error('WebGL does not support floats.');


// micro optimizations
gl.disable(gl.DEPTH_TEST);
gl.disable(gl.BLEND);
gl.disable(gl.CULL_FACE);
gl.disable(gl.DITHER);
gl.disable(gl.POLYGON_OFFSET_FILL);
gl.disable(gl.SAMPLE_COVERAGE);
gl.disable(gl.SCISSOR_TEST);
gl.disable(gl.STENCIL_TEST);


//straight shader
var shader = createShader(gl, `
	precision highp float;

	attribute vec2 position;

	uniform sampler2D noise;

	varying vec4 samples[${VARYINGS}];

	//generate samples
	void main (void) {
		gl_Position = vec4(position, 0, 1);

		for (int i = 0; i < ${VARYINGS}; i++) {
			samples[i] = texture2D(noise, vec2(float(i) / (${VARYINGS}.0 - 1.0), 0) );
		}
	}


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
`);
shader.bind();



//square buffer
var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 3, 3, -1]), gl.STATIC_DRAW);
shader.attributes.position.pointer();


//pointing textures
var textures = [createTexture(gl), createTexture(gl), createTexture(gl), createTexture(gl)];


function createTexture (gl) {
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



//create framebuffers
var fbo = [
	createFramebuffer(gl, textures[0], gl.COLOR_ATTACHMENT0),
	createFramebuffer(gl, textures[1], ext.COLOR_ATTACHMENT0_WEBGL),
	createFramebuffer(gl, textures[1], ext.COLOR_ATTACHMENT1_WEBGL)
];


function createFramebuffer (gl, texture, att) {
	//create target framebuffer
	var fbo = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, att, gl.TEXTURE_2D, texture, 0);
	return fbo;
}



gl.bindTexture(gl.TEXTURE_2D, textures[1]);
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[0]);
gl.drawArrays(gl.TRIANGLES, 0, 3);
show();




function show () {
	var pixels = new Float32Array(w * h * 4);
	gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, pixels);

	var canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	var ctx = canvas.getContext('2d');
	var imageData = ctx.createImageData(w, h);

	pixels.forEach(function (x, i) {
		imageData.data[i] = x*255;
	});

	ctx.putImageData(imageData, 0, 0);
	document.body.appendChild(canvas);
}



