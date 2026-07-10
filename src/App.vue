<script setup lang="ts">
import Toolbar from "./components/Toolbar.vue";
import ComponentsPanel from "./components/flow/ComponentsPanel.vue";
import { computed, onMounted, watch } from "vue";
import { useFilesStore } from "@/ts/useStore";
import FlowEditor from "./components/flow/FlowEditor.vue";
import DialogManager from "./components/DialogManager.vue";
import {
  createLogicFlowScope,
  getLogicFlowInstance,
  provideLogicFlowScope,
} from "@/ts/useLogicFlow";
import { normalizeGraph } from "@/core/document/normalizeGraph";
import type { GraphData } from "@/core/document/types";
import { renderGraphData } from "@/core/logicflow/graphIO";
import { normalizeViewport, setViewport } from "@/core/logicflow/viewport";
import { migrateGraphData } from "@/utils/nodeMigration";
import { useGlobalMessage } from "@/ts/useGlobalMessage";

const logicFlowScope = provideLogicFlowScope(createLogicFlowScope());
const filesStore = useFilesStore();
filesStore.bindLogicFlowScope(logicFlowScope);
const { showMessage } = useGlobalMessage();
const activeFileModel = computed({
  get: () => filesStore.activeFileId,
  set: (value: string) => filesStore.setActiveFile(value),
});

const normalizeGraphData = (data: unknown): GraphData => {
  const { graphData, migratedCount } = migrateGraphData(normalizeGraph(data));
  if (migratedCount > 0) {
    showMessage("info", `已自动升级 ${migratedCount} 个节点到新版本`);
  }
  return normalizeGraph(graphData);
};

const renderWorkspaceFile = (fileId?: string) => {
  const logicFlowInstance = getLogicFlowInstance(logicFlowScope);
  const currentTab = filesStore.getTab(fileId || filesStore.activeFileId);
  if (!logicFlowInstance || !currentTab?.graphRawData) {
    return;
  }

  try {
    renderGraphData(
      logicFlowInstance,
      normalizeGraphData(currentTab.graphRawData),
    );
    setViewport(logicFlowInstance, normalizeViewport(currentTab.transform));
  } catch (error) {
    console.warn("渲染画布数据失败:", error);
  }
};

const handleTabsEdit = (
  targetName: string | undefined,
  action: "remove" | "add",
) => {
  if (action === "remove") {
    filesStore.removeTab(targetName);
  } else if (action === "add") {
    filesStore.addTab();
  }
};

onMounted(() => {
  // 初始化自动保存功能
  filesStore.initializeWithPrompt();
  filesStore.setupAutoSave();
});

// 1) 切换激活文件：仅渲染新数据；保存旧文件职责由 store.setActiveFile 统一处理
watch(
  () => filesStore.activeFileId,
  (newId) => {
    if (newId) {
      renderWorkspaceFile(newId);
    }
  },
  { flush: "post" },
);

// 2) 导入等替换 fileList 引用时，主动按当前 activeFileId 渲染一次，不保存旧数据
watch(
  () => filesStore.fileList,
  () => {
    renderWorkspaceFile();
  },
  { flush: "post" },
);
</script>

<template>
  <div class="container">
    <!-- 工具栏 -->
    <Toolbar title="onmyoji-flow" username="示例用户" />
    <!-- 侧边栏和工作区 -->
    <div class="main-content">
      <!-- 侧边栏 -->
      <ComponentsPanel />
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
    <DialogManager />
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
