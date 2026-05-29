import { Page } from '@playwright/test'

/**
 * 处理应用启动时可能出现的更新日志弹窗
 *
 * 弹窗触发条件：localStorage.getItem("appVersion") !== currentAppVersion
 * 弹窗类型：el-dialog with showUpdateLogDialog
 */
export async function dismissStartupDialogs(page: Page) {
  // 等待弹窗出现（mountDialogState 在组件 mounted 时触发）
  await page.waitForTimeout(1000)

  // 查找 Element Plus 对话框
  const dialog = page.locator('.el-dialog').first()

  if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
    // 按 ESC 键关闭弹窗（Element Plus 对话框默认支持 ESC 关闭）
    await page.keyboard.press('Escape')

    // 等待弹窗关闭动画完成
    await page.waitForTimeout(500)

    // 确认弹窗已消失
    await dialog.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
  }
}

/**
 * 等待页面加载完成并处理启动弹窗
 *
 * @param clearStorage - 是否清空 localStorage（模拟新用户）
 */
export async function waitForAppReady(page: Page, clearStorage = false) {
  // 如果需要，清空 localStorage 模拟新用户
  if (clearStorage) {
    await page.evaluate(() => localStorage.clear())
  }

  // 等待 DOM 加载
  await page.waitForLoadState('domcontentloaded')

  // 处理可能的更新日志弹窗
  await dismissStartupDialogs(page)
}
