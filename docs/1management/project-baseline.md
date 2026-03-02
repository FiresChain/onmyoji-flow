# Project Baseline

## 1. Canonical Identity

- Project: `onmyoji-flow`
- Package: `@rookie4show/onmyoji-flow`
- Type: standalone app + embeddable Vue component library
- Historical alias policy: `yys-editor` is historical context only, not current canonical naming

## 2. Distribution Artifacts

- ESM: `dist/onmyoji-flow.es.js`
- UMD: `dist/onmyoji-flow.umd.js`
- CSS: `dist/onmyoji-flow.css`
- `package.json` entry points:
  - `main`: `./dist/onmyoji-flow.umd.js`
  - `module`: `./dist/onmyoji-flow.es.js`
  - `exports["."]`: import/require dual entry
  - `exports["./style.css"]`: `./dist/onmyoji-flow.css`

## 3. Branch And Workflow Baseline

- Collaboration baseline branch: `develop` (team convention in `AGENTS.md`)
- Current Pages workflow: `.github/workflows/build-pages.yml`
  - Trigger branch: `master`
  - Build command: `npm run build:pages`
  - Deploy target: GitHub Pages

## 4. Build And Dev Commands

- Install: `npm ci`
- Dev: `npm run dev`
- Build library: `npm run build:lib`
- Build app: `npm run build:app`
- Build pages: `npm run build:pages`
- Test: `npm test`
- Lint: `npm run lint`

## 5. Quality Gate Baseline

Target refactory gate set (as defined in `docs/2design/Refactory.md` and `AGENTS.md`):

1. `npm test`
2. `npm run lint`
3. `npm run typecheck`
4. `npx prettier --check "src/**/*.{js,ts,vue}"`
5. `npm run build:lib`

Current script status (`package.json`):

- Present: `test`, `lint`, `build:lib`
- Missing: `typecheck` script
- Missing: explicit prettier check script

## 6. Source Of Truth References

- Management plan: `docs/1management/plan.md`
- Workflow notes: `docs/1management/workflow.md`
- Refactor design: `docs/2design/Refactory.md`
- Session handoff log: `docs/1management/refactory-session-log.md`
