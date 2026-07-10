<template>
  <div class="editor-layout" :style="{ height }">
    <!-- 中间流程图区域 -->
    <div
      ref="flowHostRef"
      class="flow-container"
      :class="{ 'snapline-disabled': !snaplineEnabled }"
    >
      <CanvasControls
        v-model:collapsed="flowControlsCollapsed"
        v-model:selection-enabled="selectionEnabled"
        v-model:snap-grid-enabled="snapGridEnabled"
        v-model:snapline-enabled="snaplineEnabled"
        :toggle-label="flowControlsToggleLabel"
        :selected-count="selectedCount"
        :alignment-buttons="alignmentButtons"
        :distribute-buttons="distributeButtons"
        @show-all="showAllNodes"
        @align="alignSelected"
        @distribute="distributeSelected"
      />
      <div
        class="container"
        ref="containerRef"
        :style="{ height: '100%' }"
      ></div>
      <ProblemsDock
        v-model:open="problemsPanelOpen"
        :warnings="groupRuleWarnings"
        @locate="locateProblemNode"
      />
    </div>
    <!-- 右侧属性面板 -->
    <Inspector
      v-if="showPropertyPanel"
      :height="height"
      :node="selectedNode"
      :lf="lf"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  computed,
} from "vue";
import type LogicFlow from "@logicflow/core";
import type { BaseNodeModel, GraphModel } from "@logicflow/core";
import "@logicflow/core/lib/style/index.css";
import "@logicflow/extension/lib/style/index.css";
import "@logicflow/core/es/index.css";
import "@logicflow/extension/es/index.css";

import CanvasControls from "./CanvasControls.vue";
import Inspector from "./Inspector.vue";
import ProblemsDock from "./ProblemsDock.vue";
import { useFlowCanvasInteraction } from "@/editor/runtime/canvasInteraction";
import { mountEditorResources } from "@/editor/runtime/lifecycle";
import { useFlowEditorRuntime } from "@/editor/runtime/mountEditorRuntime";
import { useFlowGroupRuleOrchestrator } from "@/editor/runtime/groupRuleOrchestrator";
import { createArrangeCommands } from "@/editor/commands/arrange";
import {
  collectGroupedNodeIds,
  createGroupingCommands,
} from "@/editor/commands/grouping";
import { createLayerCommands } from "@/editor/commands/layers";
import {
  applyNodeMetaToModel,
  createNodeStateCommands,
  ensureNodeMeta as ensureMeta,
  updateNodeMetaForModel,
  type NodeMeta,
  type SelectedNodeFilterOptions,
} from "@/editor/commands/nodeState";
import {
  createSelectionCommands,
  getSelectedNodeModels as readSelectedNodeModels,
  getSelectedNodeModelsFiltered as readSelectedNodeModelsFiltered,
  shouldSkipEditorShortcut,
} from "@/editor/commands/selection";
import { useGlobalMessage } from "@/ts/useGlobalMessage";
import type { GraphData } from "@/core/document/types";
import { captureGraphData } from "@/core/logicflow/graphIO";
import { useLogicFlowScope } from "@/ts/useLogicFlow";
import { normalizePropertiesWithStyle, styleEquals } from "@/ts/nodeStyle";
import { useCanvasSettings } from "@/ts/useCanvasSettings";
import { useSafeI18n } from "@/ts/useSafeI18n";

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
let disposeEditorResources: (() => void) | null = null;
const { mountFlowEditorRuntime } = useFlowEditorRuntime();
const { bringToFront, sendToBack, bringForward, sendBackward } =
  createLayerCommands({
    getLogicFlow: () => lf.value,
    getSelectedNode: () => selectedNode.value,
  });
const {
  groupRuleWarnings,
  scheduleGroupRuleValidation,
  locateProblemNode,
  mountGroupRuleOrchestrator,
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
const { resizeCanvas, mountCanvasInteraction } = useFlowCanvasInteraction({
  lf,
  flowHostRef,
  containerRef,
});

function shouldSkipShortcut(event?: KeyboardEvent) {
  return shouldSkipEditorShortcut(lf.value, event);
}

const emitGraphDataChange = () => {
  const lfInstance = lf.value;
  if (!lfInstance) return;
  emit("graph-data-change", captureGraphData(lfInstance));
};

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

  // 只检查 style 的其他属性变化，不检查 width/height
  // 因为 width/height 应该由 LogicFlow 的缩放控制，而不是由 properties 控制
  const styleChanged = !styleEquals(props.style, normalized.style);

  if (metaChanged || styleChanged) {
    // 同步 style 到 properties，但保持 width/height 与 model 一致
    lfInstance.setProperties(model.id, {
      ...normalized,
      width: model.width,
      height: model.height,
    });
  }
  applyNodeMetaToModel(lfInstance, model, normalized.meta);
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
  updater: (meta: NodeMeta) => NodeMeta,
) {
  updateNodeMetaForModel(lf.value, model, updater);
}

function getSelectedNodeModelsFiltered(options?: SelectedNodeFilterOptions) {
  return readSelectedNodeModelsFiltered(lf.value, options);
}

function getSelectedNodeModels() {
  return readSelectedNodeModels(lf.value);
}

function collectGroupNodeIds(models: BaseNodeModel[]) {
  return collectGroupedNodeIds(lf.value, models);
}

const {
  alignmentButtons,
  distributeButtons,
  alignSelected,
  distributeSelected,
} = createArrangeCommands({
  getLogicFlow: () => lf.value,
  showMessage,
  translate: t,
  getSelectedNodeModelsFiltered,
});

const { groupSelectedNodes, ungroupSelectedNodes } = createGroupingCommands({
  getSelectedNodeModels,
  getSelectedNodeModelsFiltered,
  updateNodeMeta,
  shouldSkipShortcut,
  scheduleGroupRuleValidation,
  showMessage,
  translate: t,
});

const { deleteSelectedElements, deleteNode, handleArrowMove } =
  createSelectionCommands({
    getLogicFlow: () => lf.value,
    getSelectedNodeModelsFiltered,
    collectGroupNodeIds,
    shouldSkipShortcut,
    clearSelectedNode: () => {
      selectedNode.value = null;
    },
    updateSelectedCount,
    showMessage,
    translate: t,
  });

const { toggleLockSelected, toggleVisibilitySelected, showAllNodes } =
  createNodeStateCommands({
    getLogicFlow: () => lf.value,
    getSelectedNodeModels,
    getSelectedNodeModelsFiltered,
    shouldSkipShortcut,
    clearSelectedNode: () => {
      selectedNode.value = null;
    },
    updateSelectedCount,
    showMessage,
    translate: t,
  });

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
  disposeEditorResources = mountEditorResources([
    mountGroupRuleOrchestrator,
    () =>
      mountFlowEditorRuntime({
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
        applyKeyboardEnabled,
        applySelectionSelect,
      }),
    mountCanvasInteraction,
  ]);
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
  try {
    disposeEditorResources?.();
  } finally {
    disposeEditorResources = null;
    lf.value = null;
  }
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
.snapline-disabled .lf-snapline {
  display: none;
}
</style>
