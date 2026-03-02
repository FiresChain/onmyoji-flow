# Refactory Session Log

Purpose:

1. Keep cross-session continuity for refactor work.
2. Ensure different Codex conversations follow the same execution standard.
3. Provide a quick resume point for new sessions.

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

## [2026-03-02] Session 33 - Align showPropertyPanel/config Contract as Compatibility No-op

- Refactory Scope:
  - Phase: Phase 1
  - Task: 收敛 `showPropertyPanel/config` 的文档声明与运行时行为，选择 B（兼容保留 + 文档标记 no-op）
- In Scope Files:
  - `docs/2design/ComponentArchitecture.md`
  - `docs/3build/YysEditorEmbed.md`
  - `docs/3build/EMBED_README.md`
  - `src/__tests__/embed-update-data.contract.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/YysEditorEmbed.vue` 运行时能力实现（选择 B，不新增行为）
  - `docs/1management/plan.md` 进度更新
  - Phase 2/3 重构任务
- Decisions:
  - 明确决策为 B：`showPropertyPanel` 与 `config` 保留在 API 以兼容存量接入，但当前版本视为 no-op，不承诺运行时效果。
  - 在 `ComponentArchitecture`、`YysEditorEmbed` 使用文档和 `EMBED_README` 同步标注 no-op 与兼容声明，移除“当前生效”暗示。
  - 增加契约回归测试，验证在传入 `showPropertyPanel/config` 时嵌入编辑模式行为保持兼容且不影响 `update:data` 事件链路。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前对 `showPropertyPanel/config` 的需求仍可能存在；若后续需要恢复能力，应以单独原子任务实现并补运行时/契约测试。
- Next Recommended Unit:
  - Phase 1 后续：若业务确认需要上述能力，选择 A 路径实现最小运行时接线并在文档中移除 no-op 标记。

## [2026-03-02] Session 32 - Emit update:data in Embed Edit Mode via Minimal Wiring

- Refactory Scope:
  - Phase: Phase 1
  - Task: 在嵌入编辑模式补齐 `update:data` 实时触发能力（最小事件透传/接线）
- In Scope Files:
  - `src/components/flow/FlowEditor.vue`
  - `src/YysEditorEmbed.vue`
  - `src/__tests__/embed-update-data.contract.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - 新业务功能扩展
  - `docs/1management/plan.md` 进度更新
  - Phase 2/3 重构任务
- Decisions:
  - `FlowEditor` 新增 `graph-data-change` 事件，在已有图数据变更相关节点（`NODE_ADD/NODE_DELETE/EDGE_ADD/EDGE_DELETE/NODE_PROPERTIES_CHANGE` + `history:change`）发出当前 `getGraphRawData()`。
  - `YysEditorEmbed` 在 edit 模式下接收 `graph-data-change` 并直接透传为对外 `update:data`，不改 `save/cancel` 行为。
  - 新增最小契约测试，验证编辑模式下 FlowEditor 上报数据变更时会触发 `update:data`。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - `graph-data-change` 事件当前依赖 LogicFlow 事件覆盖面；如后续出现漏触发场景，可补充更细颗粒度事件映射回归。
- Next Recommended Unit:
  - Phase 1: 收敛 `showPropertyPanel/config` 的对外契约与运行时行为（实现最小能力或文档废弃声明）。

## [2026-03-02] Session 31 - Document Instance Isolation Strategy with ADR-004

- Refactory Scope:
  - Phase: Phase 1
  - Task: 将已落地的实例隔离策略（`LogicFlowScope` + `useCanvasSettings` scope + `bindLogicFlowScope`）同步到设计文档，消除文档/实现漂移
- In Scope Files:
  - `docs/2design/ComponentArchitecture.md`
  - `docs/2design/ADR-004-instance-isolation.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 运行时代码改动
  - `docs/1management/plan.md` 进度更新
  - Phase 2/3 重构任务
- Decisions:
  - 在 `ComponentArchitecture` 中将“状态隔离策略”从“局部 Pinia”升级为“以 `LogicFlowScope` 为中心的三层隔离（LogicFlow 实例 / CanvasSettings / filesStore 绑定）”。
  - 新增 `ADR-004-instance-isolation`，固化实例边界、模块职责、后续约束，避免后续回退到隐式全局共享状态。
  - 本任务仅做文档对齐，不修改任何运行时代码，保持语义不变。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 对外 Embed API 契约仍有漂移（`update:data` 与 `showPropertyPanel/config`），需在后续原子任务继续收敛。
- Next Recommended Unit:
  - Phase 1: 以最小接线方式补齐嵌入编辑模式 `update:data` 实时触发并新增最小契约测试。

## [2026-03-02] Session 30 - Add Multi-Instance Embed Isolation Regression Coverage

- Refactory Scope:
  - Phase: Phase 1
  - Task: 新增“同页多实例嵌入互不影响”回归测试，覆盖实例状态隔离、画布写入隔离、画布设置隔离
- In Scope Files:
  - `src/__tests__/multi-instance-embed-isolation.test.ts`
  - `src/ts/useStore.ts`
  - `src/App.vue`
  - `src/YysEditorEmbed.vue`
  - `src/components/Toolbar.vue`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `docs/1management/plan.md` 进度更新
  - Phase 2/3 架构拆分与数据模型重构
  - 新业务功能与 UI 扩展
- Decisions:
  - 新增 `multi-instance-embed-isolation` 回归套件，覆盖三类隔离：`activeFileId/fileList`、`switch/save/update` 写入边界、`useCanvasSettings` scope 隔离。
  - 测试实施过程中发现 `useStore` 在 store 初始化阶段无法可靠读取组件注入上下文，导致 scope 绑定不稳定；引入 `filesStore.bindLogicFlowScope(scope)` 显式绑定机制。
  - 在 `App`、`YysEditorEmbed`、`Toolbar` 中补最小接线，确保各实例 store 使用对应 `LogicFlowScope`，避免 `updateTab/setActiveFile` 误读其他实例画布。
  - 保持运行时语义不变：仅增加上下文绑定入口，不改 `setActiveFile/updateTab/importData` 业务流程。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前回归覆盖重点在 store/composable 级隔离，后续可按需补充 UI 级（双实例真实挂载交互）端到端回归。
- Next Recommended Unit:
  - Phase 1 收尾：对外文档（ComponentArchitecture）补齐“store scope 显式绑定”说明，避免后续接入方误用。

## [2026-03-02] Session 29 - Scope Canvas Settings State to Editor Instance Context

- Refactory Scope:
  - Phase: Phase 1
  - Task: 将 `useCanvasSettings` 改为实例级作用域状态，并与 `LogicFlowScope` 对齐，消除跨实例设置串扰
