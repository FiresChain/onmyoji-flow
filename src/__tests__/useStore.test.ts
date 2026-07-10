import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import type { GraphData, RootDocument, Transform } from "@/core/document/types";
import type { EditorPort } from "@/core/logicflow/types";
import type { FilesPersistence } from "@/features/workspace/filesPersistence";
import { useFilesStore } from "@/features/workspace/filesStore";
import { createWorkspaceSession } from "@/features/workspace/useWorkspaceSession";

const IDENTITY_VIEWPORT: Transform = {
  SCALE_X: 1,
  SCALE_Y: 1,
  TRANSLATE_X: 0,
  TRANSLATE_Y: 0,
};

const CAPTURED_VIEWPORT: Transform = {
  SCALE_X: 2,
  SCALE_Y: 2,
  TRANSLATE_X: 8,
  TRANSLATE_Y: 9,
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const createGraph = (nodeId: string, position = 10): GraphData => ({
  nodes: [
    {
      id: nodeId,
      type: "rect",
      x: position,
      y: position,
      properties: {},
    },
  ],
  edges: [],
});

const createSampleRootDocument = (): RootDocument => ({
  schemaVersion: "1.0.0",
  workspaceMeta: { owner: "contract-owner" },
  fileList: [
    {
      id: "file-1",
      name: "File 1",
      label: "File 1",
      visible: true,
      type: "FLOW",
      graphRawData: createGraph("source-node", 10),
      transform: IDENTITY_VIEWPORT,
      createdAt: 100,
      updatedAt: 200,
      featureMeta: { index: 0 },
    },
    {
      id: "file-2",
      name: "File 2",
      label: "File 2",
      visible: true,
      type: "FLOW",
      graphRawData: createGraph("target-node", 20),
      transform: {
        SCALE_X: 1.5,
        SCALE_Y: 1.5,
        TRANSLATE_X: 12,
        TRANSLATE_Y: 24,
      },
      createdAt: 101,
      updatedAt: 201,
      featureMeta: { index: 1 },
    },
  ],
  activeFileId: "file-1",
  activeFile: "File 1",
});

const createPersistenceFake = (
  initialDocument: RootDocument | null,
  events: string[],
  loadError?: Error,
) => {
  let current = initialDocument ? clone(initialDocument) : null;
  const saved: RootDocument[] = [];
  const load = vi.fn(() => {
    if (loadError) {
      throw loadError;
    }
    return current ? clone(current) : null;
  });
  const save = vi.fn((document: RootDocument) => {
    const snapshot = clone(document);
    current = snapshot;
    saved.push(snapshot);
    events.push("persist");
  });
  const remove = vi.fn(() => {
    current = null;
  });
  const flush = vi.fn();
  const dispose = vi.fn();
  const persistence: FilesPersistence = {
    load,
    save,
    remove,
    flush,
    dispose,
  };

  return {
    persistence,
    saved,
    load,
    save,
    remove,
    flush,
    dispose,
  };
};

const createEditorPortFake = (events: string[]) => {
  const capturedGraph = createGraph("captured-node", 100);
  const render = vi.fn((data: GraphData) => {
    events.push(`render:${data.nodes[0]?.id ?? "empty"}`);
  });
  const capture = vi.fn(() => {
    events.push("capture");
    return clone(capturedGraph);
  });
  const clear = vi.fn(() => {
    events.push("clear");
  });
  const resize = vi.fn();
  const getViewport = vi.fn(() => {
    events.push("getViewport");
    return clone(CAPTURED_VIEWPORT);
  });
  const setViewport = vi.fn((transform: Transform) => {
    events.push(
      `setViewport:${transform.SCALE_X}:${transform.TRANSLATE_X}:${transform.TRANSLATE_Y}`,
    );
  });
  const fitView = vi.fn();
  const dispose = vi.fn();
  const port: EditorPort = {
    render,
    capture,
    clear,
    resize,
    getViewport,
    setViewport,
    zoom: vi.fn(() => true),
    resetZoom: vi.fn(() => true),
    resetTranslate: vi.fn(() => true),
    translateCenter: vi.fn(() => true),
    fitView,
    dispose,
  };

  return {
    port,
    capturedGraph,
    render,
    capture,
    clear,
    getViewport,
    setViewport,
  };
};

interface HarnessOptions {
  initialDocument?: RootDocument | null;
  loadError?: Error;
  now?: number;
}

const createHarness = (options: HarnessOptions = {}) => {
  const events: string[] = [];
  const pinia = createPinia();
  const store = useFilesStore(pinia);
  const persistenceFake = createPersistenceFake(
    options.initialDocument === undefined
      ? createSampleRootDocument()
      : options.initialDocument,
    events,
    options.loadError,
  );
  const editorFake = createEditorPortFake(events);
  const session = createWorkspaceSession({
    store,
    persistence: persistenceFake.persistence,
    getEditorPort: () => editorFake.port,
    pinia,
    now: () => options.now ?? 1_000,
  });

  return {
    events,
    pinia,
    store,
    session,
    ...persistenceFake,
    ...editorFake,
  };
};

describe("workspace files store and session", () => {
  beforeEach(() => {
    setActivePinia(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    setActivePinia(undefined);
  });

  it("没有持久化数据时创建默认文件并渲染空画布", () => {
    const harness = createHarness({ initialDocument: null, now: 123 });

    expect(harness.session.initialize()).toEqual({ restored: false });

    expect(harness.store.fileList).toHaveLength(1);
    expect(harness.store.fileList[0]).toMatchObject({
      name: "File 1",
      label: "File 1",
      type: "FLOW",
      visible: true,
      graphRawData: { nodes: [], edges: [] },
      createdAt: 123,
      updatedAt: 123,
    });
    expect(harness.store.activeFileId).toBe(harness.store.fileList[0].id);
    expect(harness.capture).not.toHaveBeenCalled();
    expect(harness.render).toHaveBeenCalledWith({ nodes: [], edges: [] });
    expect(harness.setViewport).toHaveBeenCalledWith(IDENTITY_VIEWPORT);
  });

  it("从 persistence 恢复文档时不捕获当前画布", () => {
    const harness = createHarness();

    expect(harness.session.initialize()).toEqual({ restored: true });

    expect(harness.store.fileList).toHaveLength(2);
    expect(harness.store.activeFileId).toBe("file-1");
    expect(harness.store.rootDocumentExtras).toEqual({
      workspaceMeta: { owner: "contract-owner" },
    });
    expect(harness.capture).not.toHaveBeenCalled();
    expect(harness.render).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: [expect.objectContaining({ id: "source-node" })],
      }),
    );
  });

  it.each([
    {
      label: "activeFile(name)",
      activeFileId: "missing-file",
      activeFile: "File 2",
      expectedId: "file-2",
    },
    {
      label: "首文件",
      activeFileId: "missing-file",
      activeFile: "Missing File",
      expectedId: "file-1",
    },
  ])("恢复时活动文件无效则回退到 $label", (scenario) => {
    const harness = createHarness({
      initialDocument: {
        ...createSampleRootDocument(),
        activeFileId: scenario.activeFileId,
        activeFile: scenario.activeFile,
      },
    });

    expect(harness.session.initialize()).toEqual({ restored: true });
    expect(harness.store.activeFileId).toBe(scenario.expectedId);
    expect(harness.capture).not.toHaveBeenCalled();
  });

  it("持久化读取损坏时清理所属数据并恢复默认文档", () => {
    const harness = createHarness({
      initialDocument: null,
      loadError: new SyntaxError("corrupted JSON"),
      now: 456,
    });

    const result = harness.session.initialize();

    expect(result.restored).toBe(false);
    expect(result.error).toBeInstanceOf(SyntaxError);
    expect(harness.remove).toHaveBeenCalledOnce();
    expect(harness.store.fileList).toHaveLength(1);
    expect(harness.store.fileList[0]).toMatchObject({
      name: "File 1",
      createdAt: 456,
      updatedAt: 456,
    });
    expect(harness.capture).not.toHaveBeenCalled();
  });

  it("导入校验失败时不污染现有状态、画布或 persistence", () => {
    const harness = createHarness();
    harness.session.initialize();
    const before = clone(harness.store.toDocument());
    harness.render.mockClear();
    harness.capture.mockClear();
    harness.save.mockClear();
    harness.saved.length = 0;

    const result = harness.session.importData({
      ...createSampleRootDocument(),
      schemaVersion: "2.0.0",
    });

    expect(result.ok).toBe(false);
    expect(harness.store.toDocument()).toEqual(before);
    expect(harness.render).not.toHaveBeenCalled();
    expect(harness.capture).not.toHaveBeenCalled();
    expect(harness.save).not.toHaveBeenCalled();
  });

  it("导入时迁移 meta.z 并保留其他节点元数据", () => {
    const harness = createHarness({ initialDocument: null });
    harness.session.initialize();
    harness.save.mockClear();
    harness.saved.length = 0;
    const document = createSampleRootDocument();
    document.fileList[0].graphRawData.nodes[0].properties = {
      style: { width: 100, height: 100 },
      meta: { z: 9, locked: true },
    };

    const result = harness.session.importData(document);

    expect(result.ok).toBe(true);
    const node = harness.store.fileList[0].graphRawData.nodes[0];
    expect(node.zIndex).toBe(9);
    expect(node.properties?.meta).toMatchObject({ locked: true });
    expect(node.properties?.meta?.z).toBeUndefined();
    expect(harness.save).toHaveBeenCalledOnce();
    expect(harness.capture).not.toHaveBeenCalled();
  });

  it("import -> capture -> persist 保留扩展字段与文件时间戳", () => {
    const harness = createHarness({ initialDocument: null, now: 999 });
    harness.session.initialize();
    harness.saved.length = 0;
    harness.save.mockClear();

    expect(harness.session.importData(createSampleRootDocument()).ok).toBe(
      true,
    );
    expect(harness.saved[harness.saved.length - 1]).toMatchObject({
      workspaceMeta: { owner: "contract-owner" },
      fileList: [
        {
          id: "file-1",
          createdAt: 100,
          updatedAt: 200,
          featureMeta: { index: 0 },
        },
        {
          id: "file-2",
          createdAt: 101,
          updatedAt: 201,
          featureMeta: { index: 1 },
        },
      ],
    });

    harness.session.updateTab("file-1");

    expect(harness.saved[harness.saved.length - 1]).toMatchObject({
      workspaceMeta: { owner: "contract-owner" },
      fileList: [
        {
          id: "file-1",
          createdAt: 100,
          updatedAt: 999,
          featureMeta: { index: 0 },
        },
        {
          id: "file-2",
          createdAt: 101,
          updatedAt: 201,
          featureMeta: { index: 1 },
        },
      ],
    });
  });

  it("切换文件时先捕获来源文件，再渲染目标文件", () => {
    const harness = createHarness({ now: 777 });
    harness.session.initialize();
    const targetBefore = clone(harness.store.getTab("file-2")?.graphRawData);
    harness.events.length = 0;
    harness.saved.length = 0;

    expect(harness.session.setActiveFile("file-2")).toBe(true);

    expect(harness.events).toEqual([
      "capture",
      "getViewport",
      "render:target-node",
      "setViewport:1.5:12:24",
      "persist",
    ]);
    expect(harness.store.activeFileId).toBe("file-2");
    expect(harness.store.getTab("file-1")).toMatchObject({
      graphRawData: harness.capturedGraph,
      transform: CAPTURED_VIEWPORT,
      updatedAt: 777,
    });
    expect(harness.store.getTab("file-2")?.graphRawData).toEqual(targetBefore);
  });

  it("切换到当前文件时不捕获、不渲染也不持久化", () => {
    const harness = createHarness();
    harness.session.initialize();
    harness.capture.mockClear();
    harness.render.mockClear();
    harness.save.mockClear();

    expect(harness.session.setActiveFile("file-1")).toBe(false);
    expect(harness.capture).not.toHaveBeenCalled();
    expect(harness.render).not.toHaveBeenCalled();
    expect(harness.save).not.toHaveBeenCalled();
  });

  it("非活动文件的重命名与可见性修改不会串写 graphRawData", () => {
    const harness = createHarness();
    harness.session.initialize();
    const targetBefore = clone(harness.store.getTab("file-2")?.graphRawData);
    harness.capture.mockClear();
    harness.render.mockClear();

    expect(harness.session.renameFile("file-2", " Renamed File ")).toBe(true);
    expect(harness.session.setVisible("file-2", false)).toBe(true);

    expect(harness.store.getTab("file-2")).toMatchObject({
      name: "Renamed File",
      label: "Renamed File",
      visible: false,
      graphRawData: targetBefore,
    });
    expect(harness.store.activeFileId).toBe("file-1");
    expect(harness.store.visibleFiles.map((file) => file.id)).toEqual([
      "file-1",
    ]);
    expect(harness.capture).not.toHaveBeenCalled();
    expect(harness.render).not.toHaveBeenCalled();
  });

  it("新增文件时保存来源画布且新文件保持空数据", () => {
    const harness = createHarness({ now: 888 });
    harness.session.initialize();
    const existingTarget = clone(harness.store.getTab("file-2")?.graphRawData);
    harness.events.length = 0;

    harness.session.addTab();

    const addedFile = harness.store.activeFile;
    expect(harness.store.fileList).toHaveLength(3);
    expect(addedFile).toMatchObject({
      name: "File 3",
      graphRawData: { nodes: [], edges: [] },
    });
    expect(harness.store.getTab("file-1")).toMatchObject({
      graphRawData: harness.capturedGraph,
      transform: CAPTURED_VIEWPORT,
      updatedAt: 888,
    });
    expect(harness.store.getTab("file-2")?.graphRawData).toEqual(
      existingTarget,
    );
    expect(harness.events).toEqual([
      "capture",
      "getViewport",
      "render:empty",
      "setViewport:1:0:0",
      "persist",
    ]);
  });

  it("删除非活动文件时不读取画布或改写活动文件", () => {
    const harness = createHarness();
    harness.session.initialize();
    const activeBefore = clone(harness.store.getTab("file-1")?.graphRawData);
    harness.capture.mockClear();
    harness.render.mockClear();

    expect(harness.session.deleteFile("file-2")).toBe(true);

    expect(harness.store.getTab("file-2")).toBeUndefined();
    expect(harness.store.activeFileId).toBe("file-1");
    expect(harness.store.getTab("file-1")?.graphRawData).toEqual(activeBefore);
    expect(harness.capture).not.toHaveBeenCalled();
    expect(harness.render).not.toHaveBeenCalled();
  });

  it("删除活动文件时直接渲染回退文件且不串写其数据", () => {
    const harness = createHarness();
    harness.session.initialize();
    const fallbackBefore = clone(harness.store.getTab("file-2")?.graphRawData);
    harness.capture.mockClear();
    harness.render.mockClear();

    expect(harness.session.removeTab("file-1")).toBe(true);

    expect(harness.store.getTab("file-1")).toBeUndefined();
    expect(harness.store.activeFileId).toBe("file-2");
    expect(harness.store.getTab("file-2")?.graphRawData).toEqual(
      fallbackBefore,
    );
    expect(harness.capture).not.toHaveBeenCalled();
    expect(harness.render).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: [expect.objectContaining({ id: "target-node" })],
      }),
    );
  });

  it("隐藏活动文件时捕获来源并切换到可见回退文件", () => {
    const harness = createHarness({ now: 654 });
    harness.session.initialize();
    const fallbackBefore = clone(harness.store.getTab("file-2")?.graphRawData);
    harness.events.length = 0;

    expect(harness.session.setVisible("file-1", false)).toBe(true);

    expect(harness.store.activeFileId).toBe("file-2");
    expect(harness.store.getTab("file-1")).toMatchObject({
      visible: false,
      graphRawData: harness.capturedGraph,
      updatedAt: 654,
    });
    expect(harness.store.getTab("file-2")?.graphRawData).toEqual(
      fallbackBefore,
    );
    expect(harness.events).toEqual([
      "capture",
      "getViewport",
      "render:target-node",
      "setViewport:1.5:12:24",
      "persist",
    ]);
  });

  it("重置工作区会删除持久化数据并恢复默认文件", () => {
    const harness = createHarness({ now: 321 });
    harness.session.initialize();
    harness.remove.mockClear();
    harness.render.mockClear();
    harness.capture.mockClear();
    harness.saved.length = 0;

    harness.session.resetWorkspace();

    expect(harness.remove).toHaveBeenCalledOnce();
    expect(harness.store.fileList).toHaveLength(1);
    expect(harness.store.fileList[0]).toMatchObject({
      name: "File 1",
      graphRawData: { nodes: [], edges: [] },
      createdAt: 321,
      updatedAt: 321,
    });
    expect(harness.store.activeFileId).toBe(harness.store.fileList[0].id);
    expect(harness.capture).not.toHaveBeenCalled();
    expect(harness.render).toHaveBeenCalledWith({ nodes: [], edges: [] });
    expect(harness.saved).toHaveLength(0);
  });

  it("dispose 停止自动保存 timer、flush persistence 且可重复调用", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    harness.session.initialize();
    harness.capture.mockClear();
    harness.save.mockClear();
    harness.saved.length = 0;

    harness.session.startAutoSave(100);
    vi.advanceTimersByTime(99);
    expect(harness.save).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(harness.capture).toHaveBeenCalledOnce();
    expect(harness.save).toHaveBeenCalledOnce();

    harness.session.dispose();
    const savedAfterDispose = harness.saved.length;
    expect(harness.flush).toHaveBeenCalledOnce();
    expect(harness.dispose).toHaveBeenCalledOnce();
    expect(harness.session.persist()).toBe(false);

    vi.advanceTimersByTime(500);
    harness.session.dispose();

    expect(harness.saved).toHaveLength(savedAfterDispose);
    expect(harness.flush).toHaveBeenCalledOnce();
    expect(harness.dispose).toHaveBeenCalledOnce();
  });
});
