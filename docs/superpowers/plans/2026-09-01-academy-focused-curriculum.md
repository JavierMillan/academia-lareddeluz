# Academy Focused Curriculum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the always-expanded curriculum with a compact desktop course map and one active category, while preserving an exclusive accessible accordion on mobile.

**Architecture:** Extend the DOM-independent `hub-model.js` with initial-category selection, then let `hub.js` render one shared curriculum workspace. Desktop category controls replace the active lesson panel in place; mobile uses the same category data as an exclusive accordion. Progress remains read-only during category changes, and lesson destinations remain independent from completion state.

**Tech Stack:** Plain JavaScript, HTML, CSS, Node `assert`, Playwright with Edge, existing Academy build scripts.

---

## File map

| File | Responsibility |
|---|---|
| `motor/hub-model.js` | Select the initial curriculum category from progress and published content |
| `motor/hub.js` | Render compact hero, desktop course map, active panel, and mobile accordion |
| `motor/hub.css` | Two-column curriculum workspace, dense lessons, compact hero, responsive accordion |
| `scripts/test-hub-model.cjs` | Unit coverage for category selection priority and empty data |
| `scripts/test-motor-hub.cjs` | Static renderer contract for course map and active panel |
| `scripts/test-academy-hubs-e2e.cjs` | Desktop switching, mobile exclusivity, progress, navigation, responsive screenshots |

### Task 1: Select the initial category in the pure model

**Files:**
- Modify: `motor/hub-model.js`
- Modify: `scripts/test-hub-model.cjs`

- [ ] **Step 1: Write failing category-selection tests**

Add fixtures to `scripts/test-hub-model.cjs` that assert the category containing the recommended class is selected, followed by the first category with published content and `null` for an empty curriculum:

```js
assert.equal(Model.categoriaInicial(cfg, data, progreso).id, 'inicio');
assert.equal(Model.categoriaInicial(cfg, data, { clases: {}, ultima: null }).id, 'inicio');
assert.equal(Model.categoriaInicial(cfg, { filas: [
  { id: 'vacia', clases: [{ id: 'x', titulo: 'Próximamente' }] },
  { id: 'publicada', clases: [{ id: 'y', deck: 'y.html', titulo: 'Lista' }] }
]}, { clases: {}, ultima: null }).id, 'publicada');
assert.equal(Model.categoriaInicial(cfg, { filas: [] }, null), null);
```

- [ ] **Step 2: Run the model test and verify RED**

Run: `node scripts/test-hub-model.cjs`

Expected: FAIL because `Model.categoriaInicial` is not a function.

- [ ] **Step 3: Implement minimal category selection**

Add to `motor/hub-model.js`:

```js
function categoriaInicial(cfg, data, progreso) {
  var filas = data.filas || [];
  var recomendada = resumenCurso(cfg, data, progreso || { clases: {}, ultima: null }).recomendada;
  var porRecomendacion = recomendada && filas.find(function (fila) {
    return (fila.clases || []).some(function (clase) { return clase.id === recomendada.id; });
  });
  return porRecomendacion || filas.find(function (fila) {
    return (fila.clases || []).some(function (clase) { return destino(cfg, clase); });
  }) || filas[0] || null;
}
```

Export it on `HubModel` as `categoriaInicial`.

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```bash
node scripts/test-hub-model.cjs
node scripts/test-monorepo-boundaries.cjs
```

Expected: both print `PASS`.

- [ ] **Step 5: Commit**

```bash
git add motor/hub-model.js scripts/test-hub-model.cjs
git commit -m "feat: select initial academy category"
```

### Task 2: Render the focused desktop curriculum workspace

**Files:**
- Modify: `motor/hub.js`
- Modify: `scripts/test-motor-hub.cjs`
- Modify: `scripts/test-academy-hubs-structure.cjs`

- [ ] **Step 1: Write failing renderer-contract assertions**

Require the shared renderer to contain `.curriculum-workspace`, `.course-map`, `.course-map-button`, `.active-category`, and the model call:

```js
for (const selector of ['curriculum-workspace','course-map','course-map-button','active-category']) {
  assert.match(hub, new RegExp(selector), `hub renderer needs ${selector}`);
}
assert.match(hub, /HubModel\.categoriaInicial\(/,
  'hub renderer must derive the initial category from the shared model');
```

- [ ] **Step 2: Run the static test and verify RED**

Run: `node scripts/test-motor-hub.cjs`

Expected: FAIL on the missing curriculum workspace contract.

- [ ] **Step 3: Split category rendering into reusable heading and lesson-panel functions**

Keep `filaClase` and add:

```js
function contenidoCategoria(cfg, row, progreso) {
  var clases = (row.clases || []).map(function (clase, indice) {
    return filaClase(cfg, clase, indice, progreso);
  }).join('');
  return clases || '<p class="curriculum-empty">Contenido próximamente</p>';
}

function panelCategoria(cfg, row, progreso) {
  var resumen = HubModel.resumenFila(cfg, row, progreso);
  return '<section class="active-category" aria-live="polite" data-active-category="' +
    esc(row.id) + '"><header class="active-category-header"><span><span class="category-meta">' +
    esc(row.subtitulo || '') + '</span><h2>' + esc(row.titulo) + '</h2></span>' +
    '<span class="category-progress">' + resumen.vistas + ' / ' + resumen.total +
    ' vistas</span></header><div class="lesson-list">' +
    contenidoCategoria(cfg, row, progreso) + '</div></section>';
}
```

