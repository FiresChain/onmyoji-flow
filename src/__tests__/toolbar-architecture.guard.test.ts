import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import toolbarSource from '@/components/Toolbar.vue?raw';
import importExportCommandsSource from '@/components/composables/useToolbarImportExportCommands.ts?raw';
import assetManagementSource from '@/components/composables/useToolbarAssetManagement.ts?raw';
import ruleManagementSource from '@/components/composables/useToolbarRuleManagement.ts?raw';
import workspaceCommandsSource from '@/components/composables/useToolbarWorkspaceCommands.ts?raw';
import dialogStateSource from '@/components/composables/useToolbarDialogState.ts?raw';

interface AstScanResult {
  sourceFile: ts.SourceFile;
  callExpressions: ts.CallExpression[];
  newExpressions: ts.NewExpression[];
  importDeclarations: ts.ImportDeclaration[];
  variableDeclarations: ts.VariableDeclaration[];
}

const extractScriptSetupContent = (sfcSource: string) => {
  const scriptSetupMatch = sfcSource.match(/<script setup[^>]*>([\s\S]*?)<\/script>/);
  if (!scriptSetupMatch) {
    throw new Error('Toolbar.vue script setup block not found');
  }
  return scriptSetupMatch[1];
};

const extractTemplateContent = (sfcSource: string) => {
  const templateMatch = sfcSource.match(/<template>([\s\S]*)<\/template>/);
  if (!templateMatch) {
    throw new Error('Toolbar.vue template block not found');
  }
  return templateMatch[1];
};

