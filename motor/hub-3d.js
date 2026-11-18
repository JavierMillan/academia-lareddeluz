/* =========================================================
   Motivo 3D de la portada del hub (Three.js).
   El motor no conoce constelaciones: el hub elige una escena con
   <body data-motivo3d="ondas|esfera">, y los colores salen de las
   variables CSS del tema (--accent-surface, --on-char).

   - "ondas":  dos voces que se turnan. Cintas de onda en perspectiva,
               como un piso de sonido; una voz habla y la otra escucha.
   - "esfera": la esfera cortada. Se abre al cargar y deja ver la luz
               de adentro; es la única fuente de luz de la portada.

   Progresivo: si WebGL o el CDN fallan, la portada queda como estaba.
   Respeta prefers-reduced-motion (un cuadro quieto), se pausa fuera
   de pantalla o con la pestaña oculta y limita el pixelRatio.
   ========================================================= */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const escena = document.body.dataset.motivo3d;
const slot = document.getElementById('heroSlot');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function color(nombre, respaldo) {
  const v = getComputedStyle(document.body).getPropertyValue(nombre).trim();
  try { return new THREE.Color(v || respaldo); } catch (e) { return new THREE.Color(respaldo); }
}

function montar(hero) {
  if (hero.querySelector('.hm-3d')) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return; }
  const movil = matchMedia('(max-width: 760px)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, movil ? 1.25 : 1.75));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'hm-3d';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);
  hero.classList.add('hm-3d-on', 'hm-3d-' + escena);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const acento = color('--accent-surface', '#c8102e');
  const tinta = color('--on-char', '#f2f0ec');
  const mundo = escena === 'ondas' ? ondas(scene, camera, acento, tinta, movil)
                                   : esfera(scene, camera, acento, tinta, movil);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width - 0.5;
      mouse.ty = (e.clientY - r.top) / r.height - 0.5;
    });
    hero.addEventListener('pointerleave', () => { mouse.tx = 0; mouse.ty = 0; });
  }

  function medir() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    mundo.encuadre(w, h);
    camera.updateProjectionMatrix();
  }
  medir();
  new ResizeObserver(medir).observe(hero);

  let visible = true, corriendo = false, t0 = performance.now();
  function cuadro(now) {
    if (!visible || document.hidden) { corriendo = false; return; }
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    mundo.paso((now - t0) / 1000, mouse);
    renderer.render(scene, camera);
    requestAnimationFrame(cuadro);
  }
  function arrancar() { if (!corriendo && !reduce) { corriendo = true; requestAnimationFrame(cuadro); } }

  if (reduce) {
    mundo.paso(6, mouse);
    renderer.render(scene, camera);
  } else {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) arrancar(); }).observe(hero);
    document.addEventListener('visibilitychange', arrancar);
    arrancar();
  }
  requestAnimationFrame(() => canvas.classList.add('is-on'));
}

