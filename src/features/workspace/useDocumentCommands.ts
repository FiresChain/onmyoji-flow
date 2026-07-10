import {
  createRootDocumentDownloadPayload,
  parseRootDocumentJson,
} from "./documentTransfer";
import { writeClipboardText } from "@/shared/platform/clipboard";
import { downloadTextPayload } from "@/shared/platform/download";
import type { Ref } from "vue";

import {
  legacyTeamCodeImportAdapter,
  type TeamCodeImportPort,
} from "./teamCodeImportAdapter";
import type { WorkspaceSession } from "./useWorkspaceSession";

type MessageType = "success" | "warning" | "info" | "error";

type ShowMessage = (type: MessageType, message: string) => void;

interface DocumentCommandState {
  showDataPreviewDialog: boolean;
  previewDataContent: string;
  showImportDialog: boolean;
  importingTeamCode: boolean;
  decodingTeamCodeQr: boolean;
}

interface UseDocumentCommandsOptions {
  state: DocumentCommandState;
  workspaceSession: WorkspaceSession;
  importSource: Ref<"json" | "teamCode">;
  teamCodeInput: Ref<string>;
  teamCodeValidationEnabled?: Ref<boolean>;
  teamCodeImportPort?: TeamCodeImportPort;
  showMessage: ShowMessage;
  refreshLogicFlowCanvas: (message?: string) => void;
}

export function useDocumentCommands(options: UseDocumentCommandsOptions) {
  const {
    state,
    workspaceSession,
    importSource,
    teamCodeInput,
    teamCodeValidationEnabled,
    teamCodeImportPort = legacyTeamCodeImportAdapter,
    showMessage,
    refreshLogicFlowCanvas,
  } = options;
  const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

  const schedule = (task: () => void, delay: number) => {
    const timer = setTimeout(() => {
      pendingTimers.delete(timer);
      task();
    }, delay);
    pendingTimers.add(timer);
  };

  const disposeImportExportCommands = () => {
    pendingTimers.forEach((timer) => clearTimeout(timer));
    pendingTimers.clear();
  };

  const handleExport = () => {
    workspaceSession.updateTab();
    schedule(() => {
      const exported = workspaceSession.exportDocument();
      if ("error" in exported) {
        showMessage("error", "数据导出失败");
        return;
      }
      const payload = createRootDocumentDownloadPayload(exported.document);
      if (!payload.ok) {
        showMessage("error", "数据导出失败");
        return;
      }
      downloadTextPayload(payload.value);
      showMessage("success", "数据导出成功");
    }, 2000);
  };

  const handlePreviewData = () => {
    workspaceSession.updateTab();

    schedule(() => {
      try {
        const exported = workspaceSession.exportDocument();
        if ("error" in exported) {
          throw exported.error;
        }
        state.previewDataContent = JSON.stringify(exported.document, null, 2);
        state.showDataPreviewDialog = true;
      } catch (error) {
        console.error("生成预览数据失败:", error);
        showMessage("error", "数据预览失败");
      }
    }, 100);
  };

  const copyDataToClipboard = async () => {
    try {
      await writeClipboardText(state.previewDataContent);
      showMessage("success", "已复制到剪贴板");
    } catch (error) {
      console.error("复制失败:", error);
      showMessage("error", "复制失败");
    }
  };

  const openImportDialog = () => {
    importSource.value = "json";
    teamCodeInput.value = "";
    if (teamCodeValidationEnabled) {
      teamCodeValidationEnabled.value = false;
    }
    state.showImportDialog = true;
  };

  const handleJsonImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          try {
            const readerTarget = loadEvent.target as FileReader;
            const parsed = parseRootDocumentJson(
              readerTarget.result as string,
              {
                context: "toolbar-json-import",
              },
            );
            if ("error" in parsed) {
              throw new Error(parsed.error.message);
            }
            const imported = workspaceSession.importData(parsed.value);
            if ("error" in imported) {
              throw imported.error;
            }
            refreshLogicFlowCanvas("LogicFlow 画布已重新渲染（导入数据）");
          } catch (error) {
            console.error("Failed to import file", error);
            showMessage("error", "文件格式错误");
          }
        };
        reader.readAsText(file);
      }
      target.value = "";
    };
    input.click();
  };

  const triggerJsonFileImport = () => {
    state.showImportDialog = false;
    handleJsonImport();
  };

  const handleTeamCodeImport = async () => {
    const rawTeamCode = teamCodeInput.value.trim();
    if (!rawTeamCode) {
      showMessage("warning", "请先粘贴阵容码");
      return;
    }

    state.importingTeamCode = true;
    try {
      const requestOptions = teamCodeValidationEnabled?.value
        ? { formationValidation: true }
        : undefined;
      const rootDocument = requestOptions
        ? await teamCodeImportPort.convert(rawTeamCode, requestOptions)
        : await teamCodeImportPort.convert(rawTeamCode);
      const imported = workspaceSession.importData(rootDocument);
      if ("error" in imported) {
        throw imported.error;
      }
      refreshLogicFlowCanvas("LogicFlow 画布已重新渲染（阵容码导入）");
      state.showImportDialog = false;
      teamCodeInput.value = "";
      showMessage("success", "阵容码导入成功");
    } catch (error) {
      console.error("阵容码导入失败:", error);
      const message = error instanceof Error ? error.message : "阵容码导入失败";
      showMessage("error", message);
    } finally {
      state.importingTeamCode = false;
    }
  };

  const handleTeamCodeQrImport = async (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    if (!file) {
      if (target) target.value = "";
      return;
    }

    state.decodingTeamCodeQr = true;
    try {
      const decodedTeamCode = await teamCodeImportPort.decodeQr(file);
      teamCodeInput.value = decodedTeamCode;
      showMessage("success", "二维码识别成功，已填入阵容码");
    } catch (error) {
      console.error("二维码识别失败:", error);
      const message = error instanceof Error ? error.message : "二维码识别失败";
      showMessage("error", message);
    } finally {
      state.decodingTeamCodeQr = false;
      if (target) target.value = "";
    }
  };

  return {
    handleExport,
    handlePreviewData,
    copyDataToClipboard,
    openImportDialog,
    triggerJsonFileImport,
    handleTeamCodeImport,
    handleTeamCodeQrImport,
    disposeImportExportCommands,
  };
}
