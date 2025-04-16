class SmudgeBrush {
    constructor() {
      this.type = 'smudge';
      this.position = [0.0, 0.0];
      this.color = [...g_selectedColor.slice(0, 3), 0.1]; // lower alpha for fade
      this.size = 15.0;
      this.skipNext = true; // used to skip the first render frame
    }
  
    render() {
        let [x2, y2] = this.position;
      
        // Skip rendering if we don't have a previous point (first point of stroke)
        if (g_prevX === null || g_prevY === null) {
          g_prevX = x2;
          g_prevY = y2;
          return; // ← make sure this closes before continuing
        }
      
        let [x1, y1] = [g_prevX, g_prevY];
        let dx = x2 - x1;
        let dy = y2 - y1;
        let distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(distance / 0.01);
      
        for (let i = 0; i < steps; i++) {
          let t = i / steps;
          let xi = x1 + dx * t;
          let yi = y1 + dy * t;
      
          let angle = Math.atan2(dy, dx);
          const s = (this.size / 400) * (1 + distance * 10); // dynamic width
      
          let vx = Math.cos(angle + Math.PI / 2) * s;
          let vy = Math.sin(angle + Math.PI / 2) * s;
          let ux = Math.cos(angle - Math.PI / 2) * s;
          let uy = Math.sin(angle - Math.PI / 2) * s;
      
          let tailX = xi + dx / steps;
          let tailY = yi + dy / steps;
      
          gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
          drawTriangle(gl, [
            xi + vx, yi + vy,
            xi + ux, yi + uy,
            tailX, tailY
          ]);
        }
      
        // ✅ Update previous point after rendering
        g_prevX = x2;
        g_prevY = y2;
      }
}
