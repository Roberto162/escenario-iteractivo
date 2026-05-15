import * as THREE from "../../build/three.module.js";

import Stats from "../../jsm/libs/stats.module.js";
import { GLTFLoader } from "../../jsm/loaders/GLTFLoader.js";
import { Octree } from "../../jsm/math/Octree.js";
import { OctreeHelper } from "../../jsm/helpers/OctreeHelper.js";
import { Capsule } from "../../jsm/math/Capsule.js";
import { GUI } from "../../jsm/libs/lil-gui.module.min.js";

const clock = new THREE.Clock();
const scene = new THREE.Scene();
let personaje;
let mixer;
let accionActual;
const acciones = {};

let tiempoMovimiento = 0;

const velocidadCaminar = 0.05;
const velocidadCorrer = 0.12;
let primeraPersona = false;
let velocidadY = 0;
let enElSuelo = true;

let idleAction;
let walkAction;
let runAction;
let attackAction;
scene.background = new THREE.Color(0xded7c9);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.rotation.order = "YXZ";

const fillLight1 = new THREE.HemisphereLight(
  0xffffff,
  0xb8b8b8,
  1.2
);
fillLight1.position.set(2, 1, 1);
scene.add(fillLight1);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(15, 30, 10);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = -0.00006;
scene.add(directionalLight);

const container = document.getElementById("container");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
container.appendChild(renderer.domElement);

const stats = new Stats();
stats.domElement.style.position = "absolute";
stats.domElement.style.top = "0px";
container.appendChild(stats.domElement);

const GRAVITY = 30;
const NUM_SPHERES = 100;
const SPHERE_RADIUS = 0.2;
const STEPS_PER_FRAME = 5;

const starShape = new THREE.Shape();

const outerRadius = SPHERE_RADIUS;
const innerRadius = SPHERE_RADIUS * 0.45;
const spikes = 5;

for (let i = 0; i < spikes * 2; i++) {

  const radius = i % 2 === 0 ? outerRadius : innerRadius;

  const angle = (i / (spikes * 2)) * Math.PI * 2;

  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  if (i === 0) {
    starShape.moveTo(x, y);
  } else {
    starShape.lineTo(x, y);
  }

}

starShape.closePath();

const extrudeSettings = {
  depth: 0.12,
  bevelEnabled: true,
  bevelSegments: 2,
  steps: 1,
  bevelSize: 0.04,
  bevelThickness: 0.04
};

const sphereGeometry = new THREE.ExtrudeGeometry(
  starShape,
  extrudeSettings
);

const sphereMaterial = new THREE.MeshStandardMaterial({
  color: 0xffd700,
  emissive: 0xffaa00,
  emissiveIntensity: 0.4,
  metalness: 0.7,
  roughness: 0.3
});

const spheres = [];
let sphereIdx = 0;

for (let i = 0; i < NUM_SPHERES; i++) {
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  scene.add(sphere);
  spheres.push({
    mesh: sphere,
    collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), SPHERE_RADIUS),
    velocity: new THREE.Vector3(),
  });
}

const worldOctree = new Octree();
const playerCollider = new Capsule(
  new THREE.Vector3(0, 10, 0),
  new THREE.Vector3(0, 11, 0),
  0.35
);
const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

let playerOnFloor = false;
let mouseTime = 0;

const keyStates = {};
const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

document.addEventListener("keydown", (event) => {
  keyStates[event.code] = true;
  if (event.code === "KeyV") {
    primeraPersona = !primeraPersona;
  }
});
document.addEventListener("keyup", (event) => {
  keyStates[event.code] = false;
});
document.addEventListener("mousedown", () => {
  keyStates["Mouse0"] = true;
});

document.addEventListener("mouseup", () => {
  keyStates["Mouse0"] = false;

  if (document.pointerLockElement !== null) {
    throwBall();
  }
});
container.addEventListener("mousedown", () => {
  document.body.requestPointerLock();
  mouseTime = performance.now();
});

document.body.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement === document.body) {
    camera.rotation.y -= event.movementX / 500;
    camera.rotation.x -= event.movementY / 500;
  }
});
window.addEventListener("resize", onWindowResize);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function throwBall() {

  if (!personaje) return;

  const sphere = spheres[sphereIdx];

  // dirección del personaje
  const direccion = new THREE.Vector3(0, 0, -1);

  direccion.applyQuaternion(personaje.quaternion);

  // posición frente al personaje
  sphere.collider.center.copy(personaje.position);

  sphere.collider.center.y += 2;

  sphere.collider.center.addScaledVector(direccion, 2);

  // velocidad
  sphere.velocity.copy(direccion).multiplyScalar(25);

  sphereIdx = (sphereIdx + 1) % spheres.length;

}


