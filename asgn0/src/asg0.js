function main() {
    var canvas = document.getElementById('example');
    if (!canvas) {
      console.log("Canvas not found.");
      return;
    }
    var ctx = canvas.getContext('2d');
    clearCanvas(ctx, canvas);
  
    // Read initial vector values from the text boxes
    var v1 = new Vector3([
      parseFloat(document.getElementById('v1x').value),
      parseFloat(document.getElementById('v1y').value),
      0
    ]);
    var v2 = new Vector3([
      parseFloat(document.getElementById('v2x').value),
      parseFloat(document.getElementById('v2y').value),
      0
    ]);
  
    // Draw default vectors: v1 (red) and v2 (blue)
    drawVector(ctx, v1, "red");
    drawVector(ctx, v2, "blue");
  }
  
  function clearCanvas(ctx, canvas) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  function drawVector(ctx, v, color) {
    var scale = 20;
    var originX = 200;
    var originY = 200;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    var endX = originX + v.elements[0] * scale;
    var endY = originY - v.elements[1] * scale; // subtract because canvas y-axis is downward
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawArrowHead(ctx, originX, originY, endX, endY, color);
  }
  
  function drawArrowHead(ctx, fromx, fromy, tox, toy, color) {
    var headlen = 10; // length of head in pixels
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6),
               toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6),
               toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(tox, toy);
    ctx.fillStyle = color;
    ctx.fill();
  }
  
  function handleDrawEvent() {
    var canvas = document.getElementById('example');
    var ctx = canvas.getContext('2d');
    clearCanvas(ctx, canvas);
    
    // Read v1 and v2 from inputs
    var v1 = new Vector3([
      parseFloat(document.getElementById('v1x').value),
      parseFloat(document.getElementById('v1y').value),
      0
    ]);
    var v2 = new Vector3([
      parseFloat(document.getElementById('v2x').value),
      parseFloat(document.getElementById('v2y').value),
      0
    ]);
    
    drawVector(ctx, v1, "red");
    drawVector(ctx, v2, "blue");
  }
  
  function handleDrawOperationEvent() {
    var canvas = document.getElementById('example');
    var ctx = canvas.getContext('2d');
    clearCanvas(ctx, canvas);
    
    // Read v1 and v2 from inputs
    var v1 = new Vector3([
      parseFloat(document.getElementById('v1x').value),
      parseFloat(document.getElementById('v1y').value),
      0
    ]);
    var v2 = new Vector3([
      parseFloat(document.getElementById('v2x').value),
      parseFloat(document.getElementById('v2y').value),
      0
    ]);
    
    // Draw original vectors
    drawVector(ctx, v1, "red");
    drawVector(ctx, v2, "blue");
    
    var op = document.getElementById('operation').value;
    var scalar = parseFloat(document.getElementById('scalar').value);
    
    if (op === "add") {
      var v3 = new Vector3(v1.elements);
      v3.add(v2);
      drawVector(ctx, v3, "green");
      console.log("v1 + v2 =", v3.elements);
    } else if (op === "sub") {
      var v3 = new Vector3(v1.elements);
      v3.sub(v2);
      drawVector(ctx, v3, "green");
      console.log("v1 - v2 =", v3.elements);
    } else if (op === "mul") {
      var v3 = new Vector3(v1.elements);
      var v4 = new Vector3(v2.elements);
      v3.mul(scalar);
      v4.mul(scalar);
      drawVector(ctx, v3, "green");
      drawVector(ctx, v4, "green");
      console.log("v1 *", scalar, "=", v3.elements);
      console.log("v2 *", scalar, "=", v4.elements);
    } else if (op === "div") {
      var v3 = new Vector3(v1.elements);
      var v4 = new Vector3(v2.elements);
      v3.div(scalar);
      v4.div(scalar);
      drawVector(ctx, v3, "green");
      drawVector(ctx, v4, "green");
      console.log("v1 /", scalar, "=", v3.elements);
      console.log("v2 /", scalar, "=", v4.elements);
    } else if (op === "magnitude") {
      var mag1 = v1.magnitude();
      var mag2 = v2.magnitude();
      console.log("Magnitude of v1:", mag1);
      console.log("Magnitude of v2:", mag2);
      var n1 = new Vector3(v1.elements);
      var n2 = new Vector3(v2.elements);
      n1.normalize();
      n2.normalize();
      drawVector(ctx, n1, "green");
      drawVector(ctx, n2, "green");
    } else if (op === "angle") {
      var dotProd = Vector3.dot(v1, v2);
      var angle = Math.acos(dotProd / (v1.magnitude() * v2.magnitude()));
      console.log("Angle between v1 and v2 (radians):", angle);
    } else if (op === "area") {
      var crossVec = Vector3.cross(v1, v2);
      var area = 0.5 * crossVec.magnitude();
      console.log("Area of triangle formed by v1 and v2:", area);
    }
  }
  
  document.getElementById('drawButton').addEventListener('click', handleDrawEvent);
  document.getElementById('opButton').addEventListener('click', handleDrawOperationEvent);
  
  window.onload = main;