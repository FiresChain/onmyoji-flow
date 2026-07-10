# Feature Module Architecture

## 1. Status And Goals

This document defines the target architecture for the `refactor/feature-modules`
work. The directory tree below is a migration target, not a statement that every
module already exists.

Migration status (2026-07-10): Phases 1-6 are implemented. This includes
`core/document`, `core/logicflow`, instance `EditorContext`, editor
runtime/commands/node-types, the workspace/assets/group-rules/capture/locale
features, four feature dialog hosts, and the emit-only common command bar. Phase 7
still needs standalone/embed shells and thin root facades; Phase 8 still needs the
final architecture gates.

The refactor must:

1. keep the standalone application and embeddable component behavior compatible;
2. provide one source of truth for document contracts and LogicFlow adapters;
3. isolate runtime state, settings, dialogs, persistence, timers, and observers per
   editor instance;
4. move business capabilities behind explicit feature boundaries;
5. reduce `App.vue`, `YysEditorEmbed.vue`, `FlowEditor.vue`, and the toolbar to
   composition facades;
6. preserve public API, serialized data, storage keys, and existing UI behavior.

This refactor does not add product features or redesign the UI. The existing team
code import remains in place through an adapter. A future `features/team-code`
module may own conversion, QR, copy, and preview behavior, but this refactor does
not create an empty module or move `teamCodeService.ts`.

## 2. Target Directory Structure

```text
src/
├── main.js
├── index.js
├── App.vue
├── YysEditorEmbed.vue
├── flowRuntime.ts
├── shells/
│   ├── standalone/
│   │   ├── StandaloneEditorShell.vue
│   │   └── AboutDialogs.vue
│   ├── embed/
│   │   ├── EmbedEditorShell.vue
│   │   ├── PreviewCanvas.vue
│   │   └── composables/
│   │       ├── useEmbedDataSync.ts
│   │       ├── useEmbedResize.ts
│   │       └── useEmbedViewport.ts
│   └── common/
│       └── EditorCommandBar.vue
├── core/
│   ├── document/
│   │   ├── types.ts
│   │   ├── nodeStyle.ts
│   │   ├── normalizeGraph.ts
│   │   ├── migrations.ts
│   │   ├── validation.ts
│   │   └── root-document.v1.json
│   └── logicflow/
│       ├── types.ts
│       ├── createRuntime.ts
│       ├── registerNodes.ts
│       ├── pluginPresets.ts
│       ├── graphIO.ts
│       └── viewport.ts
├── editor/
│   ├── context/
│   │   ├── EditorContext.ts
│   │   └── useEditorContext.ts
│   ├── components/
│   │   ├── FlowEditor.vue
│   │   ├── NodePalette.vue
│   │   ├── Inspector.vue
│   │   ├── StyleInspector.vue
│   │   ├── CanvasControls.vue
│   │   ├── ProblemsDock.vue
│   │   └── EditorDialogHost.vue
│   ├── runtime/
│   │   ├── lifecycle.ts
│   │   ├── mountEditorRuntime.ts
│   │   ├── bindEditorEvents.ts
│   │   ├── keyboardShortcuts.ts
│   │   ├── contextMenu.ts
│   │   ├── canvasInteraction.ts
│   │   └── groupRuleOrchestrator.ts
│   ├── commands/
│   │   ├── selection.ts
│   │   ├── nodeState.ts
│   │   ├── arrange.ts
│   │   ├── layers.ts
│   │   ├── grouping.ts
│   │   ├── assetTheme.ts
│   │   ├── captureSnapshot.ts
│   │   └── problemNavigation.ts
│   └── node-types/
│       ├── registry.ts
│       ├── palette.ts
│       ├── image/
│       ├── text/
│       ├── vector/
│       ├── asset-selector/
│       ├── dynamic-group/
│       └── property-rule/
├── features/
│   ├── workspace/
│   │   ├── model/
│   │   ├── filesStore.ts
│   │   ├── filesPersistence.ts
│   │   ├── useWorkspaceSession.ts
│   │   ├── documentTransfer.ts
│   │   ├── teamCodeImportAdapter.ts
│   │   └── ui/WorkspaceDialogHost.vue
│   ├── assets/
│   │   ├── model/
│   │   ├── catalog/
│   │   ├── customAssetsRepository.ts
│   │   ├── assetTheme.ts
│   │   ├── assetUrlResolver.ts
│   │   ├── nodeAppearanceRepository.ts
│   │   └── ui/AssetsDialogHost.vue
│   ├── group-rules/
│   │   ├── model/
│   │   ├── expression/
│   │   ├── validateGroupRules.ts
│   │   ├── rulesRepository.ts
│   │   └── ui/GroupRuleDialogHost.vue
│   ├── capture/
│   │   ├── captureCanvas.ts
│   │   ├── watermarkRepository.ts
│   │   └── ui/CaptureDialogHost.vue
│   └── locale/
│       ├── locale.ts
│       ├── createEditorI18n.ts
│       └── messages/
├── shared/
│   ├── platform/
│   │   ├── storage.ts
│   │   ├── clipboard.ts
│   │   └── download.ts
│   └── ui/
├── data/
├── assets/
├── types/
└── __tests__/
    ├── contracts/
    ├── core/
    ├── editor/
    ├── features/
    ├── integration/
    └── fixtures/
```

