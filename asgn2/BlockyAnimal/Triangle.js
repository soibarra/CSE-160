class Triangle{

  //Constructor
  constructor(){
    this.type = 'triangle';
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }

  // Render this shape
  render() {
    var xy = this.position;
    var rgba = this.color;
    var size = this.size;
      
    // Pass the position of a point to a_Position variable
    //gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Pass the color of a pont to a u_FragColor variable
    gl.uniform1f(u_Size, size);

    // Draw
    //gl.drawArrays(gl.POINTS, 0, 1);

    var d = this.size/200.0; //delta
    
    drawTriangle(gl, [xy[0], xy[1], xy[0]+d, xy[1], xy[0], xy[1]+d] );
  }
}
  
function drawTriangle(gl, vertices) {
//  var vertices = new Float32Array([
//    0, 0.5,   -0.5, -0.5,   0.5, -0.5
//  ]);
  const n = 3; // The number of vertices

  // Create a buffer object
  
  const vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  //gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  //var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  //if (a_Position < 0) {
 //   console.log('Failed to get the storage location of a_Position');
  //  return -1;
  //}
  
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);

//  return n;
}

function drawTriangle3D(gl, vertices) {
    const n = 3; // The number of vertices
  
    // Create a buffer object
    
    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }
  
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    //gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
  
    gl.drawArrays(gl.TRIANGLES, 0, n);
  
  //  return n;
  }