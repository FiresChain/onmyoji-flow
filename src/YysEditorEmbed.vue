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
        <Toolbar :is-embed="true" @save="handleSave" @cancel="handleCancel" />
      </div>

      <!-- 主内容区 -->
      <div class="editor-content" :style="editorContentStyle">
        <!-- 左侧组件库 -->
        <NodePalette v-if="showComponentPanel" />

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

      <EditorDialogHost />
    </template>

    <!-- 预览模式：只有画布（只读） -->
    <template v-else>
      <div class="preview-container" :style="{ height: containerHeight }">
        <div class="container" ref="previewContainerRef"></div>
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
  onUnmounted,
  nextTick,
  getCurrentInstance,
} from "vue";
import ElementPlus from "element-plus";
import { createPinia, getActivePinia, setActivePinia } from "pinia";
import type LogicFlow from "@logicflow/core";
import "@logicflow/core/lib/style/index.css";
import "@logicflow/extension/lib/style/index.css";

import FlowEditor from "./editor/components/FlowEditor.vue";
import Toolbar from "./components/Toolbar.vue";
import NodePalette from "./editor/components/NodePalette.vue";
import EditorDialogHost from "./editor/components/EditorDialogHost.vue";
import { createEditorContext } from "@/editor/context/EditorContext";
import { provideEditorContext } from "@/editor/context/useEditorContext";
import {
  createMemoryFilesPersistence,
  createWorkspaceSession,
  provideWorkspaceSession,
  useFilesStore,
} from "@/features/workspace/public";
import { normalizeGraph } from "@/core/document/normalizeGraph";
import type {
  GraphData,
  GraphEdge as EdgeData,
  GraphNode as NodeData,
} from "@/core/document/types";
import { createLogicFlowRuntime } from "@/core/logicflow/createRuntime";
import { captureGraphData, renderGraphData } from "@/core/logicflow/graphIO";
import { type FlowCapabilityLevel } from "@/core/logicflow/types";
import type { FlowNodeRegistration, FlowPlugin } from "@/flowRuntime";
import type {
  FlowNodeRegistration as CoreFlowNodeRegistration,
  FlowPlugin as CoreFlowPlugin,
} from "@/core/logicflow/types";
import {
  centerViewport,
  fitView as fitViewport,
  getViewport,
  resetViewportTranslate,
  resetViewportZoom,
  zoomViewport,
} from "@/core/logicflow/viewport";
import { getDefaultNodeRegistrations } from "@/editor/node-types/registry";
import {
  getAssetBaseUrl,
  rewriteAssetUrlsDeepWithResolver,
} from "@/features/assets/public";

export type {
  GraphData,
  GraphEdge as EdgeData,
  GraphNode as NodeData,
} from "@/core/document/types";

const PINIA_MISSING_INJECTION_WARNING = 'injection "Symbol(pinia)" not found';

const getActivePiniaForEmbed = () => {
  const appConfig = getCurrentInstance()?.appContext.config;
  if (!appConfig) {
    return getActivePinia();
  }

  // Pinia 3 probes injection before returning its global active instance.
  const previousWarnHandler = appConfig.warnHandler;
  appConfig.warnHandler = (message, instance, trace) => {
    if (message.includes(PINIA_MISSING_INJECTION_WARNING)) {
      return;
    }
    previousWarnHandler?.(message, instance, trace);
  };
  try {
    return getActivePinia();
  } finally {
    appConfig.warnHandler = previousWarnHandler;
  }
};

const sanitizeGraphData = (
  input?: GraphData | null,
  options?: { hideDynamicGroups?: boolean },
  resolveAsset?: (path: string) => string,
): GraphData => {
  const graphData = normalizeGraph(input, options);
  const rewriteAssetUrls = <T,>(value: T): T =>
    resolveAsset
      ? rewriteAssetUrlsDeepWithResolver(value, (assetValue) =>
          typeof assetValue === "string"
            ? resolveAsset(assetValue)
            : assetValue,
        )
      : value;
  return {
    ...graphData,
    nodes: graphData.nodes.map(
      (node): NodeData => ({
        ...node,
        ...(node.properties
          ? { properties: rewriteAssetUrls(node.properties) }
          : {}),
      }),
    ),
    edges: graphData.edges.map(
      (edge): EdgeData => ({
        ...edge,
        ...(edge.properties
          ? { properties: rewriteAssetUrls(edge.properties) }
          : {}),
      }),
    ),
  };
};

export interface EditorConfig {
  grid?: boolean;
  snapline?: boolean;
  keyboard?: boolean;
  theme?: "light" | "dark";
  locale?: "zh" | "ja" | "en";
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

const initialAssetBaseUrl = props.assetBaseUrl ?? getAssetBaseUrl();
const editorContext = provideEditorContext(
  createEditorContext({
    locale: props.config?.locale ?? "zh",
    assetBaseUrl: initialAssetBaseUrl,
    settings: {
      snapGridEnabled: props.config?.grid ?? true,
      snaplineEnabled: props.config?.snapline ?? true,
      keyboardEnabled: props.config?.keyboard ?? true,
    },
  }),
);

// Explicit Pinia creation is wrapped so the host's active Pinia is restored.
const activePiniaBeforeEmbed = getActivePiniaForEmbed();
const localPinia = createPinia();
let filesStore: ReturnType<typeof useFilesStore>;
try {
  filesStore = useFilesStore(localPinia);
} finally {
  setActivePinia(activePiniaBeforeEmbed);
}
const workspaceSession = provideWorkspaceSession(
  createWorkspaceSession({
    store: filesStore,
    persistence: createMemoryFilesPersistence(),
    getEditorPort: () => editorContext.port.value,
    pinia: localPinia,
    restoreActivePinia: activePiniaBeforeEmbed,
  }),
);
workspaceSession.initialize();

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
let embedResizeObserver: ResizeObserver | null = null;
let disposePreviewRuntime: (() => void) | null = null;
const pendingTimers = new Set<ReturnType<typeof setTimeout>>();
const editorContentHeight = ref("100%");

const scheduleEmbedTask = (task: () => void, delay: number) => {
  const timer = setTimeout(() => {
    pendingTimers.delete(timer);
    task();
  }, delay);
  pendingTimers.add(timer);
};

const disposeEmbedTasks = () => {
  pendingTimers.forEach((timer) => clearTimeout(timer));
  pendingTimers.clear();
};

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
  editorContext.setLocale(normalized);
};
syncEmbedLocale(props.config?.locale);

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
  disposePreviewRuntime?.();
  disposePreviewRuntime = null;
  previewLf.value = null;
};

