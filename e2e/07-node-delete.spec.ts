import { test, expect } from '@playwright/test'

/**
 * T07: 节点选中与删除
 *
 * 场景：选中节点后删除
 *
 * 步骤：
 * 1. 打开应用，加载示例数据
 * 2. 点击画布中的一个节点（选中）
 * 3. 按 Delete 键
 *
 * 断言：
 * - 该节点从画布中消失
 * - 其他节点不受影响
 */
test('T07: 节点选中与删除', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // 加载示例数据
  const loadExampleButton = page.locator('button:has-text("加载示例"), button:has-text("示例"), text=/加载示例|Load Example/i').first()
  const fileMenu = page.locator('button:has-text("文件"), button:has-text("File")').first()
  if (await fileMenu.isVisible()) {
    await fileMenu.click()
    await page.waitForTimeout(300)
  }
  await loadExampleButton.click()
  await page.waitForTimeout(1500)

  // 记录节点数量
  const nodeCountBefore = await page.locator('.lf-node, [class*="node"]').count()
  expect(nodeCountBefore).toBeGreaterThan(0)

  // 点击第一个节点选中
  const firstNode = page.locator('.lf-node, [class*="node"]').first()
  await firstNode.click()
  await page.waitForTimeout(300)

  // 按 Delete 键
  await page.keyboard.press('Delete')
  await page.waitForTimeout(500)

  // 断言：节点数量减少 1
  const nodeCountAfter = await page.locator('.lf-node, [class*="node"]').count()
  expect(nodeCountAfter).toBe(nodeCountBefore - 1)
})
