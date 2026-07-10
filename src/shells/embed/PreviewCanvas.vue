<template>
  <div class="preview-container" :style="{ height }">
    <div ref="containerRef" class="container"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

import { createLogicFlowRuntime } from "@/core/logicflow/createRuntime";
import type {
  FlowCapabilityLevel,
  FlowNodeRegistration as CoreFlowNodeRegistration,
  FlowPlugin as CoreFlowPlugin,
  LogicFlowRuntime,
} from "@/core/logicflow/types";
import { useEditorContext } from "@/editor/context/useEditorContext";
import { getDefaultNodeRegistrations } from "@/editor/node-types/registry";
import type { FlowNodeRegistration, FlowPlugin } from "@/flowRuntime";
import "@logicflow/core/lib/style/index.css";
import "@logicflow/extension/lib/style/index.css";

const props = withDefaults(
  defineProps<{
    height?: string;
    capability?: FlowCapabilityLevel;
    plugins?: FlowPlugin[];
    nodeRegistrations?: FlowNodeRegistration[];
  }>(),
  {
    height: "100%",
    capability: "render-only",
  },
);

const emit = defineEmits<{
  ready: [];
}>();

const editorContext = useEditorContext();
const containerRef = ref<HTMLElement | null>(null);
let ownedRuntime: LogicFlowRuntime | null = null;

const disposeRuntime = () => {
  const runtime = ownedRuntime;
  ownedRuntime = null;
  if (!runtime) return;

  if (!editorContext.clearRuntime(runtime)) {
    runtime.dispose();
  }
};

const mountRuntime = () => {
  const container = containerRef.value;
  if (!container) return;

  disposeRuntime();
  const isRenderOnly = props.capability === "render-only";
  const runtime = createLogicFlowRuntime({
    container,
    capability: props.capability,
    plugins: props.plugins as CoreFlowPlugin[] | undefined,
    nodeRegistrations: props.nodeRegistrations as
      | CoreFlowNodeRegistration[]
      | undefined,
    defaultNodeRegistrations: getDefaultNodeRegistrations(),
    logicFlowOptions: {
      width: container.offsetWidth,
      height: container.offsetHeight,
      grid: false,
      keyboard: { enabled: !isRenderOnly },
      isSilentMode: isRenderOnly,
      stopScrollGraph: isRenderOnly,
      stopZoomGraph: isRenderOnly,
      stopMoveGraph: isRenderOnly,
      adjustNodePosition: !isRenderOnly,
    },
  });
  ownedRuntime = runtime;
  editorContext.setRuntime(runtime);
  emit("ready");
};

watch(
  [() => props.capability, () => props.plugins, () => props.nodeRegistrations],
  mountRuntime,
  { deep: true, flush: "post" },
);

onMounted(mountRuntime);
onBeforeUnmount(disposeRuntime);
</script>

<style scoped>
.preview-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.container {
  width: 100%;
  height: 100%;
}
</style>
