# ADR-001: FlowRenderer 与 FlowEditor 分离

## 状态

已采纳

## 背景

当前 `YysEditorEmbed.vue` (797行) 通过 `mode="preview" | "edit"` 在单一组件内同时承担渲染和编辑职责。两个模式各自创建独立的 LogicFlow 实例，代码分叉大，wiki 侧不得不自行实现数据标准化、边界计算、URL 重写等逻辑。

## 决策

将渲染和编辑拆为两个独立组件：

- **FlowRenderer**：纯渲染组件，输入 RootDocument/GraphData，输出可视化图表 DOM。不持有编辑状态。
- **FlowEditor**：完整编辑器组件，依赖 FlowRenderer 进行节点渲染，自身管理画布交互和编辑状态。

## 理由

1. **职责清晰**：渲染器是无状态函数式组件，编辑器是有状态交互组件。混在一起导致 preview 模式承担了不必要的 LogicFlow 完整运行时开销。
2. **消费方简化**：wiki 阅读场景只需要渲染器，不需要编辑能力。当前 wiki 侧重复实现了 `normalizeGraphData`、`resolveGraphBounds`、`flow-assets.ts` 等逻辑，因为库的 API 表面不够完整。
3. **API 简洁**：消费方直接使用 `FlowRenderer` 或 `FlowEditor`，无需通过 mode prop 切换行为。

## 影响

- `YysEditorEmbed.vue` 将被移除，拆为 `FlowRenderer.vue` 和 `FlowEditor.vue`
- 公开 API break：`YysEditorEmbed` / `YysEditorPreview` 导出名不再保留，wiki 侧后续重新集成
- wiki 侧的 `flow-preview.ts` 和 `flow-assets.ts` 中的标准化逻辑将下沉到库中
- SSR 支持不在当前范围，未来需要时 FlowRenderer 可扩展
