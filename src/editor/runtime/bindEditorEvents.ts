import { EventType } from "@logicflow/core";
import type { BaseNodeModel, default as LogicFlow } from "@logicflow/core";
import type { Ref } from "vue";

import {
  clearAssetNodeReferenceByLabelOwner,
  getAssetLabelOwnerFromNode,
  isAssetNameLabelTextNode,
  syncAssetNameLabelForNode,
} from "@/editor/commands/assetTheme";

type LogicFlowEventHandler = (...args: any[]) => void;

export interface BindEditorEventsOptions {
  instance: LogicFlow;
  selectionEnabled: Ref<boolean>;
  selectedNode: Ref<any>;
  normalizeNodeModel: (model: BaseNodeModel) => void;
  scheduleGroupRuleValidation: (delay?: number) => void;
  emitGraphDataChange: () => void;
  sanitizeGraphLabels: () => void;
  updateSelectedCount: () => void;
  normalizeAllNodes: () => void;
  applySelectionSelect: (enabled: boolean) => void;
}

export function bindEditorEvents(options: BindEditorEventsOptions): () => void {
  const {
    instance,
    selectionEnabled,
    selectedNode,
    normalizeNodeModel,
    scheduleGroupRuleValidation,
    emitGraphDataChange,
    sanitizeGraphLabels,
    updateSelectedCount,
    normalizeAllNodes,
    applySelectionSelect,
  } = options;
  const eventDisposers: Array<() => void> = [];
  let disposed = false;

  const disposeEvents = () => {
    if (disposed) return;
    disposed = true;

    let cleanupError: unknown;
    eventDisposers.reverse().forEach((dispose) => {
      try {
        dispose();
      } catch (error) {
        cleanupError ??= error;
      }
    });
    if (cleanupError) throw cleanupError;
  };

  const bind = (event: string, handler: LogicFlowEventHandler) => {
    try {
      instance.on(event, handler);
    } catch (error) {
      try {
        disposeEvents();
      } catch {
        // Preserve the registration error.
      }
      throw error;
    }
    eventDisposers.push(() => instance.off(event, handler));
  };

  const syncingAssetNodeIds = new Set<string>();
  const syncAssetNameLabelSafely = (
    assetNodeId: string,
    syncOptions?: { forceSyncText?: boolean },
  ) => {
    if (!assetNodeId || syncingAssetNodeIds.has(assetNodeId)) return;
    syncingAssetNodeIds.add(assetNodeId);
    try {
      syncAssetNameLabelForNode(instance, assetNodeId, {
        forceSyncText: syncOptions?.forceSyncText,
      });
    } finally {
      syncingAssetNodeIds.delete(assetNodeId);
    }
  };

  bind(EventType.NODE_ADD, ({ data }) => {
    if (!data?.id) return;
    const model = instance.getNodeModelById(data.id);
    if (model) {
      normalizeNodeModel(model);
      model.setZIndex(1000);
      (model as any)._isNewNode = true;
      if (model.type === "assetSelector") {
        syncAssetNameLabelSafely(model.id, { forceSyncText: true });
      }
    }
    scheduleGroupRuleValidation();
    emitGraphDataChange();
  });

  bind("node:dnd-add", ({ data }) => {
    if (!data?.id) return;
    const model = instance.getNodeModelById(data.id);
    if (model) {
      model.setZIndex(1000);
      (model as any)._isNewNode = true;
      if (model.type === "assetSelector") {
        syncAssetNameLabelSafely(model.id, { forceSyncText: true });
      }
    }
    scheduleGroupRuleValidation();
    emitGraphDataChange();
  });

  bind(EventType.GRAPH_RENDERED, () => {
    sanitizeGraphLabels();
    applySelectionSelect(selectionEnabled.value);
    normalizeAllNodes();
    const nodes = (instance.graphModel?.nodes || []) as BaseNodeModel[];
    nodes.forEach((node) => {
      if (node.type === "assetSelector") {
        syncAssetNameLabelSafely(node.id);
      }
    });
    scheduleGroupRuleValidation(0);
  });

  bind(EventType.NODE_CLICK, ({ data }) => {
    selectedNode.value = data;
  });

  bind(EventType.BLANK_CLICK, () => {
    selectedNode.value = null;
    updateSelectedCount();
  });

  bind(EventType.NODE_PROPERTIES_CHANGE, (data) => {
    const nodeId = data.id;
    if (selectedNode.value && nodeId === selectedNode.value.id) {
      if (data.properties) {
        selectedNode.value = {
          ...selectedNode.value,
          properties: data.properties,
        };
      }
    }
    const model = instance.getNodeModelById(nodeId);
    if (model) {
      normalizeNodeModel(model);
      if (model.type === "assetSelector") {
        syncAssetNameLabelSafely(nodeId);
      }
    }
    scheduleGroupRuleValidation();
    emitGraphDataChange();
  });

  bind(EventType.NODE_PROPERTIES_DELETE, () => {
    scheduleGroupRuleValidation();
    emitGraphDataChange();
  });
  bind(EventType.NODE_DROP, () => {
    emitGraphDataChange();
  });
  bind(EventType.NODE_DRAG, ({ data, deltaX, deltaY }) => {
    const nodeId = data?.id;
    if (!nodeId) return;
    const model = instance.getNodeModelById(nodeId) as any;
    if (!model || model.type !== "assetSelector") return;
    const props =
      (model.getProperties?.() as Record<string, any>) ||
      model.properties ||
      {};
    const labelNodeId = props.assetName?.labelNodeId;
    if (!labelNodeId || typeof labelNodeId !== "string") return;
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return;
    instance.graphModel?.moveNodes?.([labelNodeId], deltaX, deltaY);
  });
  bind(EventType.NODE_DROP, ({ data }) => {
    const nodeId = data?.id;
    if (!nodeId) return;
    const model = instance.getNodeModelById(nodeId);
    if (!model || model.type !== "assetSelector") return;
    syncAssetNameLabelSafely(nodeId);
  });
  bind(EventType.TEXT_UPDATE, () => {
    emitGraphDataChange();
  });
  bind(EventType.LABEL_UPDATE, () => {
    emitGraphDataChange();
  });
  bind(EventType.NODE_DELETE, (payload: any) => {
    const nodeData = payload?.data || payload || {};
    const deletedNodeId = typeof nodeData.id === "string" ? nodeData.id : "";
    if (deletedNodeId) {
      if (nodeData.type === "assetSelector") {
        const labelId = nodeData?.properties?.assetName?.labelNodeId;
        if (typeof labelId === "string" && labelId) {
          instance.deleteNode(labelId);
        } else {
          const danglingLabel = (instance.graphModel?.nodes || []).find(
            (node: any) =>
              node?.type === "textNode" &&
              node?.properties?.meta?.assetNameOwnerId === deletedNodeId,
          );
          if (danglingLabel?.id) {
            instance.deleteNode(danglingLabel.id);
          }
        }
      } else if (isAssetNameLabelTextNode(nodeData)) {
        const ownerId = getAssetLabelOwnerFromNode(nodeData);
        if (ownerId) {
          clearAssetNodeReferenceByLabelOwner(instance, ownerId, deletedNodeId);
        }
      }
    }
    scheduleGroupRuleValidation();
    emitGraphDataChange();
  });
  bind(EventType.EDGE_ADD, () => {
    scheduleGroupRuleValidation();
    emitGraphDataChange();
  });
  bind(EventType.EDGE_DELETE, () => {
    scheduleGroupRuleValidation();
    emitGraphDataChange();
  });
  bind(EventType.EDGE_ADJUST, () => {
    emitGraphDataChange();
  });
  bind(EventType.EDGE_EXCHANGE_NODE, () => {
    scheduleGroupRuleValidation();
    emitGraphDataChange();
  });
  bind(EventType.HISTORY_CHANGE, () => {
    const nodes = (instance.graphModel?.nodes || []) as BaseNodeModel[];
    nodes.forEach((node) => {
      if (node.type === "assetSelector") {
        syncAssetNameLabelSafely(node.id);
      }
    });
    emitGraphDataChange();
  });

  bind("selection:selected", () => {
    sanitizeGraphLabels();
    updateSelectedCount();
  });
  bind("selection:drop", () => {
    sanitizeGraphLabels();
    updateSelectedCount();
  });

  return disposeEvents;
}
