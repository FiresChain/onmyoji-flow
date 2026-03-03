import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import Toolbar from '@/components/Toolbar.vue';

const wiringSpies = vi.hoisted(() => ({
  handleExport: vi.fn(),
  handlePreviewData: vi.fn(),
  openImportDialog: vi.fn(),
  triggerJsonFileImport: vi.fn(),
  handleTeamCodeImport: vi.fn(),
  triggerTeamCodeQrImport: vi.fn(),
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
  useToolbarImportExportCommands: vi.fn((options: {
    importSource: { value: 'json' | 'teamCode' };
    teamCodeInput: { value: string };
    state: { showImportDialog: boolean };
  }) => ({
    handleExport: wiringSpies.handleExport,
    handlePreviewData: wiringSpies.handlePreviewData,
    copyDataToClipboard: vi.fn(),
    openImportDialog: () => {
      wiringSpies.openImportDialog();
      options.importSource.value = 'json';
      options.teamCodeInput.value = '';
      options.state.showImportDialog = true;
    },
    triggerJsonFileImport: wiringSpies.triggerJsonFileImport,
    triggerTeamCodeQrImport: wiringSpies.triggerTeamCodeQrImport,
    handleTeamCodeImport: wiringSpies.handleTeamCodeImport,
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

const ElDialogStub = defineComponent({
  name: 'ElDialog',
  setup(_, { slots }) {
    return () => h('div', [slots.default?.(), slots.footer?.()]);
  },
});

const ElDialogWithFooterNoiseStub = defineComponent({
  name: 'ElDialog',
  setup(_, { attrs, slots }) {
    return () => {
      const title = typeof attrs.title === 'string' ? attrs.title : '';
      const noiseFooter = title === '导入数据'
        ? []
        : [h('span', { class: 'dialog-footer dialog-footer-noise' }, 'noise-footer')];
      return h('div', [...noiseFooter, slots.default?.(), slots.footer?.()]);
    };
  },
});

const ElFormStub = defineComponent({
  name: 'ElForm',
  setup(_, { attrs, slots }) {
    return () => h('div', attrs, slots.default?.());
  },
});

const ElFormItemStub = defineComponent({
  name: 'ElFormItem',
  setup(_, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const createWrapper = (options?: { footerNoise?: boolean }) => {
  const dialogStub = options?.footerNoise ? ElDialogWithFooterNoiseStub : ElDialogStub;
  return mount(Toolbar, {
    global: {
      stubs: {
        'el-button': ElButtonStub,
        'el-switch': true,
        'el-dialog': dialogStub,
        'el-form': ElFormStub,
        'el-form-item': ElFormItemStub,
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

const findButtonByText = (wrapper: ReturnType<typeof createWrapper>, buttonText: string) => {
  return wrapper
    .findAll('button')
    .find((item) => item.text().trim() === buttonText);
};

const clickButtonByText = async (buttonText: string) => {
  const wrapper = createWrapper();
  const button = findButtonByText(wrapper, buttonText)
    ?? wrapper
      .findAll('button')
      .find((item) => item.text().includes(buttonText));
  expect(button).toBeTruthy();
  await button!.trigger('click');
  wrapper.unmount();
};

const getImportDialogScope = (
  wrapper: ReturnType<typeof createWrapper>,
  expectedSource: 'json' | 'teamCode',
) => {
  const allDialogFooters = wrapper.findAll('.dialog-footer');
  expect(allDialogFooters.length).toBeGreaterThan(1);
  const allImportForms = wrapper.findAll('.import-form');
  expect(allImportForms).toHaveLength(1);

  const importDialogScopes = wrapper.findAll('div').filter((scope) => {
    return scope.find('.import-form').exists()
      && scope.findAll('.import-form').length === 1
      && scope.find('.dialog-footer').exists()
      && scope.findAll('.dialog-footer').length === 1;
  });
  expect(importDialogScopes).toHaveLength(1);
  const importDialogScope = importDialogScopes[0];

  const nonImportDialogFooters = allDialogFooters.filter((footer) => {
    return !importDialogScope.element.contains(footer.element);
  });
  expect(nonImportDialogFooters.length).toBeGreaterThan(0);
  nonImportDialogFooters.forEach((footer) => {
    expect(importDialogScope.element.contains(footer.element)).toBe(false);
  });
  expect(importDialogScope.element.contains(allImportForms[0].element)).toBe(true);

  if (expectedSource === 'teamCode') {
    const teamCodeQrActions = importDialogScope.findAll('.team-code-qr-actions');
    const globalTeamCodeQrActions = wrapper.findAll('.team-code-qr-actions');
    expect(globalTeamCodeQrActions).toHaveLength(1);
    expect(teamCodeQrActions).toHaveLength(1);
    expect(importDialogScope.element.contains(teamCodeQrActions[0].element)).toBe(true);
    expect(importDialogScope.element.contains(globalTeamCodeQrActions[0].element)).toBe(true);
  }

  return importDialogScope;
};

const getImportDialogCommandButtons = (
  wrapper: ReturnType<typeof createWrapper>,
  expectedSource: 'json' | 'teamCode',
) => {
  const importDialogScope = getImportDialogScope(wrapper, expectedSource);
  const footerButtons = importDialogScope.findAll('.dialog-footer button');
  const teamCodeQrActions = importDialogScope.find('.team-code-qr-actions');
  const teamCodeQrButton = importDialogScope.find('.team-code-qr-actions button');
  return {
    footerButtons,
    teamCodeQrActions,
    teamCodeQrButton,
  };
};

const assertImportSourceBoundVisibility = (
  wrapper: ReturnType<typeof createWrapper>,
  vm: ToolbarVm,
  expectedSource: 'json' | 'teamCode',
) => {
  expect(vm.importSource).toBe(expectedSource);
  const { footerButtons, teamCodeQrActions, teamCodeQrButton } = getImportDialogCommandButtons(wrapper, expectedSource);
  expect(footerButtons).toHaveLength(2);

  const sourceCommandButton = footerButtons[1];
  expect(sourceCommandButton).toBeTruthy();

  if (expectedSource === 'json') {
    expect(teamCodeQrActions.exists()).toBe(false);
    expect(teamCodeQrButton.exists()).toBe(false);
  } else {
    expect(teamCodeQrActions.exists()).toBe(true);
    expect(teamCodeQrButton.exists()).toBe(true);
  }

  return {
    sourceCommandButton: sourceCommandButton!,
    teamCodeQrButton,
  };
};

type ToolbarVm = {
  importSource: 'json' | 'teamCode';
  teamCodeInput: string;
  state: {
    showImportDialog: boolean;
  };
  $nextTick: () => Promise<void>;
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

  it('keeps import dialog wiring stable across repeated open-switch-close cycles', async () => {
    const wrapper = createWrapper();
    const vm = wrapper.vm as unknown as ToolbarVm;

    const importButton = findButtonByText(wrapper, '导入');
    expect(importButton).toBeTruthy();
    let importButtonTriggerCount = 0;

    for (let round = 1; round <= 2; round += 1) {
      await importButton!.trigger('click');
      importButtonTriggerCount += 1;

      expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(importButtonTriggerCount);
      expect(vm.importSource).toBe('json');
      expect(vm.teamCodeInput).toBe('');
      expect(vm.state.showImportDialog).toBe(true);

      let sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'json');
      await sourceBoundVisibility.sourceCommandButton.trigger('click');
      expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(round);

      vm.importSource = 'teamCode';
      vm.teamCodeInput = `#TA#DIRTY-${round}`;
      await vm.$nextTick();

      sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'teamCode');
      await sourceBoundVisibility.sourceCommandButton.trigger('click');
      expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(round);

      expect(sourceBoundVisibility.teamCodeQrButton.exists()).toBe(true);
      await sourceBoundVisibility.teamCodeQrButton.trigger('click');
      expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(round);

      vm.state.showImportDialog = false;
      await vm.$nextTick();
      expect(vm.state.showImportDialog).toBe(false);

      vm.importSource = 'teamCode';
      vm.teamCodeInput = `#TA#CLOSED-${round}`;
      await vm.$nextTick();
    }

    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(importButtonTriggerCount);
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(importButtonTriggerCount);
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(importButtonTriggerCount);
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(importButtonTriggerCount);

    wrapper.unmount();
  });

  it('keeps import source-toggle visibility and command counts stable without drift', async () => {
    const wrapper = createWrapper();
    const vm = wrapper.vm as unknown as ToolbarVm;
    const importButton = findButtonByText(wrapper, '导入');
    expect(importButton).toBeTruthy();

    let importTriggerCount = 0;
    let expectedJsonTriggerCount = 0;
    let expectedTeamCodeTriggerCount = 0;
    let expectedQrTriggerCount = 0;

    const openImportDialog = async () => {
      await importButton!.trigger('click');
      importTriggerCount += 1;

      expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(importTriggerCount);
      expect(vm.state.showImportDialog).toBe(true);
      expect(vm.importSource).toBe('json');
      expect(vm.teamCodeInput).toBe('');
    };

    await openImportDialog();
    let sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'json');
    await sourceBoundVisibility.sourceCommandButton.trigger('click');
    expectedJsonTriggerCount += 1;
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonTriggerCount);

    vm.importSource = 'teamCode';
    await vm.$nextTick();
    sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'teamCode');
    await sourceBoundVisibility.sourceCommandButton.trigger('click');
    expectedTeamCodeTriggerCount += 1;
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeTriggerCount);
    expect(sourceBoundVisibility.teamCodeQrButton.exists()).toBe(true);
    await sourceBoundVisibility.teamCodeQrButton.trigger('click');
    expectedQrTriggerCount += 1;
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrTriggerCount);

    vm.importSource = 'json';
    await vm.$nextTick();
    sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'json');
    await sourceBoundVisibility.sourceCommandButton.trigger('click');
    expectedJsonTriggerCount += 1;
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonTriggerCount);

    vm.importSource = 'teamCode';
    await vm.$nextTick();
    sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'teamCode');
    await sourceBoundVisibility.sourceCommandButton.trigger('click');
    expectedTeamCodeTriggerCount += 1;
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeTriggerCount);
    expect(sourceBoundVisibility.teamCodeQrButton.exists()).toBe(true);
    await sourceBoundVisibility.teamCodeQrButton.trigger('click');
    expectedQrTriggerCount += 1;
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrTriggerCount);

    vm.state.showImportDialog = false;
    await vm.$nextTick();
    vm.importSource = 'teamCode';
    vm.teamCodeInput = '#TA#DIRTY-CLOSED';
    await vm.$nextTick();

    await openImportDialog();
    sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'json');
    await sourceBoundVisibility.sourceCommandButton.trigger('click');
    expectedJsonTriggerCount += 1;
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonTriggerCount);

    vm.importSource = 'teamCode';
    await vm.$nextTick();
    sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'teamCode');
    await sourceBoundVisibility.sourceCommandButton.trigger('click');
    expectedTeamCodeTriggerCount += 1;
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeTriggerCount);
    expect(sourceBoundVisibility.teamCodeQrButton.exists()).toBe(true);
    await sourceBoundVisibility.teamCodeQrButton.trigger('click');
    expectedQrTriggerCount += 1;
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrTriggerCount);

    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(importTriggerCount);
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonTriggerCount);
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeTriggerCount);
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrTriggerCount);

    wrapper.unmount();
  });

  it('keeps import-dialog structural anchor exclusive and command counts aligned under footer-noise reopen cycles', async () => {
    const wrapper = createWrapper({ footerNoise: true });
    const vm = wrapper.vm as unknown as ToolbarVm;
    const importButton = findButtonByText(wrapper, '导入');
    expect(importButton).toBeTruthy();

    let expectedOpenCount = 0;
    let expectedJsonCount = 0;
    let expectedTeamCodeCount = 0;
    let expectedQrCount = 0;

    for (let round = 1; round <= 3; round += 1) {
      await importButton!.trigger('click');
      expectedOpenCount += 1;
      expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(expectedOpenCount);
      expect(vm.importSource).toBe('json');
      expect(vm.teamCodeInput).toBe('');
      expect(vm.state.showImportDialog).toBe(true);

      let sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'json');
      await sourceBoundVisibility.sourceCommandButton.trigger('click');
      expectedJsonCount += 1;
      expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonCount);

      vm.importSource = 'teamCode';
      vm.teamCodeInput = `#TA#FOOTER-NOISE-${round}`;
      await vm.$nextTick();

      sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'teamCode');
      await sourceBoundVisibility.sourceCommandButton.trigger('click');
      expectedTeamCodeCount += 1;
      expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeCount);
      expect(sourceBoundVisibility.teamCodeQrButton.exists()).toBe(true);
      await sourceBoundVisibility.teamCodeQrButton.trigger('click');
      expectedQrCount += 1;
      expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrCount);

      vm.state.showImportDialog = false;
      await vm.$nextTick();
      vm.importSource = 'teamCode';
      vm.teamCodeInput = `#TA#CLOSED-NOISE-${round}`;
      await vm.$nextTick();
    }

    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(expectedOpenCount);
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonCount);
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeCount);
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrCount);

    wrapper.unmount();
  });
});