- In Scope Files:
  - `src/ts/useCanvasSettings.ts`
  - `src/components/flow/FlowEditor.vue`
  - `src/__tests__/useCanvasSettings.scope.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `docs/1management/plan.md` 进度更新
  - 业务功能与 UI 扩展
  - 多实例回归覆盖任务（留在下一原子任务）
- Decisions:
  - `useCanvasSettings` 由模块级共享 `ref` 改为 `Map<LogicFlowScope, CanvasSettingsState>`，每个作用域独立维护 `selectionEnabled/snapGridEnabled/snaplineEnabled`。
  - `useCanvasSettings` 支持可选 `scope` 参数；默认通过 `useLogicFlowScope()` 解析当前编辑器作用域，与 Task 1 的上下文机制对齐。
  - 新增 `destroyCanvasSettingsScope` 并在 `FlowEditor` 卸载时按作用域清理，避免长生命周期页面中的状态残留。
  - 新增 scope 隔离单测，覆盖“同 scope 共享、跨 scope 隔离、销毁后重建恢复默认值”。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前仍缺少“同页多实例嵌入”端到端回归覆盖，需要在下一任务补齐跨实例状态/画布操作/画布设置完整回归。
- Next Recommended Unit:
  - Phase 1: 增加多实例隔离回归测试（状态、画布操作、画布设置）并仅做最小必要接线。

## [2026-03-02] Session 28 - Isolate useLogicFlow State by Editor Scope Context

- Refactory Scope:
  - Phase: Phase 1
  - Task: 将 `useLogicFlow` 从模块级单例改为“实例级上下文作用域”，并完成最小接线，避免同页多编辑器实例互相污染
- In Scope Files:
  - `src/ts/useLogicFlow.ts`
  - `src/components/flow/FlowEditor.vue`
  - `src/App.vue`
  - `src/YysEditorEmbed.vue`
  - `src/components/Toolbar.vue`
  - `src/components/flow/ComponentsPanel.vue`
  - `src/components/flow/PropertyPanel.vue`
  - `src/components/flow/panels/AssetSelectorPanel.vue`
  - `src/components/flow/panels/DynamicGroupPanel.vue`
  - `src/components/flow/panels/ImagePanel.vue`
  - `src/components/flow/panels/PropertyRulePanel.vue`
  - `src/components/flow/panels/StylePanel.vue`
  - `src/components/flow/panels/TextPanel.vue`
  - `src/components/flow/panels/VectorPanel.vue`
  - `src/ts/useStore.ts`
  - `src/__tests__/useLogicFlow.scope.test.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `docs/1management/plan.md` 进度更新
  - `useCanvasSettings` 实例隔离（留在下一个原子任务）
  - UI/业务功能扩展与 Phase 2/3 重构
- Decisions:
  - 在 `useLogicFlow` 中引入 `LogicFlowScope` 概念，使用 `Map<scope, LogicFlow>` 存储实例，保留 `set/get/destroy` 既有 API 形态并新增可选 `scope` 参数。
  - 新增 `createLogicFlowScope`、`provideLogicFlowScope`、`useLogicFlowScope`，通过 provide/inject 在同一编辑器子树内绑定作用域。
  - `App` 与 `YysEditorEmbed` 分别提供独立 scope，`FlowEditor` 在对应 scope 注册/销毁实例；Toolbar/组件面板/属性面板/store 读取时显式使用同一 scope。
  - 补充 `useLogicFlow` 作用域隔离测试，并调整 `useStore` 相关 mock 以覆盖新增 scope 依赖。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前仅隔离 LogicFlow 实例，`useCanvasSettings` 仍是模块共享状态，仍存在多实例设置串扰风险。
- Next Recommended Unit:
  - Phase 1: 将 `useCanvasSettings` 改为实例级状态并与当前 `LogicFlowScope` 对齐。

## [2026-03-02] Session 27 - Enforce Lint Typecheck and Prettier Checks in CI

- Refactory Scope:
  - Phase: Phase 0 / quality gate hardening
  - Task: 在主 workflow 强制执行 `lint + typecheck + prettier --check`，不改业务逻辑
- In Scope Files:
  - `.github/workflows/build-pages.yml`
  - `package.json`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `docs/1management/plan.md` 进度更新
  - 业务实现与状态管理逻辑
  - ESLint 边界规则语义
- Decisions:
  - `package.json` 将 `lint` 调整为“检查模式”（移除 `--fix`），并新增 `lint:fix` 保留本地自动修复能力。
  - `package.json` 新增 `format:check` 脚本：`prettier --check "src/**/*.{js,ts,vue}"`。
  - `.github/workflows/build-pages.yml` 在构建前新增 `Lint`、`Typecheck`、`Prettier Check` 三个强制步骤，任何一步失败都会阻断 build/deploy。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `npm run format:check`: fail（当前基线存在 77 个文件不符合 Prettier）
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 由于已接入 `format:check` 强制闸门，当前分支在 CI 上会被该检查阻断，需后续单独原子任务统一执行 Prettier 对齐并评估差异影响。
- Next Recommended Unit:
  - Phase 0: 执行一次“仅格式化”的原子单元（限定 `src/**/*.{js,ts,vue}`），跑全量回归并单独提交，解除 Prettier gate 阻断。

## [2026-03-02] Session 26 - Add Enumerable Guard for Centralized State Write Boundary Config

- Refactory Scope:
  - Phase: Phase 1
  - Task: 为 `state-write-boundaries.config.js` 增加可枚举边界守卫并补结构探针，防止新增 `*-boundary` 规则绕过集中配置源
