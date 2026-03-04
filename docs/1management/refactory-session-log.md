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