function updatePlayer(deltaTime) {
  let damping = Math.exp(-4 * deltaTime) - 1;
  if (!playerOnFloor) {
    playerVelocity.y -= GRAVITY * deltaTime;
    damping *= 0.1;
  }
  playerVelocity.addScaledVector(playerVelocity, damping);
  const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);

playerCollider.translate(deltaPosition);
  //camera.position.copy(playerCollider.end);
}

function playerSphereCollision(sphere) {
  const center = vector1
    .addVectors(playerCollider.start, playerCollider.end)
    .multiplyScalar(0.5);
  const sphere_center = sphere.collider.center;
  const r = playerCollider.radius + sphere.collider.radius;
  const r2 = r * r;
  for (const point of [playerCollider.start, playerCollider.end, center]) {
    const d2 = point.distanceToSquared(sphere_center);
    if (d2 < r2) {
      const normal = vector1.subVectors(point, sphere_center).normalize();
      const v1 = vector2
        .copy(normal)
        .multiplyScalar(normal.dot(playerVelocity));
      const v2 = vector3
        .copy(normal)
        .multiplyScalar(normal.dot(sphere.velocity));
      playerVelocity.add(v2).sub(v1);
      sphere.velocity.add(v1).sub(v2);
      const d = (r - Math.sqrt(d2)) / 2;
      sphere_center.addScaledVector(normal, -d);
    }
  }
}

function spheresCollisions() {
  for (let i = 0, length = spheres.length; i < length; i++) {
    const s1 = spheres[i];
    for (let j = i + 1; j < length; j++) {
      const s2 = spheres[j];
      const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
      const r = s1.collider.radius + s2.collider.radius;
      const r2 = r * r;
      if (d2 < r2) {
        const normal = vector1
          .subVectors(s1.collider.center, s2.collider.center)
          .normalize();
        const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
        const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));
        s1.velocity.add(v2).sub(v1);
        s2.velocity.add(v1).sub(v2);
        const d = (r - Math.sqrt(d2)) / 2;
        s1.collider.center.addScaledVector(normal, d);
        s2.collider.center.addScaledVector(normal, -d);
      }
    }
  }
}

function updateSpheres(deltaTime) {
  spheres.forEach((sphere) => {
    sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);
    const result = worldOctree.sphereIntersect(sphere.collider);
    if (result) {
      sphere.velocity.addScaledVector(
        result.normal,
        -result.normal.dot(sphere.velocity) * 1.5
      );
      sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
    } else {
      sphere.velocity.y -= GRAVITY * deltaTime;
    }
    const damping = Math.exp(-1.5 * deltaTime) - 1;
    sphere.velocity.addScaledVector(sphere.velocity, damping);
    playerSphereCollision(sphere);
  });
  spheresCollisions();
  for (const sphere of spheres) {

  sphere.mesh.position.copy(sphere.collider.center);

  sphere.mesh.rotation.x += 0.08;
  sphere.mesh.rotation.y += 0.08;
  sphere.mesh.rotation.z += 0.04;

}
}

function getForwardVector() {
  camera.getWorldDirection(playerDirection);
  playerDirection.y = 0;
  playerDirection.normalize();
  return playerDirection;
}

function getSideVector() {
  camera.getWorldDirection(playerDirection);
  playerDirection.y = 0;
  playerDirection.normalize();
  playerDirection.cross(camera.up);
  return playerDirection;
}

function cambiarAnimacion(nombre) {

  // verificar que exista
  if (!acciones[nombre]) return;

 if (accionActual === acciones[nombre]) return;

Object.values(acciones).forEach((accion) => {

  accion.stop();

});


  // desvanecer animación anterior
  if (accionActual) {

    accionActual.fadeOut(0.2);

  }

  // nueva animación
  accionActual = acciones[nombre];

  accionActual
    .reset()
    .fadeIn(0.2)
    .play();

} 
function controls(deltaTime) {

  if (!personaje) return;

  let moviendo = false;

  let velocidad = velocidadCaminar;

  // correr después de 1 segundo
  if (keyStates["KeyW"]) {

    tiempoMovimiento += deltaTime;

    moviendo = true;

    if (tiempoMovimiento > 1) {

      velocidad = velocidadCorrer;

      cambiarAnimacion("Run");

    } else {

      cambiarAnimacion("Walk");

    }

    personaje.translateZ(-velocidad);

  }

  // atrás
  if (keyStates["KeyS"]) {

    cambiarAnimacion("Walk");

    personaje.translateZ(velocidadCaminar);

    moviendo = true;

  }

  // rotar izquierda
  if (keyStates["KeyA"]) {

    personaje.rotation.y += 0.05;

  }

  // rotar derecha
  if (keyStates["KeyD"]) {

    personaje.rotation.y -= 0.05;

  }

  // salto
  if (keyStates["Space"] && enElSuelo) {
    velocidadY = 0.15;
    enElSuelo = false;
  }
  // ataque
  if (keyStates["Mouse0"]) {

    cambiarAnimacion("Attack");

  }

  // idle
  if (!moviendo && !keyStates["Mouse0"]) {

    tiempoMovimiento = 0;

    cambiarAnimacion("Idle");

  }

}

