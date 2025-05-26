// World.js

// Shader sources
const VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    //v_Normal = a_Normal;
    v_Normal = normalize( (u_NormalMatrix * vec4(a_Normal, 0.0)).xyz );
    v_VertPos = u_ModelMatrix * a_Position;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0; // floor texture
  uniform sampler2D u_Sampler1; // sky texture
  uniform sampler2D u_Sampler2; // wall texture
  uniform sampler2D u_Sampler3; // gold pole texture
  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  uniform vec3 u_cameraPos;
  uniform vec3 u_lightColor;
  uniform vec3  u_spotDirection;
  varying vec4 v_VertPos;
  uniform bool u_lightOn;
  uniform bool  u_spotOn;
  uniform float u_spotCutoff;

  void main() {
    vec4 baseColor;
    if (u_whichTexture == -4) { gl_FragColor = u_FragColor; return;
    } else if (u_whichTexture == -3) baseColor = vec4((v_Normal + 1.0) * 0.5, 1.0);
    else if (u_whichTexture == -2) baseColor = u_FragColor;
    else if (u_whichTexture == -1) baseColor = vec4(v_UV, 1.0, 1.0);
    else if (u_whichTexture ==  0) baseColor = texture2D(u_Sampler0, v_UV);
    else if (u_whichTexture ==  1) baseColor = texture2D(u_Sampler1, v_UV);
    else if (u_whichTexture ==  2) baseColor = texture2D(u_Sampler2, v_UV);
    else if (u_whichTexture ==  3) baseColor = texture2D(u_Sampler3, v_UV);
    else baseColor = vec4(1.0, 0.2, 0.2, 1.0);

    if (!u_lightOn) {
      gl_FragColor = baseColor;
      return;
    }

    vec3  L = normalize(u_lightPos - v_VertPos.xyz);
    float rawSpotCos   = dot(-L, normalize(u_spotDirection));
    float spotEffect   = step(u_spotCutoff, rawSpotCos);
    if (!u_spotOn) {
      spotEffect = 1.0;
    }
    float spotCos = dot(-L, normalize(u_spotDirection));
    //float spotEffect = step(u_spotCutoff, spotCos);
    vec3  N = normalize(v_Normal);
    float nDotL = max(dot(N, L), 0.0);
    vec3  ambient = baseColor.rgb * 0.3 * u_lightColor * spotEffect;
    vec3  diffuse = baseColor.rgb * nDotL * 0.7 * u_lightColor * spotEffect;

    float specular = 0.0;
    if (u_whichTexture != -2) { // no specular on “sky”
      vec3 R = reflect(-L, N);
      vec3 E = normalize(u_cameraPos - v_VertPos.xyz);
      specular = pow(max(dot(E, R), 0.0), 8.0);
    }
    vec3 result = ambient + diffuse + specular * u_lightColor * spotEffect;
    gl_FragColor = vec4(result, baseColor.a);
  }
  `;

//global variables
let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let u_FragColor;
let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_whichTexture;
let u_lightPos;
let u_cameraPos;
let g_camera;
let g_normalOn = false;
let g_lightPos=[0,1,-2];
let g_mouseDown  = false;
let g_lastMouseX = null;
let g_globalAngle = 0;
let g_tiltAngle = 30;
let g_verticalOffset = 0;
let u_NormalMatrixLoc;
let g_lightOn = true;
let u_lightOn;
let g_animateLight = true;
let g_lightColor = [1.0, 1.0, 1.0];   // R, G, B in [0..1]
let u_lightColor;
let g_spotAngle = 20;
let g_spotOn = true;
let u_spotOn;
let g_animal;

//animal parts
let g_tailAngle = 0;
let g_rightThighAngle = 0;
let g_rightLegAngle = 0;
let g_rightFootAngle = 0;
let g_leftThighAngle = 0;
let g_leftLegAngle = 0;
let g_leftFootAngle = 0;
let g_rightFrontUpperAngle = 0;
let g_rightFrontLowerAngle = 0;
let g_rightFrontFootAngle = 0;
let g_leftFrontUpperAngle = 0;
let g_leftFrontLowerAngle = 0;
let g_leftFrontFootAngle = 0;
let g_neckAngle = 0;
let g_headSideAngle = 0;

// Constants for shape types
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Set blend function
}

function addActionsForHtmlUI() {
  //Button Events
  document.getElementById('lightOn').onclick = function() { g_lightOn = true; };
  document.getElementById('lightOff').onclick = function() { g_lightOn = false; };
  document.getElementById('normalOn').onclick = function() { g_normalOn = true; };
  document.getElementById('normalOff').onclick = function() { g_normalOn = false; };
  document.getElementById('animateOn').onclick  = () => { g_animateLight = true;  };
  document.getElementById('animateOff').onclick = () => { g_animateLight = false; };
  document.getElementById('spotOn').onclick  = () => { g_spotOn = true;  renderAllShapes(); };
  document.getElementById('spotOff').onclick = () => { g_spotOn = false; renderAllShapes(); };

  //Color Sliders
  //document.getElementById('lightSlideX').addEventListener('input', function() {if (ev.buttons == 1) { g_lightPos[0] = this.value/100; renderAllShapes();}});
  document.getElementById('lightSlideX').addEventListener('input', function() { g_lightPos[0] = this.value / 100; renderAllShapes(); });
  //document.getElementById('lightSlideY').addEventListener('input', function() {if (ev.buttons == 1) { g_lightPos[1] = this.value/100; renderAllShapes();}});
  document.getElementById('lightSlideY').addEventListener('input', function() { g_lightPos[1] = this.value / 100; renderAllShapes(); });
  //document.getElementById('lightSlideZ').addEventListener('input', function() {if (ev.buttons == 1) { g_lightPos[2] = this.value/100; renderAllShapes();}});
  document.getElementById('lightSlideZ').addEventListener('input', function() { g_lightPos[2] = this.value / 100; renderAllShapes(); });

  document.getElementById('lightColorR').addEventListener('input', function() { g_lightColor[0] = this.value / 100; renderAllShapes();});
  document.getElementById('lightColorG').addEventListener('input', function() { g_lightColor[1] = this.value / 100; renderAllShapes();});
  document.getElementById('lightColorB').addEventListener('input', function() { g_lightColor[2] = this.value / 100; renderAllShapes();});

  document.getElementById('spotAngle').addEventListener('input', ev => { g_spotAngle = Number(ev.target.value); renderAllShapes(); });

  canvas.onmousedown = function(ev) {g_mouseDown  = true; g_lastMouseX = ev.clientX;};
  canvas.onmouseup = function(ev) {g_mouseDown  = false; g_lastMouseX = null;};
  canvas.onmousemove = function(ev) { if(ev.button == 1) { onMouseClick(ev) } };

  //Size Sliders
  //document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngle = Number(this.value); renderAllShapes(); });

  const yawSlider = document.getElementById('angleSlide');
  yawSlider.addEventListener('input', ev => {
    const newYaw = Number(ev.target.value);
    const delta  = newYaw - g_camera.yaw;
    g_camera.panLeft(delta);
    renderAllShapes();
  });

  const tiltSlider = document.getElementById('tiltSlide');
  tiltSlider.addEventListener('input', () => {
    const newPitch = Number(tiltSlider.value);
    const delta    = newPitch - g_camera.pitch;
    g_camera.pitchUp(delta);
    renderAllShapes();
  });

}

function main() {
  setupWebGL();
  if (!gl) return;
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  connectVariablesToGLSL();
  const cubePositions = new Float32Array([
    0,0,0, 1,1,0, 1,0,0, 0,0,0, 0,1,0, 1,1,0,
    0,1,0, 0,1,1, 1,1,1, 0,1,0, 1,1,1, 1,1,0,
    1,1,0, 1,1,1, 1,0,0, 1,0,0, 1,1,1, 1,0,1,
    0,0,0, 0,1,0, 0,1,1, 0,0,0, 0,1,1, 0,0,1,
    1,0,1, 0,0,1, 0,1,1, 1,0,1, 0,1,1, 1,1,1,
    0,0,0, 1,0,0, 1,0,1, 0,0,0, 1,0,1, 0,0,1
  ]);
  const cubeUVs = new Float32Array([
    0,0, 1,1, 1,0, 0,0, 0,1, 1,1,
    0,1, 0,0, 1,0, 0,1, 1,0, 1,1,
    0,1, 0,0, 1,1, 1,1, 0,0, 1,0,
    1,1, 0,1, 0,0, 1,1, 0,0, 1,0,
    0,1, 1,1, 1,0, 0,1, 1,0, 0,0,
    0,0, 1,0, 1,1, 0,0, 1,1, 0,1
  ]);
  window.cubePosBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubePosBuf);
  gl.bufferData(gl.ARRAY_BUFFER, cubePositions, gl.STATIC_DRAW);
  window.cubeUVBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeUVBuf);
  gl.bufferData(gl.ARRAY_BUFFER, cubeUVs, gl.STATIC_DRAW);
  g_camera = new Camera(canvas.width / canvas.height);
  //let startI = 1, startJ = 1;

  //g_camera.eye.set([startI - 16, 0.15, startJ - 16]);
  //g_camera.at.set([startI - 15, 0.15, startJ - 15]);
  //g_camera.updateView();
  window.addEventListener('keydown', keydown);

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
  
  g_animal = new Animal();

  initTextures(gl);
  canvas.focus();
  requestAnimationFrame(tick);
}

function onMouseClick(e) {
  if (gameWon) return;
  if (e.shiftKey) {
    const ray = getRayFromMouse(e);
    if (rayIntersectsBox(ray.origin, ray.direction, ANIMAL_BBOX.min, ANIMAL_BBOX.max)) {
      gameWon = true;
      gl.clearColor(0.0, 1.0, 0.0, 1.0);
      displayWinMessage();
    }
  }

  const [gx, gz] = g_camera.getGridCoordsInFront();
  if (gx < 0 || gx >= MAP_SIZE || gz < 0 || gz >= MAP_SIZE) return;
  if (deleteMode) {
    g_map[gx][gz] = Math.max(0, g_map[gx][gz] - 1);
  } else {
    g_map[gx][gz]++;
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');

  u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');

  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');

  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');

  u_NormalMatrixLoc = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

  u_spotDirection = gl.getUniformLocation(gl.program, 'u_spotDirection');
  
  u_spotCutoff    = gl.getUniformLocation(gl.program, 'u_spotCutoff');

  u_spotOn = gl.getUniformLocation(gl.program, 'u_spotOn');
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

function initTextures(gl, n) {
  var image0 = new Image();
  if (!image0) {
    console.log('Failed to create the image0 object');
    return false;
  }
  image0.onload = function() { sendImageTEXTURE0(gl, image0); };
  image0.src = 'floor.jpg';
  var image1 = new Image();
  if (!image1) {
    console.log('Failed to create the image1 object');
    return false;
  }
  image1.onload = function() { sendImageTEXTURE1(gl, image1); };
  image1.src = 'sky.jpg';
  var image2 = new Image();
  if (!image2) {
    console.log('Failed to create the image1 object');
    return false;
  }
  image2.onload = function() { sendImageTEXTURE2(gl, image2); };
  image2.src = 'wall.jpg';
  var image3 = new Image();
  if (!image3) {
    console.log('Failed to create the image1 object');
    return false;
  }
  image3.onload = function() { sendImageTEXTURE3(gl, image3); };
  image3.src = 'pole.jpg';
  return true;
}

function sendImageTEXTURE0(gl, image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object.');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler0, 0);
  console.log('Finished sendImageTEXTURE0');
}

function sendImageTEXTURE1(gl, image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object for TEXTURE1.');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler1, 1);
  console.log('Finished sendImageTEXTURE1');
}

function sendImageTEXTURE2(gl, image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object for TEXTURE1.');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler2, 2);
  console.log('Finished sendImageTEXTURE2');
}

function sendImageTEXTURE3(gl, image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object for TEXTURE3.');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler3, 3);
  console.log('Finished sendImageTEXTURE3');
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
  const currentTime = performance.now() / 1000.0;
  const deltaTime = currentTime - g_seconds;
  g_seconds = currentTime;

  updateAnimationAngles();

  g_camera.update();
  renderAllShapes();
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_animateLight) {
    g_lightPos[0] = 2.3 * Math.cos(g_seconds);
  }
}

function renderAllShapes() {
  const startTime = performance.now();

  var globalRotMat = new Matrix4();
  globalRotMat.setRotate(180, 0, 1, 0);
  globalRotMat.rotate(g_tiltAngle, 1, 0, 0);
  globalRotMat.rotate(g_globalAngle, 0, 1, 0);
  globalRotMat.translate(0, g_verticalOffset, 0); // Apply vertical offset for jump
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);

  globalRotMat.setRotate(180, 0, 1, 0);
  //globalRotMat.rotate(g_tiltAngle, 1, 0, 0);
  //globalRotMat.rotate(g_globalAngle, 0, 1, 0);
  //globalRotMat.translate(0, g_verticalOffset, 0); // Apply vertical offset for jump
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  //Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  //pass the light pos to glsl
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);

  gl.uniform3f(u_lightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);

  // pass teh camera pos to glsl
  gl.uniform3f(u_cameraPos, g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2]);

  gl.uniform1i(u_lightOn, g_lightOn);

  gl.uniform1i(u_spotOn, g_spotOn);

  // spotlight points inward along -y
  const spotDir = [0, -1, 0];
  gl.uniform3fv(u_spotDirection, spotDir);
  // convert degrees to cosine cutoff
  gl.uniform1f(u_spotCutoff, Math.cos(g_spotAngle * Math.PI/180));

  //Draw the light
  const light = new Cube();
  light.color = [2,2,0,1];
  light.textureNum = -4;
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-.1,-.1,-.1);
  light.matrix.translate(-.5,-.5,-.5);
  //gl.uniformMatrix4fv(u_ModelMatrix, false, light.matrix.elements);
  //gl.uniform1i(u_whichTexture, -2);
  light.render();

  //Draw sphere
  const sp = new Sphere();
  if (g_normalOn) sp.textureNum = -3;
  sp.matrix.translate(-1,-1.3,-1.5);
  sp.render();

  //floor
  const floor = new Cube();
  floor.color = [1.0, 0.0, 0.0, 1.0];
  floor.textureNum = 0;
  floor.matrix.setIdentity()
    .translate(0, -2.49, 0)
    .scale(10, 0, 10)
    .translate(-0.5, 0, -0.5);
  gl.uniformMatrix4fv(u_ModelMatrix, false, floor.matrix.elements);
  const normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(floor.matrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrixLoc, false, normalMatrix.elements);
  gl.uniform1i(u_whichTexture, floor.textureNum);
  floor.render();

  //sky
  const sky = new Cube();
  sky.color = [0.65, 0.75, 0.85, 1.0];
  sky.textureNum = -2;
  if (g_normalOn) sky.textureNum = -3;
  sky.matrix.setIdentity()
    .scale(-5, -5, -5)
    .translate(-0.5, -0.5, -0.5);
  gl.uniform1i(u_whichTexture, sky.textureNum);
  sky.render();

  /*/ deer
  g_animal.modelMatrix.setIdentity()
    .translate(2, -2, 2)
    .rotate(g_globalAngle, 0,1,0);
  g_animal.render();
  */

  // legs
  const legs = new Cube();
  legs.color = [0.847, 0.561, 0.239, 1.0];
  legs.textureNum = -3;
  if (g_normalOn) legs.textureNum = -3;
  legs.matrix.setIdentity()
    .translate(1, -2, 0.3)
    .rotate(-15, 0, 1, 0)
    .translate(-0.8, -0.2, -1)
    .scale(0.8, 0.3, 0.6)
    .translate(0.5, 0.5, 0.5);
  gl.uniformMatrix4fv(u_ModelMatrix, false, legs.matrix.elements);
  normalMatrix.setInverseOf(legs.matrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrixLoc, false, normalMatrix.elements)
  gl.uniform1i(u_whichTexture, legs.textureNum);
  legs.render();


  //body
  const Body = new Cube();
  Body.color = [0.847, 0.561, 0.239, 1.0];
  Body.textureNum = -3;
  if (g_normalOn) Body.textureNum = -3;
  Body.matrix.setIdentity()
    .translate(1.35, -2, 0.6)
    .rotate(-15, 0, 1, 0)
    .translate(-0.8, -0.2, -1)
    .scale(0.4, 0.8, 0.4)
    .translate(0.5, 0.5, 0.5);
  gl.uniformMatrix4fv(u_ModelMatrix, false, Body.matrix.elements);
  normalMatrix.setInverseOf(Body.matrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrixLoc, false, normalMatrix.elements)
  gl.uniform1i(u_whichTexture, Body.textureNum);
  Body.render();

  //head
  const Head = new Cube();
  Head.color = [0.847, 0.561, 0.239, 1.0];
  Head.textureNum = -3;
  if (g_normalOn) Head.textureNum = -3;
  Head.matrix.setIdentity()
    .translate(1.15, -1.4, 0.65)
    .rotate(-15, 0, 1, 0)
    .translate(-0.7, 0.1, -1.2)
    .scale(0.5, 0.5, 0.5)
    .translate(0.5, 0.5, 0.5);
  gl.uniformMatrix4fv(u_ModelMatrix, false, Head.matrix.elements);
  normalMatrix.setInverseOf(Head.matrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrixLoc, false, normalMatrix.elements)
  gl.uniform1i(u_whichTexture, Head.textureNum);
  Head.render();

  const duration = performance.now() - startTime;
  sendTextToHTML(
    `ms: ${Math.floor(duration)} fps: ${Math.floor(1000/duration)}`,
    'numdot'
  );
}

function keydown(ev) {
  const key = ev.key.toLowerCase();
  const speed = 0.2;
  if (key === 'w') g_camera.moveForward(speed);
  if (key === 's') g_camera.moveBackward(speed);
  if (key === 'a') g_camera.moveLeft(speed);
  if (key === 'd') g_camera.moveRight(speed);
  if (key === 'q') g_camera.panLeft(5);
  if (key === 'e') g_camera.panRight(5);
  if (ev.code === 'ArrowUp') {
    console.log('Up arrow pressed, triggering jump');
    g_camera.jump(2);
  }
}
