# onmyoji-flow v2 重构计划

## 目标

基于稳定的功能需求，对 onmyoji-flow 进行架构重构。不关注历史实现，只关注"功能应该怎样更优雅地实现"。

## 核心思路

1. **需求驱动**：从功能规格出发，而非从现有代码出发
2. **测试先行**：E2E 测试覆盖核心用户路径，作为重构安全网
3. **渐进重构**：每一步都保持应用可运行、测试绿灯

## 文档结构

```
docs/v2/
├── management/
│   └── refactoring-plan.md        ← 本文件
├── design/
│   ├── functional-spec.md         — 功能规格（产品应该做什么）
│   ├── ADR-001-renderer-editor-split.md  — 渲染器/编辑器分离决策
│   ├── ADR-002-unified-node-registry.md  — 统一节点注册决策
│   └── ADR-003-asset-externalization.md  — 资产加载外部化决策
└── test/
    └── e2e-test-plan.md           — E2E 测试计划
```

## 执行阶段

### 阶段 0：基础设施（1天）✅ 已完成

- [x] 安装 Playwright
- [x] 配置 `playwright.config.ts`
- [x] 确认 `npm run dev` 可正常启动
- [x] 编写 T01（应用启动）测试并验证通过

### 阶段 1：测试基线（2-3天）🔄 进行中

- [x] 编写 P0 测试（T01-T06），覆盖核心用户路径
- [x] 编写 P1 测试（T07-T12），覆盖组件拆分保护
- [x] 编写 P2 测试（T13-T16），覆盖完整性
- [ ] 运行所有测试并验证通过（等待 Chromium 安装完成）
- [ ] 根据实际运行结果调整选择器和断言
- [ ] 清理现有 noise 测试（删除 AST 守卫测试，保留有效单元测试）

### 阶段 2：渲染器抽取（3-5天）

- [ ] 从 `YysEditorEmbed.vue` 中抽取 FlowRenderer 组件
- [ ] 将 wiki 侧的数据标准化逻辑（`normalizeGraphData`、`resolveGraphBounds`、URL 重写）移入库内
- [ ] 确保 FlowRenderer 可独立使用（不依赖编辑器状态）
- [ ] P0 测试全部绿灯

### 阶段 3：节点注册统一（1天）

- [ ] 创建 `src/flow/nodes/registry.ts`
- [ ] 合并 `flowRuntime.ts` 和 `useFlowEditorRuntime.ts` 中的注册逻辑
- [ ] P0 测试全部绿灯

### 阶段 4：编辑器拆解（3-5天）

- [ ] 从 FlowEditor.vue 中抽取 composables（useNodeMeta、useSelectionOperations、useKeyboardGuards）
- [ ] FlowEditor.vue 降至 300-400 行
- [ ] P0 + P1 测试全部绿灯

### 阶段 5：Store 清理（1-2天）

- [ ] 删除 legacy 兼容方法（setActiveFile、setVisible、deleteFile、renameFile）
- [ ] 确认无调用方后移除 resolveFileId 等兼容辅助函数
- [ ] 删除 `stores/files.ts` 死代码
- [ ] P0 测试全部绿灯

### 阶段 6：收尾（1-2天）

- [ ] 删除死代码（未使用的依赖、脚手架文件、调试 HTML）
- [ ] 重复 CSS import 清理
- [ ] 补充 P2 测试
- [ ] 更新文档
- [ ] 发布新版本到 npm

### 阶段 7：Wiki 重新集成（独立进行）

> 此阶段在 onmyoji-flow 全部完成后执行，属于 onmyoji-wiki 项目范围。

- [ ] wiki 侧升级到新版 `@rookie4show/onmyoji-flow`
- [ ] `FlowPreview.vue` 适配新的 `FlowRenderer` API
- [ ] `MilkdownEditor.client.vue` 中 `FlowBlockNodeView` 适配新 API
- [ ] 移除 wiki 侧的 `flow-preview.ts`、`flow-assets.ts` 中已下沉到库的逻辑
- [ ] 验证 wiki 编辑和阅读流程正常

## 里程碑

| 里程碑 | 完成标准 |
|--------|----------|
| M0: 基础设施 | Playwright 可运行，T01 测试通过 |
| M1: 测试基线 | P0 全部通过，旧 noise 测试清理完成 |
| M2: 渲染器独立 | FlowRenderer 可独立渲染，P0 全部通过 |
| M3: 编辑器重构 | 大文件拆解完成，P0+P1 全部通过 |
| M4: 全面清理 | 死代码清除，npm 发版，所有测试通过 |
| M5: Wiki 集成 | wiki 侧适配完成，端到端流程正常 |

## 关键决策

- **公开 API break**：不保留旧的 `YysEditorEmbed` / `YysEditorPreview`，wiki 后续重新集成
- **SSR 不在当前范围**：未来 SEO 需求时再评估
- **资产选择器**：库模式下正常显示，无数据时空白面板，行为一致
- **Wiki 适配最后做**：先完成 onmyoji-flow 重构，再处理 wiki 侧
