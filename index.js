
import spr_sheet from "./assets/char.png";
import spr_meta from "./assets/char.json";

// import * as TWGL  from "twgl.js";
// let m4 = TWGL.m4;
// let v3 = TWGL.v3;

import { Scene, 
        PerspectiveCamera,
        WebGLRenderer,
        BoxGeometry,
        MeshBasicMaterial,
        MeshPhongMaterial,
        Mesh,
	      TextureLoader,
	      Sprite,
	      SpriteMaterial,
	      PlaneGeometry,
	      DoubleSide,
	      NearestFilter,
        Color,
        DirectionalLight,
	Vector3,
	Fog
} from 'three';




import { OrbitControls } from 'three-orbitcontrols-ts';

import { GUI } from 'dat.gui';

const gui = new GUI();

const scene = new Scene();
const bg_color = new Color('black');
scene.background = bg_color;
scene.fog = new Fog(bg_color, 10, 100);
const camera = new PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000);

const canvas = document.querySelector('canvas');
const renderer = new WebGLRenderer({canvas});

// const controls = new FlyControls(camera, renderer.domElement);
console.log(OrbitControls);
const controls = new OrbitControls(camera, renderer.domElement);

// controls.movementSpeed = 1000;
// controls.domElement = renderer.domElement;
// controls.rollSpeed = Math.PI / 24;
// controls.autoForward = false;
// controls.dragToLook = false;

renderer.setSize(window.innerWidth, window.innerHeight);

const geometry = new BoxGeometry(1, 1, 1);
const material = new MeshPhongMaterial( { color: 0x00ff00,
                                          flatShading: true} );
const cube = new Mesh( geometry, material );
//scene.add( cube );

camera.position.z = 10;
camera.position.y = 2;

const light = new DirectionalLight({color: 0xFFFFFF,
                                    intensity: 1
                                   });
light.position.set(-1, 2, 4);
scene.add(light);

class Person {
  // our pixelart person class
  //
  // the spritesheet is a horizontal row of sprites
  // and it comes with a json file that has info on where the animations
  // start and end
  // this is exported by aseprite with fran's export settings that 
  // he likes so that this all works
  //
  // <sheet_path> is a path to a spritesheet .png
  // <meta> is a object derived from the JSON produced by aseprite
  // <scene> is a reference to threejs scene
  constructor(sheet_path, meta, scene) {
    this.sheet_path = sheet_path;
    this.meta = meta;

    // by default, just "animate" based on the first sprite in the sheet
    this.curr_i = 0;
    this.start_i = 0;
    this.end_i = 0;

    // create geometry/textures and add to threejs scene
    const map = new TextureLoader().load(sheet_path);
    map.magFilter = NearestFilter
    map.repeat.x = 1.0 / 3.0;
    map.offset.x = 2.0 / 3.0;
    this.map = map;

    const plane_geometry = new PlaneGeometry( 1, 1 );
    const plane_material = new MeshPhongMaterial({
      transparent: true,
      side: DoubleSide, 
      flatShading: true, 
      map: map} );

    const plane = new Mesh( plane_geometry, plane_material);
    this.plane = plane;
    scene.add( plane );

    // "hack" so that we can do e.g. person.position.x = x 
    this.position = new Vector3(0, 0, 0);

  }

  // anim is a string that is an id for the anim e.g. "walk"
  startAnim(anim) {
    //console.log(this.meta.meta.frameTags);
    let tags = this.meta.meta.frameTags;

    const anim_info = tags.find(function(value) {
      return value.name == anim;
    });

    this.start_i = anim_info.from;
    this.end_i = anim_info.to;
  }

  update() {

    // determine which frame we're on
    const t_ms = Date.now();
    const num_frames = this.end_i - this.start_i + 1;

    // assume for now that every frame lasts for .5 seconds
    const frame_dur = 300;

    const curr_frame = Math.floor(t_ms / frame_dur) % (num_frames);
    const frame_i = this.start_i + curr_frame;

    this.map.offset.x = frame_i / 3.0;
    
    // update position
    // "hack" so that we can do e.g. person.position.x = x 
    this.plane.position.copy(this.position);

  }
}

function makeGround(scene) {

  // make a square pixelated ground plane centered on (0, 0, 0)
  // width and length are <size>
  // there are <resolution> "pixels" in each row/column
  const size = 30;
  const resolution = 10;

  const extent = size / 2;
  const pixel_size = size / resolution;

  for (let x = -extent; x < extent; x += pixel_size) {
    for (let z = -extent; z < extent; z += pixel_size) {

      const r = Math.random() * 255;
      const g = Math.random() * 255;
      const b = Math.random() * 255;
      const color = new Color(0,
			      Math.random(),
			      0);

      const tile_geo = new PlaneGeometry(pixel_size, pixel_size);
      const tile_mat = new MeshPhongMaterial({
        color: color,
        side: DoubleSide});

      const tile = new Mesh(tile_geo, tile_mat);
      tile.position.x = x;
      tile.position.z = z;
      tile.rotateX(-Math.PI / 2);
      scene.add(tile);

    }

  }

}