const scanAst = (sourceText: string, fileName: string): AstScanResult => {
  const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const callExpressions: ts.CallExpression[] = [];
  const newExpressions: ts.NewExpression[] = [];
  const importDeclarations: ts.ImportDeclaration[] = [];
  const variableDeclarations: ts.VariableDeclaration[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      callExpressions.push(node);
    }
    if (ts.isNewExpression(node)) {
      newExpressions.push(node);
    }
    if (ts.isImportDeclaration(node)) {
      importDeclarations.push(node);
    }
    if (ts.isVariableDeclaration(node)) {
      variableDeclarations.push(node);
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return {
    sourceFile,
    callExpressions,
    newExpressions,
    importDeclarations,
    variableDeclarations,
  };
};

const isSetTimeoutCall = (callExpression: ts.CallExpression) => {
  return ts.isIdentifier(callExpression.expression) && callExpression.expression.text === 'setTimeout';
};

const getSetTimeoutDelay = (callExpression: ts.CallExpression) => {
  const delayArg = callExpression.arguments[1];
  if (!delayArg || !ts.isNumericLiteral(delayArg)) {
    return null;
  }
  return Number(delayArg.text);
};

const getSetTimeoutCallbackText = (callExpression: ts.CallExpression, sourceFile: ts.SourceFile) => {
  const callbackArg = callExpression.arguments[0];
  if (!callbackArg || (!ts.isArrowFunction(callbackArg) && !ts.isFunctionExpression(callbackArg))) {
    return '';
  }
  return callbackArg.getText(sourceFile);
};

const getCallExpressionText = (callExpression: ts.CallExpression, sourceFile: ts.SourceFile) => {
  return callExpression.expression.getText(sourceFile);
};

const getImportModuleSpecifier = (importDeclaration: ts.ImportDeclaration) => {
  if (!ts.isStringLiteral(importDeclaration.moduleSpecifier)) {
    return '';
  }
  return importDeclaration.moduleSpecifier.text;
};

const getNamedImportIdentifiers = (importDeclaration: ts.ImportDeclaration) => {
  const namedBindings = importDeclaration.importClause?.namedBindings;
  if (!namedBindings || !ts.isNamedImports(namedBindings)) {
    return [] as string[];
  }
  return namedBindings.elements.map((element) => element.name.text);
};

const getObjectBindingElementNames = (declaration: ts.VariableDeclaration) => {
  if (!ts.isObjectBindingPattern(declaration.name)) {
    return [] as string[];
  }
  return declaration.name.elements
    .map((element) => {
      if (!ts.isIdentifier(element.name)) {
        return '';
      }
      return element.name.text;
    })
    .filter((name) => name.length > 0);
};

const getObjectLiteralPropertyNames = (objectLiteralExpression: ts.ObjectLiteralExpression) => {
  return objectLiteralExpression.properties
    .map((property) => {
      if (ts.isShorthandPropertyAssignment(property)) {
        return property.name.text;
      }
      if (ts.isPropertyAssignment(property) || ts.isMethodDeclaration(property)) {
        const propertyName = property.name;
        if (ts.isIdentifier(propertyName) || ts.isStringLiteral(propertyName)) {
          return propertyName.text;
        }
      }
      return '';
    })
    .filter((name) => name.length > 0);
};

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
      '@click="openImportDialog"',
      '@click="handleExport"',
      '@click="handlePreviewData"',
      '@click="triggerJsonFileImport"',
      '@click="triggerTeamCodeQrImport"',
      '@click="prepareCapture"',
      '@click="handleTeamCodeImport"',
      '@change="handleTeamCodeQrImport"',
    ];
    toolbarWiringSnippets.forEach((snippet) => {
      expect(toolbarSource).toContain(snippet);
    });

    const toolbarShouldNotContainImportExportImplementations = [
      'convertTeamCodeToRootDocument',
      'decodeTeamCodeFromQrImage',
      'logicFlowInstance.getSnapshotBase64',
      'withDynamicGroupsHiddenForSnapshot',
      'addWatermarkToImage',
      "const input = document.createElement('input');",
      "document.createElement('input')",
      "const link = document.createElement('a');",
      "document.createElement('a')",
      'const reader = new FileReader();',
      'new FileReader()',
      'await navigator.clipboard.writeText(state.previewDataContent);',
      'navigator.clipboard.writeText',
      'filesStore.exportData();\n    }, 2000);',
      'setTimeout(() => {\n      try {\n        const activeName',
      'JSON.parse(readerTarget.result as string)',
      "showMessage('error', '文件格式错误');",
      "showMessage('error', '未获取到截图数据');",
      "showMessage('error', '未找到 LogicFlow 实例，无法截图');",
      'const handleJsonImport = () => {',
      'const handleTeamCodeImport = async () => {',
    ];
    toolbarShouldNotContainImportExportImplementations.forEach((snippet) => {
      expect(toolbarSource).not.toContain(snippet);
    });

    const toolbarShouldNotContainImportExportPatterns = [
      /document\.createElement\(\s*['"](input|a)['"]\s*\)/,
      /new\s+FileReader\(\)/,
      /navigator\.clipboard\.writeText\(/,
      /filesStore\.exportData\(\);\s*\}\s*,\s*2000\);/,
      /state\.showDataPreviewDialog\s*=\s*true;\s*\}\s*catch[\s\S]*\}\s*,\s*100\);/,
    ];
    toolbarShouldNotContainImportExportPatterns.forEach((pattern) => {
      expect(toolbarSource).not.toMatch(pattern);
    });

    const composableRequiredSnippets = [
      'convertTeamCodeToRootDocument',
      'const withDynamicGroupsHiddenForSnapshot = async <T>(',
      'const addWatermarkToImage = (base64: string, watermark: WatermarkSettings) => {',
      'const handleJsonImport = () => {',
      'const handleTeamCodeImport = async () => {',
      'const handleTeamCodeQrImport = async (event: Event) => {',
      'logicFlowInstance.getSnapshotBase64(',
      "const input = document.createElement('input');",
      "document.createElement('input')",
      "const link = document.createElement('a');",
      "document.createElement('a')",
      'const reader = new FileReader();',
      'new FileReader()',
      'await navigator.clipboard.writeText(state.previewDataContent);',
      'navigator.clipboard.writeText(state.previewDataContent);',
      'filesStore.exportData();\n    }, 2000);',
      'setTimeout(() => {\n      try {\n        const activeName',
      'state.showDataPreviewDialog = true;',
      '    }, 100);',
      "showMessage('error', '文件格式错误');",
      "showMessage('error', '数据预览失败');",
      "showMessage('error', '复制失败');",
      "showMessage('error', '未获取到截图数据');",
      "showMessage('error', '未找到 LogicFlow 实例，无法截图');",
      'decodeTeamCodeFromQrImage',
    ];
    composableRequiredSnippets.forEach((snippet) => {
      expect(importExportCommandsSource).toContain(snippet);
    });

    expect(importExportCommandsSource).toMatch(
      /const handleExport = \(\) => \{\s*filesStore\.updateTab\(\);\s*setTimeout\(\(\) => \{\s*filesStore\.exportData\(\);\s*\},\s*2000\);\s*\};/s,
    );
    expect(importExportCommandsSource).toMatch(
      /const handlePreviewData = \(\) => \{\s*filesStore\.updateTab\(\);\s*setTimeout\(\(\) => \{[\s\S]*state\.showDataPreviewDialog = true;[\s\S]*\},\s*100\);\s*\};/s,
    );
  });

  it('keeps import dialog source-branch and qr entry wiring invariants in template', () => {
    const toolbarTemplateSource = extractTemplateContent(toolbarSource);
    const toolbarScriptSource = extractScriptSetupContent(toolbarSource);
    const importDialogTemplateMatch = toolbarTemplateSource.match(
      /<el-dialog[^>]*title="导入数据"[\s\S]*?<\/el-dialog>/,
    );
    expect(importDialogTemplateMatch).toBeTruthy();
    const importDialogTemplateSource = importDialogTemplateMatch![0];
    const importSourceModelBindings = Array.from(importDialogTemplateSource.matchAll(/v-model="importSource"/g));
    const importSourceOptions = Array.from(
      importDialogTemplateSource.matchAll(/<el-radio-button[^>]*label="([^"]+)"[^>]*>/g),
    ).map((match) => match[1]);
    const teamCodeQrActionsAnchors = Array.from(
      importDialogTemplateSource.matchAll(/class="team-code-qr-actions"/g),
    );

    expect(importSourceModelBindings).toHaveLength(1);
    expect(importDialogTemplateSource).toMatch(/<el-radio-group(?=[^>]*v-model="importSource")[^>]*>/);
    expect(importSourceOptions).toHaveLength(2);
    expect(importSourceOptions).toEqual(expect.arrayContaining(['json', 'teamCode']));
    expect(importSourceOptions.filter((value) => value === 'json')).toHaveLength(1);
    expect(importSourceOptions.filter((value) => value === 'teamCode')).toHaveLength(1);
    expect(importDialogTemplateSource).toMatch(
      /<el-button(?=[^>]*v-if="importSource === 'json'")(?=[^>]*@click="triggerJsonFileImport")[^>]*>/,
    );
    expect(importDialogTemplateSource).toMatch(
      /<el-button(?=[^>]*v-else)(?=[^>]*@click="handleTeamCodeImport")[^>]*>/,
    );
    expect(teamCodeQrActionsAnchors).toHaveLength(1);
    expect(importDialogTemplateSource).toMatch(/<el-button(?=[^>]*@click="triggerTeamCodeQrImport")[^>]*>/);
    expect(importDialogTemplateSource).toMatch(
      /<input(?=[^>]*ref="teamCodeQrInputRef")(?=[^>]*@change="handleTeamCodeQrImport")(?=[^>]*accept="image\/\*")[^>]*>/,
    );

    expect(toolbarScriptSource).not.toContain('convertTeamCodeToRootDocument');
    expect(toolbarScriptSource).not.toContain('decodeTeamCodeFromQrImage');
    expect(toolbarScriptSource).not.toContain('withDynamicGroupsHiddenForSnapshot');
    expect(toolbarScriptSource).not.toContain('addWatermarkToImage');
    expect(toolbarScriptSource).not.toContain("@/utils/teamCodeService");
  });

  it('keeps import-dialog local template invariants strict and wiring-layer dependency boundary intact', () => {
    const toolbarTemplateSource = extractTemplateContent(toolbarSource);
    const toolbarScriptSource = extractScriptSetupContent(toolbarSource);
    const importDialogTemplateMatch = toolbarTemplateSource.match(
      /<el-dialog[^>]*title="导入数据"[\s\S]*?<\/el-dialog>/,
    );
    expect(importDialogTemplateMatch).toBeTruthy();
    const importDialogTemplateSource = importDialogTemplateMatch![0];

    const importFormTemplateMatch = importDialogTemplateSource.match(
      /<el-form(?=[^>]*class="import-form")[^>]*>[\s\S]*?<\/el-form>/,
    );
    expect(importFormTemplateMatch).toBeTruthy();
    const importFormTemplateSource = importFormTemplateMatch![0];

    const globalImportFormAnchors = Array.from(toolbarTemplateSource.matchAll(/class="import-form"/g));
    const localImportFormAnchors = Array.from(importDialogTemplateSource.matchAll(/class="import-form"/g));
    const globalImportSourceBindings = Array.from(toolbarTemplateSource.matchAll(/v-model="importSource"/g));
    const localImportSourceBindings = Array.from(importDialogTemplateSource.matchAll(/v-model="importSource"/g));
    const formImportSourceBindings = Array.from(importFormTemplateSource.matchAll(/v-model="importSource"/g));
    const importSourceOptions = Array.from(
      importFormTemplateSource.matchAll(/<el-radio-button[^>]*label="([^"]+)"[^>]*>/g),
    ).map((match) => match[1]);
    const uniqueImportSourceOptions = Array.from(new Set(importSourceOptions));

    expect(globalImportFormAnchors).toHaveLength(1);
    expect(localImportFormAnchors).toHaveLength(1);
    expect(globalImportSourceBindings).toHaveLength(1);
    expect(localImportSourceBindings).toHaveLength(1);
    expect(formImportSourceBindings).toHaveLength(1);
    expect(importSourceOptions).toEqual(['json', 'teamCode']);
    expect(uniqueImportSourceOptions).toEqual(['json', 'teamCode']);

    const teamCodeQrActionsMatch = importDialogTemplateSource.match(
      /<div class="team-code-qr-actions">[\s\S]*?<\/div>/,
    );
    expect(teamCodeQrActionsMatch).toBeTruthy();
    const teamCodeQrActionsSource = teamCodeQrActionsMatch![0];
    expect(Array.from(importDialogTemplateSource.matchAll(/class="team-code-qr-actions"/g))).toHaveLength(1);
    expect(teamCodeQrActionsSource).toMatch(/<el-button(?=[^>]*@click="triggerTeamCodeQrImport")[^>]*>/);
    expect(teamCodeQrActionsSource).toMatch(
      /<input(?=[^>]*ref="teamCodeQrInputRef")(?=[^>]*@change="handleTeamCodeQrImport")(?=[^>]*accept="image\/\*")[^>]*>/,
    );
    expect(Array.from(importDialogTemplateSource.matchAll(/@click="triggerJsonFileImport"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/@click="handleTeamCodeImport"/g))).toHaveLength(1);

    const toolbarScriptAst = scanAst(toolbarScriptSource, 'Toolbar.script.ts');
    const toolbarImportModules = toolbarScriptAst.importDeclarations.map(getImportModuleSpecifier);
    expect(toolbarImportModules).not.toContain('@/utils/teamCodeService');
    expect(toolbarScriptSource).not.toContain('convertTeamCodeToRootDocument');
    expect(toolbarScriptSource).not.toContain('decodeTeamCodeFromQrImage');
    expect(toolbarScriptSource).not.toContain('withDynamicGroupsHiddenForSnapshot');
    expect(toolbarScriptSource).not.toContain('addWatermarkToImage');
    expect(toolbarScriptSource).not.toContain('navigator.clipboard.writeText');
    expect(toolbarScriptSource).not.toContain('document.createElement');
  });

  it('keeps import-dialog local template exclusivity and branch-mutual-exclusion invariants', () => {
    const toolbarTemplateSource = extractTemplateContent(toolbarSource);
    const toolbarScriptSource = extractScriptSetupContent(toolbarSource);
    const importDialogTemplateMatch = toolbarTemplateSource.match(
      /<el-dialog[^>]*title="导入数据"[\s\S]*?<\/el-dialog>/,
    );
    expect(importDialogTemplateMatch).toBeTruthy();
    const importDialogTemplateSource = importDialogTemplateMatch![0];

    const importDialogFooterMatch = importDialogTemplateSource.match(
      /<template #footer>[\s\S]*?<\/template>/,
    );
    expect(importDialogFooterMatch).toBeTruthy();
    const importDialogFooterSource = importDialogFooterMatch![0];

    const globalImportFormAnchors = Array.from(toolbarTemplateSource.matchAll(/class="import-form"/g));
    const localImportFormAnchors = Array.from(importDialogTemplateSource.matchAll(/class="import-form"/g));
    const globalImportSourceBindings = Array.from(toolbarTemplateSource.matchAll(/v-model="importSource"/g));
    const localImportSourceBindings = Array.from(importDialogTemplateSource.matchAll(/v-model="importSource"/g));
    const globalTeamCodeInputBindings = Array.from(toolbarTemplateSource.matchAll(/v-model="teamCodeInput"/g));
    const localTeamCodeInputBindings = Array.from(importDialogTemplateSource.matchAll(/v-model="teamCodeInput"/g));
    const localImportSourceOptions = Array.from(
      importDialogTemplateSource.matchAll(/<el-radio-button[^>]*label="([^"]+)"[^>]*>/g),
    ).map((match) => match[1]);

    expect(globalImportFormAnchors).toHaveLength(1);
    expect(localImportFormAnchors).toHaveLength(1);
    expect(globalImportSourceBindings).toHaveLength(1);
    expect(localImportSourceBindings).toHaveLength(1);
    expect(globalTeamCodeInputBindings).toHaveLength(1);
    expect(localTeamCodeInputBindings).toHaveLength(1);
    expect(localImportSourceOptions).toHaveLength(2);
    expect(localImportSourceOptions).toEqual(expect.arrayContaining(['json', 'teamCode']));
    expect(localImportSourceOptions.filter((value) => value === 'json')).toHaveLength(1);
    expect(localImportSourceOptions.filter((value) => value === 'teamCode')).toHaveLength(1);

    expect(Array.from(importDialogFooterSource.matchAll(/v-if="importSource === 'json'"/g))).toHaveLength(1);
    expect(Array.from(importDialogFooterSource.matchAll(/@click="triggerJsonFileImport"/g))).toHaveLength(1);
    expect(Array.from(importDialogFooterSource.matchAll(/\bv-else\b/g))).toHaveLength(1);
    expect(Array.from(importDialogFooterSource.matchAll(/@click="handleTeamCodeImport"/g))).toHaveLength(1);
    expect(importDialogFooterSource).toMatch(
      /<el-button(?=[^>]*v-if="importSource === 'json'")(?=[^>]*@click="triggerJsonFileImport")[^>]*>[\s\S]*?<\/el-button>\s*<el-button(?=[^>]*v-else)(?=[^>]*@click="handleTeamCodeImport")[^>]*>[\s\S]*?<\/el-button>/,
    );

    const teamCodeQrActionsMatch = importDialogTemplateSource.match(
      /<div class="team-code-qr-actions">[\s\S]*?<\/div>/,
    );
    expect(teamCodeQrActionsMatch).toBeTruthy();
    const teamCodeQrActionsSource = teamCodeQrActionsMatch![0];
    expect(Array.from(importDialogTemplateSource.matchAll(/class="team-code-qr-actions"/g))).toHaveLength(1);
    expect(teamCodeQrActionsSource).toMatch(/<el-button(?=[^>]*@click="triggerTeamCodeQrImport")[^>]*>/);
    expect(teamCodeQrActionsSource).toMatch(
      /<input(?=[^>]*ref="teamCodeQrInputRef")(?=[^>]*@change="handleTeamCodeQrImport")(?=[^>]*accept="image\/\*")[^>]*>/,
    );

    const toolbarScriptAst = scanAst(toolbarScriptSource, 'Toolbar.script.ts');
    const toolbarImportModules = toolbarScriptAst.importDeclarations.map(getImportModuleSpecifier);
    expect(toolbarImportModules).not.toContain('@/utils/teamCodeService');
    expect(toolbarScriptSource).not.toContain('convertTeamCodeToRootDocument');
    expect(toolbarScriptSource).not.toContain('decodeTeamCodeFromQrImage');
    expect(toolbarScriptSource).not.toContain('withDynamicGroupsHiddenForSnapshot');
    expect(toolbarScriptSource).not.toContain('addWatermarkToImage');
  });

  it('keeps import-dialog local binding uniqueness and strict footer branch exclusivity under local scope guards', () => {
    const toolbarTemplateSource = extractTemplateContent(toolbarSource);
    const toolbarScriptSource = extractScriptSetupContent(toolbarSource);
    const importDialogTemplateMatch = toolbarTemplateSource.match(
      /<el-dialog[^>]*title="导入数据"[\s\S]*?<\/el-dialog>/,
    );
    expect(importDialogTemplateMatch).toBeTruthy();
    const importDialogTemplateSource = importDialogTemplateMatch![0];

    const importFormTemplateMatch = importDialogTemplateSource.match(
      /<el-form(?=[^>]*class="import-form")[^>]*>[\s\S]*?<\/el-form>/,
    );
    expect(importFormTemplateMatch).toBeTruthy();
    const importFormTemplateSource = importFormTemplateMatch![0];

    const importDialogFooterMatch = importDialogTemplateSource.match(
      /<template #footer>[\s\S]*?<\/template>/,
    );
    expect(importDialogFooterMatch).toBeTruthy();
    const importDialogFooterSource = importDialogFooterMatch![0];

    const globalImportFormAnchors = Array.from(toolbarTemplateSource.matchAll(/class="import-form"/g));
    const localImportFormAnchors = Array.from(importDialogTemplateSource.matchAll(/class="import-form"/g));
    const globalImportSourceBindings = Array.from(toolbarTemplateSource.matchAll(/v-model="importSource"/g));
    const localImportSourceBindings = Array.from(importDialogTemplateSource.matchAll(/v-model="importSource"/g));
    const formImportSourceBindings = Array.from(importFormTemplateSource.matchAll(/v-model="importSource"/g));
    const globalTeamCodeInputBindings = Array.from(toolbarTemplateSource.matchAll(/v-model="teamCodeInput"/g));
    const localTeamCodeInputBindings = Array.from(importDialogTemplateSource.matchAll(/v-model="teamCodeInput"/g));
    const formTeamCodeInputBindings = Array.from(importFormTemplateSource.matchAll(/v-model="teamCodeInput"/g));
    const localImportSourceOptions = Array.from(
      importFormTemplateSource.matchAll(/<el-radio-button[^>]*label="([^"]+)"[^>]*>/g),
    ).map((match) => match[1]);
    const uniqueLocalImportSourceOptions = Array.from(new Set(localImportSourceOptions));

    expect(globalImportFormAnchors).toHaveLength(1);
    expect(localImportFormAnchors).toHaveLength(1);
    expect(globalImportSourceBindings).toHaveLength(1);
    expect(localImportSourceBindings).toHaveLength(1);
    expect(formImportSourceBindings).toHaveLength(1);
    expect(globalTeamCodeInputBindings).toHaveLength(1);
    expect(localTeamCodeInputBindings).toHaveLength(1);
    expect(formTeamCodeInputBindings).toHaveLength(1);
    expect(localImportSourceOptions).toEqual(['json', 'teamCode']);
    expect(uniqueLocalImportSourceOptions).toEqual(['json', 'teamCode']);

    expect(Array.from(importDialogFooterSource.matchAll(/@click="state\.showImportDialog = false"/g))).toHaveLength(1);
    expect(Array.from(importDialogFooterSource.matchAll(/v-if="importSource === 'json'"/g))).toHaveLength(1);
    expect(Array.from(importDialogFooterSource.matchAll(/\bv-else\b/g))).toHaveLength(1);
    expect(Array.from(importDialogFooterSource.matchAll(/\bv-else-if\b/g))).toHaveLength(0);
    expect(Array.from(importDialogFooterSource.matchAll(/@click="triggerJsonFileImport"/g))).toHaveLength(1);
    expect(Array.from(importDialogFooterSource.matchAll(/@click="handleTeamCodeImport"/g))).toHaveLength(1);
    expect(importDialogFooterSource).toMatch(
      /<el-button(?=[^>]*@click="state\.showImportDialog = false")[^>]*>[\s\S]*?<\/el-button>\s*<el-button(?=[^>]*v-if="importSource === 'json'")(?=[^>]*@click="triggerJsonFileImport")[^>]*>[\s\S]*?<\/el-button>\s*<el-button(?=[^>]*v-else)(?=[^>]*@click="handleTeamCodeImport")[^>]*>[\s\S]*?<\/el-button>/,
    );

    const teamCodeQrActionsMatch = importDialogTemplateSource.match(
      /<div class="team-code-qr-actions">[\s\S]*?<\/div>/,
    );
    expect(teamCodeQrActionsMatch).toBeTruthy();
    const teamCodeQrActionsSource = teamCodeQrActionsMatch![0];
    expect(Array.from(importDialogTemplateSource.matchAll(/class="team-code-qr-actions"/g))).toHaveLength(1);
    expect(teamCodeQrActionsSource).toMatch(/<el-button(?=[^>]*@click="triggerTeamCodeQrImport")[^>]*>/);
    expect(teamCodeQrActionsSource).toMatch(
      /<input(?=[^>]*ref="teamCodeQrInputRef")(?=[^>]*@change="handleTeamCodeQrImport")(?=[^>]*accept="image\/\*")[^>]*>/,
    );

    const toolbarScriptAst = scanAst(toolbarScriptSource, 'Toolbar.script.ts');
    const toolbarImportModules = toolbarScriptAst.importDeclarations.map(getImportModuleSpecifier);
    expect(toolbarImportModules).not.toContain('@/utils/teamCodeService');
    expect(toolbarScriptSource).not.toContain('convertTeamCodeToRootDocument');
    expect(toolbarScriptSource).not.toContain('decodeTeamCodeFromQrImage');
  });

  it('keeps import-dialog local-template adjacency and unique wiring ownership guarded with AST boundaries', () => {
    const toolbarTemplateSource = extractTemplateContent(toolbarSource);
    const toolbarScriptSource = extractScriptSetupContent(toolbarSource);
    const importDialogTemplateMatch = toolbarTemplateSource.match(
      /<el-dialog[^>]*title="导入数据"[\s\S]*?<\/el-dialog>/,
    );
    expect(importDialogTemplateMatch).toBeTruthy();
    const importDialogTemplateSource = importDialogTemplateMatch![0];

    const importFormTemplateMatch = importDialogTemplateSource.match(
      /<el-form(?=[^>]*class="import-form")[^>]*>[\s\S]*?<\/el-form>/,
    );
    expect(importFormTemplateMatch).toBeTruthy();
    const importFormTemplateSource = importFormTemplateMatch![0];

    const importDialogFooterMatch = importDialogTemplateSource.match(
      /<template #footer>[\s\S]*?<\/template>/,
    );
    expect(importDialogFooterMatch).toBeTruthy();
    const importDialogFooterSource = importDialogFooterMatch![0];

    expect(Array.from(toolbarTemplateSource.matchAll(/class="import-form"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/class="import-form"/g))).toHaveLength(1);
    expect(Array.from(toolbarTemplateSource.matchAll(/v-model="importSource"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/v-model="importSource"/g))).toHaveLength(1);
    expect(Array.from(importFormTemplateSource.matchAll(/v-model="importSource"/g))).toHaveLength(1);
    expect(Array.from(toolbarTemplateSource.matchAll(/v-model="teamCodeInput"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/v-model="teamCodeInput"/g))).toHaveLength(1);
    expect(Array.from(importFormTemplateSource.matchAll(/v-model="teamCodeInput"/g))).toHaveLength(1);

    const importDialogWithoutFormSource = importDialogTemplateSource.replace(importFormTemplateSource, '');
    expect(importDialogWithoutFormSource).not.toContain('v-model="importSource"');
    expect(importDialogWithoutFormSource).not.toContain('v-model="teamCodeInput"');

    const footerButtons = Array.from(importDialogFooterSource.matchAll(/<el-button[\s\S]*?<\/el-button>/g)).map((match) => match[0]);
    expect(footerButtons).toHaveLength(3);
    expect(footerButtons[0]).toMatch(/@click="state\.showImportDialog = false"/);
    expect(footerButtons[0]).not.toMatch(/\bv-if\b/);
    expect(footerButtons[0]).not.toMatch(/\bv-else\b/);
    expect(footerButtons[0]).not.toMatch(/\bv-else-if\b/);
    expect(footerButtons[1]).toMatch(/v-if="importSource === 'json'"/);
    expect(footerButtons[1]).toMatch(/@click="triggerJsonFileImport"/);
    expect(footerButtons[1]).not.toMatch(/\bv-else\b/);
    expect(footerButtons[1]).not.toMatch(/\bv-else-if\b/);
    expect(footerButtons[2]).toMatch(/\bv-else\b/);
    expect(footerButtons[2]).toMatch(/@click="handleTeamCodeImport"/);
    expect(footerButtons[2]).not.toMatch(/\bv-else-if\b/);
    expect(importDialogFooterSource).not.toMatch(/\bv-else-if\b/);
    expect(importDialogFooterSource).toMatch(
      /<el-button(?=[^>]*@click="state\.showImportDialog = false")[^>]*>[\s\S]*?<\/el-button>\s*<el-button(?=[^>]*v-if="importSource === 'json'")(?=[^>]*@click="triggerJsonFileImport")[^>]*>[\s\S]*?<\/el-button>\s*<el-button(?=[^>]*v-else)(?=[^>]*@click="handleTeamCodeImport")[^>]*>[\s\S]*?<\/el-button>/,
    );

    const teamCodeQrActionsMatches = Array.from(
      importDialogTemplateSource.matchAll(/<div class="team-code-qr-actions">[\s\S]*?<\/div>/g),
    );
    expect(teamCodeQrActionsMatches).toHaveLength(1);
    const teamCodeQrActionsSource = teamCodeQrActionsMatches[0][0];
    expect(Array.from(teamCodeQrActionsSource.matchAll(/@click="triggerTeamCodeQrImport"/g))).toHaveLength(1);
    expect(Array.from(teamCodeQrActionsSource.matchAll(/ref="teamCodeQrInputRef"/g))).toHaveLength(1);
    expect(Array.from(teamCodeQrActionsSource.matchAll(/@change="handleTeamCodeQrImport"/g))).toHaveLength(1);
    expect(Array.from(teamCodeQrActionsSource.matchAll(/accept="image\/\*"/g))).toHaveLength(1);

    const toolbarScriptAst = scanAst(toolbarScriptSource, 'Toolbar.script.ts');
    const toolbarImportModules = toolbarScriptAst.importDeclarations.map(getImportModuleSpecifier);
    expect(toolbarImportModules).not.toContain('@/utils/teamCodeService');
    const importExportDeclaration = toolbarScriptAst.variableDeclarations.find((declaration) => {
      if (!declaration.initializer || !ts.isCallExpression(declaration.initializer)) {
        return false;
      }
      return getCallExpressionText(declaration.initializer, toolbarScriptAst.sourceFile) === 'useToolbarImportExportCommands';
    });
    expect(importExportDeclaration).toBeTruthy();
    const importExportCallArgument = importExportDeclaration!.initializer
      && ts.isCallExpression(importExportDeclaration!.initializer)
      ? importExportDeclaration!.initializer.arguments[0]
      : null;
    expect(importExportCallArgument && ts.isObjectLiteralExpression(importExportCallArgument)).toBe(true);
    const importExportCallArgumentKeys = getObjectLiteralPropertyNames(importExportCallArgument as ts.ObjectLiteralExpression);
    expect(importExportCallArgumentKeys).toEqual(expect.arrayContaining([
      'state',
      'importSource',
      'teamCodeInput',
      'teamCodeQrInputRef',
    ]));

    expect(toolbarScriptSource).not.toContain('convertTeamCodeToRootDocument');
    expect(toolbarScriptSource).not.toContain('decodeTeamCodeFromQrImage');
    expect(toolbarScriptSource).not.toContain('withDynamicGroupsHiddenForSnapshot');
    expect(toolbarScriptSource).not.toContain('addWatermarkToImage');
    expect(toolbarScriptSource).not.toContain('navigator.clipboard.writeText');
    expect(toolbarScriptSource).not.toContain('document.createElement');
  });

  it('keeps import-dialog local-template ownership and footer adjacency guarded with strict AST boundaries', () => {
    const toolbarTemplateSource = extractTemplateContent(toolbarSource);
    const toolbarScriptSource = extractScriptSetupContent(toolbarSource);
    const importDialogTemplateMatch = toolbarTemplateSource.match(
      /<el-dialog[^>]*title="导入数据"[\s\S]*?<\/el-dialog>/,
    );
    expect(importDialogTemplateMatch).toBeTruthy();
    const importDialogTemplateSource = importDialogTemplateMatch![0];

    const importFormTemplateMatch = importDialogTemplateSource.match(
      /<el-form(?=[^>]*class="import-form")[^>]*>[\s\S]*?<\/el-form>/,
    );
    expect(importFormTemplateMatch).toBeTruthy();
    const importFormTemplateSource = importFormTemplateMatch![0];

    const importDialogFooterMatch = importDialogTemplateSource.match(
      /<template #footer>[\s\S]*?<\/template>/,
    );
    expect(importDialogFooterMatch).toBeTruthy();
    const importDialogFooterSource = importDialogFooterMatch![0];

    expect(Array.from(toolbarTemplateSource.matchAll(/class="import-form"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/class="import-form"/g))).toHaveLength(1);
    expect(Array.from(toolbarTemplateSource.matchAll(/v-model="importSource"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/v-model="importSource"/g))).toHaveLength(1);
    expect(Array.from(importFormTemplateSource.matchAll(/v-model="importSource"/g))).toHaveLength(1);
    expect(Array.from(toolbarTemplateSource.matchAll(/v-model="teamCodeInput"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/v-model="teamCodeInput"/g))).toHaveLength(1);
    expect(Array.from(importFormTemplateSource.matchAll(/v-model="teamCodeInput"/g))).toHaveLength(1);

    const toolbarTemplateWithoutImportDialog = toolbarTemplateSource.replace(importDialogTemplateSource, '');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('v-model="importSource"');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('v-model="teamCodeInput"');

    const importDialogWithoutImportForm = importDialogTemplateSource.replace(importFormTemplateSource, '');
    expect(importDialogWithoutImportForm).not.toContain('v-model="importSource"');
    expect(importDialogWithoutImportForm).not.toContain('v-model="teamCodeInput"');

    const footerButtons = Array.from(importDialogFooterSource.matchAll(/<el-button[\s\S]*?<\/el-button>/g)).map((match) => match[0]);
    expect(footerButtons).toHaveLength(3);
    expect(footerButtons[0]).toMatch(/@click="state\.showImportDialog = false"/);
    expect(footerButtons[0]).not.toMatch(/\bv-if\b/);
    expect(footerButtons[0]).not.toMatch(/\bv-else\b/);
    expect(footerButtons[0]).not.toMatch(/\bv-else-if\b/);
    expect(footerButtons[1]).toMatch(/v-if="importSource === 'json'"/);
    expect(footerButtons[1]).toMatch(/@click="triggerJsonFileImport"/);
    expect(footerButtons[1]).not.toMatch(/\bv-else\b/);
    expect(footerButtons[1]).not.toMatch(/\bv-else-if\b/);
    expect(footerButtons[2]).toMatch(/\bv-else\b/);
    expect(footerButtons[2]).toMatch(/@click="handleTeamCodeImport"/);
    expect(footerButtons[2]).not.toMatch(/\bv-if\b/);
    expect(footerButtons[2]).not.toMatch(/\bv-else-if\b/);
    expect(importDialogFooterSource).not.toMatch(/\bv-else-if\b/);
    expect(importDialogFooterSource).toMatch(
      /<el-button(?=[^>]*@click="state\.showImportDialog = false")[^>]*>[\s\S]*?<\/el-button>\s*<el-button(?=[^>]*v-if="importSource === 'json'")(?=[^>]*@click="triggerJsonFileImport")[^>]*>[\s\S]*?<\/el-button>\s*<el-button(?=[^>]*v-else)(?=[^>]*@click="handleTeamCodeImport")[^>]*>[\s\S]*?<\/el-button>/,
    );

    expect(Array.from(toolbarTemplateSource.matchAll(/class="team-code-qr-actions"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/class="team-code-qr-actions"/g))).toHaveLength(1);
    expect(Array.from(toolbarTemplateSource.matchAll(/ref="teamCodeQrInputRef"/g))).toHaveLength(1);
    expect(Array.from(toolbarTemplateSource.matchAll(/@change="handleTeamCodeQrImport"/g))).toHaveLength(1);
    expect(Array.from(toolbarTemplateSource.matchAll(/accept="image\/\*"/g)).length).toBeGreaterThanOrEqual(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/ref="teamCodeQrInputRef"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/@change="handleTeamCodeQrImport"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/accept="image\/\*"/g))).toHaveLength(1);
    expect(importDialogTemplateSource).toMatch(
      /<input(?=[^>]*ref="teamCodeQrInputRef")(?=[^>]*@change="handleTeamCodeQrImport")(?=[^>]*accept="image\/\*")[^>]*>/,
    );

    const toolbarScriptAst = scanAst(toolbarScriptSource, 'Toolbar.script.ts');
    const toolbarImportModules = toolbarScriptAst.importDeclarations.map(getImportModuleSpecifier);
    expect(toolbarImportModules).not.toContain('@/utils/teamCodeService');
    expect(toolbarScriptSource).not.toContain('convertTeamCodeToRootDocument');
    expect(toolbarScriptSource).not.toContain('decodeTeamCodeFromQrImage');
    expect(toolbarScriptSource).not.toContain('withDynamicGroupsHiddenForSnapshot');
    expect(toolbarScriptSource).not.toContain('addWatermarkToImage');
    expect(toolbarScriptSource).not.toContain('navigator.clipboard.writeText');
    expect(toolbarScriptSource).not.toContain('document.createElement');

    const importExportDeclaration = toolbarScriptAst.variableDeclarations.find((declaration) => {
      if (!declaration.initializer || !ts.isCallExpression(declaration.initializer)) {
        return false;
      }
      return getCallExpressionText(declaration.initializer, toolbarScriptAst.sourceFile) === 'useToolbarImportExportCommands';
    });
    expect(importExportDeclaration).toBeTruthy();
    const importExportCallArgument = importExportDeclaration!.initializer
      && ts.isCallExpression(importExportDeclaration!.initializer)
      ? importExportDeclaration!.initializer.arguments[0]
      : null;
    expect(importExportCallArgument && ts.isObjectLiteralExpression(importExportCallArgument)).toBe(true);
    const importExportCallArgumentKeys = getObjectLiteralPropertyNames(importExportCallArgument as ts.ObjectLiteralExpression);
    expect(importExportCallArgumentKeys).toEqual(expect.arrayContaining([
      'state',
      'importSource',
      'teamCodeInput',
      'teamCodeQrInputRef',
    ]));
  });

  it('enforces import-dialog footer-order and local-form ownership with exclusive qr wiring AST guards', () => {
    const toolbarTemplateSource = extractTemplateContent(toolbarSource);
    const toolbarScriptSource = extractScriptSetupContent(toolbarSource);
    const importDialogTemplateMatch = toolbarTemplateSource.match(
      /<el-dialog[^>]*title="导入数据"[\s\S]*?<\/el-dialog>/,
    );
    expect(importDialogTemplateMatch).toBeTruthy();
    const importDialogTemplateSource = importDialogTemplateMatch![0];

    const importFormTemplateMatch = importDialogTemplateSource.match(
      /<el-form(?=[^>]*class="import-form")[^>]*>[\s\S]*?<\/el-form>/,
    );
    expect(importFormTemplateMatch).toBeTruthy();
    const importFormTemplateSource = importFormTemplateMatch![0];

    const importDialogFooterMatch = importDialogTemplateSource.match(
      /<template #footer>[\s\S]*?<\/template>/,
    );
    expect(importDialogFooterMatch).toBeTruthy();
    const importDialogFooterSource = importDialogFooterMatch![0];

    expect(Array.from(toolbarTemplateSource.matchAll(/class="import-form"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/class="import-form"/g))).toHaveLength(1);
    expect(Array.from(toolbarTemplateSource.matchAll(/v-model="importSource"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/v-model="importSource"/g))).toHaveLength(1);
    expect(Array.from(importFormTemplateSource.matchAll(/v-model="importSource"/g))).toHaveLength(1);
    expect(Array.from(toolbarTemplateSource.matchAll(/v-model="teamCodeInput"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/v-model="teamCodeInput"/g))).toHaveLength(1);
    expect(Array.from(importFormTemplateSource.matchAll(/v-model="teamCodeInput"/g))).toHaveLength(1);

    const toolbarTemplateWithoutImportDialog = toolbarTemplateSource.replace(importDialogTemplateSource, '');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('class="import-form"');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('v-model="importSource"');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('v-model="teamCodeInput"');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('class="team-code-qr-actions"');

    const importDialogWithoutImportForm = importDialogTemplateSource.replace(importFormTemplateSource, '');
    expect(importDialogWithoutImportForm).not.toContain('v-model="importSource"');
    expect(importDialogWithoutImportForm).not.toContain('v-model="teamCodeInput"');

    const footerButtons = Array.from(importDialogFooterSource.matchAll(/<el-button[\s\S]*?<\/el-button>/g)).map((match) => match[0]);
    expect(footerButtons).toHaveLength(3);
    expect(footerButtons[0]).toMatch(/@click="state\.showImportDialog = false"/);
    expect(footerButtons[0]).not.toMatch(/\bv-if\b/);
    expect(footerButtons[0]).not.toMatch(/\bv-else\b/);
    expect(footerButtons[0]).not.toMatch(/\bv-else-if\b/);
    expect(footerButtons[1]).toMatch(/v-if="importSource === 'json'"/);
    expect(footerButtons[1]).toMatch(/@click="triggerJsonFileImport"/);
    expect(footerButtons[1]).not.toMatch(/\bv-else\b/);
    expect(footerButtons[1]).not.toMatch(/\bv-else-if\b/);
    expect(footerButtons[2]).toMatch(/\bv-else\b/);
    expect(footerButtons[2]).toMatch(/@click="handleTeamCodeImport"/);
    expect(footerButtons[2]).not.toMatch(/\bv-if\b/);
    expect(footerButtons[2]).not.toMatch(/\bv-else-if\b/);
    expect(importDialogFooterSource).not.toMatch(/\bv-else-if\b/);
    expect(Array.from(importDialogFooterSource.matchAll(/@click="state\.showImportDialog = false"/g))).toHaveLength(1);
    expect(Array.from(importDialogFooterSource.matchAll(/@click="triggerJsonFileImport"/g))).toHaveLength(1);
    expect(Array.from(importDialogFooterSource.matchAll(/@click="handleTeamCodeImport"/g))).toHaveLength(1);
    expect(Array.from(importDialogFooterSource.matchAll(/v-if="importSource === 'json'"/g))).toHaveLength(1);
    expect(Array.from(importDialogFooterSource.matchAll(/\bv-else\b/g))).toHaveLength(1);

    const closeActionIndex = importDialogFooterSource.indexOf('@click="state.showImportDialog = false"');
    const jsonActionIndex = importDialogFooterSource.indexOf('@click="triggerJsonFileImport"');
    const teamCodeActionIndex = importDialogFooterSource.indexOf('@click="handleTeamCodeImport"');
    expect(closeActionIndex).toBeGreaterThanOrEqual(0);
    expect(jsonActionIndex).toBeGreaterThanOrEqual(0);
    expect(teamCodeActionIndex).toBeGreaterThanOrEqual(0);
    expect(closeActionIndex).toBeLessThan(jsonActionIndex);
    expect(jsonActionIndex).toBeLessThan(teamCodeActionIndex);

    expect(Array.from(toolbarTemplateSource.matchAll(/class="team-code-qr-actions"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/class="team-code-qr-actions"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/@click="triggerTeamCodeQrImport"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/ref="teamCodeQrInputRef"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/@change="handleTeamCodeQrImport"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/accept="image\/\*"/g))).toHaveLength(1);
    expect(toolbarTemplateWithoutImportDialog).not.toContain('triggerTeamCodeQrImport');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('teamCodeQrInputRef');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('handleTeamCodeQrImport');
    const teamCodeQrActionsMatch = importDialogTemplateSource.match(
      /<div class="team-code-qr-actions">[\s\S]*?<\/div>/,
    );
    expect(teamCodeQrActionsMatch).toBeTruthy();
    const teamCodeQrActionsSource = teamCodeQrActionsMatch![0];
    expect(teamCodeQrActionsSource).toMatch(/<el-button(?=[^>]*@click="triggerTeamCodeQrImport")[^>]*>/);
    expect(teamCodeQrActionsSource).toMatch(
      /<input(?=[^>]*ref="teamCodeQrInputRef")(?=[^>]*@change="handleTeamCodeQrImport")(?=[^>]*accept="image\/\*")[^>]*>/,
    );

    const toolbarScriptAst = scanAst(toolbarScriptSource, 'Toolbar.script.ts');
    const toolbarImportModules = toolbarScriptAst.importDeclarations.map(getImportModuleSpecifier);
    expect(toolbarImportModules).not.toContain('@/utils/teamCodeService');
    expect(toolbarScriptSource).not.toContain('convertTeamCodeToRootDocument');
    expect(toolbarScriptSource).not.toContain('decodeTeamCodeFromQrImage');
    expect(toolbarScriptSource).not.toContain('withDynamicGroupsHiddenForSnapshot');
    expect(toolbarScriptSource).not.toContain('addWatermarkToImage');
    expect(toolbarScriptSource).not.toContain('navigator.clipboard.writeText');
    expect(toolbarScriptSource).not.toContain('document.createElement');

    const toolbarImportedIdentifiers = toolbarScriptAst.importDeclarations.flatMap(getNamedImportIdentifiers);
    expect(toolbarImportedIdentifiers).not.toContain('convertTeamCodeToRootDocument');
    expect(toolbarImportedIdentifiers).not.toContain('decodeTeamCodeFromQrImage');
    expect(toolbarImportedIdentifiers).not.toContain('withDynamicGroupsHiddenForSnapshot');
    expect(toolbarImportedIdentifiers).not.toContain('addWatermarkToImage');

    const importExportDeclaration = toolbarScriptAst.variableDeclarations.find((declaration) => {
      if (!declaration.initializer || !ts.isCallExpression(declaration.initializer)) {
        return false;
      }
      return getCallExpressionText(declaration.initializer, toolbarScriptAst.sourceFile) === 'useToolbarImportExportCommands';
    });
    expect(importExportDeclaration).toBeTruthy();
    const importExportCallArgument = importExportDeclaration!.initializer
      && ts.isCallExpression(importExportDeclaration!.initializer)
      ? importExportDeclaration!.initializer.arguments[0]
      : null;
    expect(importExportCallArgument && ts.isObjectLiteralExpression(importExportCallArgument)).toBe(true);
    const importExportCallArgumentKeys = getObjectLiteralPropertyNames(importExportCallArgument as ts.ObjectLiteralExpression);
    expect(importExportCallArgumentKeys).toEqual(expect.arrayContaining([
      'state',
      'importSource',
      'teamCodeInput',
      'teamCodeQrInputRef',
    ]));
  });

  it('enforces import-dialog slot-footer ownership, exclusive branch order, and qr action-pair AST guards without order coupling', () => {
    const toolbarTemplateSource = extractTemplateContent(toolbarSource);
    const toolbarScriptSource = extractScriptSetupContent(toolbarSource);
    const importDialogTemplateMatch = toolbarTemplateSource.match(
      /<el-dialog[^>]*title="导入数据"[\s\S]*?<\/el-dialog>/,
    );
    expect(importDialogTemplateMatch).toBeTruthy();
    const importDialogTemplateSource = importDialogTemplateMatch![0];

    const importFormTemplateMatch = importDialogTemplateSource.match(
      /<el-form(?=[^>]*class="import-form")[^>]*>[\s\S]*?<\/el-form>/,
    );
    expect(importFormTemplateMatch).toBeTruthy();
    const importFormTemplateSource = importFormTemplateMatch![0];

    const importDialogFooterMatch = importDialogTemplateSource.match(
      /<template #footer>[\s\S]*?<\/template>/,
    );
    expect(importDialogFooterMatch).toBeTruthy();
    const importDialogFooterSource = importDialogFooterMatch![0];

    expect(Array.from(toolbarTemplateSource.matchAll(/class="import-form"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/class="import-form"/g))).toHaveLength(1);
    expect(Array.from(toolbarTemplateSource.matchAll(/v-model="importSource"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/v-model="importSource"/g))).toHaveLength(1);
    expect(Array.from(importFormTemplateSource.matchAll(/v-model="importSource"/g))).toHaveLength(1);
    expect(Array.from(toolbarTemplateSource.matchAll(/v-model="teamCodeInput"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/v-model="teamCodeInput"/g))).toHaveLength(1);
    expect(Array.from(importFormTemplateSource.matchAll(/v-model="teamCodeInput"/g))).toHaveLength(1);
    expect(importDialogFooterSource).not.toContain('v-model="importSource"');
    expect(importDialogFooterSource).not.toContain('v-model="teamCodeInput"');

    const toolbarTemplateWithoutImportDialog = toolbarTemplateSource.replace(importDialogTemplateSource, '');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('class="import-form"');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('v-model="importSource"');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('v-model="teamCodeInput"');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('class="team-code-qr-actions"');

    const importDialogWithoutImportForm = importDialogTemplateSource.replace(importFormTemplateSource, '');
    expect(importDialogWithoutImportForm).not.toContain('v-model="importSource"');
    expect(importDialogWithoutImportForm).not.toContain('v-model="teamCodeInput"');

    const footerButtons = Array.from(importDialogFooterSource.matchAll(/<el-button[\s\S]*?<\/el-button>/g)).map((match) => match[0]);
    expect(footerButtons).toHaveLength(3);
    expect(footerButtons[0]).toMatch(/@click="state\.showImportDialog = false"/);
    expect(footerButtons[0]).not.toMatch(/\bv-if\b/);
    expect(footerButtons[0]).not.toMatch(/\bv-else\b/);
    expect(footerButtons[0]).not.toMatch(/\bv-else-if\b/);
    expect(footerButtons[1]).toMatch(/v-if="importSource === 'json'"/);
    expect(footerButtons[1]).toMatch(/@click="triggerJsonFileImport"/);
    expect(footerButtons[1]).not.toMatch(/\bv-else\b/);
    expect(footerButtons[1]).not.toMatch(/\bv-else-if\b/);
    expect(footerButtons[2]).toMatch(/\bv-else\b/);
    expect(footerButtons[2]).toMatch(/@click="handleTeamCodeImport"/);
    expect(footerButtons[2]).not.toMatch(/\bv-if\b/);
    expect(footerButtons[2]).not.toMatch(/\bv-else-if\b/);
    expect(importDialogFooterSource).not.toMatch(/\bv-else-if\b/);

    const closeActionIndex = importDialogFooterSource.indexOf('@click="state.showImportDialog = false"');
    const jsonActionIndex = importDialogFooterSource.indexOf('@click="triggerJsonFileImport"');
    const teamCodeActionIndex = importDialogFooterSource.indexOf('@click="handleTeamCodeImport"');
    expect(closeActionIndex).toBeGreaterThanOrEqual(0);
    expect(jsonActionIndex).toBeGreaterThanOrEqual(0);
    expect(teamCodeActionIndex).toBeGreaterThanOrEqual(0);
    expect(closeActionIndex).toBeLessThan(jsonActionIndex);
    expect(jsonActionIndex).toBeLessThan(teamCodeActionIndex);

    expect(Array.from(toolbarTemplateSource.matchAll(/class="team-code-qr-actions"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/class="team-code-qr-actions"/g))).toHaveLength(1);
    const teamCodeQrActionsMatch = importDialogTemplateSource.match(
      /<div class="team-code-qr-actions">[\s\S]*?<\/div>/,
    );
    expect(teamCodeQrActionsMatch).toBeTruthy();
    const teamCodeQrActionsSource = teamCodeQrActionsMatch![0];
    expect(Array.from(teamCodeQrActionsSource.matchAll(/@click="triggerTeamCodeQrImport"/g))).toHaveLength(1);
    expect(Array.from(teamCodeQrActionsSource.matchAll(/ref="teamCodeQrInputRef"/g))).toHaveLength(1);
    expect(Array.from(teamCodeQrActionsSource.matchAll(/@change="handleTeamCodeQrImport"/g))).toHaveLength(1);
    expect(Array.from(teamCodeQrActionsSource.matchAll(/accept="image\/\*"/g))).toHaveLength(1);
    const teamCodeQrActionElements = Array.from(teamCodeQrActionsSource.matchAll(/<(el-button|input)\b/g)).map((match) => match[1]);
    expect(teamCodeQrActionElements.filter((tagName) => tagName === 'el-button').length).toBeGreaterThan(0);
    expect(teamCodeQrActionElements.filter((tagName) => tagName === 'input')).toHaveLength(1);

    const importDialogWithoutQrActions = importDialogTemplateSource.replace(teamCodeQrActionsSource, '');
    expect(importDialogWithoutQrActions).not.toContain('triggerTeamCodeQrImport');
    expect(importDialogWithoutQrActions).not.toContain('teamCodeQrInputRef');
    expect(importDialogWithoutQrActions).not.toContain('handleTeamCodeQrImport');

    const toolbarScriptAst = scanAst(toolbarScriptSource, 'Toolbar.script.ts');
    const toolbarImportModules = toolbarScriptAst.importDeclarations.map(getImportModuleSpecifier);
    expect(toolbarImportModules).not.toContain('@/utils/teamCodeService');
    expect(toolbarScriptSource).not.toContain('convertTeamCodeToRootDocument');
    expect(toolbarScriptSource).not.toContain('decodeTeamCodeFromQrImage');
    expect(toolbarScriptSource).not.toContain('withDynamicGroupsHiddenForSnapshot');
    expect(toolbarScriptSource).not.toContain('addWatermarkToImage');
    expect(toolbarScriptSource).not.toContain('navigator.clipboard.writeText');
    expect(toolbarScriptSource).not.toContain('document.createElement');

    const importExportDeclaration = toolbarScriptAst.variableDeclarations.find((declaration) => {
      if (!declaration.initializer || !ts.isCallExpression(declaration.initializer)) {
        return false;
      }
      return getCallExpressionText(declaration.initializer, toolbarScriptAst.sourceFile) === 'useToolbarImportExportCommands';
    });
    expect(importExportDeclaration).toBeTruthy();
    const importExportCallArgument = importExportDeclaration!.initializer
      && ts.isCallExpression(importExportDeclaration!.initializer)
      ? importExportDeclaration!.initializer.arguments[0]
      : null;
    expect(importExportCallArgument && ts.isObjectLiteralExpression(importExportCallArgument)).toBe(true);
    const importExportCallArgumentKeys = getObjectLiteralPropertyNames(importExportCallArgument as ts.ObjectLiteralExpression);
    expect(importExportCallArgumentKeys).toEqual(expect.arrayContaining([
      'state',
      'importSource',
      'teamCodeInput',
      'teamCodeQrInputRef',
    ]));
  });

  it('enforces import-dialog local ownership with slot-footer branch-pair AST invariants and qr action/input pairing without fixed order assumptions', () => {
    const toolbarTemplateSource = extractTemplateContent(toolbarSource);
    const toolbarScriptSource = extractScriptSetupContent(toolbarSource);
    const importDialogTemplateMatch = toolbarTemplateSource.match(
      /<el-dialog[^>]*title="导入数据"[\s\S]*?<\/el-dialog>/,
    );
    expect(importDialogTemplateMatch).toBeTruthy();
    const importDialogTemplateSource = importDialogTemplateMatch![0];

    const importFormTemplateMatch = importDialogTemplateSource.match(
      /<el-form(?=[^>]*class="import-form")[^>]*>[\s\S]*?<\/el-form>/,
    );
    expect(importFormTemplateMatch).toBeTruthy();
    const importFormTemplateSource = importFormTemplateMatch![0];

    const importDialogFooterMatch = importDialogTemplateSource.match(
      /<template #footer>[\s\S]*?<\/template>/,
    );
    expect(importDialogFooterMatch).toBeTruthy();
    const importDialogFooterSource = importDialogFooterMatch![0];

    expect(Array.from(toolbarTemplateSource.matchAll(/class="import-form"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/class="import-form"/g))).toHaveLength(1);
    expect(Array.from(toolbarTemplateSource.matchAll(/v-model="importSource"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/v-model="importSource"/g))).toHaveLength(1);
    expect(Array.from(importFormTemplateSource.matchAll(/v-model="importSource"/g))).toHaveLength(1);
    expect(Array.from(toolbarTemplateSource.matchAll(/v-model="teamCodeInput"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/v-model="teamCodeInput"/g))).toHaveLength(1);
    expect(Array.from(importFormTemplateSource.matchAll(/v-model="teamCodeInput"/g))).toHaveLength(1);
    expect(importDialogFooterSource).not.toContain('v-model="importSource"');
    expect(importDialogFooterSource).not.toContain('v-model="teamCodeInput"');

    const toolbarTemplateWithoutImportDialog = toolbarTemplateSource.replace(importDialogTemplateSource, '');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('class="import-form"');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('v-model="importSource"');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('v-model="teamCodeInput"');
    expect(toolbarTemplateWithoutImportDialog).not.toContain('class="team-code-qr-actions"');

    const importDialogWithoutImportForm = importDialogTemplateSource.replace(importFormTemplateSource, '');
    expect(importDialogWithoutImportForm).not.toContain('v-model="importSource"');
    expect(importDialogWithoutImportForm).not.toContain('v-model="teamCodeInput"');

    const footerButtons = Array.from(importDialogFooterSource.matchAll(/<el-button[\s\S]*?<\/el-button>/g)).map((match) => match[0]);
    expect(footerButtons).toHaveLength(3);
    expect(footerButtons[0]).toMatch(/@click="state\.showImportDialog = false"/);
    expect(footerButtons[0]).not.toMatch(/\bv-if\b/);
    expect(footerButtons[0]).not.toMatch(/\bv-else\b/);
    expect(footerButtons[0]).not.toMatch(/\bv-else-if\b/);
    expect(footerButtons[1]).toMatch(/v-if="importSource === 'json'"/);
    expect(footerButtons[1]).toMatch(/@click="triggerJsonFileImport"/);
    expect(footerButtons[1]).not.toMatch(/\bv-else\b/);
    expect(footerButtons[1]).not.toMatch(/\bv-else-if\b/);
    expect(footerButtons[2]).toMatch(/\bv-else\b/);
    expect(footerButtons[2]).toMatch(/@click="handleTeamCodeImport"/);
    expect(footerButtons[2]).not.toMatch(/\bv-if\b/);
    expect(footerButtons[2]).not.toMatch(/\bv-else-if\b/);
    expect(importDialogFooterSource).not.toMatch(/\bv-else-if\b/);
    expect(Array.from(importDialogFooterSource.matchAll(/@click="triggerJsonFileImport"/g))).toHaveLength(1);
    expect(Array.from(importDialogFooterSource.matchAll(/@click="handleTeamCodeImport"/g))).toHaveLength(1);

    const closeActionIndex = importDialogFooterSource.indexOf('@click="state.showImportDialog = false"');
    const jsonActionIndex = importDialogFooterSource.indexOf('@click="triggerJsonFileImport"');
    const teamCodeActionIndex = importDialogFooterSource.indexOf('@click="handleTeamCodeImport"');
    expect(closeActionIndex).toBeGreaterThanOrEqual(0);
    expect(jsonActionIndex).toBeGreaterThanOrEqual(0);
    expect(teamCodeActionIndex).toBeGreaterThanOrEqual(0);
    expect(closeActionIndex).toBeLessThan(jsonActionIndex);
    expect(jsonActionIndex).toBeLessThan(teamCodeActionIndex);

    expect(Array.from(toolbarTemplateSource.matchAll(/class="team-code-qr-actions"/g))).toHaveLength(1);
    expect(Array.from(importDialogTemplateSource.matchAll(/class="team-code-qr-actions"/g))).toHaveLength(1);
    const teamCodeQrActionsMatch = importDialogTemplateSource.match(
      /<div class="team-code-qr-actions">[\s\S]*?<\/div>/,
    );
    expect(teamCodeQrActionsMatch).toBeTruthy();
    const teamCodeQrActionsSource = teamCodeQrActionsMatch![0];
    const qrActionButtonMatch = teamCodeQrActionsSource.match(
      /<el-button(?=[^>]*@click="triggerTeamCodeQrImport")[^>]*>/,
    );
    const qrActionInputMatch = teamCodeQrActionsSource.match(
      /<input(?=[^>]*ref="teamCodeQrInputRef")(?=[^>]*@change="handleTeamCodeQrImport")(?=[^>]*accept="image\/\*")[^>]*>/,
    );
    expect(qrActionButtonMatch).toBeTruthy();
    expect(qrActionInputMatch).toBeTruthy();
    const qrActionButtonIndex = qrActionButtonMatch ? teamCodeQrActionsSource.indexOf(qrActionButtonMatch[0]) : -1;
    const qrActionInputIndex = qrActionInputMatch ? teamCodeQrActionsSource.indexOf(qrActionInputMatch[0]) : -1;
    expect(qrActionButtonIndex).toBeGreaterThanOrEqual(0);
    expect(qrActionInputIndex).toBeGreaterThanOrEqual(0);
    expect(qrActionButtonIndex).not.toBe(qrActionInputIndex);
    expect([qrActionButtonIndex < qrActionInputIndex, qrActionInputIndex < qrActionButtonIndex]).toContain(true);
    expect(Array.from(teamCodeQrActionsSource.matchAll(/ref="teamCodeQrInputRef"/g))).toHaveLength(1);
    expect(Array.from(teamCodeQrActionsSource.matchAll(/@change="handleTeamCodeQrImport"/g))).toHaveLength(1);
    expect(Array.from(teamCodeQrActionsSource.matchAll(/accept="image\/\*"/g))).toHaveLength(1);

    const importDialogWithoutQrActions = importDialogTemplateSource.replace(teamCodeQrActionsSource, '');
    expect(importDialogWithoutQrActions).not.toContain('triggerTeamCodeQrImport');
    expect(importDialogWithoutQrActions).not.toContain('teamCodeQrInputRef');
    expect(importDialogWithoutQrActions).not.toContain('handleTeamCodeQrImport');

    const toolbarScriptAst = scanAst(toolbarScriptSource, 'Toolbar.script.ts');
    const toolbarImportModules = toolbarScriptAst.importDeclarations.map(getImportModuleSpecifier);
    expect(toolbarImportModules).not.toContain('@/utils/teamCodeService');
    expect(toolbarScriptSource).not.toContain('convertTeamCodeToRootDocument');
    expect(toolbarScriptSource).not.toContain('decodeTeamCodeFromQrImage');
    expect(toolbarScriptSource).not.toContain('withDynamicGroupsHiddenForSnapshot');
    expect(toolbarScriptSource).not.toContain('addWatermarkToImage');
    expect(toolbarScriptSource).not.toContain('navigator.clipboard.writeText');
    expect(toolbarScriptSource).not.toContain('document.createElement');

    const importExportDeclaration = toolbarScriptAst.variableDeclarations.find((declaration) => {
      if (!declaration.initializer || !ts.isCallExpression(declaration.initializer)) {
        return false;
      }
      return getCallExpressionText(declaration.initializer, toolbarScriptAst.sourceFile) === 'useToolbarImportExportCommands';
    });
    expect(importExportDeclaration).toBeTruthy();
    const importExportCallArgument = importExportDeclaration!.initializer
      && ts.isCallExpression(importExportDeclaration!.initializer)
      ? importExportDeclaration!.initializer.arguments[0]
      : null;
    expect(importExportCallArgument && ts.isObjectLiteralExpression(importExportCallArgument)).toBe(true);
    const importExportCallArgumentKeys = getObjectLiteralPropertyNames(importExportCallArgument as ts.ObjectLiteralExpression);
    expect(importExportCallArgumentKeys).toEqual(expect.arrayContaining([
      'state',
      'importSource',
      'teamCodeInput',
      'teamCodeQrInputRef',
    ]));
  });

  it('keeps import/export ownership boundaries with AST-level guards', () => {
    const toolbarScriptSource = extractScriptSetupContent(toolbarSource);
    const toolbarScriptAst = scanAst(toolbarScriptSource, 'Toolbar.script.ts');
    const toolbarCallExpressionTexts = toolbarScriptAst.callExpressions.map((callExpression) => {
      return getCallExpressionText(callExpression, toolbarScriptAst.sourceFile);
    });

    expect(toolbarCallExpressionTexts).not.toContain('document.createElement');
    expect(toolbarCallExpressionTexts).not.toContain('navigator.clipboard.writeText');
    expect(
      toolbarScriptAst.newExpressions.some((newExpression) => {
        return newExpression.expression.getText(toolbarScriptAst.sourceFile) === 'FileReader';
      }),
    ).toBe(false);

    const toolbarHasImportExportSetTimeout = toolbarScriptAst.callExpressions.some((callExpression) => {
      if (!isSetTimeoutCall(callExpression)) {
        return false;
      }
      const callbackText = getSetTimeoutCallbackText(callExpression, toolbarScriptAst.sourceFile);
      return callbackText.includes('filesStore.exportData')
        || callbackText.includes('state.showDataPreviewDialog')
        || callbackText.includes('state.previewDataContent');
    });
    expect(toolbarHasImportExportSetTimeout).toBe(false);

    const importExportAst = scanAst(importExportCommandsSource, 'useToolbarImportExportCommands.ts');
    const importExportCallExpressionTexts = importExportAst.callExpressions.map((callExpression) => {
      return getCallExpressionText(callExpression, importExportAst.sourceFile);
    });
    const importExportCreateElementArgs = importExportAst.callExpressions
      .filter((callExpression) => getCallExpressionText(callExpression, importExportAst.sourceFile) === 'document.createElement')
      .map((callExpression) => callExpression.arguments[0]?.getText(importExportAst.sourceFile));

    expect(importExportCallExpressionTexts).toContain('document.createElement');
    expect(importExportCallExpressionTexts).toContain('navigator.clipboard.writeText');
    expect(importExportCreateElementArgs).toEqual(expect.arrayContaining(["'input'", "'a'"]));
    expect(
      importExportAst.newExpressions.some((newExpression) => {
        return newExpression.expression.getText(importExportAst.sourceFile) === 'FileReader';
      }),
    ).toBe(true);

    const hasExportTimerOwnership = importExportAst.callExpressions.some((callExpression) => {
      if (!isSetTimeoutCall(callExpression)) {
        return false;
      }
      const delay = getSetTimeoutDelay(callExpression);
      const callbackText = getSetTimeoutCallbackText(callExpression, importExportAst.sourceFile);
      return delay === 2000 && callbackText.includes('filesStore.exportData');
    });
    expect(hasExportTimerOwnership).toBe(true);

    const hasPreviewTimerOwnership = importExportAst.callExpressions.some((callExpression) => {
      if (!isSetTimeoutCall(callExpression)) {
        return false;
      }
      const delay = getSetTimeoutDelay(callExpression);
      const callbackText = getSetTimeoutCallbackText(callExpression, importExportAst.sourceFile);
      return delay === 100 && callbackText.includes('state.showDataPreviewDialog = true');
    });
    expect(hasPreviewTimerOwnership).toBe(true);
  });

  it('keeps composable import/call ownership and import-export command destructuring complete with AST guards', () => {
    const toolbarScriptSource = extractScriptSetupContent(toolbarSource);
    const toolbarScriptAst = scanAst(toolbarScriptSource, 'Toolbar.script.ts');

    const requiredComposableBindings = [
      {
        importName: 'useToolbarImportExportCommands',
        moduleSpecifier: '@/components/composables/useToolbarImportExportCommands',
      },
      {
        importName: 'useToolbarAssetManagement',
        moduleSpecifier: '@/components/composables/useToolbarAssetManagement',
      },
      {
        importName: 'useToolbarRuleManagement',
        moduleSpecifier: '@/components/composables/useToolbarRuleManagement',
      },
      {
        importName: 'useToolbarWorkspaceCommands',
        moduleSpecifier: '@/components/composables/useToolbarWorkspaceCommands',
      },
      {
        importName: 'useToolbarDialogState',
        moduleSpecifier: '@/components/composables/useToolbarDialogState',
      },
    ] as const;

    requiredComposableBindings.forEach(({ importName, moduleSpecifier }) => {
      const importDeclaration = toolbarScriptAst.importDeclarations.find((declaration) => {
        return getImportModuleSpecifier(declaration) === moduleSpecifier;
      });
      expect(importDeclaration).toBeTruthy();
      expect(getNamedImportIdentifiers(importDeclaration!)).toContain(importName);

      const composableCallDeclarations = toolbarScriptAst.variableDeclarations.filter((declaration) => {
        if (!declaration.initializer || !ts.isCallExpression(declaration.initializer)) {
          return false;
        }
        return getCallExpressionText(declaration.initializer, toolbarScriptAst.sourceFile) === importName;
      });
      expect(composableCallDeclarations.length).toBeGreaterThan(0);
      composableCallDeclarations.forEach((declaration) => {
        const firstArgument = declaration.initializer && ts.isCallExpression(declaration.initializer)
          ? declaration.initializer.arguments[0]
          : null;
        expect(firstArgument && ts.isObjectLiteralExpression(firstArgument)).toBe(true);
      });
    });

    const importExportDeclaration = toolbarScriptAst.variableDeclarations.find((declaration) => {
      if (!declaration.initializer || !ts.isCallExpression(declaration.initializer)) {
        return false;
      }
      return getCallExpressionText(declaration.initializer, toolbarScriptAst.sourceFile) === 'useToolbarImportExportCommands';
    });
    expect(importExportDeclaration).toBeTruthy();
    expect(ts.isObjectBindingPattern(importExportDeclaration!.name)).toBe(true);

    const importExportCommandBindings = getObjectBindingElementNames(importExportDeclaration!);
    expect(importExportCommandBindings).toEqual(expect.arrayContaining([
      'handleExport',
      'handlePreviewData',
      'copyDataToClipboard',
      'openImportDialog',
      'triggerJsonFileImport',
      'triggerTeamCodeQrImport',
      'handleTeamCodeImport',
      'handleTeamCodeQrImport',
      'prepareCapture',
      'downloadImage',
      'handleClose',
    ]));

    const importExportCallArgument = importExportDeclaration!.initializer
      && ts.isCallExpression(importExportDeclaration!.initializer)
      ? importExportDeclaration!.initializer.arguments[0]
      : null;
    expect(importExportCallArgument && ts.isObjectLiteralExpression(importExportCallArgument)).toBe(true);
    const importExportCallArgumentKeys = getObjectLiteralPropertyNames(importExportCallArgument as ts.ObjectLiteralExpression);
    expect(importExportCallArgumentKeys).toEqual(expect.arrayContaining([
      'state',
      'importSource',
      'teamCodeInput',
      'teamCodeQrInputRef',
    ]));

    const importSourceDeclaration = toolbarScriptAst.variableDeclarations.find((declaration) => {
      return ts.isIdentifier(declaration.name) && declaration.name.text === 'importSource';
    });
    expect(importSourceDeclaration).toBeTruthy();
    expect(importSourceDeclaration!.initializer && ts.isCallExpression(importSourceDeclaration!.initializer)).toBe(true);
    const importSourceInitializer = importSourceDeclaration!.initializer as ts.CallExpression;
    expect(getCallExpressionText(importSourceInitializer, toolbarScriptAst.sourceFile)).toBe('ref');
    expect(importSourceInitializer.arguments[0]?.getText(toolbarScriptAst.sourceFile)).toBe("'json'");
    expect(importSourceInitializer.typeArguments).toBeTruthy();
    expect(importSourceInitializer.typeArguments?.length).toBe(1);
    const importSourceTypeArgument = importSourceInitializer.typeArguments?.[0]?.getText(toolbarScriptAst.sourceFile).replace(/\s+/g, ' ');
    expect(importSourceTypeArgument).toBe("'json' | 'teamCode'");

    const toolbarImportModules = toolbarScriptAst.importDeclarations.map(getImportModuleSpecifier);
    expect(toolbarImportModules.some((specifier) => /teamCodeService/.test(specifier))).toBe(false);

    const toolbarImportedIdentifiers = toolbarScriptAst.importDeclarations.flatMap(getNamedImportIdentifiers);
    const forbiddenImportExportIdentifiers = [
      'convertTeamCodeToRootDocument',
      'decodeTeamCodeFromQrImage',
      'withDynamicGroupsHiddenForSnapshot',
      'addWatermarkToImage',
    ];
    forbiddenImportExportIdentifiers.forEach((identifier) => {
      expect(toolbarImportedIdentifiers).not.toContain(identifier);
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
