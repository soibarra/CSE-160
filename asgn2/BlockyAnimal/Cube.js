class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.position = [0.0, 0.0, 0.0];
    this.size = 5.0;
    this.matrix = new Matrix4(); // For transformations if needed later
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    
    // Set color
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Scale size
    var d = this.size / 200.0;

    // Vertices of a cube face centered at this.position
    // You can adjust these later to match your intended "blocky animal" body
    drawTriangle3D([
      xy[0],     xy[1],     0.0,
      xy[0]+d,   xy[1],     0.0,
      xy[0]+d,   xy[1]+d,   0.0,
    ]);
    
    drawTriangle3D([
      xy[0],     xy[1],     0.0,
      xy[0]+d,   xy[1]+d,   0.0,
      xy[0],     xy[1]+d,   0.0,
    ]);

    // TODO: Add top, bottom, left, right, back faces
  }
}