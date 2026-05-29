# E2E 测试指南

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 安装浏览器

```bash
npx playwright install chromium
```

### 3. 运行测试

```bash
# 运行所有测试
npm run test:e2e

# 运行测试并打开 UI（推荐）
npm run test:e2e:ui

# 调试模式
npm run test:e2e:debug

# 运行单个测试
npx playwright test e2e/01-app-startup.spec.ts

# 运行特定分组
npx playwright test e2e/0[1-6]*.spec.ts  # P0 测试
npx playwright test e2e/0[7-9]*.spec.ts e2e/1[0-2]*.spec.ts  # P1 测试
```

## 测试分层

### P0 - 重构底线（必须通过）

这些测试覆盖核心用户路径，任何重构步骤前后都必须保持绿灯：

- T01: 应用启动
- T02: 节点创建（拖拽）
- T03: 多 Tab 管理
- T04: 数据持久化
- T05: 导入/导出
- T06: 加载示例

### P1 - 组件拆分保护

重构核心组件（FlowEditor、Store）时需要运行：

- T07: 节点选中与删除
- T08: 动态分组
- T09: 对齐操作
- T10: 图层控制
- T11: 属性面板
- T12: 画布控制开关

### P2 - 完整性覆盖

全面验证功能完整性：

- T13: 语言切换
- T14: 快捷键操作
- T15: 重置工作区
- T16: 节点锁定与可见性

## 测试原则

1. **测试真实行为**：不使用 mock，测试用户实际操作流程
2. **独立运行**：每个测试独立，不依赖其他测试的状态
3. **清理状态**：测试前清理 localStorage（通过重置工作区或刷新页面）
4. **容错设计**：UI 文本支持中英文，选择器灵活匹配

## 调试技巧

### 查看测试运行过程

```bash
npm run test:e2e:ui
```

在 UI 中可以：
- 逐步执行测试
- 查看每一步的截图
- 检查元素选择器
- 查看 console 输出

### 调试单个测试

```bash
npx playwright test e2e/01-app-startup.spec.ts --debug
```

### 查看测试报告

测试运行后会生成 HTML 报告：

```bash
npx playwright show-report
```

## 常见问题

### 测试超时

如果测试超时，可能是：
1. Dev server 启动慢 → 增加 `webServer.timeout`
2. 元素加载慢 → 增加 `expect().toBeVisible({ timeout: 10000 })`
3. 网络慢 → 等待 `networkidle` 状态

### 选择器找不到元素

1. 运行 `npm run test:e2e:ui` 查看实际 DOM 结构
2. 使用 Playwright Inspector 的选择器工具
3. 调整选择器为更通用的模式

### 测试不稳定

1. 增加操作间的等待时间 `waitForTimeout()`
2. 使用更可靠的等待条件（如 `toBeVisible()` 而非固定时间）
3. 检查是否有动画或异步操作未完成

## CI/CD 集成

在 CI 环境中运行：

```bash
# 设置 CI 环境变量
export CI=true

# 运行测试
npm run test:e2e
```

CI 模式下：
- 自动重试失败的测试 2 次
- 串行运行测试（避免资源竞争）
- 失败时自动截图和录制视频

## 维护指南

### 新增测试

1. 在 `e2e/` 目录创建新的 `.spec.ts` 文件
2. 按照现有测试的结构编写
3. 运行测试验证通过
4. 更新 `e2e-test-plan.md` 和本文档

### 更新测试

当 UI 变化时：
1. 运行测试找到失败的用例
2. 使用 Playwright UI 模式查看实际 DOM
3. 更新选择器或断言
4. 验证测试通过

### 删除测试

如果功能被移除：
1. 删除对应的测试文件
2. 更新文档
3. 确认其他测试不依赖该功能
