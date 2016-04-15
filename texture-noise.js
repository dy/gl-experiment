/**
 * Q: what is faster: rendering 1 triangle, but shifting it N times via vp/scissor or rendering N triangles via vertex inputs?
 * Guess second should be faster as it does it in parallel, but who knows.
 * A: changing viewport with rerendering takes 5ms for 1-channel 1-s buffer.
 * 	- That is 3800ms for a second of 512 channels sound.
 * A: feeding 512 verteces takes 5ms for 1-channel 1-s buffer
 * 	- But only 100ms for a second of 512 channels sound.
 * 		- That is due to verteces parallelism.
 * 	- Considering readPixels each slice, it takes 350 ms for 1s buffer.
 *  	Q: can we push optimization further by filling 512 buffer by 29x4 slices and only then reading pixels?
 *  	A: yes, it wins some points ( 50-60ms per 1s.
 *  		- Basic idea is reducing readPixels call to minimum.
 *
 * - gl_FragCoord corresponds to window. So changing viewport is alrignt.
 * - max number of varyings is 29 vec4’s.
 */

var createGlContext = require('webgl-context');
var createShader = require('gl-shader');
var ndarray = require('ndarray');
var savePixels = require('save-pixels');
var now = require('performance-now');


var w = 29, h = 512;


var gl = createGlContext({
	width: w,
	height: h
});


gl.enable(gl.SCISSOR_TEST);

//enable float processing
var float = gl.getExtension('OES_texture_float');
if (!float) throw Error('WebGL does not support floats.');
var floatLinear = gl.getExtension('OES_texture_float_linear');
if (!floatLinear) throw Error('WebGL does not support floats.');


var VARYINGS = w;

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
`, `
	precision highp float;

	varying vec4 samples[${VARYINGS}];

	//retrieve generated sample
	vec4 getSample(int idx) {
		${Array(VARYINGS).fill(0).map(function (x, i) {
			return `if (idx == ${i}) return samples[${i}];`;
		}).join('\n')}
		return samples[0];
	}

	void main (void) {
		float w = ${w}. - 1.0;
		float x = floor(gl_FragCoord.x);
		int idx = int((${VARYINGS}.0 - 1.0) * gl_FragCoord.x / w);
		gl_FragColor = getSample(idx);
		// gl_FragColor = vec4(vec3(gl_FragCoord.y / ${h}.), 1);
	}
`);
shader.bind();


//square buffer
var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, -1,3, 3,-1]), gl.STATIC_DRAW);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(createVerteces(512)), gl.STATIC_DRAW);
shader.attributes.position.pointer();


function createVerteces (n) {
	var res = [];
	var last = 1;
	var step = 2 / n;
	for (var i = 0; i < n; i++) {
		res.push(-1);
		res.push(last);
		res.push(3);
		res.push(last);
		last -= step;
		res.push(-1);
		res.push(last);
	}
	return res;
}


function createTexture (gl) {
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	return texture;
}


function getNoise (len) {
	var res = [];
	for (var i = 0; i < len; i++) {
		res.push(Math.random());
	}
	return res;
}


function createFramebuffer (gl, texture) {
	var fbo = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	return fbo;
}


//create float output framebuffer
var outputTexture = createTexture(gl);

gl.bindTexture(gl.TEXTURE_2D, outputTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.FLOAT, new Float32Array(w*h*4));

var fbo = createFramebuffer(gl, outputTexture);
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
// document.body.appendChild(gl.canvas);


//create noise texture
var texture = createTexture(gl);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, 1, 0, gl.RGBA, gl.FLOAT, new Float32Array(getNoise(w*4)));


gl.clearColor(0,0,0,1);
gl.clear(gl.COLOR_BUFFER_BIT);

var t = now();
var pixels = new Float32Array(w * h * 4);

var max = 44100 / (29*4);

for (k = 0; k < max; k++) {
	// for (var i = 0; i < h; i++) {
		// gl.scissor(0, i, w, 1);
		// gl.viewport(0, i, w, 1);
		gl.drawArrays(gl.TRIANGLES, 0, 3*h);
	// }
}

console.log(now() - t);

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



