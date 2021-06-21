import * as THREE from 'three';
import {
    OrbitControls
} from 'three/examples/jsm/controls/OrbitControls.js';

import {
    GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader';

import sphere from '../models/sphere2.glb'
import spaceTexture from '../models/space2.jpg'


import {
    EffectComposer
} from 'three/examples/jsm/postprocessing/EffectComposer';
import {
    RenderPass
} from 'three/examples/jsm/postprocessing/RenderPass';
import {
    UnrealBloomPass
} from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import {
    GlitchPass
} from 'three/examples/jsm/postprocessing/GlitchPass';

import {
    SavePass
} from 'three/examples/jsm/postprocessing/SavePass';

import {
    ShaderPass
} from 'three/examples/jsm/postprocessing/ShaderPass';

import {
    CopyShader
} from 'three/examples/jsm/shaders/CopyShader';

import {
    BlendShader
} from 'three/examples/jsm/shaders/BlendShader';


import {
    MeshBasicMaterial
} from 'three';
import gsap from 'gsap'

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const params = {
    exposure: 1,
    bloomStrength: 1,
    bloomThreshold: 0.4,
    bloomRadius: 0.4
}

const cameraPosition = {
    x: 0,
    y: 10,
    z: 37,
}

let hovered = false;


const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const loader = new GLTFLoader();

let planet;


const scene = new THREE.Scene();
scene.background = new THREE.TextureLoader().load(spaceTexture)

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);

const controls = new OrbitControls(camera, renderer.domElement);

//controls.update() must be called after any manual changes to the camera's transform
camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
camera.lookAt(0, 0, 0)
controls.update();

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

}

window.addEventListener('mousemove', onMouseMove, false);

window.addEventListener('resize', () => {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

})

const composer = new EffectComposer(renderer);

const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = params.bloomThreshold;
bloomPass.strength = params.bloomStrength;
bloomPass.radius = params.bloomRadius;

var renderTargetParameters = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    stencilBuffer: false
};

// const glitchPass = new GlitchPass();


const savePass = new SavePass(new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParameters));

const blendPass = new ShaderPass(BlendShader, 'tDiffuse1');
blendPass.uniforms['tDiffuse2'].value = savePass.renderTarget.texture;
blendPass.uniforms['mixRatio'].value = 0.8;

const outputPass = new ShaderPass(CopyShader);
outputPass.renderToScreen = true;




composer.addPass(renderScene);
composer.addPass(blendPass);

composer.addPass(savePass);
composer.addPass(outputPass);
composer.addPass(bloomPass);

// composer.addPass(glitchPass);

let center = new THREE.Vector3(0, 0, 0);

let childOldPositions = [];
let childNewPositions = [];


let color1 = new THREE.Color(0x116984);
let color2 = new THREE.Color(0xf14100);

loader.load(sphere, (gltf) => {
        planet = gltf.scene
        gltf.scene.children[0].children[0].material.metalness = 0.7;
        gltf.scene.children[0].children[1].material.emissive = color1;
        gltf.scene.children[0].children[1].material.emissiveIntensity = 2;

        console.log(planet);
        scene.add(planet);

        planet.children.forEach((child, index) => {
            var direction = child.position.clone().sub(center);
            childOldPositions.push(child.position.clone());
            childNewPositions.push(direction.clone().multiplyScalar(1.3));
            child.oldPos = child.position.clone();
            child.newPos = direction.clone().multiplyScalar(1.3);
        });


        planet.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        animateSphere();



    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, )


const sun = new THREE.Mesh(new THREE.SphereBufferGeometry(7, 30, 30), new MeshBasicMaterial(0x116984));
scene.add(sun);

function map(x, a, b, c, d) {
    let num = (x - a) / (b - a) * (d - c) + c
    return num
}



document.addEventListener('mouseenter', function () {
    hovered = true
})

document.addEventListener('mouseleave', function () {
    hovered = false
})

let time = 0

let INTERSECTED;

function animate() {

    composer.render();
    requestAnimationFrame(animate);

    // if (planet && hovered) {
    //     raycaster.setFromCamera(mouse, camera);
    //     const intersects = raycaster.intersectObjects(planet.children, true);
    //     if (intersects.length > 0) {
    //         if (INTERSECTED != intersects[0].object.parent) {
    //             if(INTERSECTED){
    //                 INTERSECTED.position.set(INTERSECTED.newPos.x, INTERSECTED.newPos.y, INTERSECTED.newPos.z);
    //             }
    //             INTERSECTED = intersects[0].object.parent;
    //         }
    //     } else {
    //         if (INTERSECTED) {
    //             INTERSECTED.position.set(INTERSECTED.oldPos.x, INTERSECTED.oldPos.y, INTERSECTED.oldPos.z);
    //         }
    //         INTERSECTED = null;
    //     }
    // }


    // required if controls.enableDamping or controls.autoRotate are set to true
    controls.update();

    // renderer.render(scene, camera);

    if (planet && !hovered) {
        if (time > 2 * Math.PI) {
            time = 0;
        } else {
            time += 0.02;
            planet.rotation.y = time;
        }

    }
    if (planet && hovered) {
        time = Math.PI / 2;
        planet.rotation.y = THREE.MathUtils.lerp(planet.rotation.y, Math.PI / 2, 0.1)
    }

}

animate();

function animateSphere() {
    let tl = gsap.timeline({
        onComplete: animateSphere
    });
    if (planet && !hovered) {
        tl.to(planet.children[0].children[1].material.emissive, {
            r: color2.r,
            g: color2.g,
            b: color2.b,
            duration: 1,
            ease: "expo-in"
        })


        for (let i = 0; i < planet.children.length; i++) {
            tl.to(planet.children[i].position, {
                x: childNewPositions[i].x,
                y: childNewPositions[i].y,
                z: childNewPositions[i].z,
                duration: 0.5,
                ease: "expo-out"
            }, "-=0.4")
        }
        tl.to(planet.children[0].children[1].material.emissive, {
            r: color1.r,
            g: color1.g,
            b: color1.b,
            duration: 1,
            ease: "expo-in"
        })
        for (let i = 0; i < planet.children.length; i++) {
            tl.to(planet.children[i].position, {
                x: childOldPositions[i].x,
                y: childOldPositions[i].y,
                z: childOldPositions[i].z,
                duration: 0.5,
                ease: "expo-in"

            }, "-=0.4")

        }




    }
    // if(planet && hovered){
    //     for (let i = 0; i < planet.children.length; i++) {
    //         tl.to(planet.children[i].position, {
    //             x: childOldPositions[i].x,
    //             y: childOldPositions[i].y,
    //             z: childOldPositions[i].z,
    //             duration: 0.2,
    //             ease: "expo-in"

    //         }, "-=0.2")
    //     }
    // }
}