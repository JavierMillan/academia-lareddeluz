# Canonical Constellation Sources Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `hablemos-ingles` the only source of the English constellation, keep DTMM limited to DTMM content, and deploy both under Academia without duplicated source code.

**Architecture:** Academia will assemble DTMM from `JavierMillan/De-tu-mente-al-mundo@main` and English from `JavierMillan/hablemos-ingles@master`. The manifest assigns each hub a `sourceId`; the builder receives an explicit source-root map. The temporary `ingles/` tree is removed from DTMM only after the canonical English repository passes its own tests.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js standard library, GitHub Actions, GitHub Pages.

---

### Task 1: Define the multi-repository publishing contract

**Files:**
- Modify: `academy.sources.json`
- Modify: `scripts/test-build-academy.cjs`

- [ ] **Step 1: Write a failing two-source fixture**

Create separate `dtmmSourceRoot` and `englishSourceRoot` fixture directories. Place a deliberately stale `ingles/index.html` under DTMM and the expected page under English. Call `buildAcademy` with `sourceRoots: { dtmm, english }` and assert the generated `/ingles/` page comes from English.

- [ ] **Step 2: Run the builder test and verify RED**

Run: `node scripts/test-build-academy.cjs`

Expected: FAIL because the current builder accepts only one `sourceRoot`.

- [ ] **Step 3: Declare both repositories**

Set manifest sources to `dtmm` and `english`, assign `sourceId` on each hub, keep DTMM shared assets at the site root, and explicitly include the public files from the standalone English repository.

### Task 2: Teach Academia to assemble independent sources

**Files:**
- Modify: `scripts/build-academy.cjs`
- Modify: `.github/workflows/deploy-pages.yml`

- [ ] **Step 1: Implement source-root resolution**

Change `buildAcademy` to require `sourceRoots[sourceId]`, copy source-level shared paths, and support a hub `includePaths` allowlist so repository metadata is never copied.

- [ ] **Step 2: Update the CLI and workflow**

Accept repeated `--source id=path` arguments. Checkout DTMM to `.sources/dtmm`, checkout `hablemos-ingles` to `.sources/english`, and build with both source mappings.

- [ ] **Step 3: Verify GREEN with fixtures and real repositories**

Run: `node scripts/test-build-academy.cjs`

Run: `node scripts/build-academy.cjs --source dtmm="C:\Users\Usuario\Documents\Proyectos\De-tu-mente-al-mundo" --source english="C:\Users\Usuario\Documents\Proyectos\ingles-lareddeluz" --out .artifacts/site`

Expected: both commands pass and `/ingles/recursos/order-scenarios.json` exists in the artifact.

### Task 3: Put Grammar Grill verification in its canonical repository

**Files (repository `ingles-lareddeluz`):**
- Create: `scripts/test-grammar-grill.cjs`
- Create: `scripts/test-grammar-grill-ui.cjs`
- Create: `scripts/test-grammar-grill-e2e.cjs`

- [ ] **Step 1: Add model and UI contracts**

Load resources from `recursos/`, validate both scenarios and role-specific phrase banks, compile the browser script, and assert it fetches `order-scenarios.json`.

- [ ] **Step 2: Add browser flows for the scenario-first UI**

Select McDonald's before selecting Customer/Staff, derive phrase answers from the active scenario catalog, complete both roles, and check mobile overflow and reduced motion.

- [ ] **Step 3: Run all canonical tests**

Run: `node scripts/test-grammar-grill.cjs; node scripts/test-grammar-grill-ui.cjs; node scripts/test-grammar-grill-e2e.cjs`

Expected: three PASS messages and no browser errors.

### Task 4: Retire the temporary English copy from DTMM

**Files (repository `De-tu-mente-al-mundo`):**
- Create: `scripts/test-no-temporary-english.cjs`
- Modify: `index.html`
- Delete: `ingles/**`
- Delete: `scripts/test-grammar-grill.cjs`
- Delete: `scripts/test-grammar-grill-ui.cjs`
- Delete: `scripts/test-grammar-grill-registry.cjs`
- Delete: `scripts/test-grammar-grill-e2e.cjs`

- [ ] **Step 1: Write and run the ownership guard test**

Assert that `ingles/` does not exist and DTMM's public link targets `https://academia.lareddeluz.com/ingles/`. Run it and verify RED against the temporary tree.

- [ ] **Step 2: Update the link and delete the verified duplicate**

Replace `href="ingles/index.html"` with the canonical Academia URL. Delete the 20-file temporary tree and the Grammar Grill tests that now live in `hablemos-ingles`.

- [ ] **Step 3: Verify the ownership guard**

Run: `node scripts/test-no-temporary-english.cjs`

Expected: `DTMM constellation ownership: PASS`.

### Task 5: Publish and verify production

**Files:**
- No additional files.

- [ ] **Step 1: Commit and push each scoped repository change**

Stage only the paths listed above. Push `hablemos-ingles`, DTMM, and Academia to their default branches after tests pass.

- [ ] **Step 2: Run the Academia deployment**

Dispatch `deploy-pages.yml`, wait for success, and inspect failed logs if necessary.

- [ ] **Step 3: Verify canonical production**

Confirm HTTP 200 for Academia's English hub, Grammar Grill, and `order-scenarios.json`; confirm the published script contains the scenario fetch and role-specific employee phrases; confirm DTMM no longer tracks an `ingles/` tree.
