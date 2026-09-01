# Academy Monorepo Implementation Plan

> **Execution:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every academic course into `academia-lareddeluz/cursos/` so Academy builds and deploys from one repository without changing the current public design or routes.

**Architecture:** The portal remains at the repository root. DTMM and Inglés become local course sources under `cursos/dtmm/` and `cursos/ingles/`; a local manifest maps them to `/dtmm/` and `/ingles/`. DTMM assets that currently publish at `/assets/` remain course-owned under `cursos/dtmm/shared/assets/` and are copied to the same public path during the build.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js CommonJS build/tests, Playwright with installed Edge, GitHub Actions and GitHub Pages.

---

## File Map

- Create `academy.courses.json`: local course and shared-asset publishing manifest.
- Create `cursos/dtmm/`: DTMM hub, decks, resources, data, course assets and tests.
- Create `cursos/ingles/`: complete Inglés hub, sessions, resources, Grammar Grill and tests.
- Modify `scripts/build-academy.cjs`: consume local course paths only.
- Modify `scripts/test-build-academy.cjs`: prove local-source assembly and failure cases.
- Create `scripts/test-monorepo-boundaries.cjs`: reject external course repositories and missing course ownership.
- Create `scripts/test-academy-hubs-structure.cjs`: preserve both live shell contracts.
- Create `scripts/test-academy-hubs-e2e.cjs`: preserve responsive browser behavior at public routes.
- Create `scripts/academy-live-routes.json`: exact pre-migration public HTML route inventory.
- Create `scripts/test-route-parity.cjs`: prove the generated site retains every live HTML route.
- Modify `.github/workflows/deploy-pages.yml`: remove external checkouts and run local course tests.
- Create `docs/migrations/2026-09-01-course-source-commits.md`: record source commits and ownership cutover.
- Modify DTMM `README.md`, `scripts/test-no-temporary-english.cjs` and course files after production verification only.

### Task 1: Lock the local monorepo contract

**Files:**
- Create: `academy.courses.json`
- Create: `scripts/test-monorepo-boundaries.cjs`
- Modify: `scripts/test-build-academy.cjs`

- [ ] **Step 1: Write the failing boundary test**

Create `scripts/test-monorepo-boundaries.cjs`:

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'academy.courses.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'deploy-pages.yml'), 'utf8');

assert.deepEqual(Object.keys(manifest.courses).sort(), ['dtmm', 'english']);
assert.equal(manifest.courses.dtmm.sourcePath, 'cursos/dtmm');
assert.equal(manifest.courses.dtmm.publicPath, 'dtmm');
assert.equal(manifest.courses.english.sourcePath, 'cursos/ingles');
assert.equal(manifest.courses.english.publicPath, 'ingles');
assert.doesNotMatch(JSON.stringify(manifest), /JavierMillan\/(?:De-tu-mente-al-mundo|hablemos-ingles)/);
assert.doesNotMatch(workflow, /Checkout constellation sources|Checkout English constellation/);
assert.doesNotMatch(workflow, /repository:\s*JavierMillan\/(?:De-tu-mente-al-mundo|hablemos-ingles)/);

