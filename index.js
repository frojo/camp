
import greta_sheet from "./assets/char.png";
import greta_meta from "./assets/char.json";
import greta_bloom_sheet from "./assets/char_bloom.png";
import greta_bloom_meta from "./assets/char_bloom.json";

import keeper_sheet from "./assets/steward.png";
import keeper_meta from "./assets/steward.json";
import keeper_bloom_sheet from "./assets/steward_bloom.png";
import keeper_bloom_meta from "./assets/steward_bloom.json";

import newkeeper_sheet from "./assets/new_steward.png";
import newkeeper_meta from "./assets/new_steward.json";

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
        IcosahedronGeometry,
	      DoubleSide,
	      NearestFilter,
        Color,
        DirectionalLight,
        AmbientLight,
        PointLight,
        PointLightHelper,
        SpotLight,
	Vector3,
  Vector2,
	Fog,
  Raycaster,
  MOUSE,
  RepeatWrapping,
  Layers,
  Group,
} from 'three';

import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {BloomPass} from 'three/examples/jsm/postprocessing/BloomPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';


import { GUI } from 'dat.gui';

const BASE_LAYER = 0, BLOOM_LAYER = 1;

const bloomLayer = new Layers();
bloomLayer.set(BLOOM_LAYER);

const darkMaterial = new MeshBasicMaterial( {color: "black"});
const materials = {};


const gui = new GUI();

const scene = new Scene();
const bg_color = new Color('black');
scene.background = bg_color;
scene.fog = new Fog(bg_color, 10, 100);



const camera = new PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000);

var camWindowCenter = new Vector3(0, 0, 0);
var camOffset = new Vector3(0, 0, 0);

// camera settings
var camFarBoundOffset =1.9;
var camNearBoundOffset = 0.5;
var camRightBoundOffset = 2;
var camLeftBoundOffset = 2;

const canvas = document.getElementById('world');
const renderer = new WebGLRenderer({canvas});


renderer.setSize(window.innerWidth, window.innerHeight);

// const light = new DirectionalLight({color: 0xFFFFFF,
//                                     intensity: .0001,
//                                    });

const lights = [];

const ambient_light = new AmbientLight();
ambient_light.color.set('#505870');
ambient_light.intensity = 0.25;

scene.add(ambient_light);


const bloomPass = new UnrealBloomPass(
  // what are these params?
  new Vector2(window.innerWidth, window.innerHeight),
  4.3,
  0,
  0,
);


const renderPass = new RenderPass(scene, camera);

const bloomComposer = new EffectComposer(renderer);
bloomComposer.renderToScreen = false;
bloomComposer.addPass(renderPass);
bloomComposer.addPass(bloomPass);

const finalPass = new ShaderPass(
  new ShaderMaterial( {
    uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture },
    },
    vertexShader: document.getElementById('vshader-bloom').textContent,
    fragmentShader: document.getElementById('fshader-bloom').textContent,
    defines: {}
  } ), "baseTexture"
);
finalPass.needsSwap = true;

const finalComposer = new EffectComposer(renderer);
finalComposer.addPass(renderPass);
finalComposer.addPass(finalPass);


const testPosition = new Vector3();
const guiParams = {
  // bloom 
  exposure: 1,
  strength: 5,
  threshold: 0,
  radius: 0,

  // test position
  x: 0,
  y: 0,
  z: 0,

  // lamp params
  lamp_intensity: 0,
  distance: 0,
  decay: 0,
  lamp_color: '#ff0000',

  // ambient light params
  ambient_color: '#ff0000',
  ambient_intensity: 0,

  // camera params
  camFarBound: camFarBoundOffset,
  camNearBound: camNearBoundOffset,
  camLeftBound: camLeftBoundOffset,
  camRightBound: camRightBoundOffset,


};

// gui helpers
class ColorGUIHelper {
  constructor(object, prop) {
    this.object = object;
    this.prop = prop;
  }
  get value() {
    return `#${this.object[this.prop].getHexString()}`;
  }
  set value(hexString) {
    this.object[this.prop].set(hexString);
  }
}


