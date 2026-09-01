# Academy Monorepo Design

## Goal

Make `JavierMillan/academia-lareddeluz` the single source of authority for every academic course while preserving the current live site exactly:

- `https://academia.lareddeluz.com/`
- `https://academia.lareddeluz.com/dtmm/`
- `https://academia.lareddeluz.com/ingles/`

This is a repository and deployment consolidation, not a redesign.

## Ownership Boundary

`De-tu-mente-al-mundo` remains the source of authority for the commercial landing page at `detumentealmundo.lareddeluz.com`. Its academic `presentacion/` tree moves to Academia and is removed from the landing repository only after the new deployment is verified.

The complete Inglés course moves from `hablemos-ingles` to Academia. After verification, `hablemos-ingles` is no longer an editable source for Academia. Its Git history remains available for recovery, and repository archival or standalone-domain retirement is a separate administrative step.

## Repository Structure

```text
academia-lareddeluz/
├── index.html
├── CNAME
├── assets/                     # portal-wide assets
├── cursos/
│   ├── dtmm/                   # all DTMM academic source
│   └── ingles/                 # all English academic source
├── academy.courses.json        # local course-to-public-path manifest
├── scripts/
├── docs/
└── .github/workflows/deploy-pages.yml
```

Each course owns its hub, classes, decks, data, resources, scripts, and course-specific styles. Shared portal assets remain at the repository root only when they are genuinely shared.

## Public Build Contract

The source folders are not exposed as `/cursos/...`. The build maps them as follows:

| Repository source | Public output |
| --- | --- |
| `index.html`, `assets/` | `/` |
| `cursos/dtmm/` | `/dtmm/` |
| `cursos/ingles/` | `/ingles/` |

The existing visual design, navigation labels, cards, course content, relative routes, and canonical URLs remain unchanged.

## Build Changes

`scripts/build-academy.cjs` will read only local Academy paths. `academy.sources.json` will be replaced by `academy.courses.json`, where every course declares its local `sourcePath`, public path, and canonical base.

The GitHub Actions workflow will:

1. Check out only `academia-lareddeluz`.
2. Run portal, course, link, and build tests.
3. Assemble the local course folders into `_site`.
4. Deploy the same GitHub Pages site and custom domain.

No workflow step will check out `De-tu-mente-al-mundo` or `hablemos-ingles`.

## Migration Strategy

The migration is additive before it is subtractive:

1. Record the exact source commits used for DTMM and Inglés.
2. Copy DTMM academic files into `cursos/dtmm/` and Inglés files into `cursos/ingles/`.
3. Adjust only repository-relative asset paths required by the new local location.
4. Build locally and compare route inventory, DOM contracts, assets, and key browser flows with production.
5. Deploy from the Academy monorepo and verify all public routes.
6. Remove `presentacion/` and its Academy-only tests from the DTMM landing repo.
7. Freeze the Inglés repo as a historical source; it is no longer used by Academy.

Old files remain recoverable from Git history. No source is removed before the Academy deployment succeeds.

## Course Isolation

- A DTMM change must touch `cursos/dtmm/` and its tests.
- An Inglés change must touch `cursos/ingles/` and its tests.
- Portal changes stay in root `index.html` and root `assets/`.
- Course-local links must resolve inside their public course path or to an explicit shared portal asset.
- Tests must reject dependencies on sibling repositories and legacy source directories.

## Verification

Before the cutover, automated tests will prove:

- The build requires no external source repositories.
- `/`, `/dtmm/`, and `/ingles/` are generated.
- Every current live HTML route still exists.
- Local links and JSON deck/resource references resolve.
- Canonical URLs remain under `academia.lareddeluz.com`.
- DTMM and Inglés retain their current Academy shell and constellation themes.
- Grammar Grill model, UI, and browser flows remain green.
- Desktop and mobile pages have no horizontal overflow.

After deployment, HTTP and browser checks will verify the portal, both hubs, representative class pages, resources, Grammar Grill, navigation back to all constellations, and console errors.

## Success Criteria

- Academia is visually and functionally unchanged from the current live version.
- All academic code is committed in `academia-lareddeluz` under course folders.
- Course edits require one repository, one commit flow, and one deployment.
- DTMM's commercial landing remains independent and live.
- Academy no longer reads, checks out, or schedules synchronization from the two former course repositories.
