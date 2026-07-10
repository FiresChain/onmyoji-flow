import type LogicFlow from "@logicflow/core";
import type { BaseNodeModel } from "@logicflow/core";

export type NodeMeta = Record<string, any>;
export type SelectedNodeFilterOptions = {
  includeHidden?: boolean;
  includeLocked?: boolean;
};

type MessageType = "success" | "warning" | "info" | "error";
type Translate = (key: string, values?: Record<string, unknown>) => string;

export interface NodeStateCommandsOptions {
  getLogicFlow: () => LogicFlow | null;
  getSelectedNodeModels: () => BaseNodeModel[];
  getSelectedNodeModelsFiltered: (
    options?: SelectedNodeFilterOptions,
  ) => BaseNodeModel[];
  shouldSkipShortcut: (event?: KeyboardEvent) => boolean;
  clearSelectedNode: () => void;
  updateSelectedCount: () => void;
  showMessage: (type: MessageType, message: string) => void;
  translate: Translate;
}

export function ensureNodeMeta(meta?: NodeMeta): NodeMeta {
  const next: NodeMeta = meta ? { ...meta } : {};
  if (next.visible == null) next.visible = true;
  if (next.locked == null) next.locked = false;
  return next;
}

export function applyNodeMetaToModel(
  logicFlow: LogicFlow | null,
  model: BaseNodeModel,
  metaInput?: NodeMeta,
): void {
  const meta = ensureNodeMeta(
    metaInput ??
      (model.getProperties?.() as any)?.meta ??
      (model as any)?.properties?.meta,
  );
  model.visible = meta.visible !== false;
  model.draggable = !meta.locked;
  model.setHittable?.(!meta.locked);
  model.setHitable?.(!meta.locked);
  model.setIsShowAnchor?.(!meta.locked);
  model.setRotatable?.(!meta.locked);
  model.setResizable?.(!meta.locked);

  logicFlow?.getNodeEdges(model.id).forEach((edgeModel) => {
    edgeModel.visible = meta.visible !== false;
  });
}

export function updateNodeMetaForModel(
  logicFlow: LogicFlow | null,
  model: BaseNodeModel,
  updater: (meta: NodeMeta) => NodeMeta,
): void {
  if (!logicFlow) return;
  const properties =
    (model.getProperties?.() as any) ?? (model as any)?.properties ?? {};
  const nextMeta = updater(ensureNodeMeta(properties.meta));
  logicFlow.setProperties(model.id, { ...properties, meta: nextMeta });
  applyNodeMetaToModel(logicFlow, model, nextMeta);
}

export function createNodeStateCommands(options: NodeStateCommandsOptions) {
  const {
    getLogicFlow,
    getSelectedNodeModels,
    getSelectedNodeModelsFiltered,
    shouldSkipShortcut,
    clearSelectedNode,
    updateSelectedCount,
    showMessage,
    translate,
  } = options;

  const updateNodeMeta = (
    model: BaseNodeModel,
    updater: (meta: NodeMeta) => NodeMeta,
  ) => updateNodeMetaForModel(getLogicFlow(), model, updater);

  const toggleLockSelected = (event?: KeyboardEvent) => {
    if (shouldSkipShortcut(event)) return true;
    const models = getSelectedNodeModels();
    if (!models.length) {
      showMessage(
        "info",
        translate("flowEditor.message.selectNodeToToggleLock"),
      );
      return true;
    }
    const hasUnlocked = models.some(
      (model) => !ensureNodeMeta((model.getProperties?.() as any)?.meta).locked,
    );
    models.forEach((model) => {
      updateNodeMeta(model, (meta) => ({
        ...meta,
        locked: hasUnlocked,
      }));
    });
    return false;
  };

  const toggleVisibilitySelected = (event?: KeyboardEvent) => {
    if (shouldSkipShortcut(event)) return true;
    const models = getSelectedNodeModelsFiltered({ includeLocked: true });
    if (!models.length) {
      showMessage(
        "info",
        translate("flowEditor.message.selectNodeToToggleVisibility"),
      );
      return true;
    }
    const hasVisible = models.some(
      (model) =>
        ensureNodeMeta((model.getProperties?.() as any)?.meta).visible !==
        false,
    );
    models.forEach((model) => {
      updateNodeMeta(model, (meta) => ({
        ...meta,
        visible: !hasVisible,
      }));
    });
    if (hasVisible) {
      clearSelectedNode();
    }
    updateSelectedCount();
    return false;
  };

  const showAllNodes = () => {
    const logicFlow = getLogicFlow();
    if (!logicFlow) return;
    let changed = 0;
    logicFlow.graphModel?.nodes.forEach((model: BaseNodeModel) => {
      const properties =
        (model.getProperties?.() as any) ?? (model as any)?.properties ?? {};
      const meta = ensureNodeMeta(properties.meta);
      if (meta.visible === false) {
        meta.visible = true;
        logicFlow.setProperties(model.id, { ...properties, meta });
        applyNodeMetaToModel(logicFlow, model, meta);
        changed += 1;
      }
    });
    if (changed > 0) {
      showMessage(
        "success",
        translate("flowEditor.message.showAllSuccess", { count: changed }),
      );
    } else {
      showMessage("info", translate("flowEditor.message.noHiddenNodes"));
    }
    updateSelectedCount();
  };

  return {
    toggleLockSelected,
    toggleVisibilitySelected,
    showAllNodes,
  };
}
