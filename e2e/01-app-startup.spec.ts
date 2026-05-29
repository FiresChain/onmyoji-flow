import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * T01: 应用启动
 *
 * 场景：应用正常启动，核心 UI 元素全部渲染
 *
 * 步骤：
 * 1. 打开 http://localhost:5173
 * 2. 等待页面加载完成
 * 3. 处理可能出现的启动弹窗
 *
 * 断言：
 * - 工具栏可见
 * - 左侧组件面板可见
 * - 画布区域可见
 * - 默认有一个 Tab 标签
 * - 无 console error
 */
test('T01: 应用启动', async ({ page }) => {
  // 监听 console error
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  // 打开应用并等待就绪
  await page.goto('/')
  await waitForAppReady(page)

  // 断言：工具栏可见
  const toolbar = page.locator('.toolbar, [class*="toolbar"]').first()
  await expect(toolbar).toBeVisible({ timeout: 10000 })

  // 断言：左侧组件面板可见
  const componentPanel = page.locator('.components-panel, [class*="component"]').first()
  await expect(componentPanel).toBeVisible({ timeout: 10000 })

  // 断言：画布区域可见
  const canvas = page.locator('.lf-canvas-overlay, canvas, [class*="canvas"]').first()
  await expect(canvas).toBeVisible({ timeout: 10000 })

  // 断言：默认有一个 Tab 标签
  const tabs = page.locator('.el-tabs__item, [role="tab"]')
  await expect(tabs).toHaveCount(1, { timeout: 10000 })

  // 断言：无 console error
  expect(consoleErrors).toEqual([])
})
