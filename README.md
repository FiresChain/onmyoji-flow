# onmyoji-flow

`onmyoji-flow` is a standalone flow editor and embeddable Vue component package.

## Package

- npm name: `@rookie4show/onmyoji-flow`
- style entry: `@rookie4show/onmyoji-flow/style.css`

## Local Development

```bash
npm install
npm run dev
```

阵容码由 `team-code/decode` 服务解码为成员、技能和御魂 ID。Flow 使用运行时从 R2 加载的素材目录解析名称与头像，并在客户端生成画布。旧服务返回的 `fileList` 在迁移期间仍可导入。

## Build

```bash
# library build for npm publish
npm run build:lib

# app build (output: dist-app)
npm run build:app

# app build for GitHub Pages (/onmyoji-flow/, output: dist-app)
npm run build:pages
```

## Quality Gates

```bash
npm test
npm run lint
npm run typecheck
npm run format:check
```

## Use as Vue Component

```ts
import { YysEditorEmbed, YysEditorPreview } from '@rookie4show/onmyoji-flow'
import '@rookie4show/onmyoji-flow/style.css'
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
