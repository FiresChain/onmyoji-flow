import { describe, expect, it } from 'vitest';
import toolbarSource from '@/components/Toolbar.vue?raw';
import importExportCommandsSource from '@/components/composables/useToolbarImportExportCommands.ts?raw';
import assetManagementSource from '@/components/composables/useToolbarAssetManagement.ts?raw';
import ruleManagementSource from '@/components/composables/useToolbarRuleManagement.ts?raw';
import workspaceCommandsSource from '@/components/composables/useToolbarWorkspaceCommands.ts?raw';
import dialogStateSource from '@/components/composables/useToolbarDialogState.ts?raw';

describe('Toolbar architecture guard', () => {
  it('keeps toolbar as composable wiring layer', () => {
    const toolbarRequiredSnippets = [
      'useToolbarImportExportCommands({',
      'useToolbarAssetManagement({',
      'useToolbarRuleManagement({',
      'useToolbarWorkspaceCommands({',
      'useToolbarDialogState({',
    ];

    toolbarRequiredSnippets.forEach((snippet) => {
      expect(toolbarSource).toContain(snippet);
    });
  });

  it('keeps workspace command implementations in useToolbarWorkspaceCommands', () => {
    const toolbarWiringSnippets = [
      '@click="loadExample"',
      '@click="handleResetWorkspace"',
      '@click="handleClearCanvas"',
    ];
    toolbarWiringSnippets.forEach((snippet) => {
      expect(toolbarSource).toContain(snippet);
    });

    const toolbarShouldNotContainWorkspaceImplementations = [
      '加载样例会覆盖当前数据，是否覆盖？',
      '确定重置当前工作区？该操作不可撤销',
      '仅清空当前画布，不影响其他文件，确定继续？',
    ];
    toolbarShouldNotContainWorkspaceImplementations.forEach((snippet) => {
      expect(toolbarSource).not.toContain(snippet);
    });

    const composableRequiredSnippets = [
      '加载样例会覆盖当前数据，是否覆盖？',
      '确定重置当前工作区？该操作不可撤销',
      '仅清空当前画布，不影响其他文件，确定继续？',
      "showMessage('success', '当前画布已清空');",
    ];
    composableRequiredSnippets.forEach((snippet) => {
      expect(workspaceCommandsSource).toContain(snippet);
    });
  });

  it('keeps import/export implementations in useToolbarImportExportCommands', () => {
    const toolbarWiringSnippets = [
      '@click="handleExport"',
      '@click="handlePreviewData"',
      '@click="prepareCapture"',
      '@click="handleTeamCodeImport"',
      '@change="handleTeamCodeQrImport"',
    ];
    toolbarWiringSnippets.forEach((snippet) => {
      expect(toolbarSource).toContain(snippet);
    });

    const toolbarShouldNotContainImportExportImplementations = [
      'decodeTeamCodeFromQrImage',
      "showMessage('error', '未找到 LogicFlow 实例，无法截图');",
      'const handleJsonImport = () => {',
      'const handleTeamCodeImport = async () => {',
    ];
    toolbarShouldNotContainImportExportImplementations.forEach((snippet) => {
      expect(toolbarSource).not.toContain(snippet);
    });

    const composableRequiredSnippets = [
      'const handleJsonImport = () => {',
      'const handleTeamCodeImport = async () => {',
      'const handleTeamCodeQrImport = async (event: Event) => {',
      "showMessage('error', '未找到 LogicFlow 实例，无法截图');",
      'decodeTeamCodeFromQrImage',
    ];
    composableRequiredSnippets.forEach((snippet) => {
      expect(importExportCommandsSource).toContain(snippet);
    });
  });

  it('keeps asset management implementations in useToolbarAssetManagement', () => {
    const toolbarWiringSnippets = [
      '@click="openAssetManager"',
      '@click="triggerAssetManagerUpload"',
      '@change="handleAssetManagerUpload"',
      'mountAssetManagement();',
      'disposeAssetManagement();',
    ];
    toolbarWiringSnippets.forEach((snippet) => {
      expect(toolbarSource).toContain(snippet);
    });

    const toolbarShouldNotContainAssetImplementations = [
      'subscribeCustomAssetStore',
      'createCustomAssetFromFile',
      'deleteCustomAsset',
      'listCustomAssets',
    ];
    toolbarShouldNotContainAssetImplementations.forEach((snippet) => {
      expect(toolbarSource).not.toContain(snippet);
    });

    const composableRequiredSnippets = [
      'subscribeCustomAssetStore',
      'createCustomAssetFromFile',
      'deleteCustomAsset',
      'listCustomAssets',
      "showMessage('success', '素材上传成功');",
    ];
    composableRequiredSnippets.forEach((snippet) => {
      expect(assetManagementSource).toContain(snippet);
    });
  });

  it('keeps rule management implementations in useToolbarRuleManagement', () => {
    const toolbarWiringSnippets = [
      '@click="openRuleManager"',
      '@click="applyRuleManagerConfig"',
      '@click="restoreDefaultRuleConfig"',
      '@change="handleRuleBundleImport"',
      '@click="saveRuleEditor"',
    ];
    toolbarWiringSnippets.forEach((snippet) => {
      expect(toolbarSource).toContain(snippet);
    });

    const toolbarShouldNotContainRuleImplementations = [
      'readSharedGroupRulesConfig',
      'writeSharedGroupRulesConfig',
      'normalizeImportedExpressionRules',
      "恢复默认会覆盖当前规则和变量，是否继续？",
    ];
    toolbarShouldNotContainRuleImplementations.forEach((snippet) => {
      expect(toolbarSource).not.toContain(snippet);
    });

    const composableRequiredSnippets = [
      'readSharedGroupRulesConfig',
      'writeSharedGroupRulesConfig',
      'const normalizeImportedExpressionRules = (value: unknown): ExpressionRuleDefinition[] => {',
      "恢复默认会覆盖当前规则和变量，是否继续？",
      'const applyRuleManagerConfig = () => {',
    ];
    composableRequiredSnippets.forEach((snippet) => {
      expect(ruleManagementSource).toContain(snippet);
    });
  });

  it('keeps dialog state implementations in useToolbarDialogState', () => {
    const toolbarWiringSnippets = [
      '@click="showUpdateLog"',
      '@click="showFeedbackForm"',
      '@click="openWatermarkDialog"',
      'mountDialogState();',
    ];
    toolbarWiringSnippets.forEach((snippet) => {
      expect(toolbarSource).toContain(snippet);
    });

    const toolbarShouldNotContainDialogImplementations = [
      "localStorage.setItem('watermark.text'",
      "localStorage.setItem('appVersion'",
      'state.showUpdateLogDialog = !state.showUpdateLogDialog;',
      'state.showFeedbackFormDialog = !state.showFeedbackFormDialog;',
    ];
    toolbarShouldNotContainDialogImplementations.forEach((snippet) => {
      expect(toolbarSource).not.toContain(snippet);
    });

    const composableRequiredSnippets = [
      "state.showUpdateLogDialog = !state.showUpdateLogDialog;",
      "state.showFeedbackFormDialog = !state.showFeedbackFormDialog;",
      "localStorage.setItem('watermark.text', watermark.text);",
      "localStorage.setItem('appVersion', currentAppVersion);",
      'const mountDialogState = () => {',
    ];
    composableRequiredSnippets.forEach((snippet) => {
      expect(dialogStateSource).toContain(snippet);
    });
  });
});