- In Scope Files:
  - `eslint-rules/state-write-boundaries.config.js`
  - `src/__tests__/state-write-boundaries.config.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `docs/1management/plan.md` 进度更新
  - `src/ts/useStore.ts` 运行时逻辑
  - CI workflow 与脚本治理
- Decisions:
  - 在集中配置中新增 `listStateWriteBoundaryIdentifiers()` 导出，提供边界标识可枚举能力。
  - `createStateWriteBoundaryOptions()` 返回值改为数组/对象浅拷贝，避免规则侧意外修改集中配置原对象。
  - 新增结构探针测试：自动枚举 `eslint-rules/*-boundary.js`，要求规则文件必须引用 `state-write-boundaries.config` 且声明的 `stateIdentifier` 与集中配置枚举列表一一对应。
  - 保持既有边界规则语义不变，不修改 `active-file-id-boundary`/`file-list-boundary` 触发逻辑与文案。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前守卫覆盖命名模式为 `*-boundary.js`；若后续规则文件命名脱离该模式，需同步调整探针匹配策略。
- Next Recommended Unit:
  - Phase 0/1 gate: 在 CI 强制执行 `lint + typecheck + prettier --check`，补齐质量闸门。

## [2026-03-02] Session 25 - Fix filesStore Persistence Fallback to Avoid Global localStorage Clear

- Refactory Scope:
  - Phase: Phase 1
  - Task: 修复 `useStore` 持久化异常分支的全局 `localStorage.clear()` 风险，仅清理 `filesStore` 命名空间并补最小防回归守卫
- In Scope Files:
  - `src/ts/useStore.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `docs/1management/plan.md` 进度更新
  - ESLint 边界治理（集中配置守卫）
  - CI 质量闸门补齐
- Decisions:
  - 将 `saveStateToLocalStorage` 异常恢复路径由 `localStorage.clear()` 调整为 `clearFilesStoreLocalStorage()`，避免清空非本业务 key。
  - 在 `useStore` 结构测试中新增守卫：禁止出现 `localStorage.clear()`，并要求 `saveStateToLocalStorage` 通过 `clearFilesStoreLocalStorage` 执行命名空间清理。
  - 保持既有运行时语义不变：仅在保存失败时重试写入 `filesStore`，不改动正常保存流程与状态结构。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前守卫为结构性测试，未注入“磁盘配额触发”运行时故障模拟；后续可按需补一条故障注入用例验证重试分支行为。
- Next Recommended Unit:
  - Phase 1: 为 `eslint-rules/state-write-boundaries.config.js` 增加“可枚举边界守卫”，防止新增 boundary 规则绕过集中配置源。

## [2026-03-02] Session 24 - Centralize State Write Boundary Mapping Config (No Semantic Change)

- Refactory Scope:
  - Phase: Phase 1
  - Task: 将 `activeFileId` 与 `fileList` 的白名单/运行时禁写入口映射收敛到单一配置源，并让 `active-file-id-boundary` 与 `file-list-boundary` 统一从该配置创建规则
- In Scope Files:
  - `eslint-rules/state-write-boundaries.config.js`
  - `eslint-rules/active-file-id-boundary.js`
  - `eslint-rules/file-list-boundary.js`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/ts/useStore.ts` 运行时逻辑改动
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - 新业务功能
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 新增集中配置 `state-write-boundaries.config.js`，统一维护两个状态字段的 `allowedWriteFunctions` 与 `runtimeEntryFunctions` 映射。
  - `active-file-id-boundary` 与 `file-list-boundary` 改为通过 `createStateWriteBoundaryOptions(...)` 读取同一配置源后传入既有工厂 `createStateWriteBoundaryRule`。
  - 保持 lint 报错文案、白名单集合、运行时禁写集合与规则触发语义完全不变；不改动任何运行时代码。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前配置通过状态字段 key（`activeFileId`/`fileList`）查找；后续若新增边界规则，需在同一配置源补齐并保持命名一致。
- Next Recommended Unit:
  - Phase 1: 将集中配置扩展为“可枚举边界清单”并补一条轻量结构守卫，防止新增规则文件绕过集中配置源。

## [2026-03-02] Session 23 - Add fileList Write Boundary Rule via Reusable Factory

- Refactory Scope:
  - Phase: Phase 1
  - Task: 基于已落地 `create-state-write-boundary-rule` 工厂新增并接线 `fileList.value` 写入边界规则（第二个状态字段示例），保持现有语义不变
- In Scope Files:
  - `eslint-rules/file-list-boundary.js`
  - `.eslintrc.cjs`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/ts/useStore.ts` 运行时逻辑改动
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - 新业务功能
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 新增 ESLint 本地规则 `file-list-boundary`，复用 `createStateWriteBoundaryRule`，仅约束 `fileList.value = ...` 赋值。
  - 规则白名单写入入口限定为 `importData`、`initializeWithPrompt`、`resetWorkspace`；运行时禁写入口限定为 `setActiveFile`、`addTab`、`removeTab`、`setVisible`、`deleteFile`、`renameFile`。
  - `.eslintrc.cjs` 在 `src/ts/useStore.ts` 覆盖中启用 `file-list-boundary:error`，与 `active-file-id-boundary` 并行生效。
  - 新增结构性防回归测试，校验 `fileList.value` 写入函数集合与运行时入口禁写约束。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
  - `npx eslint eslint-rules/__file_list_boundary_probe__.js --no-eslintrc --rulesdir ./eslint-rules --rule "file-list-boundary:error"`: pass（探针验证语义，预期报错 7 条；白名单写入与 `push/splice` 无报错）
- Risks / Follow-up:
  - 规则当前依赖 `src/ts/useStore.ts` 与函数命名约定；后续若重命名入口函数或状态标识，需要同步更新规则配置与结构守卫测试。
- Next Recommended Unit:
  - Phase 1: 基于同一工厂为第三个高风险状态字段补齐写入边界规则，并将白名单/禁写入口映射集中到单一配置源。

## [2026-03-02] Session 22 - Extract Reusable State Write Boundary Rule Factory (activeFileId first)

- Refactory Scope:
  - Phase: Phase 1
  - Task: 将 `active-file-id-boundary` 抽象为可复用的“状态写入边界规则工厂”，先落地 `activeFileId`，并保持现有语义不变
- In Scope Files:
  - `eslint-rules/active-file-id-boundary.js`
  - `eslint-rules/create-state-write-boundary-rule.js`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/ts/useStore.ts` 运行时逻辑改动
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - 新业务功能
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 提取通用工厂 `createStateWriteBoundaryRule`，复用原有 AST 判定逻辑（函数包围域识别 + 成员赋值识别）。
  - `active-file-id-boundary` 改为工厂配置包装，保留原白名单入口（`switchActiveFile`、`setActiveFileForBootstrap`）、运行时禁写入口（`setActiveFile`、`addTab`、`removeTab`、`setVisible`、`deleteFile`）与报错文案。
  - 不修改运行时代码与测试结构，仅重构静态规则实现结构。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
  - `npx eslint eslint-rules/__boundary_probe__.js --no-eslintrc --rulesdir ./eslint-rules --rule "active-file-id-boundary:error"`: pass（探针验证语义，预期报错 6 条；白名单写入无报错）
- Risks / Follow-up:
  - 工厂文件位于 `eslint-rules/`，若后续新增同目录规则需避免命名冲突并保持配置显式。
- Next Recommended Unit:
  - Phase 1: 在不改变运行时行为前提下，为第二个高风险状态字段接入同一工厂并补最小化探针验证。

## [2026-03-02] Session 21 - Verify activeFileId ESLint Boundary Migration and Keep Semantics Unchanged

- Refactory Scope:
  - Phase: Phase 1
  - Task: 校验并确认 `activeFileId` 写入边界已由独立脚本检查迁移到 ESLint 规则层，且白名单入口与运行时语义保持不变
- In Scope Files:
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - 新业务功能
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 复核现状后确认迁移已落地：本地规则 `active-file-id-boundary` 已接入 lint 流程，独立脚本 `scripts/check-active-file-id-boundary.cjs` 已移除。
  - 保持运行时代码不变：`src/ts/useStore.ts` 仍仅在 `switchActiveFile` 与 `setActiveFileForBootstrap` 写入 `activeFileId.value`。
  - 追加临时 ESLint 探针验证：`setActiveFile` 直写 `activeFileId.value` 会报错，`switchActiveFile` 写入通过。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 规则当前依赖函数名与文件路径约定；若后续重命名 `useStore.ts` 或入口函数名，需要同步更新规则/配置与结构性测试。
- Next Recommended Unit:
  - Phase 1: 将关键状态写入边界规则模板化，评估覆盖 `activeFileId` 以外的高风险状态字段。

## [2026-03-02] Session 20 - Upgrade activeFileId Write Boundary to ESLint Rule Layer

- Refactory Scope:
  - Phase: Phase 1
  - Task: 将 `activeFileId` 写入边界约束从独立脚本检查升级为 ESLint 本地规则层，保持白名单入口与运行时语义不变
- In Scope Files:
  - `.eslintrc.cjs`
  - `eslint-rules/active-file-id-boundary.js`
  - `eslint-rules/package.json`
  - `package.json`
  - `package-lock.json`
  - `scripts/check-active-file-id-boundary.cjs` (removed)
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - 新业务功能
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 新增本地 ESLint 规则 `active-file-id-boundary`，在语法树层面约束 `activeFileId.value` 仅允许由 `switchActiveFile` 与 `setActiveFileForBootstrap` 写入。
  - 对 `src/ts/useStore.ts` 启用 `@typescript-eslint/parser`，并在 `.eslintrc.cjs` 中仅对该文件启用边界规则，避免扩大无关 lint 面。
  - `npm run lint` 改为通过 ESLint 自身执行边界检查（`lint:active-file-boundary`），移除独立脚本 `scripts/check-active-file-id-boundary.cjs`。
  - 保持 `src/ts/useStore.ts` 与运行时行为不变，仅迁移静态约束承载层。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 规则当前绑定 `src/ts/useStore.ts` 路径与 `activeFileId` 标识符命名；若后续重命名文件或状态字段需同步更新 ESLint 规则与配置。
- Next Recommended Unit:
  - Phase 1: 将“关键状态写入边界”抽象为可复用 ESLint 规则模板，并逐步覆盖其他高风险状态字段。

## [2026-03-02] Session 19 - Enforce activeFileId Runtime Write Boundary in Static Check Layer

- Refactory Scope:
  - Phase: Phase 1
  - Task: 在静态检查层新增 `activeFileId` 运行时写入边界约束，禁止运行时路径直接写入，仅允许白名单入口 `switchActiveFile` / `setActiveFileForBootstrap`
- In Scope Files:
  - `package.json`
  - `scripts/check-active-file-id-boundary.cjs`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - 新业务功能
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 新增静态检查脚本 `check-active-file-id-boundary.cjs`，基于 TypeScript AST 校验 `useStore.ts` 中 `activeFileId.value = ...` 的写入函数白名单。
  - 将该检查接入 `npm run lint`，使其在 lint/静态检查阶段即可阻断未来运行时入口（如 `setActiveFile/addTab/removeTab/setVisible/deleteFile`）的直写回归。
  - 保持运行时代码与行为不变，不改动 `src/ts/useStore.ts`。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前边界约束针对 `src/ts/useStore.ts` 的 `activeFileId` 写入路径；若未来重命名文件/变量需同步更新该静态检查脚本。
- Next Recommended Unit:
  - Phase 1: 将同类“关键状态写入边界”规则扩展到其他高风险状态字段，并评估统一到 ESLint 自定义规则插件。

## [2026-03-02] Session 18 - Add Anti-Regression Guards for activeFileId Runtime Write Boundary

- Refactory Scope:
  - Phase: Phase 1
  - Task: 为 `useStore` 建立 `activeFileId` 写入边界防回归守卫，确保运行时切换路径不绕过 `switchActiveFile`，初始化/恢复路径保持独立且行为不变
- In Scope Files:
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - 新业务功能
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 不修改 `useStore.ts` 运行时行为，仅通过测试补强守卫。
  - 新增 AST 结构性测试：约束 `activeFileId.value = ...` 仅允许出现在 `setActiveFileForBootstrap` 与 `switchActiveFile`。
  - 新增结构性调用链测试：`setActiveFile/addTab/removeTab/setVisible` 必须调用 `switchActiveFile`，`deleteFile` 必须通过 `removeTab` 触发切换路径。
  - 补充初始化/恢复优先级回归测试：`activeFileId` 无效时回退 `activeFile(name)`，再回退首文件；并确认 `initializeWithPrompt/importData/resetWorkspace` 不触发 LogicFlow 数据回写。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前“写入边界”守卫基于源码结构（符号命名与调用关系）；后续若发生重命名需同步更新测试。
- Next Recommended Unit:
  - Phase 1: 在 lint/静态规则层增加 `activeFileId` 运行时直写禁令（仅允许白名单函数写入），将当前测试守卫前移到开发期。

## [2026-03-02] Session 17 - Clarify activeFileId Write Boundary Between Runtime Switch and Bootstrap Paths

- Refactory Scope:
  - Phase: Phase 1
  - Task: 收敛并明确 `useStore` 中 `activeFileId` 写入边界：运行时切换路径只通过统一入口 `switchActiveFile`，初始化/恢复路径与运行时职责分离并保持行为不变
- In Scope Files:
  - `src/ts/useStore.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 在 `useStore` 新增初始化/恢复专用入口 `setActiveFileForBootstrap`，用于 `importData / initializeWithPrompt / resetWorkspace` 的 `activeFileId` 设置，避免引入运行时切换副作用。
  - 提炼 `resolvePreferredActiveId`，统一恢复优先级（`activeFileId` > `activeFile(name)` > 首文件），保持历史行为不变。
  - 保留并明确注释 `switchActiveFile` 为运行时唯一切换入口；运行时相关路径继续通过该入口切换活动文件。
  - 增补测试断言初始化默认、localStorage 恢复、导入、重置路径不触发 LogicFlow 数据回写；保留并复用既有切换单测覆盖“单次保存 + 不串写”。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 运行时“只通过统一入口”的约束当前是代码约定 + 测试行为约束，尚未引入静态限制（例如禁止直接写 `activeFileId` 的 lint 规则）。
- Next Recommended Unit:
  - Phase 1: 增加针对 `useStore` 的结构性防回归测试（覆盖所有运行时入口对 `switchActiveFile` 的行为契约），并评估引入轻量静态约束防止未来直接写 `activeFileId`。

## [2026-03-02] Session 16 - Extract switchActiveFile and Converge Active-File Switching Paths

- Refactory Scope:
  - Phase: Phase 1
  - Task: 提炼并收敛 `useStore` 内部统一活动文件切换入口 `switchActiveFile`，统一 `addTab / setVisible / deleteFile / removeTab` 的切换写法，消除散落 `activeFileId` 写路径并保持无重复保存与无串写
- In Scope Files:
  - `src/ts/useStore.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/App.vue` 与 UI 交互改造
  - 数据结构设计调整
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 在 `useStore` 新增内部 `switchActiveFile(nextActiveId, options)`，封装切换、来源文件保存与必要持久化。
  - `addTab / removeTab / setVisible(隐藏活动文件分支) / setActiveFile` 改为统一调用 `switchActiveFile`，移除这些路径中直接写 `activeFileId` 的散落语句。
  - `setVisible` 隐藏活动文件切换时改为“先切换目标，再显式 `updateTab(sourceId)`”的一次性路径，避免重复保存和来源歧义。
  - 新增回归测试覆盖 `addTab` 与 `removeTab` 切换场景，补齐四类操作（`addTab / setVisible / deleteFile / removeTab`）的切换保存次数与 `graphRawData` 防串写断言。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - `addTab` 仍保持“先保存旧文件、切换新文件不额外落盘”的既有策略；如需“新增后立即持久化新 active 选择”需独立原子单元评估。
- Next Recommended Unit:
  - Phase 1: 审计 `useStore` 其余 `activeFileId` 直接写入点（初始化/恢复路径除外）并评估是否继续收敛为统一入口。

## [2026-03-02] Session 15 - Converge App/useStore Save Boundary on Active File Switch

- Refactory Scope:
  - Phase: Phase 1
  - Task: 收敛 `App.vue` 与 `useStore` 的保存职责边界，统一“切换活动文件时谁负责保存旧文件”，消除重复保存路径并保持不发生跨文件 `graphRawData` 串写
- In Scope Files:
  - `src/App.vue`
  - `src/ts/useStore.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - 其他组件/模块重构
  - UI 交互改版
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 将活动文件切换时的“保存旧文件”职责收敛到 store：`setActiveFile` 在切换后显式 `updateTab(previousId)`。
  - `App.vue` 中 `activeFileId` 监听不再执行 `updateTab(oldId)`，仅负责渲染新活动文件数据。
  - `el-tabs` 的 `v-model` 改为通过 `activeFileModel` 调用 `filesStore.setActiveFile(...)`，避免直接写 `activeFileId`。
  - 新增回归断言：切换活动文件只触发一次保存路径，且目标文件 `graphRawData` 不被来源串写。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - store 内仍存在少量直接写 `activeFileId` 的路径（如删除/隐藏等分支中的特定切换场景），当前行为安全但尚未完全统一为单一切换入口。
- Next Recommended Unit:
  - Phase 1: 提炼统一的 `switchActiveFile` 内部入口，收敛 `addTab/setVisible/deleteFile/removeTab` 的活动文件切换写法并补回归测试。

## [2026-03-02] Session 14 - Converge Save-Source Binding After Hiding/Deleting Active File

- Refactory Scope:
  - Phase: Phase 0/P1 bridge
  - Task: 收敛“删除/隐藏活动文件”后的保存来源绑定策略，避免 `activeFile` 切换后从错误来源同步 `graphRawData`
- In Scope Files:
  - `src/ts/useStore.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 其他状态管理与组件重构
  - UI/交互改动
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - `setVisible` 在“隐藏活动文件”分支改为先 `updateTab(targetId)`，显式将当前画布保存回来源文件，再切换 `activeFileId` 并 `persistState()`。
  - `deleteFile` 删除 `updateTab(activeFileId)` 路径，改为删除后仅 `persistState()`，避免把当前画布误写到新的活动文件。
  - 新增回归测试覆盖“隐藏活动文件”和“删除活动文件”后的跨文件串写防护。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - `App.vue` 的 `activeFileId` 监听仍会在切换时调用 `updateTab(oldId)`，当前不会导致跨文件串写，但会产生重复保存；可在后续原子单元继续收敛。
- Next Recommended Unit:
  - Phase 1: 收敛 `App.vue` 切换监听与 store 保存职责边界（避免重复保存，统一“谁负责保存旧文件”）。

## [2026-03-02] Session 13 - Fix Cross-File Overwrite Risk for Non-Active File Operations

- Refactory Scope:
  - Phase: Phase 0/P1 bridge
  - Task: 修复 `setVisible` / `renameFile` / `deleteFile` 在非活动文件操作时的潜在串写风险（避免将当前画布数据写入非活动目标文件）
- In Scope Files:
  - `src/ts/useStore.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - 其他 store/组件重构
  - UI/交互改动
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 抽取 `persistState()` 作为“仅持久化不做画布同步”的路径。
  - `setVisible` / `renameFile`：当目标文件非活动时仅更新元数据并 `persistState()`，不再触发 `updateTab(targetId)`。
  - `deleteFile`：当删除目标为非活动文件时，仅删除并 `persistState()`，不触发画布同步。
  - 保持目标为活动文件时的原有 `updateTab(...)` 行为，避免扩大本次原子单元范围。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前 `deleteFile` 在“删除活动文件”分支仍会在 `removeTab` 后执行 `updateTab(activeFileId)`；是否需要进一步收敛为“显式保存来源文件”应作为独立原子单元评估。
- Next Recommended Unit:
  - Phase 1: 审计并收敛“活动文件删除/隐藏后的保存来源绑定”策略，避免切换时来源文件不明确。

## [2026-03-02] Session 12 - Fix Cross-File Overwrite Risk on Active File Switch

- Refactory Scope:
  - Phase: Phase 0/P1 bridge
  - Task: 修复 `setActiveFile -> updateTab(targetId)` 导致切换时可能将当前画布写入目标文件的问题，并补回归测试
- In Scope Files:
  - `src/ts/useStore.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 其他状态管理重构
  - UI/交互层改动
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - `setActiveFile` 调整为“仅切换 activeFileId，不做目标文件写入”，并增加“切换到同一文件直接返回”保护。
  - 新增单测覆盖“切换到目标文件后，目标文件 graphRawData 不被当前画布数据串写”。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - `setVisible` / `renameFile` 当前仍通过 `updateTab(targetId)` 落盘；若操作非当前激活文件，仍存在同类跨文件写入风险，需要独立原子单元处理。
- Next Recommended Unit:
  - Phase 0/P1 bridge: 审计并修复 `setVisible` / `renameFile` / `deleteFile` 对非活动文件调用 `updateTab(targetId)` 的潜在串写路径，并补针对性回归测试。

## [2026-03-02] Session 11 - Refactory Plan Refresh (Status + Risk + DoD Tightening)

- Refactory Scope:
  - Phase: Governance refresh
  - Task: 更新 `Refactory.md`，补充当前执行状态、已知高风险、质量闸门强度和 DoD 约束
- In Scope Files:
  - `docs/2design/Refactory.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 业务代码修改
  - CI/workflow 实际实现改动
  - `docs/1management/plan.md` 进度数字调整
- Decisions:
  - 将 Phase 0 状态改为“部分完成”，并显式列出已完成/未完成项。
  - 将“文件切换误写目标文件数据”提升为 Refactory 风险条目并加入建议提交顺序。
  - 将 lint 目标从“可执行”升级为“可约束”（需要明确规则集）。
  - 将 compat 类型声明视为过渡债务，要求设退出计划。
  - 在 DoD 中加入 session log 与基线文档一致性要求。
- Checks:
  - `docs diff`: pass (`Refactory.md` 仅新增治理信息，无代码行为变更)
  - `npm test`: not-run (docs-only session)
  - `npm run lint`: not-run (docs-only session)
  - `npm run typecheck`: not-run (docs-only session)
  - `prettier --check`: not-run (docs-only session)
  - `npm run build:lib`: not-run (docs-only session)
- Risks / Follow-up:
  - Refactory 计划已更新，但对应的代码修复和 CI 补齐尚未执行，需要尽快进入下一原子单元。
- Next Recommended Unit:
  - Phase 0/P1 bridge: 修复 `setActiveFile -> updateTab(targetId)` 造成的文件切换误写风险，并补回归测试。

## [2026-03-02] Session 10 - Phase 0 Typecheck Baseline Batch 5 (Yys Import Typing + YysRank API Alignment + useSafeI18n Rest Inference)

- Refactory Scope:
  - Phase: Phase 0
  - Task: typecheck 基线收敛第五批：Yys 导入结果类型收窄、YysRank store API 对齐、useSafeI18n rest 参数推断
- In Scope Files:
  - `src/components/Yys.vue`
  - `src/components/YysRank.vue`
  - `src/ts/useSafeI18n.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 其他业务逻辑重构
  - LogicFlow 兼容声明层（`src/types/logicflow-*.d.ts`）
  - CI 其他子任务
  - `docs/1management/plan.md` 进度数字更新
- Decisions:
  - In `Yys.vue/importGroups`, narrow `FileReader` result to `string`, validate imported payload as array, and replace `groups` via in-place `splice` to satisfy readonly props contract.
  - In `YysRank.vue`, add missing `removeGroupElement(positionIndex)` handler so template invocation matches current list mutation API and avoids unresolved setup binding.
  - In `useSafeI18n.ts`, infer translation rest-argument element types from `useI18n().t` parameters and switch to arity-based invocation (`t(key)` / `t(key, arg1)` / `t(key, arg1, arg2)`) to avoid spread tuple mismatch while keeping one-arg call sites compatible.
- Checks:
  - `npm run typecheck`: pass (first run surfaced 4 scoped errors in `Yys.vue`/`YysRank.vue`/`useSafeI18n.ts`; final run all clear)
  - `npm test`: not-run (out of current atomic unit)
  - `npm run lint`: not-run (out of current atomic unit)
  - `prettier --check`: not-run (out of current atomic unit)
  - `npm run build:lib`: not-run (out of current atomic unit)
- Risks / Follow-up:
  - `YysRank.vue` 当前删除行为为静默本地删除（保留至少 1 项），未引入确认弹窗/消息提示；如需与 `Yys.vue` 完全一致可在后续 UX 对齐单元统一处理。
- Next Recommended Unit:
  - Phase 0 / 类型收敛补强：聚焦 `src/components/flow/nodes/yys/**` 与 `Toolbar.vue` 的 i18n 参数契约细化（在不改变运行行为前提下收窄 `t` 调用参数类型）。

## [2026-03-02] Session 9 - Phase 0 Typecheck Baseline Batch 4 (Non-LogicFlow Remaining Types Convergence)

- Refactory Scope:
  - Phase: Phase 0
  - Task: typecheck 基线收敛第四批：非 LogicFlow 剩余类型收敛（`AssetSelectorNode` 样式类型、`PropertySelectNode` 字段推断、规则配置类型契约）
- In Scope Files:
  - `src/components/flow/nodes/common/AssetSelectorNode.vue`
  - `src/components/flow/nodes/yys/PropertySelectNode.vue`
  - `src/utils/groupRulesConfigSource.ts`
  - `src/components/Toolbar.vue`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 其他业务逻辑重构
  - LogicFlow 兼容声明层（`src/types/logicflow-*.d.ts`）
  - CI 其他子任务
  - `docs/1management/plan.md` 进度数字更新
- Decisions:
  - In `AssetSelectorNode`, type merged style as `CSSProperties` to satisfy Vue `:style` contract without runtime change.
  - In `PropertySelectNode`, introduce `PropertyNodeData` and `normalizeProperty` to make `value/description` access type-safe while preserving permissive payload fields.
  - In `groupRulesConfigSource` and `Toolbar`, normalize rule map/filter intermediate typing to `ExpressionRuleDefinition | null`, and normalize severity with union-safe helper to align with `ExpressionRuleDefinition` contract.
  - In `Toolbar`, constrain snapshot result typing to `string | { data?: string }` before reading `.data`.
- Checks:
  - `npm run typecheck`: fail (in-scope errors resolved; remaining out-of-scope errors: `src/components/Yys.vue`, `src/components/YysRank.vue`, `src/ts/useSafeI18n.ts`)
  - `npm test`: not-run (out of current atomic unit)
  - `npm run lint`: not-run (out of current atomic unit)
  - `prettier --check`: not-run (out of current atomic unit)
  - `npm run build:lib`: not-run (out of current atomic unit)
- Risks / Follow-up:
  - `PropertySelectNode` now uses a normalized permissive shape with index signature; later schema-tightening should centralize a shared property payload type to avoid local duplication.
  - Typecheck baseline is still non-green due out-of-scope modules.
- Next Recommended Unit:
  - Phase 0 / typecheck 基线收敛第五批：处理 `Yys.vue` 导入结果类型收窄、`YysRank.vue` store API 对齐、`useSafeI18n.ts` rest 参数推断。

## [2026-03-02] Session 8 - Phase 0 Typecheck Baseline Batch 3 (Non-LogicFlow Deterministic Typing Fixes)

- Refactory Scope:
  - Phase: Phase 0
  - Task: typecheck 基线收敛第三批：修复非 LogicFlow 的确定性类型错误（`FlowEditor` 语法残留、`nodeStyle` 导出契约、`ProjectExplorer` store API 对齐）
- In Scope Files:
  - `src/components/flow/FlowEditor.vue`
  - `src/ts/nodeStyle.ts`
  - `src/components/ProjectExplorer.vue`
  - `src/ts/useStore.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - LogicFlow 兼容声明层（`src/types/logicflow-*.d.ts`）进一步调整
  - CI 其他子任务
  - `docs/1management/plan.md` 进度数字更新
- Decisions:
  - Remove stray token in `FlowEditor.vue` (`return;t` -> `return;`) to eliminate deterministic TS parser/name error without behavior change.
  - Normalize `nodeStyle` radius fallback typing and re-export `NodeStyle` from `src/ts/nodeStyle.ts` to satisfy existing import contract in `StylePanel` / `useNodeAppearance`.
  - Keep `ProjectExplorer` call sites unchanged by adding backward-compatible file operations in files store (`setActiveFile`, `setVisible`, `deleteFile`, `renameFile`), and remove macro import conflicts in `ProjectExplorer.vue`.
- Checks:
  - `npm run typecheck`: fail (scoped target errors resolved; remaining failures are in other modules: `AssetSelectorNode`, `PropertySelectNode`, `Toolbar`, `Yys`, `YysRank`, `useSafeI18n`, `groupRulesConfigSource`)
  - `npm test`: not-run (out of current atomic unit)
  - `npm run lint`: not-run (out of current atomic unit)
  - `prettier --check`: not-run (out of current atomic unit)
  - `npm run build:lib`: not-run (out of current atomic unit)
- Risks / Follow-up:
  - Added store compatibility methods mutate existing file entries by id/name; behavior is backward-compatible but should be consolidated into a single file-management API in a later refactor pass.
  - Typecheck remains non-green due unrelated typing debt outside this unit.
- Next Recommended Unit:
  - Phase 0 / typecheck 基线收敛第四批：处理 `AssetSelectorNode` 样式类型、`PropertySelectNode` 字段推断、`groupRulesConfigSource` 与 `Toolbar` 的规则类型契约。

## [2026-03-02] Session 7 - Phase 0 Typecheck Baseline Batch 2 (LogicFlow Type Compatibility)

- Refactory Scope:
  - Phase: Phase 0
  - Task: typecheck 基线收敛第二批：LogicFlow 相关类型适配（导出类型、插件扩展 API、节点模型签名兼容）
- In Scope Files:
  - `tsconfig.json`
  - `src/types/logicflow-core-compat.d.ts`
  - `src/types/logicflow-extension-compat.d.ts`
  - `src/types/logicflow-vue-node-registry-compat.d.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 业务逻辑重构（仅类型层兼容）
  - CI 其他子任务
  - `docs/1management/plan.md` 进度数字更新
- Decisions:
  - Add a dedicated LogicFlow compatibility declaration layer in `src/types` and route `@logicflow/core`, `@logicflow/extension`, `@logicflow/vue-node-registry` type resolution to local shims via `tsconfig.json` paths.
  - Keep runtime imports and behavior unchanged; only relax/normalize typing contracts for current codebase compatibility:
    - re-export and normalize commonly used `@logicflow/core` data/model types,
    - widen extension menu plugin surface typing (`addMenuConfig`, `setMenuByType`),
    - loosen vue-node-registry `register` config typing for optional `component/model`.
  - Tune node/data signatures in compat declarations to match existing usage patterns (for example `addNode` without pre-supplied `id`, node model `resize(deltaX, deltaY)` override compatibility).
- Checks:
  - `npm run typecheck`: fail (LogicFlow-related type errors removed from baseline; remaining failures are non-LogicFlow issues such as `FlowEditor.vue` stray token `t`, nodeStyle/export/store/i18n typing drifts)
  - `npm test`: not-run (out of current atomic unit)
  - `npm run lint`: not-run (out of current atomic unit)
  - `prettier --check`: not-run (out of current atomic unit)
  - `npm run build:lib`: not-run (out of current atomic unit)
- Risks / Follow-up:
  - LogicFlow type compatibility now depends on local shim declarations; when upgrading LogicFlow major/minor versions, these shims should be reviewed together with runtime API changes.
  - Typecheck is still non-green due unrelated non-LogicFlow debt.
- Next Recommended Unit:
  - Phase 0 / typecheck 基线收敛第三批：修复非 LogicFlow 的确定性类型错误（优先 `FlowEditor.vue` 语法残留、`nodeStyle` 导出契约、`ProjectExplorer` store API 对齐）。

## [2026-03-02] Session 6 - Phase 0 Typecheck Baseline Batch 1 (Declarations + Test Env Types)

- Refactory Scope:
  - Phase: Phase 0
  - Task: typecheck 基线收敛第一批：补齐声明与测试环境类型（最小铺垫）
- In Scope Files:
  - `tsconfig.json`
  - `src/types/global.d.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 业务逻辑重构
  - CI 其他子任务
  - `docs/1management/plan.md` 进度数字更新
- Decisions:
  - Extend tsconfig type environment with `vitest/globals` and raise `lib` to `ES2021` to cover test globals and `replaceAll` typing.
  - Add a dedicated `src/types/global.d.ts` for minimal baseline declarations: `*.vue` module shim, `NodeJS.Timeout` fallback typing, and shared `FlowFile` global interface used by schema typing.
  - Keep all implementation files unchanged; only declaration/environment setup is included in this unit.
- Checks:
  - `npm run typecheck`: fail (improved baseline; test globals/missing module declarations/FlowFile/replaceAll related errors cleared, remaining failures are business/library typing mismatches in `src/**`)
  - `npm test`: not-run (out of current atomic unit)
  - `npm run lint`: not-run (out of current atomic unit)
  - `prettier --check`: not-run (out of current atomic unit)
  - `npm run build:lib`: not-run (out of current atomic unit)
- Risks / Follow-up:
  - Remaining type errors are now concentrated in LogicFlow API type mismatches, component prop/inference issues, and store contract drifts; these require scoped source-level typing fixes in later units.
- Next Recommended Unit:
  - Phase 0 / typecheck 基线收敛第二批：聚焦 `LogicFlow` 相关类型适配（`@logicflow/core` 导出类型与节点模型签名）并保持单元最小化。

## [2026-03-02] Session 5 - Phase 0 Add and Validate Typecheck Script (vue-tsc --noEmit)

- Refactory Scope:
  - Phase: Phase 0
  - Task: 4.0.2-2 新增并验证 typecheck 脚本（`vue-tsc --noEmit`）
- In Scope Files:
  - `package.json`
  - `tsconfig.json`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**`
  - CI 其他子任务
  - `docs/1management/plan.md` 进度数字更新
- Decisions:
  - Add `typecheck` script in `package.json` with exact command `vue-tsc --noEmit`.
  - Add `typescript` and `vue-tsc` to `devDependencies` so the script is executable in local repo baseline.
  - Add minimal root `tsconfig.json` because repository baseline had no `tsconfig*.json`, which blocks `vue-tsc` startup.
  - Keep scope limited to script executability; do not fix existing source typing issues in this unit.
- Checks:
  - `npm run typecheck`: fail (command executes successfully, then reports existing baseline type errors in `src/**`)
  - `npm test`: not-run (out of current atomic unit)
  - `npm run lint`: not-run (out of current atomic unit)
  - `prettier --check`: not-run (out of current atomic unit)
  - `npm run build:lib`: not-run (out of current atomic unit)
- Risks / Follow-up:
  - Typecheck is now wired but currently non-green due existing repository type debt (Vue/LogicFlow typing mismatches, missing declarations, and test globals typing).
- Next Recommended Unit:
  - Phase 0 (follow-up): establish a scoped typecheck-baseline remediation unit (start with declaration/test-env typing and missing module references) to move `npm run typecheck` toward pass.

## [2026-03-02] Session 4 - Phase 0 Enable Executable ESLint Config with Vue Parsing

- Refactory Scope:
  - Phase: Phase 0
  - Task: 4.0.2-1 补齐并验证 ESLint 可执行配置（含 `.vue` 解析）
- In Scope Files:
  - `.eslintrc.cjs`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**`
  - typecheck/CI 其他子任务
  - `docs/1management/plan.md` 进度数字更新
- Decisions:
  - Add a minimal root ESLint config to make `npm run lint` executable for this repository baseline.
  - Use `vue-eslint-parser` for `.vue` files and set `parserOptions.parser = false` to avoid blocking on mixed script syntax in current `.vue` sources during this atomic unit.
  - Keep this unit focused on executability and `.vue` file handling only, without introducing rule hardening.
- Checks:
  - `npm run lint`: pass
  - `npm test`: not-run (out of current atomic unit)
  - `npm run typecheck`: not-run (out of current atomic unit)
  - `prettier --check`: not-run (out of current atomic unit)
  - `npm run build:lib`: not-run (out of current atomic unit)
- Risks / Follow-up:
  - Current `.vue` script blocks are not deeply linted yet; a follow-up unit should add TypeScript-aware parsing/rules with explicit dependency alignment.
- Next Recommended Unit:
  - Phase 0, task 4.0.2-2: 新增并验证 `typecheck` 脚本（`vue-tsc --noEmit`）并确认与现有代码基线兼容。

## [2026-03-02] Session 3 - Phase 0 Align Status/Priority Between plan.md and next.md

- Refactory Scope:
  - Phase: Phase 0
  - Task: 4.0.1-4 对齐 `plan.md` 与 `next.md` 的状态与优先级一致性
- In Scope Files:
  - `docs/1management/plan.md`
  - `docs/1management/next.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**`
  - CI/workflow/package.json changes
  - `docs/2design/**` edits
  - `plan.md` 进度数字更新
- Decisions:
  - Use `plan.md` as the single source of truth for current phase status/priority and update only conflicting parts in `next.md`.
  - Replace outdated priorities in `next.md` with remaining work items that are explicitly marked as in-progress/todo in `plan.md`.
  - Keep this session docs-only and avoid unrelated wording cleanup.
- Checks:
  - `git diff -- docs/1management/next.md`: pass (only status/priority section changed in `next.md`)
  - `rg -n "阶段 3 进行中|优化加载性能|文档完善|Notion 块体验" docs/1management/next.md`: pass
  - `legacy-priority-strings check`: pass (`撤销重做系统` / `textNode 富文本编辑` / `矢量节点 MVP、导出增强` no longer present)
  - `npm test`: not-run (docs-only session)
  - `npm run lint`: not-run (docs-only session)
  - `npm run typecheck`: not-run (docs-only session)
  - `prettier --check`: not-run (docs-only session)
  - `npm run build:lib`: not-run (docs-only session)
- Risks / Follow-up:
  - `plan.md` currently has no dedicated "下一步行动计划" section; `next.md` now aligns to existing phase/milestone status and remaining items only.
- Next Recommended Unit:
  - Phase 0, task 4.0.2-1: 补齐并验证 ESLint 可执行配置（含 `.vue` 解析）。

## [2026-03-02] Session 2 - Phase 0 Naming Drift Cleanup in Management Docs

- Refactory Scope:
  - Phase: Phase 0
  - Task: 文档命名漂移清理（管理文档）
- In Scope Files:
  - `docs/1management/plan.md`
  - `docs/1management/next.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**`
  - CI/workflow/package.json changes
  - `docs/2design/**` edits
  - `plan.md` progress number changes
- Decisions:
  - Normalize project naming to `onmyoji-flow` and package naming to `@rookie4show/onmyoji-flow` only within this atomic unit.
  - Keep component symbol names (for example `YysEditorEmbed`) unchanged to avoid API drift outside this scope.
  - Keep this session docs-only and avoid any implementation refactor.
- Checks:
  - `rg -n "yys-editor" docs/1management/plan.md docs/1management/next.md`: pass (no stale project/package naming remains)
  - `git diff -- docs/1management/plan.md docs/1management/next.md docs/1management/refactory-session-log.md`: pass (changes constrained to in-scope files)
  - `npm test`: not-run (docs-only session)
  - `npm run lint`: not-run (docs-only session)
  - `npm run typecheck`: not-run (docs-only session)
  - `prettier --check`: not-run (docs-only session)
  - `npm run build:lib`: not-run (docs-only session)
- Risks / Follow-up:
  - `plan.md` still includes historical class/symbol names prefixed with `YysEditor*`; these were intentionally preserved because they refer to concrete component APIs.
  - `plan.md` and `next.md` priority/status alignment still needs a dedicated consistency unit.
- Next Recommended Unit:
  - Phase 0, task 4.0.1-4: align status/priority consistency between `docs/1management/plan.md` and `docs/1management/next.md`.

## [2026-03-02] Session 1 - Create Project Baseline Document

- Refactory Scope:
  - Phase: Phase 0
  - Task: 4.0.1-1 establish `docs/1management/project-baseline.md`
- In Scope Files:
  - `docs/1management/project-baseline.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - Any `src/` refactor
  - `plan.md`/`next.md` status alignment updates
  - CI workflow edits
  - Broad historical naming replacement
- Decisions:
  - Use `onmyoji-flow` and `@rookie4show/onmyoji-flow` as canonical identifiers in baseline doc.
  - Record current branch convention and workflow trigger branch side by side to avoid hidden drift.
  - Keep this session docs-only as a single atomic unit.
- Checks:
  - `npm test`: not-run (docs-only session)
  - `npm run lint`: not-run (docs-only session)
  - `npm run typecheck`: not-run (`typecheck` script not yet defined; docs-only session)
  - `prettier --check`: not-run (docs-only session)
  - `npm run build:lib`: not-run (docs-only session)
- Risks / Follow-up:
  - `plan.md` still contains historical legacy naming drift and needs a dedicated naming-alignment unit.
  - Branch convention (`develop`) and workflow trigger (`master`) remain inconsistent and need governance alignment.
- Next Recommended Unit:
  - Phase 0, task: naming drift cleanup in `docs/1management/plan.md` and `docs/1management/next.md` (scope-limited docs refactor).

## [2026-03-02] Session 0 - Initialize Refactory Cross-Session Constraints

- Refactory Scope:
  - Phase: Governance bootstrap
  - Task: Add Codex cross-session consistency rules and handoff log mechanism
- In Scope Files:
  - `AGENTS.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - Source code refactor in `src/`
  - CI/tooling implementation changes
- Decisions:
  - Enforce one atomic refactor unit per session.
  - Require mandatory handoff log update for each refactor session.
  - Require first-response scope contract in future refactor sessions.
- Checks:
  - `npm test`: not-run (docs-only change)
  - `npm run lint`: not-run (docs-only change)
  - `npm run typecheck`: not-run (docs-only change)
  - `prettier --check`: not-run (docs-only change)
  - `npm run build:lib`: not-run (docs-only change)
- Risks / Follow-up:
  - Other tools (Cursor/Claude) will still need mirrored rule files to get equivalent behavior.
- Next Recommended Unit:
  - Phase 0, task: create `project-baseline.md` and align naming/link drift in docs.
