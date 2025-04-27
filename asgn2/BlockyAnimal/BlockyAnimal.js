// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global variables related to UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_globalAngle = 0;
let g_tiltAngle = 30; // Default tilt to see the top of the cubes
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_headAngle = 0;
let g_yellowAnimation = false;
let g_mouseDown = false;
let g_lastMouseX = null;

// Helper function to convert graph coordinates (0 to 20) to WebGL coordinates (-1 to 1)
function graphToWebGL(coord) {
  return (coord / 10) - 1;
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL); // Set depth function to less than or equal
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

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

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function addActionsForHtmlUI() {
  document.getElementById('animationYellowOffButton').onclick = function() { g_yellowAnimation = false; };
  document.getElementById('animationYellowOnButton').onclick = function() { g_yellowAnimation = true; };

  document.getElementById('yellowSlide').addEventListener('mouseup', function() { g_yellowAngle = this.value; renderAllShapes(); });
  document.getElementById('magentaSlide').addEventListener('mouseup', function() { g_magentaAngle = this.value; renderAllShapes(); });
  document.getElementById('headSlide').addEventListener('mouseup', function() { g_headAngle = this.value; renderAllShapes(); });
  document.getElementById('angleSlide').addEventListener('input', function() { g_globalAngle = Number(this.value); renderAllShapes(); });
  document.getElementById('tiltSlide').addEventListener('input', function() { g_tiltAngle = Number(this.value); renderAllShapes(); });
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  canvas.onmousedown = function(ev) {
    g_mouseDown = true;
    g_lastMouseX = ev.clientX;
    click(ev);
  };
  canvas.onmouseup = function() { g_mouseDown = false; g_lastMouseX = null; };
  canvas.onmousemove = function(ev) {
    if (g_mouseDown) {
      if (g_lastMouseX !== null) {
        let deltaX = ev.clientX - g_lastMouseX;
        g_globalAngle += deltaX * 0.2;
        g_globalAngle = Math.max(-180, Math.min(180, g_globalAngle));
        document.getElementById('angleSlide').value = g_globalAngle;
        renderAllShapes();
      }
      g_lastMouseX = ev.clientX;
    }
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  // updateAnimationAngles(); // Commented out for now
  renderAllShapes();
  requestAnimationFrame(tick);
}

/*
function updateAnimationAngles() {
  if (g_yellowAnimation) {
    g_yellowAngle = 45 * Math.sin(g_seconds);
  }
}
*/

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  return [x, y];
}