/* ---------- Inglés · dos voces que se turnan ---------- */
function ondas(scene, camera, rojo, hueso, movil) {
  const filas = movil ? 16 : 26, puntos = movil ? 90 : 150;
  const ancho = 14, fondo = 9;
  const grupo = new THREE.Group();
  scene.add(grupo);
  scene.fog = new THREE.Fog(0x0a0a0a, 6, 15);
  const lineas = [];
  for (let i = 0; i < filas; i++) {
    const voz = i % 2;                       // 0 = voz roja, 1 = voz hueso
    const pos = new Float32Array(puntos * 3);
    for (let j = 0; j < puntos; j++) {
      pos[j * 3] = (j / (puntos - 1) - 0.5) * ancho;
      pos[j * 3 + 2] = -(i / (filas - 1)) * fondo;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({
      color: voz ? hueso : rojo, transparent: true, fog: true,
      opacity: voz ? 0.22 : 0.85 - (i / filas) * 0.35 });
    const linea = new THREE.Line(geo, mat);
    grupo.add(linea);
    lineas.push({ linea, voz, fila: i, semilla: Math.random() * 100 });
  }
  // turno de palabra: una voz sube mientras la otra baja (ciclo de 5.2 s)
  const turno = (t, voz) => {
    const fase = (t / 5.2 + (voz ? 0.5 : 0)) % 1;
    return 0.25 + 0.75 * Math.pow(Math.sin(Math.PI * fase), 2);
  };
  return {
    encuadre(w, h) {
      camera.position.set(0, movil ? 2.2 : 1.7, 6.2);
      camera.lookAt(0, -0.2, -3.2);
      // el piso de sonido vive en la parte baja del banner
      camera.setViewOffset(w, h, 0, -h * (movil ? 0.36 : 0.22), w, h);
    },
    paso(t, mouse) {
      const entrada = Math.min(1, t / 1.6);
      const abre = 1 - Math.pow(1 - entrada, 3);
      grupo.rotation.y = mouse.x * 0.18;
      grupo.rotation.x = mouse.y * 0.06;
      for (const l of lineas) {
        const pos = l.linea.geometry.attributes.position.array;
        const fuerza = turno(t, l.voz) * abre;
        const retraso = l.fila * 0.07;      // la onda viaja hacia el fondo
        for (let j = 0; j < pos.length / 3; j++) {
          const x = pos[j * 3];
          const env = Math.exp(-Math.pow(x / 3.4, 2));          // la voz se concentra al centro
          const habla = Math.sin(x * 2.1 + t * 3.2 - retraso * 4 + l.semilla) * 0.55 +
                        Math.sin(x * 5.3 - t * 4.7 + l.semilla * 2) * 0.25 +
                        Math.sin(x * 11 + t * 7.9 + retraso) * 0.12;
          pos[j * 3 + 1] = habla * env * fuerza * 0.62;
        }
        l.linea.geometry.attributes.position.needsUpdate = true;
      }
    }
  };
}

/* ---------- DTMM · la esfera cortada ---------- */
function esfera(scene, camera, sesame, crema, movil) {
  const g = new THREE.Group();
  scene.add(g);
  const carbon = new THREE.Color('#241d16');
  // dos mitades: lo que estaba oculto
  const piel = new THREE.MeshStandardMaterial({ color: carbon, roughness: 0.82, metalness: 0.08, side: THREE.DoubleSide });
  const arriba = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), piel);
  const abajo = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), piel);
  // filo de luz en el corte
  const filo = new THREE.Mesh(new THREE.TorusGeometry(1, 0.008, 8, 128),
    new THREE.MeshBasicMaterial({ color: sesame, transparent: true, opacity: 0.9 }));
  filo.rotation.x = Math.PI / 2;
  const tapaArriba = new THREE.Group(); tapaArriba.add(arriba);
  const tapaAbajo = new THREE.Group(); tapaAbajo.add(abajo, filo);
  // el núcleo: la única fuente de luz
  const nucleo = new THREE.Mesh(new THREE.SphereGeometry(0.34, 48, 24),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#f6c06a') }));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 16),
    new THREE.MeshBasicMaterial({ color: sesame, transparent: true, opacity: 0.14, depthWrite: false }));
  const luz = new THREE.PointLight(sesame, 9, 6, 1.6);
  const relleno = new THREE.HemisphereLight(crema, 0x000000, 0.32);
  const contraluz = new THREE.DirectionalLight(crema, 0.55);
  contraluz.position.set(-3, 2.5, -2.5);
  scene.add(contraluz);
  g.add(tapaArriba, tapaAbajo, nucleo, halo, luz);
  scene.add(relleno);
  // meridianos finos, como plano técnico
  const meridianos = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.SphereGeometry(1.002, 12, 8), 1),
    new THREE.LineBasicMaterial({ color: sesame, transparent: true, opacity: 0.12 }));
  tapaArriba.add(meridianos);
  g.rotation.z = -0.38;

  return {
    encuadre(w, h) {
      camera.position.set(0, 0.2, movil ? 13 : 8.4);
      camera.lookAt(0, 0, 0);
      // la esfera vive a la derecha, entre el texto y el borde
      // escritorio: en el hueco entre el título y la columna de la derecha
      const dx = movil ? -w * 0.4 : -w * 0.035;
      camera.setViewOffset(w, h, dx, movil ? h * 0.42 : -h * 0.04, w, h);
    },
    paso(t, mouse) {
      const e = Math.min(1, Math.max(0, (t - 0.3) / 2.2));
      const abre = e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2;   // in-out de la marca
      const respira = Math.sin(t * 0.7) * 0.04;
      tapaArriba.position.y = (0.26 + respira) * abre;
      tapaArriba.rotation.z = 0.16 * abre;
      tapaArriba.rotation.x = -0.12 * abre;
      tapaAbajo.position.y = -0.06 * abre;
      const brillo = abre * (0.92 + Math.sin(t * 1.3) * 0.08);
      nucleo.scale.setScalar(0.4 + 0.6 * abre);
      halo.material.opacity = 0.14 * brillo;
      luz.intensity = 9 * brillo;
      g.rotation.y = t * 0.12 + mouse.x * 0.5;
      g.rotation.x = mouse.y * 0.25;
    }
  };
}

if (escena && slot) {
  const buscar = () => { const hero = slot.querySelector('.hub-hero'); if (hero) montar(hero); };
  buscar();
  new MutationObserver(buscar).observe(slot, { childList: true });
}
