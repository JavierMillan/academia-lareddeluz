# Academy Curriculum Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the course-card grids in both Academy hubs with a compact, accessible curriculum explorer that preserves free navigation, shows progress, and recommends the next class.

**Architecture:** Add a small DOM-independent `hub-model.js` beside the existing shared hub renderer. The model will calculate destinations, materials, progress, and the recommended class; `hub.js` will render the themed shell, compact hero, course tabs, curriculum categories, and lesson rows from those results. Both constellations keep loading the same engine and continue using `constelacion.json`, `clases.json`, and the async `Progreso` API.

**Tech Stack:** Plain JavaScript (UMD/CommonJS-compatible model), HTML, CSS, Node `assert`, Playwright with Edge, GitHub Pages build scripts.

---

## File map

| File | Responsibility |
|---|---|
| `motor/hub-model.js` | Pure curriculum calculations; no DOM or storage access |
| `motor/hub.js` | Rendering, navigation, responsive category behavior, progress event wiring |
| `motor/hub.css` | Shared hub layout and curriculum explorer presentation |
| `cursos/dtmm/index.html` | DTMM hub slots and shared engine script order |
| `cursos/ingles/index.html` | Inglés hub slots and shared engine script order |
| `scripts/test-hub-model.cjs` | Unit tests for recommendations, materials, and progress summaries |
| `scripts/test-academy-hubs-structure.cjs` | Source-contract assertions shared by both hubs |
| `scripts/test-academy-hubs-e2e.cjs` | Browser behavior, responsive layout, accessibility, and screenshots |
| `scripts/test-monorepo-boundaries.cjs` | Ensures the new engine file and test remain centralized and run in CI |
| `.github/workflows/deploy-pages.yml` | Runs the new model test before deployment |

Do not split the renderer into a framework or add a bundler. `hub.js` is already the established browser entry point; only deterministic calculations move into `hub-model.js`.

---

### Task 1: Add the pure curriculum model

**Files:**
- Create: `motor/hub-model.js`
- Create: `scripts/test-hub-model.cjs`
- Modify: `scripts/test-monorepo-boundaries.cjs:18-45`
- Modify: `.github/workflows/deploy-pages.yml:31-42`

- [ ] **Step 1: Write the failing model test**

Create `scripts/test-hub-model.cjs` with fixtures that exercise the complete public API:

```js
const assert = require('node:assert/strict');
const Model = require('../motor/hub-model.js');

const cfg = { capacidades: { grabaciones: true, recursos: true } };
const data = {
  filas: [
    { id: 'inicio', clases: [
      { id: 'uno', deck: 'uno.html', titulo: 'Uno' },
      { id: 'dos', deck: 'dos.html', titulo: 'Dos',
        grabaciones: [{ url: 'https://video.example/dos' }],
        recursos: [{ titulo: 'Guía', url: 'guia.html' }] }
    ]},
    { id: 'final', clases: [
      { id: 'tres', deck: 'tres.html', titulo: 'Tres' },
      { id: 'cuatro', titulo: 'Próximamente' }
    ]}
  ]
};

assert.deepEqual(Model.grabacionesDe(data.filas[0].clases[1]),
  [{ url: 'https://video.example/dos' }]);
assert.equal(Model.destino(cfg, data.filas[0].clases[1]), 'clase.html?id=dos');
assert.deepEqual(Model.materialesDe(cfg, data.filas[0].clases[1]), [
  { tipo: 'presentacion', texto: 'Presentación' },
  { tipo: 'grabacion', texto: 'Grabación' },
  { tipo: 'recursos', texto: '1 recurso' }
]);

const vacio = Model.resumenCurso(cfg, data, { clases: {}, ultima: null });
assert.deepEqual(
  { total: vacio.total, vistas: vacio.vistas, porcentaje: vacio.porcentaje,
    recomendada: vacio.recomendada.id },
  { total: 3, vistas: 0, porcentaje: 0, recomendada: 'uno' }
);

const progreso = { ultima: 'uno', clases: {
  uno: { estado: 'visto', ts: '2026-09-01T10:00:00Z' },
  dos: { estado: 'curso', ts: '2026-09-01T12:00:00Z' }
}};
const activo = Model.resumenCurso(cfg, data, progreso);
assert.equal(activo.recomendada.id, 'dos');
assert.equal(activo.vistas, 1);
assert.equal(activo.porcentaje, 33);
assert.deepEqual(Model.resumenFila(cfg, data.filas[0], progreso),
  { total: 2, vistas: 1, porcentaje: 50 });

const completo = { ultima: 'tres', clases: {
  uno: { estado: 'visto' }, dos: { estado: 'visto' }, tres: { estado: 'visto' }
}};
assert.equal(Model.resumenCurso(cfg, data, completo).recomendada.id, 'tres');
assert.equal(Model.estadoDe(null, 'uno'), 'nuevo');
assert.equal(Model.estadoDe(progreso, 'dos'), 'curso');
assert.deepEqual(Model.resumenCurso(cfg, { filas: [] }, { clases: {}, ultima: null }),
  { total: 0, vistas: 0, porcentaje: 0, recomendada: null });

console.log('hub curriculum model: PASS');
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node scripts/test-hub-model.cjs
```

