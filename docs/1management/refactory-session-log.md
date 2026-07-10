# Refactory Session Log

Purpose:

1. Keep cross-session continuity for refactor work.
2. Ensure different Codex conversations follow the same execution standard.
3. Provide a quick resume point for new sessions.

Archive:

- Previous log archived at: `docs/1management/archive/refactory-session-log.2026-03-04.pre-reset.md`

---

## Entry Template

Copy this block and append at the top for each new refactor session.

```md
## [YYYY-MM-DD] Session N - <Short Goal>

- Refactory Scope:
  - Phase:
  - Task:
- In Scope Files:
  - `<path>`
- Out of Scope:
  - `<explicitly not touched>`
- Decisions:
  - `<decision 1>`
- Checks:
  - `npm test`: pass/fail/not-run
  - `npm run lint`: pass/fail/not-run
  - `npm run typecheck`: pass/fail/not-run
  - `prettier --check`: pass/fail/not-run
  - `npm run build:lib`: pass/fail/not-run
- Risks / Follow-up:
  - `<risk or blocker>`
- Next Recommended Unit:
  - `<next atomic refactor unit>`
```

---

## Log Entries

## [2026-07-10] Session 130 - Split Toolbar Into Feature Modules

- Refactory Scope:
  - Phase: Feature-module Phase 6
  - Task: 迁移 assets、group-rules、capture 与 locale，拆出 feature dialog hosts，并将 Toolbar 收敛为 command-bar composition facade
- In Scope Files:
  - `src/features/{assets,group-rules,capture,locale,workspace}/**`
  - `src/shells/common/EditorCommandBar.vue`、`src/shells/standalone/AboutDialogs.vue`
  - `src/components/Toolbar.vue` 与旧 Toolbar composables 清理
  - `src/editor/commands/{assetTheme,captureSnapshot,problemNavigation}.ts`、实例 locale adapter 与相关 editor 消费端
  - `src/core/document/nodeStyle.ts`、`src/shared/platform/{storage,clipboard,download}.ts`
  - Phase 6 feature、Toolbar、public API、storage 与边界回归测试
  - `docs/2design/{ModuleArchitecture,ToolbarArchitecture,FlowEditorArchitecture,ComponentArchitecture}.md`
- Out of Scope:
  - standalone/embed shell 与 `PreviewCanvas` 拆分（Phase 7）
  - `teamCodeService.ts` 实现、未来 `features/team-code`、`docs/1management/plan.md`
  - Phase 8 ESLint/knip/CI gates 与其他 worktree
- Decisions:
  - `EditorCommandBar` 保持 controlled/emit-only；workspace、assets、group-rules、capture 与 app-only About dialog 分别持有自身 UI/draft/repository 状态，过渡 `Toolbar.vue` 只路由 13 个命令并提供窄 editor bridge。
  - 素材纯属性逻辑与 LogicFlow mutation 分离；节点样式纯归一化进入 `core/document`，asset theme/capture/problem navigation 的实例 mutation 留在 editor commands。
  - locale 解析、消息与 storage key 统一进入 `features/locale`，editor 通过实例 Context adapter 翻译；feature UI 只接收显式 `translate` port，不反向依赖 editor。
  - 旧 `graphSchema` 按所有权拆为 asset record、dynamic-group meta 与 workspace composition normalizer；生产 `utils/` 依赖只保留明确冻结的 team-code adapter。
  - repository/storage 保留全部既有 key，并通过惰性 safe-storage adapter 避免 SSR/受限环境导入时永久捕获不可用 storage；clipboard 访问进入 shared platform adapter。
  - 默认 registry、preview 隐藏 dynamic-group、team-code 旧服务适配和 package exports 语义均保持不变。
- Checks:
  - Phase 6 focused suites: pass（assets/editor 15 files / 48 tests；ownership/features 17 files / 102 tests；Toolbar/group-rule 13 files / 45 tests）
  - `npm test`: pass（62 files / 294 tests）
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `npm run format:check`: pass
  - `npm run build:app`: pass（JS 2,710.20 kB / gzip 814.01 kB）
  - `npm run build:lib`: pass（ESM 2,341.90 kB / UMD 1,536.46 kB）
  - `git diff --check`: pass
- Risks / Follow-up:
  - `Toolbar.vue` 仍是 Phase 7 前的过渡 facade，standalone locale persistence 与 host composition 尚未进入 shell；`App.vue`/`YysEditorEmbed.vue` 仍直接组装 editor/preview runtime。
  - `ts/` 中仍有 editor compatibility wrappers，最终目录边界与 dead-code gate 留到 Phase 8 收敛。
  - app/lib 保留既有 large-chunk 与 mixed default/named export warnings。相对 Phase 5，app JS 增加 10.58 kB（gzip 5.01 kB），ESM 增加 18.05 kB，UMD 增加 10.73 kB。
- Next Recommended Unit:
  - Feature-module Phase 7：引入 standalone/embed shells，拆出 PreviewCanvas、data-sync/resize/viewport composables，并将 App/YysEditorEmbed 缩减为公开 facade。

## [2026-07-10] Session 129 - Modularize Editor And Node Types

