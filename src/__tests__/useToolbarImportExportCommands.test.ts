import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useToolbarImportExportCommands } from '@/components/composables/useToolbarImportExportCommands';
import { getLogicFlowInstance } from '@/ts/useLogicFlow';
import { convertTeamCodeToRootDocument, decodeTeamCodeFromQrImage } from '@/utils/teamCodeService';

vi.mock('@/utils/teamCodeService', () => ({
  convertTeamCodeToRootDocument: vi.fn(),
  decodeTeamCodeFromQrImage: vi.fn(),
}));

vi.mock('@/ts/useLogicFlow', async () => {
  const actual = await vi.importActual<typeof import('@/ts/useLogicFlow')>('@/ts/useLogicFlow');
  return {
    ...actual,
    getLogicFlowInstance: vi.fn(),
  };
});

interface ToolbarTestContext {
  state: {
    previewImage: string | null;
    previewVisible: boolean;
    showDataPreviewDialog: boolean;
    previewDataContent: string;
    showImportDialog: boolean;
    importingTeamCode: boolean;
    decodingTeamCodeQr: boolean;
  };
  filesStore: {
    updateTab: ReturnType<typeof vi.fn>;
    exportData: ReturnType<typeof vi.fn>;
    importData: ReturnType<typeof vi.fn>;
    fileList: Array<{ id: string; name: string }>;
    activeFileId: string;
  };
  importSource: ReturnType<typeof ref<'json' | 'teamCode'>>;
  teamCodeInput: ReturnType<typeof ref<string>>;
  teamCodeQrInputRef: ReturnType<typeof ref<HTMLInputElement | null>>;
  showMessage: ReturnType<typeof vi.fn>;
  refreshLogicFlowCanvas: ReturnType<typeof vi.fn>;
  commands: ReturnType<typeof useToolbarImportExportCommands>;
}

const createContext = (): ToolbarTestContext => {
  const state = {
    previewImage: null,
    previewVisible: false,
    showDataPreviewDialog: false,
    previewDataContent: '',
    showImportDialog: false,
    importingTeamCode: false,
    decodingTeamCodeQr: false,
  };

  const filesStore = {
    updateTab: vi.fn(),
    exportData: vi.fn(),
    importData: vi.fn(),
    fileList: [
      { id: 'file-a', name: 'alpha' },
      { id: 'file-b', name: 'beta' },
    ],
    activeFileId: 'file-b',
  };

  const importSource = ref<'json' | 'teamCode'>('teamCode');
  const teamCodeInput = ref('');
  const teamCodeQrInputRef = ref<HTMLInputElement | null>(null);
  const showMessage = vi.fn();
  const refreshLogicFlowCanvas = vi.fn();

  const commands = useToolbarImportExportCommands({
    state,
    filesStore,
    logicFlowScope: Symbol('test-scope'),
    importSource,
    teamCodeInput,
    teamCodeQrInputRef,
    watermark: {
      text: 'wm',
      fontSize: 20,
      color: 'rgba(0,0,0,0.1)',
      angle: -20,
      rows: 1,
      cols: 1,
    },
    showMessage,
    refreshLogicFlowCanvas,
  });

  return {
    state,
    filesStore,
    importSource,
    teamCodeInput,
    teamCodeQrInputRef,
    showMessage,
    refreshLogicFlowCanvas,
    commands,
  };
};

describe('useToolbarImportExportCommands', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handleExport keeps update-first then delayed export behavior', () => {
    const context = createContext();

    context.commands.handleExport();

    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(1);
    expect(context.filesStore.exportData).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1999);
    expect(context.filesStore.exportData).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(1);
  });

  it('handlePreviewData keeps update-first and delayed preview payload behavior', () => {
    const context = createContext();

    context.commands.handlePreviewData();

    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(1);
    expect(context.state.showDataPreviewDialog).toBe(false);

    vi.advanceTimersByTime(100);

    expect(context.state.showDataPreviewDialog).toBe(true);
    const parsed = JSON.parse(context.state.previewDataContent) as {
      schemaVersion: number;
      activeFileId: string;
      activeFile: string;
    };
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.activeFileId).toBe('file-b');
    expect(parsed.activeFile).toBe('beta');
  });

  it('openImportDialog resets source/input and opens import dialog', () => {
    const context = createContext();

    context.importSource.value = 'teamCode';
    context.teamCodeInput.value = 'some code';
    context.state.showImportDialog = false;

    context.commands.openImportDialog();

    expect(context.importSource.value).toBe('json');
    expect(context.teamCodeInput.value).toBe('');
    expect(context.state.showImportDialog).toBe(true);
  });

  it('handleTeamCodeImport keeps warning path when team code is empty', async () => {
    const context = createContext();

    context.teamCodeInput.value = '   ';

    await context.commands.handleTeamCodeImport();

    expect(context.showMessage).toHaveBeenCalledWith('warning', '请先粘贴阵容码');
    expect(context.filesStore.importData).not.toHaveBeenCalled();
    expect(context.state.importingTeamCode).toBe(false);
  });

  it('handleTeamCodeImport keeps success import flow and state reset', async () => {
    const context = createContext();
    const rootDocument = { fileList: [], activeFileId: '' };

    vi.mocked(convertTeamCodeToRootDocument).mockResolvedValue(rootDocument as never);
    context.teamCodeInput.value = ' #TA#CODE ';
    context.state.showImportDialog = true;

    await context.commands.handleTeamCodeImport();

    expect(convertTeamCodeToRootDocument).toHaveBeenCalledWith('#TA#CODE');
    expect(context.filesStore.importData).toHaveBeenCalledWith(rootDocument);
    expect(context.refreshLogicFlowCanvas).toHaveBeenCalledWith('LogicFlow 画布已重新渲染（阵容码导入）');
    expect(context.teamCodeInput.value).toBe('');
    expect(context.state.showImportDialog).toBe(false);
    expect(context.state.importingTeamCode).toBe(false);
    expect(context.showMessage).toHaveBeenCalledWith('success', '阵容码导入成功');
  });

  it('handleTeamCodeQrImport keeps decode-fill-clear behavior', async () => {
    const context = createContext();
    const file = new File(['qr'], 'team-code.png', { type: 'image/png' });
    const target = {
      files: [file],
      value: 'filled',
    } as unknown as HTMLInputElement;

    vi.mocked(decodeTeamCodeFromQrImage).mockResolvedValue('#TA#QR_CODE' as never);

    await context.commands.handleTeamCodeQrImport({ target } as unknown as Event);

    expect(decodeTeamCodeFromQrImage).toHaveBeenCalledWith(file);
    expect(context.teamCodeInput.value).toBe('#TA#QR_CODE');
    expect(context.state.decodingTeamCodeQr).toBe(false);
    expect(target.value).toBe('');
    expect(context.showMessage).toHaveBeenCalledWith('success', '二维码识别成功，已填入阵容码');
  });

  it('prepareCapture keeps missing-instance error behavior', async () => {
    const context = createContext();

    vi.mocked(getLogicFlowInstance).mockReturnValue(null);

    await context.commands.prepareCapture();

    expect(context.showMessage).toHaveBeenCalledWith('error', '未找到 LogicFlow 实例，无法截图');
    expect(context.state.previewImage).toBeNull();
    expect(context.state.previewVisible).toBe(false);
  });
});