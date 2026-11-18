/* =========================================================
   Academia · cielo-red en Three.js
   Cada punto es un Nodo; las líneas son la red; los destellos
   son luz que viaja de nodo en nodo.
   Config desde la etiqueta <script data-sky-host data-sky-tint data-sky-base>.
   Si el CDN o WebGL fallan, no pasa nada: la página sigue igual.
   ========================================================= */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const cfg = document.querySelector('script[data-sky-host]');
const HOST = (cfg && cfg.dataset.skyHost) || 'body';
const TINT = (cfg && cfg.dataset.skyTint) || '#e4cd85';
const BASE = (cfg && cfg.dataset.skyBase) || '#f9f4e3';
const DENSITY = parseFloat((cfg && cfg.dataset.skyDensity) || '1');

const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
const small = Math.min(innerWidth, innerHeight) < 600 || matchMedia('(pointer: coarse)').matches;

function waitFor(sel) {
  return new Promise((res) => {
    const found = document.querySelector(sel);
    if (found) return res(found);
    const mo = new MutationObserver(() => {
      const el = document.querySelector(sel);
      if (el) { mo.disconnect(); res(el); }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { mo.disconnect(); res(null); }, 10000);
  });
}

// aleatorio con semilla: el cielo es el mismo en cada visita
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function init() {
  const host = HOST === 'body' ? document.body : await waitFor(HOST);
  if (!host) return;
  const fixed = host === document.body;

  const canvas = document.createElement('canvas');
  canvas.className = 'am-sky' + (fixed ? ' am-sky--fixed' : '');
  canvas.setAttribute('aria-hidden', 'true');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !small, powerPreference: 'low-power' });
  } catch (e) { return; }
  host.prepend(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.25 : 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 220);
  camera.position.set(0, 0, 30);
  const group = new THREE.Group();
  scene.add(group);

  /* ---- nodos ---- */
  const rand = rng(1618);
  const N = Math.round((small ? 85 : 170) * DENSITY);
  const pos = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const phase = new Float32Array(N);
  const accent = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (rand() - 0.5) * 120;
    pos[i * 3 + 1] = (rand() - 0.5) * 70;
    pos[i * 3 + 2] = -55 + rand() * 66;
    const big = rand() < 0.08;
    size[i] = big ? 3.2 + rand() * 1.6 : 1 + rand() * 1.4;
    phase[i] = rand();
    accent[i] = big || rand() < 0.18 ? 1 : 0;
  }

  const uniforms = {
    uTime: { value: 0 },
    uPR: { value: renderer.getPixelRatio() },
    uBase: { value: new THREE.Color(BASE) },
    uTint: { value: new THREE.Color(TINT) },
    uGlow: { value: 1 },
  };
  const vert = /* glsl */`
    attribute float aSize; attribute float aPhase; attribute float aAccent;
    uniform float uTime; uniform float uPR;
    varying float vAlpha; varying float vAccent;
    void main(){
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mv;
      float tw = 0.62 + 0.38 * sin(uTime * (0.6 + aPhase) + aPhase * 6.2831);
      gl_PointSize = aSize * uPR * (190.0 / max(-mv.z, 1.0));
      vAlpha = tw * smoothstep(95.0, 22.0, -mv.z) * smoothstep(0.5, 6.0, -mv.z);
      vAccent = aAccent;
    }`;
  const frag = /* glsl */`
    uniform vec3 uBase; uniform vec3 uTint; uniform float uGlow;
    varying float vAlpha; varying float vAccent;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      float halo = smoothstep(0.5, 0.0, d);
      float core = smoothstep(0.16, 0.0, d);
      vec3 c = mix(uBase, uTint, vAccent);
      gl_FragColor = vec4(c, (halo * 0.42 + core * 0.75) * vAlpha * uGlow);
    }`;
  const pointMat = new THREE.ShaderMaterial({
    uniforms, vertexShader: vert, fragmentShader: frag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pg.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  pg.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  pg.setAttribute('aAccent', new THREE.BufferAttribute(accent, 1));
  group.add(new THREE.Points(pg, pointMat));

  /* ---- red: cada nodo se une a sus vecinos cercanos ---- */
  const edges = [];
  const adj = Array.from({ length: N }, () => []);
  const key = new Set();
  const MAXD2 = 15 * 15;
  for (let i = 0; i < N; i++) {
    const near = [];
    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const dx = pos[i * 3] - pos[j * 3], dy = pos[i * 3 + 1] - pos[j * 3 + 1], dz = pos[i * 3 + 2] - pos[j * 3 + 2];
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < MAXD2) near.push([d2, j]);
    }
    near.sort((a, b) => a[0] - b[0]);
    for (const [, j] of near.slice(0, 2)) {
      const k = i < j ? i + ':' + j : j + ':' + i;
      if (key.has(k)) continue;
      key.add(k); edges.push([i, j]); adj[i].push(j); adj[j].push(i);
    }
  }
  const lp = new Float32Array(edges.length * 6);
  const lc = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], e) => {
    for (let k = 0; k < 3; k++) { lp[e * 6 + k] = pos[a * 3 + k]; lp[e * 6 + 3 + k] = pos[b * 3 + k]; }
    // las líneas lejanas se apagan: profundidad sin niebla
    const fa = THREE.MathUtils.clamp((pos[a * 3 + 2] + 55) / 66, 0.15, 1);
    const fb = THREE.MathUtils.clamp((pos[b * 3 + 2] + 55) / 66, 0.15, 1);
    for (let k = 0; k < 3; k++) { lc[e * 6 + k] = fa; lc[e * 6 + 3 + k] = fb; }
  });
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.16, depthWrite: false,
    blending: THREE.AdditiveBlending, color: new THREE.Color(TINT).lerp(new THREE.Color(BASE), 0.55),
  });
  group.add(new THREE.LineSegments(lg, lineMat));

  /* ---- luz que viaja por la red ---- */
  const walkable = [...Array(N).keys()].filter((i) => adj[i].length);
  const P = walkable.length ? (small ? 5 : 9) : 0;
  const pulses = [];
  const pp = new Float32Array(P * 3);
  const ps = new Float32Array(P).fill(small ? 4.2 : 3.6);
  const pph = new Float32Array(P).fill(0.25);
  const pac = new Float32Array(P).fill(1);
  for (let i = 0; i < P; i++) {
    const a = walkable[Math.floor(rand() * walkable.length)];
    pulses.push({ a, b: adj[a][0], t: rand(), speed: 0.25 + rand() * 0.3 });
  }
  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  pulseGeo.setAttribute('aSize', new THREE.BufferAttribute(ps, 1));
  pulseGeo.setAttribute('aPhase', new THREE.BufferAttribute(pph, 1));
  pulseGeo.setAttribute('aAccent', new THREE.BufferAttribute(pac, 1));
  if (P) group.add(new THREE.Points(pulseGeo, pointMat));

  function stepPulses(dt) {
    for (let i = 0; i < P; i++) {
      const p = pulses[i];
      p.t += dt * p.speed;
      if (p.t >= 1) { // llega al nodo y sigue a un vecino distinto
        const opts = adj[p.b].filter((n) => n !== p.a);
        p.a = p.b; p.b = (opts.length ? opts : adj[p.b])[Math.floor(Math.random() * (opts.length || adj[p.b].length))];
        p.t = 0;
      }
      const e = p.t * p.t * (3 - 2 * p.t);
      for (let k = 0; k < 3; k++) pp[i * 3 + k] = pos[p.a * 3 + k] + (pos[p.b * 3 + k] - pos[p.a * 3 + k]) * e;
    }
    pulseGeo.attributes.position.needsUpdate = true;
  }
  stepPulses(0);

  /* ---- tamaño ---- */
  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // en pantallas verticales acercamos la cámara para no perder densidad
    camera.position.z = w / h < 0.8 ? 22 : 30;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(() => { resize(); if (!running) render(); }).observe(canvas);

  /* ---- interacción ---- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mouse.tx = e.clientX / innerWidth - 0.5;
    mouse.ty = e.clientY / innerHeight - 0.5;
  }, { passive: true });

  const tint = new THREE.Color(TINT), tintTarget = new THREE.Color(TINT);
  const lineTint = lineMat.color.clone(), lineTarget = lineMat.color.clone();
  let warp = 0, warpTarget = 0, glow = 1, glowTarget = 1;

  const api = {
    setTint(hex) {
      tintTarget.set(hex || TINT);
      lineTarget.copy(tintTarget).lerp(new THREE.Color(BASE), 0.55);
      glowTarget = hex && hex !== TINT ? 1.25 : 1;
      if (!running) { uniforms.uTint.value.copy(tintTarget); lineMat.color.copy(lineTarget); render(); }
    },
    warp() { warpTarget = 1; },
  };
  window.academiaSky = api;

  /* ---- ciclo ---- */
  const clock = new THREE.Clock();
  let raf = 0, running = false, inView = true;

  function render() { renderer.render(scene, camera); }

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    uniforms.uTime.value = t;

    mouse.x += (mouse.tx - mouse.x) * 0.045;
    mouse.y += (mouse.ty - mouse.y) * 0.045;
    const scroll = fixed ? Math.min(scrollY / Math.max(innerHeight, 1), 2) : 0;

    tint.lerp(tintTarget, 0.06); uniforms.uTint.value.copy(tint);
    lineTint.lerp(lineTarget, 0.06); lineMat.color.copy(lineTint);
    glow += (glowTarget - glow) * 0.06; uniforms.uGlow.value = glow;

    warp += (warpTarget - warp) * 0.05;
    group.rotation.y = t * 0.012 + mouse.x * 0.12;
    group.rotation.x = mouse.y * 0.08 + scroll * 0.05;
    camera.position.x = mouse.x * 4;
    camera.position.y = -mouse.y * 3 - scroll * 5;
    camera.position.z -= warp * 1.4; // viaje hacia la constelación
    camera.lookAt(0, -scroll * 4, -12);

    stepPulses(dt);
    render();
  }

  function sync() {
    const should = !mqReduce.matches && !document.hidden && inView;
    if (should && !running) { running = true; clock.getDelta(); raf = requestAnimationFrame(frame); }
    else if (!should && running) { running = false; cancelAnimationFrame(raf); }
    if (!should) render();
  }
  document.addEventListener('visibilitychange', sync);
  mqReduce.addEventListener?.('change', sync);
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }).observe(canvas);
  // al volver con el botón atrás, el cielo regresa a su lugar
  addEventListener('pageshow', (e) => { if (e.persisted) { warp = warpTarget = 0; resize(); api.setTint(null); } });

  render();
  sync();
  requestAnimationFrame(() => canvas.classList.add('is-on'));
}

init().catch(() => { /* el cielo es decorativo: nunca rompe la página */ });
