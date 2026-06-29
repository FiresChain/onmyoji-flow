<template>
  <div
    ref="embedRootRef"
    class="yys-editor-embed"
    :class="{
      'preview-mode': mode === 'preview',
      'edit-mode': mode === 'edit',
    }"
    :style="containerStyle"
  >
    <!-- 编辑模式：完整 UI -->
    <template v-if="mode === 'edit'">
      <!-- 工具栏 -->
      <div v-if="showToolbar" ref="toolbarHostRef" class="toolbar-host">
        <Toolbar
          :is-embed="true"
          :pinia-instance="localPinia"
          @save="handleSave"
          @cancel="handleCancel"
        />
      </div>

      <!-- 主内容区 -->
      <div class="editor-content" :style="editorContentStyle">
        <!-- 左侧组件库 -->
        <ComponentsPanel v-if="showComponentPanel" />

        <!-- 中间画布 + 右侧属性面板 -->
        <FlowEditor
          class="flow-editor-pane"
          ref="flowEditorRef"
          :height="editorContentHeight"
          :enable-label="false"
          :show-property-panel="showPropertyPanel"
          :config-snap-grid-enabled="resolvedEmbedConfig.grid"
          :config-snapline-enabled="resolvedEmbedConfig.snapline"
          :config-keyboard-enabled="resolvedEmbedConfig.keyboard"
          @graph-data-change="handleGraphDataChange"
        />
      </div>

      <DialogManager />
    </template>

    <!-- 预览模式：只有画布（只读） -->
    <template v-else>
      <div
        class="preview-container"
        :class="{ 'team-code-copy-touch': isTouchPreviewSurface }"
        :style="{ height: containerHeight }"
      >
        <div class="container" ref="previewContainerRef"></div>
        <div
          v-if="shouldRenderTeamCodeCopyOverlay"
          class="team-code-copy-layer"
          aria-hidden="false"
        >
          <div
            v-for="item in teamCodeCopyOverlayItems"
            :key="item.id"
            class="team-code-copy-target"
            :style="item.style"
          >
            <button
              class="team-code-copy-button"
              type="button"
              :aria-label="item.ariaLabel"
              @click.stop="copyTeamCode(item)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  getCurrentInstance,
} from "vue";
import ElementPlus from "element-plus";
import { createPinia, setActivePinia } from "pinia";
import LogicFlow from "@logicflow/core";
import "@logicflow/core/lib/style/index.css";
import "@logicflow/extension/lib/style/index.css";

import FlowEditor from "./components/flow/FlowEditor.vue";
import Toolbar from "./components/Toolbar.vue";
import ComponentsPanel from "./components/flow/ComponentsPanel.vue";
import DialogManager from "./components/DialogManager.vue";
import { useFilesStore } from "@/ts/useStore";
import { useSafeI18n } from "@/ts/useSafeI18n";
import {
  createLogicFlowScope,
  destroyLogicFlowInstance,
  getLogicFlowInstance,
  provideLogicFlowScope,
} from "@/ts/useLogicFlow";
import {
  registerFlowNodes,
  resolveFlowPlugins,
  type FlowCapabilityLevel,
  type FlowNodeRegistration,
  type FlowPlugin,
} from "./flowRuntime";
import { rewriteAssetUrlsDeep, setAssetBaseUrl } from "@/utils/assetUrl";
import {
  normalizeDynamicGroupMeta,
  type TeamCodeConfig,
} from "@/utils/graphSchema";

// 类型定义
export interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
}

export interface NodeData {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex?: number;
  properties?: Record<string, any>;
  text?: { value: string };
}

export interface EdgeData {
  id: string;
  type: string;
  sourceNodeId: string;
  targetNodeId: string;
  properties?: Record<string, any>;
}

const isPlainObject = (input: unknown): input is Record<string, any> =>
  !!input && typeof input === "object" && !Array.isArray(input);

