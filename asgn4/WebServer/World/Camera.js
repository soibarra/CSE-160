class Camera {
  constructor() {
    this.fov = 60;
    this.eye = new Vector3([-15, 0.15, -15]); // Near outer wall at grid (1, 1)
    this.at = new Vector3([-14, 0.15, -14]); // Look inward
    this.up = new Vector3([0, 1, 0]);
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 1000);
    this.yaw = 0;
    this.isJumping = false;
    this.groundLevel = 0.15;
    this.jumpTime = 0;
    this.updateView();
  }

  updateView() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2]
    );
  }

  moveForward(speed) {
    const f = new Vector3(this.at.elements).sub(this.eye).normalize().mul(speed);
    this.eye.add(f);
    this.at.add(f);
    this.updateView();
  }

  moveBackward(speed) {
    const b = new Vector3(this.eye.elements).sub(this.at).normalize().mul(speed);
    this.eye.add(b);
    this.at.add(b);
    this.updateView();
  }

  moveLeft(speed) {
    const f = new Vector3(this.at.elements).sub(this.eye).normalize();
    const s = Vector3.cross(new Vector3(), this.up, f).normalize().mul(speed);
    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  moveRight(speed) {
    const f = new Vector3(this.at.elements).sub(this.eye).normalize();
    const s = Vector3.cross(new Vector3(), f, this.up).normalize().mul(speed);
    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  panLeft(alpha) {
    const f = new Vector3(this.at.elements).sub(this.eye).normalize();
    const rotation = new Matrix4();
    rotation.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    const fPrime = rotation.multiplyVector3(f);
    this.at = new Vector3(this.eye.elements).add(fPrime);
    this.yaw += alpha;
    this.updateView();
  }

  panRight(alpha) {
    this.panLeft(-alpha);
  }

  jump(height) {
    if (this.isJumping) {
      console.log('Jump blocked: already jumping');
      return;
    }
    console.log('Jump triggered, eye.y before:', this.eye.elements[1]);
    this.eye.elements[1] += height;
    this.at.elements[1] += height;
    this.isJumping = true;
    this.jumpTime = performance.now() / 1000.0;
    this.updateView();
    console.log('Jump completed, eye.y after:', this.eye.elements[1]);
  }

  resetToGround() {
    console.log('Resetting to ground, eye.y before:', this.eye.elements[1]);
    const heightDiff = this.eye.elements[1] - this.groundLevel;
    this.eye.elements[1] = this.groundLevel;
    this.at.elements[1] -= heightDiff;
    this.isJumping = false;
    this.updateView();
    console.log('Reset completed, eye.y after:', this.eye.elements[1]);
  }

  update() {
    if (this.isJumping) {
      const currentTime = performance.now() / 1000.0;
      const timeSinceJump = currentTime - this.jumpTime;
      console.log('Update: timeSinceJump:', timeSinceJump, 'eye.y:', this.eye.elements[1]);
      if (timeSinceJump >= 0.5) {
        const fallSpeed = 10.0; // Units per second
        const deltaTime = Math.min(1 / 60, timeSinceJump - 0.5); // Cap at 60 FPS
        this.eye.elements[1] -= fallSpeed * deltaTime;
        this.at.elements[1] -= fallSpeed * deltaTime;
        if (this.eye.elements[1] <= this.groundLevel) {
          this.resetToGround();
        } else {
          this.updateView();
        }
      }
    }
  }

  getGridCoordsInFront() {
    const dir = new Vector3(this.at.elements).sub(this.eye).normalize();
    const pos = new Vector3(this.eye.elements)
      .add(dir)
      .add(new Vector3([16, 0, 16]));
    return [
      Math.floor(pos.elements[0]),
      Math.floor(pos.elements[2])
    ];
  }
}