function renderAllShapes() {
  var startTime = performance.now();

  // Apply a base 180-degree rotation to reorient the deer, then apply the tilt and slider rotation
  var globalRotMat = new Matrix4();
  globalRotMat.setRotate(180, 0, 1, 0); // Base rotation to face forward
  globalRotMat.rotate(g_tiltAngle, 1, 0, 0); // Tilt the camera downward (rotate around x-axis)
  globalRotMat.rotate(g_globalAngle, 0, 1, 0); // Additional rotation from slider (around y-axis)
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Tail: z = 0.75
  var Tail = new Cube();
  Tail.color = [0.686, 0.373, 0.216, 1.0];
  Tail.matrix.translate(0, -0.1, 0.75);
  Tail.matrix.scale(0.2, 0.2, 0.1);
  Tail.render();

  // R_BackLeg: z = 0.65
  var R_BackLeg = new Cube();
  R_BackLeg.color = [0.847, 0.561, 0.239, 1.0];
  R_BackLeg.matrix.translate(-0.15, -0.65, 0.65);
  R_BackLeg.matrix.scale(0.1, 0.3, 0.1);
  R_BackLeg.render();

  // L_BackLeg: z = 0.65
  var L_BackLeg = new Cube();
  L_BackLeg.color = [0.847, 0.561, 0.239, 1.0];
  L_BackLeg.matrix = new Matrix4(lThighMatrix);     // Start from thigh matrix
  L_BackLeg.matrix.translate(0.18, -0.65, 0.65);       // Move downward relative to thigh
  L_BackLeg.matrix.rotate(-g_magentaAngle, 1, 0, 0); // Rotate calf relative to thigh (example: g_magentaAngle)
  L_BackLeg.matrix.scale(0.1, 0.31, 0.1);           // Scale
  L_BackLeg.render();

  // R_Thigh: z = 0.6
  var R_Thigh = new Cube();
  R_Thigh.color = [0.847, 0.561, 0.239, 1.0];
  R_Thigh.matrix.translate(-0.225, -0.405, 0.6);
  R_Thigh.matrix.scale(0.05, 0.31, 0.1);
  R_Thigh.render();

  // L_Thigh: z = 0.6
  var L_Thigh = new Cube();
  L_Thigh.color = [0.847, 0.561, 0.239, 1.0];
  L_Thigh.matrix.translate(0.225, -0.405, 0.6);   // Move thigh to correct position
  L_Thigh.matrix.rotate(-g_yellowAngle, 1, 0, 0);  // Rotate around x-axis by slider (example: using g_yellowAngle for now)
  var lThighMatrix = new Matrix4(L_Thigh.matrix);  // Save a COPY for the child to use
  L_Thigh.matrix.scale(0.05, 0.31, 0.1);            // Scale AFTER saving
  L_Thigh.render();

  // Body: z = 0.3
  var Body = new Cube();
  Body.color = [0.847, 0.561, 0.239, 1.0];
  Body.matrix.translate(0, -0.25, 0.3);
  Body.matrix.scale(0.4, 0.3, 0.8);
  Body.render();

  // R_Shoulder: z = 0.05
  var R_Shoulder = new Cube();
  R_Shoulder.color = [0.847, 0.561, 0.239, 1.0];
  R_Shoulder.matrix.translate(-0.15, -0.425, 0.05);
  R_Shoulder.matrix.scale(0.1, 0.05, 0.1);
  R_Shoulder.render();

  // L_Shoulder: z = 0.05
  var L_Shoulder = new Cube();
  L_Shoulder.color = [0.847, 0.561, 0.239, 1.0];
  L_Shoulder.matrix.translate(0.15, -0.425, 0.05);
  L_Shoulder.matrix.scale(0.1, 0.05, 0.1);
  L_Shoulder.render();

  // Cube23: z = 0.025
  var Cube23 = new Cube();
  Cube23.color = [0.655, 0.310, 0.180, 1.0]; // White
  Cube23.matrix.translate(-0.175, 0.7, 0.025);
  Cube23.matrix.scale(0.05, 0.2, 0.05);
  Cube23.render();

  // Cube18: z = 0.025
  var Cube18 = new Cube();
  Cube18.color = [0.655, 0.310, 0.180, 1.0];
  Cube18.matrix.translate(0.15, 0.7, 0.025);
  Cube18.matrix.scale(0.05, 0.2, 0.05);
  Cube18.render();

  // Cube17: z = -0.025
  var Cube17 = new Cube();
  Cube17.color = [0.655, 0.310, 0.180, 1.0];
  Cube17.matrix.translate(-0.175, 0.55, -0.025);
  Cube17.matrix.scale(0.05, 0.1, 0.25);
  Cube17.render();

  // Cube21: z = -0.025
  var Cube21 = new Cube();
  Cube21.color = [0.655, 0.310, 0.180, 1.0];
  Cube21.matrix.translate(0.175, 0.55, -0.025);
  Cube21.matrix.scale(0.05, 0.1, 0.25);
  Cube21.render();

  // R_FrontLeg: z = -0.05
  var R_FrontLeg = new Cube();
  R_FrontLeg.color = [0.847, 0.561, 0.239, 1.0];
  R_FrontLeg.matrix.translate(-0.15, -0.6, -0.05);
  R_FrontLeg.matrix.scale(0.1, 0.4, 0.1);
  R_FrontLeg.render();

  // L_FrontLeg: z = -0.05
  var L_FrontLeg = new Cube();
  L_FrontLeg.color = [0.847, 0.561, 0.239, 1.0];
  L_FrontLeg.matrix.translate(0.15, -0.6, -0.05);
  L_FrontLeg.matrix.scale(0.1, 0.4, 0.1);
  L_FrontLeg.render();

  // Cube14: z = -0.125
  var Cube14 = new Cube();
  Cube14.color = [0.655, 0.310, 0.180, 1.0];
  Cube14.matrix.translate(-0.075, 0.4, -0.125);
  Cube14.matrix.scale(0.05, 0.2, 0.05);
  Cube14.render();

  // Cube15: z = -0.125
  var Cube15 = new Cube();
  Cube15.color = [0.655, 0.310, 0.180, 1.0];
  Cube15.matrix.translate(-0.125, 0.5, -0.125);
  Cube15.matrix.scale(0.05, 0.2, 0.05);
  Cube15.render();

  // Cube16: z = -0.125
  var Cube16 = new Cube();
  Cube16.color = [0.655, 0.310, 0.180, 1.0];
  Cube16.matrix.translate(-0.175, 0.7, -0.125);
  Cube16.matrix.scale(0.05, 0.2, 0.05);
  Cube16.render();

  // Cube19: z = -0.125
  var Cube19 = new Cube();
  Cube19.color = [0.655, 0.310, 0.180, 1.0];
  Cube19.matrix.translate(0.075, 0.4, -0.125);
  Cube19.matrix.scale(0.05, 0.2, 0.05);
  Cube19.render();

  // Cube20: z = -0.125
  var Cube20 = new Cube();
  Cube20.color = [0.655, 0.310, 0.180, 1.0];
  Cube20.matrix.translate(0.125, 0.5, -0.125);
  Cube20.matrix.scale(0.05, 0.2, 0.05);
  Cube20.render();

  // Cube22: z = -0.125
  var Cube22 = new Cube();
  Cube22.color = [0.655, 0.310, 0.180, 1.0];
  Cube22.matrix.translate(0.175, 0.7, -0.125);
  Cube22.matrix.scale(0.05, 0.2, 0.05);
  Cube22.render();

  // Neck: z = -0.2
  var Neck = new Cube();
  Neck.color = [0.847, 0.561, 0.239, 1.0];
  Neck.matrix.translate(0, -0.05, -0.2);
  Neck.matrix.scale(0.2, 0.3, 0.2);
  Neck.render();

  // Head: z = -0.25
  var Head = new Cube();
  Head.color = [0.847, 0.561, 0.239, 1.0];
  Head.matrix.translate(0, 0.2, -0.25);
  Head.matrix.scale(0.2, 0.2, 0.3);
  Head.render();

  // Nose1: z = -0.45
  var Nose1 = new Cube();
  Nose1.color = [0.847, 0.561, 0.239, 1.0];
  Nose1.matrix.translate(0, 0.15, -0.45);
  Nose1.matrix.scale(0.2, 0.1, 0.1);
  Nose1.render();

  // Nose2: z = -0.515
  var Nose2 = new Cube();
  Nose2.color = [0.4, 0.2, 0.1, 1.0];
  Nose2.matrix.translate(0, 0.15, -0.515);
  Nose2.matrix.scale(0.2, 0.1, 0.03);
  Nose2.render();

  var duration = performance.now() - startTime;
  sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "numdot");
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

var g_shapesList = [];

function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);

  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else if (g_selectedType == CIRCLE) {
    point = new Circle();
  } else {
    return;
  }

  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;

  g_shapesList.push(point);
  renderAllShapes();
}
