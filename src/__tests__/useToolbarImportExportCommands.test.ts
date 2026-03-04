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

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
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

  it('handleExport keeps deterministic update/delay counts across repeated triggers', () => {
    const context = createContext();
    const triggerCount = 3;

    for (let round = 0; round < triggerCount; round += 1) {
      context.commands.handleExport();
    }

    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(triggerCount);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1999);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(triggerCount);

    vi.advanceTimersByTime(1);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(triggerCount);
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(triggerCount);
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

  it('handlePreviewData keeps deterministic update/delay counts across repeated triggers', () => {
    const context = createContext();
    const triggerCount = 3;
    const stringifySpy = vi.spyOn(JSON, 'stringify');

    for (let round = 0; round < triggerCount; round += 1) {
      context.commands.handlePreviewData();
    }

    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(triggerCount);
    expect(context.state.showDataPreviewDialog).toBe(false);
    expect(stringifySpy).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(99);
    expect(context.state.showDataPreviewDialog).toBe(false);
    expect(stringifySpy).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1);
    expect(stringifySpy).toHaveBeenCalledTimes(triggerCount);
    expect(context.state.showDataPreviewDialog).toBe(true);
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(triggerCount);
    stringifySpy.mockRestore();
  });

  it('handleExport and handlePreviewData keep deterministic timer counts across repeated interleaved rounds', () => {
    const context = createContext();
    const stringifySpy = vi.spyOn(JSON, 'stringify');
    const interleavedRounds: Array<Array<'preview' | 'export'>> = [
      ['preview', 'export'],
      ['export', 'preview'],
      ['preview', 'export'],
      ['export', 'preview'],
    ];
    let expectedUpdateTabCount = 0;
    let expectedPreviewTriggerCount = 0;
    let expectedExportTriggerCount = 0;

    interleavedRounds.forEach((round) => {
      round.forEach((action) => {
        if (action === 'preview') {
          context.commands.handlePreviewData();
          expectedPreviewTriggerCount += 1;
        } else {
          context.commands.handleExport();
          expectedExportTriggerCount += 1;
        }
        expectedUpdateTabCount += 1;
        expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);
      });
    });

    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);
    expect(stringifySpy).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(99);
    expect(stringifySpy).toHaveBeenCalledTimes(0);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1);
    expect(stringifySpy).toHaveBeenCalledTimes(expectedPreviewTriggerCount);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1899);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(expectedExportTriggerCount);
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);
    stringifySpy.mockRestore();
  });

  it('handleExport and handlePreviewData keep no-drift counts for preview-first/export-first in the same round', () => {
    const context = createContext();
    const stringifySpy = vi.spyOn(JSON, 'stringify');
    let expectedUpdateTabCount = 0;

    context.commands.handlePreviewData();
    expectedUpdateTabCount += 1;
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);

    context.commands.handleExport();
    expectedUpdateTabCount += 1;
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);

    context.commands.handleExport();
    expectedUpdateTabCount += 1;
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);

    context.commands.handlePreviewData();
    expectedUpdateTabCount += 1;
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);

    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);
    expect(stringifySpy).toHaveBeenCalledTimes(0);
    expect(context.state.showDataPreviewDialog).toBe(false);

    vi.advanceTimersByTime(99);
    expect(stringifySpy).toHaveBeenCalledTimes(0);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);
    expect(context.state.showDataPreviewDialog).toBe(false);

    vi.advanceTimersByTime(1);
    expect(stringifySpy).toHaveBeenCalledTimes(2);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);
    expect(context.state.showDataPreviewDialog).toBe(true);

    vi.advanceTimersByTime(1899);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(2);
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);
    stringifySpy.mockRestore();
  });

  it('handleExport and handlePreviewData keep segmented timer-window determinism at 99/1/1899/1 boundaries', () => {
    const context = createContext();
    const stringifySpy = vi.spyOn(JSON, 'stringify');
    const interleavedActions: Array<'preview' | 'export'> = [
      'preview',
      'export',
      'preview',
      'export',
      'preview',
    ];
    let expectedUpdateTabCount = 0;
    let expectedPreviewTriggerCount = 0;
    let expectedExportTriggerCount = 0;

    interleavedActions.forEach((action) => {
      if (action === 'preview') {
        context.commands.handlePreviewData();
        expectedPreviewTriggerCount += 1;
      } else {
        context.commands.handleExport();
        expectedExportTriggerCount += 1;
      }
      expectedUpdateTabCount += 1;
      expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);
    });
    expect(vi.getTimerCount()).toBe(interleavedActions.length);

    expect(stringifySpy).toHaveBeenCalledTimes(0);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(99);
    expect(vi.getTimerCount()).toBe(interleavedActions.length);
    expect(stringifySpy).toHaveBeenCalledTimes(0);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBe(expectedExportTriggerCount);
    expect(stringifySpy).toHaveBeenCalledTimes(expectedPreviewTriggerCount);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1899);
    expect(vi.getTimerCount()).toBe(expectedExportTriggerCount);
    expect(stringifySpy).toHaveBeenCalledTimes(expectedPreviewTriggerCount);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(expectedExportTriggerCount);
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);
    stringifySpy.mockRestore();
  });

  it('handleExport and handlePreviewData keep no-drift counts across interleaved multi-batch runs after flush', () => {
    const context = createContext();
    const stringifySpy = vi.spyOn(JSON, 'stringify');
    let expectedUpdateTabCount = 0;
    let expectedPreviewTriggerCount = 0;
    let expectedExportTriggerCount = 0;

    const triggerInterleavedBatch = (batch: Array<'preview' | 'export'>) => {
      batch.forEach((action) => {
        if (action === 'preview') {
          context.commands.handlePreviewData();
          expectedPreviewTriggerCount += 1;
        } else {
          context.commands.handleExport();
          expectedExportTriggerCount += 1;
        }
        expectedUpdateTabCount += 1;
        expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);
      });
    };

    triggerInterleavedBatch(['preview', 'export', 'preview']);
    expect(vi.getTimerCount()).toBe(3);
    expect(stringifySpy).toHaveBeenCalledTimes(0);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(99);
    expect(vi.getTimerCount()).toBe(3);
    expect(stringifySpy).toHaveBeenCalledTimes(0);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBe(1);
    expect(stringifySpy).toHaveBeenCalledTimes(2);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1899);
    expect(vi.getTimerCount()).toBe(1);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(1);
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);

    vi.runOnlyPendingTimers();
    expect(vi.getTimerCount()).toBe(0);
    expect(stringifySpy).toHaveBeenCalledTimes(2);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(1);

    triggerInterleavedBatch(['export', 'preview', 'export', 'preview']);
    expect(vi.getTimerCount()).toBe(4);
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);
    expect(stringifySpy).toHaveBeenCalledTimes(2);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(99);
    expect(vi.getTimerCount()).toBe(4);
    expect(stringifySpy).toHaveBeenCalledTimes(2);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBe(2);
    expect(stringifySpy).toHaveBeenCalledTimes(expectedPreviewTriggerCount);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1899);
    expect(vi.getTimerCount()).toBe(2);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(expectedExportTriggerCount);
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);

    vi.runOnlyPendingTimers();
    expect(vi.getTimerCount()).toBe(0);
    stringifySpy.mockRestore();
  });

  it('handleExport and handlePreviewData keep segmented determinism with partial-flush rebatching and zero-residual timers', () => {
    const context = createContext();
    const stringifySpy = vi.spyOn(JSON, 'stringify');
    let expectedUpdateTabCount = 0;
    let expectedPreviewTriggerCount = 0;
    let expectedExportTriggerCount = 0;

    const triggerInterleavedBatch = (batch: Array<'preview' | 'export'>) => {
      batch.forEach((action) => {
        if (action === 'preview') {
          context.commands.handlePreviewData();
          expectedPreviewTriggerCount += 1;
        } else {
          context.commands.handleExport();
          expectedExportTriggerCount += 1;
        }
        expectedUpdateTabCount += 1;
        expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);
      });
    };

    const firstBatch: Array<'preview' | 'export'> = ['preview', 'export', 'preview', 'export'];
    triggerInterleavedBatch(firstBatch);
    expect(vi.getTimerCount()).toBe(firstBatch.length);
    expect(stringifySpy).toHaveBeenCalledTimes(0);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(99);
    expect(vi.getTimerCount()).toBe(firstBatch.length);
    expect(stringifySpy).toHaveBeenCalledTimes(0);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBe(2);
    expect(stringifySpy).toHaveBeenCalledTimes(2);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.runOnlyPendingTimers();
    expect(vi.getTimerCount()).toBe(0);
    expect(stringifySpy).toHaveBeenCalledTimes(2);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(2);

    const secondBatch: Array<'preview' | 'export'> = ['export', 'preview', 'preview', 'export', 'preview'];
    triggerInterleavedBatch(secondBatch);
    expect(vi.getTimerCount()).toBe(secondBatch.length);
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);
    expect(stringifySpy).toHaveBeenCalledTimes(2);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(99);
    expect(vi.getTimerCount()).toBe(secondBatch.length);
    expect(stringifySpy).toHaveBeenCalledTimes(2);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBe(2);
    expect(stringifySpy).toHaveBeenCalledTimes(expectedPreviewTriggerCount);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(1899);
    expect(vi.getTimerCount()).toBe(2);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(expectedExportTriggerCount);
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);

    vi.runOnlyPendingTimers();
    expect(vi.getTimerCount()).toBe(0);
    stringifySpy.mockRestore();
  });

  it('handleExport and handlePreviewData keep deterministic counts under pre-threshold flush and rebatch isolation', () => {
    const context = createContext();
    const stringifySpy = vi.spyOn(JSON, 'stringify');
    let expectedUpdateTabCount = 0;
    let expectedPreviewTriggerCount = 0;
    let expectedExportTriggerCount = 0;

    const triggerInterleavedBatch = (batch: Array<'preview' | 'export'>) => {
      batch.forEach((action) => {
        if (action === 'preview') {
          context.commands.handlePreviewData();
          expectedPreviewTriggerCount += 1;
        } else {
          context.commands.handleExport();
          expectedExportTriggerCount += 1;
        }
        expectedUpdateTabCount += 1;
        expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);
      });
    };

    const firstBatch: Array<'preview' | 'export'> = ['preview', 'export', 'preview', 'export', 'preview'];
    triggerInterleavedBatch(firstBatch);
    expect(vi.getTimerCount()).toBe(firstBatch.length);
    expect(stringifySpy).toHaveBeenCalledTimes(0);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(99);
    expect(vi.getTimerCount()).toBe(firstBatch.length);
    expect(stringifySpy).toHaveBeenCalledTimes(0);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(0);

    const previewCountAfterFirstBatchFlush = firstBatch.filter((action) => action === 'preview').length;
    const exportCountAfterFirstBatchFlush = firstBatch.filter((action) => action === 'export').length;

    vi.runOnlyPendingTimers();
    expect(vi.getTimerCount()).toBe(0);
    expect(stringifySpy).toHaveBeenCalledTimes(previewCountAfterFirstBatchFlush);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(exportCountAfterFirstBatchFlush);

    const secondBatch: Array<'preview' | 'export'> = ['export', 'preview', 'export', 'preview'];
    triggerInterleavedBatch(secondBatch);
    expect(vi.getTimerCount()).toBe(secondBatch.length);
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);
    expect(stringifySpy).toHaveBeenCalledTimes(previewCountAfterFirstBatchFlush);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(exportCountAfterFirstBatchFlush);

    vi.advanceTimersByTime(99);
    expect(vi.getTimerCount()).toBe(secondBatch.length);
    expect(stringifySpy).toHaveBeenCalledTimes(previewCountAfterFirstBatchFlush);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(exportCountAfterFirstBatchFlush);

    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBe(2);
    expect(stringifySpy).toHaveBeenCalledTimes(expectedPreviewTriggerCount);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(exportCountAfterFirstBatchFlush);

    vi.advanceTimersByTime(1899);
    expect(vi.getTimerCount()).toBe(2);
    expect(stringifySpy).toHaveBeenCalledTimes(expectedPreviewTriggerCount);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(exportCountAfterFirstBatchFlush);

    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(expectedExportTriggerCount);
    expect(context.filesStore.updateTab).toHaveBeenCalledTimes(expectedUpdateTabCount);

    vi.runOnlyPendingTimers();
    expect(vi.getTimerCount()).toBe(0);
    expect(stringifySpy).toHaveBeenCalledTimes(expectedPreviewTriggerCount);
    expect(context.filesStore.exportData).toHaveBeenCalledTimes(expectedExportTriggerCount);
    stringifySpy.mockRestore();
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

  it('openImportDialog keeps reset behavior idempotent across repeated calls', () => {
    const context = createContext();

    context.importSource.value = 'teamCode';
    context.teamCodeInput.value = '#TA#DIRTY-A';
    context.state.showImportDialog = false;

    context.commands.openImportDialog();

    expect(context.importSource.value).toBe('json');
    expect(context.teamCodeInput.value).toBe('');
    expect(context.state.showImportDialog).toBe(true);

    context.importSource.value = 'teamCode';
    context.teamCodeInput.value = '#TA#DIRTY-B';
    context.state.showImportDialog = true;

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
    context.importSource.value = 'json';
    context.teamCodeInput.value = '#TA#DIRTY';
    context.state.showImportDialog = true;

    context.commands.triggerJsonFileImport();

    expect(context.state.showImportDialog).toBe(false);
    expect(context.importSource.value).toBe('json');
    expect(context.teamCodeInput.value).toBe('#TA#DIRTY');
    expect(context.filesStore.importData).not.toHaveBeenCalled();
    expect(context.refreshLogicFlowCanvas).not.toHaveBeenCalled();
    expect(context.showMessage).toHaveBeenCalledWith('error', '文件格式错误');
    expect(input.value).toBe('');
    createElementSpy.mockRestore();
  });

  it('triggerJsonFileImport keeps dialog state semantics across repeated parse failures', () => {
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
    context.importSource.value = 'json';
    context.teamCodeInput.value = '#TA#KEEP';
    context.state.showImportDialog = true;

    context.commands.triggerJsonFileImport();

    expect(context.state.showImportDialog).toBe(false);
    expect(context.importSource.value).toBe('json');
    expect(context.teamCodeInput.value).toBe('#TA#KEEP');

    context.state.showImportDialog = true;
    context.commands.triggerJsonFileImport();

    expect(context.state.showImportDialog).toBe(false);
    expect(context.importSource.value).toBe('json');
    expect(context.teamCodeInput.value).toBe('#TA#KEEP');
    expect(context.filesStore.importData).not.toHaveBeenCalled();
    expect(context.refreshLogicFlowCanvas).not.toHaveBeenCalled();
    expect(context.showMessage).toHaveBeenCalledTimes(2);
    expect(context.showMessage).toHaveBeenNthCalledWith(1, 'error', '文件格式错误');
    expect(context.showMessage).toHaveBeenNthCalledWith(2, 'error', '文件格式错误');
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

  it('triggerTeamCodeQrImport keeps no-op behavior when qr input ref is null', () => {
    const context = createContext();

    context.teamCodeQrInputRef.value = null;

    expect(() => context.commands.triggerTeamCodeQrImport()).not.toThrow();
    expect(context.state.decodingTeamCodeQr).toBe(false);
    expect(context.showMessage).not.toHaveBeenCalled();
  });

  it('triggerTeamCodeQrImport keeps click count aligned with trigger count when qr input ref exists', () => {
    const context = createContext();
    const click = vi.fn();
    const inputRef = {
      click,
    } as unknown as HTMLInputElement;
    const triggerCount = 4;

    context.teamCodeQrInputRef.value = inputRef;

    for (let round = 0; round < triggerCount; round += 1) {
      context.commands.triggerTeamCodeQrImport();
    }

    expect(click).toHaveBeenCalledTimes(triggerCount);
    expect(context.state.decodingTeamCodeQr).toBe(false);
    expect(context.showMessage).not.toHaveBeenCalled();
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

  it('handleTeamCodeQrImport keeps decoding state recovery for async success/failure branches', async () => {
    const context = createContext();
    const successFile = new File(['qr-success'], 'team-code-success.png', { type: 'image/png' });
    const successTarget = {
      files: [successFile],
      value: 'filled-success',
    } as unknown as HTMLInputElement;
    const successDeferred = createDeferred<string>();
    vi.mocked(decodeTeamCodeFromQrImage).mockReturnValueOnce(successDeferred.promise as never);

    const successPromise = context.commands.handleTeamCodeQrImport({ target: successTarget } as unknown as Event);
    expect(context.state.decodingTeamCodeQr).toBe(true);

    successDeferred.resolve('#TA#SUCCESS');
    await successPromise;

    expect(context.state.decodingTeamCodeQr).toBe(false);
    expect(context.teamCodeInput.value).toBe('#TA#SUCCESS');
    expect(successTarget.value).toBe('');
    expect(context.showMessage).toHaveBeenCalledWith('success', '二维码识别成功，已填入阵容码');

    const failureFile = new File(['qr-failure'], 'team-code-failure.png', { type: 'image/png' });
    const failureTarget = {
      files: [failureFile],
      value: 'filled-failure',
    } as unknown as HTMLInputElement;
    const failureDeferred = createDeferred<string>();
    vi.mocked(decodeTeamCodeFromQrImage).mockReturnValueOnce(failureDeferred.promise as never);

    const failurePromise = context.commands.handleTeamCodeQrImport({ target: failureTarget } as unknown as Event);
    expect(context.state.decodingTeamCodeQr).toBe(true);

    failureDeferred.reject(new Error('二维码识别失败-异步'));
    await failurePromise;

    expect(context.state.decodingTeamCodeQr).toBe(false);
    expect(context.teamCodeInput.value).toBe('#TA#SUCCESS');
    expect(failureTarget.value).toBe('');
    expect(context.showMessage).toHaveBeenCalledWith('error', '二维码识别失败-异步');
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

  it('handleTeamCodeQrImport keeps no-op and decoding-state isolation for missing/abnormal event targets', async () => {
    const context = createContext();
    const malformedTarget = {
      value: 'filled',
      files: undefined,
    } as unknown as HTMLInputElement;

    await context.commands.handleTeamCodeQrImport({} as Event);
    await context.commands.handleTeamCodeQrImport({ target: malformedTarget } as unknown as Event);

    expect(decodeTeamCodeFromQrImage).not.toHaveBeenCalled();
    expect(context.state.decodingTeamCodeQr).toBe(false);
    expect(context.teamCodeInput.value).toBe('');
    expect(context.showMessage).not.toHaveBeenCalled();
    expect(malformedTarget.value).toBe('');
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

