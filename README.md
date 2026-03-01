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

`publish-npm.yml` can publish automatically on git tag `v*` if `NPM_TOKEN` is configured in repository secrets.

## Deploy to GitHub Pages

`deploy-pages.yml` only builds on `master` branch push and uploads `dist-app` as a workflow artifact.  
You can choose the final GitHub Pages source/path in repository settings.
