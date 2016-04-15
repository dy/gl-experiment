/**
 * Prove that savepixels has a bug.
 *
 * Yep, there is. Reported to save-pixels.
 */

var ndarray = require("ndarray")
var savePixels = require("save-pixels")

//Create an image
var w = 20;
var h = 10;
var data = Array(w*h*4).fill(255);

data = data.map(function (value, i) {
	var result = 255 * ( Math.floor(i/4) % w) / (w-1);
	return (i+1) % 4 === 0 ? 255 : result;
});

var canvas = document.createElement('canvas');
canvas.width = w;
canvas.height = h;
var ctx = canvas.getContext('2d');
var imageData = ctx.createImageData(w, h);

data.forEach(function (x, i) {
	imageData.data[i] = x;
});

ctx.putImageData(imageData, 0, 0);
document.body.appendChild(canvas);

var x = ndarray(data, [w, h, 4]);

// Save to a file
// document.body.appendChild(savePixels(x, "canvas"));
savePixels(x, "png").pipe(process.stdout)