import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * T06: 加载示例
 *
 * 场景：通过工具栏加载内置示例数据
 *
 * 步骤：
 * 1. 打开应用
 * 2. 点击工具栏 → 文件 → 加载样例
 * 3. 确认覆盖
 *
 * 断言：
 * - 创建了一个名为"示例文件"的新 Tab
 * - Tab 切换成功
 * - 无 console error
 */
test('T06: 加载示例', async ({ page }) => {
  // 监听 console error
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto('/')
  await waitForAppReady(page)

  // 等待工具栏加载
  const toolbar = page.locator('.toolbar, [class*="toolbar"]').first()
  await expect(toolbar).toBeVisible()

  // 记录初始 Tab 数量
  const initialTabCount = await page.locator('[role="tab"]').count()

  // 点击文件菜单
  const fileMenu = page.locator('button:has-text("文件")').first()
  await fileMenu.click()
  await page.waitForTimeout(500)

  // 在下拉菜单中点击"加载样例"（注意是"样例"不是"示例"）
  const loadExampleItem = page.locator('[role="menuitem"]').filter({ hasText: '加载样例' })
  await loadExampleItem.click()

  // 等待确认对话框出现并点击"覆盖"按钮
  await page.waitForTimeout(500)
  const confirmButton = page.locator('button:has-text("覆盖")').first()
  await confirmButton.click()
  await page.waitForTimeout(1500)

  // 断言：创建了名为"示例文件"的 Tab
  const exampleTab = page.locator('[role="tab"]').filter({ hasText: '示例文件' })
  await expect(exampleTab).toBeVisible()

  // 断言：Tab 是激活状态
  await expect(exampleTab).toHaveAttribute('aria-selected', 'true')

  // 断言：无 console error
  expect(consoleErrors).toEqual([])
})
