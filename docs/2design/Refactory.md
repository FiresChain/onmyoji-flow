# Refactory 重构设计文档（文档维护 + 代码重构）

## 1. 目标与范围

### 1.1 目标

本次重构的核心目标：

1. 统一项目事实来源，解决“文档与代码不一致”问题。
2. 提升可维护性，降低多人/多工具协作后的风格漂移与架构腐化。
3. 建立可持续的质量闸门（lint/test/typecheck/docs-check）。
4. 完成嵌入式场景下的状态隔离与数据安全修复。

### 1.2 范围

纳入范围：

1. `docs/1management/*`、`docs/2design/*`、`docs/3build/*`、`docs/4test/*`。
2. 核心实现：`src/YysEditorEmbed.vue`、`src/components/flow/FlowEditor.vue`、`src/ts/useStore.ts`、`src/ts/schema.ts`、`src/ts/useLogicFlow.ts`、`src/ts/useCanvasSettings.ts`。
3. 工具链与发布：`package.json`、ESLint/Prettier/CI 工作流。

不纳入范围（本轮）：

1. 大规模 UI 视觉重做。
2. 新业务功能扩展（如新节点类型）。

---

## 2. 当前主要问题清单

### 2.1 文档维护问题

1. 文档基线漂移：大量文档仍使用历史项目名与旧产物名（`yys-editor`）。
2. 管理文档冲突：`next.md` 优先级与 `plan.md` 状态不一致。
3. 设计契约漂移：文档声明的 API 能力与实际实现不一致（如 `update:data`、`showPropertyPanel`）。
4. 链接失效：`docs/3build/EMBED_README.md` 中存在错误相对路径与不存在目录引用。
5. 指标陈旧：体积、构建结果、完成度等数据与当前实际偏差较大。

### 2.2 代码结构问题

1. 全局单例耦合：`useLogicFlow` 与 `useCanvasSettings` 影响多实例嵌入隔离。
2. 持久化安全问题：localStorage 异常分支使用 `localStorage.clear()`，存在跨业务数据清空风险。
3. 质量闸门失效：lint 无法正常作为 gate，CI 未覆盖 lint/typecheck。
4. 大组件过重：`Toolbar.vue`、`FlowEditor.vue` 过长，职责混杂。
5. 类型约束不足：`any` 使用广泛，schema 与运行时约束缺乏一致性校验。
6. 仓库杂质：`.bak`、历史残留文件、无效实现共存。

### 2.3 数据结构一致性问题

1. 文档描述的层级语义（`meta.z`）与实现主路径（`zIndex`）存在不一致。
2. `RootDocument` 字段在迁移/归一化路径中存在丢失风险（如 `createdAt/updatedAt`）。
3. 缺少统一 JSON Schema 与回归测试作为最终权威约束。

---

## 3. 重构总原则

1. 单一事实来源（Single Source of Truth）。
2. 先建立闸门，再做重构（先可控、后演进）。
3. 优先修复“高风险 + 高传播”问题。
4. 每次重构可回滚、可验证、可度量。

---

## 3.1 当前执行状态（2026-03-02）

### Phase 0 状态：部分完成

已完成（基于近 10 轮会话落地）：

1. 已建立项目基线与会话记录机制：
   - `docs/1management/project-baseline.md`
   - `docs/1management/refactory-session-log.md`
2. 已完成管理文档命名统一和 `next.md` 与 `plan.md` 的优先级对齐。
3. 已补齐 ESLint 可执行配置（`.vue` 可解析）。
4. 已补齐 `typecheck` 命令与 `tsconfig` 基线，并完成分批类型收敛。
5. 当前仓库在 HEAD 可通过：`lint` / `test` / `typecheck` / `build:lib`。

未完成（仍需推进）：

1. CI 质量闸门尚未完全覆盖 `lint + typecheck + prettier-check`。
2. 文档指标仍存在陈旧信息（例如体积、版本与脚本状态）。
3. 存在高风险行为缺陷：文件切换路径可能误写目标文件数据（详见风险章节）。
4. ESLint 目前以“可执行”为主，规则强度尚不足以约束多人/多工具统一风格。
5. LogicFlow 兼容声明仍为过渡方案，尚未形成退出闭环。

---

## 4. 执行计划（分阶段）

## Phase 0：基线收敛（P0，部分完成）

目标：先让仓库“可检查、可发布、可协作”。

### 4.0.1 文档维护任务

