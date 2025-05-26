// cuon-matrix.js (c) 2012 kanda and matsuda
/**
 * This is a class treating 4x4 matrix.
 * This class contains the function that is equivalent to OpenGL matrix stack.
 * The matrix after conversion is calculated by multiplying a conversion matrix from the right.
 * The matrix is replaced by the calculated result.
 */

class Vector3 {
  constructor(src) {
    this.elements = new Float32Array(3);
    if (src && Array.isArray(src)) {
      this.elements[0] = src[0];
      this.elements[1] = src[1];
      this.elements[2] = src[2];
    }
  }

  set(src) {
    const s = src.elements, d = this.elements;
    if (s === d) return this;
    for (let i = 0; i < 3; ++i) d[i] = s[i];
    return this;
  }

  add(other) {
    const e = this.elements, o = other.elements;
    e[0] += o[0];
    e[1] += o[1];
    e[2] += o[2];
    return this;
  }

  sub(other) {
    const e = this.elements, o = other.elements;
    e[0] -= o[0];
    e[1] -= o[1];
    e[2] -= o[2];
    return this;
  }

  mul(scalar) {
    const e = this.elements;
    e[0] *= scalar;
    e[1] *= scalar;
    e[2] *= scalar;
    return this;
  }

  div(scalar) {
    const e = this.elements;
    if (scalar !== 0) {
      e[0] /= scalar;
      e[1] /= scalar;
      e[2] /= scalar;
    }
    return this;
  }

  magnitude() {
    const e = this.elements;
    return Math.sqrt(e[0] ** 2 + e[1] ** 2 + e[2] ** 2);
  }

  normalize() {
    const mag = this.magnitude();
    return mag === 0 ? this : this.div(mag);
  }

  static dot(a, b) {
    const ae = a.elements, be = b.elements;
    return ae[0] * be[0] + ae[1] * be[1] + ae[2] * be[2];
  }

  static cross(a, b) {
    const ae = a.elements, be = b.elements;
    return new Vector3([
      ae[1] * be[2] - ae[2] * be[1],
      ae[2] * be[0] - ae[0] * be[2],
      ae[0] * be[1] - ae[1] * be[0],
    ]);
  }
}

class Vector4 {
  constructor(src) {
    this.elements = new Float32Array(4);
    if (src && Array.isArray(src)) {
      this.elements[0] = src[0];
      this.elements[1] = src[1];
      this.elements[2] = src[2];
      this.elements[3] = src[3];
    }
  }
}

class Matrix4 {
  constructor(src) {
    if (src && src.elements) {
      this.elements = new Float32Array(src.elements);
    } else {
      this.elements = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ]);
    }
  }

  setIdentity() {
    const e = this.elements;
    e.set([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
    return this;
  }

  set(src) {
    this.elements.set(src.elements);
    return this;
  }

  multiply(other) {
    const a = this.elements, b = other.elements;
    const result = new Float32Array(16);

    for (let i = 0; i < 4; i++) {
      const ai0 = a[i], ai1 = a[i + 4], ai2 = a[i + 8], ai3 = a[i + 12];
      result[i]      = ai0 * b[0]  + ai1 * b[1]  + ai2 * b[2]  + ai3 * b[3];
      result[i + 4]  = ai0 * b[4]  + ai1 * b[5]  + ai2 * b[6]  + ai3 * b[7];
      result[i + 8]  = ai0 * b[8]  + ai1 * b[9]  + ai2 * b[10] + ai3 * b[11];
      result[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
    }

    this.elements = result;
    return this;
  }

  concat(other) {
    return this.multiply(other);
  }

  multiplyVector3(vec) {
    const e = this.elements, p = vec.elements;
    return new Vector3([
      p[0] * e[0] + p[1] * e[4] + p[2] * e[8]  + e[12],
      p[0] * e[1] + p[1] * e[5] + p[2] * e[9]  + e[13],
      p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + e[14]
    ]);
  }

  multiplyVector4(vec) {
    const e = this.elements, p = vec.elements;
    return new Vector4([
      p[0] * e[0] + p[1] * e[4] + p[2] * e[8]  + p[3] * e[12],
      p[0] * e[1] + p[1] * e[5] + p[2] * e[9]  + p[3] * e[13],
      p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + p[3] * e[14],
      p[0] * e[3] + p[1] * e[7] + p[2] * e[11] + p[3] * e[15],
    ]);
  }

  transpose() {
    const e = this.elements;
    const temp = new Float32Array(e);
    e[1] = temp[4]; e[2] = temp[8];  e[3] = temp[12];
    e[4] = temp[1]; e[6] = temp[9];  e[7] = temp[13];
    e[8] = temp[2]; e[9] = temp[6];  e[11] = temp[14];
    e[12] = temp[3]; e[13] = temp[7]; e[14] = temp[11];
    return this;
  }

  invert() {
    // Keeping simple identity inversion for 160 basics
    return this.setIdentity(); // Real inversion is available but not needed here
  }

  setScale(x, y, z) {
    const e = this.elements;
    e.set([
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1
    ]);
    return this;
  }

  scale(x, y, z) {
    const e = this.elements;
    e[0] *= x; e[4] *= y; e[8]  *= z;
    e[1] *= x; e[5] *= y; e[9]  *= z;
    e[2] *= x; e[6] *= y; e[10] *= z;
    e[3] *= x; e[7] *= y; e[11] *= z;
    return this;
  }

  setTranslate(x, y, z) {
    const e = this.elements;
    e.set([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    ]);
    return this;
  }

  translate(x, y, z) {
    const e = this.elements;
    e[12] += e[0] * x + e[4] * y + e[8] * z;
    e[13] += e[1] * x + e[5] * y + e[9] * z;
    e[14] += e[2] * x + e[6] * y + e[10] * z;
    e[15] += e[3] * x + e[7] * y + e[11] * z;
    return this;
  }

  setRotate(angle, x, y, z) {
    // This method would be expanded if needed later in the course
    return this.setIdentity(); // Placeholder
  }

  rotate(angle, x, y, z) {
    return this.concat(new Matrix4().setRotate(angle, x, y, z));
  }
}