import * as THREE from "../../build/three.module.js";

import Stats from "../../jsm/libs/stats.module.js";
import { GLTFLoader } from "../../jsm/loaders/GLTFLoader.js";
import { Octree } from "../../jsm/math/Octree.js";
import { OctreeHelper } from "../../jsm/helpers/OctreeHelper.js";
import { GUI } from "../../jsm/libs/lil-gui.module.min.js";

const clock = new THREE.Clock();
const scene = new THREE.Scene();
let personaje;
let mixer;
let accionActual;
const acciones = {};

let tiempoMovimiento = 0;

const velocidadCaminar = 0.008;
const velocidadCorrer = 0.02;
let velocidadY = 0;
let enSuelo = true;

const gravedad = 0.015;
const fuerzaSalto = 0.15;

let idleAction;
let walkAction;
let runAction;
let attackAction;
let modoPrimeraPersona = false;
let rotacionVertical = 0;
const personajeCollider = new THREE.Sphere(
  new THREE.Vector3(),
  0.5
);
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


const keyStates = {};
const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

document.addEventListener("keydown", (event) => {

  keyStates[event.code] = true;

  // cambiar cámara
  if (event.code === "KeyV") {

    modoPrimeraPersona = !modoPrimeraPersona;

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
});

document.body.addEventListener("mousemove", (event) => {

  if (!personaje) return;

  if (document.pointerLockElement === document.body) {

    // rotación horizontal personaje
    personaje.rotation.y -= event.movementX * 0.007;

    // rotación vertical cámara
    rotacionVertical -= event.movementY * 0.002;

    // limitar cámara
    rotacionVertical = Math.max(
      -0.8,
      Math.min(0.8, rotacionVertical)
    );

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
  const direccion = new THREE.Vector3();

camera.getWorldDirection(direccion);

direccion.normalize();

  // posición frente al personaje
  sphere.collider.center.copy(personaje.position);

sphere.collider.center.y += 1;

  sphere.collider.center.addScaledVector(direccion, 2);

  // velocidad
  sphere.velocity.copy(direccion).multiplyScalar(25);

  sphereIdx = (sphereIdx + 1) % spheres.length;

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
  });
  for (const sphere of spheres) {

  sphere.mesh.position.copy(sphere.collider.center);

  sphere.mesh.rotation.x += 0.08;
  sphere.mesh.rotation.y += 0.08;
  sphere.mesh.rotation.z += 0.04;

}
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
  if (keyStates["KeyP"]) { console.log(personaje.position); keyStates["KeyP"] = false; }

  let moviendo = false;

  let velocidad = velocidadCaminar;

  // correr después de 1 segundo
  if (keyStates["KeyS"]) {

    tiempoMovimiento += deltaTime;

    moviendo = true;

    if (tiempoMovimiento > 1) {

      velocidad = velocidadCorrer;

      cambiarAnimacion("Poder");

    } else {

      cambiarAnimacion("Caminando");

    }

    const direccion = new THREE.Vector3(0, 0, -1);

direccion.applyQuaternion(personaje.quaternion);

const nuevaPosicion = personaje.position.clone();

nuevaPosicion.addScaledVector(
  direccion,
  velocidad
);


  personaje.position.copy(nuevaPosicion);

  }

  // atrás
  if (keyStates["KeyW"]) {

    cambiarAnimacion("Caminando");

    const direccion = new THREE.Vector3(0, 0, 1);

direccion.applyQuaternion(personaje.quaternion);

const nuevaPosicion = personaje.position.clone();

nuevaPosicion.addScaledVector(
  direccion,
  velocidadCaminar
);


  personaje.position.copy(nuevaPosicion);

    moviendo = true;

  }

  // izquierda (strafe)
if (keyStates["KeyA"]) {

  moviendo = true;

  cambiarAnimacion("Caminando");

  const direccion = new THREE.Vector3(-1, 0, 0);

  direccion.applyQuaternion(personaje.quaternion);

  const nuevaPosicion = personaje.position.clone();

  nuevaPosicion.addScaledVector(
    direccion,
    velocidadCaminar
  );
    personaje.position.copy(nuevaPosicion);

}

// derecha (strafe)
if (keyStates["KeyD"]) {

  moviendo = true;

  cambiarAnimacion("Caminando");

  const direccion = new THREE.Vector3(1, 0, 0);

  direccion.applyQuaternion(personaje.quaternion);

  const nuevaPosicion = personaje.position.clone();

  nuevaPosicion.addScaledVector(
    direccion,
    velocidadCaminar
  );

    personaje.position.copy(nuevaPosicion);

}


  // ataque
  if (keyStates["Mouse0"]) {

    cambiarAnimacion("Ataque");

  }
  // salto
if (keyStates["Space"] && enSuelo) { velocidadY = fuerzaSalto; enSuelo = false; keyStates["Space"] = false; }

  // idle
  if (!moviendo && !keyStates["Mouse0"]) {

    tiempoMovimiento = 0;

    cambiarAnimacion("CamConEsp");

  }

}
function verificarColision(posicionNueva) {

  const collider = new THREE.Sphere(
    posicionNueva,
    0.5
  );

  const result = worldOctree.sphereIntersect(collider);

  return result;

}

function actualizarFisicaPersonaje() {

  if (!personaje) return;
  if (personaje.position.y < -20) { personaje.position.set(10, 10, -5); velocidadY = 0; }

  // actualizar collider
  personajeCollider.center.copy(personaje.position);

  personajeCollider.center.y += 1;

  // gravedad
  velocidadY -= gravedad;
                
  personaje.position.y += velocidadY;

  // actualizar collider otra vez
  personajeCollider.center.copy(personaje.position);

  personajeCollider.center.y += 0.5;

  // detectar colisión
  const result = worldOctree.sphereIntersect(
    personajeCollider
  );

  enSuelo = false;

  if (result) {

    // detectar si está sobre algo
    if (result.normal.y > 0.5) {

      enSuelo = true;

      velocidadY = 0;

    }

    // empujar fuera de la geometría
    personaje.position.addScaledVector(
      result.normal,
      result.depth
    );

  }

}

const loader = new GLTFLoader().setPath("../../assets/models/gltf/");

loader.load("ciudad.glb", (gltf) => {

  const modelo = gltf.scene;

  modelo.scale.set(0.05, 0.05, 0.05);

  modelo.position.set(0, -3, 0);

  modelo.rotation.y = Math.PI;

  scene.add(modelo);

  modelo.traverse((child) => {

    if (child.isMesh) {

      child.castShadow = true;
      child.receiveShadow = true;

    }

  });
modelo.updateMatrixWorld(true);
  worldOctree.fromGraphNode(modelo);

});

loader.load("sauron.glb", (gltf) => {
  personaje = gltf.scene;
  personaje.scale.set(0.6, 0.6, 0.6);
  
  // Lo centramos en X y Z, y lo ponemos en Y=10 para que caiga al centro del mapa
  personaje.position.set(0, 10, 0); 
  
  scene.add(personaje);

  personaje.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  mixer = new THREE.AnimationMixer(personaje);

  // Asignación correcta de todas las animaciones (asegúrate de que los índices coincidan)
  idleAction = mixer.clipAction(gltf.animations[0]);
  walkAction = mixer.clipAction(gltf.animations[1]); // IMPORTANTE: Agregamos esta línea
  runAction = mixer.clipAction(gltf.animations[2]);
  attackAction = mixer.clipAction(gltf.animations[3]);

  attackAction.setLoop(THREE.LoopOnce);
  attackAction.clampWhenFinished = true;

  // Guardamos en el objeto acciones con los nombres que usas en controls()
  acciones["CamConEsp"] = idleAction;
  acciones["Caminando"] = walkAction;
  acciones["Poder"] = runAction;
  acciones["Ataque"] = attackAction;

  accionActual = idleAction;
  accionActual.play();
});
  const helper = new OctreeHelper(worldOctree);
  helper.visible = false;
  scene.add(helper);
  const gui = new GUI({ width: 200 });
  gui.add({ debug: false }, "debug").onChange(function (value) {
    helper.visible = value;
  });


function animate() {
  const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;
  for (let i = 0; i < STEPS_PER_FRAME; i++) {
    controls(deltaTime);

actualizarFisicaPersonaje();

updateSpheres(deltaTime);
  }
  if (mixer) mixer.update(deltaTime);
  if (personaje) {

  // PRIMERA PERSONA
  if (modoPrimeraPersona) {

    const cabeza = new THREE.Vector3(0, 2.2, 0);

    cabeza.applyQuaternion(personaje.quaternion);

    camera.position.copy(personaje.position).add(cabeza);

    const frente = new THREE.Vector3(0, 2, -10);

    frente.applyQuaternion(personaje.quaternion);

    camera.lookAt(
      personaje.position.clone().add(frente)
    );

  }

  // TERCERA PERSONA
  else {

    const offset = new THREE.Vector3(0, 2, -4);

    offset.applyQuaternion(personaje.quaternion);

    camera.position.copy(personaje.position).add(offset);

    const objetivo = personaje.position.clone();

    objetivo.y += 2;

    objetivo.y += rotacionVertical * 10;

camera.lookAt(objetivo);

  }

}
  renderer.render(scene, camera);
  stats.update();
}
