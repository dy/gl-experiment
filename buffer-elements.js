/**
 * buffer-elements lesson
 *
 * Goals:
 * - learn what the buffer elements_array is
 *
 * Results:
 * - The order of binding buffers really does not matter, we can init ARRAY_BUFFER and ELEMENTS_BUFFER regardless of each other, in parallel.
 * -
 */

var canvas = document.body.appendChild(document.createElement('canvas'));
canvas.width = 600;
canvas.height = 400;

var gl = canvas.getContext('webgl');


//create shaders and use in program
var vShader = gl.createShader(gl.VERTEX_SHADER);
var fShader = gl.createShader(gl.FRAGMENT_SHADER);

gl.shaderSource(vShader, '\
	precision mediump float;\
	attribute vec2 position;\
	void main (void) {\
		gl_Position = vec4(position, 0, 1);\
	}\
');

gl.shaderSource(fShader, '\
	precision mediump float;\
	void main (void) {\
		gl_FragColor = vec4(1,1,1,1);\
	}\
');

gl.compileShader(vShader);
if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
	console.error(gl.getShaderInfoLog(vShader));
}

gl.compileShader(fShader);
if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
	console.error(gl.getShaderInfoLog(fShader));
}

var program = gl.createProgram();
gl.attachShader(program, vShader);
gl.attachShader(program, fShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	console.error(gl.getProgramInfoLog(program));
}

gl.bindAttribLocation(program, 'position', 1);
gl.bindAttribLocation(program, 'color', 0);

gl.useProgram(program);



//bind data to render
var indices = [0,1,2, 3,4,5, 0,2,4];
var verteces = [1,1,0, 0,-1,0, -1,0,0];

var elBuffer = gl.createBuffer(gl.ELEMENT_ARRAY_BUFFER);
var vBuffer = gl.createBuffer(gl.ARRAY_BUFFER);

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elBuffer);
gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verteces), gl.STATIC_DRAW);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
// gl.enableVertexAttribArray(1);
// gl.vertexAttribPointer(0, );



//anim routine
requestAnimationFrame(function render () {
	gl.clearColor(0,0,0,1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);

	requestAnimationFrame(render);
});