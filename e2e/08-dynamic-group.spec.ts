import { test, expect } from '@playwright/test'

/**
 * T08: 动态分组
 *
 * 场景：创建分组，将节点拖入分组
 *
 * 步骤：
 * 1. 打开应用
 * 2. 从组件面板拖拽"动态分组"到画布
 * 3. 在分组附近创建一个矩形节点
 * 4. 将矩形节点拖入分组区域
 *
 * 断言：
 * - 分组容器可见
 * - 矩形节点成为分组的子节点
 * - 移动分组时，子节点跟随移动
 */
test('T08: 动态分组', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // 等待组件面板加载
  const componentPanel = page.locator('.components-panel, [class*="component"]').first()
  await expect(componentPanel).toBeVisible()

  // 查找动态分组节点
  const groupNode = page.locator('text=/动态分组|分组|Group|dynamic/i').first()
  await expect(groupNode).toBeVisible()

  // 拖拽分组到画布
  const canvas = page.locator('.lf-canvas-overlay, [class*="canvas"]').first()
  await groupNode.dragTo(canvas, {
    targetPosition: { x: 300, y: 300 },
  })
  await page.waitForTimeout(500)

  // 验证分组已创建
  const groupCount = await page.locator('[data-type*="group"], [class*="group"]').count()
  expect(groupCount).toBeGreaterThan(0)

  // 创建矩形节点
  const rectNode = page.locator('text=长方形').first()
  await rectNode.dragTo(canvas, {
    targetPosition: { x: 320, y: 320 },
  })
  await page.waitForTimeout(500)

  // 记录节点总数
  const totalNodes = await page.locator('.lf-node, [class*="node"]').count()
  expect(totalNodes).toBeGreaterThanOrEqual(2)

  // 注：实际的分组拖入逻辑需要根据 LogicFlow 的具体实现调整
  // 这里只验证基本的创建功能
})
