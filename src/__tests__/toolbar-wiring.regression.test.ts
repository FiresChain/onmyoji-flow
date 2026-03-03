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

const ElDialogWithMixedStructuralNoiseStub = defineComponent({
  name: 'ElDialog',
  setup(_, { attrs, slots }) {
    return () => {
      const title = typeof attrs.title === 'string' ? attrs.title : '';
      const isImportDialog = title === '导入数据';
      const mixedNoiseNodes = isImportDialog
        ? []
        : [
          h('span', { class: 'dialog-footer dialog-footer-noise' }, 'noise-footer'),
          h('div', { class: 'dialog-structure-noise' }, [
            h('span', { class: 'dialog-footer dialog-footer-noise dialog-footer-noise-secondary' }, 'noise-footer-secondary'),
            h('div', { class: 'import-form-noise' }, 'noise-import-form'),
            h('div', { class: 'team-code-qr-actions-noise' }, [
              h('button', 'noise-qr-entry'),
            ]),
          ]),
        ];
      return h('div', [...mixedNoiseNodes, slots.default?.(), slots.footer?.()]);
    };
  },
});

const ElDialogWithSlotWrapperStructuralNoiseStub = defineComponent({
  name: 'ElDialog',
  setup(_, { attrs, slots }) {
    return () => {
      const title = typeof attrs.title === 'string' ? attrs.title : '';
      const isImportDialog = title === '导入数据';
      const slotWrapperNoiseNodes = isImportDialog
        ? []
        : [
          h('span', { class: 'dialog-footer dialog-footer-noise dialog-footer-noise-tertiary' }, 'noise-footer-tertiary'),
          h('div', { class: 'slot-wrapper-structural-noise' }, [
            h('div', { class: 'slot-wrapper slot-wrapper-import-noise' }, [
              h('div', { class: 'import-form slot-wrapper-import-form-noise' }, 'slot-wrapper-import-form-noise'),
              h('span', { class: 'dialog-footer dialog-footer-noise slot-wrapper-dialog-footer-noise' }, [
                h('button', 'slot-wrapper-noise-action'),
              ]),
            ]),
            h('div', { class: 'slot-wrapper team-code-qr-actions-noise slot-wrapper-team-code-qr-actions-noise' }, [
              h('button', 'slot-wrapper-noise-qr-entry'),
            ]),
          ]),
        ];
      return h('div', [...slotWrapperNoiseNodes, slots.default?.(), slots.footer?.()]);
    };
  },
});

const ElDialogWithNestedSlotFooterNoiseMatrixStub = defineComponent({
  name: 'ElDialog',
  setup(_, { attrs, slots }) {
    return () => {
      const title = typeof attrs.title === 'string' ? attrs.title : '';
      const isImportDialog = title === '导入数据';
      const nestedSlotFooterNoiseNodes = isImportDialog
        ? []
        : [
          h('div', { class: 'slot-wrapper-noise-matrix-layer slot-wrapper-noise-matrix-layer-primary' }, [
            h('div', { class: 'slot-wrapper slot-wrapper-noise-matrix slot-wrapper-noise-matrix-primary', slot: 'footer', 'data-slot-footer-noise': 'true' }, [
              h('div', { class: 'slot-wrapper slot-wrapper-noise-matrix-secondary' }, [
                h('div', { class: 'import-form slot-wrapper-import-form-fake-anchor' }, 'slot-wrapper-import-form-fake-anchor'),
                h('div', { class: 'dialog-footer dialog-footer-noise slot-wrapper-dialog-footer-noise-matrix', slot: 'footer', 'data-slot-footer-noise': 'true' }, [
                  h('button', 'slot-wrapper-noise-matrix-action'),
                ]),
              ]),
              h('div', { class: 'team-code-qr-actions slot-wrapper-team-code-qr-actions-fake-anchor', slot: 'footer', 'data-slot-footer-noise': 'true' }, [
                h('button', 'slot-wrapper-noise-matrix-qr-entry'),
              ]),
            ]),
            h('div', { class: 'slot-wrapper slot-wrapper-slot-footer-noise', slot: 'footer', 'data-slot-footer-noise': 'true' }, [
              h('span', { class: 'dialog-footer dialog-footer-noise slot-wrapper-slot-footer-dialog-footer-noise', slot: 'footer', 'data-slot-footer-noise': 'true' }, 'slot-wrapper-slot-footer-noise'),
            ]),
          ]),
        ];
      return h('div', [...nestedSlotFooterNoiseNodes, slots.default?.(), slots.footer?.()]);
    };
  },
});