const sanitizeLabelProperty = (
  properties: unknown,
): Record<string, any> | undefined => {
  if (!isPlainObject(properties)) {
    return undefined;
  }
  const nextProperties: Record<string, any> = { ...properties };
  if (Array.isArray(nextProperties._label)) {
    const normalizedLabels = nextProperties._label.filter(
      (label: any) =>
        isPlainObject(label) &&
        (label.id != null ||
          label.text != null ||
          label.value != null ||
          label.content != null),
    );
    if (normalizedLabels.length === 0) {
      delete nextProperties._label;
    } else {
      nextProperties._label = normalizedLabels;
    }
  }
  return nextProperties;
};

const sanitizeGraphData = (
  input?: GraphData | null,
  options?: { hideDynamicGroups?: boolean },
): GraphData => {
  if (!input || !Array.isArray(input.nodes) || !Array.isArray(input.edges)) {
    return { nodes: [], edges: [] };
  }

  const rawNodes = input.nodes
    .filter((node): node is NodeData => isPlainObject(node))
    .map((node) => {
      const nextNode: NodeData = { ...node };
      const nextProperties = sanitizeLabelProperty(nextNode.properties);
      if (nextProperties) {
        nextNode.properties = rewriteAssetUrlsDeep(nextProperties);
      }
      return nextNode;
    });

  const hiddenDynamicGroup = options?.hideDynamicGroups === true;
  const nodes = hiddenDynamicGroup
    ? rawNodes.filter((node) => node.type !== "dynamic-group")
    : rawNodes;
  const nodeIdSet = new Set(nodes.map((node) => node.id));

  const edges = input.edges
    .filter((edge): edge is EdgeData => isPlainObject(edge))
    .map((edge) => {
      const nextEdge: EdgeData = { ...edge };
      const nextProperties = sanitizeLabelProperty(nextEdge.properties);
      if (nextProperties) {
        nextEdge.properties = rewriteAssetUrlsDeep(nextProperties);
      }
      return nextEdge;
    })
    .filter(
      (edge) =>
        !hiddenDynamicGroup ||
        (nodeIdSet.has(edge.sourceNodeId) && nodeIdSet.has(edge.targetNodeId)),
    );

  return { nodes, edges };
};

const normalizeZIndex = (value: unknown): number | undefined => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return Math.trunc(parsed);
};

const applyNodeZIndexToInstance = (lfInstance: any, graphData: GraphData) => {
  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
  nodes.forEach((node) => {
    const nodeId = typeof node?.id === "string" ? node.id : "";
    if (!nodeId) return;
    const zIndex = normalizeZIndex(node?.zIndex);
    if (zIndex == null) return;
    const model = lfInstance.getNodeModelById?.(nodeId);
    model?.setZIndex?.(zIndex);
  });
};

const renderGraphDataWithLayer = (lfInstance: any, graphData: GraphData) => {
  lfInstance.render(graphData);
  applyNodeZIndexToInstance(lfInstance, graphData);
};

const collectGraphDataWithLayer = (lfInstance: any): GraphData | null => {
  if (!lfInstance || typeof lfInstance.getGraphRawData !== "function") {
    return null;
  }

  const graphData = lfInstance.getGraphRawData() as GraphData;
  if (!graphData || !Array.isArray(graphData.nodes)) {
    return { nodes: [], edges: [] };
  }

  const nodes = graphData.nodes.map((node) => {
    const nodeId = typeof node?.id === "string" ? node.id : "";
    const model = nodeId ? lfInstance.getNodeModelById?.(nodeId) : null;
    const modelZIndex = normalizeZIndex(model?.zIndex);
    const nodeZIndex = normalizeZIndex(node?.zIndex);
    const mergedZIndex = modelZIndex ?? nodeZIndex;
    if (mergedZIndex == null) {
      return { ...node };
    }
    return {
      ...node,
      zIndex: mergedZIndex,
    };
  });

  return {
    ...graphData,
    nodes,
    edges: Array.isArray(graphData.edges) ? graphData.edges : [],
  };
};

