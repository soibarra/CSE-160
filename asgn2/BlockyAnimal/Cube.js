class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 0.0, 0.0, 1.0];
    this.matrix = new Matrix4();
  }

  render() {
    const rgba = this.color;

    // Pass the color
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Pass the matrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);


    // Front of cube
    drawTriangle3D(gl, [0,0,0, 1,1,0, 1,0,0 ]);
    drawTriangle3D(gl, [0,0,0, 0,1,0, 1,1,0 ]);

    //Pass the color of a point to u_FragColor uniform variable
    gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

    // Back of cube
    drawTriangle3D(gl, [0,0,1, 1,0,1, 1,1,1]);
    drawTriangle3D(gl, [0,0,1, 1,1,1, 0,1,1]);
    // Top of cube
    drawTriangle3D(gl, [0,1,0, 0,1,1, 1,1,1]);
    drawTriangle3D(gl, [0,1,0, 1,1,1, 1,1,0]);

   // Bottom of cube
    drawTriangle3D(gl, [0,0,0, 1,0,1, 0,0,1]);
    drawTriangle3D(gl, [0,0,0, 1,0,0, 1,0,1]);

    // Right of cube
    drawTriangle3D(gl, [1,0,0, 1,1,1, 1,0,1]);
    drawTriangle3D(gl, [1,0,0, 1,1,0, 1,1,1]);

    // Left of cube
    drawTriangle3D(gl, [0,0,0, 0,0,1, 0,1,1]);
    drawTriangle3D(gl, [0,0,0, 0,1,1, 0,1,0]);

  }
}
