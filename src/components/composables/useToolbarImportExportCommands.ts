import { getLogicFlowInstance, type LogicFlowScope } from '@/ts/useLogicFlow';
import { convertTeamCodeToRootDocument, decodeTeamCodeFromQrImage } from '@/utils/teamCodeService';
import type { Ref } from 'vue';

type MessageType = 'success' | 'warning' | 'info' | 'error';

type ShowMessage = (type: MessageType, message: string) => void;

interface ToolbarFileItem {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

interface ToolbarFilesStoreLike {
  updateTab: (id?: string) => void;
  exportData: () => void;
  importData: (data: unknown) => void;
  fileList: ToolbarFileItem[];
  activeFileId: string;
}

interface ToolbarImportExportState {
  previewImage: string | null;
  previewVisible: boolean;
  showDataPreviewDialog: boolean;
  previewDataContent: string;
  showImportDialog: boolean;
  importingTeamCode: boolean;
  decodingTeamCodeQr: boolean;
}

interface WatermarkSettings {
  text: string;
  fontSize: number;
  color: string;
  angle: number;
  rows: number;
  cols: number;
}

interface UseToolbarImportExportCommandsOptions {
  state: ToolbarImportExportState;
  filesStore: ToolbarFilesStoreLike;
  logicFlowScope: LogicFlowScope;
  importSource: Ref<'json' | 'teamCode'>;
  teamCodeInput: Ref<string>;
  teamCodeQrInputRef: Ref<HTMLInputElement | null>;
  watermark: WatermarkSettings;
  showMessage: ShowMessage;
  refreshLogicFlowCanvas: (message?: string) => void;
}

type SnapshotResult = string | { data?: string };

const waitForNextPaint = () => {
  return new Promise<void>((resolve) => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      resolve();
      return;
    }
    window.requestAnimationFrame(() => resolve());
  });
};

const withDynamicGroupsHiddenForSnapshot = async <T>(
  logicFlowInstance: any,
  runner: () => Promise<T>,
): Promise<T> => {
  const graphModel = logicFlowInstance?.graphModel;
  const dynamicGroupModels = (graphModel?.nodes ?? []).filter(
    (node: any) => node?.type === 'dynamic-group',
  );

  if (!dynamicGroupModels.length) {
    return runner();
  }

  const previousStates = dynamicGroupModels.map((model: any) => ({
    model,
    visible: model.visible,
  }));

  try {
    previousStates.forEach(({ model }) => {
      model.visible = false;
    });
    await waitForNextPaint();
    return await runner();
  } finally {
    previousStates.forEach(({ model, visible }) => {
      model.visible = visible;
    });
    await waitForNextPaint();
  }
};

const addWatermarkToImage = (base64: string, watermark: WatermarkSettings) => {
  const rows = Math.max(1, Number(watermark.rows) || 1);
  const cols = Math.max(1, Number(watermark.cols) || 1);
  const angle = (Number(watermark.angle) * Math.PI) / 180;

  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      if (!ctx) {
        reject(new Error('无法创建画布上下文'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      ctx.font = `${watermark.fontSize}px sans-serif`;
      ctx.fillStyle = watermark.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const rowStep = canvas.height / rows;
      const colStep = canvas.width / cols;

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const x = (col + 0.5) * colStep;
          const y = (row + 0.5) * rowStep;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.fillText(watermark.text, 0, 0);
          ctx.restore();
        }
      }

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('快照加载失败'));
    img.src = base64;
  });
};