- Refactory Scope:
  - Phase: Feature-module Phase 5
  - Task: 拆分 FlowEditor runtime/commands/UI，按节点类型共置 View/Model/Inspector/defaults/registration，并为所有实例资源建立真实 disposer
- In Scope Files:
  - `src/editor/components/*`（FlowEditor、NodePalette、Inspector、StyleInspector、CanvasControls、ProblemsDock、EditorDialogHost）
  - `src/editor/runtime/*`（lifecycle、runtime mount、event/keyboard/context menu、canvas 与 group-rule 编排）
  - `src/editor/commands/*`（selection、nodeState、arrange、layers、grouping）
  - `src/editor/node-types/*`（image、text、vector、asset-selector、dynamic-group、property-rule、registry 与 palette）
  - `src/App.vue`、`src/YysEditorEmbed.vue`
  - editor/runtime/node-types 及 App/Embed 路径回归测试
  - `docs/2design/ModuleArchitecture.md`、`FlowEditorArchitecture.md`、`ComponentArchitecture.md`、`DataModel.md`、`StyleAndAppearance.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - assets/group-rules/capture/locale feature 与 Toolbar 弹窗拆分（Phase 6）
  - standalone/embed shells（Phase 7）、`teamCodeService.ts`、`docs/1management/plan.md`、其他 worktree 与构建产物
- Decisions:
  - `FlowEditor.vue` 保留画布模板、实例生命周期和节点 normalize/sanitize 边界；选择、节点状态、排列、图层与分组算法进入无模块级实例状态的 command factory。
  - runtime 分为创建/Context ownership、LogicFlow events、keyboard、context menu、canvas interaction 与 group-rule orchestration；20 个 LogicFlow event 使用相同 handler `off`，9 组 keyboard binding 明确移除。
  - `lifecycle.ts` 统一顺序 mount、失败逆序回滚与完整 cleanup；canvas/group-rule 使用 generation guard，runtime disposer 使用实例身份保护，任一 cleanup 抛错不阻止其他资源释放。
  - 每类节点的 View、Model、Inspector、默认值和 registration 共置；palette 每次调用 properties factory。默认 registry 顺序保持 `propertySelect, imageNode, assetSelector, textNode, vectorNode`，dynamic-group 继续由插件注册。
  - `App.vue` 与 Embed 仅更新到 editor 组件新路径；Toolbar 与 shell 结构不在本阶段提前迁移。生产调试日志与无效旧路径注释已清除。
- Checks:
  - Phase 5 targeted integration tests: pass（11 files / 55 tests；lifecycle 异常路径追加 4 files / 17 tests）
  - `npm test`: pass（46 files / 263 tests）
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `npm run format:check`: pass
  - `npm run build:app`: pass（JS 2,699.62 kB / gzip 809.00 kB）
  - `npm run build:lib`: pass（ESM 2,323.85 kB / UMD 1,525.73 kB）
  - `git diff --check`: pass
- Risks / Follow-up:
  - editor 仍通过 `utils/`、`configs/` 与 `ts/` 消费 assets/group-rules/locale 过渡实现；这些依赖必须在 Phase 6 经 feature `public.ts` 收敛。
  - App/Embed 仍直接组装 Toolbar/editor/preview runtime，薄 facade 与 shell 边界留到 Phase 7。
  - app/lib 保留既有 large-chunk 与 mixed default/named export warnings。相对 Phase 4，app JS 增加 4.24 kB，ESM 增加 3.43 kB，UMD 增加 3.95 kB。
- Next Recommended Unit:
  - Feature-module Phase 6：迁移 assets、group-rules、capture、locale 与对应 dialog UI，通过 feature public 边界替换 Toolbar 业务实现，同时保留阵容码旧服务适配。

## [2026-07-10] Session 128 - Isolate Editor Context And Workspace Persistence

- Refactory Scope:
  - Phase: Feature-module Phase 4
  - Task: 用实例级 `EditorContext` 替换模块级 runtime/settings/dialog 状态，并拆分 serializable filesStore、FilesPersistence、WorkspaceSession 与 document transfer
- In Scope Files:
  - `src/editor/context/*`（新增 Context、Vue provide/inject 与 graphModel bridge）
  - `src/features/workspace/*`（新增 model、store、persistence、session、transfer 与内部 `public.ts`）
  - `src/shared/platform/storage.ts`、`src/shared/platform/download.ts`
  - `src/App.vue`、`src/YysEditorEmbed.vue`
  - `src/ts/useLogicFlow.ts`、`useCanvasSettings.ts`、`useDialogs.ts`、`useSafeI18n.ts`、`useStore.ts`
  - `src/utils/assetUrl.ts` 与现有 asset resolver 消费组件
  - Toolbar workspace/import/export composables 与对应回归测试
  - `src/__tests__/editor/*`、`features/workspace/*`、`shared/platform/*`、multi-instance 与 Embed 隔离测试
  - `docs/2design/ComponentArchitecture.md`、`docs/1management/refactory-session-log.md`
- Out of Scope:
  - FlowEditor runtime/commands 与节点 View/Model/Inspector 共置（Phase 5）
  - assets/group-rules/capture/locale feature UI 与 Toolbar 替换（Phase 6）
  - standalone/embed shells（Phase 7）、`teamCodeService.ts`、`docs/1management/plan.md` 与其他 worktree
- Decisions:
  - `EditorContext` 成为 runtime/EditorPort/settings/dialog/locale/asset resolver 的实例所有者；vue-node-registry 的独立 Vue app 通过 graphModel bridge 获取所属 Context，stale runtime disposer 不得清除替代 runtime。
  - `features/workspace/public.ts` 是跨模块内部入口；filesStore 只保存可序列化状态，EditorPort 协调、RootDocument 迁移/校验、storage/debounce 分属 session、transfer 与 persistence。
  - 文件切换固定执行 capture source -> 更新 active ID -> render target；metadata 更新不捕获到非 active 文件。Toolbar 通过 WorkspaceSession 和 shared download 调用，不直接观察 LogicFlow render/viewport。
  - standalone 保留 `filesStore` localStorage key；损坏数据只删除 owned key。Embed 始终使用 memory persistence，并为每个实例创建独立 Pinia/store/session。
  - Embed 精确保存并恢复进入 setup 时的 active Pinia；针对 Pinia 3 无默认值 injection probe，仅在同步读取期间过滤精确缺失注入 warning，转发并立即恢复宿主 warnHandler。
  - `setAssetBaseUrl` 保留兼容默认 API，Embed 创建时复制默认值到实例 resolver；`config.locale` 进入实例 Context，运行时修改不影响其他实例。
  - autosave/debounce/Embed task/ResizeObserver/runtime 均由实例 disposer 清理；disposed WorkspaceSession 不允许重新启动 autosave。
- Checks:
  - Phase 4 targeted editor/workspace/embed/Toolbar tests: pass
  - `npm test`: pass（43 files / 245 tests）
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `npm run format:check`: pass
  - `npm run build:app`: pass（JS 2,695.38 kB / gzip 807.34 kB）
  - `npm run build:lib`: pass（ESM 2,320.42 kB / UMD 1,521.78 kB）
  - `git diff --check`: pass
- Risks / Follow-up:
  - Pinia warning filter depends on the current Pinia 3/Vue warning text and must be revisited on framework upgrades; it is synchronously installed and restored and has a no-warning regression test.
  - app/lib retain existing large-chunk and mixed default/named export warnings. Relative to Phase 3, app JS increases 3.27 kB, while ESM decreases 80.47 kB and UMD decreases 54.20 kB.
  - App/Embed/Toolbar/FlowEditor are not yet thin shell/editor components; compatibility facades remain until Phases 5-7 move their consumers.
- Next Recommended Unit:
  - Feature-module Phase 5：拆分 FlowEditor runtime/commands，显式解绑事件与键盘监听，按节点类型共置 View/Model/Inspector/defaults/registration，并清理生产调试日志。

## [2026-07-10] Session 127 - Centralize Graph And LogicFlow Adapters

- Refactory Scope:
  - Phase: Feature-module Phase 3
  - Task: 建立 `core/document` 与 `core/logicflow` 单一事实源，统一 GraphData、RootDocument、`zIndex`、runtime registry 与 viewport 往返
- In Scope Files:
  - `src/core/document/*`（新增 canonical types、normalize、migrations、validation 与 JSON Schema）
  - `src/core/logicflow/*`（新增 runtime、graph IO、viewport、plugin preset 与 registration adapter）
  - `src/editor/node-types/registry.ts`（新增默认节点唯一 registry）
  - `src/App.vue`、`src/YysEditorEmbed.vue`、`src/flowRuntime.ts`、`src/index.js`
  - `src/components/Toolbar.vue`、`src/components/composables/useToolbarCanvasRefresh.ts`、`useToolbarWorkspaceCommands.ts`
  - `src/components/flow/FlowEditor.vue`、`src/components/flow/composables/useFlowEditorRuntime.ts`、`useFlowGroupRuleOrchestrator.ts`
  - `src/ts/schema.ts`、`src/ts/useLogicFlow.ts`、`src/ts/useStore.ts`
  - `src/utils/graphSchema.ts`、`src/utils/groupRules.ts`、`src/utils/nodeMigration.ts`
  - `src/__tests__/core/*`、`src/__tests__/contracts/public-api.test.ts` 与相关 App/Embed/Toolbar/Store 回归测试
  - `docs/2design/DataModel.md`、`docs/1management/refactory-session-log.md`
- Out of Scope:
  - EditorContext、workspace persistence/session/transfer 拆分（Phase 4）
  - FlowEditor 命令和节点实现共置（Phase 5）
  - feature/shell 迁移、阵容码实现与 `docs/1management/plan.md`
- Decisions:
  - `core/document` 成为 GraphData、RootDocument、Transform、迁移和校验的唯一事实源；旧 `schema.ts`、`nodeMigration.ts`、`graphSchema.ts` 保留兼容 facade，未知 root/file/graph/node/edge 字段继续往返保留。
  - `core/logicflow` 统一 render/capture、`zIndex`、viewport 和 runtime 生命周期；恢复 viewport 时先 reset，再分别应用 scale 与 translation，避免把 translation 当作 zoom point。
  - edit/preview 共用 `editor/node-types/registry.ts`；preview 继续过滤 dynamic-group 及其关联边，并保留非空自定义 plugin/node 列表的替换语义。
  - `flowRuntime.ts` 保留原宽松公开 `FlowPlugin`/`FlowNodeRegistration` 类型，只在 core 边界适配 SDK 类型，避免破坏既有 TypeScript 消费者。
  - FlowEditor runtime 独占 edit-mode LogicFlow 销毁权；Embed facade 不再重复 destroy，并增加卸载只销毁一次的生命周期回归测试。
- Checks:
  - `npm test`: pass（38 files / 221 tests）
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `npm run format:check`: pass
  - Phase 3 targeted core/public/embed tests: pass（26 tests）
  - `npm run build:app`: pass（JS 2,692.11 kB / gzip 806.75 kB）
  - `npm run build:lib`: pass（ESM 2,400.89 kB / UMD 1,575.98 kB）
  - `git diff --check`: pass
- Risks / Follow-up:
  - app/lib 仍有大 chunk 与 named/default mixed-export 构建警告；Toolbar 测试仍输出未 stub 的 `el-slider` 和刻意错误分支日志，均为既有基线。
  - Phase 3 相对 Phase 2 构建基线增加约 3.74 kB app JS、6.37 kB ESM、4.25 kB UMD；主要来自统一 runtime/schema adapter，Phase 8 再记录最终体积。
  - `useLogicFlow`、`useCanvasSettings`、dialogs、locale、asset URL 与 Store timer/persistence 仍有模块级实例状态，必须在下一原子单元完成隔离。
- Next Recommended Unit:
  - Feature-module Phase 4：引入实例级 EditorContext，并拆分 serializable filesStore、FilesPersistence、workspace session 与 document transfer；Embed 使用内存 persistence。

## [2026-07-10] Session 126 - Remove Unreachable Legacy Modules

- Refactory Scope:
  - Phase: Feature-module Phase 2
  - Task: 基于生产入口和引用证据删除不可达旧模块、Vite 示例残留与无引用直接依赖
- In Scope Files:
  - `src/App.vue`
  - `src/main.js`
  - `src/components/DialogManager.vue`
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `src/stores/files.ts`（删除）
  - `src/configs/nodeRegistry.ts`（删除）
  - `src/components/ProjectExplorer.vue`、`Watermark.vue`（删除）
  - `src/components/HelloWorld.vue`、`WelcomeItem.vue`、`src/components/icons/Icon*.vue`（删除）
  - `src/components/Yys.vue`、`YysRank.vue`、`src/components/flow/nodes/yys/ShikigamiGroup.vue`、`ShikigamiProperty.vue`（删除）
  - `src/assets/base.css`、`main.css`、`logo.svg`（删除）
  - `src/data/filesStoreExample.json`（删除）
  - `package.json`、`package-lock.json`
  - `docs/REFACTORING_SUMMARY.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `PropertySelect.vue` / `PropertySelectNode.vue`、`src/types/nodeTypes.ts`
  - `nodeMigration.ts` 与旧 GraphData 兼容迁移
  - `teamCodeService.ts` 与现有阵容码导入
  - `TestEmbed.vue` 手动测试入口
  - active FlowEditor/Toolbar/Embed 行为重构和 `docs/1management/plan.md`
- Decisions:
  - 仅在生产入口、app/lib sourcemap 和全仓引用均证明不可达时删除旧模块；`ASSET_LIBRARIES` 仍有消费者，因此保留 `nodeTypes.ts`。
  - 删除计划列出的 `@logicflow/engine`、`@tailwindcss/postcss`，并删除旧 Yys 链产生的级联孤儿 `html2canvas`、`vuedraggable`；保留活跃的 `@vueup/vue-quill` 与 `jsqr`。
  - 清除 App/main/DialogManager 中与已删除代码对应的无效 import/Store 实例化，不改变有效 PropertySelect 接线。
  - `docs/REFACTORING_SUMMARY.md` 标为历史快照并指向现行注册位置，避免保留失效 deep-import 指引。
  - 全量测试中的 Toolbar UI 接线用例在并发执行时超过默认 5 秒；保持断言不变，仅为该用例设置 15 秒局部超时，未放宽全局 gate。
- Checks:
  - `npm test`: pass（32 files / 183 tests）
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `npm run format:check`: pass
  - `npm ci --dry-run --ignore-scripts`: pass
  - dead-code reference + required compatibility path checks: pass
  - `npm run build:app`: pass（JS 2,688.37 kB / gzip 805.47 kB）
  - `npm run build:lib`: pass（ESM 2,394.52 kB / UMD 1,571.73 kB）
  - `git diff --check`: pass
- Risks / Follow-up:
  - app/lib 仍有大 chunk 与 named/default mixed-export 构建警告，均为既有基线，本阶段未改变公开导出。
  - Toolbar 测试仍输出未 stub 的 `el-slider` 警告；断言通过，后续测试设施可独立消噪。
  - 旧文件原本已被 tree-shake，构建体积基本不变；主要收益是删除约 3,900 行不可达代码和 27 个传递安装包。
- Next Recommended Unit:
  - Feature-module Phase 3：建立 `core/document` 与 `core/logicflow` 单一事实源，先补契约测试，再迁移 App/Embed/Toolbar/Store 调用。

## [2026-07-10] Session 125 - Define Feature Module Architecture

- Refactory Scope:
  - Phase: Feature-module Phase 1
  - Task: 从最新 `origin/develop` 建立独立重构分支，并定义 feature-module 目标架构与迁移边界
- In Scope Files:
  - `docs/2design/ModuleArchitecture.md`（新增）
  - `docs/2design/ComponentArchitecture.md`
  - `docs/2design/FlowEditorArchitecture.md`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `feature/team-code-copy-preview` 工作区及其未跟踪 archive/playwright/test-results
  - `docs/1management/plan.md` 进度字段
  - 运行时代码、UI、游戏数据和构建产物
- Decisions:
  - `refactor/feature-modules` 在独立 worktree 中从 `origin/develop@4ca9133` 创建，不合入当前 team-code 功能分支。
  - 新文档明确区分“目标态”和“已实现状态”，以依赖表、所有权、内部接口和兼容清单约束后续迁移。
  - Component/FlowEditor/Toolbar 文档保留现有实现记录，同时指向 feature-module 目标职责，避免迁移期契约漂移。
  - 本轮不创建空的 `features/team-code`，也不移动 `teamCodeService.ts`。
- Checks:
  - `npm ci`: pass（473 packages；审计报告 25 个存量漏洞）
  - `test -f docs/2design/{ModuleArchitecture,ComponentArchitecture,FlowEditorArchitecture,ToolbarArchitecture}.md`: pass
  - `npx prettier --check docs/2design/ModuleArchitecture.md docs/2design/ComponentArchitecture.md docs/2design/FlowEditorArchitecture.md docs/2design/ToolbarArchitecture.md`: pass
  - `git diff --check`: pass
  - `npm test`: not-run（文档原子单元）
  - `npm run lint`: not-run（文档原子单元）
  - `npm run typecheck`: not-run（文档原子单元）
  - `npm run build:lib`: not-run（文档原子单元）
- Risks / Follow-up:
  - 目录结构仍是迁移目标；在对应代码阶段完成前，不应依赖目标 deep-import 路径。
  - `npm ci` 暴露的依赖漏洞属于现有基线，本轮不运行破坏性 `npm audit fix --force`。
- Next Recommended Unit:
  - Feature-module Phase 2：基于生产入口引用证据删除不可达旧模块与无引用依赖，并运行完整定向回归。

## [2026-03-04] Session 124 - RFX-010 RootDocument Schema Strong-Constraint Loop

- Refactory Scope:
  - Phase: Phase 3
  - Task: 落地 RootDocument JSON Schema + 导入/恢复/导出校验闭环 + 迁移回归测试
- In Scope Files:
  - `src/schemas/root-document.v1.json`（新增）
  - `src/ts/schema.ts`
  - `src/ts/useStore.ts`
  - `src/__tests__/schema.test.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/2design/DataModel.md`
  - `docs/1management/refactory-fix-backlog.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - 画布交互/Toolbar 功能扩展
  - compat 类型替换执行
  - 进度百分比字段更新
- Decisions:
  - 新增 `root-document.v1.json` 作为 RootDocument v1 的结构事实源，约束 `schemaVersion/fileList/activeFile/graphRawData/transform` 核心字段。
  - 在 `useStore` 的 `importData/initializeWithPrompt/exportData/persistState` 接入 `validateRootDocumentV1`，形成“迁移后校验 + 导出前校验 + 持久化前校验”闭环。
  - `addTab` 新文件默认 `graphRawData` 调整为 `{ nodes: [], edges: [] }`，避免生成不符合 schema 的临时态。
- Checks:
  - `npx vitest run src/__tests__/schema.test.ts`: pass
  - `npm test`: pass
  - `npm run typecheck`: pass
  - `npm run lint`: pass
  - `rg -n "root-document\\.v1\\.json|schemaVersion" src docs/2design/DataModel.md`: pass
  - `prettier --check`: pass（`npm run format:check`）
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前 validator 为运行时手写校验，后续若 schema 继续扩展需同步维护 `schema.ts` 校验器，建议后续评估引入统一 JSON Schema 运行时校验器。
  - 旧版本（非 `1.0.0`）文档将被拒绝导入，若未来引入 `2.x` 需先补迁移器与版本路由。
- Next Recommended Unit:
  - `Refactory backlog RFX-001 ~ RFX-010 已全部完成，建议进入发布前 build:lib 验证与收尾归档。`

## [2026-03-04] Session 123 - RFX-007 FlowEditor/Toolbar First Responsibility Split

- Refactory Scope:
  - Phase: Phase 2
  - Task: 在不改行为前提下继续下沉 `FlowEditor`/`Toolbar` 内联编排，实现第一轮职责拆分
- In Scope Files:
  - `src/components/flow/FlowEditor.vue`
  - `src/components/flow/composables/useFlowArrangeCommands.ts`（新增）
  - `src/components/Toolbar.vue`
  - `src/components/composables/useToolbarCanvasRefresh.ts`（新增）
  - `docs/2design/FlowEditorArchitecture.md`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-fix-backlog.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - 业务功能新增
  - Toolbar 导入对话框模板结构调整
  - RootDocument schema 强约束落地
  - 进度百分比字段更新
- Decisions:
  - `FlowEditor` 抽离“对齐/分布命令”子域到 `useFlowArrangeCommands`，保留模板绑定和 runtime 接线不变。
  - `Toolbar` 在不触碰导入对话框接线守卫前提下，仅抽离“画布重渲染编排”到 `useToolbarCanvasRefresh`。
  - 拆分后组件体量下降：`FlowEditor.vue` 1088 -> 991 行，`Toolbar.vue` 928 -> 915 行。
- Checks:
  - `npx vitest run src/__tests__/toolbar-wiring.regression.test.ts src/__tests__/toolbar-architecture.guard.test.ts src/__tests__/useFlowCanvasInteraction.test.ts`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `npm test`: pass
  - `(Get-Content src/components/flow/FlowEditor.vue | Measure-Object -Line).Lines`: pass（991）
  - `(Get-Content src/components/Toolbar.vue | Measure-Object -Line).Lines`: pass（915）
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - Toolbar 架构守卫对模板结构约束严格，后续拆分需继续遵循“只拆实现，不动关键模板锚点”策略。
  - 仍有可下沉域（FlowEditor 的 node-meta 操作与快捷键分发），建议在后续拆分中继续按单子域推进。
- Next Recommended Unit:
  - `RFX-010（P3）RootDocument Schema 强约束闭环`

## [2026-03-04] Session 122 - RFX-009 Unify Layer Field Semantics (meta.z -> zIndex)

- Refactory Scope:
  - Phase: Phase 1
  - Task: 统一图层字段语义为节点顶层 `zIndex`，并保留 `meta.z`/`meta.zIndex` 兼容导入迁移
- In Scope Files:
  - `src/ts/schema.ts`
  - `src/utils/graphSchema.ts`
  - `src/__tests__/schema.test.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/2design/DataModel.md`
  - `docs/1management/refactory-fix-backlog.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - FlowEditor/Toolbar 职责拆分
  - RootDocument JSON Schema 强约束
  - 进度百分比字段更新
- Decisions:
  - 规范层级字段确定为 `GraphNode.zIndex`（单一语义），`NodeMeta.z` 仅保留为迁移输入兼容。
  - 在 `migrateToV1` 与 `normalizeGraphRawDataSchema` 双路径实现迁移：读取 `node.zIndex > meta.zIndex > meta.z`，写出统一 `zIndex`，并移除旧 `meta` 层级字段。
  - 新增回归用例覆盖“无 schemaVersion 迁移”与“有 schemaVersion 导入”两种场景，确保 compat 行为稳定。
- Checks:
  - `npx vitest run src/__tests__/integration-zindex.spec.ts src/__tests__/schema.test.ts`: pass
  - `npm test`: pass
  - `npm run typecheck`: pass
  - `npm run lint`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 历史外部数据若依赖 `meta.z` 输出字段，将在导出后只看到 `zIndex`；已通过导入兼容降低破坏风险。
  - 后续需在 `RFX-010` 中把 `zIndex` 写入 RootDocument schema 约束，避免再次引入双轨字段。
- Next Recommended Unit:
  - `RFX-007（P2）FlowEditor/Toolbar 第一轮职责拆分`

## [2026-03-04] Session 121 - RFX-008 Compat Declaration Exit Plan

- Refactory Scope:
  - Phase: Phase 0
  - Task: 为 LogicFlow compat 声明建立冻结与退出路径，并落地“禁止新增 compat”检查
- In Scope Files:
  - `src/types/logicflow-core-compat.d.ts`
  - `src/types/logicflow-extension-compat.d.ts`
  - `src/types/logicflow-vue-node-registry-compat.d.ts`
  - `scripts/check-logicflow-compat-freeze.cjs`（新增）
  - `package.json`
  - `docs/2design/ADR-006-logicflow-compat-exit.md`（新增）
  - `docs/2design/Refactory.md`
  - `docs/2design/ADR-004-instance-isolation.md`
  - `docs/1management/refactory-fix-backlog.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - 一次性移除 compat 声明
  - 运行时代码行为重构
  - 进度百分比字段更新
- Decisions:
  - 采用“冻结新增 -> 存量替换 -> 最终删除”的三阶段策略，并以 ADR-006 固化。
  - 通过 `lint:compat-freeze` 脚本阻止新增 `*compat.d.ts` 与新增 `declare module "@logicflow/*"` 落点。
  - 在三份 compat 声明文件头部增加冻结与退出策略标注，避免误扩散。
- Checks:
  - `rg --files src | rg "logicflow-.*-compat"`: pass（当前 3 个兼容声明文件）
  - `npm run lint`: pass（含 `lint:compat-freeze`）
  - `npm run typecheck`: pass
  - `npm test`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 冻结脚本当前约束“新增 compat 声明位置”，尚未直接约束“compat 符号使用面收缩”。
  - 后续应按 ADR-006 的 M1/M2 分步替换低风险类型（`GraphData/NodeData/EdgeData`、`VueNodeConfig`）。
- Next Recommended Unit:
  - `RFX-009（P1）图层字段语义统一（meta.z vs zIndex）`

## [2026-03-04] Session 120 - RFX-006 ESLint Rule Strength Governance

- Refactory Scope:
  - Phase: Phase 0
  - Task: 将 lint 从“可执行”提升到“可约束”，补齐高风险反模式规则并修复命中点
- In Scope Files:
  - `.eslintrc.cjs`
  - `eslint-rules/no-top-level-global-listener.js`（新增）
  - `src/components/ProjectExplorer.vue`
  - `docs/1management/refactory-fix-backlog.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - 业务功能增强
  - 大规模代码风格统一
  - 进度百分比字段更新
- Decisions:
  - 在 `src/**/*.{js,ts,vue}`（排除 `src/__tests__`）启用基础危险 API 规则：`no-eval`、`no-implied-eval`、`no-new-func`、`no-script-url`。
  - 使用 `no-restricted-properties` 禁止运行时代码中的 `localStorage.clear()` 与 `sessionStorage.clear()`。
  - 新增自定义规则 `no-top-level-global-listener`，禁止顶层 `window/document.addEventListener` 副作用；命中 `ProjectExplorer.vue` 后改为 `onMounted` 注册、`onUnmounted` 清理。
- Checks:
  - `npm run lint`: pass
  - `npx eslint src/ts/useStore.ts --ext .ts --rulesdir ./eslint-rules --max-warnings=0`: pass
  - `npm run typecheck`: pass
  - `npm test`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 新规则当前聚焦高风险路径，未覆盖“监听必须成对清理”的完整数据流校验；后续可评估增加更细粒度 AST 规则。
  - `no-top-level-global-listener` 以“顶层副作用”作为近似判定，若后续出现合法例外场景，需通过显式封装函数而非直接放宽规则。
- Next Recommended Unit:
  - `RFX-008（P0）compat 类型声明退出计划`

## [2026-03-04] Session 119 - RFX-005 Repository Hygiene Cleanup

- Refactory Scope:
  - Phase: Phase 0
  - Task: 清理仓库杂质文件（`.bak`/`.DS_Store`）并补齐 ignore 与文档说明，降低误用与污染风险
- In Scope Files:
  - `.gitignore`
  - `.DS_Store`（删除）
  - `src/.DS_Store`（删除）
  - `src/components/.DS_Store`（删除）
  - `src/__tests__/layer-management/mock-test.spec.ts.bak`（删除）
  - `src/__tests__/layer-management/integration-test.spec.ts.bak`（删除）
  - `src/__tests__/layer-management/unit-test.spec.ts.bak`（删除）
  - `src/__tests__/README.md`
  - `src/__tests__/SUMMARY.md`
  - `src/__tests__/TEST-RULES.md`
  - `src/__tests__/layer-management/README.md`
  - `docs/1management/refactory-fix-backlog.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 运行时代码语义改动
  - 功能性测试逻辑改动
  - 进度百分比字段更新
