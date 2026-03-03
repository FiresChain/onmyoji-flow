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

const ElDialogWithFooterOrderDriftAndSameClassFakeAnchorNoiseMatrixStub = defineComponent({
  name: 'ElDialog',
  setup(_, { attrs, slots }) {
    return () => {
      const title = typeof attrs.title === 'string' ? attrs.title : '';
      const isImportDialog = title === '导入数据';
      const footerOrderDriftSameClassNoiseNodes = isImportDialog
        ? []
        : [
          h('div', { class: 'footer-order-drift-same-class-noise-matrix' }, [
            h('div', { class: 'footer-order-drift-same-class-fake-scope footer-order-drift-same-class-fake-scope-json' }, [
              h('div', { class: 'import-form footer-order-drift-same-class-import-form-fake-anchor footer-order-drift-same-class-import-form-fake-anchor-json' }, 'footer-order-drift-same-class-import-form-fake-anchor-json'),
              h('span', { class: 'dialog-footer footer-order-drift-same-class-dialog-footer-fake-anchor footer-order-drift-same-class-dialog-footer-fake-anchor-json' }, [
                h('button', '选择 JSON 文件'),
                h('button', '取消'),
                h('button', 'footer-order-drift-same-class-extra-noise-json'),
              ]),
            ]),
            h('div', { class: 'footer-order-drift-same-class-fake-scope footer-order-drift-same-class-fake-scope-team-code' }, [
              h('div', { class: 'import-form footer-order-drift-same-class-import-form-fake-anchor footer-order-drift-same-class-import-form-fake-anchor-team-code' }, 'footer-order-drift-same-class-import-form-fake-anchor-team-code'),
              h('span', { class: 'dialog-footer footer-order-drift-same-class-dialog-footer-fake-anchor footer-order-drift-same-class-dialog-footer-fake-anchor-team-code' }, [
                h('button', '导入阵容码'),
                h('button', '取消'),
                h('button', 'footer-order-drift-same-class-extra-noise-team-code'),
              ]),
              h('div', { class: 'team-code-qr-actions footer-order-drift-same-class-team-code-qr-actions-fake-anchor' }, [
                h('button', 'footer-order-drift-same-class-extra-noise-qr-pre'),
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', '选择二维码图片'),
                h('button', 'footer-order-drift-same-class-extra-noise-qr-post'),
              ]),
            ]),
          ]),
        ];
      return h('div', [...footerOrderDriftSameClassNoiseNodes, slots.default?.(), slots.footer?.()]);
    };
  },
});

const ElDialogWithSlotFooterDriftAndSameAttrFakeActionNoiseMatrixStub = defineComponent({
  name: 'ElDialog',
  setup(_, { attrs, slots }) {
    return () => {
      const title = typeof attrs.title === 'string' ? attrs.title : '';
      const isImportDialog = title === '导入数据';
      const slotFooterDriftSameAttrNoiseNodes = isImportDialog
        ? []
        : [
          h('div', { class: 'slot-footer-drift-same-attr-noise-matrix' }, [
            h('div', { class: 'slot-footer-drift-same-attr-wrapper slot-footer-drift-same-attr-wrapper-json', slot: 'footer', 'data-slot-footer-drift': 'json' }, [
              h('div', { class: 'slot-footer-drift-same-attr-fake-scope slot-footer-drift-same-attr-fake-scope-json' }, [
                h('div', { class: 'import-form slot-footer-drift-same-attr-import-form-fake-anchor slot-footer-drift-same-attr-import-form-fake-anchor-json' }, 'slot-footer-drift-same-attr-import-form-fake-anchor-json'),
                h('span', { class: 'dialog-footer slot-footer-drift-same-attr-dialog-footer-fake-anchor slot-footer-drift-same-attr-dialog-footer-fake-anchor-json', slot: 'footer', 'data-slot-footer-drift': 'json-footer' }, [
                  h('button', '选择 JSON 文件'),
                  h('button', '取消'),
                  h('button', 'slot-footer-drift-same-attr-extra-noise-json'),
                ]),
              ]),
            ]),
            h('div', { class: 'slot-footer-drift-same-attr-wrapper slot-footer-drift-same-attr-wrapper-team-code' }, [
              h('div', { class: 'slot-footer-drift-same-attr-fake-scope slot-footer-drift-same-attr-fake-scope-team-code', slot: 'footer', 'data-slot-footer-drift': 'team-code' }, [
                h('div', { class: 'import-form slot-footer-drift-same-attr-import-form-fake-anchor slot-footer-drift-same-attr-import-form-fake-anchor-team-code' }, 'slot-footer-drift-same-attr-import-form-fake-anchor-team-code'),
                h('span', { class: 'dialog-footer slot-footer-drift-same-attr-dialog-footer-fake-anchor slot-footer-drift-same-attr-dialog-footer-fake-anchor-team-code' }, [
                  h('button', '导入阵容码'),
                  h('button', '取消'),
                  h('button', 'slot-footer-drift-same-attr-extra-noise-team-code'),
                ]),
                h('div', { class: 'team-code-qr-actions slot-footer-drift-same-attr-team-code-qr-actions-fake-anchor', slot: 'footer', 'data-slot-footer-drift': 'team-code-qr-actions' }, [
                  h('button', 'slot-footer-drift-same-attr-extra-noise-qr-pre'),
                  h('input', { type: 'file', accept: 'image/*' }),
                  h('button', '选择二维码图片'),
                  h('button', 'slot-footer-drift-same-attr-extra-noise-qr-post'),
                ]),
              ]),
              h('div', { class: 'dialog-footer slot-footer-drift-same-attr-footer-extra-noise', slot: 'footer', 'data-slot-footer-drift': 'extra-footer' }, [
                h('button', 'slot-footer-drift-same-attr-footer-extra-command'),
              ]),
            ]),
          ]),
        ];
      return h('div', [...slotFooterDriftSameAttrNoiseNodes, slots.default?.(), slots.footer?.()]);
    };
  },
});