// 初始化预览模式的 LogicFlow
const initPreviewMode = () => {
  if (!previewContainerRef.value) return;

  destroyPreviewMode();
  const isRenderOnly = effectiveCapability.value === "render-only";

  const initialData = props.data
    ? sanitizeGraphData(
        props.data,
        { hideDynamicGroups: true },
        editorContext.resolveAssetUrl,
      )
    : undefined;
  const runtime = createLogicFlowRuntime({
    container: previewContainerRef.value,
    capability: effectiveCapability.value,
    plugins: props.plugins as CoreFlowPlugin[] | undefined,
    nodeRegistrations: props.nodeRegistrations as
      | CoreFlowNodeRegistration[]
      | undefined,
    defaultNodeRegistrations: getDefaultNodeRegistrations(),
    logicFlowOptions: {
      width: previewContainerRef.value.offsetWidth,
      height: previewContainerRef.value.offsetHeight,
      grid: false,
      keyboard: {
        enabled: !isRenderOnly,
      },
      isSilentMode: isRenderOnly,
      stopScrollGraph: isRenderOnly,
      stopZoomGraph: isRenderOnly,
      stopMoveGraph: isRenderOnly,
      adjustNodePosition: !isRenderOnly,
    },
  });
  editorContext.setRuntime(runtime);
  if (initialData) {
    runtime.port.render(initialData);
  }
  previewLf.value = runtime.instance;
  disposePreviewRuntime = () => {
    editorContext.clearRuntime(runtime);
  };
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
  return editorContext.port.value?.capture() ?? null;
};

const setGraphData = (data: GraphData) => {
  const safeData = sanitizeGraphData(
    data,
    {
      hideDynamicGroups: props.mode === "preview",
    },
    editorContext.resolveAssetUrl,
  );
  editorContext.port.value?.render(safeData);
};

const resolveActiveLogicFlow = (): any => {
  if (props.mode === "preview") {
    return previewLf.value;
  }
  return editorContext.runtime.value?.instance ?? null;
};

const hasRenderableGraphNodes = (lfInstance: any): boolean => {
  const graphData = captureGraphData(lfInstance);
  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
  return nodes.length > 0;
};

const fitView = (
  verticalOffset?: number,
  horizontalOffset?: number,
): boolean => {
  const lfInstance = resolveActiveLogicFlow();
  if (!lfInstance) {
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
    fitViewport(lfInstance, verticalOffset, horizontalOffset);
  } else {
    fitViewport(lfInstance);
  }
  return true;
};

const zoom = (
  zoomSize?: number | boolean,
  point?: [number, number],
): boolean => {
  const lfInstance = resolveActiveLogicFlow();
  return lfInstance ? zoomViewport(lfInstance, zoomSize, point) : false;
};

const resetZoom = (): boolean => {
  const lfInstance = resolveActiveLogicFlow();
  return lfInstance ? resetViewportZoom(lfInstance) : false;
};

const resetTranslate = (): boolean => {
  const lfInstance = resolveActiveLogicFlow();
  return lfInstance ? resetViewportTranslate(lfInstance) : false;
};

const translateCenter = (): boolean => {
  const lfInstance = resolveActiveLogicFlow();
  if (!lfInstance) {
    return false;
  }
  if (!hasRenderableGraphNodes(lfInstance)) {
    return false;
  }
  const host = embedRootRef.value;
  if (!host || host.clientWidth <= 0 || host.clientHeight <= 0) {
    return false;
  }
  return centerViewport(lfInstance);
};

const getTransform = (): Record<string, number> | null => {
  const lfInstance = resolveActiveLogicFlow();
  if (!lfInstance) {
    return null;
  }
  return getViewport(lfInstance) as Record<string, number>;
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
    editorContext.setAssetBaseUrl(value ?? initialAssetBaseUrl);
  },
  { immediate: true },
);

// 监听模式变化
watch(
  () => props.mode,
  (newMode) => {
    if (newMode === "preview") {
      // 切换到预览模式，初始化预览 LogicFlow
      scheduleEmbedTask(() => {
        if (props.mode === "preview") {
          initPreviewMode();
        }
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
      scheduleEmbedTask(() => {
        if (props.mode === "preview") {
          initPreviewMode();
        }
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
  setupEmbedResizeObserver();
  if (props.mode === "preview") {
    initPreviewMode();
  } else if (props.mode === "edit") {
    recalcEditContentHeight();
    triggerEditorResize();
    // 编辑模式由 FlowEditor 组件初始化
    // 等待 FlowEditor 初始化完成后加载数据
    scheduleEmbedTask(() => {
      if (props.mode !== "edit") {
        return;
      }
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
  workspaceSession.dispose();
  disposeEmbedTasks();
  embedResizeObserver?.disconnect();
  embedResizeObserver = null;
  destroyPreviewMode();
});

onUnmounted(() => {
  editorContext.dispose();
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
</style>
