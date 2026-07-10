<script setup lang="ts">
import Toolbar from "./components/Toolbar.vue";
import NodePalette from "./editor/components/NodePalette.vue";
import { computed, onBeforeUnmount, onMounted, onUnmounted, watch } from "vue";
import FlowEditor from "./editor/components/FlowEditor.vue";
import EditorDialogHost from "./editor/components/EditorDialogHost.vue";
import { createEditorContext } from "@/editor/context/EditorContext";
import { provideEditorContext } from "@/editor/context/useEditorContext";
import {
  createLocalStorageFilesPersistence,
  createWorkspaceSession,
  provideWorkspaceSession,
  useFilesStore,
} from "@/features/workspace/public";
import { useGlobalMessage } from "@/ts/useGlobalMessage";
import { resolveInitialEditorLocale } from "@/features/locale/public";
import { getAssetBaseUrl } from "@/features/assets/public";

const editorContext = provideEditorContext(
  createEditorContext({
    locale: resolveInitialEditorLocale(),
    assetBaseUrl: getAssetBaseUrl(),
  }),
);
const filesStore = useFilesStore();
const workspaceSession = provideWorkspaceSession(
  createWorkspaceSession({
    store: filesStore,
    persistence: createLocalStorageFilesPersistence(),
    getEditorPort: () => editorContext.port.value,
  }),
);
const { showMessage } = useGlobalMessage();
const activeFileModel = computed({
  get: () => filesStore.activeFileId,
  set: (value: string) => workspaceSession.setActiveFile(value),
});

const handleTabsEdit = (
  targetName: string | undefined,
  action: "remove" | "add",
) => {
  if (action === "remove") {
    workspaceSession.removeTab(targetName);
  } else if (action === "add") {
    workspaceSession.addTab();
  }
};

onMounted(() => {
  const result = workspaceSession.initialize();
  if (result.error) {
    showMessage("warning", "本地工作区数据损坏，已重置为默认状态");
  } else if (result.restored) {
    showMessage("success", "已恢复上次工作区");
  }
  workspaceSession.startAutoSave();
});

watch(
  () => editorContext.runtime.value,
  (runtime) => {
    if (runtime) {
      workspaceSession.renderActiveFile();
    }
  },
  { flush: "post" },
);

onBeforeUnmount(() => {
  workspaceSession.dispose();
});

onUnmounted(() => {
  editorContext.dispose();
});
</script>

<template>
  <div class="container">
    <!-- 工具栏 -->
    <Toolbar title="onmyoji-flow" username="示例用户" />
    <!-- 侧边栏和工作区 -->
    <div class="main-content">
      <!-- 侧边栏 -->
      <NodePalette />
      <!-- 工作区 -->
      <div class="workspace">
        <el-tabs
          v-model="activeFileModel"
          type="card"
          class="demo-tabs"
          editable
          @edit="handleTabsEdit"
        >
          <el-tab-pane
            v-for="(file, index) in filesStore.visibleFiles"
            :key="`${file.id}-${filesStore.activeFileId}`"
            :label="file.label"
            :name="file.id"
          />
        </el-tabs>
        <div id="main-container">
          <FlowEditor height="100%" :enable-label="false" />
        </div>
      </div>
    </div>
    <EditorDialogHost />
  </div>
</template>

<style scoped>
:global(html),
:global(body),
:global(#app) {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.toolbar {
  height: 48px; /* 与 toolbarHeight 一致 */
  flex-shrink: 0; /* 防止 Toolbar 被压缩 */
  background-color: #fff; /* 添加背景色以便观察 */
  z-index: 1; /* 确保 Toolbar 在上层 */
}

.main-content {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding-top: 48px; /* toolbar 为 fixed，需要预留顶部空间 */
  box-sizing: border-box;
}

.sidebar {
  width: 230px; /* 侧边栏宽度 */
  background-color: #f0f0f0; /* 背景色 */
  flex-shrink: 0; /* 防止侧边栏被压缩 */
  overflow-y: auto; /* 允许侧边栏内容滚动 */
}

.workspace {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

#main-container {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.main-content :deep(.components-panel) {
  height: 100%;
  min-height: 0;
  margin-bottom: 0;
  overflow-y: auto;
}

.main-content :deep(.property-panel) {
  height: 100% !important;
  min-height: 0;
  overflow-y: auto;
}
</style>