export interface EditorConfig {
  grid?: boolean;
  snapline?: boolean;
  keyboard?: boolean;
  theme?: "light" | "dark";
  locale?: "zh" | "ja" | "en";
  teamCodeCopy?: boolean | TeamCodeCopyConfig;
}

export interface TeamCodeCopyConfig {
  enabled?: boolean;
  visibility?: "auto" | "hover" | "always" | "hidden";
  exportHidden?: boolean;
}

// Props
const props = withDefaults(
  defineProps<{
    data?: GraphData;
    mode?: "preview" | "edit";
    capability?: FlowCapabilityLevel;
    width?: string | number;
    height?: string | number;
    showToolbar?: boolean;
    showPropertyPanel?: boolean;
    showComponentPanel?: boolean;
    config?: EditorConfig;
    plugins?: FlowPlugin[];
    nodeRegistrations?: FlowNodeRegistration[];
    assetBaseUrl?: string;
  }>(),
  {
    mode: "edit",
    width: "100%",
    height: "600px",
    showToolbar: true,
    showPropertyPanel: true,
    showComponentPanel: true,
    config: () => ({
      grid: true,
      snapline: true,
      keyboard: true,
      theme: "light",
      locale: "zh",
    }),
  },
);

// Emits
const emit = defineEmits<{
  "update:data": [data: GraphData];
  save: [data: GraphData];
  cancel: [];
  error: [error: Error];
}>();

// 创建局部 Pinia 实例（状态隔离）
const localPinia = createPinia();
setActivePinia(localPinia);
const logicFlowScope = provideLogicFlowScope(createLogicFlowScope());
const filesStore = useFilesStore(localPinia);
filesStore.bindLogicFlowScope(logicFlowScope);

const ensureElementPlusInstalled = () => {
  const instance = getCurrentInstance();
  const app = instance?.appContext?.app as any;
  if (!app) return;

  if (app.config?.globalProperties?.$ELEMENT) {
    return;
  }

  if (app.__ONMYOJI_FLOW_ELEMENT_PLUS_INSTALLED__) {
    return;
  }

  const installedPlugins = app._context?.plugins;
  if (installedPlugins?.has?.(ElementPlus)) {
    app.__ONMYOJI_FLOW_ELEMENT_PLUS_INSTALLED__ = true;
    return;
  }

  try {
    app.use(ElementPlus);
    app.__ONMYOJI_FLOW_ELEMENT_PLUS_INSTALLED__ = true;
  } catch {
    // 忽略重复安装或宿主限制导致的异常
  }
};
ensureElementPlusInstalled();

// Refs
const flowEditorRef = ref<InstanceType<typeof FlowEditor>>();
const previewContainerRef = ref<HTMLElement | null>(null);
const previewLf = ref<LogicFlow | null>(null);
const embedRootRef = ref<HTMLElement | null>(null);
const toolbarHostRef = ref<HTMLElement | null>(null);
const previewTransformVersion = ref(0);
const isTouchPreviewSurface = ref(false);
let embedResizeObserver: ResizeObserver | null = null;
const editorContentHeight = ref("100%");

// Computed
const effectiveCapability = computed<FlowCapabilityLevel>(() => {
  if (props.capability) {
    return props.capability;
  }
  return props.mode === "preview" ? "render-only" : "interactive";
});

const containerStyle = computed(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
  height: typeof props.height === "number" ? `${props.height}px` : props.height,
}));

const containerHeight = computed(() => {
  return typeof props.height === "number" ? `${props.height}px` : props.height;
});

const editorContentStyle = computed(() => ({
  height: editorContentHeight.value,
}));

const resolvedEmbedConfig = computed(() => ({
  grid: props.config?.grid ?? true,
  snapline: props.config?.snapline ?? true,
  keyboard: props.config?.keyboard ?? true,
}));

