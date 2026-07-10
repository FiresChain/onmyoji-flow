import { nextTick, ref, shallowRef } from "vue";
import { describe, expect, it, vi } from "vitest";

import type { GraphData } from "@/core/document/types";
import type { EditorPort } from "@/core/logicflow/types";
import { useEmbedDataSync } from "@/shells/embed/composables/useEmbedDataSync";

const createPort = (captured: GraphData): EditorPort => ({
  render: vi.fn(),
  capture: vi.fn(() => captured),
  clear: vi.fn(),
  resize: vi.fn(),
  getViewport: vi.fn(() => ({
    SCALE_X: 1,
    SCALE_Y: 1,
    TRANSLATE_X: 0,
    TRANSLATE_Y: 0,
  })),
  setViewport: vi.fn(),
  zoom: vi.fn(() => true),
  resetZoom: vi.fn(() => true),
  resetTranslate: vi.fn(() => true),
  translateCenter: vi.fn(() => true),
  fitView: vi.fn(),
  dispose: vi.fn(),
});

describe("useEmbedDataSync", () => {
  it("normalizes preview data, removes dynamic groups, and resolves nested assets", () => {
    const source: GraphData = {
      metadata: { retained: true },
      nodes: [
        {
          id: "group",
          type: "dynamic-group",
          x: 0,
          y: 0,
        },
        {
          id: "image",
          type: "imageNode",
          x: 100,
          y: 120,
          properties: {
            image: { src: "/assets/Images/example.png" },
          },
        },
      ],
      edges: [
        {
          id: "group-edge",
          sourceNodeId: "group",
          targetNodeId: "image",
        },
        {
          id: "image-edge",
          sourceNodeId: "image",
          targetNodeId: "image",
          properties: { icon: "/assets/Icons/edge.png" },
        },
      ],
    };
    const port = createPort({ nodes: [], edges: [] });
    const portRef = shallowRef<EditorPort | null>(port);
    const mode = ref<"preview" | "edit">("preview");
    const sync = useEmbedDataSync({
      data: () => source,
      mode: () => mode.value,
      port: portRef,
      resolveAssetUrl: (path) => `/wiki${path}`,
      emitUpdate: vi.fn(),
    });

    expect(sync.syncDataToPort()).toBe(true);
    expect(port.render).toHaveBeenCalledWith({
      metadata: { retained: true },
      nodes: [
        expect.objectContaining({
          id: "image",
          properties: {
            image: { src: "/wiki/assets/Images/example.png" },
          },
        }),
      ],
      edges: [
        expect.objectContaining({
          id: "image-edge",
          properties: { icon: "/wiki/assets/Icons/edge.png" },
        }),
      ],
    });

    sync.dispose();
  });

  it("queues data until a port exists and emits the latest captured graph", async () => {
    const emitted: GraphData[] = [];
    const source = ref<GraphData | undefined>();
    const portRef = shallowRef<EditorPort | null>(null);
    const sync = useEmbedDataSync({
      data: () => source.value,
      mode: () => "edit",
      port: portRef,
      resolveAssetUrl: (path) => path,
      emitUpdate: (data) => emitted.push(data),
    });
    const queued: GraphData = {
      nodes: [{ id: "queued", type: "rect", x: 10, y: 20 }],
      edges: [],
    };
    const captured: GraphData = {
      nodes: [{ id: "captured", type: "rect", x: 20, y: 30 }],
      edges: [],
    };

    sync.setGraphData(queued);
    const port = createPort(captured);
    portRef.value = port;
    await nextTick();

    expect(port.render).toHaveBeenCalledWith(queued);
    expect(port.render).toHaveBeenCalledTimes(1);
    sync.handleGraphDataChange(queued);
    expect(emitted).toEqual([captured]);

    sync.dispose();
    source.value = captured;
    await nextTick();
    expect(port.render).toHaveBeenCalledTimes(1);
  });
});