- Decisions:
  - 所有跟踪中的 `.DS_Store` 与 `.bak` 文件直接出仓库；历史参考统一转为“通过 Git 历史追溯”。
  - `.gitignore` 新增 `/dist-app`、`.DS_Store`、`*.bak`，避免构建产物与系统杂质回流。
  - 测试文档移除对已删除 `.bak` 物理文件的结构依赖，仅保留历史说明。
- Checks:
  - `Get-ChildItem -Recurse -Include *.bak,.DS_Store -File`: pass（无结果）
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - `src/__tests__` 文档中仍有部分历史状态描述（例如旧通过率）与当前现状不一致，后续可单独做文档收敛任务。
  - `dist-app` 当前由 ignore 屏蔽，若后续需要产物留档应改用发布工件而非入库跟踪。
- Next Recommended Unit:
  - `RFX-006（P0）ESLint 规则强度治理`

## [2026-03-04] Session 118 - RFX-004 Test Stub Noise Parameterization

- Refactory Scope:
  - Phase: Phase 0 / Phase 2 bridge
  - Task: 对三份 Toolbar 相关大测试收敛重复 stub/setup 噪声，保持断言语义与行为不变
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/1management/refactory-fix-backlog.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - 运行时代码与业务行为改动
  - 测试覆盖面扩张（仅做结构去重与可维护性提升）
  - 进度百分比字段更新