const resolvedTeamCodeCopyConfig = computed<Required<TeamCodeCopyConfig>>(
  () => {
    const raw = props.config?.teamCodeCopy;
    if (raw === true) {
      return {
        enabled: true,
        visibility: "auto",
        exportHidden: true,
      };
    }
    if (!raw) {
      return {
        enabled: false,
        visibility: "auto",
        exportHidden: true,
      };
    }
    return {
      enabled: raw.enabled === true,
      visibility: raw.visibility || "auto",
      exportHidden: raw.exportHidden !== false,
    };
  },
);

const shouldRenderTeamCodeCopyOverlay = computed(() => {
  const config = resolvedTeamCodeCopyConfig.value;
  return (
    props.mode === "preview" &&
    config.enabled &&
    config.visibility !== "hidden" &&
    teamCodeCopyOverlayItems.value.length > 0
  );
});

const { setLocale: setSafeLocale } = useSafeI18n();
const normalizeEmbedLocale = (
  input: unknown,
): EditorConfig["locale"] | null => {
  if (typeof input !== "string") {
    return null;
  }
  const normalized = input.trim().toLowerCase().split("-")[0];
  if (normalized === "ja") return "ja";
  if (normalized === "en") return "en";
  if (normalized === "zh") return "zh";
  return null;
};
const syncEmbedLocale = (localeInput: unknown) => {
  const normalized = normalizeEmbedLocale(localeInput);
  if (!normalized) {
    return;
  }
  setSafeLocale(normalized);
};
syncEmbedLocale(props.config?.locale);

type TeamCodeOverlayItem = {
  id: string;
  label: string;
  ariaLabel: string;
  code: string;
  style: {
    left: string;
    top: string;
    width: string;
    height: string;
  };
};

const normalizeNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveTeamCodeToCopy = (teamCode?: TeamCodeConfig): string => {
  if (!teamCode?.enabled) {
    return "";
  }
  const shortCode = teamCode.shortCode.trim();
  const longCode = teamCode.longCode.trim();
  if (teamCode.preferred === "short" && shortCode) {
    return shortCode;
  }
  return longCode || shortCode;
};

const readPreviewTransform = () => {
  previewTransformVersion.value;
  const transform = getTransform();
  return {
    scaleX: normalizeNumber(transform?.SCALE_X, 1),
    scaleY: normalizeNumber(transform?.SCALE_Y, 1),
    translateX: normalizeNumber(transform?.TRANSLATE_X, 0),
    translateY: normalizeNumber(transform?.TRANSLATE_Y, 0),
  };
};

const teamCodeCopyOverlayItems = computed<TeamCodeOverlayItem[]>(() => {
  if (props.mode !== "preview" || !resolvedTeamCodeCopyConfig.value.enabled) {
    return [];
  }
  const graphData = props.data;
  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
  const transform = readPreviewTransform();

  return nodes
    .filter((node) => node?.type === "dynamic-group")
    .map((node) => {
      const groupMeta = normalizeDynamicGroupMeta(node.properties?.groupMeta);
      if (groupMeta.groupKind !== "team") {
        return null;
      }
      const code = resolveTeamCodeToCopy(groupMeta.teamCode);
      if (!code) {
        return null;
      }

      const width = normalizeNumber(node.properties?.width ?? node.width, 420);
      const height = normalizeNumber(
        node.properties?.height ?? node.height,
        250,
      );
      const left = (normalizeNumber(node.x, 0) - width / 2) * transform.scaleX;
      const top = (normalizeNumber(node.y, 0) - height / 2) * transform.scaleY;
      const label = groupMeta.teamCode?.label || "复制阵容码";
      const groupName = groupMeta.groupName || label;

      return {
        id: String(node.id),
        label,
        ariaLabel: `复制${groupName}阵容码`,
        code,
        style: {
          left: `${left + transform.translateX}px`,
          top: `${top + transform.translateY}px`,
          width: `${width * transform.scaleX}px`,
          height: `${height * transform.scaleY}px`,
        },
      };
    })
    .filter((item): item is TeamCodeOverlayItem => !!item);
});

