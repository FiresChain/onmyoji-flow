import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, getActivePinia, setActivePinia } from "pinia";

import type { RootDocument } from "@/core/document/types";
import { createEditorPort } from "@/core/logicflow/createRuntime";
import type { LogicFlowRuntime } from "@/core/logicflow/types";
import { createEditorContext } from "@/editor/context/EditorContext";
import {
  createMemoryFilesPersistence,
  createWorkspaceSession,
  useFilesStore,
} from "@/features/workspace/public";

const createRootDocument = (prefix: string): RootDocument => ({
  schemaVersion: "1.0.0",
  fileList: [
    {
      id: `${prefix}-1`,
      name: `${prefix}-1`,
      label: `${prefix}-1`,
      visible: true,
      type: "FLOW",
      graphRawData: {
        nodes: [
          {
            id: `${prefix}-source`,
            type: "rect",
            x: 10,
            y: 10,
            properties: {},
          },
        ],
        edges: [],
      },
      transform: {
        SCALE_X: 1,
        SCALE_Y: 1,
        TRANSLATE_X: 0,
        TRANSLATE_Y: 0,
      },
    },
    {
      id: `${prefix}-2`,
      name: `${prefix}-2`,
      label: `${prefix}-2`,
      visible: true,
      type: "FLOW",
      graphRawData: {
        nodes: [
          {
            id: `${prefix}-target`,
            type: "rect",
            x: 20,
            y: 20,
            properties: {},
          },
        ],
        edges: [],
      },
      transform: {
        SCALE_X: 1,
        SCALE_Y: 1,
        TRANSLATE_X: 0,
        TRANSLATE_Y: 0,
      },
    },
  ],
  activeFileId: `${prefix}-1`,
  activeFile: `${prefix}-1`,
});

const createLogicFlowMock = (nodeId: string, zIndex: number) => ({
  destroy: vi.fn(),
  render: vi.fn(),
  clearData: vi.fn(),
  resetZoom: vi.fn(),
  resetTranslate: vi.fn(),
  zoom: vi.fn(),
  translate: vi.fn(),
  fitView: vi.fn(),
  getGraphRawData: vi.fn(() => ({
    nodes: [
      {
        id: nodeId,
        type: "rect",
        x: 100,
        y: 100,
        properties: {},
      },
    ],
    edges: [],
  })),
  getTransform: vi.fn(() => ({
    SCALE_X: 1,
    SCALE_Y: 1,
    TRANSLATE_X: 0,
    TRANSLATE_Y: 0,
  })),
  getNodeModelById: vi.fn(() => ({ zIndex, setZIndex: vi.fn() })),
  graphModel: {},
});

const createHarness = (prefix: string) => {
  const pinia = createPinia();
  const previousPinia = getActivePinia();
  const store = useFilesStore(pinia);
  setActivePinia(previousPinia);
  const context = createEditorContext({
    locale: prefix === "a" ? "ja" : "en",
    assetBaseUrl: `/${prefix}`,
  });
  const logicFlow = createLogicFlowMock(
    `${prefix}-captured`,
    prefix === "a" ? 11 : 22,
  );
  let runtimeDisposed = false;
  const disposeRuntime = () => {
    if (runtimeDisposed) return;
    runtimeDisposed = true;
    logicFlow.destroy();
  };
  context.setRuntime({
    instance: logicFlow,
    port: createEditorPort(logicFlow as any, disposeRuntime),
    dispose: disposeRuntime,
  } as unknown as LogicFlowRuntime);
  const session = createWorkspaceSession({
    store,
    persistence: createMemoryFilesPersistence(),
    getEditorPort: () => context.port.value,
    pinia,
  });
  session.importData(createRootDocument(prefix));
  return { pinia, store, context, logicFlow, session };
};

describe("multi-instance embed isolation regression", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    setActivePinia(undefined);
  });

  it("isolates workspace state, runtime capture, settings, locale, and assets", () => {
    const editorA = createHarness("a");
    const editorB = createHarness("b");
    editorA.logicFlow.getGraphRawData.mockClear();
    editorB.logicFlow.getGraphRawData.mockClear();

    editorA.context.settings.selectionEnabled.value = false;
    editorA.context.dialogs.open("property", { owner: "a" });
    editorA.session.setActiveFile("a-2");

    expect(editorA.logicFlow.getGraphRawData).toHaveBeenCalledOnce();
    expect(editorB.logicFlow.getGraphRawData).not.toHaveBeenCalled();
    expect(editorA.store.activeFileId).toBe("a-2");
    expect(editorB.store.activeFileId).toBe("b-1");
    expect(editorA.store.getTab("a-1")?.graphRawData.nodes[0]).toMatchObject({
      id: "a-captured",
      zIndex: 11,
    });
    expect(editorB.store.getTab("b-1")?.graphRawData.nodes[0]?.id).toBe(
      "b-source",
    );
    expect(editorB.context.settings.selectionEnabled.value).toBe(true);
    expect(editorB.context.dialogs.state.property.show).toBe(false);
    expect(editorA.context.locale.value).toBe("ja");
    expect(editorB.context.locale.value).toBe("en");
    expect(editorA.context.resolveAssetUrl("/assets/a.png")).toBe(
      "/a/assets/a.png",
    );
    expect(editorB.context.resolveAssetUrl("/assets/a.png")).toBe(
      "/b/assets/a.png",
    );

    editorA.session.dispose();
    editorB.session.dispose();
    editorA.context.dispose();
    editorB.context.dispose();
  });

  it("keeps autosave timers isolated and restores the host active Pinia", () => {
    const hostPinia = createPinia();
    setActivePinia(hostPinia);
    const editorA = createHarness("a");
    const editorB = createHarness("b");
    editorA.logicFlow.getGraphRawData.mockClear();
    editorB.logicFlow.getGraphRawData.mockClear();

    editorA.session.startAutoSave(100);
    editorB.session.startAutoSave(200);
    vi.advanceTimersByTime(100);

    expect(editorA.logicFlow.getGraphRawData).toHaveBeenCalledOnce();
    expect(editorB.logicFlow.getGraphRawData).not.toHaveBeenCalled();
    expect(getActivePinia()).toBe(hostPinia);

    editorA.session.dispose();
    const aCount = editorA.logicFlow.getGraphRawData.mock.calls.length;
    vi.advanceTimersByTime(200);
    expect(editorA.logicFlow.getGraphRawData).toHaveBeenCalledTimes(aCount);
    expect(editorB.logicFlow.getGraphRawData).toHaveBeenCalled();
    expect(getActivePinia()).toBe(hostPinia);

    editorB.session.dispose();
    editorA.context.dispose();
    editorB.context.dispose();
  });
});
