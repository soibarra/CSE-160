// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`
  //uniform float u_Size;
// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

//Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

function setupWebGL (){ //***dont change this for the rest of the quarter***
    // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

//CHECK THIS
function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  // Set an initial value for this matrix
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);


}

//Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Gloabls related UI elements
let g_selectedColor = [1.0,1.0,1.0,1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_globalAngle = 0;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnimation=false;
let g_magentaAnimation=false;

function click(ev) {

  //Extract teh event click and return it in WebGL coordinates
  let [x, y] = convertCoordinatesEventToGL(ev);

  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else if (g_selectedType == CIRCLE) {
    point = new Circle();
  } else if (g_selectedType == CUBE) {
    point = new Cube();
  }

  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;

  g_shapesList.push(point);
  renderAllShapes();
}

// Set actions for the HTMl UI elements
function addActionsForHtmlUI(){

  //Button Events
  document.getElementById('animationYellowOffButton').onclick = function() { g_yellowAnimation=false; };
  document.getElementById('animationYellowOnButton').onclick = function() { g_yellowAnimation=true; };
  
  // Color Slider Events
  document.getElementById('yellowSlide').addEventListener('mouseup', function() {g_yellowAngle[0] = this.value; renderAllShapes(); }); //fix the end of this
  document.getElementById('magentaSlide').addEventListener('mouseup', function() {g_magentaAngle[1] = this.value; renderAllShapes(); }); //fix the end of this

  // Size Slider Events
  document.getElementById('angleSlide').addEventListener('mousemove', function() {g_globalAngle = Number(this.value); renderAllShapes(); });
}

function main() {

  //Set up canvas and gL variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();
  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click; //idk if i should remove this
  canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev) } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);


  // Render
  //gl.clear(gl.COLOR_BUFFER_BIT);
  //renderAllShapes();
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

// Called by browser repeatedly whenever its time
function tick() {
  // Save the current time
  g_seconds = performance.now()/1000.0-g_startTime;
  //console.log(g_seconds);

  //Update Animation Angles
  updateAnimationAngles();

  //Draw everything
  renderAllShapes();

  //Tell teh browser to update again when it has time
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_yellowAnimation) {
    g_yellowAngle = (45*Math.sin(g_seconds));
  }
  if (g_magentaAnimation) {
    g_magentaAngle = (45*Math.sin(3*g_seconds)); // the 3* makes it faster
  }
  //add the rest of my animation angles
}

//Extract teh event click and return it in WebGL coordinates
/*function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  
  return([x,y]);
}
*/

//Draw every shape that is supposed to be in the canvas
function renderAllShapes() {

  //check the time at the stat of this function
  var startTime = performance.now();

  //console.log(g_globalAngle)

  var globalRotMat=new Matrix4().setRotate(g_globalAngle,0,1,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //gl.clear(gl.COLOR_BUFFER_BIT );

  //var len = g_points.length;
  //var len = g_shapesList.length;
  //for(var i = 0; i < len; i++) {
  // g_shapesList[i].render();
  //}

  //Draw test triangle
  //drawTriangle3D(gl, [-1.0,0.0,0.0, -0.5,-1.0,0.0, 0.0,0.0,0.0] );

  /*Draw a cube
  const body = new Cube();
  body.color = [1.0, 0.0, 0.0, 1.0];
  body.matrix.setTranslate(0.0, 0.0, 0);
  body.matrix.scale(1.0, 1.0, 1.0);
  body.render();
  */

  //Draw the body cube
  var body = new Cube();
  body.color = [1.0, 0.0, 0.0, 1.0];
  body.matrix.translate(-.25, -.75, 0.0);
  body.matrix.rotate(-5, 1, 0, 0);
  body.matrix.scale(0.5, .3, .5);
  body.render();

  //Draw a left arm
  var yellow = new Cube();
  yellow.color = [1.0, 1.0, 0.0, 1.0];
  yellow.matrix.setTranslate(0, -.5, 0.0);
  yellow.matrix.rotate(-5, 1, 0, 0);

  yellow.matrix.rotate(-g_yellowAngle, 0,0,1);
  
  //if (g_yellowAnimation) {
  //  yellow.matrix.rotate(45*Math.sin(g_seconds), 0,0,1);
  //} else {
  //  yellow.matrix.rotate(-g_yellowAngle, 0,0,1);
  //}

  var yellowCoordinatesMat=new Matrix4(yellow.matrix);
  yellow.matrix.scale(0.25, .7, .5);
  yellow.matrix.translate(-.5,0,0);
  yellow.render();

  // Test box
  var magenta = new Cube();
  magenta.color = [1,0,1,1];
  magenta.matrix = yellowCoordinatesMat;
  magenta.matrix.translate(0, 0.65, 0);
  magenta.matrix.rotate(g_magentaAngle, 0,0,1);
  magenta.matrix.scale(.3, .3, .3);
  magenta.matrix.translate(-.5,0, -0.001)
  magenta.render();

  //A bunch of rotating cubes
  /*var K=300.0; //if you change this to 200, it shrinks them all down liek little lines; 1000 causes slower fps
  for (var i=1; i<K; i++) {
    var c = new Cube();
    c.matrix.translate(-.8,1.9*i/K-1.0,0);
    c.matrix.rotate(g_seconds*100,1,1,1);
    c.matrix.scale(.1, 0.5/K, 1.0/K);
  c.render();
  }*/

  //Check the time at the end of the function, and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");

}
  
//  for(var i = 0; i < len; i++) {
//    var xy = g_points[i];
//    var rgba = g_colors[i];

//Set the text of a HTML element
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

var g_shapesList = [];