The root files are public or application facades. `shells` compose a runtime shape;
`editor` owns visual editing; `features` own business capabilities; `core` owns
framework-neutral document contracts and the minimum LogicFlow adapter; `shared`
contains domain-neutral browser utilities and stateless UI.

## 3. Dependency Rules

| Layer             | Allowed dependencies                                   | Forbidden dependencies                            |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------- |
| Root entry points | shells and public facades                              | business algorithm implementations                |
| shells            | editor, features, core, shared                         | persisted domain state and direct LogicFlow calls |
| editor            | feature public model/services, core, shared, data      | localStorage and RootDocument persistence         |
| features          | core, shared, data, explicitly declared feature models | shells, editor components, other feature UI       |
| core/document     | shared types                                           | Vue, DOM, LogicFlow, localStorage                 |
| core/logicflow    | core/document, shared, LogicFlow SDK                   | editor node implementations and business features |
| shared            | browser standard APIs and domain-neutral libraries     | editor, features, Onmyoji data                    |
| data/types        | no runtime dependencies                                | DOM, mutable instance state, side effects         |

Cross-feature calls go through that feature's `public.ts`. These files are internal
repository boundaries and must not be added to npm `exports`.

Additional enforced constraints:

- App, Embed, command bar, and stores do not directly call LogicFlow
  `render`, `getGraphRawData`, `setZIndex`, `zoom`, or transform APIs.
- Stores do not import LogicFlow, Element Plus, DOM APIs, or `EditorContext`.
- Default nodes are declared only in `editor/node-types/registry.ts`;
  `core/logicflow/registerNodes.ts` only applies registrations passed to it.
- A node's View, Model, Inspector, defaults, and registration are colocated by node
  type. Each `definition.ts` supplies its type, fresh properties factory, and where
  applicable its registration factory.
- The default Vue registry order is `propertySelect`, `imageNode`, `assetSelector`,
  `textNode`, `vectorNode`. `dynamic-group` remains plugin-registered and is not a
  Vue node registration. Palette creation must return fresh nested properties.
- Every listener, timer, observer, and subscription mount function returns a real
  disposer.
- No new mutable module-level `Map`, `ref`, `reactive`, or configuration singleton is
  allowed.
- Internal code must not import types back from `YysEditorEmbed.vue`, `App.vue`, or
  `index.js`.
- `utils/`, `configs/`, `stores/`, and `ts/` cease to be business-code containers
  after migration.

## 4. Ownership And Interfaces

### 4.1 Document Contract

`core/document` is the only source of truth for `GraphData`, `RootDocument`, and
viewport transform types. It also owns normalization, legacy migration, runtime
validation, and the root-document schema. It must remain usable without Vue, DOM,
or LogicFlow.

`GraphData` continues to be re-exported from the package entry. Existing serialized
fields, `schemaVersion`, migrations, and `zIndex` round trips remain compatible.

### 4.2 LogicFlow Adapter

`core/logicflow` exposes an `EditorPort` instead of leaking a LogicFlow instance to
App, Embed, command bar, or workspace state:

```ts
interface EditorPort {
  render(data: GraphData): void;
  capture(): GraphData;
  clear(): void;
  getViewport(): Transform;
  setViewport(transform: Transform): void;
  fitView(): void;
  dispose(): void;
}
```

Plugin presets distinguish interactive and render-only runtimes. Both modes consume
the same default node registry. Preview keeps the existing behavior of hiding
dynamic-group nodes. Custom preview `plugins` and `nodeRegistrations` retain their
current replacement semantics; this does not extend edit-mode customization.

