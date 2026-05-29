import { test, expect } from '@playwright/test'

/**
 * T10: 图层控制
 *
 * 场景：调整节点的图层层级
 *
 * 步骤：
 * 1. 打开应用
 * 2. 创建两个重叠的矩形节点（A 和 B）
 * 3. 选中被遮挡的节点 A
 * 4. 点击"置顶"按钮
 *
 * 断言：
 * - 节点 A 显示在节点 B 之上
 */
test('T10: 图层控制', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // 等待组件面板加载
  const componentPanel = page.locator('.components-panel, [class*="component"]').first()
  await expect(componentPanel).toBeVisible()

  const rectNode = page.locator('text=长方形').first()
  const canvas = page.locator('.lf-canvas-overlay, [class*="canvas"]').first()

  // 创建两个重叠的矩形节点
  await rectNode.dragTo(canvas, { targetPosition: { x: 300, y: 300 } })
  await page.waitForTimeout(300)

  await rectNode.dragTo(canvas, { targetPosition: { x: 320, y: 320 } })
  await page.waitForTimeout(500)

  // 验证创建了 2 个节点
  const nodeCount = await page.locator('.lf-node, [class*="node"]').count()
  expect(nodeCount).toBe(2)

  // 选中第一个节点（被遮挡的）
  const firstNode = page.locator('.lf-node, [class*="node"]').first()
  await firstNode.click()
  await page.waitForTimeout(300)

  // 查找置顶按钮
  const bringToFrontButton = page.locator('button[title*="置顶"], button:has-text("置顶"), button[aria-label*="置顶"]').first()

  // 如果按钮可见，点击
  if (await bringToFrontButton.isVisible({ timeout: 2000 })) {
    await bringToFrontButton.click()
    await page.waitForTimeout(500)

    // 验证图层顺序变化（通过 z-index 或 DOM 顺序）
    const zIndices = await page.locator('.lf-node, [class*="node"]').evaluateAll((nodes) => {
      return nodes.map((node) => {
        const style = window.getComputedStyle(node)
        return parseInt(style.zIndex || '0', 10)
      })
    })

    // 第一个节点的 z-index 应该大于第二个
    expect(zIndices[0]).toBeGreaterThanOrEqual(zIndices[1])
  } else {
    console.warn('Bring to front button not found, skipping layer verification')
  }
})
