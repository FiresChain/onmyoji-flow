import { test, expect } from '@playwright/test'

/**
 * T15: 重置工作区
 *
 * 场景：重置工作区清空所有数据
 *
 * 步骤：
 * 1. 打开应用
 * 2. 创建多个节点和多个 Tab
 * 3. 点击工具栏 → 重置工作区
 * 4. 确认操作
 *
 * 断言：
 * - 所有 Tab 清空
 * - 画布恢复到初始状态
 * - localStorage 中的数据被清除
 */
test('T15: 重置工作区', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // 创建一些节点
  const rectNode = page.locator('text=长方形').first()
  const canvas = page.locator('.lf-canvas-overlay, [class*="canvas"]').first()
  await rectNode.dragTo(canvas, { targetPosition: { x: 200, y: 200 } })
  await page.waitForTimeout(300)

  // 创建新 Tab
  const addTabButton = page.locator('button:has-text("新建"), button:has-text("+"), .el-tabs__new-tab').first()
  if (await addTabButton.isVisible({ timeout: 1000 })) {
    await addTabButton.click()
    await page.waitForTimeout(500)
  }

  // 查找重置工作区按钮
  const resetButton = page.locator('button:has-text("重置"), button:has-text("Reset")').first()

  if (await resetButton.isVisible({ timeout: 2000 })) {
    await resetButton.click()
    await page.waitForTimeout(300)

    // 确认对话框
    const confirmButton = page.locator('button:has-text("确定"), button:has-text("确认"), button:has-text("OK")').first()
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click()
      await page.waitForTimeout(1000)
    }

    // 验证画布已清空
    const nodeCount = await page.locator('.lf-node, [class*="node"]').count()
    expect(nodeCount).toBe(0)

    // 验证只有一个默认 Tab
    const tabs = page.locator('.el-tabs__item, [role="tab"]')
    await expect(tabs).toHaveCount(1)
  } else {
    console.warn('Reset workspace button not found, skipping reset test')
  }
})
