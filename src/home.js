import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import './home.css';

// A stylized right-handed helix: connected backbones and complementary rungs.
// This is a landing illustration, not an atom-resolved molecular structure.
function makeHelix() {
  const root = new THREE.Group();
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
  const materials = ['#537566', '#c3aa80', '#a1b6a0', '#d2a08a'].map(color => new THREE.MeshPhysicalMaterial({
    color, roughness:.32, metalness:.08, clearcoat:.28, clearcoatRoughness:.38,
  }));
  function bead(position, radius, material) {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.position.copy(position); mesh.scale.setScalar(radius);
    mesh.castShadow = mesh.receiveShadow = true; root.add(mesh);
  }
  function bond(a, b, radius, material) {
    const delta = b.clone().sub(a), mesh = new THREE.Mesh(cylinder, material);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.scale.set(radius, delta.length(), radius);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    mesh.castShadow = mesh.receiveShadow = true; root.add(mesh);
  }
  const strands = [[], []];
  for (let i = 0; i < 32; i++) {
    const angle = i * Math.PI * 2 / 10.5, y = (i - 15.5) * .29;
    for (let side = 0; side < 2; side++) {
      const theta = angle + side * Math.PI * 1.12;
      const p = new THREE.Vector3(Math.cos(theta), y, -Math.sin(theta));
      strands[side].push(p); bead(p, .15, materials[side]);
    }
    const a = strands[0][i], b = strands[1][i];
    const middle = a.clone().lerp(b, .5);
    for (let side = 0; side < 2; side++) {
      const edge = side ? b : a, mat = materials[i % 3 ? side + 2 : 3 - side];
      bond(edge, middle, .065, mat);
      // Small, joined lobes give the stacked base pairs depth without pretending
      // that each bead is a particular chemical element.
      for (const fraction of [.24, .48, .72]) bead(edge.clone().lerp(middle, fraction), .105, mat);
    }
  }
  strands.forEach((points, side) => {
    const curve = new THREE.CatmullRomCurve3(points);
    const backbone = new THREE.Mesh(new THREE.TubeGeometry(curve, 320, .095, 12, false), materials[side]);
    backbone.castShadow = backbone.receiveShadow = true; root.add(backbone);
  });
  return root;
}

function createHomeModel(container) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'low-power'}); }
  catch { container.dataset.render = 'unavailable'; return {setActive() {}}; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Stylized DNA double helix. Drag to rotate; press Space to pause or resume animation.');
  renderer.domElement.tabIndex = 0;
  container.append(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(36, 1, .1, 80);
  camera.position.set(0, 0, 17.5);
  const environment = new RoomEnvironment(), generator = new THREE.PMREMGenerator(renderer);
  const environmentMap = generator.fromScene(environment, .04);
  scene.environment = environmentMap.texture; scene.environmentIntensity = .5;
  environment.dispose(); generator.dispose();
  scene.add(new THREE.HemisphereLight('#fff7e4', '#798676', 1.5));
  const key = new THREE.DirectionalLight('#fff2d9', 3.2); key.position.set(-4, 6, 8);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {left:-6, right:6, top:6, bottom:-6, near:.1, far:35});
  key.shadow.normalBias = .025; key.shadow.bias = -.0002; scene.add(key);
  const rim = new THREE.DirectionalLight('#c7e3d8', 2.4); rim.position.set(4, 2, -4); scene.add(rim);
  const tilt = new THREE.Group(), helix = makeHelix();
  tilt.rotation.set(.05, 0, -.46); tilt.add(helix); scene.add(tilt);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, {enableZoom:false, enablePan:false, enableDamping:true, dampingFactor:.065, rotateSpeed:.55});
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let active = false, interacting = false, paused = false, previous = 0, elapsed = 0, raf;
  renderer.domElement.addEventListener('keydown', event => {
    if(event.code === 'Space') { event.preventDefault(); paused = !paused; }
  });
  controls.addEventListener('start', () => interacting = true);
  controls.addEventListener('end', () => interacting = false);
  function resize() {
    const {width, height} = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    // Keep the diagonal silhouette inside both a wide desktop and a short phone.
    camera.position.setLength(16.8 * Math.max(1, .8 / camera.aspect));
  }
  function frame(now) {
    if (!active) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - previous) / 1000); previous = now;
    if (document.hidden) return;
    if (!motion.matches && !paused && !interacting && !document.querySelector('dialog[open]')) {
      elapsed += dt; helix.rotation.y = elapsed * .14;
      tilt.position.y = Math.sin(elapsed * .32) * .09;
    }
    controls.update(dt); renderer.render(scene, camera);
    container.dataset.motion = motion.matches || paused ? 'still' : 'animated';
    container.dataset.rotation = helix.rotation.y.toFixed(4);
  }
  new ResizeObserver(resize).observe(container);
  container.dataset.render = 'ready';
  return {setActive(value) {
    if (value === active) return;
    active = value; cancelAnimationFrame(raf);
    if (active) { resize(); previous = performance.now(); raf = requestAnimationFrame(frame); }
  }};
}

export function createHome({onLessons, onExplore}) {
  const page = document.createElement('main');
  page.id = 'home-page'; page.hidden = true; page.setAttribute('aria-labelledby', 'home-title');
  page.innerHTML = `
    <div id="home-art"><img class="home-fallback" src="/favicon.svg" alt="Biology Zoomout concentric-circle mark"></div>
    <div class="home-content">
      <h1 id="home-title" tabindex="-1"><span>Biology</span><em>zoomout</em></h1>
      <div class="home-actions">
        <button id="home-lessons">Lessons <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 5h6l2 2 2-2h6v14h-6l-2 2-2-2H4Zm8 2v14"/></svg></button>
        <button id="home-explore">Zoom In <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></button>
      </div>
    </div>`;
  document.body.append(page);
  page.querySelector('#home-lessons').onclick = onLessons;
  page.querySelector('#home-explore').onclick = onExplore;
  let model;
  return {show(value, focus = false) {
    page.hidden = !value;
    if (value && !model) model = createHomeModel(page.querySelector('#home-art'));
    model?.setActive(value);
    if (value && focus) page.querySelector('#home-title').focus({preventScroll:true});
  }};
}
