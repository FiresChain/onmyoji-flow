import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import Toolbar from '@/components/Toolbar.vue';

const wiringSpies = vi.hoisted(() => ({
  handleExport: vi.fn(),
  handlePreviewData: vi.fn(),
  openImportDialog: vi.fn(),
  prepareCapture: vi.fn(),
  openAssetManager: vi.fn(),
  openRuleManager: vi.fn(),
  loadExample: vi.fn(),
  handleResetWorkspace: vi.fn(),
  handleClearCanvas: vi.fn(),
  showUpdateLog: vi.fn(),
  showFeedbackForm: vi.fn(),
  openWatermarkDialog: vi.fn(),
  mountDialogState: vi.fn(),
  mountAssetManagement: vi.fn(),
  disposeAssetManagement: vi.fn(),
}));

vi.mock('@/ts/useStore', () => ({
  useFilesStore: vi.fn(() => ({
    bindLogicFlowScope: vi.fn(),
    getTab: vi.fn(),
    updateTab: vi.fn(),
    exportData: vi.fn(),
    importData: vi.fn(),
    resetWorkspace: vi.fn(),
    fileList: [],
    activeFileId: 'file-1',
  })),
}));

vi.mock('@/ts/useLogicFlow', () => ({
  useLogicFlowScope: vi.fn(() => Symbol('toolbar-wiring-scope')),
  getLogicFlowInstance: vi.fn(() => null),
}));

vi.mock('@/ts/useCanvasSettings', () => ({
  useCanvasSettings: vi.fn(() => ({
    selectionEnabled: ref(true),
    snapGridEnabled: ref(true),
    snaplineEnabled: ref(true),
  })),
}));

vi.mock('@/ts/useGlobalMessage', () => ({
  useGlobalMessage: vi.fn(() => ({
    showMessage: vi.fn(),
  })),
}));

vi.mock('@/ts/useSafeI18n', () => ({
  useSafeI18n: vi.fn((messages: Record<string, string>) => ({
    t: (key: string) => messages[key] || key,
  })),
}));

vi.mock('@/utils/assetUrl', () => ({
  resolveAssetUrl: vi.fn((value: string) => value),
}));

vi.mock('@/components/composables/useToolbarImportExportCommands', () => ({
  useToolbarImportExportCommands: vi.fn(() => ({
    handleExport: wiringSpies.handleExport,
    handlePreviewData: wiringSpies.handlePreviewData,
    copyDataToClipboard: vi.fn(),
    openImportDialog: wiringSpies.openImportDialog,
    triggerJsonFileImport: vi.fn(),
    triggerTeamCodeQrImport: vi.fn(),
    handleTeamCodeImport: vi.fn(),
    handleTeamCodeQrImport: vi.fn(),
    prepareCapture: wiringSpies.prepareCapture,
    downloadImage: vi.fn(),
    handleClose: vi.fn(),
  })),
}));

vi.mock('@/components/composables/useToolbarAssetManagement', () => ({
  useToolbarAssetManagement: vi.fn(() => ({
    assetLibraries: [{ id: 'shikigami', label: '式神素材' }],
    assetManagerLibrary: ref('shikigami'),
    assetUploadInputRef: ref(null),
    mountAssetManagement: wiringSpies.mountAssetManagement,
    disposeAssetManagement: wiringSpies.disposeAssetManagement,
    openAssetManager: wiringSpies.openAssetManager,
    getManagedAssets: vi.fn(() => []),
    triggerAssetManagerUpload: vi.fn(),
    handleAssetManagerUpload: vi.fn(),
    removeManagedAsset: vi.fn(),
  })),
}));

vi.mock('@/components/composables/useToolbarRuleManagement', () => ({
  useToolbarRuleManagement: vi.fn(() => ({
    ruleBundleImportInputRef: ref(null),
    ruleManagerTab: ref<'rules' | 'variables' | 'docs'>('rules'),
    ruleConfigDraft: ref({
      expressionRules: [],
      ruleVariables: [],
    }),
    ruleEditorVisible: ref(false),
    ruleEditorDraft: ref(null),
    ruleScopeDoc: '',
    ruleContextDoc: '',
    ruleSyntaxDoc: '',
    ruleFunctionDoc: '',
    ruleExamplesDoc: '',
    openRuleManager: wiringSpies.openRuleManager,
    addExpressionRule: vi.fn(),
    addRuleVariable: vi.fn(),
    exportRuleBundle: vi.fn(),
    triggerRuleBundleImport: vi.fn(),
    reloadRuleManagerDraft: vi.fn(),
    applyRuleManagerConfig: vi.fn(),
    restoreDefaultRuleConfig: vi.fn(),
    handleRuleBundleImport: vi.fn(),
    openExpressionRuleEditor: vi.fn(),
    removeExpressionRule: vi.fn(),
    removeRuleVariable: vi.fn(),
    cancelRuleEditor: vi.fn(),
    saveRuleEditor: vi.fn(),
  })),
}));

