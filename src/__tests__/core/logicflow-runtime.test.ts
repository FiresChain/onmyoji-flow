import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GraphData } from "@/core/document/types";
import type { FlowNodeRegistration } from "@/core/logicflow/types";

const mocks = vi.hoisted(() => {
  const instances: MockLogicFlow[] = [];
  const register = vi.fn();

  class MockLogicFlow {
    options: Record<string, unknown>;
    destroy = vi.fn();
    render = vi.fn();
    clearData = vi.fn();
    fitView = vi.fn();
    resetZoom = vi.fn();
    resetTranslate = vi.fn();
    zoom = vi.fn();
    translate = vi.fn();
    getGraphRawData = vi.fn(() => ({ nodes: [], edges: [] }));
    getTransform = vi.fn(() => ({
      SCALE_X: 1,
      SCALE_Y: 1,
      TRANSLATE_X: 0,
      TRANSLATE_Y: 0,
    }));
    getNodeModelById = vi.fn(() => undefined);

    constructor(options: Record<string, unknown>) {
      this.options = options;
      instances.push(this);
    }
  }

  return {
    instances,
    register,
    MockLogicFlow,
    DynamicGroup: { pluginName: "dynamic-group" },
    Label: { pluginName: "label" },
    Menu: { pluginName: "menu" },
    Snapshot: { pluginName: "snapshot" },
    SelectionSelect: { pluginName: "selection-select" },
    MiniMap: { pluginName: "mini-map" },
    Control: { pluginName: "control" },
  };
});

vi.mock("@logicflow/core", () => ({
  default: mocks.MockLogicFlow,
}));

vi.mock("@logicflow/vue-node-registry", () => ({
  register: mocks.register,
}));

vi.mock("@logicflow/extension", () => ({
  DynamicGroup: mocks.DynamicGroup,
  Label: mocks.Label,
  Menu: mocks.Menu,
  Snapshot: mocks.Snapshot,
  SelectionSelect: mocks.SelectionSelect,
  MiniMap: mocks.MiniMap,
  Control: mocks.Control,
}));

import { createLogicFlowRuntime } from "@/core/logicflow/createRuntime";

describe("createLogicFlowRuntime", () => {
  beforeEach(() => {
    mocks.instances.length = 0;
    mocks.register.mockReset();
  });

  it("mounts render-only defaults, falls back on empty custom nodes, and disposes once", () => {
    const fallbackRegistration: FlowNodeRegistration = {
      type: "fallback",
      component: {},
    };
    const customPlugin = { pluginName: "custom" };
    const initialData: GraphData = {
      nodes: [
        {
          id: "node-1",
          type: "rect",
          x: 10,
          y: 20,
          zIndex: 0,
          properties: {},
        },
      ],
      edges: [],
    };

    const runtime = createLogicFlowRuntime({
      container: document.createElement("div"),
      capability: "render-only",
      plugins: [customPlugin],
      nodeRegistrations: [],
      defaultNodeRegistrations: [fallbackRegistration],
      initialData,
    });
    const instance = mocks.instances[0];

    expect(instance.options).toMatchObject({
      grid: false,
      keyboard: { enabled: false },
      isSilentMode: true,
      stopScrollGraph: true,
      stopZoomGraph: true,
      stopMoveGraph: true,
      adjustNodePosition: false,
      plugins: [customPlugin],
    });
    expect(mocks.register).toHaveBeenCalledWith(
      expect.objectContaining({ type: "fallback" }),
      instance,
    );
    expect(instance.render).toHaveBeenCalledWith(initialData);

    runtime.dispose();
    runtime.port.dispose();
    runtime.dispose();
    expect(instance.destroy).toHaveBeenCalledOnce();
  });

  it("uses non-empty custom node registrations as a complete replacement", () => {
    const fallback: FlowNodeRegistration = {
      type: "fallback",
      component: {},
    };
    const custom: FlowNodeRegistration = {
      type: "custom",
      component: {},
    };

    const runtime = createLogicFlowRuntime({
      container: document.createElement("div"),
      nodeRegistrations: [custom],
      defaultNodeRegistrations: [fallback],
    });

    expect(mocks.register).toHaveBeenCalledTimes(1);
    expect(mocks.register).toHaveBeenCalledWith(
      expect.objectContaining({ type: "custom" }),
      runtime.instance,
    );
    runtime.dispose();
  });

  it("destroys a partially mounted instance when registration fails", () => {
    mocks.register.mockImplementationOnce(() => {
      throw new Error("registration failed");
    });

    expect(() =>
      createLogicFlowRuntime({
        container: document.createElement("div"),
        defaultNodeRegistrations: [{ type: "broken", component: {} }],
      }),
    ).toThrow("registration failed");

    expect(mocks.instances[0].destroy).toHaveBeenCalledOnce();
  });
});