export function useToolbarImportExportCommands(options: UseToolbarImportExportCommandsOptions) {
  const {
    state,
    filesStore,
    logicFlowScope,
    importSource,
    teamCodeInput,
    teamCodeQrInputRef,
    watermark,
    showMessage,
    refreshLogicFlowCanvas,
  } = options;

  const captureLogicFlowSnapshot = async () => {
    const logicFlowInstance = getLogicFlowInstance(logicFlowScope) as any;
    if (!logicFlowInstance || typeof logicFlowInstance.getSnapshotBase64 !== 'function') {
      showMessage('error', '未找到 LogicFlow 实例，无法截图');
      return null;
    }

    const snapshotResult = await withDynamicGroupsHiddenForSnapshot<SnapshotResult>(
      logicFlowInstance,
      () => logicFlowInstance.getSnapshotBase64(
        undefined,
        undefined,
        {
          fileType: 'png',
          backgroundColor: '#ffffff',
          partial: false,
          padding: 20,
        },
      ),
    );

    const base64 = typeof snapshotResult === 'string' ? snapshotResult : snapshotResult?.data;
    if (!base64) {
      showMessage('error', '未获取到截图数据');
      return null;
    }

    return addWatermarkToImage(base64, watermark);
  };

  const prepareCapture = async () => {
    try {
      const image = await captureLogicFlowSnapshot();
      if (!image) return;
      state.previewImage = image;
      state.previewVisible = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showMessage('error', `截图失败: ${message}`);
    }
  };

  const downloadImage = () => {
    if (state.previewImage) {
      const link = document.createElement('a');
      link.href = state.previewImage;
      link.download = 'screenshot.png';
      link.click();
      state.previewVisible = false;
    }
  };

  const handleClose = (done: () => void) => {
    state.previewImage = null;
    done();
  };

  const handleExport = () => {
    filesStore.updateTab();
    setTimeout(() => {
      filesStore.exportData();
    }, 2000);
  };

  const handlePreviewData = () => {
    filesStore.updateTab();

    setTimeout(() => {
      try {
        const activeName = filesStore.fileList.find((file) => file.id === filesStore.activeFileId)?.name || '';
        const dataObj = {
          schemaVersion: 1,
          fileList: filesStore.fileList,
          activeFileId: filesStore.activeFileId,
          activeFile: activeName,
        };
        state.previewDataContent = JSON.stringify(dataObj, null, 2);
        state.showDataPreviewDialog = true;
      } catch (error) {
        console.error('生成预览数据失败:', error);
        showMessage('error', '数据预览失败');
      }
    }, 100);
  };

  const copyDataToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(state.previewDataContent);
      showMessage('success', '已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      showMessage('error', '复制失败');
    }
  };

  const openImportDialog = () => {
    importSource.value = 'json';
    teamCodeInput.value = '';
    state.showImportDialog = true;
  };

  const handleJsonImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          try {
            const readerTarget = loadEvent.target as FileReader;
            const data = JSON.parse(readerTarget.result as string);
            filesStore.importData(data);
            refreshLogicFlowCanvas('LogicFlow 画布已重新渲染（导入数据）');
          } catch (error) {
            console.error('Failed to import file', error);
            showMessage('error', '文件格式错误');
          }
        };
        reader.readAsText(file);
      }
      target.value = '';
    };
    input.click();
  };

  const triggerJsonFileImport = () => {
    state.showImportDialog = false;
    handleJsonImport();
  };

  const triggerTeamCodeQrImport = () => {
    teamCodeQrInputRef.value?.click();
  };

  const handleTeamCodeImport = async () => {
    const rawTeamCode = teamCodeInput.value.trim();
    if (!rawTeamCode) {
      showMessage('warning', '请先粘贴阵容码');
      return;
    }

    state.importingTeamCode = true;
    try {
      const rootDocument = await convertTeamCodeToRootDocument(rawTeamCode);
      filesStore.importData(rootDocument);
      refreshLogicFlowCanvas('LogicFlow 画布已重新渲染（阵容码导入）');
      state.showImportDialog = false;
      teamCodeInput.value = '';
      showMessage('success', '阵容码导入成功');
    } catch (error) {
      console.error('阵容码导入失败:', error);
      const message = error instanceof Error ? error.message : '阵容码导入失败';
      showMessage('error', message);
    } finally {
      state.importingTeamCode = false;
    }
  };

  const handleTeamCodeQrImport = async (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    if (!file) {
      if (target) target.value = '';
      return;
    }

    state.decodingTeamCodeQr = true;
    try {
      const decodedTeamCode = await decodeTeamCodeFromQrImage(file);
      teamCodeInput.value = decodedTeamCode;
      showMessage('success', '二维码识别成功，已填入阵容码');
    } catch (error) {
      console.error('二维码识别失败:', error);
      const message = error instanceof Error ? error.message : '二维码识别失败';
      showMessage('error', message);
    } finally {
      state.decodingTeamCodeQr = false;
      if (target) target.value = '';
    }
  };

  return {
    handleExport,
    handlePreviewData,
    copyDataToClipboard,
    openImportDialog,
    triggerJsonFileImport,
    triggerTeamCodeQrImport,
    handleTeamCodeImport,
    handleTeamCodeQrImport,
    prepareCapture,
    downloadImage,
    handleClose,
  };
}