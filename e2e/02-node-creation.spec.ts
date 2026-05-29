import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * T02: 节点创建（拖拽）
 *
 * 场景：从组件面板拖拽节点到画布
 *
 * 步骤：
 * 1. 打开应用
 * 2. 在组件面板找到"矩形"节点
 * 3. 拖拽到画布区域
 * 4. 释放鼠标
 *
 * 断言：
 * - 画布中出现一个新的矩形节点
 * - 节点有可见的图形渲染
 */
test('T02: 节点创建（拖拽）', async ({ page }) => {
  await page.goto('/')
  await waitForAppReady(page)

  // 等待组件面板加载
  const componentPanel = page.locator('.components-panel, [class*="component"]').first()
  await expect(componentPanel).toBeVisible()

  // 查找长方形节点
  const rectNode = page.locator('text=长方形').first()
  await expect(rectNode).toBeVisible()

  // 获取画布区域
  const canvas = page.locator('.lf-canvas-overlay, [class*="canvas"]').first()
  await expect(canvas).toBeVisible()

  // 获取画布中心位置
  const canvasBox = await canvas.boundingBox()
  if (!canvasBox) {
    throw new Error('Canvas not found')
  }
  const targetX = canvasBox.x + canvasBox.width / 2
  const targetY = canvasBox.y + canvasBox.height / 2

  // 记录拖拽前的节点数量
  const nodesBefore = await page.locator('.lf-node').count()

  // 拖拽矩形节点到画布中心
  await rectNode.dragTo(canvas, {
    targetPosition: {
      x: canvasBox.width / 2,
      y: canvasBox.height / 2,
    },
  })

  // 等待节点创建
  await page.waitForTimeout(500)

  // 断言：画布中节点数量增加
  const nodesAfter = await page.locator('.lf-node').count()
  expect(nodesAfter).toBeGreaterThan(nodesBefore)
})
