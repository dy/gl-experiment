/**
 * Creating a shader lesson.
 *
 * Goals:
 * - find out how to create shaders glslify-less way
 * - hook up a way to run shaders
 *
 * Results:
 * - disadvantage of webgl is it’s god object antipattern. As DOM, though (creating els).
 * - other disadvantage - webgl does not throw errors, unlike the DOM.
 *
 * - to create a simple shader program: create and compile shaders, create program, attach shaders to it, link program, use program by gl.
 * - shader can use onlu one program at a time, but switching them is not that difficult
 */


var canvas = document.body.appendChild(document.createElement('canvas'));
var gl = canvas.getContext('webgl');
var raf = requestAnimationFrame;


//shaders
function createShaders (n) {
	var fShader = gl.createShader(gl.FRAGMENT_SHADER);
	var vShader = gl.createShader(gl.VERTEX_SHADER);

	gl.shaderSource(fShader, '\
		precision mediump float;\
		void main (void) {' +
			'gl_FragColor = ' + (n ? 'vec4(1,.8,.5,1);' : 'vec4(0,0,1,1);') +
		'\n}\
	');

	gl.shaderSource(vShader, '\
		precision mediump float;\
		attribute vec2 position;\
		void main (void) {\
			gl_Position = vec4(position, 0, 1);\
		}\
	');

	gl.compileShader(fShader);

	if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(fShader));
	}

	gl.compileShader(vShader);

	if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(vShader));
	}

	return [vShader, fShader];
}


//program (2 shaders)
var n = 0;
function createProgram (vShader, fShader) {
	var [vShader, fShader] = createShaders(n++);

	var program = gl.createProgram();

	//Q: what if not all shaders are attached?
	//A: it will get linking error
	gl.attachShader(program, vShader);
	gl.attachShader(program, fShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program));
	}

	return program;
}


//triangle drawer (not really into a business how it’s done)
function drawTriangle(gl) {
	var buffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 0, 0, -1, 1, 1]), gl.STREAM_DRAW)
	gl.enableVertexAttribArray(0)
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
	gl.drawArrays(gl.TRIANGLES, 0, 3)
	gl.bindBuffer(gl.ARRAY_BUFFER, null)
	gl.disableVertexAttribArray(0)
	gl.deleteBuffer(buffer)
}


//init
var program1 = createProgram();
var program2 = createProgram();


//animate
var count = 0;
raf(function render () {
	count = (count + 1) % 2;

	gl.useProgram(count ? program1 : program2);

	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	//controlling vp is kind of takes understanding what is size dims
	var w = gl.drawingBufferWidth;
	var h = gl.drawingBufferHeight;
	gl.viewport(-w/2, -h/2,w*3,h*3);

	drawTriangle(gl);

	raf(render);
});