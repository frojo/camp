
import spr_sheet from "./assets/char.png";
import spr_meta from "./assets/char.json";
import ground_tex from "./assets/ground.png";

import { Scene, 
        PerspectiveCamera,
        WebGLRenderer,
        BoxGeometry,
        MeshBasicMaterial,
        MeshPhongMaterial,
        MeshLambertMaterial,
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
        AmbientLight,
        SpotLight,
	Vector3,
  Vector2,
	Fog,
  Raycaster,
  MOUSE,
  RepeatWrapping
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

const controls = new OrbitControls(camera, renderer.domElement);

controls.mouseButtons =  {
  ORBIT : MOUSE.RIGHT
}
controls.enablePan = true;

renderer.setSize(window.innerWidth, window.innerHeight);

camera.position.z = 10;
camera.position.y = 2;

const light = new DirectionalLight({color: 0xFFFFFF,
                                    intensity: .0001,
                                   });

// const light = new AmbientLight({color: 0xFFFFFF,
//                                     intensity: .01,
//                                    });
light.position.set(-1, 2, 4);
scene.add(light);

const spot = new SpotLight({color: 0xFFFFFF});
spot.position.set(0, 3, 7);
spot.intensity = 2;
spot.castShadow = true;

scene.add(spot);

class Person {
  // our papermario/magicwand pixelart person class
  //
  // the spritesheet is a horizontal row of sprites
  // and it comes with a json file that has info on where the animations
  // start and end etc.
  // the JSON has to be exported by aseprite with certain export settings
  // which are mostly defaults except for:
  // Array (not Hash)
  // set "Item Filename" to {tag}{tagframe}
  //
  // <sheet_path> is a path to a spritesheet .png
  // <meta> is a object derived from the JSON produced by aseprite
  // <scene> is a reference to threejs scene
  constructor(sheet_path, meta, scene) {
    this.sheet_path = sheet_path;
    this.meta = meta;

    // frame indices
    this.curr_i = 0;
    this.start_i = 0;
    this.end_i = 0;

    // how many frames in the sprite sheet
    this.frame_num = this.meta.frames.length;

    // create geometry/textures and add to threejs scene
    const map = new TextureLoader().load(sheet_path);
    // get those crisp pixels
    map.magFilter = NearestFilter
    // sample one frame at a time from the sprite sheet
    map.repeat.x = 1.0 / this.frame_num;
    this.map = map;

    // threejs obj stuff
    const plane_geometry = new PlaneGeometry( 1, 1 );
    const plane_material = new MeshLambertMaterial({
      transparent: true,
      side: DoubleSide, 
      flatShading: true, 
      map: map} );

    const plane = new Mesh( plane_geometry, plane_material);
    this.plane = plane;
    scene.add( plane );

    // our internal world position tracker
    this.position = new Vector3(0, .5, 0);

    this.walkTarget = new Vector3(0, .5, 0);
    this.walk_speed = .01
    this.walking = false;

    this.startAnim('idle');

  }

  // anim is a string that is an id for the anim e.g. "walk"
  startAnim(anim) {
    let tags = this.meta.meta.frameTags;

    const anim_info = tags.find(function(value) {
      return value.name == anim;
    });

    if (!anim_info) {
      console.log('ERROR: no animation with that tag!!');
      return;
    }

    this.start_i = anim_info.from;
    this.end_i = anim_info.to;
  }

  // <target> is Vector3 world coords on the ground plane 
  // where we are teleported to
  teleport(target) {
    // the ground plane is at y=0, but our person has to be at y=.5
    // so as not to be cut in half by the ground plane
    target.y = .5
    this.position.copy(target);
  }

  // <target> is Vector3 world coords on the ground plane 
  // we begin to walk to
  walkTo(target) {
    // the ground plane is at y=0, but our person has to be at y=.5
    // so as not to be cut in half by the ground plane
    target.y = .5;
    this.walkTarget.copy(target);

    this.startAnim('walk');
    this.walking = true;
  }

  update() {
    // determine which frame we're on
    const t_ms = Date.now();
    const num_frames = this.end_i - this.start_i + 1;

    // assume for now that every frame lasts for 200ms
    const frame_dur = 200;

    const curr_frame = Math.floor(t_ms / frame_dur) % (num_frames);
    const frame_i = this.start_i + curr_frame;

    this.map.offset.x = frame_i / this.frame_num;


    if (this.walking) {
      // get a unit vector in the direction from our current point to 
      // the target by subtracting and then normalizing
      const dir = this.walkTarget.clone()
      dir.sub(this.position);
      dir.normalize();
      dir.multiplyScalar(this.walk_speed);
      this.position.add(dir);

      // face us in the direction we're walking
      if (dir.x < 0) {
        this.plane.scale.x = -1;
      } else {
        this.plane.scale.x = 1;
      }


      // if we're close enough to the target, stop walking
      // (avoids admittedly cool vibrating glitch)
      const dist = this.position.distanceToSquared(this.walkTarget);
      if (dist < .001) {
        this.startAnim('idle');
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
  const tex = new TextureLoader().load(ground_tex);
  // get those crisp pixels
  tex.magFilter = NearestFilter;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(60, 60);
  const ground_geo = new PlaneGeometry( 100, 100 );
  const ground_mat = new MeshLambertMaterial({
    map: tex
  });

  

  // const ground_mat = new ShaderMaterial({
  //   fragmentShader: frag_shader});
  // ground_mat.fog = true;

  ground = new Mesh(ground_geo, ground_mat);
  ground.rotateX(-Math.PI / 2);
  scene.add( ground );
  // makeGround(scene);
  
  greta = new Person(spr_sheet, spr_meta, scene);
  greta.teleport(new Vector3(0, 0, 6));

  requestAnimationFrame(renderFrame);
}

// input
//
function onMouseMove(event) {

}

function addDebugCube(scene, worldCoords) {

  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshPhongMaterial( { color: 0xffff00} );
  const cube = new Mesh( geometry, material );


  cube.position.copy(worldCoords);
  scene.add(cube);

}

function onClick(event) {

  const raycaster = new Raycaster();
  const mouse = new Vector2();

  // calculate mouse position in normalized device coordinates
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  raycaster.setFromCamera( mouse, camera );

  const intersects = raycaster.intersectObject(ground);

  const walkTarget = intersects[0].point;
  greta.walkTo(intersects[0].point);
}

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onClick, false);

main();

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