var person;
var ground;

// this is the main render loop
let then = 0;
function renderFrame(now) {
  // variable framerate
  let delta = now - then;
  then = now;

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  person.update()


  renderer.render(scene, camera);

  requestAnimationFrame(renderFrame);
}

//var char;
function main() {

  // make ground plane
  const ground_geo = new PlaneGeometry( 100, 100 );
  const ground_mat = new MeshPhongMaterial({
    color: 0x00ff00,
    side: DoubleSide});

  ground = new Mesh( ground_geo, ground_mat);
  ground.rotateX(-Math.PI / 2);
  scene.add( ground );
  // makeGround(scene);
  
  person = new Person(spr_sheet, spr_meta, scene);
  person.position.z = 6;
  person.position.y = .5;
  person.startAnim('walk');

  requestAnimationFrame(renderFrame);
}

main();




// ======== BELOW THIS LINE IS WEBGL ============


// webgl compatibility check
// ripped from
// https://github.com/mrdoob/three.js/blob/master/examples/jsm/WebGL.js
function isWebGLAvailable() {

  try {

          const canvas = document.createElement( 'canvas' );
          return !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );

        } catch ( e ) {

                return false;

              }

}

// const canvas = document.querySelector('canvas');
// 
// const gl = canvas.getContext('webgl');
// if (!gl) {
//   console.log('this browser/environment does not support webgl!');
// }



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

// // create and compile shaders into webgl context
// var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
// var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;
//  
// console.log(fragmentShaderSource);
// 
// var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
// var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
// 
// console.log(vertexShader);
// console.log(fragmentShader);
// 
// // create program and link shaders into program
// var program = createProgram(gl, vertexShader, fragmentShader);
// 
// // ============ END PROGRAM CREATION/LINKING ===============
// // tell webgl to use the program (that's on the GPU)
// gl.useProgram(program);
// 
// var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
// 
// 
// 
// // sets this uniform on the last program that we called useProgram on
// gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
// 

// thank you https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html
function perspective(fieldOfViewInRadians, aspect, near, far) {
  var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
  var rangeInv = 1.0 / (near - far);

  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ];
}


// gl.drawArrays(primitiveType, offset, count);
// assume a square sprite 32x32
// assume that we've loaded and linked the appropriate frag and vert
// shaders into a program and into gl
function drawSprite(sheet, i, x, y, scale) {


  // CONSTRUCT VERTICES FOR SQUARE AND LOAD THEM INTO THE PROGRAM

  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
  // construct array for triangle vertices
  // two triangles that form into a square of size 32x32
  // top-left of triangle is at (x,y) in pixel space
  //


  let z = -300;
  var positions = [
    0, 0, z, // top left
    32, 0, z, // top right
    0,  32, z, // bottom left 
    0, 32, z, // bottom left
    32, 0, z, // top right
    32, 32, z, // bottom right
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 3;          // 2 components per iteration
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
  //
  let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  let z_near = 1;
  let z_far = 2000;
  let fovRadians = Math.PI / 3;
  let transform = perspective(fovRadians, aspect, z_near, z_far);
  transform = m4.translate(transform, v3.create(x, y, 0), 0);
  // transform = m4.rotate(matrix, 0);
  // transform = m4.scale(transform, 1, 1);


  var transformLocation = gl.getUniformLocation(program, "u_transform");
  gl.uniformMatrix4fv(transformLocation, false, transform);// Set the matrix.


    // make a texture sampler matrix based on i
    // rotation params (i'm not even using them bc fuck that rn lol)
    let sheetScaleLocation = gl.getUniformLocation(program, "u_sheetScale");
    
    gl.uniform1f(sheetScaleLocation, 3.0);

    let sheetTranslateLocation = gl.getUniformLocation(program, "u_sheetTranslate");
    
    gl.uniform1f(sheetTranslateLocation, i);


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
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sheet);


  // draw the texture onto the triangle
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 6;
  gl.drawArrays(primitiveType, offset, count);

}


var img;
var char;
function old_main() {

  console.log(TWGL.m4);

  char = new Person(spr_sheet, spr_meta);

  char.startAnim('walk');

  requestAnimationFrame(drawFrame);

}

//main();

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

  char.draw(gl);

  requestAnimationFrame(drawFrame);
}
