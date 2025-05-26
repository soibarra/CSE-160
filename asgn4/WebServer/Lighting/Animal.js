// Animal.js
class Animal {
    constructor() {
        // all the parts
        this.body             = new Cube();
        this.tail             = new Cone();
        this.rThigh           = new Cube();
        this.rBackLeg         = new Cube();
        this.rFoot            = new Cube();
        this.lThigh           = new Cube();
        this.lBackLeg         = new Cube();
        this.lFoot            = new Cube();
        this.rShoulder        = new Cube();
        this.lShoulder        = new Cube();
        this.rFrontUpperLeg   = new Cube();
        this.rFrontLowerLeg   = new Cube();
        this.rFrontFoot       = new Cube();
        this.lFrontUpperLeg   = new Cube();
        this.lFrontLowerLeg   = new Cube();
        this.lFrontFoot       = new Cube();
        this.neck             = new Cube();
        this.head             = new Cube();
        this.nose1            = new Cube();
        this.nose2            = new Cube();
        // antler pieces
        this.antlerPieces     = Array.from({length:23-13}, ()=>new Cube());

        // root transform
        this.modelMatrix      = new Matrix4();
        // …and so on for every part you need…
  
        // shared “root” transform for the whole animal:
        this.modelMatrix = new Matrix4();
    }
  