1. 建立项目基线文档（建议：`docs/1management/project-baseline.md`）：
   - 包名、产物名、发布入口、分支策略、构建命令、CI gate。
2. 批量替换历史命名：
   - `yys-editor` -> `@rookie4show/onmyoji-flow`（按语义区分保留历史上下文）。
3. 修复失效链接：
   - 修复 `docs/3build/EMBED_README.md` 内错误相对路径。
4. 对齐 `plan.md` 与 `next.md`：
   - 状态、优先级、时间点统一。

### 4.0.2 代码与工程任务

1. 补齐 ESLint 正常可执行配置（含 `.vue` 解析）。
2. 新增 `typecheck`（`vue-tsc --noEmit`）。
3. CI 增加质量闸门：
   - `npm test`
   - `npm run lint`
   - `npm run typecheck`
   - `prettier --check`
4. 清理仓库杂质：
   - `.DS_Store`、`.bak`、无引用旧实现。
5. Lint 强度治理（可执行 -> 可约束）：
   - 补齐 `extends` 与核心规则集，避免仅“跑通不报错”。
6. 过渡类型声明治理：
   - 为 `src/types/logicflow-*-compat.d.ts` 设定收敛与退出条件（删除时间点和替代方案）。

### 4.0.3 验收标准

1. 本地与 CI 均可稳定通过 test/lint/typecheck/format-check。
2. 文档中包名与产物名不再出现错误主路径引用。
3. `plan.md` 与 `next.md` 不存在状态冲突。
4. 文件切换/保存路径无误写风险，并有回归测试覆盖。

---

## Phase 1：架构与数据安全（P0/P1）

目标：解决嵌入场景维护风险与数据安全风险。

### 4.1.1 文档维护任务

1. 更新 `docs/2design/ComponentArchitecture.md`：
   - 明确状态隔离真实实现（不要保留与实现冲突的描述）。
2. 更新 `docs/2design/DataModel.md`：
   - 明确层级字段唯一语义（`meta.z` 或 `zIndex` 二选一，给出迁移策略）。
3. 增加 ADR 文档（建议）：
   - `ADR-004 实例隔离策略`
   - `ADR-005 图层字段统一策略`

### 4.1.2 代码重构任务

1. 替换全局单例共享：
   - `useLogicFlow` 从模块级单例改为实例上下文（provide/inject 或 composable 工厂）。
   - `useCanvasSettings` 改为实例级状态。
2. 修复 localStorage 清空风险：
   - 删除 `localStorage.clear()`，改为仅清理命名空间 key。
3. 对齐 API 契约：
   - `YysEditorEmbed` 实现 `update:data` 实时触发，或文档明确废弃。
   - `showPropertyPanel`、`config` 要么落地实现，要么从对外 API 移除。

### 4.1.3 验收标准

1. 同页多实例互不影响（状态、画布操作、开关配置）。
2. localStorage 异常不影响其他业务 key。
3. 对外 API 文档与运行行为一致。

---

## Phase 2：可维护性拆分（P1）

目标：降低复杂度，减少未来冲突成本。

### 4.2.1 文档维护任务

1. 更新 `docs/2design/ComponentArchitecture.md` 的组件职责图：
   - `Toolbar` 拆分后的命令层、数据层、UI 层边界。
   - `FlowEditor` 拆分后的事件编排层与渲染层边界。
2. 新增模块级设计文档（建议）：
   - `docs/2design/FlowEditorArchitecture.md`
   - `docs/2design/ToolbarArchitecture.md`

### 4.2.2 代码重构任务

1. `FlowEditor.vue` 拆分：
   - 画布实例初始化
   - 事件绑定/解绑
   - 图层操作命令
   - group rule 校验编排
2. `Toolbar.vue` 拆分：
   - 导入导出与数据预览
   - 素材管理
   - 规则管理
   - 视图层与命令层分离
3. 清理调试日志：
   - 保留必要错误日志
   - 开发调试日志统一走 debug 开关

### 4.2.3 验收标准

1. 核心大组件体量显著下降。
2. 关键逻辑有对应单测/集成测试。
3. 新成员可依据文档快速定位职责边界。

---

## Phase 3：数据模型强约束（P1/P2）

目标：让“文档、类型、运行时”三层一致。

### 4.3.1 文档维护任务

1. `DataModel.md` 增加“已实现/计划中/废弃”状态标签。
2. 给 `schemaVersion` 维护变更日志与迁移矩阵。

