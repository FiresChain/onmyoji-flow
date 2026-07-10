# FlowEditor Architecture

> 截至 2026-07-10，本页描述已落地的 Phase 5 editor 边界、Phase 6 feature
> 接入及 Phase 7 shell 组装。仓库总依赖方向以
> [ModuleArchitecture.md](./ModuleArchitecture.md) 为准。

## 1. 职责边界

`src/editor/components/FlowEditor.vue` 保留画布模板、实例生命周期、节点
normalize/sanitize 边界和子组件编排。可复用的 runtime 接线、编辑命令、节点定义与
独立 UI 已从 SFC 主体移出；它不负责 localStorage、RootDocument 持久化或 feature UI。

```text
FlowEditor.vue
├── components/
│   ├── CanvasControls.vue
│   ├── ProblemsDock.vue
│   └── Inspector.vue
├── runtime/
│   ├── lifecycle.ts
│   ├── mountEditorRuntime.ts
│   ├── bindEditorEvents.ts
│   ├── keyboardShortcuts.ts
│   ├── contextMenu.ts
│   ├── canvasInteraction.ts
│   └── groupRuleOrchestrator.ts
└── commands/
    ├── selection.ts
    ├── nodeState.ts
    ├── arrange.ts
    ├── layers.ts
    ├── grouping.ts
    ├── assetTheme.ts
    ├── captureSnapshot.ts
    └── problemNavigation.ts
```

`CanvasControls`、`ProblemsDock` 与 `Inspector` 只展示状态并发出动作，不保存画布
runtime，也不实现排列、图层或分组算法。`Inspector` 根据节点类型路由到共置的节点
Inspector，通用样式由 `StyleInspector.vue` 编辑。

## 2. Runtime 生命周期

| 模块                       | 责任                                                        |
| -------------------------- | ----------------------------------------------------------- |
| `lifecycle.ts`             | 顺序 mount、失败时逆序回滚、卸载时完整执行全部 disposer     |
| `mountEditorRuntime.ts`    | 创建 LogicFlow、应用 registry、接入 EditorContext、失败回滚 |
| `bindEditorEvents.ts`      | 注册 20 个 LogicFlow 事件，并以同一 event/handler 显式解绑  |
| `keyboardShortcuts.ts`     | 注册并移除 9 组编辑快捷键                                   |
| `contextMenu.ts`           | 配置节点、边、画布和多选菜单                                |
| `canvasInteraction.ts`     | 右键平移、contextmenu、resize、RAF、timeout、ResizeObserver |
| `groupRuleOrchestrator.ts` | 规则校验调度、共享规则订阅与告警定位                        |

每个 mount 都返回幂等 disposer。canvas 与 group-rule mount 使用 generation guard，旧
disposer 不得清理新的 mount；runtime disposer 通过实例身份检查，不能清除替代 runtime。
任一 mount 失败时已完成的资源按逆序释放；任一 cleanup 抛错时仍继续释放其余资源。

## 3. 编辑命令

命令模块通过函数参数取得 LogicFlow、当前选择、消息与翻译能力，不持有模块级实例状态：

- `selection.ts`：删除、方向键移动、快捷键输入目标过滤；
- `nodeState.ts`：锁定、可见性、节点 meta 与边可见性同步；
- `arrange.ts`：六种对齐和水平/垂直分布；
- `layers.ts`：置顶、置底、上移、下移；
- `grouping.ts`：组合、解组和分组节点集合展开；
- `assetTheme.ts`：执行需要 LogicFlow 的素材主题与名称标签同步；
- `captureSnapshot.ts`：在 editor 边界执行截图所需的临时画布变更；
- `problemNavigation.ts`：将规则告警定位到对应节点。

隐藏或锁定节点的过滤语义、组合成员移动以及提示文案与迁移前保持一致。

纯素材主题计算和节点外观 repository 位于 `features/assets`，规则表达式、配置与校验
位于 `features/group-rules`，截图/水印位于 `features/capture`。这些 feature 不导入
LogicFlow；需要修改画布的部分留在上述 editor commands。

## 4. 节点共置

每个节点类型位于 `src/editor/node-types/<type>/`，按需要共置 `Node.vue`、`Model.ts`、
`Inspector.vue`、对话框和 `definition.ts`。`definition.ts` 提供节点 type、默认 properties
factory 和 registration factory，避免 palette 拖拽之间共享嵌套默认对象。

`editor/node-types/registry.ts` 是默认 Vue 节点注册的唯一事实源，顺序保持为：

```text
propertySelect, imageNode, assetSelector, textNode, vectorNode
```

`dynamic-group` 继续由 `@logicflow/extension` 插件注册，不进入 Vue node registry。
edit 与 preview 均读取同一默认 registry；preview 隐藏 dynamic-group 的既有策略不变。

## 5. 兼容性与验证

本阶段不改变 `FlowEditor` props/events、Embed 公开 API、GraphData 格式、storage key 或
UI 行为。生产调试日志已移除，旧 `src/components/flow/composables/useFlow*` 实现不再
保留兼容 facade。

主要回归覆盖：

- `src/__tests__/useFlowEditorRuntime.test.ts`；
- `src/__tests__/useFlowCanvasInteraction.test.ts`；
- `src/__tests__/useFlowGroupRuleOrchestrator.test.ts`；
- `src/__tests__/editor/runtime-lifecycle.test.ts`；
- `src/__tests__/editor/commands.test.ts`；
- `src/__tests__/editor/node-types.test.ts`。

Phase 6 已将 assets、group-rules、capture、locale 和 workspace 服务迁入对应
`features/*`，并由各 feature dialog host 持有相应 dialog、draft 与 repository 状态。
listener/subscription disposer 仍由实际 mount 方持有，例如 group-rule 校验订阅由
`groupRuleOrchestrator.ts` 清理。Phase 7 已由 `EditorToolbar` 负责 host 编排和窄
editor bridge，由 `StandaloneEditorShell` / `EmbedEditorShell` 组装 `FlowEditor`；
`App.vue` 与 `YysEditorEmbed.vue` 仅保留根 facade。preview runtime 由独立
`PreviewCanvas` 持有，不改变 FlowEditor 的 interactive runtime 职责。
