
function hello() {
  console.log('hellow rold');
}
hello();

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


// get a_position attrib (from vertex shader) "location" in our program
// .... okay?
var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

// make a buffer - we will use this to provide the data for a_position
// it's like a little tray that we put ingredients in and then
// webgl takes those ingredients and makes cake with it
var positionBuffer = gl.createBuffer();

// bind the buffer to gl
// still not really sure what this does
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);


var positions = [
    0, 0,
    0, 0.5,
    0.7, 0,
];

// so is gl.ARRAY_BUFFER the "bind point"? yeah. guess so
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

var primitiveType = gl.TRIANGLES;
var offset = 0;
var count = 3;
gl.drawArrays(primitiveType, offset, count);