- [ ] **Step 4: Render the desktop course map and one active panel**

Add:

```js
function mapaCurso(cfg, data, progreso, activa) {
  var botones = (data.filas || []).map(function (row) {
    var resumen = HubModel.resumenFila(cfg, row, progreso);
    var actual = activa && row.id === activa.id;
    return '<button class="course-map-button" type="button" data-category-id="' + esc(row.id) +
      '" aria-pressed="' + (actual ? 'true' : 'false') + '"><span>' + esc(row.titulo) +
      '</span><span>' + resumen.vistas + '/' + resumen.total + '</span></button>';
  }).join('');
  return '<div class="curriculum-workspace"><nav class="course-map" aria-label="Mapa del curso">' +
    '<span class="course-map-label">Mapa del curso</span>' + botones +
    '</nav><div class="active-category-slot">' + panelCategoria(cfg, activa, progreso) +
    '</div></div>';
}
```

During startup, choose `var activa = HubModel.categoriaInicial(cfg, data, progreso);` and render the workspace instead of all expanded sections.

- [ ] **Step 5: Activate category switching without changing progress**

Replace `activarCategorias()` with a controller receiving `cfg`, `data`, and `progreso`. On desktop, clicking a map button updates only `.active-category-slot`, toggles `aria-pressed`, and never calls `Progreso.marcar`. On mobile, it renders category headings and uses exclusive disclosure.

Core desktop behavior:

```js
function seleccionarCategoria(cfg, data, progreso, id) {
  var row = (data.filas || []).find(function (fila) { return fila.id === id; });
  if (!row) return;
  document.querySelectorAll('.course-map-button').forEach(function (button) {
    button.setAttribute('aria-pressed', button.dataset.categoryId === id ? 'true' : 'false');
  });
  document.querySelector('.active-category-slot').innerHTML = panelCategoria(cfg, row, progreso);
}
```

- [ ] **Step 6: Run source tests and commit**

Run:

```bash
node scripts/test-motor-hub.cjs
node scripts/test-academy-hubs-structure.cjs
node scripts/test-hub-model.cjs
```

Expected: all print `PASS`.

Commit:

```bash
git add motor/hub.js scripts/test-motor-hub.cjs scripts/test-academy-hubs-structure.cjs
git commit -m "feat: add focused academy course map"
```

### Task 3: Apply the approved visual treatment and mobile accordion

**Files:**
- Modify: `motor/hub.css`
- Modify: `motor/hub.js`
- Modify: `scripts/test-academy-hubs-e2e.cjs`

- [ ] **Step 1: Write failing E2E assertions for focused disclosure**

For desktop, assert six DTMM map buttons, exactly one pressed button, one active category, and only that category's lesson rows. Click Intermedio and assert seven rows without navigation:

```js
assert.equal(await page.locator('.course-map-button').count(), 6);
assert.equal(await page.locator('.course-map-button[aria-pressed="true"]').count(), 1);
assert.equal(await page.locator('.active-category').count(), 1);
const before = page.url();
await page.locator('.course-map-button[data-category-id="intermedio"]').click();
assert.equal(page.url(), before);
assert.equal(await page.locator('.active-category .lesson-row').count(), 7);
```

For 430 px, assert one expanded heading before and after opening another category:

```js
assert.equal(await page.locator('.mobile-category-heading[aria-expanded="true"]').count(), 1);
const next = page.locator('.mobile-category-heading[aria-expanded="false"]').first();
await next.click();
assert.equal(await page.locator('.mobile-category-heading[aria-expanded="true"]').count(), 1);
assert.equal(await next.getAttribute('aria-expanded'), 'true');
```

- [ ] **Step 2: Build and run E2E to verify RED**

Run:

```bash
node scripts/build-academy.cjs --out .artifacts/site
node scripts/test-academy-hubs-e2e.cjs
```

Expected: FAIL because the focused map and exclusive mobile selectors do not exist yet.

- [ ] **Step 3: Compact the hero and remove recommendation-card chrome**

Change `.hub-hero` to a shorter two-column strip and `.featured-class` to a transparent region separated by a vertical rule. Remove its border, radius, and panel fill. At `max-width:760px`, stack the regions and use a top rule.

```css
.hub-hero{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(18rem,.75fr);
  gap:clamp(2rem,5vw,4.5rem);padding-block:clamp(2rem,4vw,3rem)}
.featured-class{padding:0 0 0 clamp(1.5rem,3vw,2.5rem);border:0;border-left:1px solid var(--line-d);
  border-radius:0;background:transparent}
```

- [ ] **Step 4: Style the desktop course map and dense lesson rows**

Add a `220px / 1fr` workspace, quiet map buttons, active-dot state, and 76–84 px lesson rows. Use spacing and hairlines rather than card surfaces.

