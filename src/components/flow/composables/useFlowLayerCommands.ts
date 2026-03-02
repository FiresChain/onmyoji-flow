import type LogicFlow from '@logicflow/core';
import type { Ref } from 'vue';

interface LayerNodeModel {
  zIndex: number;
  setZIndex: (zIndex: number) => void;
}

interface LayerNodeInfo {
  id: string;
  zIndex: number;
}

interface FlowLayerCommandOptions {
  lf: Ref<LogicFlow | null>;
  selectedNode: Ref<{ id?: string } | null>;
}

export function useFlowLayerCommands(options: FlowLayerCommandOptions) {
  const { lf, selectedNode } = options;

  function bringToFront(nodeId?: string) {
    const lfInstance = lf.value;
    if (!lfInstance) return;
    const targetId = nodeId || selectedNode.value?.id;
    if (!targetId) return;

    const allNodes = lfInstance.graphModel.nodes as LayerNodeInfo[];
    console.log('[置于顶层] 目标节点ID:', targetId);
    console.log('[置于顶层] 所有节点的 zIndex:', allNodes.map((node) => ({ id: node.id, zIndex: node.zIndex })));

    lfInstance.setElementZIndex(targetId, 'top');

    console.log('[置于顶层] 操作后所有节点的 zIndex:', allNodes.map((node) => ({ id: node.id, zIndex: node.zIndex })));
  }

  function sendToBack(nodeId?: string) {
    const lfInstance = lf.value;
    if (!lfInstance) return;
    const targetId = nodeId || selectedNode.value?.id;
    if (!targetId) return;

    const currentNode = lfInstance.getNodeModelById(targetId) as LayerNodeModel | null;
    if (!currentNode) return;

    const allNodes = lfInstance.graphModel.nodes as LayerNodeInfo[];
    console.log('[置于底层] 目标节点ID:', targetId);
    console.log('[置于底层] 所有节点的 zIndex:', allNodes.map((node) => ({ id: node.id, zIndex: node.zIndex })));

    const allZIndexes = allNodes.map((node) => node.zIndex).filter((zIndex) => zIndex !== undefined);
    const minZIndex = allZIndexes.length > 0 ? Math.min(...allZIndexes) : 1;
    const newZIndex = minZIndex - 1;

    currentNode.setZIndex(newZIndex);

    console.log('[置于底层] 操作后所有节点的 zIndex:', allNodes.map((node) => ({ id: node.id, zIndex: node.zIndex })));
  }

  function bringForward(nodeId?: string) {
    const lfInstance = lf.value;
    if (!lfInstance) return;
    const targetId = nodeId || selectedNode.value?.id;
    if (!targetId) return;

    const currentNode = lfInstance.getNodeModelById(targetId) as LayerNodeModel | null;
    if (!currentNode) return;

    const currentZIndex = currentNode.zIndex;
    currentNode.setZIndex(currentZIndex + 1);
  }

  function sendBackward(nodeId?: string) {
    const lfInstance = lf.value;
    if (!lfInstance) return;
    const targetId = nodeId || selectedNode.value?.id;
    if (!targetId) return;

    const currentNode = lfInstance.getNodeModelById(targetId) as LayerNodeModel | null;
    if (!currentNode) return;

    const currentZIndex = currentNode.zIndex;
    currentNode.setZIndex(currentZIndex - 1);
  }

  return {
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward
  };
}
