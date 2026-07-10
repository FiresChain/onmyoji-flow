<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from "vue";

import type { WorkspaceSession } from "../useWorkspaceSession";
import { useDocumentCommands } from "../useDocumentCommands";
import DataPreviewDialog from "./DataPreviewDialog.vue";
import ImportDialog from "./ImportDialog.vue";
import type {
  WorkspaceDialogHostExpose,
  WorkspaceDialogTranslate,
} from "./types";

type MessageType = "success" | "warning" | "info" | "error";

const props = withDefaults(
  defineProps<{
    workspaceSession: WorkspaceSession;
    showMessage: (type: MessageType, message: string) => void;
    refreshLogicFlowCanvas: (message?: string) => void;
    translate?: WorkspaceDialogTranslate;
  }>(),
  {
    translate: (key: string) => key,
  },
);

const state = reactive({
  showDataPreviewDialog: false,
  previewDataContent: "",
  showImportDialog: false,
  importingTeamCode: false,
  decodingTeamCodeQr: false,
});
const importSource = ref<"json" | "teamCode">("json");
const teamCodeInput = ref("");
const teamCodeValidationEnabled = ref(false);

const {
  handleExport,
  handlePreviewData,
  copyDataToClipboard,
  openImportDialog,
  triggerJsonFileImport,
  handleTeamCodeImport,
  handleTeamCodeQrImport,
  disposeImportExportCommands,
} = useDocumentCommands({
  state,
  workspaceSession: props.workspaceSession,
  importSource,
  teamCodeInput,
  teamCodeValidationEnabled,
  showMessage: props.showMessage,
  refreshLogicFlowCanvas: props.refreshLogicFlowCanvas,
});

onBeforeUnmount(disposeImportExportCommands);

defineExpose<WorkspaceDialogHostExpose>({
  handleExport,
  handlePreviewData,
  openImportDialog,
});
</script>

<template>
  <DataPreviewDialog
    v-model:open="state.showDataPreviewDialog"
    :content="state.previewDataContent"
    :translate="props.translate"
    @copy="copyDataToClipboard"
  />
  <ImportDialog
    v-model:open="state.showImportDialog"
    v-model:source="importSource"
    v-model:team-code="teamCodeInput"
    v-model:validation-enabled="teamCodeValidationEnabled"
    :importing-team-code="state.importingTeamCode"
    :decoding-team-code-qr="state.decodingTeamCodeQr"
    :translate="props.translate"
    @choose-json="triggerJsonFileImport"
    @import-team-code="handleTeamCodeImport"
    @import-team-code-qr="handleTeamCodeQrImport"
  />
</template>
