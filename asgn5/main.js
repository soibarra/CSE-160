import * as THREE from 'three';
//import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
//import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
//import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//const controls = new OrbitControls( camera, renderer.domElement );
//const loader = new GLTFLoader();

/////const scene = new THREE.Scene();
//const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

/////const renderer = new THREE.WebGLRenderer();
/////renderer.setSize( window.innerWidth, window.innerHeight );
/////renderer.setAnimationLoop( animate );
/////document.body.appendChild( renderer.domElement );

function main() {

	const canvas = document.querySelector('#c');
	const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
	renderer.shadowMap.enabled = true;

    function resizeRendererToDisplaySize() {
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const needResize = canvas.width !== width || canvas.height !== height;
		if (needResize) {
			renderer.setSize(width, height, false);
		}
		return needResize;
	}

	const fov = 75;
	const aspect = 2; // the canvas default
    const near = 0.1;
	//const far = 10;
    const far = 100;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	//camera.position.z = 2;
    //camera.position.z = 8;
    camera.position.set(0, 1.6, 5); // Human-eye height

    /*const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 1.6, 0); // Look at ground level
    controls.update();*/

    /*const controls = new FirstPersonControls(camera, canvas);
    controls.movementSpeed = 5; // Adjust speed for walking
    controls.lookSpeed = 0.1; // Adjust mouse look sensitivity
    controls.heightSpeed = false; // Disable height-based speed adjustment
    controls.constrainVertical = true; // Limit vertical look
    controls.verticalMin = Math.PI * 0.1; // Prevent looking too far down
    controls.verticalMax = Math.PI * 0.9; // Prevent showing too far up*/

    // PointerLockControls for precise mouse movement
    const controls = new PointerLockControls(camera, canvas);
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const moveSpeed = 1;

    // Instructions to lock pointer on click
    canvas.addEventListener('click', () => {
        controls.lock();
    });

    // Keyboard controls for movement
    const onKeyDown = (event) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;
            case 'ArrowLeft':
            case 'KeyD':
                moveLeft = true;
                break;
            case 'ArrowRight':
            case 'KeyA':
                moveRight = true;
                break;
        }
    };

    const onKeyUp = (event) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;
            case 'ArrowLeft':
            case 'KeyD':
                moveLeft = false;
                break;
            case 'ArrowRight':
            case 'KeyA':
                moveRight = false;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

	const scene = new THREE.Scene();

    // Skybox and Fog setup with GUI and toggle functionality
    let isFogEnabled = true;
    const initialFog = new THREE.Fog('#b0c4de', 30, 90); // Initial fog settings
    scene.fog = initialFog;
    scene.background = new THREE.Color('#b0c4de'); // Initial background color with fog

    // Restore skybox
    let skyboxTexture = null;
    {
        const loader = new THREE.TextureLoader();
        skyboxTexture = loader.load(
            'sky.jpg',
            () => {
                skyboxTexture.mapping = THREE.EquirectangularReflectionMapping;
                skyboxTexture.colorSpace = THREE.SRGBColorSpace;
                if (!isFogEnabled) {
                    scene.background = skyboxTexture; // Apply skybox when fog is off
                }
            },
            undefined,
            (error) => {
                console.error('Error loading skybox texture:', error);
            }
        );
    }

    {
        class FogGUIHelper {
            constructor(fog, backgroundColor) {
                this.fog = fog;
                this.backgroundColor = backgroundColor;
            }
            get near() {
                return this.fog.near;
            }
            set near(v) {
                this.fog.near = v;
                this.fog.far = Math.max(this.fog.far, v);
            }
            get far() {
                return this.fog.far;
            }
            set far(v) {
                this.fog.far = v;
                this.fog.near = Math.min(this.fog.near, v);
            }
            get color() {
                return `#${this.fog.color.getHexString()}`;
            }
            set color(hexString) {
                this.fog.color.set(hexString);
                this.backgroundColor.set(hexString);
            }
        }

        const gui = new GUI();
        const fogGUIHelper = new FogGUIHelper(scene.fog, scene.background);
        gui.add(fogGUIHelper, 'near', 1, 100).listen();
        gui.add(fogGUIHelper, 'far', 1, 100).listen();
        gui.addColor(fogGUIHelper, 'color');

        // Fog toggle buttons
        document.getElementById('fogOn').addEventListener('click', () => {
            if (!isFogEnabled) {
                scene.fog = initialFog;
                scene.background = new THREE.Color('#b0c4de');
                isFogEnabled = true;
            }
        });

        document.getElementById('fogOff').addEventListener('click', () => {
            if (isFogEnabled) {
                scene.fog = null;
                if (skyboxTexture) {
                    scene.background = skyboxTexture; // Switch to skybox when fog is off
                } else {
                    scene.background = new THREE.Color('white'); // Fallback if texture isn't loaded yet
                }
                isFogEnabled = false;
            }
        });
    }

    // Ground Plane
    {
        const planeSize = 4000;
        const loader = new THREE.TextureLoader();
        const texture = loader.load('ground.jpg'); // grassy texture
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(planeSize / 2, planeSize / 2);
        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMat = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.rotation.x = Math.PI * -0.5;
        mesh.receiveShadow = true;
        scene.add(mesh);
    }

    {

		const color = 0xFFFFFF;
		const intensity = 3;
		const light = new THREE.DirectionalLight(color, intensity);
		light.castShadow = true;
		light.position.set(-1, 10, 0);
		light.target.position.set(0, 0, 0);
		scene.add(light);
		scene.add(light.target);

		const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
		scene.add(cameraHelper);

		const helper = new THREE.DirectionalLightHelper(light);
		scene.add(helper);

		function updateCamera() {
			light.target.updateMatrixWorld();
			helper.update();
			light.shadow.camera.updateProjectionMatrix();
			cameraHelper.update();
		}
		updateCamera();

		class ColorGUIHelper {
			constructor(object, prop) {
				this.object = object;
				this.prop = prop;
			}
			get value() {
				return `#${this.object[this.prop].getHexString()}`;
			}
			set value(hexString) {
				this.object[this.prop].set(hexString);
			}
		}

		function makeXYZGUI(gui, vector3, name, onChangeFn) {
			const folder = gui.addFolder(name);
			folder.add(vector3, 'x', -10, 10).onChange(onChangeFn);
			folder.add(vector3, 'y', 0, 20).onChange(onChangeFn);
			folder.add(vector3, 'z', -10, 10).onChange(onChangeFn);
			folder.open();
		}

		class DimensionGUIHelper {
			constructor(obj, minProp, maxProp) {
				this.obj = obj;
				this.minProp = minProp;
				this.maxProp = maxProp;
			}
			get value() {
				return this.obj[this.maxProp] * 2;
			}
			set value(v) {
				this.obj[this.maxProp] = v / 2;
				this.obj[this.minProp] = v / -2;
			}
		}

		class MinMaxGUIHelper {
			constructor(obj, minProp, maxProp, minDif) {
				this.obj = obj;
				this.minProp = minProp;
				this.maxProp = maxProp;
				this.minDif = minDif;
			}
			get min() {
				return this.obj[this.minProp];
			}
			set min(v) {
				this.obj[this.minProp] = v;
				this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
			}
			get max() {
				return this.obj[this.maxProp];
			}
			set max(v) {
				this.obj[this.maxProp] = v;
				this.min = this.min;
			}
		}

		const gui = new GUI();
		gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
		gui.add(light, 'intensity', 0, 10, 0.01);
		{
			const folder = gui.addFolder('Shadow Camera');
			folder.open();
			folder.add(new DimensionGUIHelper(light.shadow.camera, 'left', 'right'), 'value', 1, 1000)
				.name('width')
				.onChange(updateCamera);
			folder.add(new DimensionGUIHelper(light.shadow.camera, 'bottom', 'top'), 'value', 1, 1000)
				.name('height')
				.onChange(updateCamera);
			const minMaxGUIHelper = new MinMaxGUIHelper(light.shadow.camera, 'near', 'far', 0.1);
			folder.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
			folder.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far').onChange(updateCamera);
			folder.add(light.shadow.camera, 'zoom', 0.01, 1.5, 0.01).onChange(updateCamera);
		}
		makeXYZGUI(gui, light.position, 'position', updateCamera);
		makeXYZGUI(gui, light.target.position, 'target', updateCamera);

	}

	const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const sphereGeometry = new THREE.SphereGeometry(0.5, 12, 8);
    const cylinderGeometryTall = new THREE.CylinderGeometry(0.3, 0.3, 4, 16); // Tall lamp posts
    const cylinderGeometryWide = new THREE.CylinderGeometry(0.8, 0.8, 1, 16); // Short planters

    const textureLoader = new THREE.TextureLoader();
    const woodTexture = textureLoader.load('wood.jpg'); // crate texture
    woodTexture.colorSpace = THREE.SRGBColorSpace;
    const marbleTexture = textureLoader.load('marble.jpg'); // marble texture
    marbleTexture.colorSpace = THREE.SRGBColorSpace;
    const shadowTexture = textureLoader.load('https://threejs.org/manual/examples/resources/images/roundshadow.png'); // Shadow texture

    // Generate random color
    function getRandomColor() {
        return Math.random() * 0xffffff; // Random hex color
    }

    function makeInstance(geometry, color, x, y, z, texture = null) {
        const material = new THREE.MeshPhongMaterial({
            color: color,
            map: texture,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        return mesh;
    }

    // Spheres with bases for bouncing and shadows
    const sphereShadowBases = [];
    const spherePositions = [
        { x: -3, y: 0.5, z: 3, radius: 0.5 },
        { x: 3, y: 0.7, z: -3, radius: 0.7 },
        { x: 0, y: 0.4, z: 2, radius: 0.4 },
        { x: -2, y: 0.6, z: -1, radius: 0.6 },
        { x: 2, y: 0.5, z: 1, radius: 0.5 },
        { x: 4, y: 0.3, z: -2, radius: 0.3 },
        { x: -1, y: 0.8, z: 3, radius: 0.8 },
        { x: 1, y: 0.9, z: -4, radius: 0.9 }
    ];

    for (let i = 0; i < spherePositions.length; i++) {
        const { x, y, z, radius } = spherePositions[i];
        const base = new THREE.Object3D();
        scene.add(base);

        // Shadow
        const shadowMat = new THREE.MeshBasicMaterial({
            map: shadowTexture,
            transparent: true,
            depthWrite: false,
        });
        const shadowGeo = new THREE.PlaneGeometry(1, 1);
        const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
        shadowMesh.position.y = -0.48; // Slightly above ground
        shadowMesh.rotation.x = Math.PI * -0.5;
        const shadowSize = radius * 4;
        shadowMesh.scale.set(shadowSize, shadowSize, shadowSize);
        base.add(shadowMesh);

        // Sphere
        const sphereMat = i === 6 ? new THREE.MeshPhongMaterial({ map: marbleTexture }) : new THREE.MeshPhongMaterial({ color: getRandomColor() });
        const sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), sphereMat);
        sphereMesh.position.set(0, radius - y, 0); // Adjusted initial height
        base.add(sphereMesh);

        sphereShadowBases.push({ base, sphereMesh, shadowMesh, radius, initialY: y });
        base.position.set(x, y, z);
    }

    // Cubes (6)
    const cubes = [
        makeInstance(boxGeometry, 0x44aa88, -5, 4.5, 5),
        makeInstance(boxGeometry, 0x8844aa, 5, 4.5, -5),
        makeInstance(boxGeometry, 0xaa8844, -5, 4.5, -5),
        makeInstance(boxGeometry, 0x88aa44, 5, 4.5, 5),
        makeInstance(boxGeometry, 0x4488aa, 4, 0.5, 0),
        makeInstance(boxGeometry, null, 0, 0.5, 4, woodTexture), // Crate with texture
    ];

    /*/ Spheres (8)
    const spheres = [
        makeInstance(sphereGeometry, getRandomColor(), -3, 0.5, 3, null), // Random color
        makeInstance(new THREE.SphereGeometry(0.7, 12, 8), getRandomColor(), 3, 0.7, -3),
        makeInstance(new THREE.SphereGeometry(0.4, 12, 8), getRandomColor(), 0, 0.4, 2),
        makeInstance(new THREE.SphereGeometry(0.6, 12, 8), getRandomColor(), -2, 0.6, -1),
        makeInstance(new THREE.SphereGeometry(0.5, 12, 8), getRandomColor(), 2, 0.5, 1),
        makeInstance(new THREE.SphereGeometry(0.3, 12, 8), getRandomColor(), 4, 0.3, -2),
        makeInstance(new THREE.SphereGeometry(0.8, 12, 8), null, -1, 0.8, 3, marbleTexture), //marble texture
        makeInstance(new THREE.SphereGeometry(0.9, 12, 8), getRandomColor(), 1, 0.9, -4),
    ];*/

    // Cylinders (6)
    const cylinders = [
        makeInstance(cylinderGeometryTall, null, -5, 2, 5, marbleTexture), // Lamp posts with marble texture
        makeInstance(cylinderGeometryTall, null, 5, 2, -5, marbleTexture),
        makeInstance(cylinderGeometryTall, null, -5, 2, -5, marbleTexture),
        makeInstance(cylinderGeometryTall, null, 5, 2, 5, marbleTexture),
        makeInstance(cylinderGeometryWide, getRandomColor(), 0, 0.5, 0, null), // Planters with random color
        makeInstance(cylinderGeometryWide, getRandomColor(), -3, 0.5, -3, null),
    ];

    // Wind Spinner with Marble Bust
    const spinnerBase = makeInstance(cylinderGeometryTall, 0x666666, 0, 0.5, 0);
    const mtlLoader = new MTLLoader();
    mtlLoader.load(
      './marbleBust/marble_bust_01_4k.mtl',
      (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load(
          './marbleBust/marble_bust_01_4k.obj',
          (root) => {
            root.position.set(0, 2.5, 0); // Same position as the cone
            root.scale.set(4, 4, 4); // Adjust scale if needed
            spinnerGroup.add(root);
          },
          undefined,
          (error) => {
            console.error('Error loading OBJ:', error);
          }
        );
      },
      undefined,
      (error) => {
        console.error('Error loading MTL:', error);
      }
    );
    const spinnerGroup = new THREE.Group();
    spinnerGroup.add(spinnerBase);
    scene.add(spinnerGroup);

    function animateSpinner(time) {
        spinnerGroup.rotation.y = time * 0.5; // Slow rotation
    }

    // Textured 3D Model (table) with wood.jpg (removed since not needed)

    // Light Sources
    {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft gray
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffd700, 1); // Warm sunlight
        directionalLight.position.set(5, 10, 5);
        scene.add(directionalLight);

        cylinders.forEach((cylinder, ndx) => {
            if (ndx < 4) { // Lamp posts
                const pointLight = new THREE.PointLight(0xffa500, 1, 5); // Warm yellow, limited radius
                pointLight.position.set(cylinder.position.x, cylinder.position.y + 2, cylinder.position.z);
                scene.add(pointLight);
            }
        });

        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0xb97a20, 0.4); // Bluish sky, brownish ground
        scene.add(hemisphereLight);
    }

    // Glowing Floating Orb
    const orbGeometry = new THREE.SphereGeometry(0.3, 12, 8);
    const orbMaterial = new THREE.MeshPhongMaterial({ emissive: 0xff00ff, emissiveIntensity: 1 });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.set(0, 1.6, 4); // Above a crate
    orb.castShadow = true;
    orb.receiveShadow = true;
    scene.add(orb);

    function animateOrb(time) {
        const scale = Math.sin(time) * 0.2 + 1; // Pulse effect
        orb.scale.set(scale, scale, scale);
        orb.material.emissiveIntensity = scale; // Pulse intensity
    }

	//renderer.render( scene, camera );
    let lastTime = 0; //track last frame time for delta calc
    function render(time) {
        const deltaTime = (time - lastTime) * 0.001; // Convert to seconds
        lastTime = time;
        time *= 0.001; // Convert to seconds for animations

        if (resizeRendererToDisplaySize()) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        // Update movement based on keyboard input
        if (controls.isLocked) {
            velocity.x -= velocity.x * 10.0 * deltaTime; // Damping
            velocity.z -= velocity.z * 10.0 * deltaTime;

            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveLeft) - Number(moveRight);
            direction.normalize();

            if (moveForward || moveBackward) velocity.z -= direction.z * moveSpeed * deltaTime;
            if (moveLeft || moveRight) velocity.x -= direction.x * moveSpeed * deltaTime;

            controls.moveRight(-velocity.x * 100 * deltaTime);
            controls.moveForward(-velocity.z * 100 * deltaTime);
        }

        // Bounce animation for spheres
        const bounceHeight = 4; // Total bounce height above the lowest point
        sphereShadowBases.forEach((sphereShadowBase, ndx) => {
            const { base, sphereMesh, shadowMesh, radius, initialY } = sphereShadowBase;
            const yOff = Math.abs(Math.sin(time * 2 + ndx));
            sphereMesh.position.y = (radius - initialY) + THREE.MathUtils.lerp(0, bounceHeight, yOff);
            shadowMesh.material.opacity = THREE.MathUtils.lerp(1, 0.25, yOff);
        });

        /*cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * 0.1;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });*/
        
        animateSpinner(time);
        animateOrb(time);

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();

/*/ rendering the scene
function animate() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    //scene.add( line );
    renderer.render( scene, camera );
}/*/