function makeGUILamp(gui, lamp, name) {
  const folder = gui.addFolder(name);
  guiParams.x = lamp.position.x;
  guiParams.y = lamp.position.y;
  guiParams.z = lamp.position.z;
  folder.add(guiParams, 'x', -10, 10).onChange(
    function ( value ) {
      lamp.moveTo(new Vector3(Number( value ), guiParams.y, guiParams.z));
      console.log(lamp);
    } );
  folder.add(guiParams, 'y', -10, 10).onChange(
    function ( value ) {
      lamp.moveTo(new Vector3(guiParams.x, Number(value), guiParams.z));
    } );
  folder.add(guiParams, 'z', -10, 10).onChange(
    function ( value ) {
      lamp.moveTo(new Vector3(guiParams.x, guiParams.y, Number(value)));
    } );
  folder.open();
}


// gui.addColor(new ColorGUIHelper(point_light, 'color'), 'value').name('color');
// 
// gui.add(point_light, 'intensity', 0, 2, 0.01);


// gui for post proessing
{
  const folder = gui.addFolder('lamps');
  folder.add( guiParams, 'exposure', 0.1, 2.0 ).onChange(
    function ( value ) {
      // not sure if this is doing anything rn
      renderer.toneMappingExposure = Math.pow( value, 4.0 );
    } );

  folder.add( guiParams, 'strength', 0.0, 10.0 ).onChange(
    function ( value ) {
      bloomPass.strength = Number( value );
    } );

  folder.add( guiParams, 'threshold', 0.0, 1.0 ).onChange(
    function ( value ) {
      bloomPass.threshold = Number( value );
    } );

  folder.add( guiParams, 'radius', 0.0, 1.0 ).onChange(
    function ( value ) {
      bloomPass.radius = Number( value );
    } );


  // guiParams.intensity = lamp.point_light.intensity;
  // guiParams.decay = lamp.point_light.decay;
  // guiParams.distance = lamp.point_light.distance;
  folder.add(guiParams, 'lamp_intensity', 0, 10.0).onChange(
    function ( value ) {
      lights.forEach(lamp => lamp.point_light.intensity = Number(value));
      console.log('intensity = ' + Number(value));
    } );
  folder.add(guiParams, 'distance', 0, 100).onChange(
    function ( value ) {
      lights.forEach(lamp => lamp.point_light.distance = Number(value));
      console.log('distance = ' + Number(value));
    } );
  folder.add(guiParams, 'decay', 0, 10).onChange(
    function ( value ) {
      lights.forEach(lamp => lamp.point_light.decay = Number(value));
      console.log('decay = ' + Number(value));
    } );
  folder.addColor( guiParams, 'lamp_color').onChange(
    function ( value ) {
      lights.forEach(lamp => lamp.point_light.color.set(value));
      lights.forEach(lamp => lamp.sphere.material.color.set(value));
      console.log('lamp color = ' + value);
    } );

  // folder.open();
}

// ambient light settings
{
  const folder = gui.addFolder('ambient light');
  folder.add(guiParams, 'ambient_intensity', 0.0, 1.0).onChange(
    function ( value ) {
      ambient_light.intensity = Number( value );
      console.log('ambient intensity = ' + Number(value));
    } );

  folder.addColor( guiParams, 'ambient_color').onChange(
    function ( value ) {
      ambient_light.color.set( value );
    } );

  // folder.open();
}

{
  const folder = gui.addFolder('camera');
  folder.add(guiParams, 'camFarBound', 0.0, 10.0).onChange(
    function ( value ) {
      camFarBoundOffset = Number(value);
      console.log('cam far bound = ' + Number(value));
    } );
  folder.add(guiParams, 'camNearBound', 0.0, 10.0).onChange(
    function ( value ) {
      camNearBoundOffset = Number(value);
      console.log('cam far bound = ' + Number(value));
    } );
  folder.add(guiParams, 'camLeftBound', 0.0, 10.0).onChange(
    function ( value ) {
      camLeftBoundOffset = Number(value);
      console.log('cam far bound = ' + Number(value));
    } );
  folder.add(guiParams, 'camRightBound', 0.0, 10.0).onChange(
    function ( value ) {
      camRightBoundOffset = Number(value);
      console.log('cam far bound = ' + Number(value));
    } );



  folder.open();
}

gui.close();


