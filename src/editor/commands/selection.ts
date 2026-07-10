import type LogicFlow from "@logicflow/core";
import type { BaseNodeModel } from "@logicflow/core";

import { ensureNodeMeta, type SelectedNodeFilterOptions } from "./nodeState";

export type MoveDirection = "left" | "right" | "up" | "down";

type MessageType = "success" | "warning" | "info" | "error";
type Translate = (key: string) => string;

export interface SelectionCommandsOptions {
  getLogicFlow: () => LogicFlow | null;
  getSelectedNodeModelsFiltered: (
    options?: SelectedNodeFilterOptions,
  ) => BaseNodeModel[];
  collectGroupNodeIds: (models: BaseNodeModel[]) => string[];
  shouldSkipShortcut: (event?: KeyboardEvent) => boolean;
  clearSelectedNode: () => void;
  updateSelectedCount: () => void;
  showMessage: (type: MessageType, message: string) => void;
  translate: Translate;
  moveStep?: number;
  largeMoveStep?: number;
}

export function getSelectedNodeModels(
  logicFlow: LogicFlow | null,
): BaseNodeModel[] {
  return logicFlow?.graphModel ? [...logicFlow.graphModel.selectNodes] : [];
}

export function getSelectedNodeModelsFiltered(
  logicFlow: LogicFlow | null,
  options: SelectedNodeFilterOptions = {},
): BaseNodeModel[] {
  const graphModel = logicFlow?.graphModel;
  if (!graphModel) return [];
  const includeHidden = options.includeHidden ?? false;
  const includeLocked = options.includeLocked ?? false;
  return graphModel.selectNodes.filter((model: BaseNodeModel) => {
    const meta = ensureNodeMeta(
      (model.getProperties?.() as any)?.meta ??
        (model as any)?.properties?.meta,
    );
    if (!includeHidden && meta.visible === false) return false;
    if (!includeLocked && meta.locked) return false;
    return true;
  });
}

export function isInputLikeTarget(event?: KeyboardEvent): boolean {
  const target = event?.target as HTMLElement | null;
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  return (
    ["input", "textarea", "select", "option"].includes(tag) ||
    target.isContentEditable
  );
}

export function shouldSkipEditorShortcut(
  logicFlow: LogicFlow | null,
  event?: KeyboardEvent,
): boolean {
  if (!logicFlow) return true;
  const instance = logicFlow as any;
  return Boolean(
    instance.keyboard?.disabled ||
    instance.graphModel?.textEditElement ||
    isInputLikeTarget(event),
  );
}

export function createSelectionCommands(options: SelectionCommandsOptions) {
  const {
    getLogicFlow,
    getSelectedNodeModelsFiltered: getFilteredNodes,
    collectGroupNodeIds,
    shouldSkipShortcut,
    clearSelectedNode,
    updateSelectedCount,
    showMessage,
    translate,
    moveStep = 2,
    largeMoveStep = 10,
  } = options;

  const moveSelectedNodes = (deltaX: number, deltaY: number) => {
    const graphModel = getLogicFlow()?.graphModel;
    if (!graphModel) return;
    const targets = collectGroupNodeIds(getFilteredNodes());
    if (!targets.length) return;
    graphModel.moveNodes(targets, deltaX, deltaY);
  };

  const deleteSelectedElements = (event?: KeyboardEvent) => {
    if (shouldSkipShortcut(event)) return true;
    const logicFlow = getLogicFlow();
    if (!logicFlow) return true;

    const { edges } = logicFlow.getSelectElements(true);
    const nodes = getFilteredNodes({
      includeHidden: false,
      includeLocked: true,
    });
    const lockedNodes = nodes.filter(
      (node) => ensureNodeMeta((node as any).properties?.meta).locked,
    );
    edges.forEach((edge) => edge.id && logicFlow.deleteEdge(edge.id));
    nodes
      .filter((node) => {
        const meta = ensureNodeMeta((node as any).properties?.meta);
        return !meta.locked && meta.visible !== false;
      })
      .forEach((node) => node.id && logicFlow.deleteNode(node.id));

    if (lockedNodes.length) {
      showMessage(
        "warning",
        translate("flowEditor.message.lockedNodesSkipped"),
      );
    }
    updateSelectedCount();
    clearSelectedNode();
    return false;
  };

  const deleteNode = (nodeId: string) => {
    const logicFlow = getLogicFlow();
    if (!logicFlow) return;
    const node = logicFlow.getNodeModelById(nodeId);
    if (!node) return;
    const meta = ensureNodeMeta((node as any).properties?.meta);
    if (meta.locked) {
      showMessage(
        "warning",
        translate("flowEditor.message.nodeLockedCannotDelete"),
      );
      return;
    }
    logicFlow.deleteNode(nodeId);
  };

  const handleArrowMove = (direction: MoveDirection, event?: KeyboardEvent) => {
    if (shouldSkipShortcut(event)) return true;
    const step =
      (event?.shiftKey ? largeMoveStep : moveStep) *
      (direction === "left" || direction === "up" ? -1 : 1);
    if (direction === "left" || direction === "right") {
      moveSelectedNodes(step, 0);
    } else {
      moveSelectedNodes(0, step);
    }
    return false;
  };

  return {
    deleteSelectedElements,
    deleteNode,
    handleArrowMove,
  };
}
