function main() {
  const canvas = document.getElementById('example');
  const ctx = canvas.getContext('2d');
  clearCanvas(ctx, canvas);

  const v1 = readVector('v1x', 'v1y');
  const v2 = readVector('v2x', 'v2y');

  drawVector(ctx, v1, 'red');
  drawVector(ctx, v2, 'blue');
}

function readVector(xId, yId) {
  const x = parseFloat(document.getElementById(xId).value);
  const y = parseFloat(document.getElementById(yId).value);
  return new Vector3([x, y, 0]);
}

function clearCanvas(ctx, canvas) {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawVector(ctx, vector, color) {
  const scale = 20;
  const originX = 200;
  const originY = 200;

  const endX = originX + vector.elements[0] * scale;
  const endY = originY - vector.elements[1] * scale;

  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  drawArrowHead(ctx, originX, originY, endX, endY, color);
}

function drawArrowHead(ctx, fromX, fromY, toX, toY, color) {
  const headLen = 10;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function handleDrawEvent() {
  const canvas = document.getElementById('example');
  const ctx = canvas.getContext('2d');
  clearCanvas(ctx, canvas);

  const v1 = readVector('v1x', 'v1y');
  const v2 = readVector('v2x', 'v2y');

  drawVector(ctx, v1, 'red');
  drawVector(ctx, v2, 'blue');
}

function handleDrawOperationEvent() {
  const canvas = document.getElementById('example');
  const ctx = canvas.getContext('2d');
  clearCanvas(ctx, canvas);

  const v1 = readVector('v1x', 'v1y');
  const v2 = readVector('v2x', 'v2y');

  drawVector(ctx, v1, 'red');
  drawVector(ctx, v2, 'blue');

  const operation = document.getElementById('operation').value;
  const scalar = parseFloat(document.getElementById('scalar').value);

  switch (operation) {
    case 'add': {
      const result = new Vector3(v1.elements).add(v2);
      drawVector(ctx, result, 'green');
      break;
    }
    case 'sub': {
      const result = new Vector3(v1.elements).sub(v2);
      drawVector(ctx, result, 'green');
      break;
    }
    case 'mul': {
      const scaledV1 = new Vector3(v1.elements).mul(scalar);
      const scaledV2 = new Vector3(v2.elements).mul(scalar);
      drawVector(ctx, scaledV1, 'green');
      drawVector(ctx, scaledV2, 'green');
      break;
    }
    case 'div': {
      const divV1 = new Vector3(v1.elements).div(scalar);
      const divV2 = new Vector3(v2.elements).div(scalar);
      drawVector(ctx, divV1, 'green');
      drawVector(ctx, divV2, 'green');
      break;
    }
    case 'magnitude': {
      console.log('Magnitude of v1:', v1.magnitude().toFixed(2));
      console.log('Magnitude of v2:', v2.magnitude().toFixed(2));
      break;
    }
    case 'normalize': {
      const norm1 = new Vector3(v1.elements).normalize();
      const norm2 = new Vector3(v2.elements).normalize();
      drawVector(ctx, norm1, 'green');
      drawVector(ctx, norm2, 'green');
      break;
    }
    case 'angle': {
      displayAngle(v1, v2);
      break;
    }
    case 'area': {
      displayArea(v1, v2);
      break;
    }
    default:
      console.warn("Unknown operation:", operation);
  }
}

function displayAngle(v1, v2) {
  const dot = Vector3.dot(v1, v2);
  const mag1 = v1.magnitude();
  const mag2 = v2.magnitude();
  if (mag1 === 0 || mag2 === 0) {
    console.log("Angle: undefined (zero vector)");
    return;
  }
  const angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
  console.log("Angle between vectors: " + angle.toFixed(2) + "°");
}

function displayArea(v1, v2) {
  const cross = Vector3.cross(v1, v2);
  const area = 0.5 * cross.magnitude();
  console.log("Area of triangle formed: " + area.toFixed(2));
}