const ElDialogWithCombinedSlotFooterClassDriftFooterOrderFakeActionNoiseMatrixStub = defineComponent({
  name: 'ElDialog',
  setup(_, { attrs, slots }) {
    return () => {
      const title = typeof attrs.title === 'string' ? attrs.title : '';
      const isImportDialog = title === '导入数据';
      const combinedNoiseNodes = isImportDialog
        ? []
        : [
          h('div', { class: 'combined-slot-footer-class-drift-footer-order-fake-action-noise-matrix' }, [
            h('div', {
              class: 'combined-slot-footer-class-drift-footer-order-fake-action-noise-layer combined-slot-footer-class-drift-footer-order-fake-action-noise-layer-json',
              slot: 'footer',
              'data-slot-footer-drift': 'combined-json-layer',
            }, [
              h('div', {
                class: 'import-form combined-slot-footer-class-drift-footer-order-fake-action-import-form-fake-anchor combined-slot-footer-class-drift-footer-order-fake-action-import-form-fake-anchor-json combined-slot-footer-class-drift-footer-order-fake-action-class-drift-anchor',
              }, 'combined-slot-footer-class-drift-footer-order-fake-action-import-form-fake-anchor-json'),
              h('span', {
                class: 'dialog-footer combined-slot-footer-class-drift-footer-order-fake-action-dialog-footer-fake-anchor combined-slot-footer-class-drift-footer-order-fake-action-dialog-footer-fake-anchor-json',
                slot: 'footer',
                'data-slot-footer-drift': 'combined-json-footer',
              }, [
                h('button', '选择 JSON 文件'),
                h('button', '取消'),
                h('button', 'combined-slot-footer-class-drift-footer-order-fake-action-extra-noise-json-a'),
                h('button', 'combined-slot-footer-class-drift-footer-order-fake-action-extra-noise-json-b'),
              ]),
              h('div', {
                class: 'dialog-footer combined-slot-footer-class-drift-footer-order-fake-action-dialog-footer-secondary-noise combined-slot-footer-class-drift-footer-order-fake-action-dialog-footer-secondary-noise-json',
                slot: 'footer',
                'data-slot-footer-drift': 'combined-json-footer-secondary',
              }, [
                h('button', 'combined-slot-footer-class-drift-footer-order-fake-action-json-secondary-footer-noise'),
              ]),
            ]),
            h('div', {
              class: 'combined-slot-footer-class-drift-footer-order-fake-action-noise-layer combined-slot-footer-class-drift-footer-order-fake-action-noise-layer-team-code',
            }, [
              h('div', {
                class: 'combined-slot-footer-class-drift-footer-order-fake-action-fake-scope combined-slot-footer-class-drift-footer-order-fake-action-fake-scope-team-code',
                slot: 'footer',
                'data-slot-footer-drift': 'combined-team-code-layer',
              }, [
                h('div', {
                  class: 'import-form combined-slot-footer-class-drift-footer-order-fake-action-import-form-fake-anchor combined-slot-footer-class-drift-footer-order-fake-action-import-form-fake-anchor-team-code combined-slot-footer-class-drift-footer-order-fake-action-class-drift-anchor',
                }, 'combined-slot-footer-class-drift-footer-order-fake-action-import-form-fake-anchor-team-code'),
                h('span', {
                  class: 'dialog-footer combined-slot-footer-class-drift-footer-order-fake-action-dialog-footer-fake-anchor combined-slot-footer-class-drift-footer-order-fake-action-dialog-footer-fake-anchor-team-code',
                }, [
                  h('button', '导入阵容码'),
                  h('button', '取消'),
                  h('button', 'combined-slot-footer-class-drift-footer-order-fake-action-extra-noise-team-code-a'),
                  h('button', 'combined-slot-footer-class-drift-footer-order-fake-action-extra-noise-team-code-b'),
                ]),
                h('div', {
                  class: 'team-code-qr-actions combined-slot-footer-class-drift-footer-order-fake-action-team-code-qr-actions-fake-anchor',
                  slot: 'footer',
                  'data-slot-footer-drift': 'combined-team-code-qr-actions',
                }, [
                  h('button', 'combined-slot-footer-class-drift-footer-order-fake-action-extra-noise-qr-pre'),
                  h('input', { type: 'file', accept: 'image/*' }),
                  h('button', '选择二维码图片'),
                  h('input', { type: 'file', accept: 'image/*' }),
                  h('button', 'combined-slot-footer-class-drift-footer-order-fake-action-extra-noise-qr-post'),
                ]),
              ]),
              h('div', {
                class: 'dialog-footer combined-slot-footer-class-drift-footer-order-fake-action-footer-extra-noise',
                slot: 'footer',
                'data-slot-footer-drift': 'combined-footer-extra',
              }, [
                h('button', 'combined-slot-footer-class-drift-footer-order-fake-action-footer-extra-command'),
              ]),
              h('div', {
                class: 'team-code-qr-actions combined-slot-footer-class-drift-footer-order-fake-action-team-code-qr-actions-secondary-fake-anchor',
              }, [
                h('button', 'combined-slot-footer-class-drift-footer-order-fake-action-extra-noise-qr-secondary'),
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', '选择二维码图片'),
              ]),
            ]),
          ]),
        ];
      return h('div', [...combinedNoiseNodes, slots.default?.(), slots.footer?.()]);
    };
  },
});

