/**
 * Create shader with bound uniform values.
 *
 * Goal:
 * - find out how to pass uniform values to shader program, w/o stackgl
 *
 * Result:
 * - it is unnecessarily to define uniform variables in both shaders, enough just one
 * - quite easy - for each anim frame bind data to the buffer as getlocation, then uniformXXX
 * - using stackgl uniforms is a way easier - just set up them for shader as shader.uniform.name = value
 * - (i believe) we can set up uniforms before rendering, same as attribs
 */

var shell = require('gl-now')(500,500);
var glslify = require('glslify');
var Shader = require('gl-shader');


//triangle drawer (not really into a business how it’s done)
function drawTriangle(shader, color, scale, offset) {
	var gl = shader.gl;

	var buffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 0, 0, -1, 1, 1]), gl.STREAM_DRAW)
	gl.enableVertexAttribArray(0)
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
	gl.drawArrays(gl.TRIANGLES, 0, 3)
	gl.bindBuffer(gl.ARRAY_BUFFER, null)
	gl.disableVertexAttribArray(0)
	gl.deleteBuffer(buffer)


	var stackgl = true;

	//stackgl way of passing uniforms
	if (stackgl) {
		shader.uniforms.color = color;
		shader.uniforms.scale = scale;
		shader.uniforms.offset = offset;
	}
	//native way of passing uniforms
	else {
		var colorLocation = gl.getUniformLocation(shader.program, 'color');
		gl.uniform3fv(colorLocation, color);
		var scaleLocation = gl.getUniformLocation(shader.program, 'scale');
		gl.uniform1f(scaleLocation, scale);
		var offsetLocation = gl.getUniformLocation(shader.program, 'offset');
		gl.uniform2fv(offsetLocation, offset);
	}
}



shell.preventDefaults = false;

shell.on('gl-init', function () {
	var gl = this.gl;

	//this way is simplier than manual, though prone to forget
	var shader = Shader(gl,
		glslify('\
			precision mediump float;\
			uniform float scale;\
			uniform vec2 offset;\
			attribute vec2 position;\
			void main (void) {\
				gl_Position = vec4(scale*position + offset,0,1);\
			}\
		', {inline: true}),
		glslify('\
			precision mediump float;\
			uniform vec3 color;\
			void main (void) {\
				gl_FragColor = vec4(color, 1);\
			}\
		', {inline: true})
	);

	this.shader = shader;

});

shell.on('gl-render', function () {
	var gl = this.gl;
	var shader = this.shader;

	//makes gl use program of the shader
	shader.bind();

	gl.clearColor(0,0,0,1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	drawTriangle(shader, [1,0,0], .15, [-.5,-.5]);
	drawTriangle(shader, [0,1,0], .25, [.5,-.5]);
	drawTriangle(shader, [0,0,1], .5, [.1,.3]);
	drawTriangle(shader, [1,1,0], .3, [.3,-.4]);
});