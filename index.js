
function hello() {
  console.log('hellow rold');
}
hello();

const canvas = document.querySelector('canvas');

const gl = canvas.getContext('webgl');
if (!gl) {
  console.log('this browser does not support webgl!');
}

