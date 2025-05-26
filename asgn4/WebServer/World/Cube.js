class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 0.0, 0.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum=-1;
    this.cubeVerts32 = new Float32Array([
      0,0,0, 1,1,0, 1,0,0
      ,
      0,0,0, 0,1,0, 1,1,0
      ,
      0,1,0, 0,1,1, 1,1,1
      ,
      0,1,0, 1,1,1, 1,1,0
      ,
      1,1,0, 1,1,1, 1,0,0
      ,
      1,0,0, 1,1,1, 1,0,1
      ,
      0,0,0, 0,1,0, 0,1,1
      ,
      0,0,0, 0,1,1, 0,0,1
      ,
      1,0,1, 0,0,1, 0,1,1
      ,
      1,0,1, 0,1,1, 1,1,1
      ,
      0,0,0, 1,0,0, 1,0,1
      ,
      0,0,0, 1,0,1, 0,0,1
    ]);
    this.cubeVerts = [
      0,0,0, 1,1,0, 1,0,0
      ,
      0,0,0, 0,1,0, 1,1,0
      ,
      0,1,0, 0,1,1, 1,1,1
      ,
      1,1,0, 1,1,1, 1,0,0
      ,
      1,0,0, 1,1,1, 1,0,1
      ,
      0,1,0, 0,1,1, 0,0,0
      ,
      0,1,0, 0,1,1, 0,0,1
      ,
      0,0,0, 0,1,1, 0,0,1
      ,
      0,0,0, 0,0,1, 1,0,1
      ,
      0,0,0, 1,0,1, 1,0,0
      ,
      0,0,1, 1,1,1, 1,0,1
      ,
      0,0,1, 0,1,1, 1,1,1
    ];
  }

  render() {
    const rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);

    // Pass the color for front face
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Pass the matrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Front of cube
    drawTriangle3DUV(gl, [0,0,0, 1,1,0, 1,0,0], [0,0, 1,1, 1,0]);
    drawTriangle3DUV(gl, [0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1]);

    // Pass darker color for back, top, bottom, right, and left faces
    gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);

    // Top of Cube
    drawTriangle3DUV(gl, [0,1,0, 0,1,1, 1,1,1], [0,1, 0,0, 1,0]);
    drawTriangle3DUV(gl, [0,1,0, 1,1,1, 1,1,0], [0,1, 1,0, 1,1]);

    // Right of Cube
    drawTriangle3DUV(gl, [1,1,0, 1,1,1, 1,0,0], [0,1, 0,0, 1,1]);
    drawTriangle3DUV(gl, [1,0,0, 1,1,1, 1,0,1], [1,1, 0,0, 1,0]);

    // Left of Cube
    drawTriangle3DUV(gl, [0,0,0, 0,1,0, 0,1,1], [1,1, 0,1, 0,0]);
    drawTriangle3DUV(gl, [0,0,0, 0,1,1, 0,0,1], [1,1, 0,0, 1,0]);

    // Back of Cube
    drawTriangle3DUV(gl, [1,0,1, 0,0,1, 0,1,1], [0,1, 1,1, 1,0]);
    drawTriangle3DUV(gl, [1,0,1, 0,1,1, 1,1,1], [0,1, 1,0, 0,0]);

    // Bottom of Cube
    drawTriangle3DUV(gl, [0,0,0, 1,0,0, 1,0,1], [0,0, 1,0, 1,1]);
    drawTriangle3DUV(gl, [0,0,0, 1,0,1, 0,0,1], [0,0, 1,1, 0,1]);
  }

  renderfast() {
    const rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);

    // Pass the color for front face
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Pass the matrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    const allverts = [];
    //front of cube
    allverts = allverts.concat( [0,0,0, 1,1,0, 1,0,0 ]);
    allverts = allverts.concat( [0,0,0, 0,1,0, 1,1,0 ]);

    //top of cube
    allverts = allverts.concat( [0,1,0, 0,1,1, 1,1,1 ]);
    allverts = allverts.concat( [0,1,0, 1,1,1, 1,1,0 ]);

    //right of cube
    allverts = allverts.concat( [1,1,0, 0,1,1, 0,0,0 ]);
    allverts = allverts.concat( [0,0,0, 1,0,1, 1,0,0 ]);

    //left of cube
    allverts = allverts.concat( [0,0,1, 1,1,1, 1,0,1 ]);
    allverts = allverts.concat( [0,0,0, 0,1,1, 0,0,1 ]);

    //bottom of cube
    allverts = allverts.concat( [0,0,0, 0,0,1, 1,0,1 ]);
    allverts = allverts.concat( [0,0,0, 0,1,1, 1,0,0 ]);

    //back of cube
    allverts = allverts.concat( [0,0,1, 1,1,1, 1,0,1 ]);
    allverts = allverts.concat( [0,0,1, 0,1,1, 1,1,1 ]);
    drawTriangle3D(allverts);
  }

  renderfaster() {
    const rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);

    // Pass the color for front face
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Pass the matrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.cubeVerts32, gl.STATIC_DRAW);

    this.uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.cubeUVs, gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
}

Cube.prototype.renderFast = function() {
  // pick the right texture & color & model matrix
  gl.uniform1i(u_whichTexture, this.textureNum);
  gl.uniform4fv( u_FragColor, this.color );
  gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

  // bind shared position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, cubePosBuf);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  // bind shared UV buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeUVBuf);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  // draw all 12 triangles (36 vertices) at once
  gl.drawArrays(gl.TRIANGLES, 0, 36);
};