const updatePreviewSurfaceKind = () => {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    isTouchPreviewSurface.value = false;
    return;
  }
  isTouchPreviewSurface.value = window.matchMedia("(hover: none)").matches;
};

const refreshPreviewOverlayPosition = () => {
  previewTransformVersion.value += 1;
};

const writeTextToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

const copyTeamCode = async (item: TeamCodeOverlayItem) => {
  try {
    await writeTextToClipboard(item.code);
  } catch (error) {
    emit("error", error as Error);
  }
};

const recalcEditContentHeight = () => {
  if (props.mode !== "edit") {
    return;
  }
  const root = embedRootRef.value;
  if (!root) {
    return;
  }
  const rootHeight = root.clientHeight;
  const toolbarHeight = props.showToolbar
    ? (toolbarHostRef.value?.offsetHeight ?? 0)
    : 0;
  const contentHeight = Math.max(0, rootHeight - toolbarHeight);
  if (contentHeight > 0) {
    editorContentHeight.value = `${contentHeight}px`;
  } else {
    editorContentHeight.value = "100%";
  }
};

const triggerEditorResize = () => {
  nextTick(() => {
    recalcEditContentHeight();
    const editor = flowEditorRef.value as any;
    editor?.resizeCanvas?.();
  });
};

const handleEmbedResize = () => {
  if (props.mode === "edit") {
    recalcEditContentHeight();
    triggerEditorResize();
    return;
  }

  if (
    props.mode === "preview" &&
    previewLf.value &&
    previewContainerRef.value
  ) {
    const width = previewContainerRef.value.offsetWidth;
    const height = previewContainerRef.value.offsetHeight;
    previewLf.value.resize(width, height);
    refreshPreviewOverlayPosition();
  }
};

const setupEmbedResizeObserver = () => {
  if (typeof ResizeObserver === "undefined" || !embedRootRef.value) {
    return;
  }

  embedResizeObserver?.disconnect();
  embedResizeObserver = new ResizeObserver(() => {
    handleEmbedResize();
  });
  embedResizeObserver.observe(embedRootRef.value);
};

const destroyPreviewMode = () => {
  if (previewLf.value) {
    previewLf.value.destroy();
    previewLf.value = null;
  }
  refreshPreviewOverlayPosition();
};

// 初始化预览模式的 LogicFlow
const initPreviewMode = () => {
  if (!previewContainerRef.value) return;

  destroyPreviewMode();
  const isRenderOnly = effectiveCapability.value === "render-only";

  // 创建 LogicFlow 实例（只读模式）
  previewLf.value = new LogicFlow({
    container: previewContainerRef.value,
    width: previewContainerRef.value.offsetWidth,
    height: previewContainerRef.value.offsetHeight,
    grid: false,
    keyboard: {
      enabled: !isRenderOnly,
    },
    // render-only 模式禁用所有交互能力
    isSilentMode: isRenderOnly,
    stopScrollGraph: isRenderOnly,
    stopZoomGraph: isRenderOnly,
    stopMoveGraph: isRenderOnly,
    adjustNodePosition: !isRenderOnly,
    plugins: resolveFlowPlugins(effectiveCapability.value, props.plugins),
  });

  // 注册节点（支持外部注入）
  registerFlowNodes(previewLf.value, props.nodeRegistrations);
  previewLf.value.on?.("graph:rendered", refreshPreviewOverlayPosition);
  previewLf.value.on?.("graph:transform", refreshPreviewOverlayPosition);
  previewLf.value.on?.("blank:mousewheel", refreshPreviewOverlayPosition);

  // 渲染数据
  if (props.data) {
    const safeData = sanitizeGraphData(props.data, { hideDynamicGroups: true });
    renderGraphDataWithLayer(previewLf.value, safeData);
  }
  nextTick(refreshPreviewOverlayPosition);
};

// Methods
const handleSave = () => {
  try {
    const data = getGraphData();
    if (data) {
      emit("save", data);
    }
  } catch (error) {
    emit("error", error as Error);
  }
};

