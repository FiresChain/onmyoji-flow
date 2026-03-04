# ADR-006: LogicFlow Compat 声明退出策略

- Status: Accepted
- Date: 2026-03-04
- Phase: Phase 0

## Context

当前仓库通过 3 份 `logicflow-*-compat.d.ts` 兜底上游类型缺口。该方案解决了短期 `typecheck` 可执行性，但长期风险是：

1. 类型“绿灯”掩盖语义漂移。
2. 新代码继续依赖 compat，退出窗口不断后移。
3. 多文件扩散后难以识别真实依赖边界。

## Inventory（2026-03-04）

1. `src/types/logicflow-core-compat.d.ts`
   - 兼容内容：`LogicFlow`、`EventType`、`GraphData/NodeData/EdgeData`、`BaseNodeModel/HtmlNodeModel/GraphModel` 等。
   - 主要使用点：`FlowEditor.vue`、`useFlowEditorRuntime.ts`、`flowRuntime.ts`、节点模型、`useLogicFlow.ts`。
2. `src/types/logicflow-extension-compat.d.ts`
   - 兼容内容：`Menu/Label/Snapshot/SelectionSelect/MiniMap/Control/DynamicGroup`。
   - 主要使用点：`flowRuntime.ts`、`useFlowEditorRuntime.ts`。
3. `src/types/logicflow-vue-node-registry-compat.d.ts`
   - 兼容内容：`register(config, lf)` 与 `VueNodeConfig`。
   - 主要使用点：`flowRuntime.ts`、`useFlowEditorRuntime.ts`。

## 分类与替代路径

1. 可优先替换（低风险）：
   - `GraphData/NodeData/EdgeData` 等数据形态，优先回归项目侧 `schema.ts` 的约束模型。
   - `VueNodeConfig` 形态，优先使用项目侧 `FlowNodeRegistration`（`src/flowRuntime.ts`）。
2. 暂不可一次性替换（中高风险）：
   - `LogicFlow` 运行时实例与 `BaseNodeModel/HtmlNodeModel/GraphModel`（涉及节点行为与扩展插件）。
   - `@logicflow/extension` 插件导出类型（当前上游类型覆盖不足时仍需兼容层）。

## Decision

采用“冻结新增 -> 存量替换 -> 最终删除”的三段式退出：

1. 冻结新增（本 ADR 当日生效）：
   - 新增 `scripts/check-logicflow-compat-freeze.cjs`。
   - `npm run lint` 纳入 `lint:compat-freeze`，禁止新增 `*compat.d.ts` 或新增 `declare module "@logicflow/*"` 兜底位置。
2. 存量替换（后续原子任务）：
   - 先从数据类型与注册配置类型替换开始，不动运行时核心类约束。
   - 每次替换后必须跑 `lint + typecheck + test`。
3. 最终删除：
   - 当上游类型或项目本地包装类型可覆盖现有使用面后，按文件删除 compat 声明。

## Milestones

1. M0（已完成）：冻结策略落地（脚本 + lint 接入 + 文档标注）。
2. M1：替换 `GraphData/NodeData/EdgeData` 与 `VueNodeConfig` 相关使用。
3. M2：收缩 `logicflow-core-compat.d.ts` 到最小运行时必需集合。
4. M3：删除全部 `logicflow-*-compat.d.ts`，并移除 freeze 脚本。

## 验收与退出标准

1. 冻结阶段验收：
   - `npm run lint` 通过且包含 `lint:compat-freeze`。
   - `npm run typecheck` 通过。
2. 最终退出验收：
   - `rg -n "declare module \\\"@logicflow/" src/types` 无结果。
   - `npm run lint`、`npm run typecheck`、`npm test` 全通过。