class Lamp {
  // a lamp in the world
  //
  // a lamp is made of:
  //   a point light, which casts some light on objects around it
  //   a sphere (well, ico-sphere) that has a bloom effect on it to
  //      simulate what it looks like to look directly at a light
  //
  // <position> is the world position of the lamp
  // <scene> is the threejs scene
  constructor(position, scene) {

    const point_light = new PointLight(0xffa429);  // color
                                      //ff8535
                                      //ffa429
    point_light.intensity = 2.5;
    point_light.distance = 17;
    point_light.decay = 2;
    point_light.position.copy(position);
    // point_light.intensity = 2;
    // point_light.castShadow = true;
    scene.add(point_light);
    this.point_light = point_light;

    const sphere_geo = new IcosahedronGeometry(.2, 15);
    const sphere_mat = new MeshBasicMaterial( {color: 0xff6714});
    const sphere = new Mesh(sphere_geo, sphere_mat);
    sphere.position.copy(position);
    scene.add(sphere);
    sphere.layers.enable(BLOOM_LAYER);
    this.sphere = sphere;

    this.position = position;

    lights.push(this);
  }

  // <position> is a Vector3
  moveTo(position) {
    this.point_light.position.copy(position);
    this.sphere.position.copy(position);
    this.position = position;
  }

  update() {
    // a hack
    this.point_light.position.copy(position);
    this.sphere.position.copy(position);
  }


}


class Person {
  // our papermario/magicwand pixelart person class
  //
  // each Person has a corresponding sprite sheet with two layers:
  // a base layer and a bloom layer
  // the bloom layer has the bloom effect applied to it
  //
  // the spritesheet is a horizontal row of sprites
  // the first half of the sheet is frames for the base layer,
  // the second half is frames for the bloom layer
  //
  // must have an idle animation that is tagged as such
  //
  // each sprite sheet has an accompanying json file that has meta 
  // info on where the animations start and end etc.
  //
  // the JSON has to be exported by aseprite with certain export settings
  // which are mostly defaults except for:
  // Layers: Visible Layers
  // Frames: All frames
  // Split Layers checked (split tags not checked)
  // Array (not Hash)
  // set "Item Filename" to {tag}{tagframe}_{layer}
  //
  // <name> is a string of our person's name (e.g. 'greta')
  // <sheet_path> is a path to a spritesheet .png
  // <meta> is a object derived from the JSON produced by aseprite
  // <scene> is a reference to threejs scene
  constructor(name, sheet_path, meta, 
		    bloom_sheet_path, bloom_meta, scene) {
    this.name = name;
    this.sheet_path = sheet_path;
    this.meta = meta;

    // frame indices
    this.curr_i = 0;
    this.start_i = 0;
    this.end_i = 0;

    // how many frames in the sprite sheet
    this.frame_num = this.meta.frames.length;
    this.frames_per_layer = this.meta.frames.length / 2;

    // BASE LAYER

    // create geometry/textures and add to threejs scene
    const map = new TextureLoader().load(sheet_path);
    // get those crisp pixels
    map.magFilter = NearestFilter
    // sample one frame at a time from the sprite sheet
    map.repeat.x = 1.0 / this.frame_num;
    this.map = map;

    // threejs obj stuff
    const plane_geometry = new PlaneGeometry(1, 1);
    const plane_material = new MeshLambertMaterial({
      transparent: true,
      side: DoubleSide, 
      map: map} );

    const plane = new Mesh( plane_geometry, plane_material);

    // BLOOM LAYER

    // create geometry/textures and add to threejs scene
    // OLD
    // const bloom_map = new TextureLoader().load(bloom_sheet_path);
    const bloom_map = new TextureLoader().load(sheet_path);
    // get those crisp pixels
    bloom_map.magFilter = NearestFilter
    // sample one frame at a time from the sprite sheet
    bloom_map.repeat.x = 1.0 / this.frame_num;
    this.bloom_map = bloom_map;
    
    const bloom_geo = new PlaneGeometry(1, 1);
    const bloom_plane_material = new MeshBasicMaterial({
      transparent: true,
      side: DoubleSide, 
      map: bloom_map} );
    const bloom_plane = new Mesh( bloom_geo, bloom_plane_material);
    bloom_plane.layers.enable(BLOOM_LAYER);


    const group = new Group();
    this.group = group;
    group.add(plane);
    group.add(bloom_plane);
    bloom_plane.position.z = plane.position.z + .001;

    this.plane = plane;
    scene.add(group);
    // scene.add(bloom_plane);

    // our internal world position tracker
    this.position = new Vector3(0, .5, 0);

    this.walkTarget = new Vector3(0, .5, 0);
    this.walk_speed = .01
    this.walking = false;

    this.startAnim('idle');


  }

