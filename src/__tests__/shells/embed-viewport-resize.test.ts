import { nextTick, ref, shallowRef } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { GraphData } from "@/core/document/types";
import type { EditorPort } from "@/core/logicflow/types";
import { useEmbedResize } from "@/shells/embed/composables/useEmbedResize";
import { useEmbedViewport } from "@/shells/embed/composables/useEmbedViewport";

const createPort = (graphData: GraphData): EditorPort => ({
  render: vi.fn(),
  capture: vi.fn(() => graphData),
  clear: vi.fn(),
  resize: vi.fn(),
  getViewport: vi.fn(() => ({
    SCALE_X: 1.5,
    SCALE_Y: 1.5,
    TRANSLATE_X: 20,
    TRANSLATE_Y: -10,
  })),
  setViewport: vi.fn(),
  zoom: vi.fn(() => true),
  resetZoom: vi.fn(() => true),
  resetTranslate: vi.fn(() => true),
  translateCenter: vi.fn(() => true),
  fitView: vi.fn(),
  dispose: vi.fn(),
});

const defineSize = (
  element: HTMLElement,
  size: { width: number; height: number },
) => {
  Object.defineProperties(element, {
    clientWidth: { configurable: true, get: () => size.width },
    clientHeight: { configurable: true, get: () => size.height },
  });
};

describe("useEmbedViewport", () => {
  it("guards empty or hidden canvases and forwards every viewport command", () => {
    const root = document.createElement("div");
    const size = { width: 800, height: 600 };
    defineSize(root, size);
    const port = createPort({
      nodes: [{ id: "node", type: "rect", x: 10, y: 20 }],
      edges: [],
    });
    const portRef = shallowRef<EditorPort | null>(port);
    const viewport = useEmbedViewport({ root: ref(root), port: portRef });

    expect(viewport.fitView()).toBe(true);
    expect(viewport.fitView(30, 40)).toBe(true);
    expect(viewport.zoom(2, [10, 20])).toBe(true);
    expect(viewport.resetZoom()).toBe(true);
    expect(viewport.resetTranslate()).toBe(true);
    expect(viewport.translateCenter()).toBe(true);
    expect(viewport.getTransform()).toEqual({
      SCALE_X: 1.5,
      SCALE_Y: 1.5,
      TRANSLATE_X: 20,
      TRANSLATE_Y: -10,
    });
    expect((port.fitView as ReturnType<typeof vi.fn>).mock.calls).toEqual([
      [],
      [30, 40],
    ]);

    size.width = 0;
    expect(viewport.fitView()).toBe(false);
    expect(viewport.translateCenter()).toBe(false);
    portRef.value = createPort({ nodes: [], edges: [] });
    size.width = 800;
    expect(viewport.fitView()).toBe(false);

    portRef.value = null;
    expect(viewport.zoom()).toBe(false);
    expect(viewport.getTransform()).toBeNull();
  });
});

describe("useEmbedResize", () => {
  const originalResizeObserver = globalThis.ResizeObserver;

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it("observes the instance root, resizes through the port, and disposes", async () => {
    let observerCallback: ResizeObserverCallback | null = null;
    const disconnect = vi.fn();
    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        observerCallback = callback;
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = disconnect;
    } as unknown as typeof ResizeObserver;

    const root = document.createElement("div");
    const rootSize = { width: 800, height: 500 };
    defineSize(root, rootSize);
    const toolbar = document.createElement("div");
    Object.defineProperty(toolbar, "offsetHeight", {
      configurable: true,
      value: 48,
    });
    const port = createPort({ nodes: [], edges: [] });
    const resize = useEmbedResize({
      root: ref(root),
      toolbarHost: ref(toolbar),
      port: shallowRef(port),
      mode: () => "edit",
      showToolbar: () => true,
      width: () => "100%",
      height: () => "500px",
      showComponentPanel: () => true,
    });

    const dispose = resize.mountResizeObserver();
    await nextTick();
    expect(resize.editorContentHeight.value).toBe("452px");
    expect(port.resize).toHaveBeenCalledWith();

    rootSize.height = 600;
    observerCallback?.([], {} as ResizeObserver);
    await nextTick();
    expect(resize.editorContentHeight.value).toBe("552px");

    const resizeCallCount = (port.resize as ReturnType<typeof vi.fn>).mock.calls
      .length;
    dispose();
    expect(disconnect).toHaveBeenCalledOnce();
    observerCallback?.([], {} as ResizeObserver);
    await nextTick();
    expect(port.resize).toHaveBeenCalledTimes(resizeCallCount);
  });
});
