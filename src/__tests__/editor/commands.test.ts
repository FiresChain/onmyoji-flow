import { describe, expect, it, vi } from "vitest";

import { createArrangeCommands } from "@/editor/commands/arrange";
import {
  collectGroupedNodeIds,
  createGroupingCommands,
} from "@/editor/commands/grouping";
import { createLayerCommands } from "@/editor/commands/layers";
import {
  createNodeStateCommands,
  updateNodeMetaForModel,
} from "@/editor/commands/nodeState";
import {
  createSelectionCommands,
  getSelectedNodeModels,
  getSelectedNodeModelsFiltered,
  shouldSkipEditorShortcut,
} from "@/editor/commands/selection";

interface MockNodeOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  meta?: Record<string, unknown>;
}

const createNode = (id: string, options: MockNodeOptions = {}) => {
  const node = {
    id,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 10,
    height: options.height ?? 10,
    zIndex: options.zIndex ?? 0,
    visible: true,
    draggable: true,
    properties: { meta: { ...options.meta } },
    getProperties: vi.fn(() => node.properties),
    getBounds: vi.fn(() => ({
      minX: node.x - node.width / 2,
      maxX: node.x + node.width / 2,
      minY: node.y - node.height / 2,
      maxY: node.y + node.height / 2,
    })),
    moveTo: vi.fn((x: number, y: number) => {
      node.x = x;
      node.y = y;
    }),
    setZIndex: vi.fn((zIndex: number) => {
      node.zIndex = zIndex;
    }),
    setHittable: vi.fn(),
    setHitable: vi.fn(),
    setIsShowAnchor: vi.fn(),
    setRotatable: vi.fn(),
    setResizable: vi.fn(),
  };
  return node;
};

const createLogicFlow = (nodes: ReturnType<typeof createNode>[]) => {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const edges = [{ id: "edge-1", visible: true }];
  return {
    keyboard: { disabled: false },
    graphModel: {
      nodes,
      selectNodes: [...nodes],
      selectElements: new Map(),
      textEditElement: null,
      moveNodes: vi.fn(),
    },
    getNodeEdges: vi.fn(() => edges),
    getNodeModelById: vi.fn((id: string) => nodeMap.get(id) ?? null),
    getSelectElements: vi.fn(() => ({ nodes: [], edges })),
    setProperties: vi.fn(
      (id: string, properties: ReturnType<typeof createNode>["properties"]) => {
        const node = nodeMap.get(id);
        if (node) node.properties = properties;
      },
    ),
    deleteEdge: vi.fn(),
    deleteNode: vi.fn(),
    setElementZIndex: vi.fn(),
    edges,
  };
};

const translate = (key: string) => key;

describe("editor arrange commands", () => {
  it("aligns bounds and distributes only the interior nodes", () => {
    const first = createNode("first", { x: 5 });
    const middle = createNode("middle", { x: 25 });
    const last = createNode("last", { x: 55 });
    const logicFlow = createLogicFlow([first, middle, last]);
    const showMessage = vi.fn();
    const commands = createArrangeCommands({
      getLogicFlow: () => logicFlow as any,
      getSelectedNodeModelsFiltered: () => [first, middle, last] as any,
      showMessage,
      translate,
    });

    commands.alignSelected("left");
    expect([first.x, middle.x, last.x]).toEqual([5, 5, 5]);

    first.x = 5;
    middle.x = 25;
    last.x = 55;
    first.moveTo.mockClear();
    middle.moveTo.mockClear();
    last.moveTo.mockClear();
    commands.distributeSelected("horizontal");

    expect(first.moveTo).not.toHaveBeenCalled();
    expect(middle.moveTo).toHaveBeenCalledWith(30, middle.y);
    expect(last.moveTo).not.toHaveBeenCalled();
    expect(showMessage).not.toHaveBeenCalled();
  });

  it("keeps selection-count warnings", () => {
    const node = createNode("only");
    const logicFlow = createLogicFlow([node]);
    const showMessage = vi.fn();
    const commands = createArrangeCommands({
      getLogicFlow: () => logicFlow as any,
      getSelectedNodeModelsFiltered: () => [node] as any,
      showMessage,
      translate,
    });

    commands.alignSelected("left");
    commands.distributeSelected("vertical");

    expect(showMessage.mock.calls).toEqual([
      ["warning", "flowEditor.message.alignNeedTwo"],
      ["warning", "flowEditor.message.distributeNeedThree"],
    ]);
  });
});

describe("editor layer commands", () => {
  it("uses selected fallback and preserves layer arithmetic", () => {
    const first = createNode("first", { zIndex: 2 });
    const target = createNode("target", { zIndex: 8 });
    const logicFlow = createLogicFlow([first, target]);
    const commands = createLayerCommands({
      getLogicFlow: () => logicFlow as any,
      getSelectedNode: () => ({ id: "target" }),
    });

    commands.bringToFront();
    commands.sendToBack();
    expect(logicFlow.setElementZIndex).toHaveBeenCalledWith("target", "top");
    expect(target.setZIndex).toHaveBeenLastCalledWith(1);

    commands.bringForward();
    commands.sendBackward();
    expect(target.zIndex).toBe(1);
  });
});

