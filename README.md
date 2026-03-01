# onmyoji-flow

`onmyoji-flow` is a standalone flow editor and embeddable Vue component package.

## Package

- npm name: `@fireschain/onmyoji-flow`
- style entry: `@fireschain/onmyoji-flow/style.css`

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
# library build for npm publish
npm run build:lib

# app build (output: dist-app)
npm run build:app

# app build for GitHub Pages (/onmyoji-flow/, output: dist-app)
npm run build:pages
```

## Use as Vue Component

```ts
import { YysEditorEmbed, YysEditorPreview } from '@fireschain/onmyoji-flow'
import '@fireschain/onmyoji-flow/style.css'
```

## Publish to npm

```bash
npm login
npm run build:lib
npm publish
```

## Deploy to GitHub Pages

`build-pages.yml` is the only workflow now.
It builds on `master` branch push and deploys `dist-app` to GitHub Pages automatically.
In repository settings, set Pages source to `GitHub Actions`.
Deployment job runs only when repository variable `PAGES_DEPLOY_ENABLED=true`.
