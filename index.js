
import spr_sheet from "./assets/char.png";
import spr_meta from "./assets/char.json";

import { Scene, 
        PerspectiveCamera,
        WebGLRenderer,
        BoxGeometry,
        MeshBasicMaterial,
        MeshPhongMaterial,
	ShaderMaterial,
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
  Vector2,
	Fog,
  Raycaster,
  MOUSE
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

controls.mouseButtons =  {
  ORBIT : MOUSE.RIGHT
}
controls.enablePan = true;

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
  // our papermario pixelart person class
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

    // our internal position tracker
    this.position = new Vector3(0, .5, 0);

    this.walkTarget = new Vector3(0, .5, 0);
    this.walkSpeed = .03;
    this.walking = false;

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

  // <target> is Vector3 world coords on the ground plane of where our person is teleported to
  teleport(target) {
    // the ground plane is at y=0, but our person has to be at y=.5
    // so as not to be cut in half by the ground plane
    target.y = .5
    this.position.copy(target);
  }

  // <target> is Vector3 world coords on the ground plane of where our person is walking to
  walkTo(target) {

    // the ground plane is at y=0, but our person has to be at y=.5
    // so as not to be cut in half by the ground plane
    target.y = .5;
    console.log('CHANGING WALK TARGET');
    this.walkTarget.copy(target);

    this.walking = true;

    //console.log(this.walkTarget);

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


    if (this.walking) {
    // get a unit vector in the direction from our current point to 
    // the target by subtracting and then normalizing
      const dir = this.walkTarget.clone()
      dir.sub(this.position);
      dir.normalize();
      dir.multiplyScalar(this.walkSpeed);
      this.position.add(dir);

      // if we're close enough to the target, stop walking
      // (avoids admittedly cool vibrating glitch)
      const dist = this.position.distanceToSquared(this.walkTarget);
      if (dist < .001) {
        this.walking = false;
      }
      
    }
    
    // update threejs Object3D position with our internal tracker
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


  greta.update()


  renderer.render(scene, camera);

  requestAnimationFrame(renderFrame);
}

//var char;
var greta;
function main() {
  var frag_shader = document.querySelector("#fragment-shader-pixel-grass").text;
  //console.log(frag_shader);


  // make ground plane
  const ground_geo = new PlaneGeometry( 100, 100 );
  const ground_mat = new MeshPhongMaterial({
    color: 0x3e631d,
    side: DoubleSide});

  // const ground_mat = new ShaderMaterial({
  //   fragmentShader: frag_shader});
  // ground_mat.fog = true;

  ground = new Mesh( ground_geo, ground_mat);
  ground.rotateX(-Math.PI / 2);
  scene.add( ground );
  // makeGround(scene);
  
  greta = new Person(spr_sheet, spr_meta, scene);
  greta.teleport(new Vector3(0, 0, 6));
  greta.startAnim('walk');

  requestAnimationFrame(renderFrame);
}

// input
//
function onMouseMove(event) {
  console.log('mouse moving');

}

function addDebugCube(scene, worldCoords) {

  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshPhongMaterial( { color: 0xffff00} );
  const cube = new Mesh( geometry, material );


  cube.position.copy(worldCoords);
  scene.add(cube);

}

function onClick(event) {
  console.log('mouse clicked');


  const raycaster = new Raycaster();
  const mouse = new Vector2();

  // calculate mouse position in normalized device coordinates
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  raycaster.setFromCamera( mouse, camera );

  const intersects = raycaster.intersectObject(ground);

  const walkTarget = intersects[0].point;

  //console.log(walkTarget);

  greta.walkTo(intersects[0].point);
  //greta.teleport(intersects[0].point);

  // greta.position.copy(intersects[0].point);
  // greta.position.y = .5;

  


}

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onClick, false);

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

