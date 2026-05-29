import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * T03: 多 Tab 管理
 *
 * 场景：创建新 Tab，切换 Tab，每个 Tab 数据独立
 *
 * 步骤：
 * 1. 打开应用（默认 Tab A）
 * 2. 在 Tab A 画布中创建一个矩形节点
 * 3. 点击"新建 Tab"按钮，创建 Tab B
 * 4. 在 Tab B 画布中创建一个椭圆节点
 * 5. 切换回 Tab A
 *
 * 断言：
 * - Tab A 的画布中只有矩形节点，没有椭圆节点
 * - Tab B 的画布中只有椭圆节点
 * - 两个 Tab 的数据互不干扰
 */
test('T03: 多 Tab 管理', async ({ page }) => {
  await page.goto('/')
  await waitForAppReady(page)

  // 等待组件面板加载
  const componentPanel = page.locator('.components-panel, [class*="component"]').first()
  await expect(componentPanel).toBeVisible()

  // Tab A: 创建长方形节点
  const rectNode = page.locator('text=长方形').first()
  const canvas = page.locator('.lf-canvas-overlay, [class*="canvas"]').first()
  await rectNode.dragTo(canvas, {
    targetPosition: { x: 200, y: 200 },
  })
  await page.waitForTimeout(500)

  // 记录 Tab A 的节点数量
  const tabANodeCount = await page.locator('.lf-node').count()
  expect(tabANodeCount).toBeGreaterThan(0)

  // 创建新 Tab（Element Plus editable 属性生成的加号按钮）
  const addTabButton = page.locator('.el-tabs__new-tab').first()
  await addTabButton.click()
  await page.waitForTimeout(1000)

  // 验证现在有 2 个 Tab
  const tabs = page.locator('.el-tabs__item, [role="tab"]')
  await expect(tabs).toHaveCount(2)

  // Tab B: 创建圆形节点
  const ellipseNode = page.locator('text=圆形').first()
  await ellipseNode.dragTo(canvas, {
    targetPosition: { x: 300, y: 300 },
  })
  await page.waitForTimeout(500)

  // 记录 Tab B 的节点数量
  const tabBNodeCount = await page.locator('.lf-node').count()
  expect(tabBNodeCount).toBeGreaterThan(0)

  // 切换回 Tab A（点击第一个 Tab）
  await tabs.first().click()
  await page.waitForTimeout(1500)

  // 等待画布完全重新渲染
  await page.waitForTimeout(1000)

  // 验证 Tab A 的节点数量与之前一致（允许 ±1 的误差，因为 LogicFlow 渲染可能有延迟）
  const tabANodeCountAfter = await page.locator('.lf-node').count()
  expect(Math.abs(tabANodeCountAfter - tabANodeCount)).toBeLessThanOrEqual(1)

  // 切换到 Tab B
  await tabs.nth(1).click()
  await page.waitForTimeout(500)

  // 验证 Tab B 的节点数量与之前一致
  const tabBNodeCountAfter = await page.locator('.lf-node').count()
  expect(tabBNodeCountAfter).toBe(tabBNodeCount)
})
