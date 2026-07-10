import type LogicFlow from "@logicflow/core";
import type { BaseNodeModel } from "@logicflow/core";

import { ensureNodeMeta, type NodeMeta } from "./nodeState";

type MessageType = "success" | "warning" | "info" | "error";
type Translate = (key: string) => string;

export interface GroupingCommandsOptions {
  getSelectedNodeModels: () => BaseNodeModel[];
  getSelectedNodeModelsFiltered: () => BaseNodeModel[];
  updateNodeMeta: (
    model: BaseNodeModel,
    updater: (meta: NodeMeta) => NodeMeta,
  ) => void;
  shouldSkipShortcut: (event?: KeyboardEvent) => boolean;
  scheduleGroupRuleValidation: () => void;
  showMessage: (type: MessageType, message: string) => void;
  translate: Translate;
  createGroupId?: () => string;
}

export function collectGroupedNodeIds(
  logicFlow: LogicFlow | null,
  models: BaseNodeModel[],
): string[] {
  const graphModel = logicFlow?.graphModel;
  if (!graphModel) return [];
  const ids = new Set<string>();
  models.forEach((model) => {
    const meta = ensureNodeMeta(
      (model.getProperties?.() as any)?.meta ??
        (model as any)?.properties?.meta,
    );
    if (meta.locked) return;
    if (!meta.groupId) {
      ids.add(model.id);
      return;
    }
    graphModel.nodes.forEach((node) => {
      const peerMeta = ensureNodeMeta(
        (node.getProperties?.() as any)?.meta ??
          (node as any)?.properties?.meta,
      );
      if (peerMeta.groupId === meta.groupId && !peerMeta.locked) {
        ids.add(node.id);
      }
    });
  });
  return Array.from(ids);
}

export function createGroupingCommands(options: GroupingCommandsOptions) {
  const {
    getSelectedNodeModels,
    getSelectedNodeModelsFiltered,
    updateNodeMeta,
    shouldSkipShortcut,
    scheduleGroupRuleValidation,
    showMessage,
    translate,
    createGroupId = () => `group_${Date.now().toString(36)}`,
  } = options;

  const groupSelectedNodes = (event?: KeyboardEvent) => {
    if (shouldSkipShortcut(event)) return true;
    const models = getSelectedNodeModelsFiltered();
    if (models.length < 2) {
      showMessage("warning", translate("flowEditor.message.groupNeedTwo"));
      return true;
    }
    const groupId = createGroupId();
    models.forEach((model) => {
      updateNodeMeta(model, (meta) => ({ ...meta, groupId }));
    });
    scheduleGroupRuleValidation();
    return false;
  };

  const ungroupSelectedNodes = (event?: KeyboardEvent) => {
    if (shouldSkipShortcut(event)) return true;
    const models = getSelectedNodeModels();
    if (!models.length) {
      showMessage("info", translate("flowEditor.message.selectNodeToUngroup"));
      return true;
    }
    models.forEach((model) => {
      updateNodeMeta(model, (meta) => {
        const nextMeta = { ...meta };
        delete nextMeta.groupId;
        return nextMeta;
      });
    });
    scheduleGroupRuleValidation();
    return false;
  };

  return {
    groupSelectedNodes,
    ungroupSelectedNodes,
  };
}