```css
.curriculum-workspace{display:grid;grid-template-columns:220px minmax(0,1fr);gap:clamp(2rem,5vw,4rem)}
.course-map{position:sticky;top:5.5rem;align-self:start;padding-right:1.5rem;border-right:1px solid var(--line-d)}
.course-map-button{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;width:100%;
  min-height:46px;padding:.7rem .5rem .7rem 1.15rem;border:0;background:none;color:var(--on-char-soft);text-align:left}
.course-map-button[aria-pressed="true"]{color:var(--on-char);background:rgba(var(--hub-panel-rgb),.5)}
.lesson-row{min-height:80px;padding:.7rem .25rem;border-radius:0;border-bottom:1px solid var(--line-d)}
```

- [ ] **Step 5: Render and style exclusive mobile disclosure**

At `max-width:760px`, hide `.course-map` and desktop active slot, show `.mobile-curriculum`, and permit only one open category. Each heading remains at least 44 px and controls a real panel with `aria-controls`.

Render each mobile category with the same lesson content:

```js
function categoriaMovil(cfg, row, progreso, abierta) {
  var resumen = HubModel.resumenFila(cfg, row, progreso);
  var panelId = 'mobile-panel-' + row.id;
  return '<section class="mobile-category" data-mobile-category="' + esc(row.id) + '">' +
    '<button class="mobile-category-heading" type="button" aria-expanded="' +
    (abierta ? 'true' : 'false') + '" aria-controls="' + esc(panelId) + '">' +
    '<span><strong>' + esc(row.titulo) + '</strong><small>' + esc(row.subtitulo || '') +
    '</small></span><span>' + resumen.vistas + '/' + resumen.total + '⌄</span></button>' +
    '<div class="mobile-category-panel" id="' + esc(panelId) + '"' +
    (abierta ? '' : ' hidden') + '><div class="lesson-list">' +
    contenidoCategoria(cfg, row, progreso) + '</div></div></section>';
}

function curriculoMovil(cfg, data, progreso, activa) {
  return '<div class="mobile-curriculum">' + (data.filas || []).map(function (row) {
    return categoriaMovil(cfg, row, progreso, activa && row.id === activa.id);
  }).join('') + '</div>';
}

function abrirCategoriaMovil(button) {
  document.querySelectorAll('.mobile-category-heading').forEach(function (other) {
    var open = other === button;
    other.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.getElementById(other.getAttribute('aria-controls')).hidden = !open;
  });
}
```

Bind each `.mobile-category-heading` click to `abrirCategoriaMovil(button)`. An open category stays open when clicked again so the page always preserves one visible learning context.

Add responsive presentation:

```css
.mobile-curriculum{display:none}
@media(max-width:760px){
  .curriculum-workspace{display:none}
  .mobile-curriculum{display:block}
  .mobile-category{border-top:1px solid var(--line-d)}
  .mobile-category-heading{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;
    width:100%;min-height:60px;padding:.8rem 0;border:0;background:none;color:inherit;text-align:left}
  .mobile-category-heading span:first-child{display:flex;flex-direction:column;gap:.25rem}
  .mobile-category-heading small{color:var(--on-char-mute)}
}
```

- [ ] **Step 6: Run responsive E2E and commit**

Run:

```bash
node scripts/build-academy.cjs --out .artifacts/site
node scripts/test-academy-hubs-e2e.cjs
```

Expected: `academy hubs browser layout: PASS`.

Commit:

```bash
git add motor/hub.js motor/hub.css scripts/test-academy-hubs-e2e.cjs
git commit -m "feat: refine academy curriculum layout"
```

### Task 4: Verify progress, navigation freedom, and release output

**Files:**
- Verify all modified source files
- Generated locally only: `.artifacts/site/`, `.artifacts/test-results/academy-hubs/`

- [ ] **Step 1: Run all source and unit tests**

Run separately:

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

Expected: every command exits 0 and prints `PASS`.

- [ ] **Step 2: Build and verify route parity**

Run:

```bash
node scripts/build-academy.cjs --out .artifacts/site
node scripts/test-route-parity.cjs .artifacts/site
```

Expected: build reports `2 hubs, 47 HTML files`; route parity prints `PASS`.

- [ ] **Step 3: Run responsive browser verification**

Run: `node scripts/test-academy-hubs-e2e.cjs`

Expected: `academy hubs browser layout: PASS`, including progress seeding, unavailable storage, free navigation, desktop map switching, and exclusive mobile disclosure.

- [ ] **Step 4: Inspect fresh desktop and mobile screenshots**

Open:

```text
.artifacts/test-results/academy-hubs/dtmm-1440x900.png
.artifacts/test-results/academy-hubs/dtmm-430x844.png
.artifacts/test-results/academy-hubs/ingles-1440x900.png
.artifacts/test-results/academy-hubs/ingles-430x844.png
```

Verify that the first viewport contains the compact hero and curriculum entry, desktop renders only one category of lessons, mobile opens only one category, and the two constellation identities remain distinct.

- [ ] **Step 5: Check repository state**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and no generated artifacts staged.