  // anim is a string that is an id for the anim e.g. "walk"
  startAnim(anim) {
    console.log('starting ' + anim + ' anim for ' + this.name);
    let tags = this.meta.meta.frameTags;
    console.log(this.meta);
    this.curr_anim = anim;


    const anim_info = tags.find(function(value) {
      return value.name == anim;
    });

    console.log(anim_info);

    if (!anim_info) {
      console.log('ERROR: no animation with that tag!!');
      return;
    }

    this.start_i = anim_info.from;
    this.end_i = anim_info.to;


    // calculate total duration for this animation
    // (we need this for animating)
    let total_dur_ms = 0;
    for (let i = this.start_i; i < this.end_i + 1; i++)  {
      total_dur_ms += this.meta.frames[i].duration;
    }
    this.anim_total_dur = total_dur_ms;
    console.log(this.anim_total_dur);
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


    // this little loop figures out the current frame we're on
    // there's probably a saner way of doing this
    const split = t_ms % this.anim_total_dur;
    let interval_ms = 0;
    let frame_i = 0;
    for (frame_i = this.start_i; frame_i < this.end_i + 1; 
	 frame_i++)  {
      interval_ms += this.meta.frames[frame_i].duration;
      if (split < interval_ms) {
	break;
      }
    }
    if (false && this.name == 'greta' && this.curr_anim == 'walk') {
      console.log('anim total dur = ' + this.anim_total_dur);
      console.log('time_ms = ' + t_ms);
      console.log('split = ' + split);

      console.log('frame_i = ' + frame_i);
    }

    this.map.offset.x = frame_i / this.frame_num;

    const bloom_frame_i = frame_i + this.frames_per_layer;
    this.bloom_map.offset.x = bloom_frame_i / this.frame_num;

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
    this.group.position.copy(this.position);

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

function darkenNonBloomed(obj) {
  if (obj.isMesh && bloomLayer.test(obj.layers) == false) {

    materials[obj.uuid] = obj.material;
    obj.material = darkMaterial;
  }
}

function restoreMaterial(obj) {
  if (materials[obj.uuid]) {
    obj.material = materials[obj.uuid];
    delete materials[obj.uuid];
  }

}

function onResize() {
  const canvas = renderer.domElement;

  // resize canvas to window size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';

  // match the "drawingbuffer" size (i.e. internal pixel resolution) of 
  // the canvas to the size of the canvas in actual pixels of user
  // screen space
  renderer.setSize(canvas.width, canvas.height, false);

  // we have to resize this stuff too for postprocessing effects
  bloomComposer.setSize(canvas.width, canvas.height);
  finalComposer.setSize(canvas.width, canvas.height);

  // update camera aspect ratio
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
}

// this is called every frame to position the camera based on where
// the player is moving
//
// the way this works is the player can move in a rectangular "window"
// in front of the camera. if the player starts to move outside of
// this window, they will "push" the camera in that direction
function cameraFollow(cam, playerPos) {

  const rightBound = camWindowCenter.x + camRightBoundOffset;
  const leftBound = camWindowCenter.x - camLeftBoundOffset;
  const nearBound = camWindowCenter.z + camNearBoundOffset;
  const farBound = camWindowCenter.z - camFarBoundOffset;
  
  if (playerPos.x > rightBound) {
    const diff = playerPos.x - rightBound;
    camWindowCenter.x += diff;
  }
  if (playerPos.x < leftBound) {
    const diff = playerPos.x - leftBound;
    camWindowCenter.x += diff;
  }
  if (playerPos.z < farBound) {
    const diff = playerPos.z - farBound;
    camWindowCenter.z += diff;
  }
  if (playerPos.z > nearBound) {
    const diff = playerPos.z - nearBound;
    camWindowCenter.z += diff;
  }

  cam.position.addVectors(camWindowCenter, camOffset);

}

var ground;

// this is the main render loop (and also update loop)

let then = 0;
function renderFrame(now) {
  // variable framerate
  let delta = now - then;
  then = now;


  greta.update();
  keeper.update();
  newkeeper.update();

  cameraFollow(camera, greta.position);

  // technique copied from
  // https://github.com/mrdoob/three.js/blob/master/examples/webgl_postprocessing_unreal_bloom_selective.html
  scene.traverse(darkenNonBloomed);
  bloomComposer.render();
  scene.traverse(restoreMaterial);
  finalComposer.render();


  requestAnimationFrame(renderFrame);
}

var greta;
var keeper;
var newkeeper;
var testlamp;
function main() {

  // make ground plane
  const tex = new TextureLoader().load(ground_tex);
  // get those crisp pixels
  tex.magFilter = NearestFilter;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(60, 60);
  const ground_geo = new PlaneGeometry( 100, 100 );
  const ground_mat = new MeshPhongMaterial({
    map: tex,
    shininess: 0,
    specular: 0x000000,
  });
  console.log(ground_mat);

  ground = new Mesh(ground_geo, ground_mat);
  ground.rotateX(-Math.PI / 2);
  scene.add( ground );



  // add greta
  greta = new Person('greta', greta_sheet, greta_meta, 
			      greta_bloom_sheet, greta_bloom_meta, 
			      scene);
  greta.teleport(new Vector3(0, 0, 6));

  // add keeper
  keeper = new Person('keeper', keeper_sheet, keeper_meta, 
				keeper_bloom_sheet, keeper_bloom_meta, 
				scene);
  keeper.teleport(new Vector3(2, 0, 4));

  // add keeper
  newkeeper = new Person('newkeeper', newkeeper_sheet, newkeeper_meta, 
				null, null, 
				scene);
  newkeeper.teleport(new Vector3(1, 0, 4));


  // put some lamps in the scene
  // for (let i = 0; i < 4; i++) {

  // }
  let position = new Vector3(-5, 5, -28);
  let lamp = new Lamp(position, scene);

  position = new Vector3(0, 5, -30);
  lamp = new Lamp(position, scene);

  position = new Vector3(5, 5, -28);
  lamp = new Lamp(position, scene);

  const testposition = new Vector3(2, 5, 9);
  testlamp = new Lamp(testposition, scene);
  makeGUILamp(gui, testlamp, 'test lamp');
  console.log(testlamp);
  // testlamp.moveTo(new Vector3(2, 1, 2));

  // const cube = addDebugCube(scene, new Vector3(0, 5, 0));
  //
  // set up things for camera and position it initially
  camWindowCenter.copy(greta.position);
  camOffset = new Vector3(0, 2, 6);

  // set cam to initial position
  camera.position.addVectors(camWindowCenter, camOffset);

  // add some text
  const textBoxes = document.querySelector('#text-boxes');
  const text_box = document.createElement('div');
  text_box.className = 'text-box';
  text_box.textContent = 'you find yourself in a desolate plane of existence. it\'s always twilight here';


  const x = canvas.clientWidth * .5;
  const y = canvas.clientHeight * .5;

  // centers the text on x, y
  // text_box.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
  // text_box.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
  text_box.style.transformOrigin = 'center center';

  console.log(text_box.style.transformOrigin);
  text_box.style.top = '10%';
  text_box.style.left = '50%';
  console.log(text_box.style);

  
  textBoxes.appendChild(text_box);

  requestAnimationFrame(renderFrame);
}

// input
//
function onMouseMove(event) {

}

function addDebugCube(scene, worldCoords) {

  const geometry = new BoxGeometry(2, 2, 2);
  const material = new MeshPhongMaterial( { color: 0xffff00} );
  const cube = new Mesh( geometry, material );

  cube.position.copy(worldCoords);
  scene.add(cube);

  return cube;

}

function onClick(event) {

  const raycaster = new Raycaster();
  const mouse = new Vector2();

  // calculate mouse position in normalized device coordinates
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  raycaster.setFromCamera( mouse, camera );

  const intersects = raycaster.intersectObject(ground);

  if (intersects.length > 0) {
    const walkTarget = intersects[0].point;
    greta.walkTo(intersects[0].point);
  }

}

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onClick, false);
window.addEventListener('resize', onResize, false);


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