vi.mock('@/components/composables/useToolbarWorkspaceCommands', () => ({
  useToolbarWorkspaceCommands: vi.fn(() => ({
    loadExample: wiringSpies.loadExample,
    handleResetWorkspace: wiringSpies.handleResetWorkspace,
    handleClearCanvas: wiringSpies.handleClearCanvas,
  })),
}));

vi.mock('@/components/composables/useToolbarDialogState', () => ({
  useToolbarDialogState: vi.fn(() => ({
    watermark: ref({
      text: '示例水印',
      fontSize: 30,
      color: 'rgba(184, 184, 184, 0.3)',
      angle: -20,
      rows: 1,
      cols: 1,
    }),
    showUpdateLog: wiringSpies.showUpdateLog,
    showFeedbackForm: wiringSpies.showFeedbackForm,
    openWatermarkDialog: wiringSpies.openWatermarkDialog,
    applyWatermarkSettings: vi.fn(),
    mountDialogState: wiringSpies.mountDialogState,
  })),
}));

const ElButtonStub = defineComponent({
  name: 'ElButton',
  emits: ['click'],
  setup(_, { emit, slots }) {
    return () => h('button', { onClick: () => emit('click') }, slots.default?.());
  },
});

const createWrapper = () => {
  return mount(Toolbar, {
    global: {
      stubs: {
        'el-button': ElButtonStub,
        'el-switch': true,
        'el-dialog': true,
        'el-form': true,
        'el-form-item': true,
        'el-input': true,
        'el-input-number': true,
        'el-color-picker': true,
        'el-radio-group': true,
        'el-radio-button': true,
        'el-alert': true,
        'el-tabs': true,
        'el-tab-pane': true,
        'el-table': true,
        'el-table-column': true,
        'el-checkbox': true,
        'el-select': true,
        'el-option': true,
        'el-empty': true,
      },
    },
  });
};

const clickButtonByText = async (buttonText: string) => {
  const wrapper = createWrapper();
  const button = wrapper
    .findAll('button')
    .find((item) => item.text().includes(buttonText));
  expect(button).toBeTruthy();
  await button!.trigger('click');
  wrapper.unmount();
};

describe('toolbar wiring regression', () => {
  beforeEach(() => {
    Object.values(wiringSpies).forEach((spy) => spy.mockReset());
  });

  it('keeps lifecycle mount/dispose wiring for asset and dialog composables', () => {
    const wrapper = createWrapper();

    expect(wiringSpies.mountAssetManagement).toHaveBeenCalledTimes(1);
    expect(wiringSpies.mountDialogState).toHaveBeenCalledTimes(1);
    expect(wiringSpies.disposeAssetManagement).toHaveBeenCalledTimes(0);

    wrapper.unmount();
    expect(wiringSpies.disposeAssetManagement).toHaveBeenCalledTimes(1);
  });

  it('keeps toolbar action buttons bound to composable commands', async () => {
    await clickButtonByText('导入');
    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(1);

    await clickButtonByText('导出');
    expect(wiringSpies.handleExport).toHaveBeenCalledTimes(1);

    await clickButtonByText('数据预览');
    expect(wiringSpies.handlePreviewData).toHaveBeenCalledTimes(1);

    await clickButtonByText('准备截图');
    expect(wiringSpies.prepareCapture).toHaveBeenCalledTimes(1);

    await clickButtonByText('设置水印');
    expect(wiringSpies.openWatermarkDialog).toHaveBeenCalledTimes(1);

    await clickButtonByText('素材管理');
    expect(wiringSpies.openAssetManager).toHaveBeenCalledTimes(1);

    await clickButtonByText('规则管理');
    expect(wiringSpies.openRuleManager).toHaveBeenCalledTimes(1);

    await clickButtonByText('加载样例');
    expect(wiringSpies.loadExample).toHaveBeenCalledTimes(1);

    await clickButtonByText('更新日志');
    expect(wiringSpies.showUpdateLog).toHaveBeenCalledTimes(1);

    await clickButtonByText('问题反馈');
    expect(wiringSpies.showFeedbackForm).toHaveBeenCalledTimes(1);

    await clickButtonByText('重置工作区');
    expect(wiringSpies.handleResetWorkspace).toHaveBeenCalledTimes(1);

    await clickButtonByText('清空画布');
    expect(wiringSpies.handleClearCanvas).toHaveBeenCalledTimes(1);
  });
});
