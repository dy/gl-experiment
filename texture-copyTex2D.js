var createShader = require('gl-shader');
var ndarray = require('ndarray');
var savePixels = require('save-pixels');
var now = require('performance-now');
var gl = document.createElement("canvas").getContext("webgl");


gl.getExtension("OES_texture_float");
gl.getExtension("OES_texture_float_linear");

var w = 2;
var h = 2;

var shader = createShader(gl, `
	precision mediump float;
	attribute vec4 position;
	varying vec2 uv;

	void main() {
		gl_Position = position;
		uv = position.xy * 0.5 + 0.5;
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

// make a renderable npot texture
function createRenderableTexture(gl, w, h) {
	var tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.FLOAT, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	return tex;
}

var outTexture = createRenderableTexture(gl, w, h);
var framebuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture, 0);
// NOTE: because we are not using one of the 3 explicitly supported texture formats
// for framebuffer attachments we have to check that this actually works
if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
	alert("can't render to a floating point target on this hardware");
}

// render something to it
gl.clearColor(0,1,0,1);  // green
gl.clear(gl.COLOR_BUFFER_BIT);


show();


// copy the framebuffer to the texture
var sourceTexture = createRenderableTexture(gl, w, h)
gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, w, h, 0);

// draw to canvas
gl.bindFramebuffer(gl.FRAMEBUFFER, null);

// clear to red
gl.clearColor(1,0,0,1);
gl.clear(gl.COLOR_BUFFER_BIT);

// Since we cleared to red and the texture is filled with green
// the result should be green
gl.drawArrays(gl.TRIANGLES, 0, 3);

var pixels = new Uint8Array(w * h * 4);
gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
console.log(pixels)


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
