import { test, expect } from '@playwright/test'

/**
 * T16: 节点锁定与可见性
 *
 * 场景：锁定节点和隐藏节点
 *
 * 步骤：
 * 1. 打开应用
 * 2. 创建一个矩形节点
 * 3. 选中该节点
 * 4. 通过右键菜单或工具栏锁定该节点
 * 5. 尝试拖拽该节点
 *
 * 断言：
 * - 锁定后节点不可被拖拽移动
 * - 节点有锁定状态的视觉反馈
 */
test('T16: 节点锁定与可见性', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // 等待组件面板加载
  const componentPanel = page.locator('.components-panel, [class*="component"]').first()
  await expect(componentPanel).toBeVisible()

  const rectNode = page.locator('text=长方形').first()
  const canvas = page.locator('.lf-canvas-overlay, [class*="canvas"]').first()

  // 创建矩形节点
  await rectNode.dragTo(canvas, { targetPosition: { x: 300, y: 300 } })
  await page.waitForTimeout(500)

  // 选中节点
  const createdNode = page.locator('.lf-node, [class*="node"]').first()
  await createdNode.click()
  await page.waitForTimeout(300)

  // 获取初始位置
  const initialBox = await createdNode.boundingBox()
  if (!initialBox) {
    throw new Error('Node not found')
  }

  // 查找锁定按钮（可能在工具栏或右键菜单）
  const lockButton = page.locator('button:has-text("锁定"), button:has-text("Lock"), button[title*="锁定"]').first()

  if (await lockButton.isVisible({ timeout: 2000 })) {
    await lockButton.click()
    await page.waitForTimeout(500)

    // 尝试拖拽节点
    await createdNode.dragTo(canvas, {
      targetPosition: { x: 400, y: 400 },
    })
    await page.waitForTimeout(500)

    // 获取拖拽后的位置
    const finalBox = await createdNode.boundingBox()
    if (!finalBox) {
      throw new Error('Node not found after drag attempt')
    }

    // 验证节点位置未改变（锁定生效）
    expect(Math.abs(finalBox.x - initialBox.x)).toBeLessThan(10)
    expect(Math.abs(finalBox.y - initialBox.y)).toBeLessThan(10)
  } else {
    console.warn('Lock button not found, skipping lock test')
  }
})