const handleCancel = () => {
  emit("cancel");
};

const handleGraphDataChange = (graphData: GraphData) => {
  const latestData = getGraphData();
  emit("update:data", latestData ?? graphData);
};

// 公开方法（供父组件调用）
const getGraphData = (): GraphData | null => {
  if (props.mode === "edit") {
    const lfInstance = getLogicFlowInstance(logicFlowScope);
    if (lfInstance) {
      return collectGraphDataWithLayer(lfInstance);
    }
  } else if (props.mode === "preview" && previewLf.value) {
    return collectGraphDataWithLayer(previewLf.value);
  }
  return null;
};

const setGraphData = (data: GraphData) => {
  const safeData = sanitizeGraphData(data, {
    hideDynamicGroups: props.mode === "preview",
  });
  if (props.mode === "edit") {
    const lfInstance = getLogicFlowInstance(logicFlowScope);
    if (lfInstance) {
      renderGraphDataWithLayer(lfInstance, safeData);
    }
  } else if (props.mode === "preview" && previewLf.value) {
    renderGraphDataWithLayer(previewLf.value, safeData);
    nextTick(refreshPreviewOverlayPosition);
  }
};

const resolveActiveLogicFlow = (): any => {
  if (props.mode === "preview") {
    return previewLf.value;
  }
  return getLogicFlowInstance(logicFlowScope);
};

const hasRenderableGraphNodes = (lfInstance: any): boolean => {
  const graphData = collectGraphDataWithLayer(lfInstance);
  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
  return nodes.length > 0;
};

const fitView = (
  verticalOffset?: number,
  horizontalOffset?: number,
): boolean => {
  const lfInstance = resolveActiveLogicFlow();
  if (!lfInstance || typeof lfInstance.fitView !== "function") {
    return false;
  }
  if (!hasRenderableGraphNodes(lfInstance)) {
    return false;
  }
  const host = embedRootRef.value;
  if (!host || host.clientWidth <= 0 || host.clientHeight <= 0) {
    return false;
  }
  if (
    typeof verticalOffset === "number" ||
    typeof horizontalOffset === "number"
  ) {
    lfInstance.fitView(verticalOffset, horizontalOffset);
  } else {
    lfInstance.fitView();
  }
  return true;
};

const zoom = (
  zoomSize?: number | boolean,
  point?: [number, number],
): boolean => {
  const lfInstance = resolveActiveLogicFlow();
  if (!lfInstance || typeof lfInstance.zoom !== "function") {
    return false;
  }
  lfInstance.zoom(zoomSize, point);
  return true;
};

const resetZoom = (): boolean => {
  const lfInstance = resolveActiveLogicFlow();
  if (!lfInstance || typeof lfInstance.resetZoom !== "function") {
    return false;
  }
  lfInstance.resetZoom();
  return true;
};

const resetTranslate = (): boolean => {
  const lfInstance = resolveActiveLogicFlow();
  if (!lfInstance || typeof lfInstance.resetTranslate !== "function") {
    return false;
  }
  lfInstance.resetTranslate();
  return true;
};

const translateCenter = (): boolean => {
  const lfInstance = resolveActiveLogicFlow();
  if (!lfInstance || typeof lfInstance.translateCenter !== "function") {
    return false;
  }
  if (!hasRenderableGraphNodes(lfInstance)) {
    return false;
  }
  const host = embedRootRef.value;
  if (!host || host.clientWidth <= 0 || host.clientHeight <= 0) {
    return false;
  }
  lfInstance.translateCenter();
  return true;
};

const getTransform = (): Record<string, number> | null => {
  const lfInstance = resolveActiveLogicFlow();
  if (!lfInstance || typeof lfInstance.getTransform !== "function") {
    return null;
  }
  return lfInstance.getTransform();
};

defineExpose({
  getGraphData,
  setGraphData,
  resizeCanvas: triggerEditorResize,
  fitView,
  zoom,
  resetZoom,
  resetTranslate,
  translateCenter,
  getTransform,
});