- Decisions:
  - `useToolbarImportExportCommands.test.ts` 抽取 `createMockFileInput`、`withStubbedInputElement`、`installMockFileReader`，统一 JSON 导入失败场景的输入与 FileReader stub。
  - `toolbar-wiring.regression.test.ts` 抽取 `expectImportDialogOpenedWithResetState`、`closeImportDialogWithDirtyState`、`expectImportCommandCounts`，收敛多轮开关对话框用例中的重复断言与收尾步骤。
  - `toolbar-architecture.guard.test.ts` 抽取批量断言 helper（contains/not-contains/ignore-quote），减少重复循环模板噪声。
- Checks:
  - `npx vitest run src/__tests__/useToolbarImportExportCommands.test.ts src/__tests__/toolbar-wiring.regression.test.ts src/__tests__/toolbar-architecture.guard.test.ts`: pass
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run（本轮仅定向 `prettier --write` 目标文件）
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 测试 helper 复用提升后，后续新增 case 若偏离共享路径，需避免把真实分支差异再次隐藏进 helper。
  - `toolbar-wiring.regression` 仍是超大文件，后续可在不改语义前提下继续做“场景数据化”分步收敛。
- Next Recommended Unit:
  - `RFX-005（P0）仓库卫生清理`

## [2026-03-04] Session 117 - RFX-003 Refresh Documentation Baseline Metrics

