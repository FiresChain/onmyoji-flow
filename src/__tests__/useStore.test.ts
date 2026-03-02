import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFilesStore } from '../ts/useStore'

const logicFlowMocks = vi.hoisted(() => ({
  getGraphRawData: vi.fn(() => ({
    nodes: [{ id: 'lf-node', type: 'rect', x: 100, y: 100 }],
    edges: []
  })),
  getTransform: vi.fn(() => ({
    SCALE_X: 1,
    SCALE_Y: 1,
    TRANSLATE_X: 0,
    TRANSLATE_Y: 0
  })),
  getNodeModelById: vi.fn(() => ({ zIndex: 1 }))
}))

const createSampleRootDocument = () => ({
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
    getGraphRawData: logicFlowMocks.getGraphRawData,
    getTransform: logicFlowMocks.getTransform,
    getNodeModelById: logicFlowMocks.getNodeModelById
  }))
}))

describe('useFilesStore 数据操作测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
    logicFlowMocks.getGraphRawData.mockClear()
    logicFlowMocks.getTransform.mockClear()
    logicFlowMocks.getNodeModelById.mockClear()
  })

  it('应该初始化默认文件列表', () => {
    const store = useFilesStore()
    store.initializeWithPrompt()

    expect(store.fileList.length).toBeGreaterThan(0)
    expect(store.fileList[0].name).toBe('File 1')
    expect(store.fileList[0].type).toBe('FLOW')
    expect(logicFlowMocks.getGraphRawData).not.toHaveBeenCalled()
  })

  it('initializeWithPrompt 从 localStorage 恢复时不应触发 LogicFlow 数据回写', () => {
    localStorageMock.setItem('filesStore', JSON.stringify(createSampleRootDocument()))
    const store = useFilesStore()

    store.initializeWithPrompt()

    expect(store.fileList.length).toBe(2)
    expect(store.activeFileId).toBe('file-1')
    expect(logicFlowMocks.getGraphRawData).not.toHaveBeenCalled()
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
    store.setActiveFile(secondFile.id)

    expect(store.activeFileId).toBe(secondFile.id)
  })

  it('addTab 切换活动文件时应仅保存一次来源文件且不串写新文件 graphRawData', async () => {
    const store = useFilesStore()
    store.importData(createSampleRootDocument())

    store.addTab()
    await new Promise(resolve => setTimeout(resolve, 50))

    const newActiveFile = store.fileList[store.fileList.length - 1]
    const sourceAfter = store.getTab('file-1')?.graphRawData

    expect(store.activeFileId).toBe(newActiveFile.id)
    expect(sourceAfter).toMatchObject({
      nodes: [{ id: 'lf-node', type: 'rect', x: 100, y: 100, zIndex: 1 }],
      edges: []
    })
    expect(newActiveFile.graphRawData).toEqual({})
    expect(logicFlowMocks.getGraphRawData).toHaveBeenCalledTimes(1)
  })

  it('切换活动文件时应只保存一次来源文件且不串写目标文件', () => {
    const store = useFilesStore()

    store.importData(createSampleRootDocument())

    const targetBefore = JSON.parse(JSON.stringify(store.getTab('file-2')?.graphRawData))
    store.setActiveFile('file-2')
    const sourceAfter = store.getTab('file-1')?.graphRawData
    const targetAfter = store.getTab('file-2')?.graphRawData

    expect(store.activeFileId).toBe('file-2')
    expect(sourceAfter).toMatchObject({
      nodes: [{ id: 'lf-node', type: 'rect', x: 100, y: 100, zIndex: 1 }],
      edges: []
    })
    expect(targetAfter).toEqual(targetBefore)
    expect(logicFlowMocks.getGraphRawData).toHaveBeenCalledTimes(1)
  })

  it('切换到当前活动文件时不应触发重复保存', () => {
    const store = useFilesStore()
    store.importData(createSampleRootDocument())

    store.setActiveFile('file-1')

    expect(logicFlowMocks.getGraphRawData).not.toHaveBeenCalled()
  })

  it('对非活动文件 setVisible 不应串写目标文件 graphRawData', () => {
    const store = useFilesStore()
    store.importData(createSampleRootDocument())

    const targetBefore = JSON.parse(JSON.stringify(store.getTab('file-2')?.graphRawData))
    store.setVisible('file-2', false)
    const targetAfter = store.getTab('file-2')?.graphRawData

    expect(targetAfter).toEqual(targetBefore)
    expect(store.getTab('file-2')?.visible).toBe(false)
    expect(logicFlowMocks.getGraphRawData).not.toHaveBeenCalled()
  })

  it('隐藏活动文件后应保持保存来源明确且不串写新活动文件 graphRawData', () => {
    const store = useFilesStore()
    store.importData(createSampleRootDocument())

    const fallbackBefore = JSON.parse(JSON.stringify(store.getTab('file-2')?.graphRawData))
    store.setVisible('file-1', false)
    const hiddenFile = store.getTab('file-1')
    const fallbackAfter = store.getTab('file-2')?.graphRawData

    expect(store.activeFileId).toBe('file-2')
    expect(hiddenFile?.visible).toBe(false)
    expect(fallbackAfter).toEqual(fallbackBefore)
    expect(hiddenFile?.graphRawData).toMatchObject({
      nodes: [{ id: 'lf-node', type: 'rect', x: 100, y: 100, zIndex: 1 }],
      edges: []
    })
    expect(logicFlowMocks.getGraphRawData).toHaveBeenCalledTimes(1)
  })

  it('removeTab 删除活动文件触发切换时不应重复保存或串写目标文件', () => {
    const store = useFilesStore()
    store.importData(createSampleRootDocument())

    const fallbackBefore = JSON.parse(JSON.stringify(store.getTab('file-2')?.graphRawData))
    store.removeTab('file-1')
    const fallbackAfter = store.getTab('file-2')?.graphRawData

    expect(store.activeFileId).toBe('file-2')
    expect(store.getTab('file-1')).toBeUndefined()
    expect(fallbackAfter).toEqual(fallbackBefore)
    expect(logicFlowMocks.getGraphRawData).not.toHaveBeenCalled()
  })

  it('对非活动文件 renameFile 不应串写目标文件 graphRawData', () => {
    const store = useFilesStore()
    store.importData(createSampleRootDocument())

    const targetBefore = JSON.parse(JSON.stringify(store.getTab('file-2')?.graphRawData))
    store.renameFile('file-2', 'Renamed File')
    const targetAfter = store.getTab('file-2')?.graphRawData

    expect(targetAfter).toEqual(targetBefore)
    expect(store.getTab('file-2')?.name).toBe('Renamed File')
    expect(logicFlowMocks.getGraphRawData).not.toHaveBeenCalled()
  })

  it('对非活动文件 deleteFile 不应触发画布同步串写', () => {
    const store = useFilesStore()
    store.importData(createSampleRootDocument())

    const activeBefore = JSON.parse(JSON.stringify(store.getTab('file-1')?.graphRawData))
    store.deleteFile('file-2')
    const activeAfter = store.getTab('file-1')?.graphRawData

    expect(store.getTab('file-2')).toBeUndefined()
    expect(activeAfter).toEqual(activeBefore)
    expect(logicFlowMocks.getGraphRawData).not.toHaveBeenCalled()
  })

  it('deleteFile 删除活动文件触发切换时不应将当前画布数据串写到新活动文件', () => {
    const store = useFilesStore()
    store.importData(createSampleRootDocument())

    const fallbackBefore = JSON.parse(JSON.stringify(store.getTab('file-2')?.graphRawData))
    store.deleteFile('file-1')
    const fallbackAfter = store.getTab('file-2')?.graphRawData

    expect(store.getTab('file-1')).toBeUndefined()
    expect(store.activeFileId).toBe('file-2')
    expect(fallbackAfter).toEqual(fallbackBefore)
    expect(logicFlowMocks.getGraphRawData).not.toHaveBeenCalled()
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
    expect(logicFlowMocks.getGraphRawData).not.toHaveBeenCalled()
  })

  it('重置工作区应该恢复到默认状态', async () => {
    const store = useFilesStore()
    store.initializeWithPrompt()
    store.addTab()
    store.addTab()

    // 等待添加完成
    await new Promise(resolve => setTimeout(resolve, 100))

    logicFlowMocks.getGraphRawData.mockClear()
    store.resetWorkspace()

    expect(store.fileList.length).toBe(1)
    expect(store.fileList[0].name).toBe('File 1')
    expect(logicFlowMocks.getGraphRawData).not.toHaveBeenCalled()
  })
})
