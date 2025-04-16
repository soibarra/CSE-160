// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`

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
}

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

  //Get the storage Location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

//Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const SMUDGE = 3;

//Globals related UI elements
let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=10;
let g_selectedType=POINT;

// Set actions for the HTMl UI elements
function addActionsForHtmlUI(){

  //Button Events (Shape Type)
  document.getElementById('green').onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
  document.getElementById('red').onclick = function() { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };
  document.getElementById('clearButton').onclick = function() { 
    g_shapesList= []; 
    g_prevX = null; 
    g_prevY = null; 
    renderAllShapes();
  };
  document.getElementById('smudgeButton').onclick = function() {
    g_selectedType = SMUDGE;
    g_prevX = null;
    g_prevY = null;
  };

  document.getElementById('pointButton').onclick = function() { g_selectedType=POINT};
  document.getElementById('triButton').onclick = function() { g_selectedType=TRIANGLE };
  document.getElementById('circleButton').onclick = function() { g_selectedType=CIRCLE };
  document.getElementById('drawPicButton').onclick = drawPicture;
  
  // Slider Events
  document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100; });
  document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100; });
  document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100;});

  // Size Slider Events
  document.getElementById('sizeSlide').addEventListener('mouseup', function() {
    g_selectedSize = parseFloat(this.value);
  });
}

function main() {

  //Set up canvas and gL variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();
  
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev) {
  if (g_selectedType !== SMUDGE) {
    g_prevX = null;
    g_prevY = null;
    click(ev);
  }
};

  //canvas.onmousemove = click;
  canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev) } };

  canvas.onmouseup = function(ev) {
  if (g_selectedType === SMUDGE) {
    g_prevX = null;
    g_prevY = null;
  }
};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

//var g_points = [];  // The array for the position of a mouse press
//var g_colors = [];  // The array to store the color of a point
//var g_sizes = []; // The array to store the size of a point

let g_prevX = null;
let g_prevY = null;

function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);

  // Special handling for SMUDGE: skip first point to avoid connecting strokes
  // SMUDGE brush: only draw if we have a previous point
  if (g_selectedType === SMUDGE) {
    if (g_prevX === null || g_prevY === null) {
      g_prevX = x;
      g_prevY = y;
      return; // first smudge point, don’t draw
    }

    let smudge = new SmudgeBrush();
    smudge.position = [x, y];
    smudge.color = g_selectedColor.slice();
    smudge.size = g_selectedSize;

    g_shapesList.push(smudge);

    renderAllShapes();

    g_prevX = x;
    g_prevY = y;
    return;
  }

  let point;
  if (g_selectedType == POINT) {
    point = new Point();
    } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
    } else if (g_selectedType == CIRCLE) {
    point = new Circle();
  }

  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;

  g_shapesList.push(point);
  renderAllShapes();

  g_prevX = null;
  g_prevY = null;
}
 

  //Store teh coordinates to g_points array
  //g_points.push([x,y]);

  // Store the colors to g_points array
  //g_colors.push(g_selectedColor.slice());

  //Store the size of the g _sizesarray
  //g_sizes.push(g_selectedSize);
  
//  if (x >= 0.0 && y >= 0.0) {      // First quadrant
//    g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
//  } else if (x < 0.0 && y < 0.0) { // Third quadrant
//    g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
//  } else {                         // Others
//    g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
//  }


//Extract teh event click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  
  return([x,y]);
}

