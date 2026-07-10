import type LogicFlow from "@logicflow/core";
import {
  Control,
  DynamicGroup,
  Label,
  Menu,
  MiniMap,
  SelectionSelect,
  Snapshot,
} from "@logicflow/extension";
import { describe, expect, it, vi } from "vitest";

import type { GraphData } from "@/core/document/types";
import {
  captureGraphData,
  clearGraphData,
  renderGraphData,
} from "@/core/logicflow/graphIO";
import {
  getFlowPluginsByCapability,
  resolveFlowPlugins,
} from "@/core/logicflow/pluginPresets";
import {
  registerFlowNodes,
  resolveFlowNodeRegistrations,
} from "@/core/logicflow/registerNodes";
import type { FlowNodeRegistration } from "@/core/logicflow/types";
import {
  centerViewport,
  getViewport,
  resetViewportTranslate,
  resetViewportZoom,
  setViewport,
  zoomViewport,
} from "@/core/logicflow/viewport";
import {
  DEFAULT_NODE_REGISTRATIONS,
  getDefaultNodeRegistrations,
} from "@/editor/node-types/registry";

const asLogicFlow = (value: object): LogicFlow => value as LogicFlow;

describe("LogicFlow plugin and node registries", () => {
  it("builds fresh capability presets and makes Label configurable", () => {
    expect(getFlowPluginsByCapability("render-only")).toEqual([
      DynamicGroup,
      Snapshot,
    ]);
    expect(getFlowPluginsByCapability("interactive")).toEqual([
      DynamicGroup,
      Menu,
      Label,
      Snapshot,
      SelectionSelect,
      MiniMap,
      Control,
    ]);
    expect(
      getFlowPluginsByCapability("interactive", { enableLabel: false }),
    ).toEqual([
      DynamicGroup,
      Menu,
      Snapshot,
      SelectionSelect,
      MiniMap,
      Control,
    ]);

    const first = getFlowPluginsByCapability("render-only");
    first.length = 0;
    expect(getFlowPluginsByCapability("render-only")).toHaveLength(2);
  });

  it("uses non-empty custom lists as replacements and empty lists as fallback", () => {
    const customPlugin = { pluginName: "custom" };
    const customPlugins = [customPlugin];
    expect(resolveFlowPlugins("interactive", customPlugins)).toBe(
      customPlugins,
    );
    expect(resolveFlowPlugins("render-only", [])).toEqual([
      DynamicGroup,
      Snapshot,
    ]);

    const fallback: FlowNodeRegistration[] = [
      { type: "fallback", component: {} },
    ];
    const custom: FlowNodeRegistration[] = [{ type: "custom", component: {} }];
    expect(resolveFlowNodeRegistrations(custom, fallback)).toBe(custom);
    expect(resolveFlowNodeRegistrations([], fallback)).toEqual(fallback);
  });

  it("keeps all default edit and preview nodes in one immutable registry", () => {
    expect(DEFAULT_NODE_REGISTRATIONS.map(({ type }) => type)).toEqual([
      "propertySelect",
      "imageNode",
      "assetSelector",
      "textNode",
      "vectorNode",
    ]);
    expect(
      DEFAULT_NODE_REGISTRATIONS.some(({ type }) => type === "dynamic-group"),
    ).toBe(false);
    expect(Object.isFrozen(DEFAULT_NODE_REGISTRATIONS)).toBe(true);
    expect(DEFAULT_NODE_REGISTRATIONS.every(Object.isFrozen)).toBe(true);

    const copy = getDefaultNodeRegistrations();
    copy[0].type = "changed";
    expect(DEFAULT_NODE_REGISTRATIONS[0].type).toBe("propertySelect");
  });

  it("only applies registrations supplied by its caller", () => {
    const instance = asLogicFlow({});
    const registrar = vi.fn();
    const registrations: FlowNodeRegistration[] = [
      { type: "first", component: {} },
      { type: "second", component: {} },
    ];

    registerFlowNodes(instance, registrations, registrar);

    expect(registrar.mock.calls).toEqual([
      [registrations[0], instance],
      [registrations[1], instance],
    ]);
  });
});