console.log('academy monorepo boundaries: PASS');
```

- [ ] **Step 2: Run the boundary test and verify RED**

Run: `node scripts/test-monorepo-boundaries.cjs`

Expected: FAIL because `academy.courses.json` does not exist.

- [ ] **Step 3: Add the local manifest**

Create `academy.courses.json`:

```json
{
  "schemaVersion": 1,
  "legacyHostname": "detumentealmundo.lareddeluz.com",
  "courses": {
    "dtmm": {
      "sourcePath": "cursos/dtmm",
      "publicPath": "dtmm",
      "canonicalBase": "https://academia.lareddeluz.com/dtmm/",
      "sharedPublishes": [
        { "sourcePath": "shared/assets", "publicPath": "assets" }
      ]
    },
    "english": {
      "sourcePath": "cursos/ingles",
      "publicPath": "ingles",
      "canonicalBase": "https://academia.lareddeluz.com/ingles/"
    }
  }
}
```

- [ ] **Step 4: Rewrite the build fixture around local course folders**

In `scripts/test-build-academy.cjs`, remove `dtmmSourceRoot`, `englishSourceRoot`, `sources`, `sourceId`, and `sourceRoots`. Build fixtures directly under:

```js
write('academy/cursos/dtmm/index.html', '<html><head><title>DTMM</title></head><body><img src="../assets/imgs/reddeluz.png"></body></html>');
write('academy/cursos/dtmm/lesson.html', '<html><head><title>Lesson</title></head><body></body></html>');
write('academy/cursos/dtmm/clases.json', JSON.stringify({ filas: [{ clases: [{ deck: 'lesson.html' }] }] }));
write('academy/cursos/dtmm/shared/assets/imgs/reddeluz.png', 'source-logo');
write('academy/cursos/ingles/index.html', '<html><head><title>ENGLISH</title></head><body></body></html>');
write('academy/cursos/ingles/recursos/order-scenarios.json', JSON.stringify({ scenarios: [] }));
```

Use the same manifest schema as `academy.courses.json`, call:

```js
const result = buildAcademy({ academyRoot, outDir, manifestPath });
```

Keep assertions for canonical links, shared assets, missing deck references, missing HTML assets, and refusal to overwrite an unmarked output directory.

- [ ] **Step 5: Run the build test and verify RED**

Run: `node scripts/test-build-academy.cjs`

Expected: FAIL because the builder still requires external `sourceRoots` and the old `sources` manifest.

- [ ] **Step 6: Commit the contract tests and manifest**

```powershell
git add -- academy.courses.json scripts/test-monorepo-boundaries.cjs scripts/test-build-academy.cjs
git commit -m "test: define local Academy course contract"
```

### Task 2: Make the Academy builder local-only

**Files:**
- Modify: `scripts/build-academy.cjs`
- Test: `scripts/test-build-academy.cjs`

- [ ] **Step 1: Replace source validation with course validation**

Use this manifest validation shape:

```js
function validateManifest(manifest) {
  if (manifest.schemaVersion !== 1) throw new Error(`Unsupported manifest schema: ${manifest.schemaVersion}`);
  if (!manifest.courses || typeof manifest.courses !== 'object') throw new Error('Manifest must declare courses');
  for (const [courseId, course] of Object.entries(manifest.courses)) {
    if (!course.sourcePath || !course.publicPath || !course.canonicalBase) {
      throw new Error(`Incomplete course declaration ${courseId}: ${JSON.stringify(course)}`);
    }
  }
}
```

- [ ] **Step 2: Copy courses from Academy-local paths**

Replace the source-root loops in `buildAcademy` with:

```js
for (const [courseId, course] of Object.entries(manifest.courses)) {
  const courseRoot = path.join(academyRoot, course.sourcePath);
  ensureDirectory(courseRoot, `Course root ${courseId}`);
  for (const shared of course.sharedPublishes || []) {
    copyRequired(
      path.join(courseRoot, shared.sourcePath),
      path.join(outDir, shared.publicPath),
      `Shared publish ${courseId}:${shared.sourcePath}`
    );
  }
  const targetRoot = path.join(outDir, course.publicPath);
  copyRequired(courseRoot, targetRoot, `Course ${courseId}`);
  for (const shared of course.sharedPublishes || []) {
    fs.rmSync(path.join(targetRoot, shared.sourcePath.split('/')[0]), { recursive: true, force: true });
  }
  normalizeHtml(targetRoot, course);
}
```

Change the default manifest to `academy.courses.json`; remove `sourceOptions()` and all CLI `--source` parsing. Keep `--manifest` and `--out`.

- [ ] **Step 3: Run the focused build test and verify GREEN**

Run: `node scripts/test-build-academy.cjs`

Expected: `academy build: PASS`.

- [ ] **Step 4: Run portal regression tests**

Run: `node scripts/test-academy-index.cjs`

Expected: `academy links: PASS`.

- [ ] **Step 5: Commit the local builder**

```powershell
git add -- scripts/build-academy.cjs scripts/test-build-academy.cjs academy.courses.json
git commit -m "refactor: build Academy from local courses"
```

### Task 3: Import DTMM and Inglés into course folders

**Files:**
- Create: `cursos/dtmm/**`
- Create: `cursos/ingles/**`
- Create: `docs/migrations/2026-09-01-course-source-commits.md`
- Create: `scripts/test-academy-hubs-structure.cjs`
- Create: `scripts/test-academy-hubs-e2e.cjs`
- Create: `scripts/academy-live-routes.json`
- Create: `scripts/test-route-parity.cjs`

- [ ] **Step 1: Record the immutable source commits**

Create `docs/migrations/2026-09-01-course-source-commits.md` with:

```markdown
# Academy course source cutover

- DTMM academic source: `JavierMillan/De-tu-mente-al-mundo@8d4fbfa67d574959955ade8110f7e2501fae2c22`, directory `presentacion/` plus required root `assets/`.
- Inglés academic source: `JavierMillan/hablemos-ingles@8527c42dcb3d1f9bb3dc8b12033b925c53e83674`, excluding its standalone `CNAME`.
- New authority: `JavierMillan/academia-lareddeluz`, directories `cursos/dtmm/` and `cursos/ingles/`.
```

- [ ] **Step 2: Copy DTMM source without changing text content**

Copy `De-tu-mente-al-mundo/presentacion/*` to `academia/cursos/dtmm/`. Copy `De-tu-mente-al-mundo/assets/` to `academia/cursos/dtmm/shared/assets/`. Use a deterministic recursive copy that includes binary images; do not copy `.git`, `.worktrees`, editor settings, or test results.

- [ ] **Step 3: Copy Inglés source without its standalone deployment file**

Copy the Inglés repository content into `academia/cursos/ingles/`, excluding `.git`, `CNAME`, and `docs/superpowers/`. Keep `assets/`, `clases.json`, sessions, resources, Grammar Grill, brand profile, and `scripts/`.

- [ ] **Step 4: Add the source-structure regression test**

Adapt the existing DTMM `scripts/test-academy-hubs-structure.cjs` so paths are:

```js
const dtmmRoot = path.join(root, 'cursos', 'dtmm');
const englishRoot = path.join(root, 'cursos', 'ingles');
const dtmmHtml = fs.readFileSync(path.join(dtmmRoot, 'index.html'), 'utf8');
const englishHtml = fs.readFileSync(path.join(englishRoot, 'index.html'), 'utf8');
```

Retain assertions for `academy-shell`, `heroSlot`, `theme-dtmm`, `theme-english`, responsive navigation, DTMM design variables, and Inglés design variables. Add:

```js
assert.equal(fs.existsSync(path.join(englishRoot, 'CNAME')), false);
assert.equal(fs.existsSync(path.join(dtmmRoot, 'shared', 'assets', 'imgs', 'reddeluz.png')), true);
```

- [ ] **Step 5: Add the browser layout regression test**

Adapt DTMM's `test-academy-hubs-e2e.cjs` into Academy `scripts/test-academy-hubs-e2e.cjs`:

- Serve the generated `.artifacts/site` directory, not sibling repositories.
- Test routes `/dtmm/` and `/ingles/`.
- Keep viewports `1440`, `1024`, `760`, `430`, and `390`.
- Keep assertions for no overflow, Academy navigation, responsive burger, card backdrop, drawer focus behavior, and Inglés resources navigation.

- [ ] **Step 6: Lock the exact pre-migration route inventory**

Create `scripts/academy-live-routes.json` with the sorted HTML routes generated from the live source commits:

```json
[
  "dtmm/avanzado/automatizar-ia-3.html",
  "dtmm/avanzado/avanzado-conversacion-1.html",
  "dtmm/avanzado/conexion-humana-3.html",
  "dtmm/avanzado/tu-sistema-completo-4.html",
  "dtmm/avanzado/vender-sin-hartar-2.html",
  "dtmm/basico/cadencia-sostenible-3.html",
  "dtmm/basico/formatos-que-funcionan-2.html",
  "dtmm/basico/nadie-te-ve-todavia-6.html",
  "dtmm/basico/redes-desde-cero-1.html",
  "dtmm/basico/tu-celular-ya-es-suficiente-5.html",
  "dtmm/basico/tu-primer-post-4.html",
  "dtmm/clase.html",
  "dtmm/herramientas-ia/recursos/documento-de-voz.html",
  "dtmm/herramientas-ia/recursos/prompt-pipeline-video.html",
  "dtmm/herramientas-ia/tu-asistente-con-tu-voz-3.html",
  "dtmm/herramientas-ia/video-con-codigo-1.html",
  "dtmm/index.html",
  "dtmm/intermedio/avatar-cliente-2.html",
  "dtmm/intermedio/constancia-sin-quemarte-6.html",
  "dtmm/intermedio/crea-tu-carrusel-4.html",
  "dtmm/intermedio/intermedio-algoritmo-1.html",
  "dtmm/intermedio/leer-metricas-3.html",
  "dtmm/intermedio/recursos/banco-de-historias.html",
  "dtmm/intermedio/recursos/banco-de-ideas.html",
  "dtmm/intermedio/recursos/chuleta-respuestas.html",
  "dtmm/intermedio/te-escribieron-5.html",
  "dtmm/intermedio/tu-historia-como-material-7.html",
  "dtmm/masterclass/por-que-nadie-te-escribe.html",
  "dtmm/repaso.html",
  "dtmm/ventas/creatividad-prospectos-2.html",
  "dtmm/ventas/guiones-estrategicos-1.html",
  "dtmm/ventas/recursos/plantilla-seguimiento.html",
  "dtmm/ventas/seguimiento-sin-incomodar-3.html",
  "index.html",
  "ingles/index.html",
  "ingles/recursos.html",
  "ingles/recursos/100-palabras.html",
  "ingles/recursos/flashcards.html",
  "ingles/recursos/grammar-grill.html",
  "ingles/sesion-1.html",
  "ingles/sesion-2.html",
  "ingles/sesion-3.html",
  "ingles/sesion-4.html",
  "ingles/sesion-5.html"
]
```

Create `scripts/test-route-parity.cjs` to recursively collect `.html` files from the output directory passed as its first argument, normalize separators to `/`, sort them, and compare them with `academy-live-routes.json` using `assert.deepEqual`.

- [ ] **Step 7: Run course source tests**

Run:

```powershell
node scripts/test-academy-hubs-structure.cjs
node cursos/ingles/scripts/test-academy-shell.cjs
node cursos/ingles/scripts/test-grammar-grill.cjs
node cursos/ingles/scripts/test-grammar-grill-ui.cjs
```

Expected: all four commands print `PASS`.

- [ ] **Step 8: Build the complete local artifact**

Run: `node scripts/build-academy.cjs --out .artifacts/site`

Expected: `Academy build complete: 2 hubs, 44 HTML files` and no missing-reference error.

- [ ] **Step 9: Verify exact route parity and browser regressions**

Run:

```powershell
node scripts/test-route-parity.cjs .artifacts/site
node scripts/test-academy-hubs-e2e.cjs
node cursos/ingles/scripts/test-grammar-grill-e2e.cjs
```

Expected: `academy route parity: PASS`, `academy hubs browser layout: PASS`, and `grammar-grill browser flows: PASS`.

- [ ] **Step 10: Commit imported course sources**

```powershell
git add -- cursos scripts/test-academy-hubs-structure.cjs scripts/test-academy-hubs-e2e.cjs scripts/academy-live-routes.json scripts/test-route-parity.cjs docs/migrations/2026-09-01-course-source-commits.md
git commit -m "feat: bring Academy courses into one repository"
```

### Task 4: Deploy from the monorepo only

**Files:**
- Modify: `.github/workflows/deploy-pages.yml`
- Test: `scripts/test-monorepo-boundaries.cjs`

- [ ] **Step 1: Remove both external checkout steps**

The workflow must contain only the checkout of Academia. Replace the test/build commands with:

```yaml
      - name: Test Academy
        run: |
          node scripts/test-academy-index.cjs
          node scripts/test-monorepo-boundaries.cjs
          node scripts/test-build-academy.cjs
          node scripts/test-academy-hubs-structure.cjs
          node cursos/ingles/scripts/test-academy-shell.cjs
          node cursos/ingles/scripts/test-grammar-grill.cjs
          node cursos/ingles/scripts/test-grammar-grill-ui.cjs

      - name: Assemble Academy
        run: node scripts/build-academy.cjs --out _site

      - name: Verify public route parity
        run: node scripts/test-route-parity.cjs _site
```

Do not run Playwright in Actions unless Edge/Chromium installation is added explicitly; browser regressions remain a required local pre-push gate.

- [ ] **Step 2: Run the boundary test and verify GREEN**

Run: `node scripts/test-monorepo-boundaries.cjs`

Expected: `academy monorepo boundaries: PASS`.

- [ ] **Step 3: Run the complete pre-push verification**

Run:

```powershell
node scripts/test-academy-index.cjs
node scripts/test-monorepo-boundaries.cjs
node scripts/test-build-academy.cjs
node scripts/test-academy-hubs-structure.cjs
node cursos/ingles/scripts/test-academy-shell.cjs
node cursos/ingles/scripts/test-grammar-grill.cjs
node cursos/ingles/scripts/test-grammar-grill-ui.cjs
node scripts/build-academy.cjs --out .artifacts/site
node scripts/test-route-parity.cjs .artifacts/site
node scripts/test-academy-hubs-e2e.cjs
node cursos/ingles/scripts/test-grammar-grill-e2e.cjs
git diff --check
```

Expected: every Node command prints `PASS`, build reports 2 hubs and 44 HTML files, and `git diff --check` has no output.

- [ ] **Step 4: Commit the workflow cutover**

```powershell
git add -- .github/workflows/deploy-pages.yml scripts/test-monorepo-boundaries.cjs
git commit -m "ci: deploy Academy from monorepo courses"
```

### Task 5: Publish and verify the unchanged live site

**Files:**
- No source changes expected.

- [ ] **Step 1: Synchronize and publish Academy**

```powershell
git fetch origin --prune
git rebase origin/master
git push origin master
```

Expected: push advances `JavierMillan/academia-lareddeluz` and triggers `Deploy Academia`.

- [ ] **Step 2: Wait for the exact deployment commit**

Run `gh run list --workflow deploy-pages.yml --limit 3`, identify the run whose head SHA equals local `git rev-parse HEAD`, then run `gh run watch <run-id> --exit-status`.

Expected: workflow conclusion `success`.

- [ ] **Step 3: Verify public HTTP routes**

Require HTTP 200 for:

```text
https://academia.lareddeluz.com/
https://academia.lareddeluz.com/dtmm/
https://academia.lareddeluz.com/dtmm/masterclass/por-que-nadie-te-escribe.html
https://academia.lareddeluz.com/ingles/
https://academia.lareddeluz.com/ingles/recursos.html
https://academia.lareddeluz.com/ingles/recursos/grammar-grill.html
https://academia.lareddeluz.com/ingles/recursos/order-scenarios.json
```

- [ ] **Step 4: Verify live browser contracts**

Inspect `/`, `/dtmm/`, and `/ingles/` at desktop and mobile widths. Confirm the same headings, themes, Academy navigation, representative class links, no page errors, and no horizontal overflow as the pre-migration live capture.

### Task 6: Retire DTMM's duplicate academic working tree

**Files in `De-tu-mente-al-mundo`:**
- Delete: `presentacion/**`
- Delete: `scripts/test-academy-hubs-structure.cjs`
- Delete: `scripts/test-academy-hubs-e2e.cjs`
- Delete: `scripts/test-session-5-menu.cjs`
- Delete: `scripts/test-session-5-menu-e2e.cjs`
- Modify: `scripts/test-no-temporary-english.cjs`
- Modify: `README.md`
- Modify: `index.html`

- [ ] **Step 1: Write the failing ownership test before deletion**

Rename `scripts/test-no-temporary-english.cjs` to `scripts/test-no-academy-courses.cjs` and assert:

```js
assert.equal(fs.existsSync(path.join(root, 'presentacion')), false,
  'DTMM landing repo must not contain Academy course source');
assert.equal(fs.existsSync(path.join(root, 'ingles')), false,
  'DTMM landing repo must not contain English course source');
assert.match(home, /https:\/\/academia\.lareddeluz\.com\/dtmm\//,
  'DTMM landing must link to its Academy course');
```

- [ ] **Step 2: Run the ownership test and verify RED**

Run: `node scripts/test-no-academy-courses.cjs`

Expected: FAIL because `presentacion/` still exists.

- [ ] **Step 3: Point the DTMM landing to its Academy course**

Add a clearly labeled course link to `https://academia.lareddeluz.com/dtmm/` in the landing's community/action area. Preserve the existing Inglés link and the rest of the commercial landing content.

- [ ] **Step 4: Remove only the verified duplicate academic files**

After confirming the deployed Academy commit and live routes, remove the exact files listed above. Preserve DTMM root landing files, `assets/`, `css/`, `guia/`, `masterclass/`, `servicios.html`, local editor settings, and unrelated untracked files.

- [ ] **Step 5: Document the authority link**

Add to DTMM `README.md`:

```markdown
## Academia

Este repositorio contiene la landing comercial de De tu Mente al Mundo.
Las clases, decks y recursos académicos viven en
`JavierMillan/academia-lareddeluz`, carpeta `cursos/dtmm/`, y se publican en
https://academia.lareddeluz.com/dtmm/.
```

- [ ] **Step 6: Verify and commit DTMM cleanup**

```powershell
node scripts/test-no-academy-courses.cjs
git diff --check
git add -- README.md index.html scripts/test-no-academy-courses.cjs
git add -u -- presentacion scripts/test-academy-hubs-structure.cjs scripts/test-academy-hubs-e2e.cjs scripts/test-session-5-menu.cjs scripts/test-session-5-menu-e2e.cjs scripts/test-no-temporary-english.cjs
git commit -m "chore: keep DTMM repo focused on its landing"
git push origin main
```

Expected: ownership test prints `PASS`; only the landing repo changes are committed; unrelated untracked files remain untouched.

### Task 7: Final authority audit

**Files:**
- No source changes expected.

- [ ] **Step 1: Verify Academy remote owns both courses**

Run:

```powershell
git -C "C:\Users\Usuario\Documents\La red de luz\Pages\academy" ls-tree -r origin/master --name-only cursos/dtmm cursos/ingles
```

Expected: both trees contain their hubs, lessons/resources, assets, data, and tests.

- [ ] **Step 2: Verify DTMM remote no longer owns academic source**

Run:

```powershell
git -C "C:\Users\Usuario\Documents\Proyectos\De-tu-mente-al-mundo" ls-tree -r origin/main --name-only presentacion ingles
```

Expected: no output.

- [ ] **Step 3: Record Inglés as historical, not authoritative**

Do not modify or delete `hablemos-ingles` during this code migration. Report its head `8527c42dcb3d1f9bb3dc8b12033b925c53e83674` as the imported historical source and recommend archiving the GitHub repository as a separate administrative action.

- [ ] **Step 4: Report the one-repo editing workflow**

Future changes use only:

```powershell
cd "C:\Users\Usuario\Documents\La red de luz\Pages\academy"
git pull --ff-only
# edit cursos/dtmm/ or cursos/ingles/
node scripts/build-academy.cjs --out .artifacts/site
git add -- cursos scripts .github
git commit -m "..."
git push origin master
```

The single push runs the single Academy deployment.