const ElDialogWithLabelDriftAndFakeCommandNoiseMatrixStub = defineComponent({
  name: 'ElDialog',
  setup(_, { attrs, slots }) {
    return () => {
      const title = typeof attrs.title === 'string' ? attrs.title : '';
      const isImportDialog = title === '导入数据';
      const labelDriftNoiseNodes = isImportDialog
        ? []
        : [
          h('div', { class: 'label-drift-noise-matrix' }, [
            h('div', { class: 'label-drift-fake-scope label-drift-fake-scope-json' }, [
              h('div', { class: 'import-form label-drift-import-form-fake-anchor label-drift-import-form-fake-anchor-json' }, 'label-drift-import-form-fake-anchor-json'),
              h('span', { class: 'dialog-footer label-drift-dialog-footer-fake-anchor label-drift-dialog-footer-fake-anchor-json' }, [
                h('button', '取消'),
                h('button', '选择 JSON 文件'),
                h('button', 'label-drift-extra-command-json'),
              ]),
            ]),
            h('div', { class: 'label-drift-fake-scope label-drift-fake-scope-team-code' }, [
              h('div', { class: 'import-form label-drift-import-form-fake-anchor label-drift-import-form-fake-anchor-team-code' }, 'label-drift-import-form-fake-anchor-team-code'),
              h('span', { class: 'dialog-footer label-drift-dialog-footer-fake-anchor label-drift-dialog-footer-fake-anchor-team-code' }, [
                h('button', '取消'),
                h('button', '导入阵容码'),
                h('button', 'label-drift-extra-command-team-code'),
              ]),
              h('div', { class: 'team-code-qr-actions label-drift-team-code-qr-actions-fake-anchor' }, [
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', '选择二维码图片'),
              ]),
            ]),
          ]),
        ];
      return h('div', [...labelDriftNoiseNodes, slots.default?.(), slots.footer?.()]);
    };
  },
});

