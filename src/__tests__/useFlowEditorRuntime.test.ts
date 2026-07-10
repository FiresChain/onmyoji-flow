import { EventType } from "@logicflow/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const mocks = vi.hoisted(() => ({
  createLogicFlowRuntime: vi.fn(),
}));

vi.mock("@/core/logicflow/createRuntime", () => ({
  createLogicFlowRuntime: mocks.createLogicFlowRuntime,
}));

vi.mock("@/editor/node-types/registry", () => ({
  getDefaultNodeRegistrations: vi.fn(() => []),
}));

vi.mock("@/editor/commands/assetTheme", () => ({
  clearAssetNodeReferenceByLabelOwner: vi.fn(),
  getAssetLabelOwnerFromNode: vi.fn(),
  isAssetNameLabelTextNode: vi.fn(() => false),
  syncAssetNameLabelForNode: vi.fn(),
}));

import { useFlowEditorRuntime } from "@/editor/runtime/mountEditorRuntime";

type EventHandler = (...args: any[]) => void;

function createRuntimeFixture() {
  const eventHandlers = new Map<string, Set<EventHandler>>();
  const on = vi.fn((event: string, handler: EventHandler) => {
    const handlers = eventHandlers.get(event) ?? new Set<EventHandler>();
    handlers.add(handler);
    eventHandlers.set(event, handlers);
  });
  const off = vi.fn((event: string, handler?: EventHandler) => {
    if (handler) {
      eventHandlers.get(event)?.delete(handler);
      return;
    }
    eventHandlers.delete(event);
  });
  const keyboard = {
    on: vi.fn(),
    off: vi.fn(),
  };
  const instance = {
    on,
    off,
    keyboard,
    extension: {
      menu: {
        addMenuConfig: vi.fn(),
        setMenuByType: vi.fn(),
      },
    },
    graphModel: {
      nodes: [],
      moveNodes: vi.fn(),
    },
    getNodeModelById: vi.fn(),
    deleteEdge: vi.fn(),
    deleteNode: vi.fn(),
    addNode: vi.fn(),
  };
  const runtime = {
    instance,
    port: {},
    dispose: vi.fn(),
  };
  mocks.createLogicFlowRuntime.mockReturnValue(runtime);

  let activeRuntime: unknown = null;
  const editorContext = {
    setRuntime: vi.fn((nextRuntime: unknown) => {
      activeRuntime = nextRuntime;
    }),
    clearRuntime: vi.fn((expectedRuntime: unknown) => {
      if (activeRuntime !== expectedRuntime) return false;
      activeRuntime = null;
      runtime.dispose();
      return true;
    }),
    replaceRuntime(nextRuntime: unknown) {
      activeRuntime = nextRuntime;
    },
  };

  const callbacks = {
    bringToFront: vi.fn(),
    bringForward: vi.fn(),
    sendBackward: vi.fn(),
    sendToBack: vi.fn(),
    deleteNode: vi.fn(),
    deleteSelectedElements: vi.fn(),
    groupSelectedNodes: vi.fn(),
    ungroupSelectedNodes: vi.fn(),
    toggleLockSelected: vi.fn(),
    toggleVisibilitySelected: vi.fn(),
    handleArrowMove: vi.fn(),
    normalizeNodeModel: vi.fn(),
    scheduleGroupRuleValidation: vi.fn(),
    emitGraphDataChange: vi.fn(),
    sanitizeGraphLabels: vi.fn(),
    updateSelectedCount: vi.fn(),
    normalizeAllNodes: vi.fn(),
    applyKeyboardEnabled: vi.fn(),
    applySelectionSelect: vi.fn(),
  };
  const lf = ref<any>(null);
  const selectedNode = ref<any>(null);
  const options = {
    lf,
    containerRef: ref<HTMLElement | null>(document.createElement("div")),
    editorContext: editorContext as any,
    enableLabel: false,
    configSnapGridEnabled: true,
    configSnaplineEnabled: true,
    configKeyboardEnabled: true,
    snaplineEnabled: ref(true),
    snapGridEnabled: ref(true),
    selectionEnabled: ref(true),
    selectedNode,
    ...callbacks,
  };

  return {
    callbacks,
    eventHandlers,
    instance,
    keyboard,
    lf,
    editorContext,
    off,
    on,
    options,
    runtime,
    selectedNode,
  };
}

