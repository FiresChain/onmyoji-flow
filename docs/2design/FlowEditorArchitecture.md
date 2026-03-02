# FlowEditor Architecture（Phase 2 - Step 4）

## 1. 目标

在不改变 UI 与业务语义的前提下，逐步把 `FlowEditor.vue` 过重职责拆出到 composable，降低单文件复杂度。当前已完成：

1. Step 1：LogicFlow 运行时接线抽离。
2. Step 2：图层命令抽离（`bringToFront/sendToBack/bringForward/sendBackward`）。
3. Step 3：group rule 校验编排抽离（刷新/调度/共享配置订阅/告警定位）。
4. Step 4：画布交互运行时杂项抽离（右键拖拽、contextmenu 抑制、resize 接线与清理）。

## 2. 模块边界

### `src/components/flow/FlowEditor.vue`

- 保留渲染层和业务命令编排层（模板、选择/对齐/分布、分组规则校验触发、对外 expose）。
- 保留与宿主兼容的 props/events：
  - `configSnapGridEnabled`
  - `configSnaplineEnabled`
  - `configKeyboardEnabled`
  - `graph-data-change`
- 通过 `mountFlowEditorRuntime(...)` 完成运行时初始化，不再内联大段 `onMounted` 接线实现。
- 通过 `useFlowLayerCommands(...)` 复用图层命令实现，避免图层逻辑散落在组件主体内。
- 通过 `useFlowGroupRuleOrchestrator(...)` 统一管理告警刷新调度与定位编排。
- 通过 `useFlowCanvasInteraction(...)` 统一管理画布交互与 resize 接线清理。

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
  - LogicFlow runtime 相关资源（不再承担画布交互 wiring）

### `src/components/flow/composables/useFlowLayerCommands.ts`

- 承担图层命令实现（保持行为不变）：
  - `bringToFront`
  - `sendToBack`
  - `bringForward`
  - `sendBackward`
- 依赖注入仅限 `lf` 与 `selectedNode`，不引入额外全局状态。

### `src/components/flow/composables/useFlowGroupRuleOrchestrator.ts`

- 承担 group rule 校验编排（保持行为不变）：
  - `refreshGroupRuleWarnings`
  - `scheduleGroupRuleValidation`
  - 共享配置订阅触发（`subscribeSharedGroupRulesConfig`）
  - 告警定位（`locateProblemNode`）
- 提供独立的 mount/dispose，统一清理 timer 与订阅。

### `src/components/flow/composables/useFlowCanvasInteraction.ts`

- 承担画布交互运行时杂项（保持行为不变）：
  - 右键拖动画布平移
  - 拖拽后短时 `contextmenu` 抑制
  - `ResizeObserver` + `window resize` 接线
  - 统一清理（事件监听、observer、拖拽态）
- 对外只暴露 `resizeCanvas` 与 mount/dispose，供 `FlowEditor` 生命周期调用。

## 3. 兼容性说明

本次仅做实现位置迁移，不改变以下行为：

1. `YysEditorEmbed` 与 `Toolbar` 调用方式不变。
2. `FlowEditor` 对外 props/events 语义不变。
3. 关键 `graph-data-change` 触发路径不变（仅从组件内联迁移到 composable）。
4. 图层命令执行语义不变（仅迁移实现位置）。
5. group rule 告警刷新与定位语义不变（仅迁移实现位置）。
6. 画布交互事件语义与清理行为不变（仅迁移实现位置）。

## 4. 后续建议（不在本次范围）

1. 对 `FlowEditor` 新增 composables 的接口边界补充结构守卫测试，防止后续回归把职责重新耦合回组件主体。
