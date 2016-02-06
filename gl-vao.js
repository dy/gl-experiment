/**
 * gl-vao readme case.
 * Goal - understand what is vao, how to use it.
 *
 * Results
 * - VAO is a sort of collection of attrib buffers passed to shader to work with.
 */

var shell = require("gl-now")()
var createBuffer = require("gl-buffer")
var createVAO = require("gl-vao")
var glslify = require("glslify")
var createShader = require("gl-shader")

var vao, shader

shell.preventDefaults = false;

shell.on("gl-init", function() {
  var gl = shell.gl

  //Create shader object
  shader = createShader(gl,
    glslify("\
      attribute vec2 position;\
      attribute vec3 color;\
      varying vec3 fragColor;\
      void main() {\
        gl_Position = vec4(position, 0, 1.0);\
        fragColor = color;\
      }"
      , {inline: true}
    ),
    glslify("\
      precision highp float;\
      varying vec3 fragColor;\
      void main() {\
        gl_FragColor = vec4(fragColor, 1.0);\
      }"
      , {inline: true}
    )
  );
  //THIS IS CRITICAL - BUT WHAT IS THAT?
  //it is a sort of interface to shader attributes
  //calling this updates their location - but why on earth we should do it?
  //and why not updating it does nothing?
  //and why color location is 1, not 0?
  //They define locations in VAO, look below. It’s a data provided to it.
  shader.attributes.position.location = 1
  shader.attributes.color.location = 0

  //Create vertex array object
  vao = createVAO(gl, [
    [0.8, 1, 0.5],
    { "buffer": createBuffer(gl, [-0.9, 0, 0, -0.9, 0.9, 0.9]),
      "type": gl.FLOAT,
      "size": 2
    }
  ])
})

shell.on("gl-render", function(t) {
  var gl = shell.gl

  //Bind the shader
  shader.bind()

  //Bind vertex array object and draw it
  vao.bind()
  vao.draw(gl.LINE_LOOP, 3)

  //Unbind vertex array when fini
  vao.unbind()
})