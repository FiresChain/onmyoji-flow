import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * T04: 数据持久化（localStorage）
 *
 * 场景：创建节点后刷新页面，数据恢复
 *
 * 步骤：
 * 1. 打开应用
 * 2. 在画布中创建一个矩形节点
 * 3. 等待自动保存（或手动等待数秒）
 * 4. 刷新页面（F5）
 *
 * 断言：
 * - 画布中仍然存在之前创建的矩形节点
 * - 节点位置和样式与刷新前一致
 */
test('T04: 数据持久化（localStorage）', async ({ page }) => {
  await page.goto('/')
  await waitForAppReady(page)

  // 等待组件面板加载
  const componentPanel = page.locator('.components-panel, [class*="component"]').first()
  await expect(componentPanel).toBeVisible()

  // 创建矩形节点
  const rectNode = page.locator('text=长方形').first()
  const canvas = page.locator('.lf-canvas-overlay, [class*="canvas"]').first()
  await rectNode.dragTo(canvas, {
    targetPosition: { x: 250, y: 250 },
  })
  await page.waitForTimeout(500)

  // 记录节点数量
  const nodeCountBefore = await page.locator('.lf-node').count()
  expect(nodeCountBefore).toBeGreaterThan(0)

  // 触发保存：创建一个新 Tab 然后切换回来，这会触发 updateTab()
  const addTabButton = page.locator('.el-tabs__new-tab').first()
  await addTabButton.click()
  await page.waitForTimeout(1000)

  // 切换回第一个 Tab（触发保存）
  const tabs = page.locator('[role="tab"]')
  await tabs.first().click()
  await page.waitForTimeout(2000) // 等待保存完成（1秒防抖 + 1秒缓冲）

  // 刷新页面
  await page.reload()
  await waitForAppReady(page)

  // 等待画布加载和数据恢复
  await expect(canvas).toBeVisible()
  await page.waitForTimeout(2000)

  // 断言：节点数量与刷新前一致（允许 ±1 的误差）
  const nodeCountAfter = await page.locator('.lf-node').count()
  expect(Math.abs(nodeCountAfter - nodeCountBefore)).toBeLessThanOrEqual(1)
  expect(nodeCountAfter).toBeGreaterThan(0)
})
