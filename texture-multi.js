/**
 * Q: How to get multiple textures work?
 * A: well look below. The point is binding textures after program is linked.
 *
 * Q: How to pingpong output textures to input?
 * A: we don’t need to do it (yet). Though look at example here.
 *
 * Q: How to render to other than main buffers?
 * A: see webgl_draw_buffer extension use case.
 *
 * Q: How to read rendered’s side-buffers?
 * A: You can resend them to simple shader
 */

var createContext = require('webgl-context');

var width = 64;
var height = 64;


var gl = createContext({
	width: width,
	height: height
});


// micro optimizations
gl.disable(gl.DEPTH_TEST);
gl.disable(gl.BLEND);
gl.disable(gl.CULL_FACE);
gl.disable(gl.DITHER);
gl.disable(gl.POLYGON_OFFSET_FILL);
gl.disable(gl.SAMPLE_COVERAGE);
gl.disable(gl.SCISSOR_TEST);
gl.disable(gl.STENCIL_TEST);


//enable requried extensions
var float = gl.getExtension('OES_texture_float');
if (!float) throw Error('WebGL does not support floats.');
var floatLinear = gl.getExtension('OES_texture_float_linear');
if (!floatLinear) throw Error('WebGL does not support floats.');
var bufs = gl.getExtension('WEBGL_draw_buffers');
if (!bufs) throw Error('WebGL does not support floats.');


var vSrc = `
precision highp float;

attribute vec2 position;

uniform sampler2D a;
uniform sampler2D b;

void main () {
	gl_Position = vec4(position, 0, 1);
}
`;

var fSrc = `
#extension GL_EXT_draw_buffers : require

precision highp float;

uniform sampler2D a;
uniform sampler2D b;

void main () {
	float w = ${width - 1}.;

	vec4 bSample = texture2D(b, vec2(gl_FragCoord.x / w, 0));
	vec4 aSample = texture2D(a, vec2(gl_FragCoord.x / w, 0)) * 0.5 + 0.5;

	//do inverse
	gl_FragData[0] = vec4(1.0 - aSample.xyz, 1);
	gl_FragData[1] = vec4(1.0 - bSample.xyz, 1);
}
`;


var programs = [
	createProgram(gl, vSrc, fSrc),
	createProgram(gl, vSrc, `
precision highp float;

uniform sampler2D a;
uniform sampler2D b;

void main () {
	float w = ${width - 1}.;

	vec4 bSample = texture2D(b, vec2(gl_FragCoord.x / w, 0));
	vec4 aSample = texture2D(a, vec2(gl_FragCoord.x / w, 0));

	// gl_FragColor = vec4(0,0,0,1);
	gl_FragColor = aSample * bSample;
}
`)
];


gl.useProgram(programs[0]);


//create input buffer with number of verteces === height
var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(createVerteces(height)), gl.STATIC_DRAW);
gl.enableVertexAttribArray(2);
//index, size, type, normalized, stride, offset (pointer)
gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
gl.bindAttribLocation(programs[0], 2, 'position');


//create input buffer with number of verteces === height
// var buffer = gl.createBuffer();
// gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(createVerteces(height)), gl.STATIC_DRAW);
// gl.enableVertexAttribArray(2);
// //index, size, type, normalized, stride, offset (pointer)
// gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
gl.bindAttribLocation(programs[1], 2, 'position');


function createVerteces (n) {
	var res = [];
	var last = 1;
	var step = 2 / n;
	for (var i = 0; i < n; i++) {
		res.push(-1);
		res.push(last);
		res.push(15);
		res.push(last);
		last -= step;
		res.push(-1);
		res.push(last);
	}
	return res;
}


//NOTE: linking program should be after binding attributes but BEFORE getting uniform locations !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//CANNOT UNDERESTIMATE THIS
gl.linkProgram(programs[0]);
gl.linkProgram(programs[1]);


var framebuffers = [gl.createFramebuffer(), gl.createFramebuffer()];

//create main output framebuffer
gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[0]);
var outputTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, outputTexture);

//NOTE: these are obligatory guys
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);


//create side outputs
gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[1]);
var aOutTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, aOutTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
// var aFbo = gl.createFramebuffer();
// gl.bindFramebuffer(gl.FRAMEBUFFER, aFbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, aOutTexture, 0);

var bOutTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, bOutTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
// var bFbo = gl.createFramebuffer();
// gl.bindFramebuffer(gl.FRAMEBUFFER, bFbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, bOutTexture, 0);

//NOTE: this guy is like binding for drawbuffers
bufs.drawBuffersWEBGL([
	bufs.COLOR_ATTACHMENT0_WEBGL,
	bufs.COLOR_ATTACHMENT1_WEBGL
]);



//create textures
var aWidth = width / 1;
var a = new Float32Array(aWidth*4);
for (var i = 0; i < aWidth; i++) {
	a[i*4] = Math.sin( i * (Math.PI * 2) / aWidth);
	a[i*4 + 1] = Math.sin( i * (Math.PI * 2) / aWidth);
	a[i*4 + 2] = Math.sin( i * (Math.PI * 2) / aWidth);
	a[i*4 + 3] = 1;
}
var aTexture = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, aTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, aWidth, 1, 0, gl.RGBA, gl.FLOAT, a);


var bWidth = width;
var b = new Float32Array(bWidth*4);
for (var i = 0; i < bWidth; i++) {
	b[i*4] = Math.random();
	b[i*4 + 1] = Math.random();
	b[i*4 + 2] = Math.random();
	b[i*4 + 3] = 1;
}
var bTexture = gl.createTexture();
gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, bTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bWidth, 1, 0, gl.RGBA, gl.FLOAT, b);



//bind textures locations
var aLocation = gl.getUniformLocation(programs[0], "a");
var bLocation = gl.getUniformLocation(programs[0], "b");
gl.uniform1i(aLocation, 0);
gl.uniform1i(bLocation, 1);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, aTexture);
gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, bTexture);




//render first shader to framebuffer’s textures
gl.drawArrays(gl.TRIANGLES, 0, 3*height);


//render second shader with the first shader’s textures
gl.useProgram(programs[1]);

var aLocation = gl.getUniformLocation(programs[1], "a");
var bLocation = gl.getUniformLocation(programs[1], "b");
gl.uniform1i(aLocation, 0);
gl.uniform1i(bLocation, 1);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, aOutTexture);
gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, bOutTexture);

gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[0]);


gl.drawArrays(gl.TRIANGLES, 0, 3*height);

show();



// document.body.appendChild(gl.canvas);




//program (2 shaders)
function createProgram (gl, vSrc, fSrc) {
	var fShader = gl.createShader(gl.FRAGMENT_SHADER);
	var vShader = gl.createShader(gl.VERTEX_SHADER);

	gl.shaderSource(fShader, fSrc);
	gl.shaderSource(vShader, vSrc);

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




function show (int) {
	var w = width, h = height;

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


