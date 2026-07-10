<template>
  <div class="toolbar-facade">
    <EditorCommandBar
      :is-embed="props.isEmbed"
      :selection-enabled="settings.selectionEnabled.value"
      :snap-grid-enabled="settings.snapGridEnabled.value"
      :snapline-enabled="settings.snaplineEnabled.value"
      :locale="currentLanguage"
      :translate="t"
      @command="handleCommand"
      @update:selection-enabled="updateSelectionEnabled"
      @update:snap-grid-enabled="updateSnapGridEnabled"
      @update:snapline-enabled="updateSnaplineEnabled"
      @update:locale="updateLocale"
    />

    <WorkspaceDialogHost
      ref="workspaceDialogHostRef"
      :workspace-session="workspaceSession"
      :show-message="showMessage"
      :refresh-logic-flow-canvas="refreshLogicFlowCanvas"
      :translate="t"
    />
    <CaptureDialogHost
      ref="captureDialogHostRef"
      :capture-snapshot="captureSnapshot"
      :show-message="showMessage"
      :translate="t"
    />
    <AssetsDialogHost
      ref="assetsDialogHostRef"
      :translate="t"
      :notify="showMessage"
      :resolve-asset-url="resolveAssetUrl"
      :apply-node-theme-to-current="applyNodeThemeToCurrent"
    />
    <GroupRuleDialogHost
      ref="groupRuleDialogHostRef"
      :translate="t"
      :show-message="showMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { ElMessage } from "element-plus";

import { applyAssetThemeToCurrentFile } from "@/editor/commands/assetTheme";
import { captureEditorSnapshot } from "@/editor/commands/captureSnapshot";
import { useEditorContext } from "@/editor/context/useEditorContext";
import { useEditorI18n } from "@/editor/context/useEditorI18n";
import {
  AssetsDialogHost,
  type ApplyNodeThemeToCurrent,
  type AssetsDialogHostExpose,
} from "@/features/assets/public";
import {
  CaptureDialogHost,
  type CaptureDialogHostExpose,
} from "@/features/capture/public";
import {
  GroupRuleDialogHost,
  type GroupRuleDialogHostExpose,
} from "@/features/group-rules/public";
import {
  LOCALE_STORAGE_KEY,
  normalizeEditorLocale,
  type EditorLocale,
} from "@/features/locale/public";
import {
  WorkspaceDialogHost,
  type WorkspaceDialogHostExpose,
  useWorkspaceCanvasRefresh,
  useWorkspaceCommands,
  useWorkspaceSession,
} from "@/features/workspace/public";
import { createSafeStorage } from "@/shared/platform/storage";
import EditorCommandBar from "./EditorCommandBar.vue";
import type { EditorCommand } from "./editorCommands";

type MessageType = "success" | "warning" | "info" | "error";

const props = withDefaults(
  defineProps<{
    isEmbed?: boolean;
  }>(),
  {
    isEmbed: false,
  },
);

const emit = defineEmits<{
  "show-update-log": [];
  "show-feedback": [];
}>();

const editorContext = useEditorContext();
const settings = editorContext.settings;
const workspaceSession = useWorkspaceSession();
const { t, getLocale, setLocale } = useEditorI18n();
const localeStorage = createSafeStorage(LOCALE_STORAGE_KEY);
const resolveAssetUrl = (value: unknown): unknown =>
  typeof value === "string" ? editorContext.resolveAssetUrl(value) : value;

const workspaceDialogHostRef = ref<WorkspaceDialogHostExpose | null>(null);
const captureDialogHostRef = ref<CaptureDialogHostExpose | null>(null);
const assetsDialogHostRef = ref<AssetsDialogHostExpose | null>(null);
const groupRuleDialogHostRef = ref<GroupRuleDialogHostExpose | null>(null);

const showMessage = (type: MessageType, message: string) => {
  ElMessage({ type, message });
};

const currentLanguage = computed<EditorLocale>(() =>
  normalizeEditorLocale(getLocale()),
);

const updateSelectionEnabled = (enabled: boolean) => {
  settings.selectionEnabled.value = enabled;
};

const updateSnapGridEnabled = (enabled: boolean) => {
  settings.snapGridEnabled.value = enabled;
};

const updateSnaplineEnabled = (enabled: boolean) => {
  settings.snaplineEnabled.value = enabled;
};

const updateLocale = (locale: EditorLocale) => {
  setLocale(locale);
  if (!props.isEmbed) {
    localeStorage.write(locale);
  }
};

const { refreshLogicFlowCanvas, disposeCanvasRefresh } =
  useWorkspaceCanvasRefresh({ workspaceSession });
const { loadExample, handleResetWorkspace, handleClearCanvas } =
  useWorkspaceCommands({
    workspaceSession,
    showMessage,
    refreshLogicFlowCanvas,
  });

const captureSnapshot = async (): Promise<string | null> => {
  const logicFlow = editorContext.runtime.value?.instance ?? null;
  if (!logicFlow) {
    showMessage("error", "未找到 LogicFlow 实例，无法截图");
    return null;
  }
  const snapshot = await captureEditorSnapshot(logicFlow);
  if (!snapshot) {
    showMessage("error", "未获取到截图数据");
  }
  return snapshot;
};

const applyNodeThemeToCurrent: ApplyNodeThemeToCurrent = (config) => {
  const logicFlow = editorContext.runtime.value?.instance;
  if (!logicFlow) return false;

  applyAssetThemeToCurrentFile(logicFlow, { config });
  workspaceSession.updateTab(workspaceSession.store.activeFileId);
  refreshLogicFlowCanvas();
  return true;
};

const handleCommand = (command: EditorCommand) => {
  switch (command) {
    case "import":
      workspaceDialogHostRef.value?.openImportDialog();
      break;
    case "export":
      workspaceDialogHostRef.value?.handleExport();
      break;
    case "preview-data":
      workspaceDialogHostRef.value?.handlePreviewData();
      break;
    case "prepare-capture":
      void captureDialogHostRef.value?.prepareCapture();
      break;
    case "load-example":
      loadExample();
      break;
    case "manage-rules":
      groupRuleDialogHostRef.value?.openRuleManager();
      break;
    case "configure-theme":
      assetsDialogHostRef.value?.openNodeTheme();
      break;
    case "configure-watermark":
      captureDialogHostRef.value?.openWatermark();
      break;
    case "manage-assets":
      assetsDialogHostRef.value?.openAssetManager();
      break;
    case "show-update-log":
      emit("show-update-log");
      break;
    case "show-feedback":
      emit("show-feedback");
      break;
    case "reset-workspace":
      handleResetWorkspace();
      break;
    case "clear-canvas":
      handleClearCanvas();
      break;
  }
};

onBeforeUnmount(disposeCanvasRefresh);
</script>
