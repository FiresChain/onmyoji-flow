import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, getActivePinia, setActivePinia } from "pinia";

import type { RootDocument } from "@/core/document/types";
import type { EditorPort } from "@/core/logicflow/types";
import { useFilesStore } from "@/features/workspace/filesStore";
import { createWorkspaceSession } from "@/features/workspace/useWorkspaceSession";

const createDocument = (prefix: string): RootDocument => ({
  schemaVersion: "1.0.0",
  extension: { owner: prefix },
  fileList: [
    {
      id: `${prefix}-1`,
      label: `${prefix}-1`,
      name: `${prefix}-1`,
      visible: true,
      type: "FLOW",
      fileExtension: "keep",
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
      label: `${prefix}-2`,
      name: `${prefix}-2`,
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
        SCALE_X: 1.5,
        SCALE_Y: 1.5,
        TRANSLATE_X: 12,
        TRANSLATE_Y: 24,
      },
    },
  ],
  activeFile: `${prefix}-1`,
  activeFileId: `${prefix}-1`,
});

const createPersistence = (initial: RootDocument | null = null) => {
  let current = initial;
  const saved: RootDocument[] = [];
  return {
    saved,
    load: () => current,
    save: (document) => {
      current = document;
      saved.push(document);
    },
    remove: vi.fn(() => {
      current = null;
    }),
    flush: vi.fn(),
    dispose: vi.fn(),
  };
};

const createPort = () => ({
  render: vi.fn(),
  capture: vi.fn(() => ({
    nodes: [
      {
        id: "captured-source",
        type: "rect",
        x: 30,
        y: 40,
        properties: {},
      },
    ],
    edges: [],
  })),
  clear: vi.fn(),
  getViewport: vi.fn(() => ({
    SCALE_X: 2,
    SCALE_Y: 2,
    TRANSLATE_X: 8,
    TRANSLATE_Y: 9,
  })),
  setViewport: vi.fn(),
  fitView: vi.fn(),
  dispose: vi.fn(),
});

const createHarness = (initial: RootDocument | null = createDocument("a")) => {
  const pinia = createPinia();
  const previousPinia = getActivePinia();
  const store = useFilesStore(pinia);
  setActivePinia(previousPinia);
  const persistence = createPersistence(initial);
  const port = createPort();
  const session = createWorkspaceSession({
    store,
    persistence,
    getEditorPort: () => port as EditorPort,
    pinia,
    restoreActivePinia: previousPinia,
    now: () => 100,
  });
  return { pinia, store, persistence, port, session };
};

describe("workspace session", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    setActivePinia(undefined);
  });

  it("restores and exports extension fields", () => {
    const { session, store } = createHarness();

    expect(session.initialize()).toEqual({ restored: true });
    const exported = session.exportDocument();

    expect(exported.ok).toBe(true);
    if (!exported.ok) return;
    expect(exported.document).toMatchObject({
      extension: { owner: "a" },
    });
    expect(exported.document.fileList[0]).toMatchObject({
      fileExtension: "keep",
    });
    expect(store.activeFileId).toBe("a-1");
  });

  it("captures the source before changing active id, then renders the target", () => {
    const { session, store, port } = createHarness();
    session.initialize();
    port.render.mockClear();
    port.setViewport.mockClear();

    expect(session.setActiveFile("a-2")).toBe(true);

    expect(store.getTab("a-1")?.graphRawData.nodes[0]?.id).toBe(
      "captured-source",
    );
    expect(store.activeFileId).toBe("a-2");
    expect(port.render).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: [expect.objectContaining({ id: "a-target" })],
      }),
    );
    expect(port.setViewport).toHaveBeenCalledWith(
      expect.objectContaining({
        SCALE_X: 1.5,
        TRANSLATE_X: 12,
        TRANSLATE_Y: 24,
      }),
    );
  });

  it("does not capture the active canvas into a non-active metadata update", () => {
    const { session, store, port } = createHarness();
    session.initialize();
    port.capture.mockClear();

    session.renameFile("a-2", "renamed-target");

    expect(port.capture).not.toHaveBeenCalled();
    expect(store.getTab("a-2")?.name).toBe("renamed-target");
    expect(store.getTab("a-2")?.graphRawData.nodes[0]?.id).toBe("a-target");
  });

  it("recovers to a default document when restore validation fails", () => {
    const invalid = {
      ...createDocument("broken"),
      schemaVersion: "2.0.0",
    };
    const { session, store, persistence } = createHarness(invalid);

    const result = session.initialize();

    expect(result.restored).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(persistence.remove).toHaveBeenCalledOnce();
    expect(store.fileList).toHaveLength(1);
    expect(store.activeFileId).toBe(store.fileList[0].id);
  });

  it("keeps autosave timers instance-local and disposes them", () => {
    const first = createHarness(createDocument("first"));
    const second = createHarness(createDocument("second"));
    first.session.initialize();
    second.session.initialize();
    first.persistence.saved.length = 0;
    second.persistence.saved.length = 0;

    first.session.startAutoSave(100);
    second.session.startAutoSave(200);
    vi.advanceTimersByTime(100);

    expect(first.persistence.saved).toHaveLength(1);
    expect(second.persistence.saved).toHaveLength(0);

    first.session.dispose();
    const countAfterDispose = first.persistence.saved.length;
    vi.advanceTimersByTime(300);

    expect(first.persistence.saved).toHaveLength(countAfterDispose);
    expect(second.persistence.saved.length).toBeGreaterThan(0);
    expect(first.persistence.dispose).toHaveBeenCalledOnce();
    second.session.dispose();
  });

  it("does not restart autosave after the session is disposed", () => {
    const { session, port, persistence } = createHarness();
    session.initialize();
    session.startAutoSave(100);
    session.dispose();
    const captureCountAfterDispose = port.capture.mock.calls.length;

    const stop = session.startAutoSave(10);
    vi.advanceTimersByTime(100);
    stop();

    expect(vi.getTimerCount()).toBe(0);
    expect(port.capture).toHaveBeenCalledTimes(captureCountAfterDispose);
    expect(persistence.dispose).toHaveBeenCalledOnce();
  });

  it("restores the host active Pinia after every state action", () => {
    const hostPinia = createPinia();
    setActivePinia(hostPinia);
    const harness = createHarness();

    harness.session.initialize();
    harness.session.setActiveFile("a-2");
    harness.session.renameFile("a-2", "renamed");

    expect(getActivePinia()).toBe(hostPinia);
  });
});