Expected: FAIL with `Cannot find module '../motor/hub-model.js'`.

- [ ] **Step 3: Implement the model minimally**

Create `motor/hub-model.js` as a browser global plus CommonJS export:

```js
(function (global) {
  'use strict';

  function grabacionesDe(clase) {
    var lista = clase.grabaciones && clase.grabaciones.length
      ? clase.grabaciones : (clase.grabacion ? [{ url: clase.grabacion }] : []);
    return lista.filter(function (grabacion) { return grabacion && grabacion.url; });
  }

  function tieneExtras(cfg, clase) {
    var capacidades = cfg.capacidades || {};
    var grabaciones = capacidades.grabaciones !== false && grabacionesDe(clase).length;
    var recursos = capacidades.recursos !== false && clase.recursos && clase.recursos.length;
    return Boolean(grabaciones || recursos);
  }

  function destino(cfg, clase) {
    if (tieneExtras(cfg, clase)) return 'clase.html?id=' + encodeURIComponent(clase.id);
    return clase.deck || null;
  }

  function materialesDe(cfg, clase) {
    var capacidades = cfg.capacidades || {};
    var materiales = [];
    if (clase.deck) materiales.push({ tipo: 'presentacion', texto: 'Presentación' });
    if (capacidades.grabaciones !== false) {
      var grabaciones = grabacionesDe(clase).length;
      if (grabaciones) materiales.push({ tipo: 'grabacion',
        texto: grabaciones === 1 ? 'Grabación' : grabaciones + ' grabaciones' });
    }
    if (capacidades.recursos !== false && clase.recursos && clase.recursos.length) {
      materiales.push({ tipo: 'recursos', texto: clase.recursos.length + ' recurso' +
        (clase.recursos.length === 1 ? '' : 's') });
    }
    return materiales;
  }

  function estadoDe(progreso, id) {
    var registro = progreso && progreso.clases ? progreso.clases[id] : null;
    return registro && registro.estado ? registro.estado : 'nuevo';
  }

  function clasesPublicadas(cfg, data) {
    var salida = [];
    (data.filas || []).forEach(function (fila) {
      (fila.clases || []).forEach(function (clase) {
        if (destino(cfg, clase)) salida.push(clase);
      });
    });
    return salida;
  }

  function contar(cfg, clases, progreso) {
    var publicadas = clases.filter(function (clase) { return destino(cfg, clase); });
    var vistas = publicadas.filter(function (clase) {
      return estadoDe(progreso, clase.id) === 'visto';
    }).length;
    return { total: publicadas.length, vistas: vistas,
      porcentaje: publicadas.length ? Math.round(vistas / publicadas.length * 100) : 0 };
  }

  function resumenFila(cfg, fila, progreso) {
    return contar(cfg, fila.clases || [], progreso);
  }

  function resumenCurso(cfg, data, progreso) {
    var clases = clasesPublicadas(cfg, data);
    var resumen = contar(cfg, clases, progreso);
    var enCurso = clases.filter(function (clase) {
      return estadoDe(progreso, clase.id) === 'curso';
    }).sort(function (a, b) {
      var ar = progreso.clases[a.id] || {}, br = progreso.clases[b.id] || {};
      return String(br.ts || '').localeCompare(String(ar.ts || ''));
    });
    var ultima = clases.find(function (clase) { return progreso && clase.id === progreso.ultima; });
    var pendiente = clases.find(function (clase) { return estadoDe(progreso, clase.id) !== 'visto'; });
    resumen.recomendada = enCurso[0] || ultima || pendiente || clases[0] || null;
    return resumen;
  }

  var HubModel = { grabacionesDe: grabacionesDe, tieneExtras: tieneExtras,
    destino: destino, materialesDe: materialesDe, estadoDe: estadoDe,
    resumenFila: resumenFila, resumenCurso: resumenCurso };

  global.HubModel = HubModel;
  if (typeof module !== 'undefined' && module.exports) module.exports = HubModel;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run the unit test and verify GREEN**

Run `node scripts/test-hub-model.cjs`.

Expected: `hub curriculum model: PASS`.

- [ ] **Step 5: Register the engine file and test in CI**

In `scripts/test-monorepo-boundaries.cjs`, add `hub-model.js` to the centralized engine list and `node scripts/test-hub-model.cjs` to the required workflow commands:

```js
for (const file of ['deck.css', 'deck.js', 'hub.css', 'hub-model.js']) {
```

```js
'node scripts/test-motor-hub.cjs',
'node scripts/test-hub-model.cjs',
'node scripts/test-progreso.cjs',
```

In `.github/workflows/deploy-pages.yml`, place the matching command after `test-motor-hub.cjs`:

```yaml
node scripts/test-motor-hub.cjs
node scripts/test-hub-model.cjs
node scripts/test-progreso.cjs
```

- [ ] **Step 6: Verify boundaries and commit**

Run:

```bash
node scripts/test-hub-model.cjs
node scripts/test-monorepo-boundaries.cjs
```

Expected: both tests print `PASS`.

Commit:

```bash
git add motor/hub-model.js scripts/test-hub-model.cjs scripts/test-monorepo-boundaries.cjs .github/workflows/deploy-pages.yml
git commit -m "feat: add academy curriculum model"
```

---

### Task 2: Integrate the model and compact course hero

**Files:**
- Modify: `cursos/dtmm/index.html:34-43`
- Modify: `cursos/ingles/index.html:31-41`
- Modify: `motor/hub.js:54-200,406-480`
- Modify: `motor/hub.css:54-90`
- Modify: `scripts/test-academy-hubs-structure.cjs:17-52`
- Test: `scripts/test-hub-model.cjs`

- [ ] **Step 1: Write failing source-contract assertions**

Inside the loop over both hub HTML files in `scripts/test-academy-hubs-structure.cjs`, add:

```js
assert.match(html, /id="courseTabs"/, `${name} needs curriculum tabs`);
assert.match(html, /assets\/motor\/hub-model\.js[\s\S]*assets\/motor\/hub\.js/,
  `${name} must load the model before the renderer`);
```

After the existing `motorJs` assertions, add:

```js
assert.match(motorJs, /HubModel\.resumenCurso/,
  'The hero must derive its recommendation from the shared model');
assert.doesNotMatch(motorJs, /function\s+grabacionesDe/,
  'Curriculum calculations belong in hub-model.js');
```

- [ ] **Step 2: Run the structure test and verify RED**

Run `node scripts/test-academy-hubs-structure.cjs`.

Expected: FAIL because `courseTabs` and `hub-model.js` are absent.

- [ ] **Step 3: Add the shared slots and script order**

In both `cursos/dtmm/index.html` and `cursos/ingles/index.html`, make the main and script tail follow this structure:

```html
<main>
  <div id="heroSlot"></div>
  <nav class="wrap pad course-tabs" id="courseTabs" aria-label="Contenido del curso"></nav>
  <div class="wrap pad rows-area" id="rows"></div>
</main>
```

```html
<script src="assets/motor/progreso.js"></script>
<script src="assets/motor/hub-model.js"></script>
<script src="assets/motor/hub.js"></script>
```

- [ ] **Step 4: Refactor `hub.js` to consume raw progress and `HubModel`**

At the start of the IIFE, bind the model and fail clearly if script order is wrong:

```js
var Modelo = window.HubModel;
if (!Modelo) throw new Error('Falta assets/motor/hub-model.js');
```

Delete the local `grabacionesDe`, `tieneExtras`, `destino`, and `claseDestacada` functions. Replace their callers with `Modelo.grabacionesDe`, `Modelo.tieneExtras`, `Modelo.destino`, and `Modelo.estadoDe`.

Change `leerProgreso` so it preserves timestamps and `ultima`:

```js
function leerProgreso(cfg) {
  if ((cfg.capacidades || {}).progreso === false) return Promise.resolve(null);
  if (typeof Progreso === 'undefined' || !Progreso.disponible()) return Promise.resolve(null);
  return Progreso.delCurso(cfg.id).catch(function () { return null; });
}
```

Replace the existing featured renderer with a progress-aware compact hero:

Also add `comenzar: 'Comenzar'` to the `TEXTOS` defaults near the top of `hub.js`, so themes may override the label without adding course-specific conditions.

```js
function destacado(cfg, data, progreso) {
  var resumen = Modelo.resumenCurso(cfg, data, progreso || { clases: {}, ultima: null });
  var clase = resumen.recomendada;
  var nombre = cfg.figura && cfg.figura.titulo ? cfg.figura.titulo : '';
  var estado = clase ? Modelo.estadoDe(progreso, clase.id) : 'nuevo';
  var accion = estado === 'curso' ? txt(cfg, 'continuar') :
    estado === 'visto' ? txt(cfg, 'repasar') : txt(cfg, 'comenzar');
  var progresoVisible = progreso ?
    '<div class="course-progress" aria-label="' + resumen.vistas + ' de ' + resumen.total +
      ' clases vistas"><span>' + resumen.vistas + ' de ' + resumen.total + ' vistas</span>' +
      '<div class="bar"><i style="width:' + resumen.porcentaje + '%"></i></div></div>' : '';
  var recomendacion = clase ?
    '<a class="featured-class" href="' + esc(Modelo.destino(cfg, clase)) +
      '" data-clase="' + esc(clase.id) + '">' +
      '<span class="featured-label">Tu siguiente paso</span>' +
      '<h2>' + esc(clase.titulo) + '</h2>' +
      '<p>' + esc(clase.resumen || '') + '</p>' +
      '<span class="featured-go">' + esc(accion) + ' →</span></a>' :
    '<div class="featured-class empty"><span class="featured-label">Contenido</span>' +
      '<h2>Próximamente</h2></div>';

  return '<section class="hub-hero" id="top">' +
    '<div class="constellation-motif" aria-hidden="true"></div>' +
    '<div class="hub-identity"><div class="constellation-avatar">' + figura(cfg) + '</div>' +
      (nombre ? '<span class="constellation-name">' + esc(nombre) + '</span>' : '') +
      '<h1>' + esc(cfg.nombre) + '</h1><p>' + esc(cfg.resumen || '') + '</p>' + progresoVisible + '</div>' +
    recomendacion + '</section>';
}
```

Render course tabs from configuration rather than course identity:

```js
function navegacionCurso(cfg) {
  return (cfg.menu || []).map(function (item) {
    var activo = item.despliega === 'filas' ? ' current' : '';
    return '<a class="course-tab' + activo + '" href="' + esc(item.href) + '"' +
      (activo ? ' aria-current="page"' : '') + '>' + esc(item.texto) + '</a>';
  }).join('');
}
```

During startup, call:

```js
if (heroSlot) heroSlot.innerHTML = destacado(cfg, data, progreso);
var courseTabs = document.getElementById('courseTabs');
if (courseTabs) courseTabs.innerHTML = navegacionCurso(cfg);
```

- [ ] **Step 5: Add compact hero and tab styles**

Replace the current hero sizing and add tabs in `motor/hub.css`:

```css
.hub-hero{position:relative;isolation:isolate;min-height:0;
  display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);
  gap:clamp(1.5rem,4vw,4rem);align-items:center;
  padding:clamp(2rem,5vw,4rem) max(clamp(1.25rem,5vw,5rem),calc((100vw - 1320px)/2));
  border-bottom:1px solid var(--line-d);overflow:hidden}
