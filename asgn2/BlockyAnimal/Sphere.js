class Sphere {
    constructor() {
      this.type = 'sphere';
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
      this.segments = 16; // Number of segments for approximation
    }
  
    render() {
      const rgba = this.color;
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      const vertices = [];
      const step = Math.PI / this.segments;
  
      for (let phi = 0; phi <= Math.PI; phi += step) {
        for (let theta = 0; theta <= 2 * Math.PI; theta += step) {
          // Top vertex
          let x1 = Math.sin(phi) * Math.cos(theta);
          let y1 = Math.cos(phi);
          let z1 = Math.sin(phi) * Math.sin(theta);
          // Bottom vertex
          let x2 = Math.sin(phi + step) * Math.cos(theta);
          let y2 = Math.cos(phi + step);
          let z2 = Math.sin(phi + step) * Math.sin(theta);
          // Next top vertex
          let x3 = Math.sin(phi) * Math.cos(theta + step);
          let y3 = Math.cos(phi);
          let z3 = Math.sin(phi) * Math.sin(theta + step);
          // Next bottom vertex
          let x4 = Math.sin(phi + step) * Math.cos(theta + step);
          let y4 = Math.cos(phi + step);
          let z4 = Math.sin(phi + step) * Math.sin(theta + step);
  
          // First triangle
          vertices.push(x1, y1, z1, x2, y2, z2, x3, y3, z3);
          // Second triangle
          vertices.push(x2, y2, z2, x4, y4, z4, x3, y3, z3);
        }
      }
  
      drawTriangle3D(gl, vertices);
    }
  }