const ElDialogWithCommandOrderAndClassDriftNoiseMatrixStub = defineComponent({
  name: 'ElDialog',
  setup(_, { attrs, slots }) {
    return () => {
      const title = typeof attrs.title === 'string' ? attrs.title : '';
      const isImportDialog = title === '导入数据';
      const commandOrderClassDriftNoiseNodes = isImportDialog
        ? []
        : [
          h('div', { class: 'command-order-class-drift-noise-matrix' }, [
            h('div', { class: 'command-order-class-drift-fake-scope command-order-class-drift-fake-scope-json' }, [
              h('div', { class: 'import-form command-order-class-drift-import-form-fake-anchor command-order-class-drift-import-form-fake-anchor-json' }, 'command-order-class-drift-import-form-fake-anchor-json'),
              h('span', { class: 'dialog-footer command-order-class-drift-dialog-footer-fake-anchor command-order-class-drift-dialog-footer-fake-anchor-json' }, [
                h('button', '选择 JSON 文件'),
                h('button', '取消'),
                h('button', 'command-order-class-drift-extra-noise-json'),
              ]),
            ]),
            h('div', { class: 'command-order-class-drift-fake-scope command-order-class-drift-fake-scope-team-code' }, [
              h('div', { class: 'import-form command-order-class-drift-import-form-fake-anchor command-order-class-drift-import-form-fake-anchor-team-code' }, 'command-order-class-drift-import-form-fake-anchor-team-code'),
              h('span', { class: 'dialog-footer command-order-class-drift-dialog-footer-fake-anchor command-order-class-drift-dialog-footer-fake-anchor-team-code' }, [
                h('button', '导入阵容码'),
                h('button', '取消'),
                h('button', 'command-order-class-drift-extra-noise-team-code'),
              ]),
              h('div', { class: 'team-code-qr-actions command-order-class-drift-team-code-qr-actions-fake-anchor' }, [
                h('button', 'command-order-class-drift-extra-noise-qr'),
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', '选择二维码图片'),
              ]),
            ]),
          ]),
        ];
      return h('div', [...commandOrderClassDriftNoiseNodes, slots.default?.(), slots.footer?.()]);
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

const createWrapper = (options?: {
  footerNoise?: boolean;
  mixedStructuralNoise?: boolean;
  slotWrapperStructuralNoise?: boolean;
  nestedSlotFooterNoiseMatrix?: boolean;
  labelDriftFakeCommandNoiseMatrix?: boolean;
  commandOrderClassDriftNoiseMatrix?: boolean;
}) => {
  const dialogStub = options?.commandOrderClassDriftNoiseMatrix
    ? ElDialogWithCommandOrderAndClassDriftNoiseMatrixStub
    : options?.labelDriftFakeCommandNoiseMatrix
    ? ElDialogWithLabelDriftAndFakeCommandNoiseMatrixStub
    : options?.nestedSlotFooterNoiseMatrix
    ? ElDialogWithNestedSlotFooterNoiseMatrixStub
    : options?.slotWrapperStructuralNoise
    ? ElDialogWithSlotWrapperStructuralNoiseStub
    : options?.mixedStructuralNoise
    ? ElDialogWithMixedStructuralNoiseStub
    : options?.footerNoise
      ? ElDialogWithFooterNoiseStub
      : ElDialogStub;
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
  const expectedSourceButtonText = expectedSource === 'json' ? '选择 JSON 文件' : '导入阵容码';
  const allDialogFooters = wrapper.findAll('.dialog-footer');
  expect(allDialogFooters.length).toBeGreaterThan(1);
  const allImportForms = wrapper.findAll('.import-form');
  expect(allImportForms.length).toBeGreaterThan(0);

  const importDialogScopes = wrapper.findAll('div').filter((scope) => {
    const footerButtons = scope.findAll('.dialog-footer button');
    const sourceCommandButton = footerButtons[1];
    return scope.find('.import-form').exists()
      && scope.findAll('.import-form').length === 1
      && scope.find('.dialog-footer').exists()
      && scope.findAll('.dialog-footer').length === 1
      && footerButtons.length === 2
      && Boolean(sourceCommandButton)
      && sourceCommandButton.text().trim() === expectedSourceButtonText;
  });
  expect(importDialogScopes).toHaveLength(1);
  const importDialogScope = importDialogScopes[0];
  const importFormInScope = importDialogScope.find('.import-form');
  expect(importFormInScope.exists()).toBe(true);

  const nonImportDialogFooters = allDialogFooters.filter((footer) => {
    return !importDialogScope.element.contains(footer.element);
  });
  expect(nonImportDialogFooters.length).toBeGreaterThan(0);
  nonImportDialogFooters.forEach((footer) => {
    expect(importDialogScope.element.contains(footer.element)).toBe(false);
  });

  if (expectedSource === 'teamCode') {
    const broadTeamCodeQrActions = wrapper.findAll('.team-code-qr-actions').filter((actionsScope) => {
      const teamCodeQrButton = actionsScope
        .findAll('button')
        .find((button) => button.text().trim() === '选择二维码图片');
      return actionsScope.find('input[accept="image/*"]').exists() && Boolean(teamCodeQrButton);
    });
    const teamCodeQrActions = broadTeamCodeQrActions.filter((actionsScope) => {
      return importDialogScope.element.contains(actionsScope.element);
    });
    const globalTeamCodeQrActions = broadTeamCodeQrActions.filter((actionsScope) => {
      return importDialogScope.element.contains(actionsScope.element);
    });
    expect(broadTeamCodeQrActions.length).toBeGreaterThanOrEqual(1);
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

  it('keeps import-dialog scope anchoring and command counts aligned under mixed structural-noise reopen cycles', async () => {
    const wrapper = createWrapper({ mixedStructuralNoise: true });
    const vm = wrapper.vm as unknown as ToolbarVm;
    const importButton = findButtonByText(wrapper, '导入');
    expect(importButton).toBeTruthy();

    expect(wrapper.findAll('.dialog-footer-noise').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.dialog-structure-noise').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.import-form-noise').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.team-code-qr-actions-noise').length).toBeGreaterThan(0);

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
      vm.teamCodeInput = `#TA#MIXED-NOISE-${round}`;
      await vm.$nextTick();

      sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'teamCode');
      const importDialogScope = getImportDialogScope(wrapper, 'teamCode');
      expect(importDialogScope.findAll('.team-code-qr-actions')).toHaveLength(1);
      wrapper.findAll('.team-code-qr-actions-noise').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });

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
      vm.teamCodeInput = `#TA#CLOSED-MIXED-${round}`;
      await vm.$nextTick();
    }

    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(expectedOpenCount);
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonCount);
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeCount);
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrCount);

    wrapper.unmount();
  });

  it('keeps import-dialog anchoring and command counts aligned under slot-wrapper structural-noise reopen cycles', async () => {
    const wrapper = createWrapper({ slotWrapperStructuralNoise: true });
    const vm = wrapper.vm as unknown as ToolbarVm;
    const importButton = findButtonByText(wrapper, '导入');
    expect(importButton).toBeTruthy();

    expect(wrapper.findAll('.dialog-footer-noise').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.slot-wrapper-structural-noise').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.slot-wrapper-import-form-noise').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.slot-wrapper-team-code-qr-actions-noise').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.import-form').length).toBeGreaterThan(1);

    let expectedOpenCount = 0;
    let expectedJsonCount = 0;
    let expectedTeamCodeCount = 0;
    let expectedQrCount = 0;

    for (let round = 1; round <= 4; round += 1) {
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
      vm.teamCodeInput = `#TA#SLOT-WRAPPER-${round}`;
      await vm.$nextTick();

      sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'teamCode');
      const importDialogScope = getImportDialogScope(wrapper, 'teamCode');
      expect(importDialogScope.findAll('.team-code-qr-actions')).toHaveLength(1);
      wrapper.findAll('.slot-wrapper-import-form-noise').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.slot-wrapper-dialog-footer-noise').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.slot-wrapper-team-code-qr-actions-noise').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });

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
      vm.teamCodeInput = `#TA#CLOSED-SLOT-WRAPPER-${round}`;
      await vm.$nextTick();
    }

    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(expectedOpenCount);
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonCount);
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeCount);
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrCount);

    wrapper.unmount();
  });

  it('keeps import-dialog anchoring and command counts aligned under nested slot-wrapper slot-footer noise matrix reopen cycles', async () => {
    const wrapper = createWrapper({ nestedSlotFooterNoiseMatrix: true });
    const vm = wrapper.vm as unknown as ToolbarVm;
    const importButton = findButtonByText(wrapper, '导入');
    expect(importButton).toBeTruthy();

    expect(wrapper.findAll('.slot-wrapper-noise-matrix-layer').length).toBeGreaterThan(0);
    expect(wrapper.findAll('[data-slot-footer-noise="true"]').length).toBeGreaterThan(4);
    expect(wrapper.findAll('.slot-wrapper-import-form-fake-anchor').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.slot-wrapper-team-code-qr-actions-fake-anchor').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.import-form').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.team-code-qr-actions').length).toBeGreaterThan(1);

    let expectedOpenCount = 0;
    let expectedJsonCount = 0;
    let expectedTeamCodeCount = 0;
    let expectedQrCount = 0;

    for (let round = 1; round <= 5; round += 1) {
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
      vm.teamCodeInput = `#TA#NESTED-SLOT-FOOTER-${round}`;
      await vm.$nextTick();

      sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'teamCode');
      const importDialogScope = getImportDialogScope(wrapper, 'teamCode');
      const scopedRealTeamCodeQrActions = importDialogScope.findAll('.team-code-qr-actions').filter((actionsScope) => {
        const teamCodeQrButton = actionsScope
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        return actionsScope.find('input[accept="image/*"]').exists() && Boolean(teamCodeQrButton);
      });
      expect(scopedRealTeamCodeQrActions).toHaveLength(1);
      wrapper.findAll('.slot-wrapper-import-form-fake-anchor').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.slot-wrapper-dialog-footer-noise-matrix').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.slot-wrapper-slot-footer-dialog-footer-noise').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.slot-wrapper-team-code-qr-actions-fake-anchor').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });

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
      vm.teamCodeInput = `#TA#CLOSED-NESTED-SLOT-FOOTER-${round}`;
      await vm.$nextTick();
    }

    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(expectedOpenCount);
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonCount);
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeCount);
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrCount);

    wrapper.unmount();
  });

  it('keeps import-dialog anchoring and command counts aligned under label-drift and fake-command noise matrix reopen cycles', async () => {
    const wrapper = createWrapper({ labelDriftFakeCommandNoiseMatrix: true });
    const vm = wrapper.vm as unknown as ToolbarVm;
    const importButton = findButtonByText(wrapper, '导入');
    expect(importButton).toBeTruthy();

    expect(wrapper.findAll('.label-drift-noise-matrix').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.label-drift-fake-scope').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.label-drift-import-form-fake-anchor').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.label-drift-dialog-footer-fake-anchor').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.label-drift-team-code-qr-actions-fake-anchor').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.import-form').length).toBeGreaterThan(2);
    expect(wrapper.findAll('.team-code-qr-actions').length).toBeGreaterThan(1);

    let expectedOpenCount = 0;
    let expectedJsonCount = 0;
    let expectedTeamCodeCount = 0;
    let expectedQrCount = 0;

    for (let round = 1; round <= 4; round += 1) {
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
      vm.teamCodeInput = `#TA#LABEL-DRIFT-${round}`;
      await vm.$nextTick();

      sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'teamCode');
      const importDialogScope = getImportDialogScope(wrapper, 'teamCode');
      const broadTeamCodeQrCandidates = wrapper.findAll('.team-code-qr-actions').filter((actionsScope) => {
        const teamCodeQrButton = actionsScope
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        return actionsScope.find('input[accept="image/*"]').exists() && Boolean(teamCodeQrButton);
      });
      expect(broadTeamCodeQrCandidates.length).toBeGreaterThan(1);
      const scopedRealTeamCodeQrCandidates = broadTeamCodeQrCandidates.filter((actionsScope) => {
        return importDialogScope.element.contains(actionsScope.element);
      });
      expect(scopedRealTeamCodeQrCandidates).toHaveLength(1);

      wrapper.findAll('.label-drift-fake-scope').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.label-drift-team-code-qr-actions-fake-anchor').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });

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
      vm.teamCodeInput = `#TA#CLOSED-LABEL-DRIFT-${round}`;
      await vm.$nextTick();
    }

    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(expectedOpenCount);
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonCount);
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeCount);
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrCount);

    wrapper.unmount();
  });

  it('keeps import-dialog anchoring and command counts aligned under command-order and class-drift noise matrix reopen cycles', async () => {
    const wrapper = createWrapper({ commandOrderClassDriftNoiseMatrix: true });
    const vm = wrapper.vm as unknown as ToolbarVm;
    const importButton = findButtonByText(wrapper, '导入');
    expect(importButton).toBeTruthy();

    expect(wrapper.findAll('.command-order-class-drift-noise-matrix').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.command-order-class-drift-fake-scope').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.command-order-class-drift-import-form-fake-anchor').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.command-order-class-drift-dialog-footer-fake-anchor').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.command-order-class-drift-team-code-qr-actions-fake-anchor').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.import-form').length).toBeGreaterThan(2);
    expect(wrapper.findAll('.team-code-qr-actions').length).toBeGreaterThan(1);

    let expectedOpenCount = 0;
    let expectedJsonCount = 0;
    let expectedTeamCodeCount = 0;
    let expectedQrCount = 0;

    for (let round = 1; round <= 5; round += 1) {
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
      vm.teamCodeInput = `#TA#COMMAND-ORDER-CLASS-DRIFT-${round}`;
      await vm.$nextTick();

      sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'teamCode');
      const importDialogScope = getImportDialogScope(wrapper, 'teamCode');
      const broadTeamCodeQrCandidates = wrapper.findAll('.team-code-qr-actions').filter((actionsScope) => {
        const teamCodeQrButton = actionsScope
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        return actionsScope.find('input[accept="image/*"]').exists() && Boolean(teamCodeQrButton);
      });
      expect(broadTeamCodeQrCandidates.length).toBeGreaterThan(1);
      const scopedRealTeamCodeQrCandidates = broadTeamCodeQrCandidates.filter((actionsScope) => {
        return importDialogScope.element.contains(actionsScope.element);
      });
      expect(scopedRealTeamCodeQrCandidates).toHaveLength(1);

      wrapper.findAll('.command-order-class-drift-fake-scope').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.command-order-class-drift-team-code-qr-actions-fake-anchor').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });

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
      vm.teamCodeInput = `#TA#CLOSED-COMMAND-ORDER-CLASS-DRIFT-${round}`;
      await vm.$nextTick();
    }

    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(expectedOpenCount);
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonCount);
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeCount);
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrCount);

    wrapper.unmount();
  });
});
