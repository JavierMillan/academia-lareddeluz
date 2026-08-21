# Fix Academy Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the DTMM and English learning hubs under Academia and make every Academy portal link stay on `academia.lareddeluz.com`.

**Architecture:** GitHub Actions assembles one `_site` artifact from the Academia repository and a clean checkout of `JavierMillan/De-tu-mente-al-mundo`. A versioned JSON manifest declares source-to-public mappings; a dependency-free Node script copies the sources, normalizes the one legacy cross-hub path, injects canonical URLs, and rejects stale domain links or missing local assets before deployment.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js standard library, GitHub Actions and GitHub Pages.

---

### Task 1: Lock the public URL contract with failing tests

**Files:**
- Modify: `scripts/test-academy-index.cjs`
- Create: `scripts/test-build-academy.cjs`

- [ ] **Step 1: Add assertions for the two canonical portal links**

Extract `.portal.dtmm` and `.portal.english` from `index.html` and assert their `href` values are `https://academia.lareddeluz.com/dtmm/` and `https://academia.lareddeluz.com/ingles/`.

- [ ] **Step 2: Add an assembly test fixture**

Create temporary Academia/source trees, call `buildAcademy({ academyRoot, sourceRoot, outDir, manifestPath })`, then assert that it copies both hubs and shared assets, rewrites `../presentacion/` to `../dtmm/`, injects canonical links, and rejects a missing referenced asset.

- [ ] **Step 3: Run tests and verify RED**

Run: `node scripts/test-academy-index.cjs; node scripts/test-build-academy.cjs`

Expected: portal assertion fails because the homepage still points to the old hostname, and the build test fails because `scripts/build-academy.cjs` does not exist.

### Task 2: Implement the declarative site assembler

**Files:**
- Create: `academy.sources.json`
- Create: `scripts/build-academy.cjs`

- [ ] **Step 1: Declare the source mappings**

Add `dtmm` (`presentacion` → `dtmm`) and `english` (`ingles` → `ingles`) entries, plus shared `assets`, the legacy hostname, and each canonical base URL.

- [ ] **Step 2: Implement the minimal builder**

Export `buildAcademy(options)` and provide a CLI. Copy only the Academy shell (`index.html`, `CNAME`, `assets`) and manifest-declared source folders. During the copy, rewrite the English dependency `../presentacion/` to `../dtmm/` and inject one canonical link per HTML document.

- [ ] **Step 3: Validate the artifact**

Scan local `href`/`src` references in generated HTML, fail for missing files, and fail if any generated navigation link uses `detumentealmundo.lareddeluz.com`.

- [ ] **Step 4: Run the assembly test and verify GREEN**

Run: `node scripts/test-build-academy.cjs`

Expected: `academy build: PASS`.

### Task 3: Switch the homepage links

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace the two legacy portal URLs**

Use `/dtmm/` for De tu Mente al Mundo and `/ingles/` for Hablemos Inglés, both on the Academia hostname.

- [ ] **Step 2: Run the homepage regression test**

Run: `node scripts/test-academy-index.cjs`

Expected: `academy links: PASS`.

### Task 4: Publish the assembled artifact with GitHub Pages

**Files:**
- Create: `.github/workflows/deploy-pages.yml`

- [ ] **Step 1: Add the Pages workflow**

Checkout Academia, checkout `JavierMillan/De-tu-mente-al-mundo` into `.sources/dtmm`, run both tests, build `_site`, upload it with `actions/upload-pages-artifact`, and deploy with `actions/deploy-pages`. Trigger on `master`, manual dispatch, and a daily schedule.

- [ ] **Step 2: Build from the real local source checkout**

Run: `node scripts/build-academy.cjs --source-root "C:\Users\Usuario\Documents\Proyectos\De-tu-mente-al-mundo" --out .artifacts/site`

Expected: build completes and reports both hubs with zero broken local links.

- [ ] **Step 3: Run all local verification**

Run: `node scripts/test-academy-index.cjs; node scripts/test-build-academy.cjs; node scripts/build-academy.cjs --source-root "C:\Users\Usuario\Documents\Proyectos\De-tu-mente-al-mundo" --out .artifacts/site; git diff --check`

Expected: all commands exit 0.

### Task 5: Deploy and verify production

**Files:**
- No additional source files.

- [ ] **Step 1: Commit and push the reviewed changes**

Merge `fix/academy-links` into `master` and push `origin/master`.

- [ ] **Step 2: Ensure Pages uses GitHub Actions and wait for deployment**

Use GitHub repository settings/API to select the workflow-based Pages build if required, then wait for the deploy workflow to succeed.

- [ ] **Step 3: Verify public routes and navigation**

Confirm HTTP 200 for `/`, `/dtmm/`, `/ingles/`, and `/ingles/recursos.html`; fetch the public homepage and confirm neither portal points to `detumentealmundo.lareddeluz.com`.
