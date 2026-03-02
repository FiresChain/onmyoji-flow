import { describe, expect, it } from 'vitest';
import toolbarSource from '@/components/Toolbar.vue?raw';
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