// 监听 data 变化
watch(
  () => props.data,
  (newData) => {
    if (newData) {
      setGraphData(newData);
    }
  },
  { deep: true },
);

watch(
  () => props.config?.locale,
  (nextLocale) => {
    syncEmbedLocale(nextLocale);
  },
  { immediate: true },
);

watch(
  () => props.assetBaseUrl,
  (value) => {
    setAssetBaseUrl(value);
  },
  { immediate: true },
);

// 监听模式变化
watch(
  () => props.mode,
  (newMode) => {
    if (newMode === "preview") {
      // 切换到预览模式，初始化预览 LogicFlow
      setTimeout(() => {
        initPreviewMode();
      }, 100);
    } else {
      destroyPreviewMode();
      recalcEditContentHeight();
      triggerEditorResize();
    }
    setupEmbedResizeObserver();
  },
);

watch(
  [() => props.capability, () => props.plugins, () => props.nodeRegistrations],
  () => {
    if (props.mode === "preview") {
      setTimeout(() => {
        initPreviewMode();
      }, 0);
    }
  },
  { deep: true },
);

watch(
  [
    () => props.width,
    () => props.height,
    () => props.showToolbar,
    () => props.showComponentPanel,
  ],
  () => {
    if (props.mode === "edit") {
      recalcEditContentHeight();
      triggerEditorResize();
    }
  },
);

// 初始化
onMounted(() => {
  updatePreviewSurfaceKind();
  setupEmbedResizeObserver();
  if (props.mode === "preview") {
    initPreviewMode();
  } else if (props.mode === "edit") {
    recalcEditContentHeight();
    triggerEditorResize();
    // 编辑模式由 FlowEditor 组件初始化
    // 等待 FlowEditor 初始化完成后加载数据
    setTimeout(() => {
      if (props.data) {
        setGraphData(props.data);
      }
      recalcEditContentHeight();
      triggerEditorResize();
    }, 500);
  }
});

// 清理
onBeforeUnmount(() => {
  embedResizeObserver?.disconnect();
  embedResizeObserver = null;
  destroyPreviewMode();
  destroyLogicFlowInstance(logicFlowScope);
});
</script>

<style scoped>
.yys-editor-embed {
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.editor-content {
  display: flex;
  flex: 1;
  min-height: 0;
  height: 0;
  overflow: hidden;
}

.flow-editor-pane {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  align-self: stretch;
}

.toolbar-host {
  flex: 0 0 auto;
}

.preview-mode {
  background: transparent;
}

.preview-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.preview-container .container {
  width: 100%;
  height: 100%;
}

/* 预览模式下隐藏所有控制元素 */
.preview-mode :deep(.lf-control),
.preview-mode :deep(.lf-mini-map),
.preview-mode :deep(.lf-menu) {
  display: none !important;
}

/* 预览模式下禁用鼠标交互 */
.preview-mode :deep(.lf-canvas-overlay) {
  pointer-events: none;
}

.team-code-copy-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.team-code-copy-target {
  position: absolute;
  pointer-events: auto;
}

.team-code-copy-button {
  position: absolute;
  top: 8px;
  right: 8px;
  border: 1px solid rgba(48, 49, 51, 0.18);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.94);
  color: #303133;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  opacity: 0;
  padding: 7px 9px;
  pointer-events: auto;
  transition:
    opacity 0.16s ease,
    background-color 0.16s ease,
    border-color 0.16s ease;
  white-space: nowrap;
}

.team-code-copy-button:hover,
.team-code-copy-button:focus-visible {
  background: #ffffff;
  border-color: rgba(64, 158, 255, 0.55);
  outline: none;
}

.team-code-copy-target:hover .team-code-copy-button,
.team-code-copy-target:focus-within .team-code-copy-button,
.team-code-copy-touch .team-code-copy-button {
  opacity: 1;
}
</style>
