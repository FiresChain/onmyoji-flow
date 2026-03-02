import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFilesStore } from '../ts/useStore'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock ElMessageBox 和 useGlobalMessage
vi.mock('element-plus', () => ({
  ElMessageBox: {
    confirm: vi.fn()
  }
}))

vi.mock('../ts/useGlobalMessage', () => ({
  useGlobalMessage: () => ({
    showMessage: vi.fn()
  })
}))

vi.mock('../ts/useLogicFlow', () => ({
  getLogicFlowInstance: vi.fn(() => ({
    getGraphRawData: vi.fn(() => ({ nodes: [], edges: [] })),
    getTransform: vi.fn(() => ({
      SCALE_X: 1,
      SCALE_Y: 1,
      TRANSLATE_X: 0,
      TRANSLATE_Y: 0
    }))
  }))
}))

describe('useFilesStore 数据操作测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
  })

  it('应该初始化默认文件列表', () => {
    const store = useFilesStore()
    store.initializeWithPrompt()

    expect(store.fileList.length).toBeGreaterThan(0)
    expect(store.fileList[0].name).toBe('File 1')
    expect(store.fileList[0].type).toBe('FLOW')
  })

  it('添加新文件应该增加文件列表长度', async () => {
    const store = useFilesStore()
    store.initializeWithPrompt()

    const initialLength = store.fileList.length
    store.addTab()

    // 等待 requestAnimationFrame 完成
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(store.fileList.length).toBe(initialLength + 1)
    expect(store.fileList[store.fileList.length - 1].name).toContain('File')
  })

  it('删除文件应该减少文件列表长度', async () => {
    const store = useFilesStore()
    store.initializeWithPrompt()
    store.addTab()

    // 等待添加完成
    await new Promise(resolve => setTimeout(resolve, 50))

    const initialLength = store.fileList.length
    const fileToDelete = store.fileList[0]

    store.removeTab(fileToDelete.id)

    expect(store.fileList.length).toBe(initialLength - 1)
  })

  it('切换活动文件应该更新 activeFileId', async () => {
    const store = useFilesStore()
    store.initializeWithPrompt()
    store.addTab()

    // 等待添加完成
    await new Promise(resolve => setTimeout(resolve, 50))

    const secondFile = store.fileList[1]
    store.activeFileId = secondFile.id

    expect(store.activeFileId).toBe(secondFile.id)
  })

  it('切换活动文件时不应将当前画布数据写入目标文件', () => {
    const store = useFilesStore()

    store.importData({
      schemaVersion: '1.0.0',
      fileList: [
        {
          id: 'file-1',
          name: 'File 1',
          label: 'File 1',
          visible: true,
          type: 'FLOW',
          graphRawData: {
            nodes: [{ id: 'source-node', type: 'rect', x: 10, y: 10 }],
            edges: []
          }
        },
        {
          id: 'file-2',
          name: 'File 2',
          label: 'File 2',
          visible: true,
          type: 'FLOW',
          graphRawData: {
            nodes: [{ id: 'target-node', type: 'rect', x: 20, y: 20 }],
            edges: []
          }
        }
      ],
      activeFileId: 'file-1',
      activeFile: 'File 1'
    })

    const targetBefore = JSON.parse(JSON.stringify(store.getTab('file-2')?.graphRawData))
    store.setActiveFile('file-2')
    const targetAfter = store.getTab('file-2')?.graphRawData

    expect(store.activeFileId).toBe('file-2')
    expect(targetAfter).toEqual(targetBefore)
  })

  it('visibleFiles 应该只返回可见文件', async () => {
    const store = useFilesStore()
    store.initializeWithPrompt()
    store.addTab()

    // 等待添加完成
    await new Promise(resolve => setTimeout(resolve, 50))

    // 隐藏第一个文件
    store.fileList[0].visible = false

    expect(store.visibleFiles.length).toBe(store.fileList.length - 1)
    expect(store.visibleFiles.every(f => f.visible)).toBe(true)
  })

  it('导入数据应该正确恢复文件列表', () => {
    const store = useFilesStore()

    const mockData = {
      schemaVersion: '1.0.0',
      fileList: [
        {
          id: 'test-1',
          name: 'Test File',
          label: 'Test File',
          visible: true,
          type: 'FLOW',
          graphRawData: { nodes: [], edges: [] }
        }
      ],
      activeFileId: 'test-1',
      activeFile: 'Test File'
    }

    store.importData(mockData)

    expect(store.fileList.length).toBe(1)
    expect(store.fileList[0].name).toBe('Test File')
    expect(store.activeFileId).toBe('test-1')
  })

  it('重置工作区应该恢复到默认状态', async () => {
    const store = useFilesStore()
    store.initializeWithPrompt()
    store.addTab()
    store.addTab()

    // 等待添加完成
    await new Promise(resolve => setTimeout(resolve, 100))

    store.resetWorkspace()

    expect(store.fileList.length).toBe(1)
    expect(store.fileList[0].name).toBe('File 1')
  })
})
