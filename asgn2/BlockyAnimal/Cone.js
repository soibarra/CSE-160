class Cone {
    constructor() {
      this.type = 'cone';
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
      this.segments = 20; // Number of segments for the base
      this.height = 0.5; // Height of the cone
      this.radius = 0.5; // Radius of the base
    }
  
    render() {
      const rgba = this.color;
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      const segments = this.segments;
      const height = this.height;
      const radius = this.radius;
      const apex = [0, 0, height]; // Apex at (0, 0, height)
      const baseVertices = [];
      const baseCenter = [0, 0, 0]; // Center of the base
  
      // Generate vertices for the base circle
      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        const z = 0;
        baseVertices.push([x, y, z]);
      }
  
      // Render the base (triangles from center to edge)
      for (let i = 0; i < segments; i++) {
        const v0 = baseCenter;
        const v1 = baseVertices[i];
        const v2 = baseVertices[(i + 1) % segments];
        const triangleVertices = [
          v0[0], v0[1], v0[2],
          v1[0], v1[1], v1[2],
          v2[0], v2[1], v2[2]
        ];
        drawTriangle3D(gl, triangleVertices);
      }
  
      // Render the sides (triangles from base to apex)
      for (let i = 0; i < segments; i++) {
        const v0 = apex;
        const v1 = baseVertices[i];
        const v2 = baseVertices[(i + 1) % segments];
        const triangleVertices = [
          v0[0], v0[1], v0[2],
          v1[0], v1[1], v1[2],
          v2[0], v2[1], v2[2]
        ];
        drawTriangle3D(gl, triangleVertices);
      }
    }
  }