### 4.3.2 代码重构任务

1. 增加 `RootDocument` JSON Schema（可放 `src/schemas/root-document.v1.json`）。
2. 导入/导出前后增加 schema 校验与错误提示。
3. 补齐迁移与序列化测试：
   - 老数据迁移
   - 字段保留
   - 异常数据容错

### 4.3.3 验收标准

1. 任一导出数据都可通过 schema 校验。
2. 迁移路径对旧数据无破坏。
3. 文档示例与真实导出样例一致。

---

## 5. 文档维护总清单（一次性核对）

1. 术语统一：项目名、包名、构建产物名、目录名。
2. API 文档与实现同步：
   - Props、Events、Expose Methods。
3. 设计文档同步：
   - 架构图、数据结构、状态隔离策略、迁移策略。
4. 管理文档同步：
   - 进度、优先级、里程碑、风险。
5. 构建与测试文档同步：
   - 真实产物大小、真实命令、真实 CI 规则。
6. 文档链接健康检查：
   - 相对路径有效
   - 不引用不存在目录
   - 不引用历史文件名
7. 基线文档一致性：
   - `project-baseline.md`、`plan.md`、`package.json` 在版本号/脚本项/构建产物信息上保持一致。

---

## 6. 代码重构总清单（一次性核对）

1. 工具链
   - ESLint 可用
   - Typecheck 可用
   - CI Gate 完整
2. 状态隔离
   - 移除全局单例对多实例的影响
3. 数据安全
   - 禁止全量 clear localStorage
4. 契约一致性
   - 文档 API 与实现行为一致
5. 复杂度治理
   - 大组件拆分
   - 调试代码治理
6. 类型与数据模型
   - 减少 `any`
   - schema + migration + test 闭环
7. 仓库卫生
   - 清理 `.bak`、`.DS_Store`、死代码
8. 类型过渡债务治理
   - 为 compat 声明建立删除计划，避免长期掩盖真实类型问题。

---

## 7. 里程碑建议

1. M1（1-2 天）：Phase 0 完成。
2. M2（3-5 天）：Phase 1 完成。
3. M3（5-8 天）：Phase 2 完成。
4. M4（8-10 天）：Phase 3 完成并稳定。

---

## 8. 风险与缓解

1. 风险：重构引入行为回归。
   - 缓解：先补测试，再拆分逻辑。
2. 风险：文档更新滞后导致再次漂移。
   - 缓解：PR 模板强制文档同步检查项。
3. 风险：多人并行修改冲突增大。
   - 缓解：按模块拆分 PR，降低并发编辑面。
4. 风险：文件切换时可能误写目标文件数据（`setActiveFile -> updateTab(targetId)` 路径）。
   - 缓解：切换时仅更新 `activeFileId`，保存动作绑定旧文件或显式来源文件；补回归测试覆盖切换场景。
5. 风险：compat 声明放宽导致“类型绿灯但语义错误”。
   - 缓解：对 compat 层设置范围边界与退出时间，并逐步替换为真实上游类型。
6. 风险：lint 仅可执行但约束不足，无法稳定统一代码风格。
   - 缓解：引入明确规则集、禁止关键反模式，并在 CI 强制执行。

---

## 9. 完成定义（Definition of Done）

满足以下条件才算本轮 Refactory 完成：

1. 文档层：
   - 关键文档无命名漂移、无失效链接、无契约冲突。
2. 工程层：
   - test/lint/typecheck/format-check 全通过且进入 CI 必检。
3. 架构层：
   - 多实例嵌入隔离通过验证。
4. 数据层：
   - RootDocument 有明确 schema 与迁移回归测试。
5. 维护层：
   - 大组件完成第一轮职责拆分并有对应设计文档。
6. 治理层：
   - `refactory-session-log.md` 有对应会话记录，且关键基线文档（`project-baseline.md`、`plan.md`）与当前仓库状态一致。

---

## 10. 建议提交策略

按以下顺序提交，降低风险：

1. `docs: baseline unify and broken links fix`
2. `chore: enable lint/typecheck/ci gates`
3. `fix: prevent cross-file data overwrite on active file switch`
4. `refactor: isolate editor instance state and storage safety`
5. `refactor: split flow editor and toolbar modules`
6. `feat: add root-document schema validation and migration tests`
7. `docs: align design/management/build/test docs with implementation`
