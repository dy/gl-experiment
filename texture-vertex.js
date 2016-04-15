/**
 * Q: Is it possible to map input verteces based on the texture passed to it?
 * A: Yes. There is a trouble on access, but workaround-able.
 *
 * Q: How many varyings can we use per-vertex?
 * A: 30 floats (because other 4 are reserved for gl_Position I guess), or 16 vec4’s. As expected.
 *
 * Q: How slow is that to render 1s of sound by 64 floats?
 * A: 300ms, considering readpixels each time render result. It is comparable with switching contexts.
 * 	Q: is it better to use scissors to render to different parts, to readpixels once?
 * 	A: Not scissors, but viewport I guess, but yes, it is to the power faster.
 * 	For 512x512 texture of a sound it takes ~150ms! The only limit is 64 formant channels. Which is not bad.
 *
 * Q: What are optimization options?
 *
 * Q: Do points able to render textures in itself, ie do they create multifragments inside?
 * A: No. 1 fragment per point. So to provide multiple fragments we should whether provide lots of points or triangles.
 */

var createGlContext = require('webgl-context');
var createShader = require('gl-shader');
var ndarray = require('ndarray');
var savePixels = require('save-pixels');
var now = require('performance-now');


var w = 512, h = 512;


var gl = createGlContext({
	width: w,
	height: h
});


// gl.disable(gl.DEPTH_TEST);
// gl.disable(gl.BLEND);
// gl.disable(gl.CULL_FACE);
// gl.disable(gl.DITHER);
// gl.disable(gl.POLYGON_OFFSET_FILL);
// gl.disable(gl.SAMPLE_COVERAGE);
// gl.disable(gl.STENCIL_TEST);
gl.enable(gl.SCISSOR_TEST);

//enable float processing
var float = gl.getExtension('OES_texture_float');
if (!float) throw Error('WebGL does not support floats.');
var floatLinear = gl.getExtension('OES_texture_float_linear');
if (!floatLinear) throw Error('WebGL does not support floats.');


//straight shader
var shader = createShader(gl, `
	precision highp float;
	attribute vec2 position;
	vec2 uv;
	varying vec4 x[16];
	uniform sampler2D image;
	void main (void) {
		gl_PointSize = 5.0;
		gl_Position = vec4(position, 0, 1);
		uv = vec2(position.x * 0.5 + 0.5, position.y * 0.5 + 0.5);
		for (int i = 0; i < 16; i++) {
			x[i] = texture2D(image, vec2(uv.y, float(i) / 15.0) );
		}
	}
`, `
	precision highp float;
	uniform sampler2D image;
	varying vec4 x[16];

	//workaround to retrieve generated to vertex value
	vec4 getX(int idx) {
		if (idx == 0) return x[0];
		if (idx == 1) return x[1];
		if (idx == 2) return x[2];
		if (idx == 3) return x[3];
		if (idx == 4) return x[4];
		if (idx == 5) return x[5];
		if (idx == 6) return x[6];
		if (idx == 7) return x[7];
		if (idx == 8) return x[8];
		if (idx == 9) return x[9];
		if (idx == 10) return x[10];
		if (idx == 11) return x[11];
		if (idx == 12) return x[12];
		if (idx == 13) return x[13];
		if (idx == 14) return x[14];
		if (idx == 15) return x[15];
		return x[15];
	}

	void main (void) {
		int idx = int(gl_FragCoord.x * 16.0 / ${w}.0);
		gl_FragColor = getX(idx);
	}
`);
shader.bind();


//square buffer
var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(genArray(512)), gl.STATIC_DRAW);
shader.attributes.position.pointer();

function genArray(n) {
	var res = [];
	var last = 1;
	var step = 2/n;
	for (var i = 0; i < n; i++) {
		res.push(-1);
		res.push(last);
		res.push(1);
		res.push(last);
		last -= step;
		res.push(-1);
		res.push(last);
	}
	return res;
}


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
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.FLOAT, new Float32Array([0,0,0,1, 1,0,0,1, 0,1,0,1, 0,0,1,1]));

gl.bindTexture(gl.TEXTURE_2D, textures[1]);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.FLOAT, null);



//create 2 framebuffers
var fbo = [
	createFramebuffer(gl, textures[1])
];


function createFramebuffer (gl, texture) {
	//create target framebuffer
	var fbo = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	return fbo;
}


// document.body.appendChild(gl.canvas);

gl.bindTexture(gl.TEXTURE_2D, textures[0]);
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[0]);

gl.clearColor(1,1,1,1);
gl.clear(gl.COLOR_BUFFER_BIT);

// gl.drawArrays(gl.TRIANGLES, 0, 12);

var t = now();
var pixels = new Float32Array(w * h * 4);
var max = 44100/64;
var sliceH = 512/max;

for (var i = 0; i < max; i++) {
	gl.scissor(0, i/max * h, w, h);
	// gl.viewport(0, i/max * h, w, h);
	gl.drawArrays(gl.TRIANGLES, 0, 3*512);
}
gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, pixels);
console.log(now() - t);

show();




function show () {
	var pixels = new Float32Array(w * h * 4);
	gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, pixels);
	document.body.appendChild(savePixels(ndarray(pixels.map(function (x,i) {
		return x*255;
	}), [w, h, 4]), 'canvas'));
}