//Draw every shape that is supposed to be in the canvas
function renderAllShapes() {

  //check the time at the stat of this function
  var startTime = performance.now();
  
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  //var len = g_points.length;
  var len = g_shapesList.length;
  
  for(var i = 0; i < len; i++) {

    g_shapesList[i].render();
    
  }

  //Check the time at the end of the function, and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");

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

function normalize(x, y) {
  return [(x / 5) - 1, (y / 5) - 1];
}

function drawPicture() {
  // Optional: clear canvas (uncomment to wipe current drawing)
  // gl.clear(gl.COLOR_BUFFER_BIT);

  const colors = [
    [0.9, 1.0, 0.9, 1.0],  // Mint Green 0
    [0.7, 1.0, 0.7, 1.0],  // Light Green 1
    [0.5, 0.9, 0.5, 1.0],  // Pastel Green 2
    [0.3, 0.8, 0.3, 1.0],  // Medium Green 3
    [0.1, 0.6, 0.1, 1.0],  // Grass Green 4
    [0.0, 0.5, 0.0, 1.0],  // Standard Green 5
    [0.0, 0.4, 0.0, 1.0],  // Deep Green 6
    [0.0, 0.3, 0.0, 1.0],  // Forest Green 7
    [0.0, 0.2, 0.0, 1.0],  // Dark Green 8
  ];

  // Normalizes coordinates from 16x15 graph to WebGL (-1 to 1)
  function normalize(x, y) {
    return [
      (x / 8.0) - 1.0,     // 16 wide → scale x from [0,16] to [-1,1]
      (y / 7.5) - 1.0      // 15 high → scale y from [0,15] to [-1,1]
    ];
  }

  // Draw triangle from grid coordinates
  function drawTri(x1, y1, x2, y2, x3, y3, color = [1.0, 1.0, 1.0, 1.0]) {
    let p1 = normalize(x1, y1);
    let p2 = normalize(x2, y2);
    let p3 = normalize(x3, y3);
  
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
    drawTriangle(gl, [...p1, ...p2, ...p3]);
  }

  // Draw each triangle using drawTri(x1, y1, x2, y2, x3, y3)
  drawTri(6,1, 8,1, 8,2.5, colors[6]); //1
  drawTri(5,2, 6,2, 6,3.4, colors[6]); //2
  drawTri(7,2, 7,4, 5,4, colors[4]); //3
  drawTri(7,1.8, 7,5, 10,4, colors[3]); //4
  drawTri(9,3, 10,4, 12,1, colors[2]) //5
  drawTri(11,2, 12,1, 14,3, colors[7]);//6
  drawTri(13,4, 14,3, 15,5, colors[7]); //7
  drawTri(2,3, 4,4, 3.5,5.5, colors[6]); //8
  drawTri(1,5, 3,6, 3.5,5.5, colors[6]); //9
  drawTri(4,4, 3,6, 7,7, colors[4]); //10
  drawTri(4,4, 7,7, 8,6, colors[3]); //11
  drawTri(7,5, 10,4, 9,5, colors[4]); //12
  drawTri(10,4, 10,5, 9,5, colors[7]); //13
  drawTri(3,6, 5,8, 7,7, colors[3]); //14
  drawTri(7,7, 8,6, 8,7, colors[7]); //15
  drawTri(8,6, 11,7, 10,10, colors[7]); //16
  drawTri(11,7, 10,10, 12,9, colors[8]); //17
  drawTri(11,7, 13,7, 12,9, colors[7]); //18
  drawTri(10,10, 12,9, 14,11, colors[7]); //19
  drawTri(5,8, 7,7, 8,10, colors[3]); //20
  drawTri(7,7, 8,8, 7.5,9.5, colors[7]); //21
  drawTri(5,8, 6,10, 8,10, colors[3]); //22
  drawTri(7.5,9.5, 8,10, 9,10, colors[7]); //23
  drawTri(6,10, 8,10, 8,12, colors[3]); //24
  drawTri(8,10, 8,12, 10,12, colors[7]); //25
  drawTri(4,10, 6,10, 4.4,9.5, colors[4]); //26
  drawTri(3,11, 6,10, 4,10, colors[6]); //27
  drawTri(3,11, 5,12, 6,10, colors[2]); //28
  drawTri(6,10, 5,12, 8,12, colors[3]); //29
  drawTri(5,12, 8,12, 7,13, colors[7]); //30
  drawTri(5,12, 7,14, 7,13, colors[7]); //31
  drawTri(8,12, 7,13, 9,14, colors[7]); //32
  drawTri(4,4, 7,4, 7,5.5, colors[3]); //33
  drawTri(6,5, 8,6, 9,5, colors[3]); //34
}
