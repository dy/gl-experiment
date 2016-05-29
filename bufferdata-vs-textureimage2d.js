/**
 * The goal: compare which is faster - passing a texture data or replacing buffer data.
 */

var test = require('tst');


var canvas = document.createElement('canvas');
var gl = canvas.getContext('webgl');



var float = gl.getExtension('OES_texture_float');
if (!float) throw Error('WebGL does not support floats.');
// var floatLinear = gl.getExtension('OES_texture_float_linear');
// if (!floatLinear) throw Error('WebGL does not support floats.');

var program = createProgram(gl, `
	attribute vec4 position;
	void main () {
		gl_Position = position;
	}
`, `
	precision mediump float;
	uniform sampler2D texture;
	void main () {
		gl_FragColor = texture2D(texture, vec2(0,1));
	}
`);

var w = 2048;
var data  = new Float32Array(w);

//setup buffer
var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
gl.bindAttribLocation(program, 0, 'position');

gl.linkProgram(program);
gl.useProgram(program);

//setup texture
var location = gl.getUniformLocation(program, 'texture');
var texture = gl.createTexture();

gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, w, 1, 0, gl.ALPHA, gl.FLOAT, data);





var max = 10e4;

test('dynamic draw', function () {
	test('data', function () {
		for (var i = 0; i < max; i++) {
			gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
		}
	})
	test('subdata', function () {
		for (var i = 0; i < max; i++) {
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
		}
	})
});
test('static draw', function () {
	test('data', function () {
		for (var i = 0; i < max; i++) {
			gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
		}
	})
	test('subdata', function () {
		for (var i = 0; i < max; i++) {
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
		}
	})
});
test('stream draw', function () {
	test('data', function () {
		for (var i = 0; i < max; i++) {
			gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
		}
	})
	test('subdata', function () {
		for (var i = 0; i < max; i++) {
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
		}
	})
});



test('texImage2D ALPHA', function () {
	for (var i = 0; i < max; i++) {
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, w, 1, 0, gl.ALPHA, gl.FLOAT, data);
	}
});
test('texImage2D LUMINANCE', function () {
	for (var i = 0; i < max; i++) {
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, w, 1, 0, gl.LUMINANCE, gl.FLOAT, data);
	}
});
test('texImage2D RGBA', function () {
	for (var i = 0; i < max; i++) {
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w/4, 1, 0, gl.RGBA, gl.FLOAT, data);
	}
});








function createProgram (gl, vert, frag) {
	var fShader = gl.createShader(gl.FRAGMENT_SHADER);
	var vShader = gl.createShader(gl.VERTEX_SHADER);

	gl.shaderSource(fShader, frag);
	gl.shaderSource(vShader, vert);

	gl.compileShader(fShader);

	if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(fShader));
	}

	gl.compileShader(vShader);

	if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(vShader));
	}


	var program = gl.createProgram();
	gl.attachShader(program, vShader);
	gl.attachShader(program, fShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program));
	}

	gl.useProgram(program);

	return program;
}