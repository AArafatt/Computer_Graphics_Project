import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';

let scene, camera, renderer;
let sunlight, bench;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);  // Soft blue sky color

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 30);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    setupSunlight();

    loadModels();

    document.addEventListener('keydown', onDocumentKeyDown, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);

    animate();
}

function setupSunlight() {
    sunlight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunlight.position.set(-30, 10, -10);
    scene.add(sunlight);

    const textureLoader = new THREE.TextureLoader();
    const flareTexture = textureLoader.load('path_to_lensflare_texture.png');
    const lensflare = new Lensflare();
    lensflare.addElement(new LensflareElement(flareTexture, 512, 0));
    sunlight.add(lensflare);
}

function loadModels() {
    const loader = new GLTFLoader();

    loader.load(
        './assets/park/scene.gltf',
        function (gltf) {
            const park = gltf.scene;
            park.position.set(0, 0, 0);
            scene.add(park);
        },
        function (error) {
            console.error('An error happened loading the park:', error);
        }
    );

    loader.load(
        './assets/sun/scene.gltf',
        function (gltf) {
            const sun = gltf.scene;
            sun.position.set(12, 12, 0);
            scene.add(sun);
        },
        function (error) {
            console.error('An error happened loading the sun:', error);
        }
    );

    loader.load(
        './assets/bench/scene.gltf',
        function (gltf) {
            bench = gltf.scene;
            bench.position.set(-11, 0, 0);
            scene.add(bench);
            camera.lookAt(bench.position);
        },
        function (error) {
            console.error('An error happened loading the bench:', error);
        }
    );

    loadTree(loader, -10, 0);
    loadTree(loader, 0, 0);
    loadTree(loader, 10, 0);
}

function loadTree(loader, x, z) {
    loader.load(
        './assets/tree/scene.gltf',
        function (gltf) {
            const tree = gltf.scene;
            tree.position.set(x, 0, z);
            tree.traverse(function (object) {
                if (object.isMesh && (object.material && object.material.name.includes('Leaf'))) {
                    object.userData.isLeaf = true;
                    object.material = new THREE.MeshPhongMaterial({
                        color: object.material.color,
                        map: object.material.map,
                        side: THREE.DoubleSide
                    });
                }
            });
            scene.add(tree);
        },
        function (error) {
            console.error('An error happened loading the tree:', error);
        }
    );
}

function onDocumentMouseDown(event) {
    event.preventDefault();
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        - (event.clientY / window.innerHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    intersects.forEach(intersect => {
        if (intersect.object.userData.isLeaf) {
            let newColor = new THREE.Color(Math.random() * 0xffffff);
            intersect.object.material.color.set(newColor);
        }
    });
}

function onDocumentKeyDown(event) {
    const keyCode = event.which;
    switch (keyCode) {
        case 87: // W key
            moveCameraForward();
            break;
        case 83: // S key
            moveCameraBackward();
            break;
        case 65: // A key
            rotateCameraAroundBench(true);
            break;
        case 68: // D key
            rotateCameraAroundBench(false);
            break;
    }
}

function moveCameraForward() {
    const vector = new THREE.Vector3();
    camera.getWorldDirection(vector);
    camera.position.addScaledVector(vector, -1);
    camera.lookAt(bench.position);
}

function moveCameraBackward() {
    const vector = new THREE.Vector3();
    camera.getWorldDirection(vector);
    camera.position.addScaledVector(vector, 1);
    camera.lookAt(bench.position);
}

function rotateCameraAroundBench(clockwise) {
    const angle = clockwise ? -Math.PI / 36 : Math.PI / 36;
    const offsetX = camera.position.x - bench.position.x;
    const offsetZ = camera.position.z - bench.position.z;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    camera.position.x = bench.position.x + offsetX * cosAngle - offsetZ * sinAngle;
    camera.position.z = bench.position.z + offsetX * sinAngle + offsetZ * cosAngle;
    camera.lookAt(bench.position);
}

function animate() {
    requestAnimationFrame(animate);
    sunlight.position.x += 0.05;
    if (sunlight.position.x > 20) {
        sunlight.position.x = -30;  // Reset to create a loop
    }
    renderer.render(scene, camera);
}

window.onload = init;