describe("editor selection and grouping commands", () => {
  it("filters node state and moves all unlocked peers in a group", () => {
    const selected = createNode("selected", { meta: { groupId: "group-a" } });
    const peer = createNode("peer", { meta: { groupId: "group-a" } });
    const lockedPeer = createNode("locked", {
      meta: { groupId: "group-a", locked: true },
    });
    const hidden = createNode("hidden", { meta: { visible: false } });
    const logicFlow = createLogicFlow([selected, peer, lockedPeer, hidden]);

    expect(getSelectedNodeModels(logicFlow as any)).toHaveLength(4);
    expect(getSelectedNodeModelsFiltered(logicFlow as any)).toEqual([
      selected,
      peer,
    ]);

    logicFlow.graphModel.selectNodes = [selected];
    const commands = createSelectionCommands({
      getLogicFlow: () => logicFlow as any,
      getSelectedNodeModelsFiltered: (options) =>
        getSelectedNodeModelsFiltered(logicFlow as any, options),
      collectGroupNodeIds: (models) =>
        collectGroupedNodeIds(logicFlow as any, models),
      shouldSkipShortcut: (event) =>
        shouldSkipEditorShortcut(logicFlow as any, event),
      clearSelectedNode: vi.fn(),
      updateSelectedCount: vi.fn(),
      showMessage: vi.fn(),
      translate,
    });

    expect(
      commands.handleArrowMove(
        "left",
        new KeyboardEvent("keydown", { shiftKey: true }),
      ),
    ).toBe(false);
    expect(logicFlow.graphModel.moveNodes).toHaveBeenCalledWith(
      ["selected", "peer"],
      -10,
      0,
    );
  });

  it("deletes visible unlocked selection while retaining locked nodes", () => {
    const active = createNode("active");
    const locked = createNode("locked", { meta: { locked: true } });
    const logicFlow = createLogicFlow([active, locked]);
    const showMessage = vi.fn();
    const clearSelectedNode = vi.fn();
    const updateSelectedCount = vi.fn();
    const commands = createSelectionCommands({
      getLogicFlow: () => logicFlow as any,
      getSelectedNodeModelsFiltered: (options) =>
        getSelectedNodeModelsFiltered(logicFlow as any, options),
      collectGroupNodeIds: (models) => models.map((model) => model.id),
      shouldSkipShortcut: () => false,
      clearSelectedNode,
      updateSelectedCount,
      showMessage,
      translate,
    });

    expect(commands.deleteSelectedElements()).toBe(false);
    expect(logicFlow.deleteEdge).toHaveBeenCalledWith("edge-1");
    expect(logicFlow.deleteNode).toHaveBeenCalledWith("active");
    expect(logicFlow.deleteNode).not.toHaveBeenCalledWith("locked");
    expect(showMessage).toHaveBeenCalledWith(
      "warning",
      "flowEditor.message.lockedNodesSkipped",
    );
    expect(clearSelectedNode).toHaveBeenCalledOnce();
    expect(updateSelectedCount).toHaveBeenCalledOnce();
  });

  it("groups and ungroups selected nodes through injected meta updates", () => {
    const first = createNode("first");
    const second = createNode("second");
    const logicFlow = createLogicFlow([first, second]);
    const scheduleGroupRuleValidation = vi.fn();
    const updateNodeMeta = (
      model: any,
      updater: (meta: Record<string, any>) => Record<string, any>,
    ) => updateNodeMetaForModel(logicFlow as any, model, updater);
    const commands = createGroupingCommands({
      getSelectedNodeModels: () => [first, second] as any,
      getSelectedNodeModelsFiltered: () => [first, second] as any,
      updateNodeMeta,
      shouldSkipShortcut: () => false,
      scheduleGroupRuleValidation,
      showMessage: vi.fn(),
      translate,
      createGroupId: () => "group-fixed",
    });

    expect(commands.groupSelectedNodes()).toBe(false);
    expect(first.properties.meta.groupId).toBe("group-fixed");
    expect(second.properties.meta.groupId).toBe("group-fixed");

    expect(commands.ungroupSelectedNodes()).toBe(false);
    expect(first.properties.meta.groupId).toBeUndefined();
    expect(second.properties.meta.groupId).toBeUndefined();
    expect(scheduleGroupRuleValidation).toHaveBeenCalledTimes(2);
  });
});

describe("editor node-state commands", () => {
  it("restores hidden nodes and synchronizes connected edge visibility", () => {
    const hidden = createNode("hidden", { meta: { visible: false } });
    const logicFlow = createLogicFlow([hidden]);
    const showMessage = vi.fn();
    const updateSelectedCount = vi.fn();
    const commands = createNodeStateCommands({
      getLogicFlow: () => logicFlow as any,
      getSelectedNodeModels: () => [hidden] as any,
      getSelectedNodeModelsFiltered: () => [hidden] as any,
      shouldSkipShortcut: () => false,
      clearSelectedNode: vi.fn(),
      updateSelectedCount,
      showMessage,
      translate: (key, values) => `${key}:${values?.count ?? ""}`,
    });

    commands.showAllNodes();

    expect(hidden.properties.meta.visible).toBe(true);
    expect(hidden.visible).toBe(true);
    expect(logicFlow.edges[0].visible).toBe(true);
    expect(showMessage).toHaveBeenCalledWith(
      "success",
      "flowEditor.message.showAllSuccess:1",
    );
    expect(updateSelectedCount).toHaveBeenCalledOnce();
  });
});