    render() {
        // shorthand
        let M = mat => new Matrix4(mat);
        const root = M(this.modelMatrix);
    
        // BODY
        this.body.color = [0.847,0.561,0.239,1];
        let bodyM = M(root)
          .translate(0,-0.25,0.3)
          .scale(0.4,0.3,0.8);
        this.body.matrix = bodyM;
        this.body.render();
    
        // TAIL
        this.tail.color = [0.686,0.373,0.216,1];
        this.tail.matrix = M(root)
          .translate(0,-0.15,0.7)
          .rotate(g_tailAngle,0,1,0)
          .scale(0.2,0.12,0.35);
        this.tail.render();
    
        // RIGHT THIGH
        this.rThigh.color = [0.847,0.561,0.239,1];
        let rThighRoot = M(root).translate(0,-0.25,0.3);
        this.rThigh.matrix = M(rThighRoot)
          .translate(-0.225,-0.15,0.3)
          .translate(0,0.155,0)
          .rotate(g_rightThighAngle,1,0,0)
          .translate(0,-0.155,0)
          .scale(0.05,0.31,0.1);
        this.rThigh.render();
    
        // RIGHT BACK LEG
        this.rBackLeg.color = [0.847,0.561,0.239,1];
        let rBackLegRoot = M(this.rThigh.matrix);
        this.rBackLeg.matrix = M(rBackLegRoot)
          .translate(0.03,-0.25,0.05)
          .translate(0,0.205,0)
          .rotate(g_rightLegAngle,1,0,0)
          .translate(0,-0.205,0)
          .scale(0.1,0.3,0.1);
        this.rBackLeg.render();
    
        // RIGHT FOOT
        this.rFoot.color = [0.4,0.2,0.1,1];
        let rFootRoot = M(this.rBackLeg.matrix);
        this.rFoot.matrix = M(rFootRoot)
          .translate(0,-0.22,0)
          .translate(0,0.15,0)
          .rotate(g_rightFootAngle,1,0,0)
          .translate(0,-0.15,0)
          .scale(0.1,0.15,0.1);
        this.rFoot.render();
    
        // LEFT THIGH
        this.lThigh.color = [0.847,0.561,0.239,1];
        this.lThigh.matrix = M(rThighRoot)
          .translate(0.225,-0.15,0.3)
          .translate(0,0.155,0)
          .rotate(g_leftThighAngle,1,0,0)
          .translate(0,-0.155,0)
          .scale(0.05,0.31,0.1);
        this.lThigh.render();
    
        // LEFT BACK LEG
        this.lBackLeg.color = [0.847,0.561,0.239,1];
        let lBackLegRoot = M(this.lThigh.matrix);
        this.lBackLeg.matrix = M(lBackLegRoot)
          .translate(-0.03,-0.25,0.01)
          .translate(0,0.205,0)
          .rotate(g_leftLegAngle,1,0,0)
          .translate(0,-0.205,0)
          .scale(0.1,0.3,0.1);
        this.lBackLeg.render();
    
        // LEFT FOOT
        this.lFoot.color = [0.4,0.2,0.1,1];
        let lFootRoot = M(this.lBackLeg.matrix);
        this.lFoot.matrix = M(lFootRoot)
          .translate(0,-0.22,0)
          .translate(0,0.15,0)
          .rotate(g_leftFootAngle,1,0,0)
          .translate(0,-0.15,0)
          .scale(0.1,0.15,0.1);
        this.lFoot.render();
    
        // RIGHT SHOULDER
        this.rShoulder.color = [0.847,0.561,0.239,1];
        this.rShoulder.matrix = M(root)
          .translate(-0.15,-0.175,-0.25)
          .scale(0.1,0.05,0.1);
        this.rShoulder.render();
    
        // LEFT SHOULDER
        this.lShoulder.color = [0.847,0.561,0.239,1];
        this.lShoulder.matrix = M(root)
          .translate(0.15,-0.175,-0.25)
          .scale(0.1,0.05,0.1);
        this.lShoulder.render();
    
        // RIGHT FRONT UPPER LEG
        this.rFrontUpperLeg.color = [0.847,0.561,0.239,1];
        this.rFrontUpperLeg.matrix = M(root)
          .translate(-0.15,-0.25,-0.25)
          .translate(0,0.1,0)
          .rotate(g_rightFrontUpperAngle,1,0,0)
          .translate(0,-0.1,0)
          .scale(0.1,0.2,0.1);
        this.rFrontUpperLeg.render();
    
        // RIGHT FRONT LOWER LEG
        let rFUroot = M(this.rFrontUpperLeg.matrix);
        this.rFrontLowerLeg.color = [0.847,0.561,0.239,1];
        this.rFrontLowerLeg.matrix = M(rFUroot)
          .translate(0,-0.2,0)
          .translate(0,0.1,0)
          .rotate(g_rightFrontLowerAngle,1,0,0)
          .translate(0,-0.1,0)
          .scale(0.1,0.2,0.1);
        this.rFrontLowerLeg.render();
    
        // RIGHT FRONT FOOT
        let rFLroot = M(this.rFrontLowerLeg.matrix);
        this.rFrontFoot.color = [0.4,0.2,0.1,1];
        this.rFrontFoot.matrix = M(rFLroot)
          .translate(0,-0.17,0)
          .translate(0,0.15,0)
          .rotate(g_rightFrontFootAngle,1,0,0)
          .translate(0,-0.15,0)
          .scale(0.1,0.15,0.1);
        this.rFrontFoot.render();
    
        // LEFT FRONT UPPER LEG
        this.lFrontUpperLeg.color = [0.847,0.561,0.239,1];
        this.lFrontUpperLeg.matrix = M(root)
          .translate(0.15,-0.25,-0.25)
          .translate(0,0.1,0)
          .rotate(g_leftFrontUpperAngle,1,0,0)
          .translate(0,-0.1,0)
          .scale(0.1,0.2,0.1);
        this.lFrontUpperLeg.render();
    
        // LEFT FRONT LOWER LEG
        let lFUroot = M(this.lFrontUpperLeg.matrix);
        this.lFrontLowerLeg.color = [0.847,0.561,0.239,1];
        this.lFrontLowerLeg.matrix = M(lFUroot)
          .translate(0,-0.2,0)
          .translate(0,0.1,0)
          .rotate(g_leftFrontLowerAngle,1,0,0)
          .translate(0,-0.1,0)
          .scale(0.1,0.2,0.1);
        this.lFrontLowerLeg.render();
    
        // LEFT FRONT FOOT
        let lFLroot = M(this.lFrontLowerLeg.matrix);
        this.lFrontFoot.color = [0.4,0.2,0.1,1];
        this.lFrontFoot.matrix = M(lFLroot)
          .translate(0,-0.17,0)
          .translate(0,0.15,0)
          .rotate(g_leftFrontFootAngle,1,0,0)
          .translate(0,-0.15,0)
          .scale(0.1,0.15,0.1);
        this.lFrontFoot.render();
    
        // NECK
        this.neck.color = [0.847,0.561,0.239,1];
        this.neck.matrix = M(root)
          .translate(0,0.1,-0.5)
          .translate(0,-0.15,0)
          .rotate(g_neckAngle,1,0,0)
          .translate(0,0.15,0)
          .scale(0.2,0.3,0.2);
        this.neck.render();
    
        // HEAD
        let neckRoot = M(this.neck.matrix);
        this.head.color = [0.847,0.561,0.239,1];
        this.head.matrix = M(neckRoot)
          .translate(0,0.25,-0.05)
          .translate(0,-0.1,0)
          .rotate(g_headSideAngle,0,1,0)
          .translate(0,0.1,0)
          .scale(0.2,0.2,0.3);
        this.head.render();
    
        // NOSE1
        this.nose1.color = [0.847,0.561,0.239,1];
        this.nose1.matrix = M(this.head.matrix)
          .translate(0,-0.05,-0.2)
          .scale(0.2,0.1,0.1);
        this.nose1.render();
    
        // NOSE2
        this.nose2.color = [0.4,0.2,0.1,1];
        this.nose2.matrix = M(this.head.matrix)
          .translate(0,-0.05,-0.265)
          .scale(0.2,0.1,0.03);
        this.nose2.render();
    
        // ANTLERS (14 pieces numbered 14→23)
        const antlerRoot = M(this.head.matrix);
        const antlerTransforms = [
          [ -0.075,0.20,0.125, 0.05,0.2,0.05 ],
          [ -0.125,0.30,0.125, 0.05,0.2,0.05 ],
          [ -0.175,0.50,0.125, 0.05,0.2,0.05 ],
          [ -0.175,0.35,0.225, 0.05,0.1,0.25 ],
          [  0.15,0.50,0.275,  0.05,0.2,0.05 ],
          [  0.075,0.20,0.125, 0.05,0.2,0.05 ],
          [  0.125,0.30,0.125, 0.05,0.2,0.05 ],
          [  0.175,0.35,0.225, 0.05,0.1,0.25 ],
          [  0.175,0.50,0.125, 0.05,0.2,0.05 ],
          [ -0.175,0.50,0.275, 0.05,0.2,0.05 ]
        ];
        this.antlerPieces.forEach((piece,i)=>{
          piece.color = [0.655,0.310,0.180,1];
          const [tx,ty,tz,sx,sy,sz] = antlerTransforms[i];
          piece.matrix = M(antlerRoot)
            .translate(tx,ty,tz)
            .scale(sx,sy,sz);
          piece.render();
        });
      }
    }
  
    // export to global so World.js can see it:
    window.Animal = Animal;