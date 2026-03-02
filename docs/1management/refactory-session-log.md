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