- Refactory Scope:
  - Phase: Phase 0
  - Task: 刷新文档中的命名、构建产物、脚本与引用路径基线，消除与当前仓库事实的漂移
- In Scope Files:
  - `README.md`
  - `docs/1management/plan.md`
  - `docs/1management/project-baseline.md`
  - `docs/2design/ComponentArchitecture.md`
  - `docs/3build/EMBED_README.md`
  - `docs/3build/YysEditorEmbed.md`
  - `docs/1management/refactory-fix-backlog.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 运行时代码与测试语义变更
  - 进度百分比字段更新
  - CI/workflow 变更
- Decisions:
  - 文档主路径命名统一为 `onmyoji-flow` 与 `@rookie4show/onmyoji-flow`，历史报告文档（`docs/4test/*`）保留原始上下文不做本轮批量改写。
  - `docs/3build/*` 全部样式引入示例统一为 `@rookie4show/onmyoji-flow/style.css`。
  - `plan.md` 仅更新客观事实（包版本、构建产物体积、命令基线与版本尾注），不调整“总体完成度/阶段完成度”数值。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: pass（`npm run format:check`）
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 历史测试报告文档仍保留 `yys-editor` 旧命名，后续若需要对外发布统一口径，可单独新增“历史命名映射说明”任务处理。
  - 文档是高频变更区域，后续建议在 PR 阶段保留一条 `rg` 命名一致性检查脚本，避免回归。
- Next Recommended Unit:
  - `RFX-004（P0/2 bridge）测试噪声 stub 参数化收敛`

## [2026-03-04] Session 116 - RFX-002 Format Baseline Convergence (src)

- Refactory Scope:
  - Phase: Phase 0
  - Task: 执行一次 `src/` 范围格式化收敛，恢复 `format:check` gate，并修复格式化引发的脆弱测试断言（仅测试层）
- In Scope Files:
  - `src/**/*`（Prettier 格式化变更）
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `src/__tests__/embed-update-data.contract.test.ts`
  - `docs/1management/refactory-session-log.md`
  - `docs/1management/refactory-fix-backlog.md`
- Out of Scope:
  - 运行时代码行为变更
  - `docs/1management/plan.md` 进度百分比更新
  - CI/workflow 文件改动
- Decisions:
  - 按原子单元执行 `npm run format`（`src/` 全量），不混入功能性重构。
  - 格式化后出现 8 个测试失败，根因是架构守卫测试对源码字符串断言绑定单引号/单行格式；改为“忽略单双引号 + 放宽单行片段”匹配，保持守卫语义不变。
  - 保留现有测试覆盖范围，不新增业务逻辑分支，仅提升断言稳健性。
- Checks:
  - `npm run format`: pass
  - `npm run format:check`: pass
  - `npm test`: pass
  - `npm run typecheck`: pass
  - `npm run lint`: pass
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 本次是大范围格式化提交，后续短期内与未同步分支合并时冲突概率上升。
  - 已稳定两处脆弱测试（引号/换行敏感），后续如继续依赖源码文本断言，建议优先使用 AST 或正则语义断言。
- Next Recommended Unit:
  - `RFX-003（P0）文档基线指标刷新`

## [2026-03-04] Session 115 - RFX-001 Restore Lint Gate Executable Stability

- Refactory Scope:
  - Phase: Phase 0
  - Task: 通过依赖一致性修复恢复 `npm run lint` 与 `lint:active-file-boundary` 稳定可执行
- In Scope Files:
  - `docs/1management/refactory-session-log.md`
  - `docs/1management/refactory-fix-backlog.md`
- Out of Scope:
  - `src/**` 运行时代码与业务语义改动
  - `docs/1management/plan.md` 进度百分比更新
  - CI/workflow 文件改动
- Decisions:
  - 本地 `npm ci` 首次执行被 `node_modules/@esbuild/win32-x64/esbuild.exe` 进程占用阻断（EPERM）。
  - 仅结束 `onmyoji-flow` 相关 `vite/esbuild` 进程后重试 `npm ci`，不做配置降级或规则放宽。
  - 重建依赖后 `@typescript-eslint/parser` 恢复可用，`lint` gate 返回可执行状态。
- Checks:
  - `npm ci`: pass
  - `npm run lint`: pass
  - `npm run lint:active-file-boundary`: pass
  - `npm test`: not-run
  - `npm run typecheck`: not-run
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 若开发期间再次开启本地 `vite` 进程并触发锁文件冲突，后续 `npm ci` 仍可能复发同类 EPERM。
  - `format:check` 阻断仍在，下一原子任务应执行一次“仅格式化收敛”解除 gate 阻断。
- Next Recommended Unit:
  - `RFX-002（P0）执行一次仅格式化收敛单元`
