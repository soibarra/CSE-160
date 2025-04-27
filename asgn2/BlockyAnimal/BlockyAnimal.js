var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_globalAngle = 0;
let g_tiltAngle = 30;
let g_neckAngle = 0;
let g_headSideAngle = 0;
let g_leftThighAngle = 0;
let g_leftLegAngle = 0;
let g_leftFootAngle = 0;
let g_rightThighAngle = 0;
let g_rightLegAngle = 0;
let g_rightFootAngle = 0;
let g_tailAngle = 0;
let g_neckAnimation = false;
let g_headAnimation = false;
let g_leftLegAnimation = false;
let g_rightLegAnimation = false;
let g_tailAnimation = false;
let g_noseAnimation = false;
let g_noseAnimationTime = 0;
let g_mouseDown = false;
let g_lastMouseX = null;

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
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
  document.getElementById('animationNeckOnButton').onclick = function() { g_neckAnimation = true; };
  document.getElementById('animationNeckOffButton').onclick = function() { g_neckAnimation = false; };
  document.getElementById('animationHeadOnButton').onclick = function() { g_headAnimation = true; };
  document.getElementById('animationHeadOffButton').onclick = function() { g_headAnimation = false; };
  document.getElementById('animationLeftLegOnButton').onclick = function() { g_leftLegAnimation = true; };
  document.getElementById('animationLeftLegOffButton').onclick = function() { g_leftLegAnimation = false; };
  document.getElementById('animationRightLegOnButton').onclick = function() { g_rightLegAnimation = true; };
  document.getElementById('animationRightLegOffButton').onclick = function() { g_rightLegAnimation = false; };
  document.getElementById('animationTailOnButton').onclick = function() { g_tailAnimation = true; };
  document.getElementById('animationTailOffButton').onclick = function() { g_tailAnimation = false; };

  document.getElementById('neckSlide').addEventListener('input', function() { g_neckAngle = this.value; renderAllShapes(); });
  document.getElementById('headSlide').addEventListener('input', function() { g_headSideAngle = this.value; renderAllShapes(); });
  document.getElementById('leftThighSlide').addEventListener('input', function() { g_leftThighAngle = this.value; renderAllShapes(); });
  document.getElementById('leftLegSlide').addEventListener('input', function() { g_leftLegAngle = this.value; renderAllShapes(); });
  document.getElementById('leftFootSlide').addEventListener('input', function() { g_leftFootAngle = this.value; renderAllShapes(); });
  document.getElementById('rightThighSlide').addEventListener('input', function() { g_rightThighAngle = this.value; renderAllShapes(); });
  document.getElementById('rightLegSlide').addEventListener('input', function() { g_rightLegAngle = this.value; renderAllShapes(); });
  document.getElementById('rightFootSlide').addEventListener('input', function() { g_rightFootAngle = this.value; renderAllShapes(); });
  document.getElementById('tailSlide').addEventListener('input', function() { g_tailAngle = this.value; renderAllShapes(); });
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
  updateAnimationAngles();
  renderAllShapes();
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_neckAnimation) {
    g_neckAngle = 45 * Math.sin(g_seconds);
  }
  if (g_headAnimation) {
    g_headSideAngle = 45 * Math.sin(g_seconds);
  }
  if (g_leftLegAnimation) {
    g_leftThighAngle = 45 * Math.sin(g_seconds);
    g_leftLegAngle = 45 * Math.sin(g_seconds + Math.PI / 2);
    g_leftFootAngle = 30 * Math.sin(g_seconds + Math.PI);
  }
  if (g_rightLegAnimation) {
    g_rightThighAngle = 45 * Math.sin(g_seconds + Math.PI / 2);
    g_rightLegAngle = 45 * Math.sin(g_seconds + 3 * Math.PI / 2);
    g_rightFootAngle = 30 * Math.sin(g_seconds + Math.PI);
  }
  if (g_tailAnimation) {
    g_tailAngle = 45 * Math.sin(g_seconds);
  }
  if (g_noseAnimation) {
    g_noseAnimationTime += 0.1;
    let noseAngle = 45 * Math.sin(g_noseAnimationTime * 2);
    if (g_noseAnimationTime > 2 * Math.PI) {
      g_noseAnimation = false;
      g_noseAnimationTime = 0;
    }
    // Store nose angle for rendering
    g_noseAngle = noseAngle;
  }
}

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

  var globalRotMat = new Matrix4();
  globalRotMat.setRotate(180, 0, 1, 0);
  globalRotMat.rotate(g_tiltAngle, 1, 0, 0);
  globalRotMat.rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Body: z = 0.3
  var Body = new Cube();
  Body.color = [0.847, 0.561, 0.239, 1.0];
  Body.matrix.translate(0, -0.25, 0.3);
  Body.matrix.scale(0.4, 0.3, 0.8);
  Body.render();

  // Tail: z = 0.75
  var Tail = new Sphere();
  Tail.color = [0.686, 0.373, 0.216, 1.0];
  Tail.matrix.translate(0, -0.1, 0.);
  Tail.matrix.rotate(g_tailAngle, 0, 1, 0); // Wag around y-axis
  Tail.matrix.scale(0.2, 0.3, 0.1); // Oval shape
  Tail.render();

  // Right Thigh: z = 0.6
  var R_Thigh = new Cube();
  R_Thigh.color = [0.847, 0.561, 0.239, 1.0];
  R_Thigh.matrix.translate(-0.225, -0.4, 0.6); // Top at y = -0.095
  R_Thigh.matrix.translate(0, 0.155, 0); // Pivot to top (y = -0.095)
  R_Thigh.matrix.rotate(g_rightThighAngle, 1, 0, 0);
  R_Thigh.matrix.translate(0, -0.155, 0);
  var rThighMatrix = new Matrix4(R_Thigh.matrix);
  R_Thigh.matrix.scale(0.05, 0.31, 0.1);
  R_Thigh.render();

  // Right Back Leg: z = 0.65
  var R_BackLeg = new Cube();
  R_BackLeg.color = [0.847, 0.561, 0.239, 1.0];
  R_BackLeg.matrix = new Matrix4(rThighMatrix);
  R_BackLeg.matrix.translate(0.03, -0.25, 0.05); // Top at y = -0.505
  R_BackLeg.matrix.translate(0, 0.205, 0); // Pivot to top
  R_BackLeg.matrix.rotate(g_rightLegAngle, 1, 0, 0);
  R_BackLeg.matrix.translate(0, -0.205, 0);
  var rLegMatrix = new Matrix4(R_BackLeg.matrix);
  R_BackLeg.matrix.scale(0.1, 0.3, 0.1);
  R_BackLeg.render();

  // Right Foot: z = 0.65
  var R_Foot = new Cube();
  R_Foot.color = [0.4, 0.2, 0.1, 1.0];
  R_Foot.matrix = new Matrix4(rLegMatrix);
  R_Foot.matrix.translate(0, -0.22, 0);
  R_Foot.matrix.translate(0, 0.15, 0);
  R_Foot.matrix.rotate(g_rightFootAngle, 1, 0, 0);
  R_Foot.matrix.translate(0, -0.15, 0);
  R_Foot.matrix.scale(0.1, 0.15, 0.1);
  R_Foot.render();

  // Left Thigh: z = 0.6
  var L_Thigh = new Cube();
  L_Thigh.color = [0.847, 0.561, 0.239, 1.0];
  L_Thigh.matrix.translate(0.225, -0.4, 0.6);
  L_Thigh.matrix.translate(0, 0.155, 0);
  L_Thigh.matrix.rotate(g_leftThighAngle, 1, 0, 0);
  L_Thigh.matrix.translate(0, -0.155, 0);
  var lThighMatrix = new Matrix4(L_Thigh.matrix);
  L_Thigh.matrix.scale(0.05, 0.31, 0.1);
  L_Thigh.render();

  // Left Back Leg: z = 0.65
  var L_BackLeg = new Cube();
  L_BackLeg.color = [0.847, 0.561, 0.239, 1.0];
  L_BackLeg.matrix = new Matrix4(lThighMatrix);
  L_BackLeg.matrix.translate(-0.03, -0.25, 0.01);
  L_BackLeg.matrix.translate(0, 0.205, 0);
  L_BackLeg.matrix.rotate(g_leftLegAngle, 1, 0, 0);
  L_BackLeg.matrix.translate(0, -0.205, 0);
  var lLegMatrix = new Matrix4(L_BackLeg.matrix);
  L_BackLeg.matrix.scale(0.1, 0.3, 0.1);
  L_BackLeg.render();

  // Left Foot: z = 0.65
  var L_Foot = new Cube();
  L_Foot.color = [0.4, 0.2, 0.1, 1.0];
  L_Foot.matrix = new Matrix4(lLegMatrix);
  L_Foot.matrix.translate(0, -0.22, 0);
  L_Foot.matrix.translate(0, 0.15, 0);
  L_Foot.matrix.rotate(g_leftFootAngle, 1, 0, 0);
  L_Foot.matrix.translate(0, -0.15, 0);
  L_Foot.matrix.scale(0.1, 0.15, 0.1);
  L_Foot.render();

  // Right Shoulder: z = 0.05
  var R_Shoulder = new Cube();
  R_Shoulder.color = [0.847, 0.561, 0.239, 1.0];
  R_Shoulder.matrix.translate(-0.15, -0.425, 0.05);
  R_Shoulder.matrix.scale(0.1, 0.05, 0.1);
  R_Shoulder.render();

  // Left Shoulder: z = 0.05
  var L_Shoulder = new Cube();
  L_Shoulder.color = [0.847, 0.561, 0.239, 1.0];
  L_Shoulder.matrix.translate(0.15, -0.425, 0.05);
  L_Shoulder.matrix.scale(0.1, 0.05, 0.1);
  L_Shoulder.render();

  // Right Front Leg: z = -0.05
  var R_FrontLeg = new Cube();
  R_FrontLeg.color = [0.847, 0.561, 0.239, 1.0];
  R_FrontLeg.matrix.translate(-0.15, -0.6, -0.05);
  R_FrontLeg.matrix.scale(0.1, 0.4, 0.1);
  R_FrontLeg.render();

  // Left Front Leg: z = -0.05
  var L_FrontLeg = new Cube();
  L_FrontLeg.color = [0.847, 0.561, 0.239, 1.0];
  L_FrontLeg.matrix.translate(0.15, -0.6, -0.05);
  L_FrontLeg.matrix.scale(0.1, 0.4, 0.1);
  L_FrontLeg.render();

  // Neck: z = -0.2
  var Neck = new Cube();
  Neck.color = [0.847, 0.561, 0.239, 1.0];
  Neck.matrix.translate(0, -0.05, -0.2);
  Neck.matrix.translate(0, -0.15, 0); // Pivot to bottom (y = -0.2)
  Neck.matrix.rotate(g_neckAngle, 1, 0, 0);
  Neck.matrix.translate(0, 0.15, 0);
  var neckMatrix = new Matrix4(Neck.matrix);
  Neck.matrix.scale(0.2, 0.3, 0.2);
  Neck.render();

  // Head: z = -0.25
  var Head = new Cube();
  Head.color = [0.847, 0.561, 0.239, 1.0];
  Head.matrix = new Matrix4(neckMatrix);
  Head.matrix.translate(0, 0.25, -0.05);
  Head.matrix.translate(0, -0.1, 0); // Pivot to bottom (y = 0.1)
  Head.matrix.rotate(g_headSideAngle, 0, 1, 0); // Side-to-side
  Head.matrix.translate(0, 0.1, 0);
  var headMatrix = new Matrix4(Head.matrix);
  Head.matrix.scale(0.2, 0.2, 0.3);
  Head.render();

  // Nose1: z = -0.45
  var Nose1 = new Cube();
  Nose1.color = [0.847, 0.561, 0.239, 1.0];
  Nose1.matrix = new Matrix4(headMatrix);
  Nose1.matrix.translate(0, -0.05, -0.2);
  if (g_noseAnimation) {
    Nose1.matrix.rotate(g_noseAngle, 0, 1, 0);
  }
  Nose1.matrix.scale(0.2, 0.1, 0.1);
  Nose1.render();

  // Nose2: z = -0.515
  var Nose2 = new Cube();
  Nose2.color = [0.4, 0.2, 0.1, 1.0];
  Nose2.matrix = new Matrix4(headMatrix);
  Nose2.matrix.translate(0, -0.05, -0.265);
  if (g_noseAnimation) {
    Nose2.matrix.rotate(g_noseAngle, 0, 1, 0);
  }
  Nose2.matrix.scale(0.2, 0.1, 0.03);
  Nose2.render();

  // Antlers (relative to head)
  var antlerMatrix = new Matrix4(headMatrix);

  // Cube14: z = -0.125
  var Cube14 = new Cube();
  Cube14.color = [0.655, 0.310, 0.180, 1.0];
  Cube14.matrix = new Matrix4(antlerMatrix);
  Cube14.matrix.translate(-0.075, 0.2, 0.125);
  Cube14.matrix.scale(0.05, 0.2, 0.05);
  Cube14.render();

  // Cube15: z = -0.125
  var Cube15 = new Cube();
  Cube15.color = [0.655, 0.310, 0.180, 1.0];
  Cube15.matrix = new Matrix4(antlerMatrix);
  Cube15.matrix.translate(-0.125, 0.3, 0.125);
  Cube15.matrix.scale(0.05, 0.2, 0.05);
  Cube15.render();

  // Cube16: z = -0.125
  var Cube16 = new Cube();
  Cube16.color = [0.655, 0.310, 0.180, 1.0];
  Cube16.matrix = new Matrix4(antlerMatrix);
  Cube16.matrix.translate(-0.175, 0.5, 0.125);
  Cube16.matrix.scale(0.05, 0.2, 0.05);
  Cube16.render();

  // Cube17: z = -0.025
  var Cube17 = new Cube();
  Cube17.color = [0.655, 0.310, 0.180, 1.0];
  Cube17.matrix = new Matrix4(antlerMatrix);
  Cube17.matrix.translate(-0.175, 0.35, 0.225);
  Cube17.matrix.scale(0.05, 0.1, 0.25);
  Cube17.render();

  // Cube18: z = 0.025
  var Cube18 = new Cube();
  Cube18.color = [0.655, 0.310, 0.180, 1.0];
  Cube18.matrix = new Matrix4(antlerMatrix);
  Cube18.matrix.translate(0.15, 0.5, 0.275);
  Cube18.matrix.scale(0.05, 0.2, 0.05);
  Cube18.render();

  // Cube19: z = -0.125
  var Cube19 = new Cube();
  Cube19.color = [0.655, 0.310, 0.180, 1.0];
  Cube19.matrix = new Matrix4(antlerMatrix);
  Cube19.matrix.translate(0.075, 0.2, 0.125);
  Cube19.matrix.scale(0.05, 0.2, 0.05);
  Cube19.render();

  // Cube20: z = -0.125
  var Cube20 = new Cube();
  Cube20.color = [0.655, 0.310, 0.180, 1.0];
  Cube20.matrix = new Matrix4(antlerMatrix);
  Cube20.matrix.translate(0.125, 0.3, 0.125);
  Cube20.matrix.scale(0.05, 0.2, 0.05);
  Cube20.render();

  // Cube21: z = -0.025
  var Cube21 = new Cube();
  Cube21.color = [0.655, 0.310, 0.180, 1.0];
  Cube21.matrix = new Matrix4(antlerMatrix);
  Cube21.matrix.translate(0.175, 0.35, 0.225);
  Cube21.matrix.scale(0.05, 0.1, 0.25);
  Cube21.render();

  // Cube22: z = -0.125
  var Cube22 = new Cube();
  Cube22.color = [0.655, 0.310, 0.180, 1.0];
  Cube22.matrix = new Matrix4(antlerMatrix);
  Cube22.matrix.translate(0.175, 0.5, 0.125);
  Cube22.matrix.scale(0.05, 0.2, 0.05);
  Cube22.render();

  // Cube23: z = 0.025
  var Cube23 = new Cube();
  Cube23.color = [0.655, 0.310, 0.180, 1.0];
  Cube23.matrix = new Matrix4(antlerMatrix);
  Cube23.matrix.translate(-0.175, 0.5, 0.275);
  Cube23.matrix.scale(0.05, 0.2, 0.05);
  Cube23.render();

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
  if (ev.shiftKey) {
    // Check if click is near nose (z = -0.45 to -0.515)
    if (Math.abs(x) < 0.2 && y > -0.1 && y < 0.3) {
      g_noseAnimation = true;
      g_noseAnimationTime = 0;
    }
  } else {
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
  }
  renderAllShapes();
}