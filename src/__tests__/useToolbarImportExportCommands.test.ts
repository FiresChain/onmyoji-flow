import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useToolbarImportExportCommands } from '@/components/composables/useToolbarImportExportCommands';
import { getLogicFlowInstance } from '@/ts/useLogicFlow';
import { convertTeamCodeToRootDocument, decodeTeamCodeFromQrImage } from '@/utils/teamCodeService';

const OriginalFileReader = globalThis.FileReader;
const OriginalImage = globalThis.Image;
const OriginalClipboard = globalThis.navigator.clipboard;

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
    (globalThis as typeof globalThis & { FileReader: typeof FileReader }).FileReader = OriginalFileReader;
    (globalThis as typeof globalThis & { Image: typeof Image }).Image = OriginalImage;
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: OriginalClipboard,
    });
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

  it('handlePreviewData keeps serialize-failure error behavior', () => {
    const context = createContext();
    context.filesStore.fileList = [
      {
        id: 'file-c',
        name: 'gamma',
        payload: BigInt(1),
      } as unknown as { id: string; name: string },
    ];

    context.commands.handlePreviewData();

    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(100);

    expect(context.state.showDataPreviewDialog).toBe(false);
    expect(context.state.previewDataContent).toBe('');
    expect(context.showMessage).toHaveBeenCalledWith('error', '数据预览失败');
  });

  it('copyDataToClipboard keeps failure error behavior', async () => {
    const context = createContext();
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard blocked'));

    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText,
      },
    });
    context.state.previewDataContent = '{"schemaVersion":1}';

    await context.commands.copyDataToClipboard();

    expect(writeText).toHaveBeenCalledWith('{"schemaVersion":1}');
    expect(context.showMessage).toHaveBeenCalledWith('error', '复制失败');
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

  it('triggerJsonFileImport keeps parse-failure error behavior', () => {
    const context = createContext();
    const input = {
      type: '',
      accept: '',
      files: [new File(['not-json'], 'broken.json', { type: 'application/json' })],
      value: 'filled',
      onchange: null as ((event: Event) => void) | null,
      click: vi.fn(() => {
        input.onchange?.({ target: input } as unknown as Event);
      }),
    };
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'input') {
        return input as unknown as HTMLInputElement;
      }
      return originalCreateElement(tagName);
    });
    class MockFileReader {
      public onload: ((event: ProgressEvent<FileReader>) => void) | null = null;

      public result: string | ArrayBuffer | null = null;

      readAsText() {
        this.result = '{invalid-json';
        this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
      }
    }
    (globalThis as typeof globalThis & { FileReader: typeof FileReader }).FileReader = MockFileReader as unknown as typeof FileReader;
    context.state.showImportDialog = true;

    context.commands.triggerJsonFileImport();

    expect(context.state.showImportDialog).toBe(false);
    expect(context.filesStore.importData).not.toHaveBeenCalled();
    expect(context.refreshLogicFlowCanvas).not.toHaveBeenCalled();
    expect(context.showMessage).toHaveBeenCalledWith('error', '文件格式错误');
    expect(input.value).toBe('');
    createElementSpy.mockRestore();
  });

  it('triggerJsonFileImport keeps no-file no-op behavior', () => {
    const context = createContext();
    const input = {
      type: '',
      accept: '',
      files: [] as File[],
      value: 'filled',
      onchange: null as ((event: Event) => void) | null,
      click: vi.fn(() => {
        input.onchange?.({ target: input } as unknown as Event);
      }),
    };
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'input') {
        return input as unknown as HTMLInputElement;
      }
      return originalCreateElement(tagName);
    });
    context.state.showImportDialog = true;

    context.commands.triggerJsonFileImport();

    expect(context.state.showImportDialog).toBe(false);
    expect(context.filesStore.importData).not.toHaveBeenCalled();
    expect(context.refreshLogicFlowCanvas).not.toHaveBeenCalled();
    expect(context.showMessage).not.toHaveBeenCalled();
    expect(input.value).toBe('');
    createElementSpy.mockRestore();
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

  it('handleTeamCodeImport keeps conversion-failure error behavior', async () => {
    const context = createContext();

    vi.mocked(convertTeamCodeToRootDocument).mockRejectedValue(new Error('阵容码转换失败') as never);
    context.teamCodeInput.value = '#TA#BROKEN';
    context.state.showImportDialog = true;

    await context.commands.handleTeamCodeImport();

    expect(convertTeamCodeToRootDocument).toHaveBeenCalledWith('#TA#BROKEN');
    expect(context.filesStore.importData).not.toHaveBeenCalled();
    expect(context.refreshLogicFlowCanvas).not.toHaveBeenCalled();
    expect(context.state.importingTeamCode).toBe(false);
    expect(context.state.showImportDialog).toBe(true);
    expect(context.teamCodeInput.value).toBe('#TA#BROKEN');
    expect(context.showMessage).toHaveBeenCalledWith('error', '阵容码转换失败');
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

  it('handleTeamCodeQrImport keeps no-file no-op behavior', async () => {
    const context = createContext();
    const target = {
      files: [] as File[],
      value: 'filled',
    } as unknown as HTMLInputElement;

    await context.commands.handleTeamCodeQrImport({ target } as unknown as Event);

    expect(decodeTeamCodeFromQrImage).not.toHaveBeenCalled();
    expect(context.teamCodeInput.value).toBe('');
    expect(context.state.decodingTeamCodeQr).toBe(false);
    expect(context.showMessage).not.toHaveBeenCalled();
    expect(target.value).toBe('');
  });

  it('handleTeamCodeQrImport keeps decode-failure error behavior', async () => {
    const context = createContext();
    const file = new File(['broken-qr'], 'broken-qr.png', { type: 'image/png' });
    const target = {
      files: [file],
      value: 'filled',
    } as unknown as HTMLInputElement;

    vi.mocked(decodeTeamCodeFromQrImage).mockRejectedValue(new Error('二维码识别失败') as never);

    await context.commands.handleTeamCodeQrImport({ target } as unknown as Event);

    expect(decodeTeamCodeFromQrImage).toHaveBeenCalledWith(file);
    expect(context.teamCodeInput.value).toBe('');
    expect(context.state.decodingTeamCodeQr).toBe(false);
    expect(context.showMessage).toHaveBeenCalledWith('error', '二维码识别失败');
    expect(target.value).toBe('');
  });

  it('prepareCapture keeps missing-instance error behavior', async () => {
    const context = createContext();

    vi.mocked(getLogicFlowInstance).mockReturnValue(null);

    await context.commands.prepareCapture();

    expect(context.showMessage).toHaveBeenCalledWith('error', '未找到 LogicFlow 实例，无法截图');
    expect(context.state.previewImage).toBeNull();
    expect(context.state.previewVisible).toBe(false);
  });

  it('prepareCapture keeps empty-snapshot guard behavior', async () => {
    const context = createContext();
    const logicFlowInstance = {
      getSnapshotBase64: vi.fn().mockResolvedValue({ data: '' }),
    };

    vi.mocked(getLogicFlowInstance).mockReturnValue(logicFlowInstance as never);

    await context.commands.prepareCapture();

    expect(logicFlowInstance.getSnapshotBase64).toHaveBeenCalledTimes(1);
    expect(context.showMessage).toHaveBeenCalledWith('error', '未获取到截图数据');
    expect(context.state.previewImage).toBeNull();
    expect(context.state.previewVisible).toBe(false);
  });

  it('prepareCapture keeps watermark-processing failure behavior', async () => {
    const context = createContext();
    const logicFlowInstance = {
      getSnapshotBase64: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
    };
    class MockImage {
      public onload: (() => void) | null = null;

      public onerror: (() => void) | null = null;

      set src(_value: string) {
        this.onerror?.();
      }
    }

    vi.mocked(getLogicFlowInstance).mockReturnValue(logicFlowInstance as never);
    (globalThis as typeof globalThis & { Image: typeof Image }).Image = MockImage as unknown as typeof Image;

    await context.commands.prepareCapture();

    expect(logicFlowInstance.getSnapshotBase64).toHaveBeenCalledTimes(1);
    expect(context.showMessage).toHaveBeenCalledWith('error', '截图失败: 快照加载失败');
    expect(context.state.previewImage).toBeNull();
    expect(context.state.previewVisible).toBe(false);
  });

  it('downloadImage keeps no-op behavior when preview image is empty', () => {
    const context = createContext();
    const createElementSpy = vi.spyOn(document, 'createElement');

    context.state.previewImage = null;
    context.state.previewVisible = true;
    context.commands.downloadImage();

    expect(createElementSpy).not.toHaveBeenCalled();
    expect(context.state.previewVisible).toBe(true);
    createElementSpy.mockRestore();
  });

  it('downloadImage keeps close-preview behavior after download', () => {
    const context = createContext();
    const link = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return link as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tagName);
    });

    context.state.previewImage = 'data:image/png;base64,mock';
    context.state.previewVisible = true;

    context.commands.downloadImage();

    expect(link.href).toBe('data:image/png;base64,mock');
    expect(link.download).toBe('screenshot.png');
    expect(link.click).toHaveBeenCalledTimes(1);
    expect(context.state.previewVisible).toBe(false);
    createElementSpy.mockRestore();
  });

  it('handleClose keeps preview cleanup behavior', () => {
    const context = createContext();
    const done = vi.fn();

    context.state.previewImage = 'data:image/png;base64,mock';
    context.commands.handleClose(done);

    expect(context.state.previewImage).toBeNull();
    expect(done).toHaveBeenCalledTimes(1);
  });
});
