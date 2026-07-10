<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";
import { ElMessage } from "element-plus";

import EditorDialogHost from "@/editor/components/EditorDialogHost.vue";
import FlowEditor from "@/editor/components/FlowEditor.vue";
import NodePalette from "@/editor/components/NodePalette.vue";
import { createEditorContext } from "@/editor/context/EditorContext";
import { provideEditorContext } from "@/editor/context/useEditorContext";
import { getAssetBaseUrl } from "@/features/assets/public";
import {
  createEditorI18n,
  resolveInitialEditorLocale,
} from "@/features/locale/public";
import {
  createLocalStorageFilesPersistence,
  createWorkspaceSession,
  provideWorkspaceSession,
  useFilesStore,
} from "@/features/workspace/public";
import EditorToolbar from "@/shells/common/EditorToolbar.vue";
import AboutDialogs from "./AboutDialogs.vue";

interface AboutDialogsExpose {
  showUpdateLog(): void;
  showFeedbackForm(): void;
}

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
const { t } = createEditorI18n(editorContext.locale);
const aboutDialogsRef = ref<AboutDialogsExpose | null>(null);
const activeFileModel = computed({
  get: () => filesStore.activeFileId,
  set: (value: string) => workspaceSession.setActiveFile(value),
});
const contactImageUrl = editorContext.resolveAssetUrl(
  "/assets/Other/Contact.png",
);

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
    ElMessage({
      type: "warning",
      message: "本地工作区数据损坏，已重置为默认状态",
    });
  } else if (result.restored) {
    ElMessage({ type: "success", message: "已恢复上次工作区" });
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
    <EditorToolbar
      @show-update-log="aboutDialogsRef?.showUpdateLog()"
      @show-feedback="aboutDialogsRef?.showFeedbackForm()"
    />
    <div class="main-content">
      <NodePalette />
      <div class="workspace">
        <el-tabs
          v-model="activeFileModel"
          type="card"
          class="demo-tabs"
          editable
          @edit="handleTabsEdit"
        >
          <el-tab-pane
            v-for="file in filesStore.visibleFiles"
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
    <AboutDialogs
      ref="aboutDialogsRef"
      :contact-image-url="contactImageUrl"
      :translate="t"
    />
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
  height: 48px;
  flex-shrink: 0;
  background-color: #fff;
  z-index: 1;
}

.main-content {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding-top: 48px;
  box-sizing: border-box;
}

.sidebar {
  width: 230px;
  background-color: #f0f0f0;
  flex-shrink: 0;
  overflow-y: auto;
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
