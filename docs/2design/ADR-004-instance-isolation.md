# ADR-004: 编辑器实例隔离策略（LogicFlowScope）

- Status: Accepted
- Date: 2026-03-02
- Phase: Phase 1

## Context

`onmyoji-flow` 需要支持同页多实例嵌入。历史实现中存在模块级共享状态，导致以下风险：

1. 画布实例引用可能被后挂载实例覆盖。
2. 画布设置（框选/网格/对齐线）在不同实例之间串扰。
3. store 在文件切换/保存时可能读取错误实例的 LogicFlow 数据。

## Decision

采用 `LogicFlowScope` 作为统一实例边界，并要求以下模块按同一 scope 对齐：

1. `useLogicFlow`：
   - 使用 `Map<LogicFlowScope, LogicFlow>` 存放实例。
   - 通过 `createLogicFlowScope + provideLogicFlowScope + useLogicFlowScope` 传递作用域。
2. `useCanvasSettings`：
   - 使用 `Map<LogicFlowScope, CanvasSettingsState>` 管理画布设置状态。
   - 支持按 scope 创建/读取/销毁状态。
3. `useStore`：
   - 增加 `bindLogicFlowScope(scope)` 显式绑定。
   - `updateTab/syncLogicFlowDataToStore` 读取绑定 scope 的 LogicFlow 实例，避免跨实例误写。

## Consequences

正向结果：

1. 同页多实例的画布、设置、store 写入边界互相隔离。
2. 嵌入模式与独立应用共享代码时，仍能保持实例级数据安全。

约束与后续：

1. 新增依赖 LogicFlow 的模块必须显式采用当前 scope，不允许回退到隐式全局共享。
2. 回归测试需持续覆盖“多实例隔离”场景，防止后续重构破坏此约束。
