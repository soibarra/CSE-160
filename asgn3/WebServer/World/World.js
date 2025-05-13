// World.js

// Shader sources
const VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  varying vec2 v_UV;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0; // floor texture
  uniform sampler2D u_Sampler1; // sky texture
  uniform sampler2D u_Sampler2; // wall texture
  uniform sampler2D u_Sampler3; // gold pole texture
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if (u_whichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    } else {
      gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
    }
  }
`;

// Original global variables and UI parameters
let canvas;
let gl;
let a_Position;
let a_UV;
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
let g_camera;

// Constants for shape types
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Mouse rotation state
let deleteMode = false;
let lastMouseX = null;
let lastMouseY = null;
let gameWon = false;

// Animal bounding box (approximate, in world space)
const ANIMAL_BBOX = {
  min: new Vector3([-0.8, -0.55, -1]),
  max: new Vector3([0.8, 0.5, 0.9])
};

// Particle system
let particles = [];

class Particle {
  constructor(position, type) {
    this.position = new Vector3(position.elements);
    this.type = type; // 'fire' or 'smoke'
    const speed = type === 'fire' ? 10 + Math.random() * 10 : 4 + Math.random() * 4;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.random() * Math.PI * 0.8;
    this.velocity = new Vector3([
      speed * Math.sin(phi) * Math.cos(theta),
      speed * Math.cos(phi),
      speed * Math.sin(phi) * Math.sin(theta)
    ]);
    if (type === 'fire') {
      const hue = Math.random();
      this.color = [
        hue < 0.33 ? 1.0 : 1.0 - (hue - 0.33) * 3,
        hue < 0.33 ? hue * 3 : 1.0,
        0.0,
        1.0
      ];
    } else {
      const gray = 0.3 + Math.random() * 0.2;
      this.color = [gray, gray, gray, 0.8];
    }
    this.lifetime = type === 'fire' ? 2.0 : 3.0;
    this.scale = type === 'fire' ? 0.5 : 0.6;
  }

  update(deltaTime) {
    this.position.add(this.velocity.mul(deltaTime));
    if (this.type === 'smoke') {
      this.velocity.elements[1] -= 9.8 * deltaTime;
    }
    this.color[3] -= deltaTime / this.lifetime;
    this.lifetime -= deltaTime;
    return this.lifetime > 0;
  }

  render() {
    const cube = new Cube();
    cube.color = this.color;
    cube.textureNum = -2;
    cube.matrix.setIdentity()
      .translate(this.position.elements[0], this.position.elements[1], this.position.elements[2])
      .scale(this.scale, this.scale, this.scale);
    gl.uniform1i(u_whichTexture, -2);
    cube.render();
  }
}

// Simple Minecraft map heights
const MAP_SIZE = 32;
let g_map = [];
for (let i = 0; i < MAP_SIZE; i++) {
  g_map[i] = [];
  for (let j = 0; j < MAP_SIZE; j++) {
    g_map[i][j] = 0;
  }
}

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
  let startI = 1, startJ = 1;
  if (g_map[startI][startJ] > 0) {
    for (let i = 1; i < MAP_SIZE - 1; i++) {
      for (let j = 1; j < MAP_SIZE - 1; j++) {
        if (g_map[i][j] === 0) {
          startI = i;
          startJ = j;
          break;
        }
      }
    }
  }
  g_camera.eye.set([startI - 16, 0.15, startJ - 16]);
  g_camera.at.set([startI - 15, 0.15, startJ - 15]);
  g_camera.updateView();
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() === 'x') deleteMode = false;
  });
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', (e) => {
    canvas.focus();
    onMouseClick(e);
  });
  initTextures(gl);
  canvas.focus();
  requestAnimationFrame(tick);
}

function onMouseMove(e) {
  if (lastMouseX === null || lastMouseY === null) {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    return;
  }
  const dx = e.clientX - lastMouseX;
  const sensitivity = 0.4;
  g_camera.panRight(dx * sensitivity);
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  renderAllShapes();
}

function onMouseClick(e) {
  if (gameWon) return;
  if (e.shiftKey) {
    const ray = getRayFromMouse(e);
    if (rayIntersectsBox(ray.origin, ray.direction, ANIMAL_BBOX.min, ANIMAL_BBOX.max)) {
      gameWon = true;
      gl.clearColor(0.0, 1.0, 0.0, 1.0);
      displayWinMessage();
      // Spawn explosion: 70 fire, 30 smoke
      for (let i = 0; i < 150; i++) {
        particles.push(new Particle(new Vector3([0, 0, 0]), 'fire'));
      }
      for (let i = 0; i < 70; i++) {
        particles.push(new Particle(new Vector3([0, 0, 0]), 'smoke'));
      }
      console.log('Explosion triggered: 120 particles spawned');
      return;
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

function getRayFromMouse(e) {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / canvas.width) * 2 - 1;
  const y = -(((e.clientY - rect.top) / canvas.height) * 2 - 1);
  const clipCoords = new Vector4([x, y, -1, 1]);
  const invProj = new Matrix4().setInverseOf(g_camera.projectionMatrix);
  const invView = new Matrix4().setInverseOf(g_camera.viewMatrix);
  let eyeCoords = invProj.multiplyVector4(clipCoords);
  eyeCoords = new Vector4([
    eyeCoords.elements[0] / eyeCoords.elements[3],
    eyeCoords.elements[1] / eyeCoords.elements[3],
    -1,
    0
  ]);
  const worldCoords = invView.multiplyVector4(eyeCoords);
  const direction = new Vector3([
    worldCoords.elements[0],
    worldCoords.elements[1],
    worldCoords.elements[2]
  ]).normalize();
  return {
    origin: g_camera.eye,
    direction: direction
  };
}

function rayIntersectsBox(origin, direction, boxMin, boxMax) {
  let tMin = -Infinity;
  let tMax = Infinity;
  const pos = origin.elements;
  const dir = direction.elements;
  const min = boxMin.elements;
  const max = boxMax.elements;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(dir[i]) < 0.0001) {
      if (pos[i] < min[i] || pos[i] > max[i]) return false;
    } else {
      const t1 = (min[i] - pos[i]) / dir[i];
      const t2 = (max[i] - pos[i]) / dir[i];
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    }
  }
  return tMin <= tMax && tMax >= 0;
}

function displayWinMessage() {
  const winDiv = document.createElement('div');
  winDiv.id = 'winMessage';
  winDiv.style.position = 'absolute';
  winDiv.style.left = '50%';
  winDiv.style.top = '50%';
  winDiv.style.transform = 'translate(-50%, -50%)';
  winDiv.style.color = 'white';
  winDiv.style.fontSize = '48px';
  winDiv.style.fontFamily = 'Arial, sans-serif';
  winDiv.style.textShadow = '2px 2px 4px black';
  winDiv.style.pointerEvents = 'none';
  winDiv.innerText = 'YOU WIN';
  canvas.parentNode.appendChild(winDiv);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');

  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
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
  g_camera.update();
  particles = particles.filter(particle => particle.update(deltaTime));
  console.log('Particles active:', particles.length);
  renderAllShapes();
  requestAnimationFrame(tick);
}

// Initialize map with outer walls
for (let i = 0; i < 32; i++) {
  g_map[i] = [];
  for (let j = 0; j < 32; j++) {
    if (i === 0 || i === 31 || j === 0 || j === 31) {
      g_map[i][j] = 2;
    } else {
      g_map[i][j] = 0;
    }
  }
}

let minI = 1;
let maxI = 30;
let minJ = 1;
let maxJ = 30;
let layerHeight = 1;
let direction = 0;
let openingsPerLayer = 8;

while (minI < maxI && minJ < maxJ) {
  // Set walls for the current layer
  for (let i = minI; i <= maxI; i++) {
    for (let j = minJ; j <= maxJ; j++) {
      if (
        (direction === 0 && i === minI) ||
        (direction === 1 && j === maxJ) ||
        (direction === 2 && i === maxI) ||
        (direction === 3 && j === minJ)
      ) {
        // Avoid placing a wall at the starting position (i=1, j=1)
        if (i === 1 && j === 1) {
          g_map[i][j] = 0;
        } else {
          g_map[i][j] = layerHeight;
        }
      }
    }
  }
  // Create random openings
  let openings = [];
  for (let k = 0; k < openingsPerLayer; k++) {
    let i, j;
    do {
      if (direction === 0) {
        j = Math.floor(Math.random() * (maxJ - minJ + 1)) + minJ;
        i = minI;
      } else if (direction === 1) {
        i = Math.floor(Math.random() * (maxI - minI + 1)) + minI;
        j = maxJ;
      } else if (direction === 2) {
        j = Math.floor(Math.random() * (maxJ - minJ + 1)) + minJ;
        i = maxI;
      } else if (direction === 3) {
        i = Math.floor(Math.random() * (maxI - minI + 1)) + minI;
        j = minJ;
      }
    } while (i === 1 && j === 1); // Ensure starting position remains clear
    openings.push({ i, j });
    g_map[i][j] = 0;
  }
  // Add corner opening
  if (direction === 0) {
    let cornerJ = maxJ - 1;
    if (!openings.some(op => op.i === minI && op.j === cornerJ) && !(minI === 1 && cornerJ === 1)) {
      g_map[minI][cornerJ] = 0;
    }
  } else if (direction === 1) {
    let cornerI = maxI - 1;
    if (!openings.some(op => op.i === cornerI && op.j === maxJ) && !(cornerI === 1 && maxJ === 1)) {
      g_map[cornerI][maxJ] = 0;
    }
  } else if (direction === 2) {
    let cornerJ = minJ + 1;
    if (!openings.some(op => op.i === maxI && op.j === cornerJ) && !(maxI === 1 && cornerJ === 1)) {
      g_map[maxI][cornerJ] = 0;
    }
  } else if (direction === 3) {
    let cornerI = minI + 1;
    if (!openings.some(op => op.i === cornerI && op.j === minJ) && !(cornerI === 1 && minJ === 1)) {
      g_map[cornerI][minJ] = 0;
    }
  }
  // Update layer boundaries
  if (direction === 0) minI++;
  else if (direction === 1) maxJ--;
  else if (direction === 2) maxI--;
  else if (direction === 3) minJ++;
  direction = (direction + 1) % 4;
}
// Ensure starting position is clear
g_map[1][1] = 0;
console.log('g_map[1][1]:', g_map[1][1]);

function drawMap() {
  const walls = [];
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      const height = g_map[x][z];
      if (height > 0) {
        for (let y = 0; y < height; y++) {
          const wall = new Cube();
          wall.color = [0.8, 1.0, 1.0, 1.0];
          wall.textureNum = 2;
          wall.matrix
            .setIdentity()
            .translate(x - 16, y - 0.75, z - 16)
            .scale(1, 1, 1);
          wall.renderFast();
          walls.push(wall);
        }
      }
    }
  }
}

function renderAllShapes() {
  const startTime = performance.now();
  if (gameWon) {
    gl.clearColor(0.0, 1.0, 0.0, 1.0);
  } else {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  }
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // Enable blending for particle transparency
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);

  const floor = new Cube();
  floor.color = [1.0, 0.0, 0.0, 1.0];
  floor.textureNum = 0;
  floor.matrix.setIdentity().translate(0, -0.75, 0).scale(32, 0.1, 32).translate(-0.5, 0, -0.5);
  gl.uniform1i(u_whichTexture, floor.textureNum);
  floor.render();

  const sky = new Cube();
  sky.color = [0.0, 0.5, 1.0, 1.0];
  sky.textureNum = 1;
  sky.matrix.setIdentity().scale(50, 50, 50).translate(-0.5, -0.5, -0.5);
  gl.uniform1i(u_whichTexture, sky.textureNum);
  sky.render();
  drawMap();

  const Bottom = new Cube();
  Bottom.color = [0.847, 0.561, 0.239, 1.0];
  Bottom.textureNum = 3;
  Bottom.matrix.setIdentity()
    .translate(0, -0.55, 0.3)
    .rotate(-15, 0, 1, 0)
    .translate(-0.8, -0.2, -1)
    .scale(0.8, 0.3, 0.6)
    .translate(0.5, 0.5, 0.5);
  gl.uniform1i(u_whichTexture, Bottom.textureNum);
  Bottom.render();

  const Body = new Cube();
  Body.color = [0.847, 0.561, 0.239, 1.0];
  Body.textureNum = 3;
  Body.matrix.setIdentity()
    .translate(0.35, -0.55, 0.6)
    .rotate(-15, 0, 1, 0)
    .translate(-0.8, -0.2, -1)
    .scale(0.4, 0.8, 0.4)
    .translate(0.5, 0.5, 0.5);
  gl.uniform1i(u_whichTexture, Body.textureNum);
  Body.render();

  const Head = new Cube();
  Head.color = [0.847, 0.561, 0.239, 1.0];
  Head.textureNum = 3;
  Head.matrix.setIdentity()
    .translate(0.15, 0.1, 0.65)
    .rotate(-15, 0, 1, 0)
    .translate(-0.7, 0.1, -1.2)
    .scale(0.5, 0.5, 0.5)
    .translate(0.5, 0.5, 0.5);
  gl.uniform1i(u_whichTexture, Head.textureNum);
  Head.render();

  // Render particles
  console.log('Rendering', particles.length, 'particles');
  particles.forEach(particle => particle.render());
  gl.disable(gl.BLEND); // Disable blending after particles
  const duration = performance.now() - startTime;
  sendTextToHTML(
    `ms: ${Math.floor(duration)} fps: ${Math.floor(10000/duration)/10}`,
    'numdot'
  );
}

function keydown(ev) {
  if (gameWon) return;
  const key = ev.key.toLowerCase();
  const speed = 0.2;
  if (key === 'w') g_camera.moveForward(speed);
  if (key === 's') g_camera.moveBackward(speed);
  if (key === 'a') g_camera.moveLeft(speed);
  if (key === 'd') g_camera.moveRight(speed);
  if (key === 'q') g_camera.panLeft(5);
  if (key === 'e') g_camera.panRight(5);
  if (key === 'x') deleteMode = true;
  if (ev.code === 'ArrowUp') {
    console.log('Up arrow pressed, triggering jump');
    g_camera.jump(2);
  }
}