### 4.3 Editor Context

Every mounted editor receives one context containing runtime, canvas settings,
dialog state, locale, and asset URL resolver. Context creation copies compatibility
defaults such as `setAssetBaseUrl` into the instance; later changes do not mutate an
already mounted instance.

```ts
interface EditorContext {
  port: EditorPort;
  settings: EditorSettings;
  dialogs: EditorDialogs;
  resolveAssetUrl(path: string): string;
  dispose(): void;
}
```

The context is provided/injected per component tree. No runtime or settings lookup
depends on a module-level mutable registry.

### 4.4 Workspace Persistence

Workspace state is serializable Pinia data only. Runtime coordination lives in
`useWorkspaceSession`, import/export and data preview live in `documentTransfer`,
and storage/timer behavior lives behind `FilesPersistence`:

```ts
interface FilesPersistence {
  load(): RootDocument | null;
  save(document: RootDocument): void;
  remove(): void;
  flush(): void;
  dispose(): void;
}
```

Standalone mode uses the existing `filesStore` storage key. Embed mode uses an
in-memory adapter and must not persist or share workspace state across instances.
Storage recovery removes only owned keys and never calls `localStorage.clear()`.

### 4.5 Feature Hosts And Commands

Phase 6 moves feature dialogs, drafts, repositories, file inputs, and commands
behind their owning feature boundaries:

| Capability        | Implemented owner                                     |
| ----------------- | ----------------------------------------------------- |
| Import/preview    | `features/workspace/ui/WorkspaceDialogHost.vue`       |
| Assets/themes     | `features/assets/ui/AssetsDialogHost.vue`             |
| Group rules       | `features/group-rules/ui/GroupRuleDialogHost.vue`     |
| Capture/watermark | `features/capture/ui/CaptureDialogHost.vue`           |
| Locale/messages   | `features/locale/locale.ts` and `createEditorI18n.ts` |

`shells/common/EditorCommandBar.vue` is controlled and emit-only: it receives
settings, locale, and a translation callback, then emits commands or setting
updates. It does not import feature repositories, save drafts, or access LogicFlow.

`components/Toolbar.vue` is a transitional composition facade. It maps command-bar
events to feature-host exposed methods and workspace command services, persists
standalone locale selection through the locale feature key, and supplies narrow
editor bridge callbacks for capture and applying an asset theme. Feature algorithms
and feature-owned dialog state do not live in the facade. Phase 7 will move this
composition into standalone/embed shells.

Each listener or subscription is disposed by the module that mounts it. For
example, the asset host owns its repository subscription, while
`editor/runtime/groupRuleOrchestrator.ts` owns the group-rule validation
subscription.

## 5. Public Compatibility

The refactor preserves:

- all `YysEditorEmbed` props, emits, exposed methods, default export, and named
  export;
- the `YysEditorPreview` alias and current `flowRuntime.ts` exports;
- `GraphData` re-export from `index.js`;
- `setAssetBaseUrl` as a compatibility default API;
- RootDocument shape, `schemaVersion`, migrations, and all existing workspace,
  asset, group-rule, watermark, and locale storage keys;
- existing UI behavior, edit/preview behavior, and team-code import.

Old internal deep-import paths are not public API and are not guaranteed after a
module is migrated.

## 6. Migration Sequence

1. Establish this architecture and synchronize component design documents.
2. Remove only production-unreachable legacy code and unused dependencies.
3. Centralize document contracts and LogicFlow adapters.
4. Introduce instance `EditorContext`, persistence, session, and transfer modules.
5. Split editor runtime/commands and colocate each node type.
6. Move assets, group rules, capture, locale, and dialog UI to feature modules.
   **Implemented.**
7. Introduce standalone/embed shells and reduce root components to facades.
   **Pending.**
8. Enforce dependency boundaries and the complete quality gate in CI.

Each step must preserve behavior, add risk-proportional tests, update the refactor
session log, and pass its focused checks before the next step starts.

## 7. Completion Gates

The migration is complete only when:

1. contract, core, workspace, editor, feature, embed, multi-instance, and public API
   tests cover the moved behavior;
2. `npm test`, lint, typecheck, format check, dead-code check, `build:app`, and
   `build:lib` pass;
3. CI runs the same gates;
4. build-size changes are recorded without committing generated build or test
   artifacts;
5. no production business code remains in `utils/`, `configs/`, `stores/`, or `ts/`.
