/**
 * Viewport experiment
 *
 * Results
 * - gl-toy uses own buffer to clear canvas, white, seemingly
 *
 */

var Camera  = require('canvas-orbit-camera')
var Shader  = require('gl-shader-core')
var Geom    = require('gl-geometry')
var mat4    = require('gl-matrix').mat4
var quat    = require('gl-matrix').quat
var unindex = require('unindex-mesh')
var faces   = require('face-normals')
var bunny   = require('bunny')
var GL = require('gl-context');
var raf = require('raf-component');
var Stats = require('stats.js');


//setup stats
var stats = new Stats();
stats.setMode( 0 ); // 0: fps, 1: ms, 2: mb
// align top-left
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';
document.body.appendChild( stats.domElement );


bunny = {
  positions: unindex(bunny.positions, bunny.cells)
}

bunny.normals = faces(bunny.positions)

module.exports = createBunny

var start = Date.now()

function createBunny(gl) {
  var proj = mat4.create()
  var view = mat4.create()
  var geom = Geom(gl)
    .attr('position', bunny.positions)
    .attr('normal', bunny.normals)

  var camera = Camera(gl.canvas, {
      pan: false
    , scale: false
    , rotate: false
  })

  var uniforms = [{
      name: 'proj'
    , type: 'mat4'
  }, {
      name: 'view'
    , type: 'mat4'
  }]

  var vertSource = [
      'precision mediump float;'
    , 'uniform mat4 proj;'
    , 'uniform mat4 view;'
    , 'varying vec3 anormal;'
    , 'attribute vec3 position;'
    , 'attribute vec3 normal;'
    , 'void main() {'
    , '  anormal = normal;'
    , '  gl_Position = proj * view * vec4(position, 1);'
    , '}'
  ].join('\n')

  var fragSource = [
      'precision mediump float;'
    , 'varying vec3 anormal;'
    , 'void main() {'
    , '  gl_FragColor = vec4(mix(abs(anormal), vec3(1), 0.25), 1);'
    , '}'
  ].join('\n')

  var shader = Shader(gl
    , vertSource
    , fragSource
    , uniforms
    , []
  )

  return function (gl, t) {
    var width  = 200;//gl.drawingBufferWidth
    var height = gl.drawingBufferHeight

    gl.viewport(0, 0, width/2, height);
    renderBunny();
    gl.viewport(width/2, 0, width/2, height);
    renderBunny();

    function renderBunny() {
	    gl.enable(gl.DEPTH_TEST)

	    geom.bind(shader)

	    mat4.perspective(proj
	      , Math.PI / 4
	      , width / height
	      , 0.01
	      , 100
	    )

	    quat.identity(camera.rotation)
	    quat.rotateY(camera.rotation, camera.rotation, Math.sin(t * 0.0002)*3)
	    quat.rotateX(camera.rotation, camera.rotation, Math.sin(t * 0.0001)*3)
	    quat.rotateZ(camera.rotation, camera.rotation, Math.sin(t * 0.0003)*3)
	    camera.distance = 20 * (Math.sin(t * 0.001) + 2)
	    camera.center = [0, 4, 0]
	    camera.view(view)

	    shader.uniforms.proj = proj
	    shader.uniforms.view = view
	    geom.draw(gl.TRIANGLES);
	}
  }
}


var canvas = document.createElement('canvas');

var time = -Date.now();
var gl = GL(canvas, function _render() {
  stats.begin();
  render(gl, Date.now() + time);
  stats.end();
});

//show canvas
document.body.appendChild(gl.canvas);

//create exercise
var render = createBunny(gl);