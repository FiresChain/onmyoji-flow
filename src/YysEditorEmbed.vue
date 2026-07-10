<template>
  <EmbedEditorShell
    ref="shellRef"
    v-bind="props"
    @update:data="emit('update:data', $event)"
    @save="emit('save', $event)"
    @cancel="emit('cancel')"
    @error="emit('error', $event)"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";

import type { GraphData } from "@/core/document/types";
import type { FlowCapabilityLevel } from "@/core/logicflow/types";
import type { FlowNodeRegistration, FlowPlugin } from "@/flowRuntime";
import EmbedEditorShell from "@/shells/embed/EmbedEditorShell.vue";
import type {
  EmbedEditorConfig,
  EmbedEditorShellExpose,
} from "@/shells/embed/types";

export type {
  GraphData,
  GraphEdge as EdgeData,
  GraphNode as NodeData,
} from "@/core/document/types";

export interface EditorConfig extends EmbedEditorConfig {}

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

const emit = defineEmits<{
  "update:data": [data: GraphData];
  save: [data: GraphData];
  cancel: [];
  error: [error: Error];
}>();

const shellRef = ref<EmbedEditorShellExpose | null>(null);

const getGraphData = (): GraphData | null =>
  shellRef.value?.getGraphData() ?? null;
const setGraphData = (data: GraphData): void => {
  shellRef.value?.setGraphData(data);
};
const resizeCanvas = (): void => {
  shellRef.value?.resizeCanvas();
};
const fitView = (verticalOffset?: number, horizontalOffset?: number): boolean =>
  shellRef.value?.fitView(verticalOffset, horizontalOffset) ?? false;
const zoom = (zoomSize?: number | boolean, point?: [number, number]): boolean =>
  shellRef.value?.zoom(zoomSize, point) ?? false;
const resetZoom = (): boolean => shellRef.value?.resetZoom() ?? false;
const resetTranslate = (): boolean => shellRef.value?.resetTranslate() ?? false;
const translateCenter = (): boolean =>
  shellRef.value?.translateCenter() ?? false;
const getTransform = (): Record<string, number> | null =>
  shellRef.value?.getTransform() ?? null;

defineExpose({
  getGraphData,
  setGraphData,
  resizeCanvas,
  fitView,
  zoom,
  resetZoom,
  resetTranslate,
  translateCenter,
  getTransform,
});
</script>
