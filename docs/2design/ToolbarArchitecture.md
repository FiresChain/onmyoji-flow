# Toolbar Architecture (Phase 2)

## 目标

在不改变行为语义的前提下，将 `Toolbar.vue` 按“命令编排层 / 数据管理层 / 视图层”拆分，降低单文件复杂度并保持 `YysEditorEmbed` 与 `FlowEditor` 兼容。

## 边界约束

- 不改 UI 表现。
- 不改业务语义。
- 不新增对外 API。
- 拆分后 `Toolbar.vue` 仅做模板绑定和编排接线。

## Phase 2 原子拆分计划

1. 导入/导出/预览命令编排：`useToolbarImportExportCommands`
2. 素材管理编排：`useToolbarAssetManagement`
3. 规则管理编排：`useToolbarRuleManagement`

## Task 1 落地（导入/导出/预览）

新增：`src/components/composables/useToolbarImportExportCommands.ts`

当前由该 composable 承接的命令：

- `handleExport`
- `handlePreviewData`
- `copyDataToClipboard`
- `openImportDialog`
- `triggerJsonFileImport`
- `triggerTeamCodeQrImport`
- `handleTeamCodeImport`
- `handleTeamCodeQrImport`
- `prepareCapture`
- `downloadImage`
- `handleClose`

`Toolbar.vue` 仍保留：

- 视图模板与按钮绑定。
- `state` / `watermark` 等现有响应式数据定义。
- 与本任务无关的素材管理、规则管理、工作区控制逻辑。