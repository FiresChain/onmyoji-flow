# ADR-002: 统一节点注册表

## 状态

已采纳

## 背景

当前节点注册存在于两个独立位置：

- `flowRuntime.ts` — 注册 4 个节点（imageNode, assetSelector, textNode, vectorNode），供 preview 模式使用
- `useFlowEditorRuntime.ts` — 注册 5 个节点（上述 4 个 + propertySelect），供编辑模式使用

两个注册列表维护相同组件的不同路径引用，且 plugin 配置也是两处独立维护。当新增节点类型时，需要在两处同步修改，容易遗漏。

## 决策

建立单一节点注册中心：

```
src/flow/nodes/registry.ts
├── BASE_NODES — 所有模式共享的节点类型
├── EDITOR_NODES — 编辑器专用节点类型（如 propertySelect）
└── registerNodes(lf, options) — 统一注册入口，按需注册
```

`flowRuntime.ts` 和 `useFlowEditorRuntime.ts` 均调用此注册中心，不再各自维护注册列表。

## 理由

1. **消除分叉**：单一来源，新增节点只需改一处
2. **类型安全**：统一的类型定义，节点类型可从注册表推导
3. **职责明确**：注册表只负责"有哪些节点"，不负责"怎么初始化 LogicFlow"

## 影响

- `flowRuntime.ts` 中的 `DEFAULT_FLOW_NODES` 和 `registerFlowNodes()` 重构为调用注册中心
- `useFlowEditorRuntime.ts` 中的 `registerNodes()` 重构为调用注册中心
- propertySelect 标记为 editor-only，preview 注册时自动跳过
