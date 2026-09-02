# English Resources Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the English resources page into a compact editorial library that shares the Academy hub shell and responsive behavior.

**Architecture:** Keep `recursos.json` as the content source and the page-local renderer as the presentation boundary. Update only `cursos/ingles/recursos.html`, extending the existing browser contract test and E2E test before changing markup or styles.

**Tech Stack:** Static HTML, CSS custom properties, vanilla JavaScript, Node assertions, Playwright.

---

### Task 1: Lock the new resources-page contract

**Files:**
- Modify: `cursos/ingles/scripts/test-academy-shell.cjs`
- Test: `cursos/ingles/scripts/test-academy-shell.cjs`

- [ ] **Step 1: Write the failing structural assertions**

Add assertions requiring the Academy shell, compact resource intro, editorial inventory, semantic resource count, and removal of the legacy `.brand`, `.home`, and `.item` card contract:

```js
assert.match(resources, /class="topbar academy-shell"/);
assert.match(resources, /class="academy-brand" href="\.\.\/"/);
assert.match(resources, /class="constellation-context">Inglés \/ Recursos/);
assert.match(resources, /class="resources-intro"/);
assert.match(resources, /class="resource-inventory" id="items"/);
assert.match(resources, /class="inventory-count" id="resourceCount"/);
assert.doesNotMatch(resources, /class="item"/);
```

- [ ] **Step 2: Run the contract test and confirm RED**

Run: `node cursos/ingles/scripts/test-academy-shell.cjs`

Expected: FAIL because `recursos.html` still uses the legacy topbar and `.item` cards.

- [ ] **Step 3: Commit the failing test**

```bash
git add cursos/ingles/scripts/test-academy-shell.cjs
git commit -m "test: define english resources library contract"
```

### Task 2: Build the editorial library

**Files:**
- Modify: `cursos/ingles/recursos.html`
- Test: `cursos/ingles/scripts/test-academy-shell.cjs`

- [ ] **Step 1: Replace the legacy header with the Academy shell**

Use the same identity and navigation vocabulary as the hub:

```html
<header class="topbar academy-shell">
  <a class="academy-brand" href="../" aria-label="Volver a Academia La Red de Luz">
    <img src="assets/motor/imgs/reddeluz.png" alt="" width="34" height="34">
    <span>La Red de Luz · Academia</span>
  </a>
  <span class="shell-divider" aria-hidden="true">/</span>
  <span class="constellation-context">Inglés / Recursos</span>
  <nav class="resources-nav" aria-label="Navegación de recursos">
    <a href="index.html">Clases</a>
    <a href="../">Todas las constelaciones</a>
  </nav>
</header>
```

- [ ] **Step 2: Replace the hero and cards with compact semantic markup**

Use an intro plus a ruled inventory:

```html
<main class="resources-page">
  <header class="resources-intro">
    <p class="resources-kicker">Biblioteca · Consulta libre</p>
    <h1>Herramientas para volver cuando las necesites.</h1>
    <p class="resources-summary">Práctica, vocabulario y sistemas de memoria para acompañar cualquier clase.</p>
    <p class="inventory-count" id="resourceCount" aria-live="polite">Cargando inventario…</p>
  </header>
  <section class="resource-inventory" id="items" aria-label="Recursos disponibles"></section>
</main>
```

- [ ] **Step 3: Render resource rows and all load states**

Update `tarjeta` to return a numbered row and update `resourceCount` after fetch:

```js
function filaRecurso(r, index){
  return '<a class="resource-row" href="'+esc(r.url)+'">'+
    '<span class="resource-index">'+String(index+1).padStart(2,'0')+'</span>'+
    '<span class="resource-symbol">'+esc(r.icono||'⌘')+'</span>'+
    '<span class="resource-copy"><strong>'+esc(r.titulo)+'</strong>'+
    '<span>'+esc(r.descripcion||'')+'</span></span>'+
    '<span class="resource-action">Abrir <span aria-hidden="true">→</span></span></a>';
}
```

For success set `resourceCount.textContent` to `3 recursos disponibles`; for empty set it to `Inventario vacío`; for failure set it to `Inventario no disponible`.

- [ ] **Step 4: Add page-scoped styling**

Define a compact `resources-page`, a two-column intro on desktop, flat `.resource-row` rules, red node/symbol accents, visible `:focus-visible`, and a single-column mobile layout below 680px. Remove the old `.item`, `.ico`, `.salir`, and legacy resources-header rules.

- [ ] **Step 5: Run the structural test and confirm GREEN**

Run: `node cursos/ingles/scripts/test-academy-shell.cjs`

Expected: `English Academy shell: PASS`.

- [ ] **Step 6: Commit the implementation**

```bash
git add cursos/ingles/recursos.html
git commit -m "feat: redesign english resources library"
```

### Task 3: Verify behavior and responsive layout

**Files:**
- Modify: `scripts/test-academy-hubs-e2e.cjs`
- Test: `scripts/test-academy-hubs-e2e.cjs`

- [ ] **Step 1: Write failing E2E assertions for the new page**

Extend `inspectResources` to run at `1440x900` and `430x844`, then assert:

```js
assert.equal(await page.locator('.resource-row').count(), 3);
assert.match(await page.locator('#resourceCount').innerText(), /3 recursos disponibles/i);
assert.equal(await page.locator('.item').count(), 0);
assert.ok(await page.locator('.academy-brand').isVisible());
assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
```

Also assert that every `.resource-row` resolves on the current origin and that the intro begins within the first viewport.

- [ ] **Step 2: Run E2E and confirm RED**

Run: `node scripts/build-academy.cjs --out .artifacts/site` followed by `node scripts/test-academy-hubs-e2e.cjs`.

Expected: FAIL until the E2E helper and resources structure match at both viewports.

- [ ] **Step 3: Complete the responsive adjustments**

Adjust only page-scoped CSS in `cursos/ingles/recursos.html` until the desktop inventory fits comfortably and mobile has no horizontal overflow, clipped text, or duplicated navigation.

- [ ] **Step 4: Run E2E and confirm GREEN**

Run: `node scripts/build-academy.cjs --out .artifacts/site` followed by `node scripts/test-academy-hubs-e2e.cjs`.

Expected: `academy hubs browser layout: PASS`.

- [ ] **Step 5: Commit E2E coverage**

```bash
git add scripts/test-academy-hubs-e2e.cjs cursos/ingles/recursos.html
git commit -m "test: cover english resources library"
```

### Task 4: Release verification and live preview

**Files:**
- Verify: all Academy source and generated routes

- [ ] **Step 1: Run all source tests**

Run the Academy test scripts, including the English shell, hub model, progress, build, route-boundary, and Grammar Grill contracts.

Expected: every command exits `0` and prints `PASS`.

- [ ] **Step 2: Build and verify the release artifact**

Run:

```bash
node scripts/build-academy.cjs --out .artifacts/site
node scripts/test-route-parity.cjs .artifacts/site
node scripts/test-academy-hubs-e2e.cjs
```

Expected: 2 hubs and 47 HTML files, route parity PASS, E2E PASS.

- [ ] **Step 3: Refresh and inspect the live preview**

Run `node scripts/build-academy.cjs --out _site`, capture `/ingles/recursos.html` at desktop and mobile widths, and visually verify hierarchy, density, focus, and overflow.

- [ ] **Step 4: Confirm a clean worktree**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors and no uncommitted source changes.