.course-progress{max-width:25rem;margin-top:1.25rem;font-family:'Martian Mono',monospace;
  color:var(--on-char-mute);font-size:.65rem;letter-spacing:.1em;text-transform:uppercase}
.course-progress .bar{height:4px;margin-top:.55rem;border-radius:99px;background:var(--line-d2);overflow:hidden}
.course-progress .bar i{display:block;height:100%;background:var(--accent-surface);border-radius:inherit}
.course-tabs{display:flex;gap:1.8rem;padding-top:1.25rem;padding-bottom:.4rem;
  border-bottom:1px solid var(--line-d)}
.course-tab{position:relative;padding:.75rem 0;color:var(--on-char-mute);text-decoration:none;
  font:600 .72rem/1 'Martian Mono',monospace;letter-spacing:.14em;text-transform:uppercase}
.course-tab.current,.course-tab:hover{color:var(--on-char)}
.course-tab.current::after{content:"";position:absolute;left:0;right:0;bottom:-.45rem;height:2px;
  background:var(--accent-surface)}
.course-tab:focus-visible{outline:2px solid var(--accent-text);outline-offset:4px}
```

- [ ] **Step 6: Verify hero integration and commit**

Run:

```bash
node scripts/test-hub-model.cjs
node scripts/test-academy-hubs-structure.cjs
node scripts/build-academy.cjs --out .artifacts/site
```

Expected: tests print `PASS`; build reports two hubs and no missing engine file.

Commit:

```bash
git add cursos/dtmm/index.html cursos/ingles/index.html motor/hub.js motor/hub.css scripts/test-academy-hubs-structure.cjs
git commit -m "feat: add progress-aware academy hero"
```

---

### Task 3: Replace cards with curriculum categories and lesson rows

**Files:**
- Modify: `motor/hub.js:78-161,426-435,461-470`
- Modify: `motor/hub.css:280-417,492-517`
- Modify: `scripts/test-motor-hub.cjs:150-end`
- Modify: `scripts/test-academy-hubs-e2e.cjs:31-78`

- [ ] **Step 1: Write failing source and browser assertions**

In `scripts/test-motor-hub.cjs`, replace the old grid contract with:

```js
assert.match(hubCss, /\.lesson-list\{/, 'Classes must use a compact lesson list');
assert.match(hubCss, /\.lesson-row\{/, 'Each class must render as a curriculum row');
assert.doesNotMatch(hubCss, /\.deck-grid\{/, 'The card grid must be removed');
assert.doesNotMatch(hubCss, /\.deck-card\{/, 'Large course cards must be removed');
```

In `scripts/test-academy-hubs-e2e.cjs`, change the initial locator and collected elements:

```js
await page.locator('.lesson-row').first().waitFor();
```

```js
const lessons=[...document.querySelectorAll('.lesson-row')];
```

Assert curriculum semantics:

```js
assert.ok(await page.locator('.curriculum-section').count()>=1,
  `${name} must render curriculum categories`);
assert.ok(await page.locator('.lesson-row[href]').count()>=1,
  `${name} must keep published lessons freely navigable`);
assert.equal(await page.locator('.deck-card').count(),0,
  `${name} must not render the retired card grid`);
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
node scripts/test-motor-hub.cjs
node scripts/test-academy-hubs-e2e.cjs
```

Expected: the static test fails on `.lesson-list`; browser test fails waiting for `.lesson-row`.

- [ ] **Step 3: Implement material chips and lesson rows**

Replace `tarjeta` with `filaClase` in `motor/hub.js`:

```js
function chipsMateriales(cfg, clase) {
  var iconos = { presentacion: '▤', grabacion: '▶', recursos: '⌘' };
  return Modelo.materialesDe(cfg, clase).map(function (material) {
    return '<span class="material ' + esc(material.tipo) + '"><span aria-hidden="true">' +
      iconos[material.tipo] + '</span> ' + esc(material.texto) + '</span>';
  }).join('');
}

function filaClase(cfg, clase, indice, progreso) {
  var url = Modelo.destino(cfg, clase);
  var estado = Modelo.estadoDe(progreso, clase.id);
  var soon = !url;
  var clases = ['lesson-row', estado];
  if (soon) clases.push('soon');
  var accion = soon ? txt(cfg, 'proximamente') : estado === 'visto' ? txt(cfg, 'repasar') :
    estado === 'curso' ? txt(cfg, 'continuar') : txt(cfg, 'abrir');
  var numero = String(indice + 1).padStart(2, '0');
  var estadoTexto = estado === 'visto' ? 'Vista' : estado === 'curso' ? 'En curso' : 'Sin comenzar';
  var apertura = soon ? '<div' : '<a href="' + esc(url) + '" data-clase="' + esc(clase.id) + '"';
  var cierre = soon ? '</div>' : '</a>';
  return apertura + ' class="' + clases.join(' ') + '">' +
    '<span class="lesson-status" aria-hidden="true">' + (estado === 'visto' ? '✓' : numero) + '</span>' +
    '<span class="sr-only">' + estadoTexto + '. </span>' +
    '<span class="lesson-copy"><span class="lesson-kicker">' + esc(clase.parte || 'Clase ' + numero) + '</span>' +
      '<strong>' + esc(clase.titulo) + '</strong><span class="lesson-summary">' +
      esc(clase.resumen || '') + '</span><span class="lesson-materials">' +
      chipsMateriales(cfg, clase) + '</span></span>' +
    '<span class="lesson-action">' + esc(accion) + (soon ? '' : ' →') + '</span>' + cierre;
}
```

- [ ] **Step 4: Implement category markup and progress**

Replace `fila` with `categoriaCurricular`:

```js
function categoriaCurricular(cfg, row, progreso) {
  var resumen = Modelo.resumenFila(cfg, row, progreso);
  var panelId = 'panel-' + row.id;
  var clases = (row.clases || []).map(function (clase, indice) {
    return filaClase(cfg, clase, indice, progreso);
  }).join('');
  if (!clases) clases = '<p class="curriculum-empty">Contenido próximamente</p>';
  return '<section class="curriculum-section open" id="' + esc(row.id) + '" data-category>' +
    '<button class="curriculum-heading" type="button" aria-expanded="true" aria-controls="' +
      esc(panelId) + '"><span class="category-copy"><span class="category-title">' +
      esc(row.titulo) + '</span><span class="category-meta">' + esc(row.subtitulo || '') +
      '</span></span><span class="category-progress"><span>' + resumen.vistas + ' / ' +
      resumen.total + '</span><span class="bar"><i style="width:' + resumen.porcentaje +
      '%"></i></span></span><span class="category-chevron" aria-hidden="true">⌄</span></button>' +
    '<div class="lesson-list" id="' + esc(panelId) + '">' + clases + '</div></section>';
}
```

Change startup rendering to:

```js
rows.innerHTML = data.filas.map(function (fila) {
  return categoriaCurricular(cfg, fila, progreso);
}).join('');
```

Delete the post-render `[href*="id"]` lookup; `data-clase` now belongs directly to each link. Change progress marking to:

```js
var lesson = e.target.closest('.lesson-row[href], .featured-class[data-clase]');
if (!lesson) return;
var id = lesson.dataset.clase;
if (id) Progreso.marcar(cfg.id, id, Progreso.ESTADOS.CURSO);
```

- [ ] **Step 5: Replace card CSS with curriculum-row CSS**

Remove `.deck-grid`, `.deck-card`, `.stripe`, `.lvl`, `.extras`, and their old responsive overrides. Add:

```css
.rows-area{max-width:1120px;padding-top:clamp(1.5rem,4vw,3rem);padding-bottom:6rem}
.curriculum-section{border-top:1px solid var(--line-d)}
.curriculum-section:last-child{border-bottom:1px solid var(--line-d)}
.curriculum-heading{width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto auto;
  gap:1.2rem;align-items:center;padding:1.35rem 0;border:0;background:none;color:inherit;text-align:left;cursor:pointer}
.category-copy{display:flex;align-items:baseline;gap:.9rem;min-width:0}
.category-title{font-family:'Unbounded',sans-serif;font-size:clamp(1.1rem,2vw,1.45rem);font-weight:600}
.category-meta{color:var(--on-char-mute);font:400 .65rem/1.4 'Martian Mono',monospace;
  letter-spacing:.12em;text-transform:uppercase}
.category-progress{display:flex;align-items:center;gap:.65rem;color:var(--on-char-mute);
  font:400 .62rem/1 'Martian Mono',monospace;white-space:nowrap}
.category-progress .bar{width:82px;height:3px;background:var(--line-d2);border-radius:99px;overflow:hidden}
.category-progress .bar i{display:block;height:100%;background:var(--accent-surface)}
.category-chevron{color:var(--accent-text);transition:transform .2s var(--ease)}
.curriculum-section.open .category-chevron{transform:rotate(180deg)}
.lesson-list{display:flex;flex-direction:column;padding-bottom:1rem}
.lesson-row{display:grid;grid-template-columns:2.4rem minmax(0,1fr) auto;gap:1rem;align-items:center;
  min-height:112px;padding:1rem;border:1px solid transparent;border-radius:12px;
  color:inherit;text-decoration:none;transition:background .2s var(--ease),border-color .2s var(--ease)}
.lesson-row:hover{background:rgba(var(--hub-panel-rgb),.72);border-color:var(--line-d2)}
.lesson-row:focus-visible{outline:2px solid var(--accent-text);outline-offset:2px}
.lesson-row.curso{background:color-mix(in srgb,var(--accent-surface) 12%,transparent);
  border-color:color-mix(in srgb,var(--accent-surface) 58%,transparent)}
.lesson-status{width:2rem;height:2rem;display:grid;place-items:center;border:1px solid var(--line-d2);
  border-radius:50%;color:var(--on-char-mute);font:500 .62rem/1 'Martian Mono',monospace}
.lesson-row.visto .lesson-status{background:var(--lettuce);border-color:var(--lettuce);color:var(--char)}
.lesson-row.curso .lesson-status{border-color:var(--accent-text);color:var(--accent-text)}
.lesson-copy{display:flex;flex-direction:column;min-width:0}
.lesson-kicker{color:var(--accent-text);font:500 .58rem/1.4 'Martian Mono',monospace;
  letter-spacing:.12em;text-transform:uppercase}
.lesson-copy strong{margin-top:.25rem;font-family:'Unbounded',sans-serif;font-size:1rem;line-height:1.25}
.lesson-summary{margin-top:.3rem;color:var(--on-char-soft);font-size:.88rem;line-height:1.4}
.lesson-materials{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.55rem}
.material{color:var(--on-char-mute);font:400 .56rem/1.3 'Martian Mono',monospace;
  letter-spacing:.08em;text-transform:uppercase}
.lesson-action{padding-left:1rem;color:var(--accent-text);font:500 .62rem/1.3 'Martian Mono',monospace;
  letter-spacing:.1em;text-transform:uppercase;white-space:nowrap}
.lesson-row.soon{opacity:.58;cursor:default}
.curriculum-empty{padding:1rem;color:var(--on-char-mute)}
```

- [ ] **Step 6: Verify rows and commit**

Run:

```bash
node scripts/test-motor-hub.cjs
node scripts/test-academy-hubs-structure.cjs
node scripts/build-academy.cjs --out .artifacts/site
node scripts/test-academy-hubs-e2e.cjs
```

Expected: all commands pass and browser screenshots contain lesson rows rather than cards.

Commit:

```bash
git add motor/hub.js motor/hub.css scripts/test-motor-hub.cjs scripts/test-academy-hubs-e2e.cjs
git commit -m "feat: render academy curriculum rows"
```

---

### Task 4: Add responsive category disclosure and accessibility

**Files:**
- Modify: `motor/hub.js:300-405,470-480`
- Modify: `motor/hub.css:190-200,401-420,510-520`
- Modify: `scripts/test-academy-hubs-e2e.cjs:31-86`

- [ ] **Step 1: Write failing mobile disclosure assertions**

In `inspect`, after the existing 760 px navigation checks, add a 430 px curriculum contract:

```js
if(viewport.width===430){
  const categories=page.locator('[data-category]');
  assert.ok(await categories.count()>=1, `${name} needs mobile categories`);
  assert.equal(await categories.locator('.curriculum-heading[aria-expanded="true"]').count(),1,
    `${name} must initially open one mobile category`);
  const closed=categories.locator('.curriculum-heading[aria-expanded="false"]').first();
  if(await closed.count()){
    const panelId=await closed.getAttribute('aria-controls');
    await closed.click();
    assert.equal(await closed.getAttribute('aria-expanded'),'true');
    assert.ok(await page.locator('#'+panelId).isVisible(),
      `${name} must reveal a category from its accessible control`);
  }
}
```

Also collect and assert that every heading controls a real panel:

```js
const headingContracts=await page.locator('.curriculum-heading').evaluateAll(headings=>
  headings.map(button=>({ expanded:button.getAttribute('aria-expanded'),
    controls:button.getAttribute('aria-controls'),
    panel:Boolean(document.getElementById(button.getAttribute('aria-controls'))) })));
assert.ok(headingContracts.every(item=>item.panel && /^(true|false)$/.test(item.expanded)));
```

- [ ] **Step 2: Run E2E and verify RED**

Run:

```bash
node scripts/build-academy.cjs --out .artifacts/site
node scripts/test-academy-hubs-e2e.cjs
```

Expected: FAIL because all categories remain open on mobile and clicking does not toggle a panel.

- [ ] **Step 3: Add the disclosure controller**

Add to `motor/hub.js`:

```js
function activarCategorias(progreso) {
  var categorias = [].slice.call(document.querySelectorAll('[data-category]'));
  if (!categorias.length) return;
  var media = window.matchMedia('(max-width:760px)');

  function cambiar(categoria, abierta) {
    var boton = categoria.querySelector('.curriculum-heading');
    var panel = document.getElementById(boton.getAttribute('aria-controls'));
    categoria.classList.toggle('open', abierta);
    boton.setAttribute('aria-expanded', abierta ? 'true' : 'false');
    panel.hidden = !abierta;
  }

  function configurar(evento) {
    if (!media.matches) {
      categorias.forEach(function (categoria) { cambiar(categoria, true); });
      return;
    }
    var activo = categorias.find(function (categoria) {
      return Boolean(categoria.querySelector('.lesson-row.curso'));
    }) || categorias[0];
    categorias.forEach(function (categoria) { cambiar(categoria, categoria === activo); });
  }

  categorias.forEach(function (categoria) {
    categoria.querySelector('.curriculum-heading').addEventListener('click', function () {
      cambiar(categoria, !categoria.classList.contains('open'));
    });
  });
  if (media.addEventListener) media.addEventListener('change', configurar);
  else media.addListener(configurar);
  configurar();
}
```

Call `activarCategorias(progreso)` immediately after inserting curriculum markup.

- [ ] **Step 4: Add mobile and reduced-motion CSS**

Add:

```css
@media(max-width:760px){
  .hub-hero{grid-template-columns:1fr;padding:2rem 1.25rem;gap:1.25rem}
  .featured-class{min-height:0}
  .course-tabs{overflow-x:auto;padding-inline:1.25rem}
  .rows-area{padding-inline:1.25rem}
  .category-copy{flex-direction:column;align-items:flex-start;gap:.3rem}
  .category-progress .bar{display:none}
  .lesson-row{grid-template-columns:2.2rem minmax(0,1fr);min-height:0;padding:.95rem .25rem}
  .lesson-action{grid-column:2;padding:.35rem 0 0;min-height:44px;display:flex;align-items:center}
}
@media(prefers-reduced-motion:reduce){
  .category-chevron,.lesson-row{transition:none}
}
```

The `hidden` attribute controls visibility. Do not animate height; that would require measuring content and adds no learning value.

- [ ] **Step 5: Verify disclosure and commit**

Run:

```bash
node scripts/build-academy.cjs --out .artifacts/site
node scripts/test-academy-hubs-e2e.cjs
```

Expected: `academy hubs browser layout: PASS` across all ten hub screenshots.

Commit:

```bash
git add motor/hub.js motor/hub.css scripts/test-academy-hubs-e2e.cjs
git commit -m "feat: add responsive curriculum categories"
```

---

### Task 5: Validate progress states, free navigation, and degraded behavior

**Files:**
- Modify: `scripts/test-academy-hubs-e2e.cjs:20-120`
- Modify only if the tests expose defects: `motor/hub-model.js`, `motor/hub.js`, `motor/hub.css`

- [ ] **Step 1: Add a reusable progress seeding helper**

Add before `inspect`:

```js
async function seedProgress(context,courseId){
  await context.addInitScript(({courseId})=>{
    localStorage.setItem('lrdl.progreso',JSON.stringify({
      esquema:1,dispositivoId:'e2e-test',cursos:{
        [courseId]:{ultima:'sesion-4',clases:{
          'sesion-3':{estado:'visto',ts:'2026-09-01T10:00:00Z'},
          'sesion-4':{estado:'curso',ts:'2026-09-01T11:00:00Z'}
        }}
      }
    }));
  },{courseId});
}
```

Call `await seedProgress(context,name === 'ingles' ? 'ingles' : 'dtmm')` before opening the page only in a new dedicated progress test, not in the baseline screenshots.

- [ ] **Step 2: Write the failing progress-state browser test**

Add:

```js
async function inspectProgress(browser,base){
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await seedProgress(context,'ingles');
  const page=await context.newPage();
  await page.goto(base+'/ingles/',{waitUntil:'networkidle'});
  await page.locator('.lesson-row').first().waitFor();
  assert.equal(await page.locator('.lesson-row.visto').count(),1);
  assert.equal(await page.locator('.lesson-row.curso').count(),1);
  assert.match(await page.locator('.featured-class h2').innerText(),/What do you do every day/i);
  assert.match(await page.locator('.course-progress').innerText(),/1 de 8 vistas/i);
  assert.ok(await page.locator('.lesson-row[href]').count()>=8,
    'Progress must not lock any published English lesson');
  assert.equal(await page.locator('.lesson-row.soon[href]').count(),0,
    'Upcoming lessons must not be focusable links');
  await context.close();
}
```

Call `await inspectProgress(browser,base)` after the viewport loops.

Add a second check proving that storage failure degrades to an ordinary curriculum rather than breaking the page:

```js
async function inspectUnavailableProgress(browser,base){
  const context=await browser.newContext({viewport:{width:1024,height:768}});
  await context.addInitScript(()=>{
    Storage.prototype.setItem=function(){ throw new Error('storage disabled'); };
  });
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/ingles/',{waitUntil:'networkidle'});
  await page.locator('.lesson-row').first().waitFor();
  assert.equal(await page.locator('.course-progress').count(),0,
    'Unavailable storage must hide personalized progress');
  assert.ok(await page.locator('.lesson-row[href]').count()>=8,
    'Unavailable storage must not block curriculum navigation');
  assert.deepEqual(errors,[]);
  await context.close();
}
```

Call `await inspectUnavailableProgress(browser,base)` immediately after `inspectProgress`.

- [ ] **Step 3: Run E2E and verify the test is meaningful**

Run the build and E2E test. If it passes immediately, temporarily change the expected hero title to `/THIS MUST FAIL/`, rerun, and confirm the assertion fails; restore the real assertion before continuing. This proves the new test reads the rendered recommendation rather than a fixture that is never applied.

- [ ] **Step 4: Fix only behavior exposed by the test**

Expected implementation contract:

```js
var estado = Modelo.estadoDe(progreso, clase.id);
```

must drive the `visto` and `curso` classes in both the row and hero, while:

```js
Modelo.destino(cfg, clase)
```

alone decides whether the class is a link. Do not condition `href` on previous lesson state.

- [ ] **Step 5: Run E2E and commit the regression coverage**

Run:

```bash
node scripts/build-academy.cjs --out .artifacts/site
node scripts/test-academy-hubs-e2e.cjs
```

Expected: `academy hubs browser layout: PASS`.

Commit:

```bash
git add scripts/test-academy-hubs-e2e.cjs motor/hub-model.js motor/hub.js motor/hub.css
git commit -m "test: cover academy curriculum progress"
```

If no production file changed, omit it from `git add` rather than creating a no-op edit.

---

### Task 6: Run the complete Academy release verification

**Files:**
- Verify: all files changed in Tasks 1-5
- Generated locally only: `.artifacts/site/`, `.artifacts/test-results/academy-hubs/`

- [ ] **Step 1: Run source and unit tests**

Run each command separately and stop on the first failure:

```bash
node scripts/test-academy-index.cjs
node scripts/test-monorepo-boundaries.cjs
node scripts/test-build-academy.cjs
node scripts/test-academy-hubs-structure.cjs
node scripts/test-motor-hub.cjs
node scripts/test-hub-model.cjs
node scripts/test-progreso.cjs
node cursos/ingles/scripts/test-academy-shell.cjs
node cursos/ingles/scripts/test-grammar-grill.cjs
node cursos/ingles/scripts/test-grammar-grill-ui.cjs
```

Expected: every command prints `PASS` and exits 0.

- [ ] **Step 2: Build the publication artifact and verify routes**

Run:

```bash
node scripts/build-academy.cjs --out .artifacts/site
node scripts/test-route-parity.cjs .artifacts/site
```

Expected: build reports `2 hubs, 47 HTML files`; route parity prints `PASS`.

- [ ] **Step 3: Run responsive browser verification**

Run:

```bash
node scripts/test-academy-hubs-e2e.cjs
```

Expected: `academy hubs browser layout: PASS` and fresh screenshots for DTMM and Inglés at 1440, 1024, 760, 430, and 390 px.

- [ ] **Step 4: Inspect the generated screenshots**

Open:

```text
.artifacts/test-results/academy-hubs/dtmm-1440x900.png
.artifacts/test-results/academy-hubs/dtmm-430x844.png
.artifacts/test-results/academy-hubs/ingles-1440x900.png
.artifacts/test-results/academy-hubs/ingles-430x844.png
```

Verify all four acceptance points visually:

1. the hero is compact and the curriculum begins near the first viewport;
2. lesson titles, summaries, materials, and actions do not collide;
3. only one category starts open on mobile;
4. theme identity remains clearly different between DTMM and Inglés.

- [ ] **Step 5: Check the final diff and commit any verification-only correction**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and no generated `.artifacts` files staged. If visual verification required a correction, rerun Steps 1-4 and commit only after every command passes:

```bash
git add motor/hub-model.js motor/hub.js motor/hub.css cursos/dtmm/index.html cursos/ingles/index.html scripts .github/workflows/deploy-pages.yml
git commit -m "feat: complete academy curriculum explorer"
```

If the worktree is already clean after the earlier task commits, do not create an empty final commit.
