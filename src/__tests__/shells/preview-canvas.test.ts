import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EditorPort, LogicFlowRuntime } from "@/core/logicflow/types";
import { createEditorContext } from "@/editor/context/EditorContext";
import { EDITOR_CONTEXT_KEY } from "@/editor/context/useEditorContext";
import PreviewCanvas from "@/shells/embed/PreviewCanvas.vue";

const previewMocks = vi.hoisted(() => ({
  createRuntime: vi.fn(),
  defaults: [{ type: "default-node", component: {} }],
  runtimes: [] as LogicFlowRuntime[],
}));

vi.mock("@/core/logicflow/createRuntime", () => ({
  createLogicFlowRuntime: (options: unknown) =>
    previewMocks.createRuntime(options),
}));

vi.mock("@/editor/node-types/registry", () => ({
  getDefaultNodeRegistrations: () => previewMocks.defaults,
}));

const createRuntime = (): LogicFlowRuntime => {
  const dispose = vi.fn();
  const port = {
    render: vi.fn(),
    capture: vi.fn(() => ({ nodes: [], edges: [] })),
    clear: vi.fn(),
    resize: vi.fn(),
    getViewport: vi.fn(),
    setViewport: vi.fn(),
    zoom: vi.fn(),
    resetZoom: vi.fn(),
    resetTranslate: vi.fn(),
    translateCenter: vi.fn(),
    fitView: vi.fn(),
    dispose,
  } as unknown as EditorPort;
  return {
    instance: { graphModel: {} } as LogicFlowRuntime["instance"],
    port,
    dispose,
  };
};

describe("PreviewCanvas", () => {
  beforeEach(() => {
    previewMocks.runtimes.length = 0;
    previewMocks.createRuntime.mockReset();
    previewMocks.createRuntime.mockImplementation(() => {
      const runtime = createRuntime();
      previewMocks.runtimes.push(runtime);
      return runtime;
    });
  });

  it("owns preview runtime replacement semantics and disposes every runtime", async () => {
    const context = createEditorContext();
    const plugins = [{ name: "custom-plugin" }];
    const registrations = [{ type: "custom-node", component: {} }];
    const wrapper = mount(PreviewCanvas, {
      props: {
        capability: "render-only",
        plugins,
        nodeRegistrations: registrations,
      },
      global: {
        provide: {
          [EDITOR_CONTEXT_KEY as symbol]: context,
        },
      },
    });

    expect(previewMocks.createRuntime).toHaveBeenCalledWith(
      expect.objectContaining({
        capability: "render-only",
        plugins,
        nodeRegistrations: registrations,
        defaultNodeRegistrations: previewMocks.defaults,
        logicFlowOptions: expect.objectContaining({
          grid: false,
          keyboard: { enabled: false },
          isSilentMode: true,
          stopScrollGraph: true,
          stopZoomGraph: true,
          stopMoveGraph: true,
          adjustNodePosition: false,
        }),
      }),
    );
    expect(context.port.value).toBe(previewMocks.runtimes[0].port);
    expect(wrapper.emitted("ready")).toEqual([[]]);

    await wrapper.setProps({
      capability: "interactive",
      plugins: [],
      nodeRegistrations: [],
    });

    expect(previewMocks.runtimes[0].dispose).toHaveBeenCalledOnce();
    expect(previewMocks.createRuntime).toHaveBeenLastCalledWith(
      expect.objectContaining({
        capability: "interactive",
        plugins: [],
        nodeRegistrations: [],
        logicFlowOptions: expect.objectContaining({
          keyboard: { enabled: true },
          isSilentMode: false,
          adjustNodePosition: true,
        }),
      }),
    );
    expect(context.port.value).toBe(previewMocks.runtimes[1].port);

    wrapper.unmount();
    expect(previewMocks.runtimes[1].dispose).toHaveBeenCalledOnce();
    expect(context.port.value).toBeNull();
    context.dispose();
  });
});
