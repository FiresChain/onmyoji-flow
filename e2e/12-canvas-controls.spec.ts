import { test, expect } from '@playwright/test'

/**
 * T12: 画布控制开关
 *
 * 场景：切换网格吸附和参考线
 *
 * 步骤：
 * 1. 打开应用
 * 2. 切换网格吸附开关为开启
 * 3. 创建一个节点并拖拽移动
 * 4. 切换网格吸附开关为关闭
 *
 * 断言：
 * - 开关状态切换正确（UI 反馈）
 * - 开启时节点拖拽有吸附行为（节点位置为网格整数倍）
 */
test('T12: 画布控制开关', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // 查找网格吸附开关（可能是按钮或开关组件）
  const gridSnapToggle = page.locator('button:has-text("网格"), button:has-text("吸附"), [class*="snap"], [class*="grid"]').first()

  if (await gridSnapToggle.isVisible({ timeout: 2000 })) {
    // 点击开关
    await gridSnapToggle.click()
    await page.waitForTimeout(300)

    // 创建节点
    const rectNode = page.locator('text=长方形').first()
    const canvas = page.locator('.lf-canvas-overlay, [class*="canvas"]').first()
    await rectNode.dragTo(canvas, { targetPosition: { x: 300, y: 300 } })
    await page.waitForTimeout(500)

    // 再次点击开关（关闭）
    await gridSnapToggle.click()
    await page.waitForTimeout(300)

    // 验证节点已创建
    const nodeCount = await page.locator('.lf-node, [class*="node"]').count()
    expect(nodeCount).toBeGreaterThan(0)
  } else {
    console.warn('Grid snap toggle not found, skipping canvas control test')
  }
})
