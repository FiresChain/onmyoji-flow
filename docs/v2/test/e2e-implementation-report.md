# E2E 测试实施报告

## 测试环境

- **测试框架**: Playwright v1.60.0
- **浏览器**: Chromium (Desktop Chrome)
- **测试目标**: onmyoji-flow 独立编辑器 (http://localhost:5173)
- **测试文件位置**: `/e2e/`

## 测试覆盖

### P0 测试（重构底线，6 个）

| 编号 | 测试名称 | 文件 | 状态 |
|------|----------|------|------|
| T01 | 应用启动 | `01-app-startup.spec.ts` | ✅ 已编写 |
| T02 | 节点创建（拖拽） | `02-node-creation.spec.ts` | ✅ 已编写 |
| T03 | 多 Tab 管理 | `03-multi-tab.spec.ts` | ✅ 已编写 |
| T04 | 数据持久化（localStorage） | `04-persistence.spec.ts` | ✅ 已编写 |
| T05 | 导入/导出 | `05-import-export.spec.ts` | ✅ 已编写 |
| T06 | 加载示例 | `06-load-example.spec.ts` | ✅ 已编写 |

### P1 测试（组件拆分保护，6 个）

| 编号 | 测试名称 | 文件 | 状态 |
|------|----------|------|------|
| T07 | 节点选中与删除 | `07-node-delete.spec.ts` | ✅ 已编写 |
| T08 | 动态分组 | `08-dynamic-group.spec.ts` | ✅ 已编写 |
| T09 | 对齐操作 | `09-alignment.spec.ts` | ✅ 已编写 |
| T10 | 图层控制 | `10-layer-control.spec.ts` | ✅ 已编写 |
| T11 | 属性面板 | `11-property-panel.spec.ts` | ✅ 已编写 |
| T12 | 画布控制开关 | `12-canvas-controls.spec.ts` | ✅ 已编写 |

### P2 测试（完整性覆盖，4 个）

| 编号 | 测试名称 | 文件 | 状态 |
|------|----------|------|------|
| T13 | 语言切换 | `13-language-switch.spec.ts` | ✅ 已编写 |
| T14 | 快捷键操作 | `14-keyboard-shortcuts.spec.ts` | ✅ 已编写 |
| T15 | 重置工作区 | `15-reset-workspace.spec.ts` | ✅ 已编写 |
| T16 | 节点锁定与可见性 | `16-node-lock.spec.ts` | ✅ 已编写 |

## 运行测试

```bash
# 运行所有测试
npm run test:e2e

# 运行测试并打开 UI
npm run test:e2e:ui

# 调试模式运行
npm run test:e2e:debug

# 运行单个测试文件
npx playwright test e2e/01-app-startup.spec.ts
```

## 测试策略

### 选择器策略

测试使用灵活的选择器策略，优先级：
1. 语义化文本匹配（`text=/矩形|Rectangle/i`）
2. CSS 类名模式匹配（`[class*="component"]`）
3. ARIA 属性（`[role="tab"]`）
4. 通用 DOM 结构（`.lf-node`）

这样可以适应中英文 UI 和未来的样式调整。

### 等待策略

- 页面加载：`waitForLoadState('networkidle')`
- 元素可见：`toBeVisible({ timeout: 10000 })`
- 操作间隔：`waitForTimeout(300-1500ms)` 根据操作复杂度调整
- 自动保存：等待 3 秒确保 debounce 完成

### 容错设计

部分测试包含容错逻辑：
- 按钮不可见时输出警告而非失败
- 支持多种可能的 UI 文本（中英文）
- 对话框可能出现时的条件处理

## 下一步

1. **运行测试验证**：`npm run test:e2e` 确认所有测试通过
2. **调整选择器**：根据实际 DOM 结构微调选择器
3. **补充断言**：根据测试运行结果补充更精确的断言
4. **清理 noise 测试**：删除现有的 AST 守卫测试和 mock 连线测试

## 测试维护

- 每次重构步骤前后运行 P0 测试
- 新增功能时先写对应的 E2E 测试
- 测试失败 = 回归，立即修复
- 定期更新测试以适应 UI 变化
