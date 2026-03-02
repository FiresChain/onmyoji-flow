# FlowEditor Architecture（Phase 2 - Step 1）

## 1. 目标

在不改变 UI 与业务语义的前提下，把 `FlowEditor.vue` 中的 LogicFlow 运行时接线拆出到独立 composable，降低单文件复杂度，作为 Phase 2 拆分第一步。

## 2. 模块边界

### `src/components/flow/FlowEditor.vue`

- 保留渲染层和业务命令层（模板、选择/对齐/分布、分组规则校验触发、对外 expose）。
- 保留与宿主兼容的 props/events：
  - `configSnapGridEnabled`
  - `configSnaplineEnabled`
  - `configKeyboardEnabled`
  - `graph-data-change`
- 通过 `mountFlowEditorRuntime(...)` 完成运行时初始化，不再内联大段 `onMounted` 接线实现。

### `src/components/flow/composables/useFlowEditorRuntime.ts`

- 承担 LogicFlow 实例初始化：
  - `new LogicFlow(...)`
  - 插件配置与节点注册
  - `setLogicFlowInstance(...)`
- 承担关键事件绑定：
  - 节点/边变更事件
  - 历史变更事件
  - 选择事件
  - 图渲染事件
- 返回 disposer，统一清理：
  - `resize` 监听
  - `ResizeObserver`
  - 共享 group rule 订阅
  - 画布 DOM 事件监听

## 3. 兼容性说明

本次仅做实现位置迁移，不改变以下行为：

1. `YysEditorEmbed` 与 `Toolbar` 调用方式不变。
2. `FlowEditor` 对外 props/events 语义不变。
3. 关键 `graph-data-change` 触发路径不变（仅从组件内联迁移到 composable）。

## 4. 后续建议（不在本次范围）

1. 将图层命令与分组规则编排继续拆分为独立 composable。
2. 对 `useFlowEditorRuntime` 增加更细粒度单测（真实实例 + 关键事件触发）。
