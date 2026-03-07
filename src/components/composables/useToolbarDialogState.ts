import { reactive } from "vue";

interface ToolbarDialogStateLike {
  showWatermarkDialog: boolean;
  showUpdateLogDialog: boolean;
  showFeedbackFormDialog: boolean;
}

interface UseToolbarDialogStateOptions {
  state: ToolbarDialogStateLike;
  isEmbed: boolean;
  currentAppVersion: string;
}

export function useToolbarDialogState(options: UseToolbarDialogStateOptions) {
  const { state, isEmbed, currentAppVersion } = options;

  const watermark = reactive({
    text: localStorage.getItem("watermark.text") || "示例水印",
    fontSize: Number(localStorage.getItem("watermark.fontSize")) || 30,
    color:
      localStorage.getItem("watermark.color") || "rgba(184, 184, 184, 0.3)",
    angle: Number(localStorage.getItem("watermark.angle")) || -20,
    rows: Number(localStorage.getItem("watermark.rows")) || 1,
    cols: Number(localStorage.getItem("watermark.cols")) || 1,
  });

  const showUpdateLog = () => {
    state.showUpdateLogDialog = !state.showUpdateLogDialog;
  };

  const showFeedbackForm = () => {
    state.showFeedbackFormDialog = !state.showFeedbackFormDialog;
  };

  const openWatermarkDialog = () => {
    state.showWatermarkDialog = true;
  };

  const applyWatermarkSettings = () => {
    localStorage.setItem("watermark.text", watermark.text);
    localStorage.setItem("watermark.fontSize", String(watermark.fontSize));
    localStorage.setItem("watermark.color", watermark.color);
    localStorage.setItem("watermark.angle", String(watermark.angle));
    localStorage.setItem("watermark.rows", String(watermark.rows));
    localStorage.setItem("watermark.cols", String(watermark.cols));
    state.showWatermarkDialog = false;
  };

  const mountDialogState = () => {
    if (isEmbed) {
      return;
    }

    const lastVersion = localStorage.getItem("appVersion");
    if (lastVersion !== currentAppVersion) {
      state.showUpdateLogDialog = true;
      localStorage.setItem("appVersion", currentAppVersion);
    }
  };

  return {
    watermark,
    showUpdateLog,
    showFeedbackForm,
    openWatermarkDialog,
    applyWatermarkSettings,
    mountDialogState,
  };
}
