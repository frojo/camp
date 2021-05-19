
const canvas = document.querySelector('canvas');

const gl = canvas.getContext('webgl');
if (!gl) {
  console.log('this browser/environment does not support webgl!');
}


function createShader(gl, type, source) {
  var shader = gl.createShader(type);

  gl.shaderSource(shader, source);

  gl.compileShader(shader);

  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
        return shader;
  }
  
  // this is only if the linking/compiling doesnt work
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();

    gl.attachShader(program, vertexShader);

    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
          return program;
        }
   
    // this is only if the linking/compiling doesnt work
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

// create and compile shaders into webgl context
var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;
 
console.log(fragmentShaderSource);

var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

console.log(vertexShader);
console.log(fragmentShader);

// create program and link shaders into program
var program = createProgram(gl, vertexShader, fragmentShader);


var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

var colorUniformLocation = gl.getUniformLocation(program, "u_color");

// make a buffer - we will use this to provide the data for a_position
// it's like a little tray that we put ingredients in and then
// webgl takes those ingredients and makes cake with it
var positionBuffer = gl.createBuffer();

// bind the buffer to gl
// still not really sure what this does
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);


var positions = [
  10, 20,
  80, 20,
  10, 30,
  10, 30,
  80, 20,
  80, 30,
];

gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);


// BEGIN RENDER LOOP?
webglUtils.resizeCanvasToDisplaySize(gl.canvas);

// maps clip space onto the whole canvas (and no bigger)
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.clearColor(0, 0, 0, 0);

// tf does this line do?
gl.clear(gl.COLOR_BUFFER_BIT);

// tell webgl to use the program (that's on the GPU)
gl.useProgram(program);

gl.enableVertexAttribArray(positionAttributeLocation);

// Bind the position buffer.
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
var size = 2;          // 2 components per iteration
var type = gl.FLOAT;   // the data is 32bit floats
var normalize = false; // don't normalize the data
var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
var offset = 0;        // start at the beginning of the buffer

// it binds it to the current ARRAY_BUFFER (not made explicit)
// so now the position attrib is bound to positionBuffer (the current ARRAY_BUFFER)
// and now that we've done this, we can bind something esle to
// ARRAY_BUFFER and use it for something else
gl.vertexAttribPointer(
    positionAttributeLocation, size, type, normalize, stride, offset)

// sets this uniform on the last program that we called useProgram on
gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

// DRAW DRAW DRAW draw!
var primitiveType = gl.TRIANGLES;
var offset = 0;
var count = 6;
gl.drawArrays(primitiveType, offset, count);

// draw 50 random rects
for (var ii = 0; ii < 50; ++ii) {
    // Setup a random rectangle
    // This will write to positionBuffer because
    // its the last thing we bound on the ARRAY_BUFFER
    // bind point
    setRectangle(
        gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

    // Set a random color.
    gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

    // Draw the rectangle.
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Returns a random integer from 0 to range - 1.
function randomInt(range) {
  return Math.floor(Math.random() * range);
}

// Fills the buffer with the values that define a rectangle.
function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;

  // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
  // whatever buffer is bound to the `ARRAY_BUFFER` bind point
  // but so far we only have one buffer. If we had more than one
  // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2]), gl.STATIC_DRAW);
}