describe("useFlowEditorRuntime lifecycle", () => {
  beforeEach(() => {
    mocks.createLogicFlowRuntime.mockReset();
  });

  it("unbinds every LogicFlow event with the original callback", () => {
    const fixture = createRuntimeFixture();
    const { mountFlowEditorRuntime } = useFlowEditorRuntime();
    const dispose = mountFlowEditorRuntime(fixture.options);
    const eventBindings = fixture.on.mock.calls.map(
      ([event, handler]) => [event, handler] as const,
    );
    const shortcutKeys = fixture.keyboard.on.mock.calls.map(([keys]) => keys);

    expect(eventBindings).toHaveLength(20);
    expect(shortcutKeys).toHaveLength(9);

    const nodeClickBinding = eventBindings.find(
      ([event]) => event === EventType.NODE_CLICK,
    );
    nodeClickBinding?.[1]({ data: { id: "selected-node" } });
    expect(fixture.selectedNode.value).toEqual({ id: "selected-node" });

    dispose();

    eventBindings.forEach(([event, handler]) => {
      expect(
        fixture.off.mock.calls.some(
          ([offEvent, offHandler]) =>
            offEvent === event && offHandler === handler,
        ),
      ).toBe(true);
      expect(fixture.eventHandlers.get(event)?.has(handler)).toBe(false);
    });
    shortcutKeys.forEach((keys) => {
      expect(fixture.keyboard.off).toHaveBeenCalledWith(keys);
    });
    expect(fixture.editorContext.clearRuntime).toHaveBeenCalledWith(
      fixture.runtime,
    );
    expect(fixture.runtime.dispose).toHaveBeenCalledOnce();
    expect(fixture.lf.value).toBeNull();

    const eventOffCount = fixture.off.mock.calls.length;
    const shortcutOffCount = fixture.keyboard.off.mock.calls.length;
    dispose();
    expect(fixture.off).toHaveBeenCalledTimes(eventOffCount);
    expect(fixture.keyboard.off).toHaveBeenCalledTimes(shortcutOffCount);
    expect(fixture.editorContext.clearRuntime).toHaveBeenCalledOnce();
  });

  it("does not clear a replacement instance from a stale disposer", () => {
    const fixture = createRuntimeFixture();
    const { mountFlowEditorRuntime } = useFlowEditorRuntime();
    const dispose = mountFlowEditorRuntime(fixture.options);
    const replacementInstance = { id: "replacement" };
    const replacementRuntime = { instance: replacementInstance };

    fixture.editorContext.replaceRuntime(replacementRuntime);
    fixture.lf.value = replacementInstance;
    dispose();

    expect(fixture.editorContext.clearRuntime).toHaveBeenCalledWith(
      fixture.runtime,
    );
    expect(fixture.runtime.dispose).not.toHaveBeenCalled();
    expect(fixture.lf.value).toStrictEqual(replacementInstance);
  });

  it("rolls back bindings, runtime ownership, settings, and refs when mounting fails", () => {
    const fixture = createRuntimeFixture();
    const originalOn = fixture.on.getMockImplementation();
    let bindCount = 0;
    fixture.on.mockImplementation((event, handler) => {
      bindCount += 1;
      if (bindCount === 3) throw new Error("event bind failed");
      originalOn?.(event, handler);
    });
    fixture.options.snapGridEnabled.value = false;
    fixture.options.snaplineEnabled.value = false;
    const { mountFlowEditorRuntime } = useFlowEditorRuntime();

    expect(() => mountFlowEditorRuntime(fixture.options)).toThrow(
      "event bind failed",
    );

    expect(fixture.off).toHaveBeenCalledTimes(2);
    expect(fixture.keyboard.off).toHaveBeenCalledTimes(10);
    expect(fixture.editorContext.clearRuntime).toHaveBeenCalledWith(
      fixture.runtime,
    );
    expect(fixture.runtime.dispose).toHaveBeenCalledOnce();
    expect(fixture.options.snapGridEnabled.value).toBe(false);
    expect(fixture.options.snaplineEnabled.value).toBe(false);
    expect(fixture.lf.value).toBeNull();
  });

  it("continues cleanup when an event unbind throws", () => {
    const fixture = createRuntimeFixture();
    const { mountFlowEditorRuntime } = useFlowEditorRuntime();
    const dispose = mountFlowEditorRuntime(fixture.options);
    fixture.off.mockImplementationOnce(() => {
      throw new Error("off failed");
    });

    expect(() => dispose()).toThrow("off failed");
    expect(fixture.editorContext.clearRuntime).toHaveBeenCalledWith(
      fixture.runtime,
    );
    expect(fixture.runtime.dispose).toHaveBeenCalledOnce();
    expect(fixture.lf.value).toBeNull();
  });
});
