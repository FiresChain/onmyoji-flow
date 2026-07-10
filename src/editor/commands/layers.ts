import type LogicFlow from "@logicflow/core";

interface LayerNodeModel {
  zIndex: number;
  setZIndex: (zIndex: number) => void;
}

interface LayerNodeInfo {
  id: string;
  zIndex: number;
}

export interface LayerCommandsOptions {
  getLogicFlow: () => LogicFlow | null;
  getSelectedNode: () => { id?: string } | null;
}

export function createLayerCommands(options: LayerCommandsOptions) {
  const { getLogicFlow, getSelectedNode } = options;
  const resolveTargetId = (nodeId?: string) => nodeId || getSelectedNode()?.id;

  const bringToFront = (nodeId?: string) => {
    const logicFlow = getLogicFlow();
    const targetId = resolveTargetId(nodeId);
    if (!logicFlow || !targetId) return;
    logicFlow.setElementZIndex(targetId, "top");
  };

  const sendToBack = (nodeId?: string) => {
    const logicFlow = getLogicFlow();
    const targetId = resolveTargetId(nodeId);
    if (!logicFlow || !targetId) return;

    const currentNode = logicFlow.getNodeModelById(
      targetId,
    ) as LayerNodeModel | null;
    if (!currentNode) return;

    const allNodes = logicFlow.graphModel.nodes as LayerNodeInfo[];
    const allZIndexes = allNodes
      .map((node) => node.zIndex)
      .filter((zIndex) => zIndex !== undefined);
    const minZIndex = allZIndexes.length > 0 ? Math.min(...allZIndexes) : 1;
    currentNode.setZIndex(minZIndex - 1);
  };

  const bringForward = (nodeId?: string) => {
    const logicFlow = getLogicFlow();
    const targetId = resolveTargetId(nodeId);
    if (!logicFlow || !targetId) return;

    const currentNode = logicFlow.getNodeModelById(
      targetId,
    ) as LayerNodeModel | null;
    if (!currentNode) return;
    currentNode.setZIndex(currentNode.zIndex + 1);
  };

  const sendBackward = (nodeId?: string) => {
    const logicFlow = getLogicFlow();
    const targetId = resolveTargetId(nodeId);
    if (!logicFlow || !targetId) return;

    const currentNode = logicFlow.getNodeModelById(
      targetId,
    ) as LayerNodeModel | null;
    if (!currentNode) return;
    currentNode.setZIndex(currentNode.zIndex - 1);
  };

  return {
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
  };
}
