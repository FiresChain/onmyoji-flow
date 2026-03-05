<template>
  <div class="editor-layout" :style="{ height }">
    <!-- 中间流程图区域 -->
    <div
      ref="flowHostRef"
      class="flow-container"
      :class="{ 'snapline-disabled': !snaplineEnabled }"
    >
      <div
        class="flow-controls"
        :class="{ 'flow-controls--collapsed': flowControlsCollapsed }"
      >
        <div class="control-row control-header">
          <button
            class="control-button"
            type="button"
            @click="flowControlsCollapsed = !flowControlsCollapsed"
          >
            {{ flowControlsToggleLabel }}
          </button>
        </div>
        <template v-if="!flowControlsCollapsed">
          <div class="control-row toggles">
            <label class="control-toggle">
              <input type="checkbox" v-model="selectionEnabled" />
              <span>{{ t("flowEditor.controls.selection") }}</span>
            </label>
            <label class="control-toggle">
              <input type="checkbox" v-model="snapGridEnabled" />
              <span>{{ t("flowEditor.controls.snapGrid") }}</span>
            </label>
            <label class="control-toggle">
              <input type="checkbox" v-model="snaplineEnabled" />
              <span>{{ t("flowEditor.controls.snapline") }}</span>
            </label>
            <span class="control-hint">{{
              t("flowEditor.controls.selectedCount", { count: selectedCount })
            }}</span>
            <button class="control-button" type="button" @click="showAllNodes">
              {{ t("flowEditor.controls.showAll") }}
            </button>
          </div>
          <div class="control-row">
            <div class="control-label">{{ t("flowEditor.controls.align") }}</div>
            <div class="control-buttons">
              <button
                v-for="btn in alignmentButtons"
                :key="btn.key"
                class="control-button"
                type="button"
                :disabled="selectedCount < 2"
                @click="() => alignSelected(btn.key)"
              >
                {{ t(btn.labelKey) }}
              </button>
            </div>
          </div>
          <div class="control-row">
            <div class="control-label">{{ t("flowEditor.controls.distribute") }}</div>
            <div class="control-buttons">
              <button
                v-for="btn in distributeButtons"
                :key="btn.key"
                class="control-button"
                type="button"
                :disabled="selectedCount < 3"
                @click="() => distributeSelected(btn.key)"
              >
                {{ t(btn.labelKey) }}
              </button>
            </div>
          </div>
        </template>
      </div>
      <div
        class="container"
        ref="containerRef"
        :style="{ height: '100%' }"
      ></div>
      <div
        class="problems-dock"
        :class="{ 'problems-dock--open': problemsPanelOpen }"
      >
        <div class="problems-dock-bar">
          <button
            class="problems-tab"
            type="button"
            @click="problemsPanelOpen = !problemsPanelOpen"
          >
            {{ t("flowEditor.problems.tab") }}
            <span class="problems-badge">{{ groupRuleWarnings.length }}</span>
          </button>
        </div>
        <div v-if="problemsPanelOpen" class="problems-panel">
          <div class="problems-header">
            <span>{{ t("flowEditor.problems.header") }}</span>
            <span>{{
              t("flowEditor.problems.count", { count: groupRuleWarnings.length })
            }}</span>
          </div>
          <div v-if="!groupRuleWarnings.length" class="problems-empty">
            {{ t("flowEditor.problems.empty") }}
          </div>
          <div v-else class="problems-list">
            <div
              v-for="(warning, index) in groupRuleWarnings"
              :key="warning.id || `${warning.groupId}-${warning.code}-${index}`"
              class="problem-item"
              role="button"
              tabindex="0"
              @click="locateProblemNode(warning)"
              @keydown.enter.prevent="locateProblemNode(warning)"
            >
              <div class="problem-severity">
                {{ warning.severity.toUpperCase() }}
              </div>
              <div class="problem-content">
                <div class="problem-message">{{ warning.message }}</div>
                <div class="problem-meta">
                  {{ warning.groupName || warning.groupId }} ·
                  {{ warning.ruleId }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 右侧属性面板 -->
    <PropertyPanel
      v-if="showPropertyPanel"
      :height="height"
      :node="selectedNode"
      :lf="lf"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import type LogicFlow from "@logicflow/core";
import type {
  NodeData,
  BaseNodeModel,
  GraphModel,
  GraphData,
} from "@logicflow/core";
import "@logicflow/core/lib/style/index.css";
import "@logicflow/extension/lib/style/index.css";
import "@logicflow/core/es/index.css";
import "@logicflow/extension/es/index.css";

import PropertyPanel from "./PropertyPanel.vue";
import { useFlowArrangeCommands } from "./composables/useFlowArrangeCommands";
import { useFlowCanvasInteraction } from "./composables/useFlowCanvasInteraction";
import { useFlowEditorRuntime } from "./composables/useFlowEditorRuntime";
import { useFlowGroupRuleOrchestrator } from "./composables/useFlowGroupRuleOrchestrator";
import { useFlowLayerCommands } from "./composables/useFlowLayerCommands";
import { useGlobalMessage } from "@/ts/useGlobalMessage";
import { destroyLogicFlowInstance, useLogicFlowScope } from "@/ts/useLogicFlow";
import {
  normalizePropertiesWithStyle,
  normalizeNodeStyle,
  styleEquals,
} from "@/ts/nodeStyle";
import {
  destroyCanvasSettingsScope,
  useCanvasSettings,
} from "@/ts/useCanvasSettings";
import { useSafeI18n } from "@/ts/useSafeI18n";

const MOVE_STEP = 2;
const MOVE_STEP_LARGE = 10;

const props = withDefaults(
  defineProps<{
    height?: string;
    enableLabel?: boolean;
    showPropertyPanel?: boolean;
    configSnapGridEnabled?: boolean;
    configSnaplineEnabled?: boolean;
    configKeyboardEnabled?: boolean;
  }>(),
  {
    enableLabel: false,
    showPropertyPanel: true,
    configSnapGridEnabled: true,
    configSnaplineEnabled: true,
    configKeyboardEnabled: true,
  },
);
const emit = defineEmits<{
  "graph-data-change": [data: GraphData];
}>();

const flowHostRef = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const lf = ref<LogicFlow | null>(null);
const logicFlowScope = useLogicFlowScope();
const selectedCount = ref(0);
const { selectionEnabled, snapGridEnabled, snaplineEnabled } =
  useCanvasSettings();
const { showMessage } = useGlobalMessage();
const { t } = useSafeI18n();

// 当前选中节点
const selectedNode = ref<any>(null);
const flowControlsCollapsed = ref(true);
const problemsPanelOpen = ref(false);
let disposeFlowEditorRuntime: (() => void) | null = null;
const { mountFlowEditorRuntime } = useFlowEditorRuntime();
const { bringToFront, sendToBack, bringForward, sendBackward } =
  useFlowLayerCommands({
    lf,
    selectedNode,
  });
const {
  groupRuleWarnings,
  scheduleGroupRuleValidation,
  locateProblemNode,
  mountGroupRuleOrchestrator,
  disposeGroupRuleOrchestrator,
} = useFlowGroupRuleOrchestrator({
  lf,
  selectedNode,
  showMessage,
});
const flowControlsToggleLabel = computed(() => {
  if (flowControlsCollapsed.value) {
    const countSuffix = groupRuleWarnings.value.length
      ? `(${groupRuleWarnings.value.length})`
      : "";
    return `${t("flowEditor.controls.expand")}${countSuffix}`;
  }
  return t("flowEditor.controls.collapse");
});
const { resizeCanvas, mountCanvasInteraction, disposeCanvasInteraction } =
  useFlowCanvasInteraction({
    lf,
    flowHostRef,
    containerRef,
  });

function logClipboardDebug(
  stage: string,
  payload: Record<string, unknown> = {},
) {
  if (!import.meta.env.DEV) return;
  const lfInstance = lf.value as any;
  const graphModel = lfInstance?.graphModel;
  const selectNodeIds: string[] =
    graphModel?.selectNodes?.map((node: BaseNodeModel) => node.id) ?? [];
  const selectElementIds: string[] = graphModel?.selectElements
    ? Array.from(graphModel.selectElements.keys())
    : [];
  console.info("[FlowClipboardDebug]", stage, {
    selectedCount: selectedCount.value,
    selectNodeIds,
    selectElementIds,
    ...payload,
  });
}

function isInputLike(event?: KeyboardEvent) {
  const target = event?.target as HTMLElement | null;
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  return (
    ["input", "textarea", "select", "option"].includes(tag) ||
    target.isContentEditable
  );
}

function shouldSkipShortcut(event?: KeyboardEvent) {
  const lfInstance = lf.value as any;
  if (!lfInstance) return true;
  if (lfInstance.keyboard?.disabled) return true;
  if (lfInstance.graphModel?.textEditElement) return true;
  if (isInputLike(event)) return true;
  return false;
}

const emitGraphDataChange = () => {
  const lfInstance = lf.value;
  if (!lfInstance) return;
  emit("graph-data-change", lfInstance.getGraphRawData() as GraphData);
};

function ensureMeta(meta?: Record<string, any>) {
  const next: Record<string, any> = meta ? { ...meta } : {};
  if (next.visible == null) next.visible = true;
  if (next.locked == null) next.locked = false;
  return next;
}

function applyMetaToModel(
  model: BaseNodeModel,
  metaInput?: Record<string, any>,
) {
  const lfInstance = lf.value;
  const meta = ensureMeta(
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

  if (lfInstance) {
    const connectedEdges = lfInstance.getNodeEdges(model.id);
    connectedEdges.forEach((edgeModel) => {
      edgeModel.visible = meta.visible !== false;
    });
  }
}

function normalizeNodeModel(model: BaseNodeModel) {
  const lfInstance = lf.value;
  if (!lfInstance) return;

  const props =
    (model.getProperties?.() as any) ?? (model as any)?.properties ?? {};
  const incomingMeta = ensureMeta(props.meta);

  // 优先使用 model 的实际尺寸（用户可能刚刚手动缩放了节点）
  const normalized = normalizePropertiesWithStyle(
    { ...props, meta: incomingMeta },
    { width: model.width, height: model.height },
  );

  const currentMeta = ensureMeta((model as any)?.properties?.meta);
  const metaChanged =
    currentMeta.visible !== incomingMeta.visible ||
    currentMeta.locked !== incomingMeta.locked ||
    currentMeta.groupId !== incomingMeta.groupId;

  // 统一尺寸真源：节点实时尺寸与 style.width/height 保持一致，避免出现两套冲突尺寸
  const syncedStyle = {
    ...normalized.style,
    width: model.width,
    height: model.height,
  };
  const styleChanged = !styleEquals(props.style, syncedStyle);
  const sizeChanged = props.width !== model.width || props.height !== model.height;

  if (metaChanged || styleChanged || sizeChanged) {
    lfInstance.setProperties(model.id, {
      ...normalized,
      style: syncedStyle,
      width: model.width,
      height: model.height,
    });
  }
  applyMetaToModel(model, normalized.meta);
}

function normalizeAllNodes() {
  const lfInstance = lf.value;
  if (!lfInstance) return;
  lfInstance.graphModel?.nodes.forEach((model: BaseNodeModel) =>
    normalizeNodeModel(model),
  );

  // 清除新节点标记
  const allNodes = lfInstance.graphModel?.nodes || [];
  allNodes.forEach((node) => {
    delete (node as any)._isNewNode;
  });
}

function sanitizeLabelInProperties(
  properties: Record<string, any> | undefined,
) {
  if (
    !properties ||
    !Object.prototype.hasOwnProperty.call(properties, "_label")
  ) {
    return properties;
  }
  const currentLabel = properties._label;
  if (!Array.isArray(currentLabel)) {
    return properties;
  }
  const cleaned = currentLabel.filter(
    (item) => item && typeof item === "object",
  );
  if (cleaned.length === currentLabel.length) {
    return properties;
  }
  if (!cleaned.length) {
    const { _label, ...rest } = properties;
    return rest;
  }
  return {
    ...properties,
    _label: cleaned,
  };
}

function sanitizeGraphLabels() {
  const graphModel = lf.value?.graphModel as any;
  if (!graphModel) return;

  const sanitizeModel = (model: any) => {
    const props = model?.getProperties?.() ?? model?.properties;
    if (!props) return;
    const next = sanitizeLabelInProperties(props);
    if (!next || next === props) return;
    if (typeof model.setProperties === "function") {
      model.setProperties(next);
      return;
    }
    model.properties = next;
  };

  (graphModel.nodes ?? []).forEach((model: any) => sanitizeModel(model));
  (graphModel.edges ?? []).forEach((model: any) => sanitizeModel(model));
}

function updateNodeMeta(
  model: BaseNodeModel,
  updater: (meta: Record<string, any>) => Record<string, any>,
) {
  const lfInstance = lf.value;
  if (!lfInstance) return;
  const props =
    (model.getProperties?.() as any) ?? (model as any)?.properties ?? {};
  const nextMeta = updater(ensureMeta(props.meta));
  lfInstance.setProperties(model.id, { ...props, meta: nextMeta });
  applyMetaToModel(model, nextMeta);
}

function getSelectedNodeModelsFiltered(options?: {
  includeHidden?: boolean;
  includeLocked?: boolean;
}) {
  const includeHidden = options?.includeHidden ?? false;
  const includeLocked = options?.includeLocked ?? false;
  const graphModel = lf.value?.graphModel;
  if (!graphModel) return [];
  return graphModel.selectNodes.filter((model: BaseNodeModel) => {
    const meta = ensureMeta(
      (model.getProperties?.() as any)?.meta ??
        (model as any)?.properties?.meta,
    );
    if (!includeHidden && meta.visible === false) return false;
    if (!includeLocked && meta.locked) return false;
    return true;
  });
}

const {
  alignmentButtons,
  distributeButtons,
  alignSelected,
  distributeSelected,
} = useFlowArrangeCommands({
  lf,
  showMessage,
  getSelectedNodeModelsFiltered,
});

function getSelectedNodeModels() {
  const graphModel = lf.value?.graphModel;
  if (!graphModel) return [];
  return [...graphModel.selectNodes];
}

function collectGroupNodeIds(models: BaseNodeModel[]) {
  const graphModel = lf.value?.graphModel;
  if (!graphModel) return [];
  const ids = new Set<string>();
  models.forEach((model) => {
    const meta = ensureMeta(
      (model.getProperties?.() as any)?.meta ??
        (model as any)?.properties?.meta,
    );
    if (meta.locked) return;
    if (meta.groupId) {
      graphModel.nodes.forEach((node) => {
        const peerMeta = ensureMeta(
          (node.getProperties?.() as any)?.meta ??
            (node as any)?.properties?.meta,
        );
        if (peerMeta.groupId === meta.groupId && !peerMeta.locked) {
          ids.add(node.id);
        }
      });
    } else {
      ids.add(model.id);
    }
  });
  return Array.from(ids);
}

function moveSelectedNodes(deltaX: number, deltaY: number) {
  const graphModel = lf.value?.graphModel;
  if (!graphModel) return;
  const targets = collectGroupNodeIds(getSelectedNodeModelsFiltered());
  if (!targets.length) return;
  graphModel.moveNodes(targets, deltaX, deltaY);
}

// ========== 删除操作 ==========
function deleteSelectedElements(event?: KeyboardEvent) {
  if (shouldSkipShortcut(event)) return true;
  const lfInstance = lf.value;
  if (!lfInstance) return true;

  const { edges } = lfInstance.getSelectElements(true);
  const nodes = getSelectedNodeModelsFiltered({
    includeHidden: false,
    includeLocked: true,
  });
  const lockedNodes = nodes.filter(
    (node) => ensureMeta((node as any).properties?.meta).locked,
  );
  edges.forEach((edge) => edge.id && lfInstance.deleteEdge(edge.id));
  nodes
    .filter((node) => {
      const meta = ensureMeta((node as any).properties?.meta);
      return !meta.locked && meta.visible !== false;
    })
    .forEach((node) => node.id && lfInstance.deleteNode(node.id));

  if (lockedNodes.length) {
    showMessage("warning", t("flowEditor.message.lockedNodesSkipped"));
  }
  updateSelectedCount();
  selectedNode.value = null;
  return false;
}

function deleteNode(nodeId: string) {
  const lfInstance = lf.value;
  if (!lfInstance) return;
  const node = lfInstance.getNodeModelById(nodeId);
  if (!node) return;

  const meta = ensureMeta((node as any).properties?.meta);
  if (meta.locked) {
    showMessage("warning", t("flowEditor.message.nodeLockedCannotDelete"));
    return;
  }

  lfInstance.deleteNode(nodeId);
}

function toggleLockSelected(event?: KeyboardEvent) {
  if (shouldSkipShortcut(event)) return true;
  const models = getSelectedNodeModels();
  if (!models.length) {
    showMessage("info", t("flowEditor.message.selectNodeToToggleLock"));
    return true;
  }
  const hasUnlocked = models.some(
    (model) => !ensureMeta((model.getProperties?.() as any)?.meta).locked,
  );
  models.forEach((model) => {
    updateNodeMeta(model, (meta) => ({
      ...meta,
      locked: hasUnlocked ? true : false,
    }));
  });
  return false;
}

function toggleVisibilitySelected(event?: KeyboardEvent) {
  if (shouldSkipShortcut(event)) return true;
  const models = getSelectedNodeModelsFiltered({ includeLocked: true });
  if (!models.length) {
    showMessage("info", t("flowEditor.message.selectNodeToToggleVisibility"));
    return true;
  }
  const hasVisible = models.some(
    (model) =>
      ensureMeta((model.getProperties?.() as any)?.meta).visible !== false,
  );
  models.forEach((model) => {
    updateNodeMeta(model, (meta) => ({
      ...meta,
      visible: !hasVisible ? true : false,
    }));
  });
  if (hasVisible) {
    selectedNode.value = null;
  }
  updateSelectedCount();
  return false;
}

function showAllNodes() {
  const lfInstance = lf.value;
  if (!lfInstance) return;
  let changed = 0;
  lfInstance.graphModel?.nodes.forEach((model: BaseNodeModel) => {
    const props =
      (model.getProperties?.() as any) ?? (model as any)?.properties ?? {};
    const meta = ensureMeta(props.meta);
    if (meta.visible === false) {
      meta.visible = true;
      lfInstance.setProperties(model.id, { ...props, meta });
      applyMetaToModel(model, meta);
      changed += 1;
    }
  });
  if (changed > 0) {
    showMessage("success", t("flowEditor.message.showAllSuccess", { count: changed }));
  } else {
    showMessage("info", t("flowEditor.message.noHiddenNodes"));
  }
  updateSelectedCount();
}

function groupSelectedNodes(event?: KeyboardEvent) {
  if (shouldSkipShortcut(event)) return true;
  const models = getSelectedNodeModelsFiltered();
  if (models.length < 2) {
    showMessage("warning", t("flowEditor.message.groupNeedTwo"));
    return true;
  }
  const groupId = `group_${Date.now().toString(36)}`;
  models.forEach((model) => {
    updateNodeMeta(model, (meta) => ({ ...meta, groupId }));
  });
  scheduleGroupRuleValidation();
  return false;
}

function ungroupSelectedNodes(event?: KeyboardEvent) {
  if (shouldSkipShortcut(event)) return true;
  const models = getSelectedNodeModels();
  if (!models.length) {
    showMessage("info", t("flowEditor.message.selectNodeToUngroup"));
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
}

function handleArrowMove(
  direction: "left" | "right" | "up" | "down",
  event?: KeyboardEvent,
) {
  if (shouldSkipShortcut(event)) return true;
  const step =
    (event?.shiftKey ? MOVE_STEP_LARGE : MOVE_STEP) *
    (direction === "left" || direction === "up" ? -1 : 1);
  if (direction === "left" || direction === "right") {
    moveSelectedNodes(step, 0);
  } else {
    moveSelectedNodes(0, step);
  }
  return false;
}

function handleNodeDrag(args: {
  data: NodeData;
  deltaX: number;
  deltaY: number;
}) {
  const { data, deltaX, deltaY } = args;
  if (!deltaX && !deltaY) return;
  const graphModel = lf.value?.graphModel;
  if (!graphModel) return;
  const model = graphModel.getNodeModelById(data.id);
  if (!model) return;
  const targets = collectGroupNodeIds([model]).filter((id) => id !== model.id);
  if (!targets.length) return;
  graphModel.moveNodes(targets, deltaX, deltaY);
}

function updateSelectedCount(model?: GraphModel) {
  const lfInstance = lf.value;
  const graphModel = model ?? lfInstance?.graphModel;
  selectedCount.value = graphModel?.selectNodes.length ?? 0;
}

function applySelectionSelect(enabled: boolean) {
  const lfInstance = lf.value as any;
  if (!lfInstance) return;
  if (enabled) {
    lfInstance.openSelectionSelect?.();
  } else {
    lfInstance.closeSelectionSelect?.();
  }
}

function applySnapGrid(enabled: boolean) {
  const lfInstance = lf.value;
  if (!lfInstance) return;
  lfInstance.updateEditConfig({ snapGrid: enabled });
}

function applyKeyboardEnabled(enabled: boolean) {
  const lfInstance = lf.value as any;
  if (!lfInstance?.keyboard) return;
  if (enabled) {
    lfInstance.keyboard.enable?.(true);
    return;
  }
  lfInstance.keyboard.disable?.();
}

onMounted(() => {
  mountGroupRuleOrchestrator();
  disposeFlowEditorRuntime = mountFlowEditorRuntime({
    lf,
    containerRef,
    logicFlowScope,
    enableLabel: props.enableLabel,
    configSnapGridEnabled: props.configSnapGridEnabled,
    configSnaplineEnabled: props.configSnaplineEnabled,
    configKeyboardEnabled: props.configKeyboardEnabled,
    snaplineEnabled,
    snapGridEnabled,
    selectionEnabled,
    selectedNode,
    bringToFront,
    bringForward,
    sendBackward,
    sendToBack,
    deleteNode,
    deleteSelectedElements,
    groupSelectedNodes,
    ungroupSelectedNodes,
    toggleLockSelected,
    toggleVisibilitySelected,
    handleArrowMove,
    normalizeNodeModel,
    scheduleGroupRuleValidation,
    emitGraphDataChange,
    sanitizeGraphLabels,
    updateSelectedCount,
    normalizeAllNodes,
    logClipboardDebug,
    applyKeyboardEnabled,
    applySelectionSelect,
  });
  mountCanvasInteraction();
});

watch(selectionEnabled, (enabled) => {
  applySelectionSelect(enabled);
});

watch(snapGridEnabled, (enabled) => {
  applySnapGrid(enabled);
});

watch(snaplineEnabled, (enabled) => {
  const lfInstance = lf.value as any;
  if (!lfInstance) return;
  if (!enabled) {
    lfInstance.snaplineModel?.clearSnapline?.();
  }
});

watch(
  () => props.configSnapGridEnabled,
  (enabled) => {
    snapGridEnabled.value = enabled;
  },
);

watch(
  () => props.configSnaplineEnabled,
  (enabled) => {
    snaplineEnabled.value = enabled;
  },
);

watch(
  () => props.configKeyboardEnabled,
  (enabled) => {
    applyKeyboardEnabled(enabled);
  },
);

watch(
  () => props.height,
  () => {
    nextTick(() => {
      resizeCanvas();
    });
  },
);

defineExpose({
  resizeCanvas,
});

// 销毁 LogicFlow
onBeforeUnmount(() => {
  disposeCanvasInteraction();
  disposeFlowEditorRuntime?.();
  disposeFlowEditorRuntime = null;
  disposeGroupRuleOrchestrator();
  destroyLogicFlowInstance(logicFlowScope);
  destroyCanvasSettingsScope(logicFlowScope);
  lf.value = null;
});
</script>

<style scoped>
.editor-layout {
  display: flex;
  height: 100%;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}
.flow-container {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
.flow-container--panning :deep(.lf-canvas-overlay) {
  cursor: grabbing;
}
.container {
  width: 100%;
  min-height: 0;
  background: #fff;
  height: 100%;
}
.flow-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  max-width: 460px;
  font-size: 12px;
}
.flow-controls--collapsed {
  padding: 6px;
  max-width: 220px;
}
.control-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}
.control-header {
  margin-bottom: 0;
}
.control-row:last-child {
  margin-bottom: 0;
}
.control-label {
  font-weight: 600;
  color: #303133;
}
.control-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.control-button {
  border: 1px solid #dcdfe6;
  background: #fff;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  color: #303133;
}
.control-button:hover:enabled {
  background: #f5f7fa;
}
.control-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.control-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
}
.control-hint {
  color: #909399;
}
.problems-dock {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 11;
  pointer-events: none;
}
.problems-dock-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px;
  background: rgba(250, 250, 250, 0.98);
  border-top: 1px solid #dcdfe6;
  pointer-events: auto;
}
.problems-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #dcdfe6;
  background: #fff;
  border-radius: 4px;
  padding: 2px 10px;
  height: 24px;
  font-size: 12px;
  cursor: pointer;
  color: #303133;
}
.problems-tab:hover {
  background: #f5f7fa;
}
.problems-badge {
  min-width: 18px;
  height: 18px;
  border-radius: 10px;
  background: #fde68a;
  color: #92400e;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
  padding: 0 4px;
  box-sizing: border-box;
}
.problems-panel {
  height: 220px;
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid #dcdfe6;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
}
.problems-header {
  height: 32px;
  padding: 0 12px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #606266;
}
.problems-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 13px;
}
.problems-list {
  flex: 1;
  overflow-y: auto;
}
.problem-item {
  display: flex;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid #f2f3f5;
  cursor: pointer;
}
.problem-item:hover {
  background: #f8fafc;
}
.problem-item:focus {
  outline: none;
  box-shadow: inset 0 0 0 1px #93c5fd;
  background: #eff6ff;
}
.problem-severity {
  width: 56px;
  height: 20px;
  border-radius: 10px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  flex-shrink: 0;
}
.problem-content {
  min-width: 0;
}
.problem-message {
  color: #303133;
  font-size: 13px;
  line-height: 1.4;
}
.problem-meta {
  margin-top: 2px;
  color: #909399;
  font-size: 12px;
  line-height: 1.3;
  word-break: break-all;
}
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 5px 0;
  z-index: 9999;
  min-width: 120px;
  user-select: none;
}
.menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}
.menu-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.snapline-disabled .lf-snapline {
  display: none;
}
</style>