const ElDialogWithNestedSlotFooterSecondaryOrderAndDuplicateAcceptFakeActionNoiseMatrixStub = defineComponent({
  name: 'ElDialog',
  setup(_, { attrs, slots }) {
    return () => {
      const title = typeof attrs.title === 'string' ? attrs.title : '';
      const isImportDialog = title === '导入数据';
      const nestedSecondaryOrderDuplicateAcceptNoiseNodes = isImportDialog
        ? []
        : [
          h('div', { class: 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-noise-matrix' }, [
            h('div', {
              class: 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-noise-layer nested-slot-footer-secondary-order-duplicate-accept-fake-action-noise-layer-json',
              slot: 'footer',
              'data-slot-footer-drift': 'nested-secondary-json-layer',
            }, [
              h('div', {
                class: 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-fake-scope nested-slot-footer-secondary-order-duplicate-accept-fake-action-fake-scope-json',
                slot: 'footer',
                'data-secondary-footer-order': 'json',
              }, [
                h('div', {
                  class: 'import-form nested-slot-footer-secondary-order-duplicate-accept-fake-action-import-form-fake-anchor nested-slot-footer-secondary-order-duplicate-accept-fake-action-import-form-fake-anchor-json',
                }, 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-import-form-fake-anchor-json'),
                h('span', {
                  class: 'dialog-footer nested-slot-footer-secondary-order-duplicate-accept-fake-action-dialog-footer-fake-anchor nested-slot-footer-secondary-order-duplicate-accept-fake-action-dialog-footer-fake-anchor-json',
                  slot: 'footer',
                  'data-slot-footer-drift': 'nested-secondary-json-footer',
                }, [
                  h('button', 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-extra-noise-json-pre'),
                  h('button', '取消'),
                  h('button', '选择 JSON 文件'),
                  h('button', 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-extra-noise-json-post'),
                ]),
                h('span', {
                  class: 'dialog-footer nested-slot-footer-secondary-order-duplicate-accept-fake-action-dialog-footer-secondary-order-noise nested-slot-footer-secondary-order-duplicate-accept-fake-action-dialog-footer-secondary-order-noise-json',
                  slot: 'footer',
                  'data-secondary-footer-order': 'json-secondary',
                }, [
                  h('button', '选择 JSON 文件'),
                  h('button', '取消'),
                ]),
              ]),
            ]),
            h('div', {
              class: 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-noise-layer nested-slot-footer-secondary-order-duplicate-accept-fake-action-noise-layer-team-code',
            }, [
              h('div', {
                class: 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-fake-scope nested-slot-footer-secondary-order-duplicate-accept-fake-action-fake-scope-team-code',
                slot: 'footer',
                'data-secondary-footer-order': 'team-code',
              }, [
                h('div', {
                  class: 'import-form nested-slot-footer-secondary-order-duplicate-accept-fake-action-import-form-fake-anchor nested-slot-footer-secondary-order-duplicate-accept-fake-action-import-form-fake-anchor-team-code',
                }, 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-import-form-fake-anchor-team-code'),
                h('span', {
                  class: 'dialog-footer nested-slot-footer-secondary-order-duplicate-accept-fake-action-dialog-footer-fake-anchor nested-slot-footer-secondary-order-duplicate-accept-fake-action-dialog-footer-fake-anchor-team-code',
                }, [
                  h('button', 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-extra-noise-team-code-pre'),
                  h('button', '导入阵容码'),
                  h('button', '取消'),
                  h('button', 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-extra-noise-team-code-post'),
                ]),
                h('div', {
                  class: 'team-code-qr-actions nested-slot-footer-secondary-order-duplicate-accept-fake-action-team-code-qr-actions-fake-anchor-primary',
                  slot: 'footer',
                  'data-slot-footer-drift': 'nested-secondary-team-code-qr-primary',
                }, [
                  h('button', 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-extra-noise-qr-pre'),
                  h('input', { type: 'file', accept: 'image/*' }),
                  h('button', '选择二维码图片'),
                  h('input', { type: 'file', accept: 'image/*' }),
                  h('button', 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-extra-noise-qr-post'),
                ]),
              ]),
              h('div', {
                class: 'team-code-qr-actions nested-slot-footer-secondary-order-duplicate-accept-fake-action-team-code-qr-actions-fake-anchor-secondary',
                slot: 'footer',
                'data-slot-footer-drift': 'nested-secondary-team-code-qr-secondary',
              }, [
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', '选择二维码图片'),
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-extra-noise-qr-secondary'),
              ]),
              h('div', {
                class: 'dialog-footer nested-slot-footer-secondary-order-duplicate-accept-fake-action-footer-extra-noise',
                slot: 'footer',
                'data-slot-footer-drift': 'nested-secondary-footer-extra',
              }, [
                h('button', 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-footer-extra-command-a'),
                h('button', 'nested-slot-footer-secondary-order-duplicate-accept-fake-action-footer-extra-command-b'),
              ]),
            ]),
          ]),
        ];
      return h('div', [...nestedSecondaryOrderDuplicateAcceptNoiseNodes, slots.default?.(), slots.footer?.()]);
    };
  },
});

const ElDialogWithNestedSlotFooterSecondaryOrderClassDriftDuplicateAcceptExtendedFakeActionNoiseMatrixStub = defineComponent({
  name: 'ElDialog',
  setup(_, { attrs, slots }) {
    return () => {
      const title = typeof attrs.title === 'string' ? attrs.title : '';
      const isImportDialog = title === '导入数据';
      const nestedSecondaryOrderClassDriftDuplicateAcceptExtendedNoiseNodes = isImportDialog
        ? []
        : [
          h('div', { class: 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-noise-matrix' }, [
            h('div', {
              class: 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-noise-layer nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-noise-layer-json',
              slot: 'footer',
              'data-slot-footer-drift': 'nested-secondary-class-drift-json-layer',
            }, [
              h('div', {
                class: 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-fake-scope nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-fake-scope-json',
                slot: 'footer',
                'data-secondary-footer-order': 'json',
              }, [
                h('div', {
                  class: 'import-form nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-import-form-fake-anchor nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-import-form-fake-anchor-json nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-import-form-class-drift',
                }, 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-import-form-fake-anchor-json'),
                h('span', {
                  class: 'dialog-footer nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-fake-anchor nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-fake-anchor-json nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-class-drift',
                  slot: 'footer',
                  'data-slot-footer-drift': 'nested-secondary-class-drift-json-footer',
                }, [
                  h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-json-pre'),
                  h('button', '取消'),
                  h('button', '选择 JSON 文件'),
                  h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-json-mid'),
                  h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-json-post'),
                ]),
                h('span', {
                  class: 'dialog-footer nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-secondary-order-noise nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-secondary-order-noise-json nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-class-drift-secondary',
                  slot: 'footer',
                  'data-secondary-footer-order': 'json-secondary',
                }, [
                  h('button', '选择 JSON 文件'),
                  h('button', '取消'),
                  h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-json-secondary-footer-noise'),
                ]),
                h('div', {
                  class: 'dialog-footer nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-footer-action-extended-noise-json',
                  slot: 'footer',
                  'data-slot-footer-drift': 'nested-secondary-class-drift-json-footer-extended',
                }, [
                  h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-footer-extra-command-json-a'),
                  h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-footer-extra-command-json-b'),
                ]),
              ]),
            ]),
            h('div', {
              class: 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-noise-layer nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-noise-layer-team-code',
            }, [
              h('div', {
                class: 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-fake-scope nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-fake-scope-team-code',
                slot: 'footer',
                'data-secondary-footer-order': 'team-code',
              }, [
                h('div', {
                  class: 'import-form nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-import-form-fake-anchor nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-import-form-fake-anchor-team-code nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-import-form-class-drift',
                }, 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-import-form-fake-anchor-team-code'),
                h('span', {
                  class: 'dialog-footer nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-fake-anchor nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-fake-anchor-team-code nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-class-drift',
                }, [
                  h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-team-code-pre'),
                  h('button', '导入阵容码'),
                  h('button', '取消'),
                  h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-team-code-mid'),
                  h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-team-code-post'),
                ]),
                h('div', {
                  class: 'team-code-qr-actions nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-fake-anchor-primary nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-class-drift',
                  slot: 'footer',
                  'data-slot-footer-drift': 'nested-secondary-class-drift-team-code-qr-primary',
                }, [
                  h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-qr-pre'),
                  h('input', { type: 'file', accept: 'image/*' }),
                  h('button', '选择二维码图片'),
                  h('input', { type: 'file', accept: 'image/*' }),
                  h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-qr-mid'),
                  h('input', { type: 'file', accept: 'image/*' }),
                  h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-qr-post'),
                ]),
                h('div', {
                  class: 'dialog-footer nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-footer-action-extended-noise-team-code',
                  slot: 'footer',
                  'data-slot-footer-drift': 'nested-secondary-class-drift-team-code-footer-extended',
                }, [
                  h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-footer-extra-command-team-code-a'),
                  h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-footer-extra-command-team-code-b'),
                ]),
              ]),
              h('div', {
                class: 'team-code-qr-actions nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-fake-anchor-secondary nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-class-drift-secondary',
                slot: 'footer',
                'data-slot-footer-drift': 'nested-secondary-class-drift-team-code-qr-secondary',
              }, [
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', '选择二维码图片'),
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-qr-secondary-a'),
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-qr-secondary-b'),
              ]),
              h('div', {
                class: 'dialog-footer nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-footer-extra-noise nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-class-drift-tertiary',
                slot: 'footer',
                'data-slot-footer-drift': 'nested-secondary-class-drift-footer-extra',
              }, [
                h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-footer-extra-command-a'),
                h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-footer-extra-command-b'),
                h('button', 'nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-footer-extra-command-c'),
              ]),
            ]),
          ]),
        ];
      return h('div', [...nestedSecondaryOrderClassDriftDuplicateAcceptExtendedNoiseNodes, slots.default?.(), slots.footer?.()]);
    };
  },
});

const ElDialogWithNestedSlotFooterSecondaryOrderClassAliasDriftDuplicateAcceptExtendedFakeActionNoiseMatrixV2Stub = defineComponent({
  name: 'ElDialog',
  setup(_, { attrs, slots }) {
    return () => {
      const title = typeof attrs.title === 'string' ? attrs.title : '';
      const isImportDialog = title === '导入数据';
      const nestedSecondaryOrderClassAliasDuplicateAcceptExtendedNoiseNodes = isImportDialog
        ? []
        : [
          h('section', { class: 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-noise-matrix-v2' }, [
            h('div', {
              class: 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-noise-layer-v2 nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-noise-layer-json-v2',
              slot: 'footer',
              'data-slot-footer-drift': 'nested-secondary-class-alias-json-layer-v2',
            }, [
              h('div', {
                class: 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-fake-scope-v2 nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-fake-scope-json-v2',
                slot: 'footer',
                'data-secondary-footer-order': 'json-v2',
              }, [
                h('div', {
                  class: 'import-form nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-import-form-fake-anchor-v2 nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-import-form-class-alias-drift-v2 import-form-alias-drift-v2',
                }, 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-import-form-fake-anchor-json-v2'),
                h('span', {
                  class: 'dialog-footer nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-dialog-footer-fake-anchor-v2 nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-dialog-footer-class-alias-drift-v2',
                  slot: 'footer',
                  'data-slot-footer-drift': 'nested-secondary-class-alias-json-footer-v2',
                }, [
                  h('button', '选择 JSON 文件'),
                  h('button', '取消'),
                  h('button', 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-extra-noise-json-v2-a'),
                  h('button', 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-extra-noise-json-v2-b'),
                ]),
                h('span', {
                  class: 'dialog-footer nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-dialog-footer-secondary-order-noise-v2 nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-dialog-footer-class-alias-drift-secondary-v2',
                  slot: 'footer',
                  'data-secondary-footer-order': 'json-secondary-v2',
                }, [
                  h('button', 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-extra-noise-json-secondary-v2'),
                  h('button', '选择 JSON 文件'),
                  h('button', '取消'),
                ]),
              ]),
            ]),
            h('div', {
              class: 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-noise-layer-v2 nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-noise-layer-team-code-v2',
            }, [
              h('div', {
                class: 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-fake-scope-v2 nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-fake-scope-team-code-v2',
                slot: 'footer',
                'data-secondary-footer-order': 'team-code-v2',
              }, [
                h('div', {
                  class: 'import-form nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-import-form-fake-anchor-v2 nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-import-form-class-alias-drift-v2 import-form-shadow-alias-v2',
                }, 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-import-form-fake-anchor-team-code-v2'),
                h('span', {
                  class: 'dialog-footer nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-dialog-footer-fake-anchor-v2 nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-dialog-footer-class-alias-drift-v2',
                }, [
                  h('button', '导入阵容码'),
                  h('button', '取消'),
                  h('button', 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-extra-noise-team-code-v2-a'),
                  h('button', 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-extra-noise-team-code-v2-b'),
                ]),
                h('div', {
                  class: 'team-code-qr-actions nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-fake-anchor-v2-primary nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-class-alias-drift-v2',
                  slot: 'footer',
                  'data-slot-footer-drift': 'nested-secondary-class-alias-team-code-qr-primary-v2',
                }, [
                  h('button', 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-extra-noise-qr-v2-pre'),
                  h('input', { type: 'file', accept: 'image/*' }),
                  h('button', '选择二维码图片'),
                  h('input', { type: 'file', accept: 'image/*' }),
                  h('input', {
                    type: 'file',
                    accept: 'image/*',
                    class: 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-hidden-input-noise-v2',
                    style: 'display:none',
                  }),
                  h('button', 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-extra-noise-qr-v2-post'),
                ]),
                h('div', {
                  class: 'dialog-footer nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-footer-extra-noise-v2',
                  slot: 'footer',
                  'data-slot-footer-drift': 'nested-secondary-class-alias-team-code-footer-extra-v2',
                }, [
                  h('button', '导入阵容码'),
                  h('button', 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-footer-extra-command-v2'),
                ]),
              ]),
              h('div', {
                class: 'team-code-qr-actions nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-fake-anchor-v2-secondary nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-class-alias-drift-v2-secondary',
                slot: 'footer',
                'data-slot-footer-drift': 'nested-secondary-class-alias-team-code-qr-secondary-v2',
              }, [
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', '选择二维码图片'),
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-extra-noise-qr-secondary-v2-a'),
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-extra-noise-qr-secondary-v2-b'),
              ]),
              h('div', {
                class: 'team-code-qr-actions nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-fake-anchor-v2-tertiary',
              }, [
                h('button', 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-extra-noise-qr-tertiary-v2-pre'),
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', '选择二维码图片'),
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', 'nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-extra-noise-qr-tertiary-v2-post'),
              ]),
            ]),
          ]),
        ];
      return h('div', [...nestedSecondaryOrderClassAliasDuplicateAcceptExtendedNoiseNodes, slots.default?.(), slots.footer?.()]);
    };
  },
});

const ElDialogWithSlotFooterBranchOrderClassDriftDuplicateAcceptHiddenInputExtendedFakeActionNoiseMatrixV3Stub = defineComponent({
  name: 'ElDialog',
  setup(_, { attrs, slots }) {
    return () => {
      const title = typeof attrs.title === 'string' ? attrs.title : '';
      const isImportDialog = title === '导入数据';
      const slotFooterBranchOrderClassDriftDuplicateAcceptHiddenInputExtendedNoiseNodes = isImportDialog
        ? []
        : [
          h('section', { class: 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-noise-matrix-v3' }, [
            h('div', {
              class: 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-noise-layer-v3 slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-noise-layer-json-v3',
              slot: 'footer',
              'data-slot-footer-branch-order-drift': 'json-layer-v3',
            }, [
              h('div', {
                class: 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-fake-scope-v3 slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-fake-scope-json-v3',
                slot: 'footer',
                'data-slot-footer-branch-order-drift': 'json-fake-scope-v3',
              }, [
                h('div', {
                  class: 'import-form slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-import-form-fake-anchor-v3 slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-import-form-class-drift-v3',
                }, 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-import-form-fake-anchor-json-v3'),
                h('span', {
                  class: 'dialog-footer slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-dialog-footer-fake-anchor-v3 slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-dialog-footer-class-drift-v3',
                  slot: 'footer',
                  'data-slot-footer-branch-order-drift': 'json-footer-v3',
                }, [
                  h('button', '选择 JSON 文件'),
                  h('button', '取消'),
                  h('button', 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-extra-noise-json-v3-a'),
                  h('button', 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-extra-noise-json-v3-b'),
                ]),
                h('span', {
                  class: 'dialog-footer slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-dialog-footer-secondary-order-noise-v3',
                  slot: 'footer',
                  'data-slot-footer-branch-order-drift': 'json-footer-secondary-v3',
                }, [
                  h('button', '选择 JSON 文件'),
                  h('button', '取消'),
                  h('button', 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-extra-noise-json-secondary-v3'),
                ]),
              ]),
            ]),
            h('div', {
              class: 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-noise-layer-v3 slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-noise-layer-team-code-v3',
            }, [
              h('div', {
                class: 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-fake-scope-v3 slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-fake-scope-team-code-v3',
                slot: 'footer',
                'data-slot-footer-branch-order-drift': 'team-code-fake-scope-v3',
              }, [
                h('div', {
                  class: 'import-form slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-import-form-fake-anchor-v3 slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-import-form-class-drift-v3',
                }, 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-import-form-fake-anchor-team-code-v3'),
                h('span', {
                  class: 'dialog-footer slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-dialog-footer-fake-anchor-v3 slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-dialog-footer-class-drift-v3',
                }, [
                  h('button', '导入阵容码'),
                  h('button', '取消'),
                  h('button', 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-extra-noise-team-code-v3-a'),
                  h('button', 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-extra-noise-team-code-v3-b'),
                ]),
                h('div', {
                  class: 'team-code-qr-actions slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-team-code-qr-actions-fake-anchor-v3-primary slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-team-code-qr-actions-class-drift-v3',
                  slot: 'footer',
                  'data-slot-footer-branch-order-drift': 'team-code-qr-primary-v3',
                }, [
                  h('button', 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-extra-noise-qr-v3-pre'),
                  h('input', { type: 'file', accept: 'image/*' }),
                  h('button', '选择二维码图片'),
                  h('input', { type: 'file', accept: 'image/*' }),
                  h('input', {
                    type: 'file',
                    accept: 'image/*',
                    class: 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-hidden-input-v3',
                    style: 'display:none',
                  }),
                  h('button', 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-extra-noise-qr-v3-post'),
                ]),
                h('div', {
                  class: 'dialog-footer slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-footer-extra-noise-v3',
                  slot: 'footer',
                  'data-slot-footer-branch-order-drift': 'team-code-footer-extra-v3',
                }, [
                  h('button', 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-footer-extra-command-v3-a'),
                  h('button', 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-footer-extra-command-v3-b'),
                ]),
              ]),
              h('div', {
                class: 'team-code-qr-actions slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-team-code-qr-actions-fake-anchor-v3-secondary slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-team-code-qr-actions-class-drift-v3-secondary',
                slot: 'footer',
                'data-slot-footer-branch-order-drift': 'team-code-qr-secondary-v3',
              }, [
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', '选择二维码图片'),
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-extra-noise-qr-secondary-v3-a'),
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-extra-noise-qr-secondary-v3-b'),
              ]),
              h('div', {
                class: 'team-code-qr-actions slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-team-code-qr-actions-fake-anchor-v3-tertiary',
              }, [
                h('button', 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-extra-noise-qr-tertiary-v3-pre'),
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', '选择二维码图片'),
                h('input', { type: 'file', accept: 'image/*' }),
                h('button', 'slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-extra-noise-qr-tertiary-v3-post'),
              ]),
            ]),
          ]),
        ];
      return h('div', [...slotFooterBranchOrderClassDriftDuplicateAcceptHiddenInputExtendedNoiseNodes, slots.default?.(), slots.footer?.()]);
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
  footerOrderDriftSameClassFakeAnchorNoiseMatrix?: boolean;
  slotFooterDriftSameAttrFakeActionNoiseMatrix?: boolean;
  combinedSlotFooterClassDriftFooterOrderFakeActionNoiseMatrix?: boolean;
  nestedSlotFooterSecondaryOrderDuplicateAcceptFakeActionNoiseMatrix?: boolean;
  nestedSlotFooterSecondaryOrderClassDriftDuplicateAcceptExtendedFakeActionNoiseMatrix?: boolean;
  nestedSlotFooterSecondaryOrderClassAliasDriftDuplicateAcceptExtendedFakeActionNoiseMatrixV2?: boolean;
  slotFooterBranchOrderClassDriftDuplicateAcceptHiddenInputExtendedFakeActionNoiseMatrixV3?: boolean;
}) => {
  const dialogStub = options?.slotFooterBranchOrderClassDriftDuplicateAcceptHiddenInputExtendedFakeActionNoiseMatrixV3
    ? ElDialogWithSlotFooterBranchOrderClassDriftDuplicateAcceptHiddenInputExtendedFakeActionNoiseMatrixV3Stub
    : options?.nestedSlotFooterSecondaryOrderClassAliasDriftDuplicateAcceptExtendedFakeActionNoiseMatrixV2
    ? ElDialogWithNestedSlotFooterSecondaryOrderClassAliasDriftDuplicateAcceptExtendedFakeActionNoiseMatrixV2Stub
    : options?.nestedSlotFooterSecondaryOrderClassDriftDuplicateAcceptExtendedFakeActionNoiseMatrix
    ? ElDialogWithNestedSlotFooterSecondaryOrderClassDriftDuplicateAcceptExtendedFakeActionNoiseMatrixStub
    : options?.nestedSlotFooterSecondaryOrderDuplicateAcceptFakeActionNoiseMatrix
    ? ElDialogWithNestedSlotFooterSecondaryOrderAndDuplicateAcceptFakeActionNoiseMatrixStub
    : options?.combinedSlotFooterClassDriftFooterOrderFakeActionNoiseMatrix
    ? ElDialogWithCombinedSlotFooterClassDriftFooterOrderFakeActionNoiseMatrixStub
    : options?.slotFooterDriftSameAttrFakeActionNoiseMatrix
    ? ElDialogWithSlotFooterDriftAndSameAttrFakeActionNoiseMatrixStub
    : options?.footerOrderDriftSameClassFakeAnchorNoiseMatrix
    ? ElDialogWithFooterOrderDriftAndSameClassFakeAnchorNoiseMatrixStub
    : options?.commandOrderClassDriftNoiseMatrix
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

  it('keeps import-dialog anchoring exclusive and command counts aligned under footer-order drift and same-class fake-anchor noise matrix reopen cycles', async () => {
    const wrapper = createWrapper({ footerOrderDriftSameClassFakeAnchorNoiseMatrix: true });
    const vm = wrapper.vm as unknown as ToolbarVm;
    const importButton = findButtonByText(wrapper, '导入');
    expect(importButton).toBeTruthy();

    expect(wrapper.findAll('.footer-order-drift-same-class-noise-matrix').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.footer-order-drift-same-class-fake-scope').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.footer-order-drift-same-class-import-form-fake-anchor').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.footer-order-drift-same-class-dialog-footer-fake-anchor').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.footer-order-drift-same-class-team-code-qr-actions-fake-anchor').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.import-form').length).toBeGreaterThan(2);
    expect(wrapper.findAll('.team-code-qr-actions').length).toBeGreaterThan(1);

    wrapper.findAll('.footer-order-drift-same-class-dialog-footer-fake-anchor-json').forEach((noiseFooter) => {
      const buttonTexts = noiseFooter.findAll('button').map((button) => button.text().trim());
      expect(buttonTexts[0]).toBe('选择 JSON 文件');
      expect(buttonTexts).toContain('取消');
      expect(buttonTexts).toContain('footer-order-drift-same-class-extra-noise-json');
    });
    wrapper.findAll('.footer-order-drift-same-class-dialog-footer-fake-anchor-team-code').forEach((noiseFooter) => {
      const buttonTexts = noiseFooter.findAll('button').map((button) => button.text().trim());
      expect(buttonTexts[0]).toBe('导入阵容码');
      expect(buttonTexts).toContain('取消');
      expect(buttonTexts).toContain('footer-order-drift-same-class-extra-noise-team-code');
    });

    let expectedOpenCount = 0;
    let expectedJsonCount = 0;
    let expectedTeamCodeCount = 0;
    let expectedQrCount = 0;

    for (let round = 1; round <= 6; round += 1) {
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
      vm.teamCodeInput = `#TA#FOOTER-ORDER-DRIFT-SAME-CLASS-${round}`;
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

      wrapper.findAll('.footer-order-drift-same-class-fake-scope').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.footer-order-drift-same-class-team-code-qr-actions-fake-anchor').forEach((noiseNode) => {
        const noiseQrButton = noiseNode
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        expect(noiseNode.find('input[accept="image/*"]').exists()).toBe(true);
        expect(Boolean(noiseQrButton)).toBe(true);
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
      vm.teamCodeInput = `#TA#CLOSED-FOOTER-ORDER-DRIFT-SAME-CLASS-${round}`;
      await vm.$nextTick();
    }

    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(expectedOpenCount);
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonCount);
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeCount);
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrCount);

    wrapper.unmount();
  });

  it('keeps import-dialog anchoring exclusive and command counts aligned under slot-footer drift and same-attr fake-action noise matrix reopen cycles', async () => {
    const wrapper = createWrapper({ slotFooterDriftSameAttrFakeActionNoiseMatrix: true });
    const vm = wrapper.vm as unknown as ToolbarVm;
    const importButton = findButtonByText(wrapper, '导入');
    expect(importButton).toBeTruthy();

    expect(wrapper.findAll('.slot-footer-drift-same-attr-noise-matrix').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.slot-footer-drift-same-attr-fake-scope').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.slot-footer-drift-same-attr-import-form-fake-anchor').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.slot-footer-drift-same-attr-dialog-footer-fake-anchor').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.slot-footer-drift-same-attr-team-code-qr-actions-fake-anchor').length).toBeGreaterThan(0);
    expect(wrapper.findAll('[data-slot-footer-drift]').length).toBeGreaterThan(4);
    expect(wrapper.findAll('.import-form').length).toBeGreaterThan(2);
    expect(wrapper.findAll('.team-code-qr-actions').length).toBeGreaterThan(1);

    wrapper.findAll('.slot-footer-drift-same-attr-dialog-footer-fake-anchor-json').forEach((noiseFooter) => {
      const buttonTexts = noiseFooter.findAll('button').map((button) => button.text().trim());
      expect(buttonTexts[0]).toBe('选择 JSON 文件');
      expect(buttonTexts).toContain('取消');
      expect(buttonTexts).toContain('slot-footer-drift-same-attr-extra-noise-json');
    });
    wrapper.findAll('.slot-footer-drift-same-attr-dialog-footer-fake-anchor-team-code').forEach((noiseFooter) => {
      const buttonTexts = noiseFooter.findAll('button').map((button) => button.text().trim());
      expect(buttonTexts[0]).toBe('导入阵容码');
      expect(buttonTexts).toContain('取消');
      expect(buttonTexts).toContain('slot-footer-drift-same-attr-extra-noise-team-code');
    });

    let expectedOpenCount = 0;
    let expectedJsonCount = 0;
    let expectedTeamCodeCount = 0;
    let expectedQrCount = 0;

    for (let round = 1; round <= 7; round += 1) {
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
      vm.teamCodeInput = `#TA#SLOT-FOOTER-DRIFT-SAME-ATTR-${round}`;
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

      wrapper.findAll('.slot-footer-drift-same-attr-fake-scope').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.slot-footer-drift-same-attr-team-code-qr-actions-fake-anchor').forEach((noiseNode) => {
        const noiseQrButton = noiseNode
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        expect(noiseNode.find('input[accept="image/*"]').exists()).toBe(true);
        expect(Boolean(noiseQrButton)).toBe(true);
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.slot-footer-drift-same-attr-footer-extra-noise').forEach((noiseNode) => {
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
      vm.teamCodeInput = `#TA#CLOSED-SLOT-FOOTER-DRIFT-SAME-ATTR-${round}`;
      await vm.$nextTick();
    }

    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(expectedOpenCount);
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonCount);
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeCount);
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrCount);

    wrapper.unmount();
  });

  it('keeps import-dialog anchoring exclusive and command counts aligned under combined slot-footer class-drift footer-order fake-action noise matrix reopen cycles', async () => {
    const wrapper = createWrapper({ combinedSlotFooterClassDriftFooterOrderFakeActionNoiseMatrix: true });
    const vm = wrapper.vm as unknown as ToolbarVm;
    const importButton = findButtonByText(wrapper, '导入');
    expect(importButton).toBeTruthy();

    expect(wrapper.findAll('.combined-slot-footer-class-drift-footer-order-fake-action-noise-matrix').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.combined-slot-footer-class-drift-footer-order-fake-action-noise-layer').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.combined-slot-footer-class-drift-footer-order-fake-action-import-form-fake-anchor').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.combined-slot-footer-class-drift-footer-order-fake-action-dialog-footer-fake-anchor').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.combined-slot-footer-class-drift-footer-order-fake-action-team-code-qr-actions-fake-anchor').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.combined-slot-footer-class-drift-footer-order-fake-action-team-code-qr-actions-secondary-fake-anchor').length).toBeGreaterThan(0);
    expect(wrapper.findAll('[data-slot-footer-drift]').length).toBeGreaterThan(5);
    expect(wrapper.findAll('.import-form').length).toBeGreaterThan(2);
    expect(wrapper.findAll('.dialog-footer').length).toBeGreaterThan(4);
    expect(wrapper.findAll('.team-code-qr-actions').length).toBeGreaterThan(2);

    wrapper.findAll('.combined-slot-footer-class-drift-footer-order-fake-action-dialog-footer-fake-anchor-json').forEach((noiseFooter) => {
      const buttonTexts = noiseFooter.findAll('button').map((button) => button.text().trim());
      expect(buttonTexts[0]).toBe('选择 JSON 文件');
      expect(buttonTexts).toContain('取消');
      expect(buttonTexts).toContain('combined-slot-footer-class-drift-footer-order-fake-action-extra-noise-json-a');
      expect(buttonTexts).toContain('combined-slot-footer-class-drift-footer-order-fake-action-extra-noise-json-b');
    });
    wrapper.findAll('.combined-slot-footer-class-drift-footer-order-fake-action-dialog-footer-fake-anchor-team-code').forEach((noiseFooter) => {
      const buttonTexts = noiseFooter.findAll('button').map((button) => button.text().trim());
      expect(buttonTexts[0]).toBe('导入阵容码');
      expect(buttonTexts).toContain('取消');
      expect(buttonTexts).toContain('combined-slot-footer-class-drift-footer-order-fake-action-extra-noise-team-code-a');
      expect(buttonTexts).toContain('combined-slot-footer-class-drift-footer-order-fake-action-extra-noise-team-code-b');
    });

    let expectedOpenCount = 0;
    let expectedJsonCount = 0;
    let expectedTeamCodeCount = 0;
    let expectedQrCount = 0;

    for (let round = 1; round <= 8; round += 1) {
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
      vm.teamCodeInput = `#TA#COMBINED-SLOT-FOOTER-CLASS-DRIFT-FOOTER-ORDER-${round}`;
      await vm.$nextTick();

      sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'teamCode');
      const importDialogScope = getImportDialogScope(wrapper, 'teamCode');
      const broadTeamCodeQrCandidates = wrapper.findAll('.team-code-qr-actions').filter((actionsScope) => {
        const teamCodeQrButton = actionsScope
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        return actionsScope.find('input[accept="image/*"]').exists() && Boolean(teamCodeQrButton);
      });
      expect(broadTeamCodeQrCandidates.length).toBeGreaterThan(2);
      const scopedRealTeamCodeQrCandidates = broadTeamCodeQrCandidates.filter((actionsScope) => {
        return importDialogScope.element.contains(actionsScope.element);
      });
      expect(scopedRealTeamCodeQrCandidates).toHaveLength(1);

      wrapper.findAll('.combined-slot-footer-class-drift-footer-order-fake-action-fake-scope').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.combined-slot-footer-class-drift-footer-order-fake-action-team-code-qr-actions-fake-anchor').forEach((noiseNode) => {
        const noiseQrButton = noiseNode
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        expect(noiseNode.find('input[accept="image/*"]').exists()).toBe(true);
        expect(Boolean(noiseQrButton)).toBe(true);
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.combined-slot-footer-class-drift-footer-order-fake-action-team-code-qr-actions-secondary-fake-anchor').forEach((noiseNode) => {
        const noiseQrButton = noiseNode
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        expect(noiseNode.find('input[accept="image/*"]').exists()).toBe(true);
        expect(Boolean(noiseQrButton)).toBe(true);
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.combined-slot-footer-class-drift-footer-order-fake-action-dialog-footer-fake-anchor').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.combined-slot-footer-class-drift-footer-order-fake-action-footer-extra-noise').forEach((noiseNode) => {
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
      vm.teamCodeInput = `#TA#CLOSED-COMBINED-SLOT-FOOTER-CLASS-DRIFT-FOOTER-ORDER-${round}`;
      await vm.$nextTick();
    }

    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(expectedOpenCount);
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonCount);
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeCount);
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrCount);

    wrapper.unmount();
  });

  it('keeps import-dialog anchoring exclusive and command counts aligned under nested slot-footer secondary-order and duplicate-accept fake-action noise matrix reopen cycles', async () => {
    const wrapper = createWrapper({ nestedSlotFooterSecondaryOrderDuplicateAcceptFakeActionNoiseMatrix: true });
    const vm = wrapper.vm as unknown as ToolbarVm;
    const importButton = findButtonByText(wrapper, '导入');
    expect(importButton).toBeTruthy();

    expect(wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-noise-matrix').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-noise-layer').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-fake-scope').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-import-form-fake-anchor').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-dialog-footer-fake-anchor').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-dialog-footer-secondary-order-noise').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-team-code-qr-actions-fake-anchor-primary').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-team-code-qr-actions-fake-anchor-secondary').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.import-form').length).toBeGreaterThan(2);
    expect(wrapper.findAll('.dialog-footer').length).toBeGreaterThan(4);
    expect(wrapper.findAll('.team-code-qr-actions').length).toBeGreaterThan(2);

    wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-dialog-footer-fake-anchor-json').forEach((noiseFooter) => {
      const buttonTexts = noiseFooter.findAll('button').map((button) => button.text().trim());
      expect(buttonTexts[0]).toBe('nested-slot-footer-secondary-order-duplicate-accept-fake-action-extra-noise-json-pre');
      expect(buttonTexts).toContain('取消');
      expect(buttonTexts).toContain('选择 JSON 文件');
      expect(buttonTexts).toContain('nested-slot-footer-secondary-order-duplicate-accept-fake-action-extra-noise-json-post');
    });
    wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-dialog-footer-secondary-order-noise-json').forEach((noiseFooter) => {
      const buttonTexts = noiseFooter.findAll('button').map((button) => button.text().trim());
      expect(buttonTexts[0]).toBe('选择 JSON 文件');
      expect(buttonTexts[1]).toBe('取消');
    });
    wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-dialog-footer-fake-anchor-team-code').forEach((noiseFooter) => {
      const buttonTexts = noiseFooter.findAll('button').map((button) => button.text().trim());
      expect(buttonTexts[0]).toBe('nested-slot-footer-secondary-order-duplicate-accept-fake-action-extra-noise-team-code-pre');
      expect(buttonTexts).toContain('导入阵容码');
      expect(buttonTexts).toContain('取消');
      expect(buttonTexts).toContain('nested-slot-footer-secondary-order-duplicate-accept-fake-action-extra-noise-team-code-post');
    });

    let expectedOpenCount = 0;
    let expectedJsonCount = 0;
    let expectedTeamCodeCount = 0;
    let expectedQrCount = 0;

    for (let round = 1; round <= 8; round += 1) {
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
      vm.teamCodeInput = `#TA#NESTED-SLOT-FOOTER-SECONDARY-ORDER-DUPLICATE-ACCEPT-${round}`;
      await vm.$nextTick();

      sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'teamCode');
      const importDialogScope = getImportDialogScope(wrapper, 'teamCode');
      const broadTeamCodeQrCandidates = wrapper.findAll('.team-code-qr-actions').filter((actionsScope) => {
        const teamCodeQrButton = actionsScope
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        return actionsScope.find('input[accept="image/*"]').exists() && Boolean(teamCodeQrButton);
      });
      expect(broadTeamCodeQrCandidates.length).toBeGreaterThan(2);
      const scopedRealTeamCodeQrCandidates = broadTeamCodeQrCandidates.filter((actionsScope) => {
        return importDialogScope.element.contains(actionsScope.element);
      });
      expect(scopedRealTeamCodeQrCandidates).toHaveLength(1);

      wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-fake-scope').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-team-code-qr-actions-fake-anchor-primary').forEach((noiseNode) => {
        const noiseQrButton = noiseNode
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        expect(noiseNode.findAll('input[accept="image/*"]').length).toBeGreaterThanOrEqual(2);
        expect(Boolean(noiseQrButton)).toBe(true);
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-team-code-qr-actions-fake-anchor-secondary').forEach((noiseNode) => {
        const noiseQrButton = noiseNode
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        expect(noiseNode.findAll('input[accept="image/*"]').length).toBeGreaterThanOrEqual(2);
        expect(Boolean(noiseQrButton)).toBe(true);
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-dialog-footer-fake-anchor').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-duplicate-accept-fake-action-footer-extra-noise').forEach((noiseNode) => {
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
      vm.teamCodeInput = `#TA#CLOSED-NESTED-SLOT-FOOTER-SECONDARY-ORDER-DUPLICATE-ACCEPT-${round}`;
      await vm.$nextTick();
    }

    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(expectedOpenCount);
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonCount);
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeCount);
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrCount);

    wrapper.unmount();
  });

  it('keeps import-dialog anchoring exclusive and command counts aligned under nested slot-footer secondary-order class-drift and duplicate-accept extended fake-action noise matrix reopen cycles', async () => {
    const wrapper = createWrapper({ nestedSlotFooterSecondaryOrderClassDriftDuplicateAcceptExtendedFakeActionNoiseMatrix: true });
    const vm = wrapper.vm as unknown as ToolbarVm;
    const importButton = findButtonByText(wrapper, '导入');
    expect(importButton).toBeTruthy();

    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-noise-matrix').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-noise-layer').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-fake-scope').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-import-form-fake-anchor').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-import-form-class-drift').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-fake-anchor').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-class-drift').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-fake-anchor-primary').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-fake-anchor-secondary').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-class-drift').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-class-drift-secondary').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-footer-action-extended-noise-json').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-footer-action-extended-noise-team-code').length).toBeGreaterThan(0);
    expect(wrapper.findAll('[data-slot-footer-drift]').length).toBeGreaterThan(8);
    expect(wrapper.findAll('.import-form').length).toBeGreaterThan(2);
    expect(wrapper.findAll('.dialog-footer').length).toBeGreaterThan(5);
    expect(wrapper.findAll('.team-code-qr-actions').length).toBeGreaterThan(2);

    wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-fake-anchor-json').forEach((noiseFooter) => {
      const buttonTexts = noiseFooter.findAll('button').map((button) => button.text().trim());
      expect(buttonTexts[0]).toBe('nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-json-pre');
      expect(buttonTexts).toContain('取消');
      expect(buttonTexts).toContain('选择 JSON 文件');
      expect(buttonTexts).toContain('nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-json-mid');
      expect(buttonTexts).toContain('nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-json-post');
    });
    wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-secondary-order-noise-json').forEach((noiseFooter) => {
      const buttonTexts = noiseFooter.findAll('button').map((button) => button.text().trim());
      expect(buttonTexts[0]).toBe('选择 JSON 文件');
      expect(buttonTexts[1]).toBe('取消');
    });
    wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-fake-anchor-team-code').forEach((noiseFooter) => {
      const buttonTexts = noiseFooter.findAll('button').map((button) => button.text().trim());
      expect(buttonTexts[0]).toBe('nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-team-code-pre');
      expect(buttonTexts).toContain('导入阵容码');
      expect(buttonTexts).toContain('取消');
      expect(buttonTexts).toContain('nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-team-code-mid');
      expect(buttonTexts).toContain('nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-extra-noise-team-code-post');
    });

    let expectedOpenCount = 0;
    let expectedJsonCount = 0;
    let expectedTeamCodeCount = 0;
    let expectedQrCount = 0;

    for (let round = 1; round <= 9; round += 1) {
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
      vm.teamCodeInput = `#TA#NESTED-SLOT-FOOTER-SECONDARY-ORDER-CLASS-DRIFT-DUPLICATE-ACCEPT-EXTENDED-${round}`;
      await vm.$nextTick();

      sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'teamCode');
      const importDialogScope = getImportDialogScope(wrapper, 'teamCode');
      const broadTeamCodeQrCandidates = wrapper.findAll('.team-code-qr-actions').filter((actionsScope) => {
        const teamCodeQrButton = actionsScope
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        return actionsScope.find('input[accept="image/*"]').exists() && Boolean(teamCodeQrButton);
      });
      expect(broadTeamCodeQrCandidates.length).toBeGreaterThan(2);
      const scopedRealTeamCodeQrCandidates = broadTeamCodeQrCandidates.filter((actionsScope) => {
        return importDialogScope.element.contains(actionsScope.element);
      });
      expect(scopedRealTeamCodeQrCandidates).toHaveLength(1);

      wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-fake-scope').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-fake-anchor-primary').forEach((noiseNode) => {
        const noiseQrButton = noiseNode
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        expect(noiseNode.findAll('input[accept="image/*"]').length).toBeGreaterThanOrEqual(3);
        expect(Boolean(noiseQrButton)).toBe(true);
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-fake-anchor-secondary').forEach((noiseNode) => {
        const noiseQrButton = noiseNode
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        expect(noiseNode.findAll('input[accept="image/*"]').length).toBeGreaterThanOrEqual(3);
        expect(Boolean(noiseQrButton)).toBe(true);
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-dialog-footer-fake-anchor').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-footer-extra-noise').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-footer-action-extended-noise-json').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-class-drift-duplicate-accept-extended-fake-action-footer-action-extended-noise-team-code').forEach((noiseNode) => {
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
      vm.teamCodeInput = `#TA#CLOSED-NESTED-SLOT-FOOTER-SECONDARY-ORDER-CLASS-DRIFT-DUPLICATE-ACCEPT-EXTENDED-${round}`;
      await vm.$nextTick();
    }

    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(expectedOpenCount);
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonCount);
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeCount);
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrCount);

    wrapper.unmount();
  });

  it('keeps import-dialog anchoring exclusive and command counts aligned under nested slot-footer secondary-order class-alias-drift duplicate-accept extended fake-action noise matrix v2 reopen cycles', async () => {
    const wrapper = createWrapper({ nestedSlotFooterSecondaryOrderClassAliasDriftDuplicateAcceptExtendedFakeActionNoiseMatrixV2: true });
    const vm = wrapper.vm as unknown as ToolbarVm;
    const importButton = findButtonByText(wrapper, '导入');
    expect(importButton).toBeTruthy();

    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-noise-matrix-v2').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-noise-layer-v2').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-fake-scope-v2').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-import-form-fake-anchor-v2').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-import-form-class-alias-drift-v2').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-dialog-footer-fake-anchor-v2').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-dialog-footer-secondary-order-noise-v2').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-fake-anchor-v2-primary').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-fake-anchor-v2-secondary').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-fake-anchor-v2-tertiary').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-hidden-input-noise-v2').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-footer-extra-noise-v2').length).toBeGreaterThan(0);
    expect(wrapper.findAll('[data-slot-footer-drift]').length).toBeGreaterThan(10);
    expect(wrapper.findAll('.import-form').length).toBeGreaterThan(2);
    expect(wrapper.findAll('.dialog-footer').length).toBeGreaterThan(6);
    expect(wrapper.findAll('.team-code-qr-actions').length).toBeGreaterThan(3);

    let expectedOpenCount = 0;
    let expectedJsonCount = 0;
    let expectedTeamCodeCount = 0;
    let expectedQrCount = 0;

    for (let round = 1; round <= 10; round += 1) {
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
      vm.teamCodeInput = `#TA#NESTED-SLOT-FOOTER-SECONDARY-ORDER-CLASS-ALIAS-DRIFT-DUPLICATE-ACCEPT-EXTENDED-V2-${round}`;
      await vm.$nextTick();

      sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'teamCode');
      const importDialogScope = getImportDialogScope(wrapper, 'teamCode');
      const broadTeamCodeQrCandidates = wrapper.findAll('.team-code-qr-actions').filter((actionsScope) => {
        const teamCodeQrButton = actionsScope
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        return actionsScope.find('input[accept="image/*"]').exists() && Boolean(teamCodeQrButton);
      });
      expect(broadTeamCodeQrCandidates.length).toBeGreaterThan(3);
      const scopedRealTeamCodeQrCandidates = broadTeamCodeQrCandidates.filter((actionsScope) => {
        return importDialogScope.element.contains(actionsScope.element);
      });
      expect(scopedRealTeamCodeQrCandidates).toHaveLength(1);

      wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-fake-scope-v2').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-fake-anchor-v2-primary').forEach((noiseNode) => {
        const noiseQrButton = noiseNode
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        expect(noiseNode.findAll('input[accept="image/*"]').length).toBeGreaterThanOrEqual(3);
        expect(Boolean(noiseQrButton)).toBe(true);
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-fake-anchor-v2-secondary').forEach((noiseNode) => {
        const noiseQrButton = noiseNode
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        expect(noiseNode.findAll('input[accept="image/*"]').length).toBeGreaterThanOrEqual(3);
        expect(Boolean(noiseQrButton)).toBe(true);
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-team-code-qr-actions-fake-anchor-v2-tertiary').forEach((noiseNode) => {
        const noiseQrButton = noiseNode
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        expect(noiseNode.findAll('input[accept="image/*"]').length).toBeGreaterThanOrEqual(2);
        expect(Boolean(noiseQrButton)).toBe(true);
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-hidden-input-noise-v2').forEach((noiseInput) => {
        expect(importDialogScope.element.contains(noiseInput.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-footer-extra-noise-v2').forEach((noiseFooter) => {
        expect(importDialogScope.element.contains(noiseFooter.element)).toBe(false);
      });
      wrapper.findAll('.nested-slot-footer-secondary-order-class-alias-drift-duplicate-accept-extended-fake-action-dialog-footer-fake-anchor-v2').forEach((noiseFooter) => {
        expect(importDialogScope.element.contains(noiseFooter.element)).toBe(false);
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
      vm.teamCodeInput = `#TA#CLOSED-NESTED-SLOT-FOOTER-SECONDARY-ORDER-CLASS-ALIAS-DRIFT-DUPLICATE-ACCEPT-EXTENDED-V2-${round}`;
      await vm.$nextTick();
    }

    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(expectedOpenCount);
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonCount);
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeCount);
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrCount);

    wrapper.unmount();
  });

  it('keeps import-dialog anchoring exclusive and command counts aligned under slot-footer branch-order class-drift duplicate-accept hidden-input extended fake-action noise matrix v3 reopen cycles', async () => {
    const wrapper = createWrapper({ slotFooterBranchOrderClassDriftDuplicateAcceptHiddenInputExtendedFakeActionNoiseMatrixV3: true });
    const vm = wrapper.vm as unknown as ToolbarVm;
    const importButton = findButtonByText(wrapper, '导入');
    expect(importButton).toBeTruthy();

    expect(wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-noise-matrix-v3').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-noise-layer-v3').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-fake-scope-v3').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-import-form-fake-anchor-v3').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-import-form-class-drift-v3').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-dialog-footer-fake-anchor-v3').length).toBeGreaterThan(1);
    expect(wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-dialog-footer-secondary-order-noise-v3').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-team-code-qr-actions-fake-anchor-v3-primary').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-team-code-qr-actions-fake-anchor-v3-secondary').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-team-code-qr-actions-fake-anchor-v3-tertiary').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-hidden-input-v3').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-footer-extra-noise-v3').length).toBeGreaterThan(0);
    expect(wrapper.findAll('[data-slot-footer-branch-order-drift]').length).toBeGreaterThan(8);
    expect(wrapper.findAll('.import-form').length).toBeGreaterThan(2);
    expect(wrapper.findAll('.dialog-footer').length).toBeGreaterThan(6);
    expect(wrapper.findAll('.team-code-qr-actions').length).toBeGreaterThan(3);

    let expectedOpenCount = 0;
    let expectedJsonCount = 0;
    let expectedTeamCodeCount = 0;
    let expectedQrCount = 0;

    for (let round = 1; round <= 10; round += 1) {
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
      vm.teamCodeInput = `#TA#SLOT-FOOTER-BRANCH-ORDER-CLASS-DRIFT-DUPLICATE-ACCEPT-HIDDEN-INPUT-EXTENDED-V3-${round}`;
      await vm.$nextTick();

      sourceBoundVisibility = assertImportSourceBoundVisibility(wrapper, vm, 'teamCode');
      const importDialogScope = getImportDialogScope(wrapper, 'teamCode');
      const broadTeamCodeQrCandidates = wrapper.findAll('.team-code-qr-actions').filter((actionsScope) => {
        const teamCodeQrButton = actionsScope
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        return actionsScope.find('input[accept="image/*"]').exists() && Boolean(teamCodeQrButton);
      });
      expect(broadTeamCodeQrCandidates.length).toBeGreaterThan(3);
      const scopedRealTeamCodeQrCandidates = broadTeamCodeQrCandidates.filter((actionsScope) => {
        return importDialogScope.element.contains(actionsScope.element);
      });
      expect(scopedRealTeamCodeQrCandidates).toHaveLength(1);

      wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-fake-scope-v3').forEach((noiseNode) => {
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-team-code-qr-actions-fake-anchor-v3-primary').forEach((noiseNode) => {
        const noiseQrButton = noiseNode
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        expect(noiseNode.findAll('input[accept="image/*"]').length).toBeGreaterThanOrEqual(3);
        expect(Boolean(noiseQrButton)).toBe(true);
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-team-code-qr-actions-fake-anchor-v3-secondary').forEach((noiseNode) => {
        const noiseQrButton = noiseNode
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        expect(noiseNode.findAll('input[accept="image/*"]').length).toBeGreaterThanOrEqual(3);
        expect(Boolean(noiseQrButton)).toBe(true);
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-team-code-qr-actions-fake-anchor-v3-tertiary').forEach((noiseNode) => {
        const noiseQrButton = noiseNode
          .findAll('button')
          .find((button) => button.text().trim() === '选择二维码图片');
        expect(noiseNode.findAll('input[accept="image/*"]').length).toBeGreaterThanOrEqual(2);
        expect(Boolean(noiseQrButton)).toBe(true);
        expect(importDialogScope.element.contains(noiseNode.element)).toBe(false);
      });
      wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-hidden-input-v3').forEach((noiseInput) => {
        expect(importDialogScope.element.contains(noiseInput.element)).toBe(false);
      });
      wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-dialog-footer-fake-anchor-v3').forEach((noiseFooter) => {
        expect(importDialogScope.element.contains(noiseFooter.element)).toBe(false);
      });
      wrapper.findAll('.slot-footer-branch-order-class-drift-duplicate-accept-hidden-input-extended-fake-action-footer-extra-noise-v3').forEach((noiseFooter) => {
        expect(importDialogScope.element.contains(noiseFooter.element)).toBe(false);
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
      vm.teamCodeInput = `#TA#CLOSED-SLOT-FOOTER-BRANCH-ORDER-CLASS-DRIFT-DUPLICATE-ACCEPT-HIDDEN-INPUT-EXTENDED-V3-${round}`;
      await vm.$nextTick();
    }

    expect(wiringSpies.openImportDialog).toHaveBeenCalledTimes(expectedOpenCount);
    expect(wiringSpies.triggerJsonFileImport).toHaveBeenCalledTimes(expectedJsonCount);
    expect(wiringSpies.handleTeamCodeImport).toHaveBeenCalledTimes(expectedTeamCodeCount);
    expect(wiringSpies.triggerTeamCodeQrImport).toHaveBeenCalledTimes(expectedQrCount);

    wrapper.unmount();
  });
});