describe("LogicFlow graph I/O", () => {
  it("renders then restores zero and negative zIndex values", () => {
    const zeroSetZIndex = vi.fn();
    const negativeSetZIndex = vi.fn();
    const render = vi.fn();
    const instance = asLogicFlow({
      render,
      getNodeModelById: vi.fn((id: string) => {
        if (id === "zero") return { setZIndex: zeroSetZIndex };
        if (id === "negative") return { setZIndex: negativeSetZIndex };
        return undefined;
      }),
    });
    const graphData: GraphData = {
      nodes: [
        {
          id: "zero",
          type: "rect",
          x: 10,
          y: 20,
          zIndex: 0,
          properties: {},
        },
        {
          id: "negative",
          type: "rect",
          x: 20,
          y: 30,
          zIndex: -4,
          properties: {},
        },
      ],
      edges: [],
    };

    renderGraphData(instance, graphData);

    expect(render).toHaveBeenCalledWith(graphData);
    expect(zeroSetZIndex).toHaveBeenCalledWith(0);
    expect(negativeSetZIndex).toHaveBeenCalledWith(-4);
  });

  it("captures model layers without losing zero, negatives, or top-level data", () => {
    const instance = asLogicFlow({
      getGraphRawData: vi.fn(() => ({
        nodes: [
          { id: "zero", type: "rect", x: 0, y: 0, zIndex: 9 },
          { id: "negative", type: "rect", x: 0, y: 0, zIndex: 7 },
          { id: "fallback", type: "rect", x: 0, y: 0, zIndex: -2 },
        ],
        edges: [],
        metadata: { retained: true },
      })),
      getNodeModelById: vi.fn((id: string) => {
        if (id === "zero") return { zIndex: 0 };
        if (id === "negative") return { zIndex: -8 };
        return undefined;
      }),
    });

    const captured = captureGraphData(instance);

    expect(captured.nodes.map(({ zIndex }) => zIndex)).toEqual([0, -8, -2]);
    expect(captured.metadata).toEqual({ retained: true });
  });

  it("clears through the LogicFlow data API", () => {
    const clearData = vi.fn();
    clearGraphData(asLogicFlow({ clearData }));
    expect(clearData).toHaveBeenCalledOnce();
  });
});

describe("LogicFlow viewport adapter", () => {
  it("resets zoom and translation before restoring them independently", () => {
    const calls: string[] = [];
    const resetZoom = vi.fn(() => calls.push("resetZoom"));
    const resetTranslate = vi.fn(() => calls.push("resetTranslate"));
    const zoom = vi.fn(() => calls.push("zoom"));
    const translate = vi.fn(() => calls.push("translate"));
    const instance = asLogicFlow({
      resetZoom,
      resetTranslate,
      zoom,
      translate,
    });

    setViewport(instance, {
      SCALE_X: 1.5,
      SCALE_Y: 1.5,
      TRANSLATE_X: 40,
      TRANSLATE_Y: -20,
    });

    expect(calls).toEqual(["resetZoom", "resetTranslate", "zoom", "translate"]);
    expect(zoom).toHaveBeenCalledWith(1.5);
    expect(translate).toHaveBeenCalledWith(40, -20);
  });

  it("normalizes missing or invalid captured transform fields", () => {
    const instance = asLogicFlow({
      getTransform: vi.fn(() => ({
        SCALE_X: 2,
        SCALE_Y: Number.NaN,
        TRANSLATE_X: -12,
      })),
    });

    expect(getViewport(instance)).toEqual({
      SCALE_X: 2,
      SCALE_Y: 1,
      TRANSLATE_X: -12,
      TRANSLATE_Y: 0,
    });
  });

  it("provides boolean wrappers for the public viewport commands", () => {
    const zoom = vi.fn();
    const resetZoom = vi.fn();
    const resetTranslate = vi.fn();
    const translateCenter = vi.fn();
    const instance = asLogicFlow({
      zoom,
      resetZoom,
      resetTranslate,
      translateCenter,
    });

    expect(zoomViewport(instance, 2, [10, 20])).toBe(true);
    expect(resetViewportZoom(instance)).toBe(true);
    expect(resetViewportTranslate(instance)).toBe(true);
    expect(centerViewport(instance)).toBe(true);
    expect(zoom).toHaveBeenCalledWith(2, [10, 20]);
    expect(resetZoom).toHaveBeenCalledOnce();
    expect(resetTranslate).toHaveBeenCalledOnce();
    expect(translateCenter).toHaveBeenCalledOnce();

    const unavailable = asLogicFlow({});
    expect(zoomViewport(unavailable)).toBe(false);
    expect(resetViewportZoom(unavailable)).toBe(false);
    expect(resetViewportTranslate(unavailable)).toBe(false);
    expect(centerViewport(unavailable)).toBe(false);
  });
});
