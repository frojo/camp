
import art from "./dude.png";

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

// ============ END PROGRAM CREATION/LINKING ===============

var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

// BEGIN RENDER LOOP?
webglUtils.resizeCanvasToDisplaySize(gl.canvas);

// maps clip space onto the whole canvas (and no bigger)
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.clearColor(0, 0, 0, 0);

gl.clear(gl.COLOR_BUFFER_BIT);

// tell webgl to use the program (that's on the GPU)
gl.useProgram(program);

// sets this uniform on the last program that we called useProgram on
gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);



// gl.drawArrays(primitiveType, offset, count);
// assume a square sprite 32x32
// assume that we've loaded and linked the appropriate frag and vert
// shaders into a program and into gl
function drawSprite(img, x, y, scale) {


  // CONSTRUCT VERTICES FOR SQUARE AND LOAD THEM INTO THE PROGRAM

  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  

  // construct array for triangle vertices
  // two triangles that form into a square of size 32*<scale>
  // top-left of triangle is at (x,y) in pixel space
  
  var positions = [
    x, y, // top left
    x + 32, y, // top right
    x, y + 32, // bottom left 
    x, y + 32, // bottom left
    x + 32, y, // top right
    x + 32, y + 32, // bottom right
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
  gl.enableVertexAttribArray(positionAttributeLocation);

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


  // PREP TEXTURE THAT WILL BE PAINTED ONTO THE SQUARE

  var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

  var texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);


  // draw the texture onto the triangle
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 6;
  gl.drawArrays(primitiveType, offset, count);

}

function main() {
  var img = new Image();
  console.log(art);
  img.src = art;
  img.onload = function() {
    render(img);
  }
}

function render(img) {
  drawSprite(img, 10, 20, 1);
  drawSprite(img, 50, 60, 1);

}

main();
