/**
 * Buffer attributes lesson.
 *
 * Goal:
 * - learn something new or repeat the attributes of a shader
 *
 * Results:
 * - enableVertexAttribPointer(N) sets a location for vertex attribute, means that attribute is not full, as color, but buffer, i. e. taken from some storage lots of times
 * - using native vertices there can be discrepany between vecN attribute and size param, whereas gl-shader does not allow this.
 */

var data = require('./australia.json');


var canvas = document.body.appendChild(document.createElement('canvas'));
var gl = canvas.getContext('webgl');



//create shaders
var fShader = gl.createShader(gl.FRAGMENT_SHADER);
var vShader = gl.createShader(gl.VERTEX_SHADER);

gl.shaderSource(vShader, '\
	precision mediump float;\
	attribute vec2 position;\
	void main (void) {\
		gl_Position = vec4(position, 0, 1);\
	}\
');

gl.compileShader(vShader);

if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
	console.error(gl.getShaderInfoLog(vShader));
}

gl.shaderSource(fShader, '\
	precision mediump float;\
	void main (void) {\
		gl_FragColor = vec4(1,1,1,1);\
	}\
');

gl.compileShader(fShader);

if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
	console.error(gl.getShaderInfoLog(fShader));
}



//create program
var program = gl.createProgram();

gl.attachShader(program, vShader);
gl.attachShader(program, fShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	console.error(gl.getProgramInfoLog(program));
}

gl.useProgram(program);



//bind data
var buffer = gl.createBuffer(gl.ARRAY_BUFFER);
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);


//render routine
canvas.width = 600;
canvas.height = 600;
gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

requestAnimationFrame(function render () {
	gl.clearColor(0,0,0,1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.drawArrays(gl.TRIANGLES, 0, data.length/2);

	requestAnimationFrame(render);
});