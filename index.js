
import charSheet from "./assets/char.png";
import charMeta from "./assets/char.json";

import * as TWGL  from "twgl.js";
let m3 = TWGL.m3;
let m4 = TWGL.m4;

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
// tell webgl to use the program (that's on the GPU)
gl.useProgram(program);

var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");



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
  // two triangles that form into a square of size 32x32
  // top-left of triangle is at (x,y) in pixel space
  
  var positions = [
    0, 0, // top left
    32, 0, // top right
    0,  32, // bottom left 
    0, 32, // bottom left
    32, 0, // top right
    32, 32, // bottom right
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

  // translation coords
  var translationUniformLocation = gl.getUniformLocation(program, "u_translation");
  
  gl.uniform2f(translationUniformLocation, x, y);
  
  // rotation params (i'm not even using them bc fuck that rn lol)
  var rotationUniformLocation = gl.getUniformLocation(program, "u_rotation");
  
  gl.uniform2f(rotationUniformLocation, x, y);
  
  // console.log(TWGL);
  // console.log(TWGL.m3);
  // console.log(m3);

  // // pass in the transform matrix as a uniform
  // var matrixLocation = gl.getUniformLocation(program, "u_transform");
  // let transform = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
  // transform = m4.translate(matrix, x, y);
  // transform = m4.rotate(matrix, 0);
  // transform = m4.scale(matrix, 1, 1);
  // gl.uniformMatrix4fv(matrixLocation, false, matrix);// Set the matrix.
  




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

class Char {


  // we're assuming the sheet is a horizontal row of sprites
  // and it comes with a json file that has info on where the animations
  // start and end
  //
  // this is exported by aseprite with fran's export settings that 
  // he likes so that this all works

  // <sheet> is a path to a spritesheet .png
  // <meta> is a path to a .json containing animation metadata
  constructor(sheet, meta) {
    this.sheet = sheet;
    this.meta = meta;


    // load the image
    let img = new Image();
    img.src = sheet;


    this.loaded = false;
    img.onload = function() {
      this.loaded = true;
    }

    this.img = img;

    // by default, just "animate" based on the first sprite in the sheet
    this.curr_i = 0;
    this.start_i = 0;
    this.end_i = 0;

  }

  // anim is a string that is an id for the anim e.g. "walk"
  startAnim(anim) {
    //console.log(this.meta.meta.frameTags);
    let tags = this.meta.meta.frameTags;

    const anim_info = tags.find(function(value) {
      return value.name == anim;
    });

    console.log(anim_info);
    this.start_i = anim_info.from;
    this.end_i = anim_info.to;
  }

  // <sheet> is a the spritesheet .png
  // <i> is the index of the sprite in the sheet
  drawFrameFromSheet(sheet, i, x, y) {

    // make a texture sampler matrix based on i


    drawSprite(this.img, 100, 40, 1);
  }

  draw(gl) {

    // determine which frame we're on
    const t_ms = Date.now();
    const num_frames = this.end_i - this.start_i + 1;

    // assume for now that every frame lasts for .5 seconds
    const frame_dur = 500;

    const curr_frame = Math.floor(t_ms / frame_dur) % (num_frames);
    const frame_i = this.start_i + curr_frame;
    

    console.log(curr_frame);

    this.drawFrameFromSheet(this.sheet, frame_i, 140, 40);
    

    drawSprite(this.img, 100, 40, 1);
  }
}

var img;
var char;
function main() {

  char = new Char(charSheet, charMeta);

  char.startAnim('walk');

  requestAnimationFrame(drawFrame);

}

main();

var then = 0;

requestAnimationFrame(drawFrame);

// this is the main render func
function drawFrame(now) {
  // variable framerate
  let delta = now - then;
  then = now;

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  
  // maps clip space onto the whole canvas (and no bigger)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
  gl.clearColor(0, 0, 0, 0);
  
  gl.clear(gl.COLOR_BUFFER_BIT);

  char.draw(gl, "walk");

  requestAnimationFrame(drawFrame);
}
