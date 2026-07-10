<template>
  <div
    ref="embedRootRef"
    class="yys-editor-embed"
    :class="{
      'preview-mode': props.mode === 'preview',
      'edit-mode': props.mode === 'edit',
    }"
    :style="containerStyle"
  >
    <template v-if="props.mode === 'edit'">
      <div v-if="props.showToolbar" ref="toolbarHostRef" class="toolbar-host">
        <EditorToolbar
          :is-embed="true"
          @save="handleSave"
          @cancel="handleCancel"
        />
      </div>

      <div class="editor-content" :style="editorContentStyle">
        <NodePalette v-if="props.showComponentPanel" />
        <FlowEditor
          class="flow-editor-pane"
          :height="editorContentHeight"
          :enable-label="false"
          :show-property-panel="props.showPropertyPanel"
          :config-snap-grid-enabled="resolvedEmbedConfig.grid"
          :config-snapline-enabled="resolvedEmbedConfig.snapline"
          :config-keyboard-enabled="resolvedEmbedConfig.keyboard"
          @graph-data-change="handleGraphDataChange"
        />
      </div>

      <EditorDialogHost />
    </template>

    <PreviewCanvas
      v-else
      :height="containerHeight"
      :capability="effectiveCapability"
      :plugins="props.plugins"
      :node-registrations="props.nodeRegistrations"
      @ready="handlePreviewReady"
    />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";
import ElementPlus from "element-plus";
import { createPinia, getActivePinia, setActivePinia } from "pinia";

import type { GraphData } from "@/core/document/types";
import type { FlowCapabilityLevel } from "@/core/logicflow/types";
import FlowEditor from "@/editor/components/FlowEditor.vue";
import EditorDialogHost from "@/editor/components/EditorDialogHost.vue";
import NodePalette from "@/editor/components/NodePalette.vue";
import { createEditorContext } from "@/editor/context/EditorContext";
import { provideEditorContext } from "@/editor/context/useEditorContext";
import { getAssetBaseUrl } from "@/features/assets/public";
import { parseEditorLocale } from "@/features/locale/public";
import {
  createMemoryFilesPersistence,
  createWorkspaceSession,
  provideWorkspaceSession,
  useFilesStore,
} from "@/features/workspace/public";
import EditorToolbar from "@/shells/common/EditorToolbar.vue";
import PreviewCanvas from "./PreviewCanvas.vue";
import { useEmbedDataSync } from "./composables/useEmbedDataSync";
import { useEmbedResize } from "./composables/useEmbedResize";
import { useEmbedViewport } from "./composables/useEmbedViewport";
import type { EmbedEditorShellExpose, EmbedEditorShellProps } from "./types";

const PINIA_MISSING_INJECTION_WARNING = 'injection "Symbol(pinia)" not found';

const getActivePiniaForEmbed = () => {
  const appConfig = getCurrentInstance()?.appContext.config;
  if (!appConfig) return getActivePinia();

  const previousWarnHandler = appConfig.warnHandler;
  appConfig.warnHandler = (message, instance, trace) => {
    if (message.includes(PINIA_MISSING_INJECTION_WARNING)) return;
    previousWarnHandler?.(message, instance, trace);
  };
  try {
    return getActivePinia();
  } finally {
    appConfig.warnHandler = previousWarnHandler;
  }
};

const props = withDefaults(defineProps<EmbedEditorShellProps>(), {
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
});

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
  const app = getCurrentInstance()?.appContext.app as any;
  if (!app || app.config?.globalProperties?.$ELEMENT) return;
  if (app.__ONMYOJI_FLOW_ELEMENT_PLUS_INSTALLED__) return;

  const installedPlugins = app._context?.plugins;
  if (installedPlugins?.has?.(ElementPlus)) {
    app.__ONMYOJI_FLOW_ELEMENT_PLUS_INSTALLED__ = true;
    return;
  }

  try {
    app.use(ElementPlus);
    app.__ONMYOJI_FLOW_ELEMENT_PLUS_INSTALLED__ = true;
  } catch {
    // The host may reject a repeated plugin installation.
  }
};
ensureElementPlusInstalled();

const embedRootRef = ref<HTMLElement | null>(null);
const toolbarHostRef = ref<HTMLElement | null>(null);

const effectiveCapability = computed<FlowCapabilityLevel>(
  () =>
    props.capability ??
    (props.mode === "preview" ? "render-only" : "interactive"),
);
const containerStyle = computed(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
  height: typeof props.height === "number" ? `${props.height}px` : props.height,
}));
const containerHeight = computed(() =>
  typeof props.height === "number" ? `${props.height}px` : props.height,
);
const resolvedEmbedConfig = computed(() => ({
  grid: props.config?.grid ?? true,
  snapline: props.config?.snapline ?? true,
  keyboard: props.config?.keyboard ?? true,
}));

const dataSync = useEmbedDataSync({
  data: () => props.data,
  mode: () => props.mode,
  port: editorContext.port,
  resolveAssetUrl: editorContext.resolveAssetUrl,
  emitUpdate: (data) => emit("update:data", data),
});
const embedResize = useEmbedResize({
  root: embedRootRef,
  toolbarHost: toolbarHostRef,
  port: editorContext.port,
  mode: () => props.mode,
  showToolbar: () => props.showToolbar,
  width: () => props.width,
  height: () => props.height,
  showComponentPanel: () => props.showComponentPanel,
});
const viewport = useEmbedViewport({
  root: embedRootRef,
  port: editorContext.port,
});
const editorContentHeight = embedResize.editorContentHeight;
const editorContentStyle = computed(() => ({
  height: editorContentHeight.value,
}));

const syncEmbedLocale = (input: unknown) => {
  const locale = parseEditorLocale(input);
  if (locale) editorContext.setLocale(locale);
};

watch(() => props.config?.locale, syncEmbedLocale, { immediate: true });
watch(
  () => props.assetBaseUrl,
  (value) => editorContext.setAssetBaseUrl(value ?? initialAssetBaseUrl),
  { immediate: true },
);

const handleSave = () => {
  try {
    const data = dataSync.getGraphData();
    if (data) emit("save", data);
  } catch (error) {
    emit("error", error as Error);
  }
};
const handleCancel = () => emit("cancel");
const handleGraphDataChange = (graphData: GraphData) =>
  dataSync.handleGraphDataChange(graphData);
const handlePreviewReady = () => {
  dataSync.syncDataToPort();
  embedResize.resizeCanvas();
};

const exposed: EmbedEditorShellExpose = {
  getGraphData: dataSync.getGraphData,
  setGraphData: dataSync.setGraphData,
  resizeCanvas: embedResize.resizeCanvas,
  fitView: viewport.fitView,
  zoom: viewport.zoom,
  resetZoom: viewport.resetZoom,
  resetTranslate: viewport.resetTranslate,
  translateCenter: viewport.translateCenter,
  getTransform: viewport.getTransform,
};
defineExpose(exposed);

onMounted(() => {
  embedResize.mountResizeObserver();
});

onBeforeUnmount(() => {
  workspaceSession.dispose();
  dataSync.dispose();
  embedResize.dispose();
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

.preview-mode :deep(.lf-control),
.preview-mode :deep(.lf-mini-map),
.preview-mode :deep(.lf-menu) {
  display: none !important;
}

.preview-mode :deep(.lf-canvas-overlay) {
  pointer-events: none;
}
</style>
