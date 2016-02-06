/**
 * Drawing buffer exercise
 *
 * Goals:
 * - explore drawArrays function a bit better
 *
 * Results:
 * - gl-buffer detects needed size of attribute automatically from defined type in shader code. awsom.
 * - passing gl_PointSize displays the size of the points render
 * - drawArrays methods has various typed of renderting, look docs.
 */

var shell = require('gl-now')();
var Shader = require('gl-shader');
var glslify = require('glslify');
var Buffer = require('gl-buffer');

shell.preventDefaults = false;


var shader, gl, uScreenSize, buffer;


//create data
var vertices = [];
function nGon(color, sides, theta0, step) {
	for(var i=0; i<sides; ++i) {
		var theta = i * step + theta0;
		var x = Math.cos(theta);
		var y = Math.sin(theta);
		vertices.push(x,y,color[0],color[1],color[2]);
	}
}

var green  = [0x61/0xFF, 0xFF/0xFF, 0x90/0xFF];
var yellow = [0xFF/0xFF, 0xE1/0xFF, 0x69/0xFF];
var blue   = [0x66/0xFF, 0xC4/0xFF, 0xFF/0xFF];
var red    = [0xFF/0xFF, 0x6F/0xFF, 0x5C/0xFF];
var grey   = [0xA9/0xFF, 0xB0/0xFF, 0xC2/0xFF];

nGon(yellow, 3, Math.PI/2.0, 2.0*Math.PI/3);
nGon(red, 32, 0.0, Math.PI/16);
nGon(blue, 32, 0.0, 7.0*Math.PI/16);
nGon(blue, 32, 7.0*Math.PI/16, 7.0*Math.PI/16);
nGon(grey, 32, 0.0, Math.PI/16);
nGon(green, 5, Math.PI/4.0, 2.0*Math.PI/5);


//init code
shell.on('gl-init', function () {
	gl = this.gl;

	shader = new Shader(gl, glslify('\
		precision mediump float;\
		attribute vec2 uv;\
		attribute vec3 color;\
		uniform vec2 uScreenSize;\
		varying vec3 fColor;\
		void main (void) {\
			fColor = color;\
			gl_Position = vec4(uv.x * uScreenSize.y / uScreenSize.x, uv.y, 0, 1);\
			gl_PointSize = 5.0;\
		}\
	', {inline: true}), glslify('\
		precision mediump float;\
		varying vec3 fColor;\
		void main (void) {\
			gl_FragColor = vec4(fColor.xyz, 1);\
		}\
	', {inline: true}));

	shader.bind();

	//create buffer and inform shader to use buffer’s coords
	buffer = new Buffer(gl, vertices);
	shader.attributes.uv.pointer(gl.FLOAT, false, 20, 0);
	shader.attributes.color.pointer(gl.FLOAT, false, 20, 8);

	uScreenSize = gl.getUniformLocation(shader.program, 'uScreenSize');

	gl.lineWidth(1.5);
});

shell.on('gl-render', function () {
	var w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
	gl.uniform2f(uScreenSize, w, h);

	gl.clearColor(0,0,0,1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.drawArrays(gl.LINE_LOOP, 99, 32);
	gl.drawArrays(gl.TRIANGLES_FAN, 131, 5);
	gl.drawArrays(gl.LINES, 35, 64);
	gl.drawArrays(gl.POINTS, 3, 32);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
});