const loader = new GLTFLoader().setPath("../../assets/models/gltf/");

loader.load("ciudad.glb", (gltf) => {

  const modelo = gltf.scene;

  modelo.scale.set(0.05, 0.05, 0.05);

  modelo.position.set(0, -5, 0);

  modelo.rotation.y = Math.PI;

  scene.add(modelo);

  modelo.traverse((child) => {

    if (child.isMesh) {

      child.castShadow = true;
      child.receiveShadow = true;

    }

  });

  worldOctree.fromGraphNode(modelo);

});

loader.load("sauron.glb", (gltf) => {

  personaje = gltf.scene;

  personaje.scale.set(1, 1, 1);

  personaje.position.set(0, 0, 0);

  scene.add(personaje);

  // sombras
  personaje.traverse((child) => {

    if (child.isMesh) {

      child.castShadow = true;
      child.receiveShadow = true;

    }

  });

  // 🎬 animaciones
  mixer = new THREE.AnimationMixer(personaje);

  console.log(gltf.animations);

// Asignar animaciones
idleAction = mixer.clipAction(gltf.animations[0]);
walkAction = mixer.clipAction(gltf.animations[1]);
runAction = mixer.clipAction(gltf.animations[2]);

// guardar en objeto
acciones["Idle"] = idleAction;
acciones["Walk"] = walkAction;
acciones["Run"] = runAction;

// animación inicial
accionActual = idleAction;
accionActual.play();
attackAction = mixer.clipAction(gltf.animations[3]);
acciones["Attack"] = attackAction;
attackAction.setLoop(THREE.LoopOnce);
attackAction.clampWhenFinished = true;
});
  const helper = new OctreeHelper(worldOctree);
  helper.visible = false;
  scene.add(helper);
  const gui = new GUI({ width: 200 });
  gui.add({ debug: false }, "debug").onChange(function (value) {
    helper.visible = value;
  });
function teleportPlayerIfOob() {
  if (camera.position.y <= -25) {
    playerCollider.start.set(0, 0.35, 0);
    playerCollider.end.set(0, 1, 0);
    playerCollider.radius = 0.35;
    camera.position.copy(playerCollider.end);
    camera.rotation.set(0, 0, 0);
  }
}

function animate() {
  const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;
  for (let i = 0; i < STEPS_PER_FRAME; i++) {
    controls(deltaTime);
updateSpheres(deltaTime);
  }
  if (mixer) mixer.update(deltaTime);
  if (personaje) {
    // 1. Aplicar Gravedad
    if (!enElSuelo) {
      velocidadY -= 0.01;
    }
    personaje.position.y += velocidadY;

    // 2. Detectar el suelo
    if (personaje.position.y <= 0) {
      personaje.position.y = 0;
      velocidadY = 0;
      enElSuelo = true;
    }

    // 3. Posicionar la Cámara
    let offset;
    let objetivo = personaje.position.clone();

    if (primeraPersona) {
      // Vista en Primera Persona
      offset = new THREE.Vector3(0, 2, 0.5);
      objetivo.y += 2;
      
      // Calcular hacia dónde mirar en primera persona
      let frente = new THREE.Vector3(0, 0, -5);
      frente.applyQuaternion(personaje.quaternion);
      objetivo.add(frente);
    } else {
      // Vista en Tercera Persona (Estilo Free Fire)
      offset = new THREE.Vector3(0, 4, 8);
      objetivo.y += 2;
    }

    // Aplicar la rotación del personaje a la cámara y actualizar
    offset.applyQuaternion(personaje.quaternion);
    camera.position.copy(personaje.position).add(offset);
    camera.lookAt(objetivo);
  }
  renderer.render(scene, camera);
  stats.update();
}
