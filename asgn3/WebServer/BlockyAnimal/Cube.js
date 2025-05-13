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

    // Back of cube (z = -0.5)
    drawTriangle3D(gl, [-0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5]);
    drawTriangle3D(gl, [-0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5]);

    // Pass darker color for back, top, bottom, right, and left faces
    gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);

    // Front of cube (z = 0.5)
    drawTriangle3D(gl, [-0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5]);
    drawTriangle3D(gl, [-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);

    // Top of cube (y = 0.5)
    drawTriangle3D(gl, [-0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
    drawTriangle3D(gl, [-0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5]);

    // Bottom of cube (y = -0.5)
    drawTriangle3D(gl, [-0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5]);
    drawTriangle3D(gl, [-0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5]);

    // Right of cube (x = 0.5)
    drawTriangle3D(gl, [0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5]);
    drawTriangle3D(gl, [0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5]);

    // Left of cube (x = -0.5)
    drawTriangle3D(gl, [-0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5]);
    drawTriangle3D(gl, [-0.5, -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5]);
  }
}
